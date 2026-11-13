#!/usr/bin/env node
// Compare MongoDB with the migrated SQLite file. Exits non-zero on any
// mismatch. See docs/SQLITE_MIGRATION.md §5.
//
//   npm run db:verify -- [--db ./data/recipes.db] [--report data/migration-report-….json]
//
// Without --report, the newest data/migration-report-*.json (not dry-run) is
// used to account for records the migration deliberately skipped.
import fs from 'node:fs';
import path from 'node:path';
import { parseArgs } from 'node:util';
import { MongoClient } from 'mongodb';
import Database from 'better-sqlite3';
import sharp from 'sharp';
import { MAX_IMAGE_WIDTH, MAX_IMAGE_HEIGHT } from '../utils/imageProcessing.mjs';

const { values: args } = parseArgs({
  options: {
    db: { type: 'string', default: process.env.SQLITE_PATH || './data/recipes.db' },
    report: { type: 'string' },
  },
});

const DB_PATH = path.resolve(args.db);
const errors = [];
const fail = (msg) => {
  errors.push(msg);
  console.error(`  FAIL ${msg}`);
};
const hex = (oid) => (oid == null ? null : oid.toHexString ? oid.toHexString() : String(oid));
const num = (v) => {
  const n = Number(v);
  return v == null || v === '' || !Number.isFinite(n) ? 0 : n;
};
const text = (v) => (v == null || v === '' ? null : String(v));

