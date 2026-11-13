# Recipe Collector: Architecture (SQLite edition)

> This document describes the app **after** the MongoDB + Cloudinary → SQLite migration (`docs/SQLITE_MIGRATION.md`). `ARCHITECTURE.md` is kept unchanged as the record of the previous MongoDB/Mongoose/Cloudinary design.

## 1. Overview

Recipe Collector is a full-stack web app for collecting and sharing recipes. Signed-in users can:

- Browse and search a shared recipe catalogue
- Add recipes, with up to two photos each
- Edit and delete their own recipes
- Bookmark ("save") recipes from other users
- Share recipes on social media, print them, and copy their ingredient lists
- Send messages to a recipe's owner and manage their own inbox

The app is one **Next.js 16 (App Router)** project. Server Components read the database directly, and mutations run as **Server Actions**. **All data, including uploaded photos, is in one SQLite file**, and the app depends on no database or image service.

| Concern | Technology |
|---|---|
| Framework | Next.js 16 (App Router, Turbopack), React 19 |
| Language | JavaScript (JSX), no TypeScript |
| Styling | Tailwind CSS 4 (config in `globals.css` via `@theme`), plus one plain CSS file |
| Database | SQLite through `better-sqlite3` (synchronous, prebuilt native binaries) |
| Image storage | BLOBs in the same SQLite file, resized with `sharp`; seed images stay in `public/images/recipes` |
| Authentication | NextAuth v4 with the Google OAuth provider |
| UI libraries | react-icons, react-toastify, react-spinners, react-share, react-tooltip |
| Deployment | Plain Node on a VPS under systemd (`npm start`, port 9000) behind a TLS reverse proxy; see `DEPLOY.md`. **No Docker.** **Vercel isn't supported**: it has no writable, persistent filesystem. |

---

## 2. High-level architecture

```
                   ┌─────────────────────────────────────────────────────────┐
  Browser          │                       Next.js app                       │
  ───────          │                                                         │
  React client ───►│ app/**/page.jsx                                         │
  components       │   ├─ Server Components ──► utils/queries.js ──┐         │
                   │   └─ Client Components ──► app/actions/*  ────┤         │
  <img> / next/    │                                               ▼         │
  image ──────────►│ app/api/images/[id] ──► models/images.js    models/*.js │
                   │                                               │         │
                   │ proxy.js (route guard)                        ▼         │
                   │ utils/authOptions ──► models/users.js   config/database │
                   └──────────────┬─────────────────────────────────┬────────┘
                                  │                                 │
                            Google OAuth                  data/recipes.db (SQLite, WAL)
                            (sign-in)                     users · recipes · recipe_images
                                                          bookmarks · messages
```

**Layers:**

1. **Presentation**: `app/**/page.jsx` (routes) and `components/*.jsx`.
2. **Reads**: `utils/queries.js`, plain async functions that Server Components call. They aren't Server Actions, so they're never exposed as endpoints. They validate ids, call the models, and catch errors (returning `[]`/`null`/`false`/`0`).
3. **Mutations**: `app/actions/{recipes,bookmarks,messages}.js` (`'use server'`).
4. **Data access**: `models/{recipes,users,messages,images}.js`. These hold the SQL, using prepared statements. They return the **same JSON shapes the Mongoose models produced** (`_id`, `owner`, nested `nutritionInfo`, `images[]`, populated `sender`/`property`), so the components didn't change.
5. **Infrastructure**: `config/database.js` (`getDb()`), `db/schema.mjs` (DDL and pragmas), `utils/authOptions.js` (NextAuth).
6. **Binary route**: `app/api/images/[id]/route.js` streams stored image BLOBs. Besides NextAuth, it's the only route handler: a Server Component can't return binary data.

---

## 3. Directory layout (changed parts in bold)

