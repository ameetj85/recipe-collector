// SQLite connection. getDb() opens the database lazily on first use (never at
// module load, so `next build` doesn't touch it) and caches the handle on
// globalThis so it survives dev-server hot reloads.
import fs from 'node:fs';
import path from 'node:path';
import Database from 'better-sqlite3';
import { applyPragmas, ensureSchema } from '../db/schema.mjs';

// turbopackIgnore: the path is only known at runtime; without the hint the
// build's file tracing walks the whole project (including data/).
export const getDbPath = () =>
  path.resolve(
    /* turbopackIgnore: true */ process.env.SQLITE_PATH || './data/recipes.db'
  );

export function getDb() {
  if (!globalThis.__recipeDb) {
    const dbPath = getDbPath();
    fs.mkdirSync(path.dirname(dbPath), { recursive: true });

    const db = new Database(dbPath);
    applyPragmas(db);
    ensureSchema(db);

    globalThis.__recipeDb = db;
  }
  return globalThis.__recipeDb;
}
