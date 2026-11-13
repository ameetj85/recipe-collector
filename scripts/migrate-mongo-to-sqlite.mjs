#!/usr/bin/env node
// One-off migration: MongoDB (+ Cloudinary images) -> a single SQLite file.
// See docs/SQLITE_MIGRATION.md §4.
//
//   npm run db:migrate -- [--out ./data/recipes.db] [--force] [--dry-run] [--skip-broken-images]
//
// Read-only on Mongo and Cloudinary. Writes <out>.tmp and renames it at the
// end, so a failed run never leaves a half-written database.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { parseArgs } from 'node:util';
import { MongoClient } from 'mongodb';
import Database from 'better-sqlite3';
import { applyPragmas, ensureSchema } from '../db/schema.mjs';
import { processImage } from '../utils/imageProcessing.mjs';

const { values: args } = parseArgs({
  options: {
    out: { type: 'string', default: process.env.SQLITE_PATH || './data/recipes.db' },
    force: { type: 'boolean', default: false },
    'dry-run': { type: 'boolean', default: false },
    'skip-broken-images': { type: 'boolean', default: false },
  },
});

const OUT = path.resolve(args.out);
const DRY_RUN = args['dry-run'];
const SEED_DIR = path.resolve('public/images/recipes');
const FETCH_TIMEOUT_MS = 30_000;
const FETCH_RETRIES = 3;
const FETCH_CONCURRENCY = 4;

const newId = () => crypto.randomBytes(12).toString('hex');
const hex = (oid) => (oid == null ? null : oid.toHexString ? oid.toHexString() : String(oid));
const iso = (d) => (d instanceof Date ? d.toISOString() : d ? new Date(d).toISOString() : null);
const tsFromId = (oid) => (oid?.getTimestamp ? oid.getTimestamp().toISOString() : new Date().toISOString());
const num = (v) => {
  const n = Number(v);
  return v == null || v === '' || !Number.isFinite(n) ? 0 : n;
};
const text = (v) => (v == null || v === '' ? null : String(v));

const report = {
  startedAt: new Date().toISOString(),
  out: OUT,
  dryRun: DRY_RUN,
  counts: {},
  skipped: [],
  warnings: [],
  images: { fetched: 0, seed: 0, failed: 0, bytesBefore: 0, bytesAfter: 0 },
  imageMap: {},
};
const skip = (entity, id, reason) => {
  report.skipped.push({ entity, id, reason });
  console.warn(`  skip ${entity} ${id}: ${reason}`);
};
const warn = (msg) => {
  report.warnings.push(msg);
  console.warn(`  warn: ${msg}`);
};

async function fetchWithRetry(url) {
  let lastError;
  for (let attempt = 1; attempt <= FETCH_RETRIES; attempt++) {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return Buffer.from(await res.arrayBuffer());
    } catch (error) {
      lastError = error;
      if (attempt < FETCH_RETRIES) {
        await new Promise((r) => setTimeout(r, 500 * 2 ** attempt));
      }
    }
  }
  throw lastError;
}

// Run `fn` over `items` with at most `limit` in flight.
async function mapLimit(items, limit, fn) {
  const results = new Array(items.length);
  let next = 0;
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (next < items.length) {
      const i = next++;
      results[i] = await fn(items[i], i);
    }
  });
  await Promise.all(workers);
  return results;
}