function loadReport() {
  let file = args.report;
  if (!file) {
    const dir = path.dirname(DB_PATH);
    const candidates = fs
      .readdirSync(dir)
      .filter((f) => /^migration-report-.*\.json$/.test(f) && !f.includes('dry-run'))
      .sort();
    if (!candidates.length) return { skipped: [] };
    file = path.join(dir, candidates.at(-1));
  }
  console.log(`Using report ${file}`);
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

async function main() {
  if (!fs.existsSync(DB_PATH)) throw new Error(`${DB_PATH} not found`);
  const report = loadReport();
  const skippedKeys = new Set(report.skipped.map((s) => `${s.entity}:${s.id}`));
  const skippedCount = (entity) => report.skipped.filter((s) => s.entity === entity).length;

  const client = new MongoClient(process.env.MONGODB_URI);
  await client.connect();
  let users, recipes, messages;
  try {
    const mdb = client.db();
    [users, recipes, messages] = await Promise.all([
      mdb.collection('users').find({}).toArray(),
      mdb.collection('recipes').find({}).toArray(),
      mdb.collection('messages').find({}).toArray(),
    ]);
  } finally {
    await client.close();
  }

  const db = new Database(DB_PATH, { readonly: true, fileMustExist: true });
  const count = (table) => db.prepare(`SELECT COUNT(*) FROM ${table}`).pluck().get();

  console.log('Row counts…');
  for (const [table, mongoCount, entity] of [
    ['users', users.length, 'user'],
    ['recipes', recipes.length, 'recipe'],
    ['messages', messages.length, 'message'],
  ]) {
    const expected = mongoCount - skippedCount(entity);
    const actual = count(table);
    if (actual !== expected) fail(`${table}: expected ${expected}, found ${actual}`);
    else console.log(`  ok ${table}: ${actual}`);
  }

  console.log('Users…');
  const getUser = db.prepare('SELECT * FROM users WHERE id = ?');
  for (const u of users) {
    const id = hex(u._id);
    if (skippedKeys.has(`user:${id}`)) continue;
    const row = getUser.get(id);
    if (!row) { fail(`user ${id} missing`); continue; }
    if (row.email !== u.email) fail(`user ${id} email differs`);
  }

  console.log('Recipes and images…');
  const getRecipe = db.prepare('SELECT * FROM recipes WHERE id = ?');
  const getImages = db.prepare(
    'SELECT * FROM recipe_images WHERE recipe_id = ? ORDER BY position'
  );
  const skippedImages = new Set(
    report.skipped.filter((s) => s.entity === 'image').map((s) => s.id)
  );
  let blobsChecked = 0;
  for (const r of recipes) {
    const id = hex(r._id);
    if (skippedKeys.has(`recipe:${id}`)) continue;
    const row = getRecipe.get(id);
    if (!row) { fail(`recipe ${id} missing`); continue; }

    const n = r.nutritionInfo || {};
    const expected = {
      owner_id: hex(r.owner),
      name: String(r.name),
      type: String(r.type),
      description: text(r.description),
      url: text(r.url),
      star_rating: String(r.starRating ?? '1'),
      category: String(r.category),
      is_featured: r.isFeatured ? 1 : 0,
      prep_time: num(r.prepTime),
      cook_time: num(r.cookTime),
      total_time: num(r.totalTime),
      servings: num(r.servings),
      calories: num(n.calories),
      fat: num(n.fat),
      carbs: num(n.carbs),
      protein: num(n.protein),
      sugars: num(n.sugars),
      ingredients: JSON.stringify((r.ingredients || []).map(String)),
      directions: text(r.directions),
    };
    for (const [col, value] of Object.entries(expected)) {
      if (row[col] !== value) {
        fail(`recipe ${id} ${col}: mongo=${JSON.stringify(value)} sqlite=${JSON.stringify(row[col])}`);
      }
    }
    if (r.createdAt && row.created_at !== new Date(r.createdAt).toISOString()) {
      fail(`recipe ${id} created_at differs`);
    }

    // images: same order, minus skipped ones
    const mongoImages = (r.images || [])
      .map(String)
      .filter((_, i) => !skippedImages.has(`${id}[${i}]`));
    const imgRows = getImages.all(id);
    if (imgRows.length !== mongoImages.length) {
      fail(`recipe ${id} image count: mongo=${mongoImages.length} sqlite=${imgRows.length}`);
      continue;
    }
    for (let i = 0; i < imgRows.length; i++) {
      const img = imgRows[i];
      const source = mongoImages[i];
      if (img.position !== i) fail(`recipe ${id} image ${i} position ${img.position}`);
      if (source.includes('http')) {
        if (img.original_url !== source) fail(`recipe ${id} image ${i} url/order differs`);
        if (!img.data) { fail(`recipe ${id} image ${i} has no data`); continue; }
        try {
          const meta = await sharp(img.data).metadata();
          if (meta.width > MAX_IMAGE_WIDTH || meta.height > MAX_IMAGE_HEIGHT) {
            fail(`image ${img.id} is ${meta.width}x${meta.height}, over the limit`);
          }
          if (meta.width !== img.width || meta.height !== img.height) {
            fail(`image ${img.id} stored dimensions don't match its data`);
          }
          if (img.byte_size !== img.data.length) fail(`image ${img.id} byte_size mismatch`);
          blobsChecked++;
        } catch (error) {
          fail(`image ${img.id} does not decode: ${error.message}`);
        }
      } else if (img.seed_file !== source) {
        fail(`recipe ${id} image ${i}: expected seed ${source}, found ${img.seed_file}`);
      }
    }
  }
  console.log(`  ${blobsChecked} stored images decoded and within ${MAX_IMAGE_WIDTH}x${MAX_IMAGE_HEIGHT}`);

  console.log('Bookmarks…');
  const hasBookmark = db.prepare('SELECT 1 FROM bookmarks WHERE user_id = ? AND recipe_id = ?');
  let bookmarkCount = 0;
  for (const u of users) {
    const userId = hex(u._id);
    for (const b of new Set((u.bookmarks || []).map(hex))) {
      if (skippedKeys.has(`bookmark:${userId}->${b}`) || skippedKeys.has(`user:${userId}`)) continue;
      bookmarkCount++;
      if (!hasBookmark.get(userId, b)) fail(`bookmark ${userId}->${b} missing`);
    }
  }
  if (count('bookmarks') !== bookmarkCount) {
    fail(`bookmarks: expected ${bookmarkCount}, found ${count('bookmarks')}`);
  } else {
    console.log(`  ok bookmarks: ${bookmarkCount}`);
  }

  console.log('Messages…');
  const getMessage = db.prepare('SELECT * FROM messages WHERE id = ?');
  for (const m of messages) {
    const id = hex(m._id);
    if (skippedKeys.has(`message:${id}`)) continue;
    const row = getMessage.get(id);
    if (!row) { fail(`message ${id} missing`); continue; }
    if (
      row.sender_id !== hex(m.sender) ||
      row.recipient_id !== hex(m.recipient) ||
      row.recipe_id !== hex(m.property) ||
      row.read !== (m.read ? 1 : 0) ||
      row.body !== text(m.body)
    ) {
      fail(`message ${id} fields differ`);
    }
  }

  console.log('Integrity…');
  const integrity = db.pragma('integrity_check', { simple: true });
  if (integrity !== 'ok') fail(`integrity_check: ${integrity}`);
  const fk = db.pragma('foreign_key_check');
  if (fk.length) fail(`foreign_key_check: ${JSON.stringify(fk)}`);
  db.close();

  if (errors.length) {
    console.error(`\nVerification FAILED with ${errors.length} problem(s).`);
    process.exit(1);
  }
  console.log(`\nVerification passed (${report.skipped.length} records skipped by the migration, as reported).`);
}

main().catch((error) => {
  console.error('Verification error:', error.message);
  process.exit(1);
});
