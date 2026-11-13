# Recipe Collector: Architecture, Design and Function

## 1. Overview

Recipe Collector is a full-stack web app for collecting and sharing recipes. Signed-in users can:

- Browse and search a shared recipe catalogue
- Add recipes, with up to two photos each
- Edit and delete their own recipes
- Bookmark ("save") recipes from other users
- Share recipes on social media, print them, and copy their ingredient lists
- Send messages to a recipe's owner and manage their own inbox

The app is one **Next.js 14 (App Router)** project. Server Components read MongoDB directly and mutations run as **Server Actions**; there is no REST API apart from the NextAuth handler.

| Concern | Technology |
|---|---|
| Framework | Next.js 14.1 (App Router), React 18 |
| Language | JavaScript (JSX), no TypeScript |
| Styling | Tailwind CSS 3 (Poppins font, custom `70/30` grid), plus one plain CSS file |
| Database | MongoDB through Mongoose 8 |
| Authentication | NextAuth v4 with the Google OAuth provider |
| Image storage | Cloudinary (uploads); seed images in `public/images/recipes` |
| UI libraries | react-icons, react-toastify, react-spinners, react-share, react-tooltip |
| Deployment | Vercel; Docker (standalone Next.js output) on a VPS through GHCR |

---

## 2. High-level architecture

```
                    ┌───────────────────────────────────────────────┐
  Browser           │                Next.js app                    │
  ───────           │                                               │
  React client  ───►│  app/**/page.jsx                              │
  components        │   ├─ Server Components ──► utils/queries ──┐   │
  (useSession,      │   │                         (reads)        │   │
   Server Actions)  │   └─ Client Components ──► app/actions/* ──┤   │
                    │                            (mutations)     ▼   │
                    │  middleware.js (NextAuth route guard)   Mongoose │
                    │  utils/authOptions ◄── getSessionUser ◄────┤   │
                    └──────────────┬──────────────┬──────────────┼───┘
                                   │              │              │
                         Google OAuth       MongoDB Atlas    Cloudinary
                         (sign-in)          (Mongoose)       (image upload/CDN)
```

**Layers:**

1. **Presentation**: `app/**/page.jsx` (routes) and `components/*.jsx` (UI pieces).
2. **Reads**: `utils/queries.js`, plain async functions called by Server Components. They are *not* Server Actions, so they are never exposed as endpoints. They return plain, JSON-serialised objects (ids and dates as strings) that can be passed to Client Components.
3. **Mutations**: `app/actions/{recipes,bookmarks,messages}.js` (`'use server'`), called from Client Components or as `<form action>`.
4. **Domain/data**: `models/*.js`, the Mongoose schemas for User, Recipe and Message.
5. **Infrastructure**: `config/database.js` (Mongo connection), `config/cloudinary.js`, `utils/authOptions.js` (NextAuth).

---

## 3. Directory layout

```
recipe-collector/
├── app/                       # Next.js App Router
│   ├── layout.jsx             # Root layout: providers, Navbar, Footer, ToastContainer
│   ├── page.jsx               # Home (Hero, InfoBoxes, carousel of 12 random recipes)
│   ├── loading.jsx            # Global loading spinner
│   ├── not-found.jsx          # 404 page
│   ├── messages/page.jsx      # Inbox (protected)
│   ├── profile/page.jsx       # User profile + own recipes (protected)
│   ├── recipes/
│   │   ├── page.jsx           # All recipes (Server Component)
│   │   ├── add/page.jsx       # Add recipe form (protected)
│   │   ├── saved/page.jsx     # Bookmarked recipes (protected)
│   │   ├── search-results/    # Search results
│   │   └── [id]/
│   │       ├── page.jsx       # Recipe detail
│   │       └── edit/page.jsx  # Edit recipe form
│   ├── actions/               # Server Actions (see §6)
│   └── api/auth/              # NextAuth handler (the only route handler)
├── components/                # React UI components (see §5)
├── config/                    # database.js, cloudinary.js
├── context/GlobalContext.js   # Client-side global state (unread message count)
├── models/                    # Mongoose models: User, Recipe, Message
├── utils/                     # authOptions, getSessionUser, queries (server reads), cloudinaryImages (upload/delete)
├── middleware.js              # NextAuth middleware protecting private routes
├── assets/                    # Bundled images (logo, default profile) + globals.css
├── public/images/             # Static images, incl. seed recipe photos
├── recipes.json               # Sample/seed recipe data (with _id)
├── recipes-import.json        # Same data shaped for a MongoDB import (no _id)
├── next.config.mjs            # standalone output, remote image hosts, Server Action body limit
├── tailwind.config.js / postcss.config.js
├── Dockerfile                 # Multi-stage production image (Node 18, standalone)
├── Dockerfile.original        # Earlier single-stage Dockerfile (Node 22)
├── docker-compose.yml
├── ReadMe.Docker.txt          # Build/push/deploy notes
└── .env.example               # Required environment variables
```