```
recipe-collector/
├── app/
│   ├── actions/                 # Server Actions (§6)
│   ├── api/auth/[...nextauth]/  # NextAuth handler
│   ├── api/images/[id]/         # **GET stored image BLOB (immutable cache)**
│   └── …pages (unchanged)
├── components/                  # UI; image src built with utils/imageSrc
├── config/database.js           # **getDb(): lazy, cached better-sqlite3 handle**
├── db/schema.mjs                # **Schema v1 DDL, pragmas, ensureSchema()**
├── models/                      # **recipes.js, users.js, messages.js, images.js (SQL)**
├── scripts/
│   ├── migrate-mongo-to-sqlite.mjs  # **one-off migration (npm run db:migrate)**
│   ├── verify-migration.mjs         # **Mongo ↔ SQLite comparison (npm run db:verify)**
│   └── backup-db.mjs                # **online backup + retention (npm run db:backup)**
├── utils/
│   ├── queries.js               # server reads
│   ├── ids.js                   # **newId(), isValidId(), normalizeId()**
│   ├── imageProcessing.mjs      # **processImage(): resize/re-encode with sharp**
│   ├── imageSrc.js              # **stored value → <img> src**
│   ├── formValues.js            # **toNum/toBool/toText form casting**
│   ├── parseIngredients.js, getSessionUser.js, authOptions.js
├── data/                        # **git-ignored: recipes.db, backups/, migration reports**
├── docs/SQLITE_MIGRATION.md     # migration plan and runbook
└── DEPLOY.md                    # **VPS deployment (systemd), backups, restore**
```

---

## 4. Data model (SQLite, schema version 1)

The DDL is in `db/schema.mjs`. On first open of an empty file (`PRAGMA user_version = 0`), `getDb()` creates the schema. If the file has a *newer* version, the app refuses to start.

Every connection sets these pragmas: `journal_mode = WAL`, `foreign_keys = ON`, `busy_timeout = 5000`, `synchronous = NORMAL`.

**Conventions:** ids are `TEXT`, 24 lowercase hex characters. Migrated rows keep their Mongo ObjectId, so old `/recipes/<id>` links still work, and new ids use the same format (`utils/ids.js`). Timestamps are ISO-8601 UTC text. Booleans are `INTEGER` 0/1. Numbers are `REAL`.

```
users 1──* recipes 1──* recipe_images        (max 2 per recipe, ordered by position)
users *──* recipes      via bookmarks
messages: sender_id → users, recipient_id → users, recipe_id → recipes
```

| Table | Key columns | Notes |
|---|---|---|
| `users` | `id`, `email` (unique), `username`, `image`, `created_at`, `updated_at` | Created on first Google sign-in |
| `recipes` | `id`, `owner_id`, `name`, `type`, `category`, `description`, `url`, `star_rating` (TEXT), `is_featured`, `prep_time`, `cook_time`, `total_time`, `servings`, `calories`, `fat`, `carbs`, `protein`, `sugars`, `ingredients` (JSON array), `directions` | `category` = cuisine (search filter), `type` = main ingredient. Nutrition is flattened into columns. |
| `recipe_images` | `id`, `recipe_id`, `position`, then **either** `data` + `mime_type` + `byte_size` + `width` + `height` **or** `seed_file`; `original_url` | A CHECK constraint enforces "blob xor seed file". `original_url` holds the Cloudinary URL for migrated rows (audit trail only). |
| `bookmarks` | `(user_id, recipe_id)` PK, `created_at` | Replaces `User.bookmarks[]` |
| `messages` | `id`, `sender_id`, `recipient_id`, `recipe_id`, `name`, `email`, `phone`, `body`, `read`, timestamps | Index `(recipient_id, read, created_at DESC)` serves the inbox query |

**Cascades are enforced by the database.** Every foreign key is `ON DELETE CASCADE`. Deleting a recipe removes its images, bookmarks and messages, and deleting a user removes everything they own. No application code needs updating when you add a new reference to recipes, as long as it's declared with a foreign key.

### JSON shape returned to pages

`models/recipes.serializeRecipe()` maps rows back to the old API shape:

| SQLite | JSON |
|---|---|
| `id`, `owner_id` | `_id`, `owner` |
| `star_rating`, `is_featured` | `starRating` (string), `isFeatured` (bool) |
| `calories`…`sugars` | `nutritionInfo: { calories, fat, carbs, protein, sugars }` |
| `ingredients` (JSON text) | `ingredients[]` |
| `recipe_images` rows | `images[]`: `"/api/images/<imageId>"` for blobs, bare `"<file>"` for seeds |
| `description`, `url`, `directions` NULL | `''` (components call `.split` on `directions`) |
| `created_at` / `updated_at` | `createdAt` / `updatedAt` |

`models/messages.listForRecipient()` returns `sender: { _id, username }` and `property: { _id, name }`. The `property` key name is kept for `components/Message.jsx`.

