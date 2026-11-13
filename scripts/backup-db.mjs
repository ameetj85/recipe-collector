#!/usr/bin/env node
// Online backup of the SQLite database (safe while the app is running in WAL
// mode), with retention.
//
//   npm run db:backup -- [--db ./data/recipes.db] [--dir ./data/backups] [--keep 14]
//
// On the server (see DEPLOY.md): npm run db:backup -- --dir /var/backups/recipe-collector
import fs from 'node:fs';
import path from 'node:path';
import { parseArgs } from 'node:util';
import Database from 'better-sqlite3';

const { values: args } = parseArgs({
  options: {
    db: { type: 'string', default: process.env.SQLITE_PATH || './data/recipes.db' },
    dir: { type: 'string' },
    keep: { type: 'string', default: '14' },
  },
});

const dbPath = path.resolve(args.db);
const dir = path.resolve(args.dir || path.join(path.dirname(dbPath), 'backups'));
const keep = Math.max(1, Number(args.keep) || 14);

if (!fs.existsSync(dbPath)) {
  console.error(`${dbPath} not found`);
  process.exit(1);
}
fs.mkdirSync(dir, { recursive: true });

const stamp = new Date().toISOString().replace(/[:.]/g, '-');
const target = path.join(dir, `recipes-${stamp}.db`);

const db = new Database(dbPath, { readonly: true, fileMustExist: true });
try {
  await db.backup(target);
} finally {
  db.close();
}

// Make the copy a single self-contained file (no -wal/-shm side files) and
// check that it opens and is intact.
const copy = new Database(target);
copy.pragma('journal_mode = DELETE');
const integrity = copy.pragma('integrity_check', { simple: true });
copy.close();
if (integrity !== 'ok') {
  console.error(`Backup ${target} failed integrity_check: ${integrity}`);
  process.exit(1);
}

const old = fs
  .readdirSync(dir)
  .filter((f) => /^recipes-.*\.db$/.test(f))
  .sort()
  .slice(0, -keep);
for (const f of old) fs.rmSync(path.join(dir, f));

console.log(`Backup written: ${target} (${old.length} old backup(s) removed, keeping ${keep})`);