The `@/*` path alias (in `jsconfig.json`) points at the repo root, so imports look like `@/models/Recipe`.

---

## 4. Data model (MongoDB / Mongoose)

All three schemas use `timestamps: true`, which adds `createdAt` and `updatedAt`. Each model is registered with the `models.X || model('X', schema)` pattern, so hot reload and serverless re-invocations don't register it twice.

### User (`models/User.js`)
| Field | Type | Notes |
|---|---|---|
| `email` | String | required, unique |
| `username` | String | required; the Google display name cut to 20 characters |
| `image` | String | Google profile picture URL |
| `bookmarks` | [ObjectId → Recipe] | saved recipes |

### Recipe (`models/Recipe.js`)
| Field | Type | Notes |
|---|---|---|
| `owner` | ObjectId → User | required |
| `name` | String | required |
| `type` | String | required; main ingredient (Chicken, Beef, Fish, Mutton, Venison, Pork, Other) |
| `category` | String | required; cuisine (American, Chinese, Cuban, French, Greek, Japanese, Indian, Italian, Mexican, Thai, Other) |
| `description`, `url`, `directions` | String | `url` links to the original source; `directions` is split on newlines for display |
| `starRating` | String | default `'1'` |
| `images` | [String] | Cloudinary `https` URLs, or bare file names for seed images under `/images/recipes/` |
| `isFeatured` | Boolean | default false (stored but not used by the UI yet) |
| `prepTime`, `cookTime`, `totalTime`, `servings` | Number | default 0 |
| `nutritionInfo` | `{calories, fat, carbs, protein, sugars}` | Numbers, default 0 |
| `ingredients` | [String] | one entry per line of the form textarea |

### Message (`models/Message.js`)
| Field | Type | Notes |
|---|---|---|
| `sender`, `recipient` | ObjectId → User | required |
| `property` | ObjectId → Recipe | required; the recipe the message is about (the field name is left over from a template project) |
| `name`, `email` | String | required; sender contact details |
| `phone`, `body` | String | optional |
| `read` | Boolean | default false |

**Relationships:** User 1─* Recipe (`owner`), User *─* Recipe (`bookmarks`), and Message links sender, recipient and recipe.

### Database connection
`config/database.js` keeps a module-level `connected` flag and calls `mongoose.connect(MONGODB_URI)` only once per server process. Every query and Server Action calls `await connectDB()` before it touches a model.

---

## 5. Front end

### Root layout and providers
`app/layout.jsx` wraps the whole app in:

1. `GlobalProvider` (`context/GlobalContext.js`): React context holding `unreadCount` / `setUnreadCount`. The layout loads the signed-in user's unread count on the server and passes it in as `initialUnreadCount`.
2. `AuthProvider` (`components/AuthProvider.jsx`): NextAuth `SessionProvider`, which makes `useSession()` available.
3. The page itself, between `Navbar`, `Footer` and `ToastContainer`.

### Rendering strategy
Every page is a Server Component that loads its data with `utils/queries.js`; interactive parts are Client Components that call Server Actions. All routes are dynamic (the root layout is `force-dynamic`), so nothing is prerendered at build time.

| Route | Reads (`utils/queries`) | Mutations (`app/actions`) |
|---|---|---|
| `/` | `getRecipes()` in `HomeRecipes`, shuffled; shows 12 | |
| `/recipes` | `getRecipes()`, sorted by name | |
| `/recipes/[id]` | `getRecipeById()`, `isRecipeBookmarked()` | `toggleBookmark`, `sendMessage` |
| `/recipes/[id]/edit` | `getRecipeById()`; non-owners are redirected to the recipe | `updateRecipe` |
| `/recipes/add` | | `addRecipe` |
| `/recipes/saved` | `getBookmarkedRecipes()` | |
| `/recipes/search-results` | `searchRecipes()` from `searchParams` | |
| `/profile` | `getRecipesByOwner()` | `deleteRecipe` (in `ProfileRecipes`) |
| `/messages` | `getMessages()` | `toggleMessageRead`, `deleteMessage` |

Query functions catch their own errors and return `[]`, `null`, `false` or `0`, so a database failure renders an empty page instead of crashing.

