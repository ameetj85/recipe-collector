// SQLite schema, version 1 (see docs/SQLITE_MIGRATION.md §2).
//
// Kept as a JS module rather than a .sql file so the app (bundled by Next,
// traced into the standalone output) and the plain-Node scripts in scripts/
// can both import it without any file-tracing configuration.

export const SCHEMA_VERSION = 1;

export const SCHEMA_SQL = `
-- ============ users ============
CREATE TABLE users (
  id          TEXT PRIMARY KEY,                 -- = Mongo User._id for migrated rows
  email       TEXT NOT NULL UNIQUE,
  username    TEXT NOT NULL,                    -- truncated to 20 chars at sign-in
  image       TEXT,                             -- Google avatar URL
  created_at  TEXT NOT NULL,
  updated_at  TEXT NOT NULL
);

-- ============ recipes ============
CREATE TABLE recipes (
  id           TEXT PRIMARY KEY,                -- = Mongo Recipe._id
  owner_id     TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name         TEXT NOT NULL,
  type         TEXT NOT NULL,                   -- main ingredient
  description  TEXT,
  url          TEXT,
  star_rating  TEXT NOT NULL DEFAULT '1',       -- kept as a string, as in Mongo
  category     TEXT NOT NULL,                   -- cuisine; used by the search filter
  is_featured  INTEGER NOT NULL DEFAULT 0 CHECK (is_featured IN (0,1)),
  prep_time    REAL NOT NULL DEFAULT 0,
  cook_time    REAL NOT NULL DEFAULT 0,
  total_time   REAL NOT NULL DEFAULT 0,
  servings     REAL NOT NULL DEFAULT 0,
  calories     REAL NOT NULL DEFAULT 0,         -- nutritionInfo.* flattened
  fat          REAL NOT NULL DEFAULT 0,
  carbs        REAL NOT NULL DEFAULT 0,
  protein      REAL NOT NULL DEFAULT 0,
  sugars       REAL NOT NULL DEFAULT 0,
  ingredients  TEXT NOT NULL DEFAULT '[]' CHECK (json_valid(ingredients)),
  directions   TEXT,
  created_at   TEXT NOT NULL,
  updated_at   TEXT NOT NULL
);
CREATE INDEX idx_recipes_owner   ON recipes(owner_id);
CREATE INDEX idx_recipes_created ON recipes(created_at);

-- ============ recipe_images ============
-- One row per image slot (max 2 per recipe): either a stored BLOB or a
-- reference to a seed file in public/images/recipes/. Kept out of recipes so
-- list queries never load blobs.
CREATE TABLE recipe_images (
  id            TEXT PRIMARY KEY,
  recipe_id     TEXT NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  position      INTEGER NOT NULL,
  mime_type     TEXT,
  data          BLOB,
  byte_size     INTEGER,
  width         INTEGER,
  height        INTEGER,
  seed_file     TEXT,
  original_url  TEXT,                           -- Cloudinary URL for migrated rows
  created_at    TEXT NOT NULL,
  UNIQUE (recipe_id, position),
  CHECK (
    (data IS NOT NULL AND mime_type IS NOT NULL AND seed_file IS NULL) OR
    (data IS NULL AND seed_file IS NOT NULL)
  )
);

-- ============ bookmarks (was User.bookmarks[]) ============
CREATE TABLE bookmarks (
  user_id     TEXT NOT NULL REFERENCES users(id)   ON DELETE CASCADE,
  recipe_id   TEXT NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  created_at  TEXT NOT NULL,
  PRIMARY KEY (user_id, recipe_id)
) WITHOUT ROWID;
CREATE INDEX idx_bookmarks_recipe ON bookmarks(recipe_id);

-- ============ messages ============
CREATE TABLE messages (
  id            TEXT PRIMARY KEY,               -- = Mongo Message._id
  sender_id     TEXT NOT NULL REFERENCES users(id)   ON DELETE CASCADE,
  recipient_id  TEXT NOT NULL REFERENCES users(id)   ON DELETE CASCADE,
  recipe_id     TEXT NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,  -- was Message.property
  name          TEXT NOT NULL,
  email         TEXT NOT NULL,
  phone         TEXT,
  body          TEXT,
  read          INTEGER NOT NULL DEFAULT 0 CHECK (read IN (0,1)),
  created_at    TEXT NOT NULL,
  updated_at    TEXT NOT NULL
);
CREATE INDEX idx_messages_recipient ON messages(recipient_id, read, created_at DESC);

PRAGMA user_version = ${SCHEMA_VERSION};
`;

// Pragmas set on every connection.
export const applyPragmas = (db) => {
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');
  db.pragma('busy_timeout = 5000');
  db.pragma('synchronous = NORMAL');
};

// Create the schema on an empty database (user_version 0). Refuses to touch a
// database written by a newer schema version.
export const ensureSchema = (db) => {
  const version = db.pragma('user_version', { simple: true });
  if (version === 0) {
    db.exec(SCHEMA_SQL);
  } else if (version > SCHEMA_VERSION) {
    throw new Error(
      `Database schema version ${version} is newer than this app (${SCHEMA_VERSION}).`
    );
  }
};