### Data access rules
- `getDb()` is called lazily, inside functions, never at module load, so `next build` never opens the database. The handle is cached on `globalThis.__recipeDb` to survive hot reload. The DB path uses a `turbopackIgnore` hint so the build's file tracing doesn't walk `data/`.
- better-sqlite3 is **synchronous**, and its transactions can't contain `await`. Any async work (reading uploaded files, `sharp`) happens **before** the `db.transaction(...)` call.
- List queries read `recipe_images` without the `data` column. BLOBs are only read by `/api/images/[id]`.
- Search escapes `%`, `_` and `\` in user input and uses `LIKE … ESCAPE '\'`. SQLite `LIKE` is case-insensitive for ASCII. Ingredients are searched with `json_each`.

---

## 5. Images

### Two sources
`recipe.images[]` values are either `/api/images/<id>` (a stored BLOB) or a bare seed file name (`public/images/recipes/<file>`). `utils/imageSrc.js` turns a value into a `src`: values starting with `/` or `http` pass through, bare names get the `/images/recipes/` prefix, and empty values fall back to the logo. `RecipeCard`, `RecipeHeaderImage`, `RecipeImages` and `ProfileRecipes` all use it.

### Size policy (`utils/imageProcessing.mjs`)
Every uploaded photo, and every image migrated from Cloudinary, goes through `processImage()`:

| Setting | Value | Why |
|---|---|---|
| Max width | **2400 px** | The largest display is the full-bleed header on `/recipes/[id]` (100vw × 320–440 px, `object-cover`), so width is what has to hold up. 2400 covers 1920 px desktops with headroom and most of a 2× laptop screen without blur. |
| Max height | **3200 px** | Looser, so portrait phone photos keep the full 2400 px width and fill the header without being upscaled. |
| Format | WebP, quality 82, `smartSubsample` | About 25–35% smaller than JPEG at the same visual quality. |
| Enlargement | never (`withoutEnlargement`) | Small images aren't blown up. |
| EXIF | applied (`rotate()`) and stripped | Correct orientation, and no GPS or camera metadata gets stored. |
| Passthrough | The original bytes are kept if the image is already within limits, is JPEG/PNG/WebP, has no EXIF, and is no larger than the WebP result. | Avoids a second round of lossy compression, and avoids growing already-optimised images. |

For example, a 4000×3000 phone photo is stored at 2400×1800 WebP. The migration took 9 Cloudinary images from 2.07 MB down to 0.72 MB in total.

### Delivery
- `GET /api/images/:id` returns the BLOB with `Content-Type` from the row, `Cache-Control: public, max-age=31536000, immutable`, and `ETag: "<id>"` (with 304 support). Caching forever is safe: replacing an image deletes the old row and inserts a new id.
- All recipe images are rendered with `next/image` and accurate `sizes`, so the optimizer (`/_next/image`) sends each device a variant at its own width. Phones never download the 2400 px source. `RecipeHeaderImage` was switched from a raw `<img>` to `next/image fill sizes="100vw"` for this reason.
- `next.config.mjs` adds `2400` to `images.deviceSizes`, so large and retina screens get exactly the stored resolution instead of a 3840 request, and sets `minimumCacheTTL` to 31 days.

---

## 6. Server Actions (`app/actions`)

Same contract as before: each action calls `getSessionUser()`, validates ids with `normalizeId()`, checks ownership, returns `{ error }` instead of throwing, and calls `revalidatePath`. `redirect()` stays outside the `try/catch`.

| Action | Auth | Returns | Behaviour |
|---|---|---|---|
| `addRecipe(prevState, formData)` | Yes | redirect / `{ error }` | Validates required fields and casts numbers (`utils/formValues.js`), processes up to 2 images, then inserts the recipe and its image rows in **one transaction** and redirects |
| `updateRecipe(id, prevState, formData)` | Owner | redirect / `{ error }` | Same, as an UPDATE. New images replace the old rows inside the same transaction |
| `deleteRecipe(id)` | Owner | `{ ok }` | `DELETE FROM recipes`. Cascades remove images, bookmarks and messages |
| `toggleBookmark(recipeId)` | Yes | `{ message, isBookmarked }` | Deletes the bookmark row, or inserts it if none was deleted |
| `sendMessage({...})` | Yes | `{ message }` | Recipient comes from the recipe's `owner_id`. You can't message yourself |
| `toggleMessageRead(id)` | Recipient | `{ read }` | `UPDATE … SET read = 1 - read RETURNING read` |
| `deleteMessage(id)` | Recipient | `{ ok }` | |

