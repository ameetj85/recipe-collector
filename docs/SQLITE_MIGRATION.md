# MongoDB + Cloudinary → SQLite Migration Plan

> **Status: build and rehearsal done (§6 steps 1–6) on branch `sqlite-migration`; production cutover (steps 7–10) not started.** Run this plan on a new branch (`sqlite-migration`) and follow §6 in order. Check off the steps in this file as they're completed. The current architecture is described in `ARCHITECTURE-SQLITE.md`.
>
> **Deviations from the plan as written** (the plan predates the Server Actions refactor and the Next 16 upgrade):
> - §3.3: there are no `app/api/recipes|bookmarks|messages` routes any more. The same changes went into `utils/queries.js` (reads) and `app/actions/*` (writes). The only new route is `app/api/images/[id]`.
> - §2/§3.2: the schema lives in `db/schema.mjs` (a JS string) instead of `db/schema.sql`, so Next's build and the plain-Node scripts can both import it without `fs` path tricks.
> - §3.2 image policy: the cap is **2400 px wide × 3200 px tall** (not 1600 px), WebP q82. The full-bleed header is 100vw wide, and 1600 px looked soft on 1920 px and retina screens. Images already within limits, without EXIF, and smaller than their WebP version are kept byte-for-byte. Components now pass accurate `sizes` to `next/image` (the header switched from `<img>` to `next/image`), and 2400 was added to `images.deviceSizes`.
> - §3.5: Next 16 uses `serverExternalPackages` (not `experimental.serverComponentsExternalPackages`). better-sqlite3 13 ships prebuilt binaries (including `linuxmusl-x64`), so the Dockerfile needs no python/make/g++. It requires Node ≥ 22.
> - §3.5 Vercel: not applicable, because the app is no longer deployed there.
> - **Docker removed entirely** (decided after the build phase). The project uses no Docker for any purpose: the Dockerfiles, `docker-compose.yml`, `.dockerignore` and `ReadMe.Docker.txt` were deleted, and `output: "standalone"` was dropped. Production runs as plain Node under systemd on the VPS (see `DEPLOY.md`). The Docker items in §3.5–§3.6 below are superseded, and the cutover steps (§6 steps 7–10), rollback and checklist were rewritten for the plain-Node deployment.
> - §4 Phase D: the migrated file is left in `journal_mode=DELETE` (one self-contained file). The app switches it to WAL when it opens it.

## 1. Context

The app keeps its data in MongoDB (via Mongoose) and recipe images in Cloudinary. The goal is to move to **one self-contained SQLite database file** that holds all relational data and all recipe images (as BLOBs), and to remove both external services.

**Decisions already made:**

| Decision | Choice |
|---|---|
| Hosting | **VPS only, plain Node under systemd (no Docker).** Vercel is retired, because a SQLite file can't be written to or kept on Vercel's filesystem. |
| Driver | `better-sqlite3`: synchronous, fast, and widely used with Next.js on Node. |
| Images | Stored as BLOBs in SQLite and **resized with `sharp`** (already a dependency) to at most 1600px on the longest side, as WebP at quality 80. This applies to new uploads and to migrated Cloudinary images. |
| Seed images | Stay as files in `public/images/recipes/`. The DB stores only a reference to the file name. |
| IDs | Existing Mongo ObjectId hex strings are kept as TEXT primary keys, so `/recipes/<id>` URLs and shared links keep working. New IDs use the same 24-hex format. |
| API contract | **The JSON shapes don't change** (`_id`, `owner`, nested `nutritionInfo`, `images[]`, populated `sender`/`property` on messages, `createdAt`). The changes stay on the server side, plus one small image-src helper in the components. |

**Results:** no Mongo, Cloudinary or Mongoose dependencies at runtime; one `recipes.db` file on the server's disk; existing links still work; and a migration that can be repeated, verified, and rolled back while the old systems are kept.

---

## 2. SQLite schema (`db/schema.sql`, schema version 1)

Connection pragmas are set by `config/database.js` every time a connection opens:
`journal_mode = WAL`, `foreign_keys = ON`, `busy_timeout = 5000`, `synchronous = NORMAL`.

Conventions:
- IDs are `TEXT`, 24 lowercase hex characters.
- Timestamps are `TEXT` in ISO-8601 UTC (`2024-03-01T12:34:56.789Z`), the same format `Date.toISOString()` produces.
- Booleans are `INTEGER` 0/1.
- Numbers are `REAL`, because Mongo `Number` can hold decimals.