### Key components
| Component | Responsibility |
|---|---|
| `Navbar` | Logo, nav links, Google sign-in/out (`getProviders`, `signIn`, `signOut`), profile menu, unread badge, mobile menu |
| `UnreadMessageCount` | Shows the unread count from GlobalContext (seeded by the layout) |
| `Hero`, `InfoBoxes`, `InfoBox`, `Footer` | Static marketing/landing UI |
| `HomeRecipes` | Async server component; carousel of 12 random recipes |
| `RecipeCard` | Card with image, category, name, star rating, macros and a "Details" link. Picks a Cloudinary URL or a local `/images/recipes/` path |
| `RecipeSearchForm` | Keyword plus cuisine filter; routes to `/recipes/search-results?searchCriteria=&recipeType=` |
| `RecipeHeaderImage`, `RecipeImages` | Hero image and gallery on the detail page |
| `RecipeDetails` (+ `.css`) | Full recipe view: print button, copy ingredients to clipboard, nutrition, ingredients, directions, tooltips |
| `BookmarButton` | Starts from `initialIsBookmarked` (resolved by the page) and toggles with `toggleBookmark` |
| `ShareButtons` | Facebook, Twitter/X, WhatsApp and Email share (react-share) |
| `RecipeContactForm` | Sends a message to the recipe owner with `sendMessage` |
| `RecipeAddForm` / `RecipeEditForm` | Controlled forms for every recipe field, submitted with `<form action>` + `useFormState` (`addRecipe` / `updateRecipe.bind(null, id)`); errors show as a toast. Nested fields use dotted names such as `nutritionInfo.calories`. At most 2 images |
| `SubmitButton` | `useFormStatus` submit button that disables itself while the action (e.g. image upload) runs |
| `ProfileRecipes` | The profile page's recipe list with Edit links and `deleteRecipe` buttons |
| `Messages` / `Message` | Inbox list; mark read/unread and delete, updating the unread count in context |
| `Spinner`, `Tooltip` | Shared UI helpers |

The add form uses a `mounted` flag so it only renders on the client, which avoids hydration warnings. The edit form gets its initial values from the server as a prop.

---

## 6. Server Actions (`app/actions`)

Server Actions are public POST endpoints, so **every action checks the session itself** (`getSessionUser()`) and, where relevant, ownership. They never throw for expected failures; they return `{ error }` for the caller to show as a toast. Success shapes are listed below. Each action calls `revalidatePath` so the affected pages re-render with fresh data.

| Action | Auth | Returns | Purpose |
|---|---|---|---|
| `addRecipe(prevState, formData)` | Yes | redirect / `{ error }` | Create a recipe from the form, upload up to 2 images to Cloudinary (`RecipeApp` folder), then **redirect** to `/recipes/:id` |
| `updateRecipe(id, prevState, formData)` | Owner only | redirect / `{ error }` | Update recipe fields. New images, if any, replace the old ones, which are then deleted from Cloudinary |
| `deleteRecipe(id)` | Owner only | `{ ok }` | Delete a recipe and its Cloudinary images, remove it from all bookmarks, and delete messages about it |
| `toggleBookmark(recipeId)` | Yes | `{ message, isBookmarked }` | Push or pull the recipe id in `user.bookmarks` |
| `sendMessage({ recipeId, name, email, phone, message })` | Yes | `{ message }` | Message a recipe's owner. The recipient is looked up from the recipe, not trusted from the client; you can't message yourself |
| `toggleMessageRead(id)` | Recipient only | `{ read }` | Toggle `read` |
| `deleteMessage(id)` | Recipient only | `{ ok }` | Delete a message |

Server Action request bodies are limited to 10 MB (`experimental.serverActions.bodySizeLimit` in `next.config.mjs`; the Next default of 1 MB is too small for photos). Vercel caps request bodies at 4.5 MB regardless.

The only remaining route handler is `/api/auth/[...nextauth]` (NextAuth, Google OAuth).

---

## 7. Authentication and authorisation

- **Provider:** Google OAuth through NextAuth (`utils/authOptions.js`), requested with `prompt=consent` and `access_type=offline`.
- **`signIn` callback:** on first sign-in, creates a `User` document from the Google profile (email, name cut to 20 characters, picture).
- **`session` callback:** looks up the user by email and adds the Mongo `_id` to `session.user.id`. Both the client and the API rely on this field.
- **Session strategy:** NextAuth default (JWT cookie). `NEXTAUTH_SECRET` signs it.
- **Route protection:** `middleware.js` re-exports `next-auth/middleware` for `/recipes/add`, `/profile`, `/recipes/saved` and `/messages`. Anonymous users are sent to sign in.
- **Action protection:** `utils/getSessionUser.js` wraps `getServerSession(authOptions)` and returns `{ user, userId }` or `null`. Server Actions check ownership: `recipe.owner === userId` for recipes and `message.recipient === userId` for messages.

