// User and bookmark data access (SQLite).
import { getDb } from '../config/database.js';
import { newId } from '../utils/ids.js';
import { findByIds } from './recipes.js';

export function findByEmail(email) {
  return getDb().prepare('SELECT * FROM users WHERE email = ?').get(email) ?? null;
}

export function findById(id) {
  return getDb().prepare('SELECT * FROM users WHERE id = ?').get(id) ?? null;
}

// Create the user on first sign-in; does nothing if the email already exists.
export function createIfMissing({ email, username, image }) {
  const now = new Date().toISOString();
  getDb()
    .prepare(
      `INSERT INTO users (id, email, username, image, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?)
       ON CONFLICT(email) DO NOTHING`
    )
    .run(newId(), email, username, image ?? null, now, now);
}

export function isBookmarked(userId, recipeId) {
  return Boolean(
    getDb()
      .prepare('SELECT 1 FROM bookmarks WHERE user_id = ? AND recipe_id = ?')
      .get(userId, recipeId)
  );
}

// Add or remove a bookmark. Returns the new state (true = bookmarked).
export function toggleBookmark(userId, recipeId) {
  const db = getDb();
  return db.transaction(() => {
    const removed = db
      .prepare('DELETE FROM bookmarks WHERE user_id = ? AND recipe_id = ?')
      .run(userId, recipeId).changes;
    if (removed) return false;

    db.prepare(
      'INSERT INTO bookmarks (user_id, recipe_id, created_at) VALUES (?, ?, ?)'
    ).run(userId, recipeId, new Date().toISOString());
    return true;
  })();
}

export function listBookmarkedRecipes(userId) {
  const ids = getDb()
    .prepare('SELECT recipe_id FROM bookmarks WHERE user_id = ?')
    .pluck()
    .all(userId);
  return findByIds(ids);
}