```sql
-- ============ users ============
CREATE TABLE users (
  id          TEXT PRIMARY KEY,                 -- = Mongo User._id for migrated rows
  email       TEXT NOT NULL UNIQUE,
  username    TEXT NOT NULL,                    -- truncated to 20 chars at sign-in
  image       TEXT,                             -- Google avatar URL (lh3.googleusercontent.com)
  created_at  TEXT NOT NULL,
  updated_at  TEXT NOT NULL
);

-- ============ recipes ============
CREATE TABLE recipes (
  id           TEXT PRIMARY KEY,                -- = Mongo Recipe._id
  owner_id     TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name         TEXT NOT NULL,
  type         TEXT NOT NULL,                   -- main ingredient (select options in forms)
  description  TEXT,
  url          TEXT,
  star_rating  TEXT NOT NULL DEFAULT '1',       -- kept as String, as in Mongo
  category     TEXT NOT NULL,                   -- cuisine; used by search filter
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
  ingredients  TEXT NOT NULL DEFAULT '[]' CHECK (json_valid(ingredients)),  -- JSON array of strings, order preserved
  directions   TEXT,
  created_at   TEXT NOT NULL,
  updated_at   TEXT NOT NULL
);
CREATE INDEX idx_recipes_owner   ON recipes(owner_id);
CREATE INDEX idx_recipes_created ON recipes(created_at);

-- ============ recipe_images ============
-- One row per image slot (max 2 per recipe). Either a stored BLOB
-- (uploaded / migrated from Cloudinary) or a reference to a seed file in
-- public/images/recipes/. Kept out of `recipes` so list queries never load blobs.
CREATE TABLE recipe_images (
  id            TEXT PRIMARY KEY,
  recipe_id     TEXT NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  position      INTEGER NOT NULL,               -- 0-based, = index in old images[]
  mime_type     TEXT,                           -- 'image/webp' after processing
  data          BLOB,
  byte_size     INTEGER,
  width         INTEGER,
  height        INTEGER,
  seed_file     TEXT,                           -- e.g. 'a1.jpg' for seed images
  original_url  TEXT,                           -- Cloudinary secure_url (audit trail for migrated rows)
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

PRAGMA user_version = 1;
```

**Cascading deletes are now handled by the database.** Deleting a recipe removes its bookmarks, messages and images through `ON DELETE CASCADE`. This replaces the manual cleanup in `DELETE /api/recipes/:id` and the "keep cascades in sync" note in CLAUDE.md.

### 2.1 Field mapping (Mongo → SQLite → API JSON)

| Mongo | SQLite | API JSON (unchanged) |
|---|---|---|
| `Recipe._id` (ObjectId) | `recipes.id` (hex) | `_id` |
| `Recipe.owner` | `owner_id` | `owner` (string) |
| `starRating` | `star_rating` | `starRating` (string) |
| `isFeatured` | `is_featured` 0/1 | `isFeatured` (bool) |
| `prepTime`/`cookTime`/`totalTime`/`servings` | snake_case | camelCase numbers |
| `nutritionInfo.{calories,fat,carbs,protein,sugars}` | flat columns | `nutritionInfo: {…}` |
| `ingredients[]` | JSON text | `ingredients[]` |
| `images[]` | `recipe_images` rows ordered by `position` | `images[]`: `"/api/images/<id>"` for blobs, bare `"<seed_file>"` for seeds |
| `createdAt`/`updatedAt` | `created_at`/`updated_at` | `createdAt`/`updatedAt` |
| `User.bookmarks[]` | `bookmarks` rows | (not exposed directly) |
| `Message.sender`/`recipient` | `sender_id`/`recipient_id` | GET list: `sender: {_id, username}`, `recipient: "<id>"` |
| `Message.property` | `recipe_id` | GET list: `property: {_id, name}` (key name kept for `Message.jsx`) |
| `Message.read` | `read` 0/1 | `read` (bool) |

---

## 3. Application code changes

### 3.1 Dependencies (`package.json`)
- Add `better-sqlite3` (latest).
- Remove `mongoose` and `cloudinary`.
- Move `mongodb` to **devDependencies** (the migration script needs it). Remove it at decommission (§6, step 10).
- Add scripts: `"db:migrate": "node --env-file=.env scripts/migrate-mongo-to-sqlite.mjs"`, `"db:verify": "node --env-file=.env scripts/verify-migration.mjs"`, `"db:backup": "node --env-file=.env scripts/backup-db.mjs"`.
- Node ≥ 20 is required (`--env-file`, and `better-sqlite3` no longer supports Node 18).

