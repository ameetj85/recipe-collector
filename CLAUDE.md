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

- There is no test suite. Verify changes with `npm run build`, and against the running dev server (e.g. `curl` the page or API route).
- `PageNotFoundError: Cannot find module for page: /_error` during `next build` means the `.next` cache is stale. Delete `.next` and rebuild. Don't do this while the user's dev server is running; build in a separate copy instead.
- Configure through `.env` (template: `.env.example`). `NEXT_PUBLIC_API_DOMAIN` must point at the app's own `/api`; see below.
- Docker: multi-stage `Dockerfile` (Node 18, standalone `server.js`, port 9000). Deploy notes are in `ReadMe.Docker.txt`. Production is on Vercel and also on a VPS via GHCR.

## Architecture

**One app, two halves.** Pages live in `app/**/page.jsx` and REST endpoints in `app/api/**/route.js`. All database access goes through the route handlers. Even Server Components (`app/recipes/page.jsx`, `components/HomeRecipes.jsx`) fetch over HTTP through `utils/requests.js`, which builds absolute URLs from `NEXT_PUBLIC_API_DOMAIN`. If that variable is unset, the helpers return `[]`/`null` instead of throwing. This is why the build logs "Failed to fetch data" when no server is running; it's harmless.

**Route handler pattern.** Every handler follows the same pattern:
1. `await connectDB()` (`config/database.js` caches the connection with a module-level flag).
2. `getSessionUser()` (`utils/getSessionUser.js`) returns `{ user, userId }` or `null`. Return 401 when there is no session.
3. Check ownership by comparing `doc.owner.toString()` (recipes) or `message.recipient.toString()` (messages) with `userId`.
4. Return `new Response(JSON.stringify(...), { status })`.

Handlers that read the session or `request.url` export `const dynamic = 'force-dynamic'`. Without it the Vercel build fails or the route gets cached.

**Auth.** `utils/authOptions.js` holds the NextAuth config. The `signIn` callback creates the `User` document on first login. The `session` callback adds the Mongo `_id` as `session.user.id`, and both the client and the API depend on that field. `app/layout.jsx` resolves the session on the server and passes it to `AuthProvider`, so `useSession()` is never `loading` on first render. That's why the layout is `force-dynamic`. `middleware.js` guards `/recipes/add`, `/profile`, `/recipes/saved` and `/messages`. `/recipes/[id]/edit` is not guarded; only the API checks ownership.

**Recipe forms.**
- **Add** (`RecipeAddForm`) is a native `<form action="/api/recipes" method="POST" multipart>`. The handler responds with a 303 redirect to the new recipe.
- **Edit** (`RecipeEditForm`) submits `FormData` with `fetch` using `PUT`.
- Both read nested fields by dotted name (`nutritionInfo.calories`). Ingredients come from a one-per-line textarea, parsed by `utils/parseIngredients.js`. The edit form must join the stored array with `\n` when it loads.
- Images: up to 2, uploaded with `utils/cloudinaryImages.js` (`uploadImages`, `deleteImages`). On edit, any new images replace the old ones.

**Images have two sources.** `recipe.images` holds either Cloudinary `https` URLs or bare file names for seed images in `public/images/recipes/`. Components check for `http` in the value before building a `src` (see `RecipeCard`). New remote image hosts must be added to `images.remotePatterns` in `next.config.mjs`.

**Cascading deletes are manual.** `DELETE /api/recipes/:id` also pulls the recipe from all users' `bookmarks`, deletes its `Message`s and deletes its Cloudinary images. Keep that in sync if you add new references to recipes.

**Client state.** `context/GlobalContext.js` holds only `unreadCount`. `UnreadMessageCount` sets it, and `Message` adjusts it when a message is marked read or unread, or deleted.

## Gotchas

- `Message.property` is the reference to the recipe; the name is left over from a template project. Keep it unless you migrate existing data.
- `Recipe.starRating` is a String. `category` holds the cuisine (used by the search filter) and `type` holds the main ingredient. The `<select>` options in the add and edit forms define the allowed values.
- Models use `models.X || model('X', schema)` to survive hot reload; follow the same pattern for new models.
- `ReadMe.Docker.txt` contains a committed GitHub token. Don't copy it anywhere.