> `/recipes/[id]/edit` is **not** in the middleware matcher. The page itself redirects anyone who isn't the owner back to the recipe, and `updateRecipe` checks ownership again.

---

## 8. Key flows

### Add a recipe
1. A signed-in user opens `/recipes/add` (the middleware checks the session).
2. `RecipeAddForm` submits to the `addRecipe` Server Action (`<form action>`); `SubmitButton` shows "Adding Recipe..." while it runs.
3. The action reads `FormData` and turns the ingredients textarea into an array with `utils/parseIngredients.js`, one item per non-blank line. It uploads up to 2 images to Cloudinary in parallel through `utils/cloudinaryImages.js`, then saves the `Recipe` with the returned `secure_url`s.
4. It calls `redirect('/recipes/:id')`, so the browser lands on the new recipe. On failure it returns `{ error }`, which the form shows as a toast.

### View a recipe
1. `/recipes/[id]` (Server Component) loads the recipe and whether the viewer bookmarked it, then renders the header image, `RecipeDetails`, and a sidebar with the bookmark button, share buttons and contact form, followed by the image gallery.

### Bookmark
1. `BookmarButton` starts from the server-resolved state. A click calls `toggleBookmark`, which pushes or pulls the recipe id in `user.bookmarks`. A toast shows the result.

### Messaging
1. A visitor fills in `RecipeContactForm`, which calls `sendMessage`; the action sets `recipient` to the recipe's owner.
2. In the owner's navbar, `UnreadMessageCount` shows a badge using GlobalContext, seeded on the server by the layout.
3. On `/messages`, the owner can mark a message read or unread, or delete it. Each action updates the shared count straight away.

### Search
1. `RecipeSearchForm` sends the user to `/recipes/search-results?searchCriteria=…&recipeType=…`.
2. That page (Server Component) calls `searchRecipes()`, which runs a case-insensitive, regex-escaped `$or` query on name, description, type, ingredients and directions, plus an optional `category` filter unless `All`.

---

## 9. Configuration

Environment variables (see `.env.example`):

| Variable | Used by |
|---|---|
| `MONGODB_URI` | `config/database.js` |
| `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` | NextAuth Google provider |
| `NEXTAUTH_URL`, `NEXTAUTH_URL_INTERNAL`, `NEXTAUTH_SECRET` | NextAuth |
| `NEXT_PUBLIC_DOMAIN` | Absolute URLs (e.g. share links) |
| `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` | `config/cloudinary.js` |
| `APP_PORT` | docker-compose port mapping (default 9000) |

`next.config.mjs` sets:
- `output: "standalone"`, which the Docker image needs
- `images.remotePatterns` for `lh3.googleusercontent.com` (Google avatars) and `res.cloudinary.com`
- `experimental.serverActions.bodySizeLimit: "10mb"` so recipe photos fit in a Server Action request

---

## 10. Build, run and deploy

**Local development**
```bash
npm install
cp .env.example .env    # fill in secrets
npm run dev             # http://localhost:9000
```
Other scripts: `npm run build`, `npm start`, `npm run lint`.

**Docker** (`Dockerfile`, multi-stage on `node:18-alpine`)
1. `deps`: installs dependencies from whichever lockfile is present.
2. `builder`: runs `next build`.
3. `runner`: copies `.next/standalone`, `.next/static` and `public`, runs as the non-root `nextjs` user, and starts `node server.js` on port 9000.

```bash
docker build . --platform linux/amd64 -t recipe-collector
docker run --env-file .env -p 9000:9000 recipe-collector
```

**Hosting targets** (from `ReadMe.Docker.txt`):
- **Vercel:** the main deployment. The root layout sets `export const dynamic = 'force-dynamic'`, so no page touches the database at build time.
- **VPS:** the image is pushed to GitHub Container Registry (`ghcr.io`), pulled on the VPS, and run with an `.env` file copied over separately.

**Seed data:** `recipes-import.json` can be loaded into the `recipes` collection (e.g. with `mongoimport`). The image file names in it resolve to `public/images/recipes/`.

---

## 11. Design notes and known issues

Things found while reviewing the code that are worth tracking:

**Security**
- `ReadMe.Docker.txt` contains a live-looking GitHub personal access token and a server address in plain text. It's in git history, so revoke the token and remove the file or the secret.

**Bugs**
- None currently known.

**Structure**
- There are two lockfiles (`package-lock.json` and `bun.lock`), no automated tests, and the package name in `package.json` is `recepi-app`.
- `Message.property` would be clearer renamed to `recipe`.
