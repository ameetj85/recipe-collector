# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

Recipe-sharing app built with Next.js 14 (App Router, plain JavaScript/JSX), MongoDB/Mongoose, NextAuth (Google only), Cloudinary for images, and Tailwind. `ARCHITECTURE.md` has the full data model, API table and user flows.

## Commands

```bash
npm run dev      # dev server on http://localhost:9000 (port is fixed in package.json)
npm run build    # production build (output: "standalone")
npm start
npm run lint     # next lint (no ESLint config is committed, so the first run prompts to create one)
```

- There is no test suite. Verify changes with `npm run build`, and against the running dev server (e.g. `curl` the page).
- `PageNotFoundError: Cannot find module for page: /_error` during `next build` means the `.next` cache is stale. Delete `.next` and rebuild. Don't do this while the user's dev server is running; build in a separate copy instead.
- Configure through `.env` (template: `.env.example`).
- Docker: multi-stage `Dockerfile` (Node 18, standalone `server.js`, port 9000). Deploy notes are in `ReadMe.Docker.txt`. Production is on Vercel and also on a VPS via GHCR.

## Architecture

**No REST API; reads in Server Components, writes in Server Actions.** Don't add `fetch()` calls to the app's own backend or new `app/api` routes. The only route handler is `app/api/auth/[...nextauth]`.
- **Reads:** `utils/queries.js` holds plain async functions (not Server Actions, so they aren't exposed as endpoints) that pages call directly. Each one calls `connectDB()`, uses `.lean()`, and returns `serialize(...)`: JSON-plain objects with ids and dates as strings, safe to pass to Client Components. They catch their own errors and return `[]`/`null`/`false`/`0`. Never import this file from a `'use client'` module.
- **Writes:** `app/actions/{recipes,bookmarks,messages}.js` (`'use server'`). Client Components call them inside `startTransition`, or the forms use them via `<form action>` + `useFormState`.

**Server Action pattern.** Actions are public POST endpoints, so every exported action must:
1. Call `getSessionUser()` (`utils/getSessionUser.js`, returns `{ user, userId }` or `null`) and return `{ error }` if there's no session.
2. Validate ids with `isValidObjectId`, then `await connectDB()` (`config/database.js` caches the connection with a module-level flag).
3. Check ownership by comparing `doc.owner.toString()` (recipes) or `message.recipient.toString()` (messages) with `userId`.
4. Return `{ error }` for failures (don't throw; production masks thrown messages), and a plain object on success.
5. Call `revalidatePath(...)` after writing. `redirect()` throws, so call it after the `try/catch`, never inside.

Pages are all dynamic because the root layout is `force-dynamic`, so the build never queries the database.

**Auth.** `utils/authOptions.js` holds the NextAuth config. The `signIn` callback creates the `User` document on first login. The `session` callback adds the Mongo `_id` as `session.user.id`, and both the client and the server code depend on that field. `app/layout.jsx` resolves the session on the server and passes it to `AuthProvider`, so `useSession()` is never `loading` on first render. That's why the layout is `force-dynamic`. `middleware.js` guards `/recipes/add`, `/profile`, `/recipes/saved` and `/messages`. `/recipes/[id]/edit` isn't in the matcher; the page redirects non-owners and `updateRecipe` re-checks ownership.

**Recipe forms.**
- **Add** (`RecipeAddForm`) uses `useFormState(addRecipe)`. **Edit** (`RecipeEditForm`, which gets `recipe` as a prop from the page) uses `useFormState(updateRecipe.bind(null, id))`. Both actions `redirect()` to the recipe on success, or return `{ error }`, which the form shows as a toast. `SubmitButton` (`useFormStatus`) shows the pending state.
- Both read nested fields by dotted name (`nutritionInfo.calories`). Ingredients come from a one-per-line textarea, parsed by `utils/parseIngredients.js`. The edit form must join the stored array with `\n` when it loads.
- Images: up to 2, uploaded with `utils/cloudinaryImages.js` (`uploadImages`, `deleteImages`). On edit, any new images replace the old ones. Server Action bodies are capped by `experimental.serverActions.bodySizeLimit` in `next.config.mjs` (10 MB; the Next default of 1 MB is too small for photos).

**Images have two sources.** `recipe.images` holds either Cloudinary `https` URLs or bare file names for seed images in `public/images/recipes/`. Components check for `http` in the value before building a `src` (see `RecipeCard`). New remote image hosts must be added to `images.remotePatterns` in `next.config.mjs`.

**Cascading deletes are manual.** `deleteRecipe` (`app/actions/recipes.js`) also pulls the recipe from all users' `bookmarks`, deletes its `Message`s and deletes its Cloudinary images. Keep that in sync if you add new references to recipes.

**Client state.** `context/GlobalContext.js` holds only `unreadCount`. `app/layout.jsx` loads it on the server and seeds it (`initialUnreadCount`), `UnreadMessageCount` displays it, and `Message` adjusts it when a message is marked read or unread, or deleted.

## Gotchas

- `Message.property` is the reference to the recipe; the name is left over from a template project. Keep it unless you migrate existing data.
- `Recipe.starRating` is a String. `category` holds the cuisine (used by the search filter) and `type` holds the main ingredient. The `<select>` options in the add and edit forms define the allowed values.
- Models use `models.X || model('X', schema)` to survive hot reload; follow the same pattern for new models.
- `ReadMe.Docker.txt` contains a committed GitHub token. Don't copy it anywhere.
