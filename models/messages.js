// Message data access (SQLite).
import { getDb } from '../config/database.js';
import { newId } from '../utils/ids.js';

// The inbox: unread first, each group newest first, with the sender's
// username and the recipe name "populated" as before. The `property` key is
// kept for components/Message.jsx (it was the Mongo field name).
export function listForRecipient(userId) {
  const rows = getDb()
    .prepare(
      `SELECT m.*, u.username AS sender_username, r.name AS recipe_name
       FROM messages m
       JOIN users u   ON u.id = m.sender_id
       JOIN recipes r ON r.id = m.recipe_id
       WHERE m.recipient_id = ?
       ORDER BY m.read ASC, m.created_at DESC`
    )
    .all(userId);

  return rows.map((m) => ({
    _id: m.id,
    sender: { _id: m.sender_id, username: m.sender_username },
    recipient: m.recipient_id,
    property: { _id: m.recipe_id, name: m.recipe_name },
    name: m.name,
    email: m.email,
    phone: m.phone ?? '',
    body: m.body ?? '',
    read: m.read === 1,
    createdAt: m.created_at,
    updatedAt: m.updated_at,
  }));
}

export function create({ senderId, recipientId, recipeId, name, email, phone, body }) {
  const id = newId();
  const now = new Date().toISOString();
  getDb()
    .prepare(
      `INSERT INTO messages
         (id, sender_id, recipient_id, recipe_id, name, email, phone, body, read, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?)`
    )
    .run(id, senderId, recipientId, recipeId, name, email, phone || null, body || null, now, now);
  return id;
}

// Raw row (with recipient_id) for ownership checks, or null.
export function findById(id) {
  return getDb().prepare('SELECT * FROM messages WHERE id = ?').get(id) ?? null;
}

// Flip read/unread. Returns the new state.
export function toggleRead(id) {
  const row = getDb()
    .prepare(
      `UPDATE messages SET read = 1 - read, updated_at = ?
       WHERE id = ? RETURNING read`
    )
    .get(new Date().toISOString(), id);
  return row ? row.read === 1 : null;
}

export function remove(id) {
  return getDb().prepare('DELETE FROM messages WHERE id = ?').run(id).changes > 0;
}

export function unreadCount(userId) {
  return getDb()
    .prepare('SELECT COUNT(*) FROM messages WHERE recipient_id = ? AND read = 0')
    .pluck()
    .get(userId);
}