User input errors (non-numeric fields, missing name/type/category, a file that isn't an image) come back as a specific `{ error }` message. Unexpected failures are logged and get a generic message. The Server Action body limit is still 10 MB; photos are shrunk on the server after upload.

---

## 7. Authentication

Unchanged apart from storage. `signIn` calls `users.createIfMissing()` (`INSERT … ON CONFLICT(email) DO NOTHING`). `session` looks up the user by email and sets `session.user.id` to the row id, the same hex value existing users had before. `proxy.js` still guards `/recipes/add`, `/profile`, `/recipes/saved` and `/messages`. `/api/images/*` is public.

---

## 8. Configuration

| Variable | Used by |
|---|---|
| `SQLITE_PATH` | `config/database.js` and scripts. Default `./data/recipes.db`. On the server, `/var/lib/recipe-collector/recipes.db` |
| `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` | NextAuth Google provider |
| `NEXTAUTH_URL`, `NEXTAUTH_URL_INTERNAL`, `NEXTAUTH_SECRET` | NextAuth |
| `NEXT_PUBLIC_DOMAIN` | Absolute URLs (share links) |
| `MONGODB_URI` | **Only** for `db:migrate` / `db:verify` while the old cluster still exists |

`next.config.mjs`: `serverExternalPackages: ["better-sqlite3"]`, `images.remotePatterns` (Google avatars; `res.cloudinary.com` stays until decommission), `images.deviceSizes` / `minimumCacheTTL` (§5), and `serverActions.bodySizeLimit: "10mb"`.

---

## 9. Build, run, deploy and operate

```bash
npm install
npm run dev          # http://localhost:9000, creates data/recipes.db (empty) if missing
npm run build
npm run db:backup    # online backup to data/backups (keeps 14)
```
Node ≥ 22 is required (better-sqlite3 13).

**Production (VPS, no Docker):** the code lives in `/opt/recipe-collector` and is built on the server (`npm ci && npm run build`). A systemd unit runs `npm start` (port 9000) as an unprivileged `recipe` user, behind a TLS reverse proxy. The database lives at `SQLITE_PATH=/var/lib/recipe-collector/recipes.db`, outside the code folder, so `git pull` deploys never touch it. Full steps are in `DEPLOY.md`.

**Backups:** `npm run db:backup` (`scripts/backup-db.mjs`) uses SQLite's online backup API, which is safe while the app is writing. It writes a self-contained file, runs `integrity_check` on it, and prunes old copies. Run it nightly from cron (`--dir /var/backups/recipe-collector`) and copy the backups off the server. To restore, stop the service, replace `recipes.db` (and delete any `-wal`/`-shm` files), then start it.

**Migration tooling** (one-off, see `docs/SQLITE_MIGRATION.md`):
- `npm run db:migrate -- [--out] [--force] [--dry-run] [--skip-broken-images]` reads Mongo, downloads and processes the Cloudinary images, and writes `<out>.tmp` in one transaction with FK and integrity checks. It renames the file into place only on success and writes `data/migration-report-*.json`.
- `npm run db:verify` compares every row, field, image order and size, bookmark and message against Mongo, then runs the integrity checks. It exits non-zero on any mismatch.

**Concurrency:** one Node process holds one connection. WAL lets reads run alongside a write, and `busy_timeout` covers the backup process. Don't run more than one app process against the same file (no PM2 cluster mode).

---

## 10. Known issues and follow-ups

- **Decommission** (plan §6 step 11, after about 30 days): remove `mongodb` from devDependencies, the migration and verify scripts' npm entries, and the `res.cloudinary.com` remote pattern. Delete the Cloudinary folder and the Mongo cluster.
- `recipes.json` and `recipes-import.json` are Mongo-shaped seed files. There's no SQLite seed script yet.
- `bun.lock` is stale (it still lists mongoose and cloudinary). Deploys use `package-lock.json` (`npm ci`).
- There's no automated test suite. `npm run lint` reports 2 errors that predate the migration (`HomeRecipes` impure render, `RecipeAddForm` setState in an effect).
- A GitHub token committed in the old `ReadMe.Docker.txt` (now deleted) is still in git history. Revoke it.
- `/api/images/:id` responses are sent chunked: Next's response adapter drops the `Content-Length` header.
