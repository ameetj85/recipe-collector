# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

Recipe-sharing app built with Next.js 16 (App Router, plain JavaScript/JSX), **SQLite via better-sqlite3** (one file holds all data, including uploaded photos), NextAuth (Google only) and Tailwind 4 (CSS-first config in `assets/styles/globals.css`, no `tailwind.config.js`). `ARCHITECTURE-SQLITE.md` has the full data model, image policy and operations. `ARCHITECTURE.md` describes the old MongoDB/Cloudinary design and is kept for history only. Don't update it.

## Commands

```bash
npm run dev       # dev server on http://localhost:9000 (port is fixed in package.json)
npm run build     # production build
npm start         # production server on port 9000
npm run lint      # eslint . (flat config in eslint.config.mjs; `next lint` no longer exists)
npm run db:backup # online SQLite backup to data/backups (keeps 14)
npm run db:migrate / db:verify   # one-off Mongo -> SQLite migration tooling (needs MONGODB_URI)
```

- There is no test suite. Verify changes with `npm run build`, and against the running dev server (e.g. `curl` the page). For data-layer changes, test against a **copy** of `data/recipes.db` (`SQLITE_PATH=<copy> node …`), never the real file.
- `PageNotFoundError: Cannot find module for page: /_error` during `next build` means the `.next` cache is stale. Delete `.next` and rebuild. Don't do this while the user's dev server is running; build in a separate copy instead.
- Configure through `.env` (template: `.env.example`). `SQLITE_PATH` defaults to `./data/recipes.db`. `data/` is git-ignored and must never be committed.
- Node ≥ 22 (better-sqlite3 13). Production is **VPS only**: plain Node under systemd (`npm ci && npm run build && npm start`), with the DB at an absolute `SQLITE_PATH` outside the code folder. Deploy, backup and restore steps are in `DEPLOY.md`. Vercel isn't supported, because SQLite needs a persistent writable disk.
- **This project doesn't use Docker, for any purpose.** Don't add a Dockerfile, a compose file, container-based scripts or docs, or Docker commands in instructions.

## Architecture