### 3.2 Data layer (new or replaced files)

| File | Purpose |
|---|---|
| `db/schema.sql` | The DDL in §2. Read with `fs` by both the app and the scripts. |
| `config/database.js` | **Replaced.** Exports `getDb()`, which lazily opens `process.env.SQLITE_PATH` (default `./data/recipes.db`), creates the parent dir, sets the pragmas, applies `schema.sql` when `PRAGMA user_version = 0`, and caches the handle on `globalThis.__recipeDb` so it survives hot reload. It is called lazily inside handlers, never at module load, so `next build` doesn't open the DB. |
| `utils/ids.js` | `newId()` → `crypto.randomBytes(12).toString('hex')`, the same 24-hex format as existing IDs. |
| `utils/imageProcessing.mjs` | `processImage(buffer)` → `{ data, mimeType: 'image/webp', width, height, byteSize }` using `sharp(buf).rotate().resize({ width: 1600, height: 1600, fit: 'inside', withoutEnlargement: true }).webp({ quality: 80 })`. Plain ESM with no `@/` imports, so the migration script can import it too. Throws on non-image input, and the route then returns 400. |
| `utils/imageSrc.js` | `imageSrc(value)`: returns `value` if it starts with `http` or `/`, otherwise `/images/recipes/${value}`. It replaces the 5 inline `includes('http')` checks. |
| `utils/formValues.js` | `toBool(v)` (`'true'`/`'on'`/`'1'`/`'yes'`/`true` → 1, else 0) and `toNum(v, field)` (`null`/`''` → 0; non-numeric → throws a 400 error). Mongoose used to do this casting. |
| `models/recipes.js` | Replaces `models/Recipe.js`. Functions: `listAll()`, `findById(id)`, `findByOwner(ownerId)`, `search({ criteria, category })`, `findByIds(ids)`, `create(data, imageFiles)`, `update(id, data, newImageFiles?)`, `remove(id)`. Includes `serializeRecipe(row, imageRows)`, which builds the API JSON in §2.1. List queries load images with one `SELECT id, recipe_id, position, seed_file FROM recipe_images WHERE recipe_id IN (…)`, **never `data`**. |
| `models/users.js` | Replaces `models/User.js`. Functions: `findByEmail`, `findById`, `createIfMissing({ email, username, image })` (`INSERT … ON CONFLICT(email) DO NOTHING`), `isBookmarked(userId, recipeId)`, `toggleBookmark(userId, recipeId)` → bool, `listBookmarkedRecipes(userId)`. |
| `models/messages.js` | Replaces `models/Message.js`. Functions: `listForRecipient(userId)` (JOIN users + recipes, `ORDER BY read ASC, created_at DESC`, which matches today's unread-then-read order), `create(…)`, `findById`, `toggleRead(id)`, `remove(id)`, `unreadCount(userId)`. |
| `models/images.js` | `getImageBlob(id)` → `{ data, mime_type, byte_size }` or null. |

**Removed:** `models/Recipe.js`, `models/User.js`, `models/Message.js`, `config/cloudinary.js`, `utils/cloudinaryImages.js`.

**Write semantics:**
- `create` and `update` handle the images like this: run `processImage` on every file first (async), **then** do one `db.transaction(...)` that writes the recipe row plus image rows. better-sqlite3 transactions are synchronous, so all async work has to finish first. On update with new images, the transaction deletes the old `recipe_images` rows and inserts the new ones. This replaces "upload, update, then delete old Cloudinary images" with a single atomic step.
- `updated_at` is set explicitly on every write.

**Search** (`models/recipes.search`) keeps the current behavior: case-insensitive substring matching on name, description, type, ingredients and directions, plus an optional category substring filter. User input is escaped for `LIKE` (`%`, `_`, `\` → `\`-prefixed, `ESCAPE '\'`):
```sql
SELECT * FROM recipes r
WHERE (r.name LIKE :p ESCAPE '\' OR r.description LIKE :p ESCAPE '\' OR r.type LIKE :p ESCAPE '\'
       OR r.directions LIKE :p ESCAPE '\'
       OR EXISTS (SELECT 1 FROM json_each(r.ingredients) WHERE value LIKE :p ESCAPE '\'))
  AND (:cat IS NULL OR r.category LIKE :cat ESCAPE '\')
ORDER BY r.created_at;
```
SQLite `LIKE` is case-insensitive for ASCII, which matches the old `/…/i` behavior for this data.

### 3.3 Route handlers (rewrite internals, keep the URLs, status codes and response bodies)

All handlers drop `await connectDB()`, keep `getSessionUser()` and the ownership checks, and call the model functions instead.

| Route | Change |
|---|---|
| `app/api/recipes/route.js` | GET → `listAll()`. POST → build data with `toNum`/`toBool`, call `create()`, then a 303 redirect to `/recipes/<newId>`. Missing required fields (name/type/category) → 400. |
| `app/api/recipes/[id]/route.js` | GET → `findById`. PUT → ownership check, then `update`. DELETE → ownership check, then `remove` (cascades do the rest; no image cleanup call). |
| `app/api/recipes/user/[userId]/route.js` | `findByOwner`. |
| `app/api/recipes/search/route.js` | `search()`. Keep the `?`-stripping quirk and the `recipeType !== 'All'` rule. |
| `app/api/bookmarks/route.js` | GET → `listBookmarkedRecipes`. POST → `toggleBookmark`. Same `{ message, isBookmarked }` response. |
| `app/api/bookmarks/check/route.js` | `isBookmarked`. |
| `app/api/messages/route.js` | GET → `listForRecipient`. POST → `create` (keep the "can't message yourself" check). |
| `app/api/messages/[id]/route.js` | PUT → `toggleRead` (returns the message with unpopulated ids, as today). DELETE → `remove`. |
| `app/api/messages/unread-count/route.js` | `unreadCount`. |
| **NEW** `app/api/images/[id]/route.js` | GET → `getImageBlob`. 404 if missing or if it's a seed row. Returns `new Response(data, { headers: { 'Content-Type', 'Content-Length', 'Cache-Control': 'public, max-age=31536000, immutable', ETag: id } })`. Caching forever is safe because replacing an image creates a new id. `export const dynamic = 'force-dynamic'`. |
| `utils/authOptions.js` | `signIn` → `users.createIfMissing`. `session` → `users.findByEmail`, and set `session.user.id = user.id`. |

### 3.4 Components (image src only)
Replace the inline `includes('http')` / `includes('https')` checks with `imageSrc()` in:
`components/RecipeCard.jsx`, `components/RecipeHeaderImage.jsx`, `components/RecipeImages.jsx` (2 places) and `app/profile/page.jsx`.
Without this change, `/api/images/<id>` would be turned into `/images/recipes//api/images/<id>`. `next/image` works with a relative `/api/images/...` src without any config.

### 3.5 Config and deployment
- **`next.config.mjs`**: add `experimental: { serverComponentsExternalPackages: ['better-sqlite3'] }` (Next 14.1) so the native module isn't bundled. Remove the `res.cloudinary.com` remote pattern **after** cutover is verified. Keep `lh3.googleusercontent.com`.
- **`.env.example`**: remove `MONGODB_URI` and `CLOUDINARY_*`, and add `SQLITE_PATH="./data/recipes.db"`. (`MONGODB_URI` is needed only in the local `.env` while the migration runs.)
- **`.gitignore`**: add `data/` and `*.db*`.
- **Server**: *(superseded: originally a Docker image with a volume; Docker has since been removed)*. Run with plain Node under systemd, `SQLITE_PATH=/var/lib/recipe-collector/recipes.db` (see `DEPLOY.md`).
- **Backups**: `scripts/backup-db.mjs` uses better-sqlite3's online `db.backup('<dir>/recipes-<ts>.db')` (safe under WAL). Schedule it with cron on the VPS (e.g. nightly, keep 14 copies) and copy the backups off the box.
- **Vercel**: remove the project or its domain after cutover. If the public domain currently points at Vercel, move DNS to the VPS and update `NEXTAUTH_URL`, `NEXT_PUBLIC_DOMAIN`, `NEXT_PUBLIC_API_DOMAIN`, **and the Google OAuth authorized redirect URI** (`https://<domain>/api/auth/callback/google`).

### 3.6 Documentation
- `CLAUDE.md`: rewrite the Architecture sections for the route handler pattern (`getDb()`, no `connectDB`), images (DB BLOBs + seed files, `imageSrc()`), cascades (FK-based), and hosting (VPS only). Remove the Cloudinary and Mongoose gotchas, and add `SQLITE_PATH` plus the backup command.
- `ARCHITECTURE.md`: replace the data model with §2, and add the `/api/images/:id` row to the API table.
- Deployment notes: *(superseded: `ReadMe.Docker.txt` was deleted along with Docker)*. Deploy and backup steps are in `DEPLOY.md`. **The GitHub token once committed in `ReadMe.Docker.txt` is still in git history: don't copy it anywhere, and revoke it.**

---

## 4. Data migration script: `scripts/migrate-mongo-to-sqlite.mjs`

This is a standalone Node ESM script. It doesn't import any `@/` modules, apart from the relative imports of `../utils/imageProcessing.mjs` and `../db/schema.sql`. It uses `mongodb` (driver), `better-sqlite3`, `sharp`, and the global `fetch`. Cloudinary images are downloaded from their public `secure_url`, so no Cloudinary API key is needed.

**CLI:** `npm run db:migrate -- [--out ./data/recipes.db] [--force] [--dry-run] [--skip-broken-images]`
- `MONGODB_URI` comes from the env.
- If `--out` already exists, the script refuses to run unless `--force` is given. It writes to `<out>.tmp` and renames it at the end, so a failed run never leaves a half-written DB.
- `--dry-run`: does everything against an in-memory DB and prints the report only.

**Phase A: Extract (read-only on Mongo)**
1. Connect and read the `users`, `recipes` and `messages` collections in full (the dataset is small).
2. Convert every ObjectId to `.toHexString()` and every Date to `.toISOString()`.

**Phase B: Fetch and process images (async, before any DB write)**
For each recipe, for each `images[i]`:
- Value contains `http`: `fetch` it (30s timeout, 3 retries with backoff, concurrency 4), then run `processImage()`. The result is `{ id: newId(), position: i, data, mime_type, width, height, byte_size, original_url }`.
  - On failure: abort, unless `--skip-broken-images`, in which case it logs and skips that slot. Positions stay compact (0, 1).
- Otherwise (seed file name): `{ id: newId(), position: i, seed_file: value }`. Warn if `public/images/recipes/<value>` is missing.

**Phase C: Load (one synchronous transaction)**
Apply `schema.sql`, then inside a single `db.transaction()`:
1. **users** → insert `{ id, email, username, image, created_at, updated_at }`. Missing timestamps fall back to the ObjectId's `getTimestamp()`.
2. **recipes** → insert with defaults for missing fields: numeric fields → 0, `starRating` → `String(v ?? '1')`, `isFeatured` → 0/1, `ingredients` → `JSON.stringify(v ?? [])`. **Skip and log** recipes whose `owner` isn't in users.
3. **recipe_images** → insert the rows from phase B.
4. **bookmarks** → for each user, dedupe `bookmarks[]` and insert `(user_id, recipe_id, created_at = now)`. **Skip and log** bookmarks that point at recipes which don't exist (leftovers from before the cascade fix).
5. **messages** → map `property` → `recipe_id`. **Skip and log** messages whose sender, recipient or recipe is missing.
6. Run `PRAGMA foreign_key_check` (must be empty) and `PRAGMA integrity_check` (must be `ok`). If either fails, throw, which rolls back the transaction.

**Phase D: Finalize**
- `PRAGMA wal_checkpoint(TRUNCATE)`, then `VACUUM`, then close. This leaves one self-contained file with no `-wal`/`-shm`, ready to copy.
- Rename `.tmp` to the final path.
- Write `data/migration-report-<timestamp>.json`, containing: counts read vs written per entity; every skipped record with its reason; total image bytes before and after resize; and an `originalUrl → imageId` map.

## 5. Verification script: `scripts/verify-migration.mjs`
Run it against Mongo and the new DB. It exits non-zero on any mismatch.
- Row counts match Mongo, minus the skipped records listed in the report.
- For every recipe: each scalar field, `nutritionInfo`, `ingredients` (order included) and the image count/order match the Mongo document after normalization.
- Every blob row decodes with `sharp(data).metadata()`, and its width and height are ≤ 1600.
- Every bookmark and message from Mongo either exists in SQLite or is listed as skipped.
- `PRAGMA integrity_check` returns `ok`, and `foreign_key_check` returns nothing.

---

## 6. Execution order and cutover runbook

**Build (on a branch, locally; nothing in production changes)**
1. ✅ Create branch `sqlite-migration`. This doc is already at `docs/SQLITE_MIGRATION.md`.
2. ✅ Add the dependencies and the data layer (§3.1, §3.2).
3. ✅ Rewrite the route handlers and auth (§3.3), and update the components (§3.4). *(Applied to `utils/queries.js` and `app/actions/*`; see Deviations.)*
4. ✅ Update config and the docs (§3.5, §3.6). *(Docker was later removed entirely; see Deviations.)* *(`ARCHITECTURE.md` left unchanged by request; `ARCHITECTURE-SQLITE.md` is the new doc.)*
5. ✅ Write the migration and verify scripts (§4, §5).
6. ◐ **Rehearsal:** `npm run db:migrate -- --dry-run`, then a real run into `./data/recipes.db`, then `npm run db:verify`. Run the dev server against that file and go through the checklist in §7. 
   - ✅ Dry run, real run (3 users, 11 recipes, 26 image slots (9 Cloudinary → 2.07 MB to 0.72 MB, 17 seed), 3 bookmarks, 2 messages, 0 skipped) and `db:verify` passed.
   - ✅ Model-level checks on a copy of the DB: create/update/replace images, size caps (4000×3000 → 2400×1800), search with `% _ ( \`, bookmarks, messages, read toggle, cascade delete, `createIfMissing`.
   - ✅ `npm run build` and `next start` smoke test: all pages 200, `/api/images/:id` 200 with the immutable cache header, ETag 304, unknown id 404, the optimizer serves resized variants, and better-sqlite3 is traced into standalone.
   - ⬜ Signed-in browser flows from §7 (add/edit with photos, bookmark, messages, delete).
   - ~~Docker image build~~: not applicable, Docker was removed.

**Cutover (production VPS)**

7. Announce a short maintenance window. **Stop the current production app on the VPS** (the old Mongo-backed version) so no new Mongo writes happen.
8. Back up the source data: `mongodump --uri "$MONGODB_URI" --out backup-<date>`. Cloudinary stays untouched as its own backup.
9. Run `npm run db:migrate -- --force` and then `npm run db:verify` against production Mongo. Copy `recipes.db` to `/var/lib/recipe-collector/recipes.db` on the VPS with `scp`, and `chown recipe:recipe` it (`DEPLOY.md` §2).
10. On the VPS, follow `DEPLOY.md` §1 and §3: Node 22, the code in `/opt/recipe-collector`, the new `.env` (with `SQLITE_PATH`, and no Mongo or Cloudinary settings), `npm ci && npm run build`, and the systemd service. Run the smoke tests (§7) on the production URL. Move DNS and the OAuth redirect URI if needed (§3.5). Enable the backup cron (`DEPLOY.md` §5).

**Decommission (after about 30 days with no problems)**

11. Delete the Cloudinary `RecipeApp` folder and its credentials, shut down the Mongo cluster, remove `mongodb` from devDependencies, remove the `res.cloudinary.com` remote pattern, and delete the Vercel project and the old GHCR container images.

**Rollback** (any time before step 11): in `/opt/recipe-collector`, `git checkout 887393f` (the last pre-SQLite commit), restore the old `.env` (`MONGODB_URI`, `CLOUDINARY_*`), then `npm ci && npm run build && systemctl restart recipe-collector`. Mongo and Cloudinary are unchanged. Anything written to SQLite after cutover would be lost, so decide within the first day or two, or replay those few records by hand.

---

## 7. Verification checklist (local rehearsal and production smoke test)

- `npm run build` succeeds.
- `curl localhost:9000/api/recipes` returns the same count and the same `_id`s as Mongo, and images look like `/api/images/<id>` or seed file names.
- `curl -I localhost:9000/api/images/<id>` returns 200, `image/webp`, and the immutable cache header.
- An old shared link `/recipes/<mongoId>` renders with its images.
- Signing in with Google: an existing user keeps their recipes, bookmarks and messages, and a brand-new Google account creates a user row.
- Add a recipe with 2 images: it redirects to the new recipe, and the images are stored at ≤1600px.
- Edit with a new image: the old image rows are gone (`SELECT COUNT(*) FROM recipe_images WHERE recipe_id=?`).
- Bookmark toggle works, and `/recipes/saved` lists the right recipes.
- Search with text, with the cuisine filter, and with special characters (`%`, `_`, `(`) doesn't crash.
- Messages: send, mark read and unread (the unread badge updates), delete.
- Delete a recipe: its bookmarks, messages and image rows are gone (cascade).
- `systemctl restart recipe-collector`: the data is still there. Run `npm run db:backup` and check that it produces a DB that opens.