async function main() {
  if (!process.env.MONGODB_URI) {
    throw new Error('MONGODB_URI is not set (put it in .env).');
  }
  if (!DRY_RUN && fs.existsSync(OUT) && !args.force) {
    throw new Error(`${OUT} already exists. Re-run with --force to replace it.`);
  }

  // ---------- Phase A: extract (read-only) ----------
  console.log('Phase A: reading MongoDB…');
  const client = new MongoClient(process.env.MONGODB_URI);
  await client.connect();
  let users, recipes, messages;
  try {
    const db = client.db();
    [users, recipes, messages] = await Promise.all([
      db.collection('users').find({}).toArray(),
      db.collection('recipes').find({}).toArray(),
      db.collection('messages').find({}).toArray(),
    ]);
  } finally {
    await client.close();
  }
  report.counts.read = {
    users: users.length,
    recipes: recipes.length,
    messages: messages.length,
    bookmarks: users.reduce((n, u) => n + (u.bookmarks?.length || 0), 0),
  };
  console.log('  read', report.counts.read);

  // ---------- Phase B: fetch + process images (before any DB write) ----------
  console.log('Phase B: fetching and resizing images…');
  const jobs = [];
  for (const recipe of recipes) {
    (recipe.images || []).forEach((value, index) => {
      jobs.push({ recipeId: hex(recipe._id), index, value: String(value) });
    });
  }

  const processed = await mapLimit(jobs, FETCH_CONCURRENCY, async (job) => {
    if (!job.value.includes('http')) {
      report.images.seed++;
      if (!fs.existsSync(path.join(SEED_DIR, job.value))) {
        warn(`seed image missing on disk: public/images/recipes/${job.value} (recipe ${job.recipeId})`);
      }
      return { ...job, seed_file: job.value };
    }
    try {
      const original = await fetchWithRetry(job.value);
      const img = await processImage(original);
      report.images.fetched++;
      report.images.bytesBefore += original.length;
      report.images.bytesAfter += img.byteSize;
      console.log(
        `  ${job.recipeId}[${job.index}] ${(original.length / 1024).toFixed(0)} KB -> ` +
          `${(img.byteSize / 1024).toFixed(0)} KB (${img.width}x${img.height} ${img.mimeType})`
      );
      return { ...job, ...img };
    } catch (error) {
      report.images.failed++;
      const reason = `image fetch/process failed for ${job.value}: ${error.message}`;
      if (!args['skip-broken-images']) {
        throw new Error(`${reason} (re-run with --skip-broken-images to skip it)`);
      }
      skip('image', `${job.recipeId}[${job.index}]`, reason);
      return null;
    }
  });

  const imagesByRecipe = new Map();
  for (const img of processed.filter(Boolean)) {
    if (!imagesByRecipe.has(img.recipeId)) imagesByRecipe.set(img.recipeId, []);
    imagesByRecipe.get(img.recipeId).push(img);
  }

  // ---------- Phase C: load (one synchronous transaction) ----------
  console.log('Phase C: writing SQLite…');
  const tmpPath = `${OUT}.tmp`;
  if (!DRY_RUN) {
    fs.mkdirSync(path.dirname(OUT), { recursive: true });
    for (const suffix of ['', '-wal', '-shm']) fs.rmSync(tmpPath + suffix, { force: true });
  }
  const sqlite = new Database(DRY_RUN ? ':memory:' : tmpPath);
  applyPragmas(sqlite);
  ensureSchema(sqlite);

  const written = { users: 0, recipes: 0, recipe_images: 0, bookmarks: 0, messages: 0 };
  const now = new Date().toISOString();

  sqlite.transaction(() => {
    // users
    const insertUser = sqlite.prepare(
      `INSERT INTO users (id, email, username, image, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?)`
    );
    const userIds = new Set();
    const emails = new Set();
    for (const u of users) {
      const id = hex(u._id);
      if (!u.email) { skip('user', id, 'missing email'); continue; }
      if (emails.has(u.email)) { skip('user', id, `duplicate email ${u.email}`); continue; }
      const created = iso(u.createdAt) || tsFromId(u._id);
      insertUser.run(id, u.email, String(u.username || u.email).slice(0, 20), text(u.image), created, iso(u.updatedAt) || created);
      userIds.add(id);
      emails.add(u.email);
      written.users++;
    }

    // recipes
    const insertRecipe = sqlite.prepare(
      `INSERT INTO recipes
         (id, owner_id, name, type, description, url, star_rating, category, is_featured,
          prep_time, cook_time, total_time, servings, calories, fat, carbs, protein, sugars,
          ingredients, directions, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    );
    const recipeIds = new Set();
    for (const r of recipes) {
      const id = hex(r._id);
      const owner = hex(r.owner);
      if (!userIds.has(owner)) { skip('recipe', id, `owner ${owner} not found`); continue; }
      if (!r.name || !r.type || !r.category) { skip('recipe', id, 'missing name/type/category'); continue; }
      const n = r.nutritionInfo || {};
      const created = iso(r.createdAt) || tsFromId(r._id);
      insertRecipe.run(
        id, owner, String(r.name), String(r.type), text(r.description), text(r.url),
        String(r.starRating ?? '1'), String(r.category), r.isFeatured ? 1 : 0,
        num(r.prepTime), num(r.cookTime), num(r.totalTime), num(r.servings),
        num(n.calories), num(n.fat), num(n.carbs), num(n.protein), num(n.sugars),
        JSON.stringify((r.ingredients || []).map(String)), text(r.directions),
        created, iso(r.updatedAt) || created
      );
      recipeIds.add(id);
      written.recipes++;
    }

    // recipe_images (positions compacted to 0, 1… after any skipped images)
    const insertImage = sqlite.prepare(
      `INSERT INTO recipe_images
         (id, recipe_id, position, mime_type, data, byte_size, width, height, seed_file, original_url, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    );
    for (const [recipeId, imgs] of imagesByRecipe) {
      if (!recipeIds.has(recipeId)) continue;
      imgs.sort((a, b) => a.index - b.index).forEach((img, position) => {
        const imageId = newId();
        if (img.seed_file) {
          insertImage.run(imageId, recipeId, position, null, null, null, null, null, img.seed_file, null, now);
        } else {
          insertImage.run(imageId, recipeId, position, img.mimeType, img.data, img.byteSize, img.width, img.height, null, img.value, now);
          report.imageMap[img.value] = imageId;
        }
        written.recipe_images++;
      });
    }

    // bookmarks
    const insertBookmark = sqlite.prepare(
      'INSERT OR IGNORE INTO bookmarks (user_id, recipe_id, created_at) VALUES (?, ?, ?)'
    );
    for (const u of users) {
      const userId = hex(u._id);
      if (!userIds.has(userId)) continue;
      for (const b of new Set((u.bookmarks || []).map(hex))) {
        if (!recipeIds.has(b)) { skip('bookmark', `${userId}->${b}`, 'recipe not found'); continue; }
        written.bookmarks += insertBookmark.run(userId, b, now).changes;
      }
    }

    // messages
    const insertMessage = sqlite.prepare(
      `INSERT INTO messages
         (id, sender_id, recipient_id, recipe_id, name, email, phone, body, read, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    );
    for (const m of messages) {
      const id = hex(m._id);
      const sender = hex(m.sender);
      const recipient = hex(m.recipient);
      const recipe = hex(m.property);
      if (!userIds.has(sender)) { skip('message', id, `sender ${sender} not found`); continue; }
      if (!userIds.has(recipient)) { skip('message', id, `recipient ${recipient} not found`); continue; }
      if (!recipeIds.has(recipe)) { skip('message', id, `recipe ${recipe} not found`); continue; }
      const created = iso(m.createdAt) || tsFromId(m._id);
      insertMessage.run(
        id, sender, recipient, recipe, String(m.name ?? ''), String(m.email ?? ''),
        text(m.phone), text(m.body), m.read ? 1 : 0, created, iso(m.updatedAt) || created
      );
      written.messages++;
    }

    const fkProblems = sqlite.pragma('foreign_key_check');
    if (fkProblems.length) throw new Error(`foreign_key_check failed: ${JSON.stringify(fkProblems)}`);
    const integrity = sqlite.pragma('integrity_check', { simple: true });
    if (integrity !== 'ok') throw new Error(`integrity_check failed: ${integrity}`);
  })();

  report.counts.written = written;
  console.log('  written', written);

  // ---------- Phase D: finalize ----------
  if (!DRY_RUN) {
    sqlite.pragma('wal_checkpoint(TRUNCATE)');
    sqlite.exec('VACUUM');
    sqlite.pragma('journal_mode = DELETE'); // single self-contained file; the app re-enables WAL
  }
  sqlite.close();

  if (!DRY_RUN) {
    for (const suffix of ['', '-wal', '-shm']) fs.rmSync(OUT + suffix, { force: true });
    fs.renameSync(tmpPath, OUT);
  }

  report.finishedAt = new Date().toISOString();
  const reportDir = path.dirname(OUT);
  fs.mkdirSync(reportDir, { recursive: true });
  const reportPath = path.join(
    reportDir,
    `migration-report-${report.startedAt.replace(/[:.]/g, '-')}${DRY_RUN ? '-dry-run' : ''}.json`
  );
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

  const mb = (b) => (b / 1024 / 1024).toFixed(2);
  console.log(
    `Images: ${report.images.fetched} fetched (${mb(report.images.bytesBefore)} MB -> ` +
      `${mb(report.images.bytesAfter)} MB), ${report.images.seed} seed, ${report.images.failed} failed`
  );
  console.log(`Skipped: ${report.skipped.length}, warnings: ${report.warnings.length}`);
  console.log(DRY_RUN ? 'Dry run complete (nothing written).' : `Done: ${OUT}`);
  console.log(`Report: ${reportPath}`);
}

main().catch((error) => {
  console.error('Migration failed:', error.message);
  process.exit(1);
});