**No REST API; reads in Server Components, writes in Server Actions.** Don't add `fetch()` calls to the app's own backend or new `app/api` routes. There are two route handlers: `app/api/auth/[...nextauth]`, and `app/api/images/[id]`, which streams stored image BLOBs (binary can't come from a Server Component).
- **Reads:** `utils/queries.js` holds plain async functions (not Server Actions, so they aren't exposed as endpoints) that pages call directly. They validate ids with `normalizeId()`, call `models/*`, and catch their own errors, returning `[]`/`null`/`false`/`0`. Never import this file from a `'use client'` module.
- **Writes:** `app/actions/{recipes,bookmarks,messages}.js` (`'use server'`). Client Components call them inside `startTransition`, or the forms use them via `<form action>` + `useActionState`.
- **Data access:** `models/{recipes,users,messages,images}.js` contain all SQL (prepared statements via `getDb()` from `config/database.js`). They return the JSON shape the old Mongoose models produced (`_id`, `owner`, nested `nutritionInfo`, `images[]`, `sender`/`property` objects on messages), so components didn't change. Models use relative imports (`../config/database.js`) so plain Node scripts can import them too.
- **Schema:** `db/schema.mjs` (DDL, pragmas, `ensureSchema`). `getDb()` creates the schema when `PRAGMA user_version = 0`. A schema change means bumping `SCHEMA_VERSION` and adding a migration step in `ensureSchema`. Don't just edit the CREATE statements, because existing files won't change.

**Server Action pattern.** Actions are public POST endpoints, so every exported action must:
1. Call `getSessionUser()` (`utils/getSessionUser.js`, returns `{ user, userId }` or `null`) and return `{ error }` if there's no session.
2. Validate ids with `normalizeId()` (`utils/ids.js`; 24-hex, lowercased).
3. Check ownership: `recipes.findOwnerId(id) === userId`, or `message.recipient_id === userId`.
4. Return `{ error }` for failures (don't throw; production masks thrown messages), and a plain object on success. Form-input problems throw `FormValueError` (`utils/formValues.js`), which actions turn into `{ error: message }`.
5. Call `revalidatePath(...)` after writing. `redirect()` throws, so call it after the `try/catch`, never inside.

**better-sqlite3 is synchronous.** Transactions (`db.transaction(fn)()`) can't contain `await`. Do all async work first (e.g. `processImage`), then one transaction. `getDb()` must only be called inside functions, never at module load, so the build doesn't open the DB. The `turbopackIgnore` comment in `config/database.js` stops the build's file tracing from walking `data/`; keep it.

Pages are all dynamic because the root layout is `force-dynamic`.

**Auth.** `utils/authOptions.js` holds the NextAuth config. The `signIn` callback calls `users.createIfMissing()`. The `session` callback adds the user row id as `session.user.id`, and both the client and the server code depend on that field. `app/layout.jsx` resolves the session on the server and passes it to `AuthProvider`, so `useSession()` is never `loading` on first render. That's why the layout is `force-dynamic`. `proxy.js` (Next 16's renamed middleware) guards `/recipes/add`, `/profile`, `/recipes/saved` and `/messages`. `/recipes/[id]/edit` isn't in the matcher; the page redirects non-owners and `updateRecipe` re-checks ownership.

**Recipe forms.**
- **Add** (`RecipeAddForm`) uses `useActionState(addRecipe)`. **Edit** (`RecipeEditForm`, which gets `recipe` as a prop from the page) uses `useActionState(updateRecipe.bind(null, id))`. Both actions `redirect()` to the recipe on success, or return `{ error }`, which the form shows as a toast. `SubmitButton` (`useFormStatus`) shows the pending state.
- Both read nested fields by dotted name (`nutritionInfo.calories`). Numbers are cast with `toNum` (empty → 0), flags with `toBool`. Ingredients come from a one-per-line textarea, parsed by `utils/parseIngredients.js` and stored as a JSON array. The edit form joins it with `\n` when it loads.
- Images: up to 2, run through `processImage()` (`utils/imageProcessing.mjs`), then stored as BLOB rows in `recipe_images`. On edit, any new images replace the old rows in the same transaction. Server Action bodies are capped by `experimental.serverActions.bodySizeLimit` in `next.config.mjs` (10 MB).

**Images.** `recipe.images[]` holds either `/api/images/<id>` (a stored BLOB) or a bare file name for seed images in `public/images/recipes/`. Always build `src` with `imageSrc()` (`utils/imageSrc.js`), never by hand. Size policy: max width 2400 px and height 3200 px, WebP q82, EXIF applied and stripped, and originals kept when they're already within limits and smaller (see `ARCHITECTURE-SQLITE.md` §5). Render recipe images with `next/image` and an accurate `sizes`, so devices get a variant at their own width. 2400 is in `images.deviceSizes`. Image ids are immutable: never update a BLOB in place, insert a new row instead (the route sends `immutable` cache headers).

**Cascading deletes are handled by the database.** Every foreign key is `ON DELETE CASCADE` (deleting a recipe removes its images, bookmarks and messages), so `deleteRecipe` is a single DELETE. New tables that reference recipes or users must declare FKs with `ON DELETE CASCADE`. `foreign_keys = ON` is set per connection in `applyPragmas`.

**Client state.** `context/GlobalContext.js` holds only `unreadCount`. `app/layout.jsx` loads it on the server and seeds it (`initialUnreadCount`), `UnreadMessageCount` displays it, and `Message` adjusts it when a message is marked read or unread, or deleted.

## Gotchas

- `messages.recipe_id` is still exposed as `property: { _id, name }` in the JSON, because `components/Message.jsx` reads `message.property.name`. The name is left over from a template project.
- `recipes.star_rating` is TEXT (`starRating` string). `category` holds the cuisine (used by the search filter) and `type` holds the main ingredient. The `<select>` options in the add and edit forms define the allowed values.
- NULL `description`/`url`/`directions` are serialized as `''`. `RecipeDetails` calls `recipe.directions.split`.
- **Keep `sharp` in package.json on the same version Next depends on** (`npm ls sharp` must show one copy, `deduped`). If two copies load in one server process (Next's image optimizer plus the app's `processImage`), their libvips builds clash and every upload fails with `colourspace: parameter space not set`. Re-check after every Next upgrade.
- Search uses `LIKE … ESCAPE '\'` with user input escaped. Keep the escaping if you touch `models/recipes.search`.
- `res.cloudinary.com` in `next.config.mjs` and `mongodb` in devDependencies remain only until decommission (`docs/SQLITE_MIGRATION.md` §6 step 11).
- A GitHub token was committed in the now-deleted `ReadMe.Docker.txt` and is still in git history. Don't copy it anywhere; it should be revoked.
