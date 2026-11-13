# Recipe Collector: Architecture, Design and Function

## 1. Overview

Recipe Collector is a full-stack web app for collecting and sharing recipes. Signed-in users can:

- Browse and search a shared recipe catalogue
- Add recipes, with up to two photos each
- Edit and delete their own recipes
- Bookmark ("save") recipes from other users
- Share recipes on social media, print them, and copy their ingredient lists
- Send messages to a recipe's owner and manage their own inbox

The app is one **Next.js 14 (App Router)** project. The React UI and the REST API live in the same codebase and are deployed as a single unit.

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
  React client  ───►│  app/ (pages)            app/api/ (routes)    │
  components        │   ├─ Server Components ──► fetch(API) ──┐      │
  (useSession,      │   └─ Client Components ──► fetch(/api) ─┤      │
   fetch /api)      │                                         ▼      │
                    │  middleware.js (NextAuth route guard)  Route   │
                    │                                        handlers│
                    │  utils/authOptions ◄── getSessionUser ◄─┤      │
                    └──────────────┬──────────────┬───────────┼──────┘
                                   │              │           │
                         Google OAuth       MongoDB Atlas   Cloudinary
                         (sign-in)          (Mongoose)      (image upload/CDN)
```

**Layers:**

1. **Presentation**: `app/**/page.jsx` (routes) and `components/*.jsx` (UI pieces).
2. **API**: `app/api/**/route.js`, the Next.js Route Handlers that expose REST endpoints.
3. **Domain/data**: `models/*.js`, the Mongoose schemas for User, Recipe and Message.
4. **Infrastructure**: `config/database.js` (Mongo connection), `config/cloudinary.js`, `utils/authOptions.js` (NextAuth).

All persistence goes through the API layer. Even Server Components fetch data over HTTP from the app's own API (see `utils/requests.js`) instead of querying Mongoose directly.

---

## 3. Directory layout

```
recipe-collector/
├── app/                       # Next.js App Router
│   ├── layout.jsx             # Root layout: providers, Navbar, Footer, ToastContainer
│   ├── page.jsx               # Home (Hero, InfoBoxes, 3 random recipes)
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
│   └── api/                   # REST API (see §6)
├── components/                # React UI components (see §5)
├── config/                    # database.js, cloudinary.js
├── context/GlobalContext.js   # Client-side global state (unread message count)
├── models/                    # Mongoose models: User, Recipe, Message
├── utils/                     # authOptions, getSessionUser, requests (fetch helpers), cloudinaryImages (upload/delete)
├── middleware.js              # NextAuth middleware protecting private routes
├── assets/                    # Bundled images (logo, default profile) + globals.css
├── public/images/             # Static images, incl. seed recipe photos
├── recipes.json               # Sample/seed recipe data (with _id)
├── recipes-import.json        # Same data shaped for a MongoDB import (no _id)
├── next.config.mjs            # standalone output, remote image hosts, CORS headers
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
`config/database.js` keeps a module-level `connected` flag and calls `mongoose.connect(MONGODB_URI)` only once per server process. Every route handler calls `await connectDB()` before it touches a model.

---

## 5. Front end

### Root layout and providers
`app/layout.jsx` wraps the whole app in:

1. `GlobalProvider` (`context/GlobalContext.js`): React context holding `unreadCount` / `setUnreadCount`.
2. `AuthProvider` (`components/AuthProvider.jsx`): NextAuth `SessionProvider`, which makes `useSession()` available.
3. The page itself, between `Navbar`, `Footer` and `ToastContainer`.

### Rendering strategy
| Route | Rendering | Data source |
|---|---|---|
| `/` | Server Component (`HomeRecipes` is async) | `fetchRecipes()`, then shuffled; shows 3 |
| `/recipes` | Server Component | `fetchRecipes()`, sorted by name |
| `/recipes/[id]` | Client Component | `fetchRecipe(id)` |
| `/recipes/[id]/edit` | Client form | `fetchRecipe(id)`, then `PUT /api/recipes/:id` |
| `/recipes/add` | Client form | native `<form action="/api/recipes" method="POST">` (multipart) |
| `/recipes/saved` | Client Component | `GET /api/bookmarks` |
| `/recipes/search-results` | Client Component | `GET /api/recipes/search?...` |
| `/profile` | Client Component | `GET /api/recipes/user/:id`, `DELETE /api/recipes/:id` |
| `/messages` | Client Component | `GET /api/messages`, `PUT`/`DELETE /api/messages/:id` |

`utils/requests.js` builds absolute URLs from `NEXT_PUBLIC_API_DOMAIN`. If that variable isn't set, as can happen during build, it returns `[]` or `null` instead of throwing. The recipe-list fetch uses `cache: 'no-store'` so the catalogue is always fresh.

### Key components
| Component | Responsibility |
|---|---|
| `Navbar` | Logo, nav links, Google sign-in/out (`getProviders`, `signIn`, `signOut`), profile menu, unread badge, mobile menu |
| `UnreadMessageCount` | Fetches `/api/messages/unread-count` and stores it in GlobalContext |
| `Hero`, `InfoBoxes`, `InfoBox`, `Footer` | Static marketing/landing UI |
| `HomeRecipes` | Async server component; 3 random recipe cards |
| `RecipeCard` | Card with image, category, name, star rating, macros and a "Details" link. Picks a Cloudinary URL or a local `/images/recipes/` path |
| `RecipeSearchForm` | Keyword plus cuisine filter; routes to `/recipes/search-results?searchCriteria=&recipeType=` |
| `RecipeHeaderImage`, `RecipeImages` | Hero image and gallery on the detail page |
| `RecipeDetails` (+ `.css`) | Full recipe view: print button, copy ingredients to clipboard, nutrition, ingredients, directions, tooltips |
| `BookmarButton` | Checks the bookmark state (`POST /api/bookmarks/check`) and toggles it (`POST /api/bookmarks`) |
| `ShareButtons` | Facebook, Twitter/X, WhatsApp and Email share (react-share) |
| `RecipeContactForm` | Sends a message to the recipe owner (`POST /api/messages`) |
| `RecipeAddForm` / `RecipeEditForm` | Controlled forms for every recipe field. Nested fields use dotted names such as `nutritionInfo.calories`. Add allows at most 2 images |
| `Messages` / `Message` | Inbox list; mark read/unread and delete, updating the unread count in context |
| `Spinner`, `Tooltip` | Shared UI helpers |

The add and edit forms use a `mounted` flag so they only render on the client, which avoids hydration warnings.

---

## 6. API reference (`app/api`)

Every handler returns a plain `Response` with a JSON body. "Auth" means the handler calls `getSessionUser()` and returns 401 (or 400) when nobody is signed in.

| Method | Path | Auth | Purpose |
|---|---|---|---|
| GET/POST | `/api/auth/[...nextauth]` | n/a | NextAuth handler (Google OAuth) |
| GET | `/api/recipes` | No | List all recipes |
| POST | `/api/recipes` | Yes | Create a recipe from multipart form data, upload images to Cloudinary (`RecipeApp` folder), then **redirect** to `/recipes/:id` |
| GET | `/api/recipes/:id` | No | Get one recipe (404 if missing) |
| PUT | `/api/recipes/:id` | Yes, owner only | Update recipe fields from form data. New images, if any are uploaded, replace the old ones, which are then deleted from Cloudinary |
| DELETE | `/api/recipes/:id` | Yes, owner only | Delete a recipe and its Cloudinary images, remove it from all bookmarks, and delete messages about it |
| GET | `/api/recipes/user/:userId` | No | Recipes owned by a user |
| GET | `/api/recipes/search?searchCriteria=&recipeType=` | No | Case-insensitive match (input is regex-escaped) on name, description, type, ingredients and directions; optional `category` filter unless `All` |
| GET | `/api/bookmarks` | Yes | The current user's bookmarked recipes |
| POST | `/api/bookmarks` | Yes | Toggle a bookmark `{ recipeId }` and return `{ message, isBookmarked }` |
| POST | `/api/bookmarks/check` | Yes | Return `{ isBookmarked }` for `{ recipeId }` |
| GET | `/api/messages` | Yes | The current user's inbox, unread first, newest first, with sender username and recipe name populated |
| POST | `/api/messages` | Yes | Send a message `{ name, email, phone, message, recipe, recipient }`; you can't message yourself |
| PUT | `/api/messages/:id` | Yes, recipient only | Toggle `read` |
| DELETE | `/api/messages/:id` | Yes, recipient only | Delete a message |
| GET | `/api/messages/unread-count` | Yes | Count of unread messages |

`next.config.mjs` adds permissive CORS headers to every `/api/*` route.

---

## 7. Authentication and authorisation

- **Provider:** Google OAuth through NextAuth (`utils/authOptions.js`), requested with `prompt=consent` and `access_type=offline`.
- **`signIn` callback:** on first sign-in, creates a `User` document from the Google profile (email, name cut to 20 characters, picture).
- **`session` callback:** looks up the user by email and adds the Mongo `_id` to `session.user.id`. Both the client and the API rely on this field.
- **Session strategy:** NextAuth default (JWT cookie). `NEXTAUTH_SECRET` signs it.
- **Route protection:** `middleware.js` re-exports `next-auth/middleware` for `/recipes/add`, `/profile`, `/recipes/saved` and `/messages`. Anonymous users are sent to sign in.
- **API protection:** `utils/getSessionUser.js` wraps `getServerSession(authOptions)` and returns `{ user, userId }` or `null`. Mutating endpoints check ownership: `recipe.owner === userId` for recipes and `message.recipient === userId` for messages.

> `/recipes/[id]/edit` is **not** in the middleware matcher. The page loads for anonymous users, but the `PUT` endpoint still enforces ownership.

---

## 8. Key flows

### Add a recipe
1. A signed-in user opens `/recipes/add` (the middleware checks the session).
2. `RecipeAddForm` submits as a native multipart `POST /api/recipes`.
3. The handler reads `FormData` and turns the ingredients textarea into an array with `utils/parseIngredients.js`, one item per non-blank line. It uploads up to 2 images to Cloudinary in parallel through `utils/cloudinaryImages.js`, then saves the `Recipe` with the returned `secure_url`s.
4. It returns a 303 redirect to `/recipes/:id`, based on `NEXTAUTH_URL` or the request origin if that isn't set, so the browser lands on the new recipe.

### View a recipe
1. `/recipes/[id]` (client) calls `fetchRecipe(id)`, then renders the header image, `RecipeDetails`, and a sidebar with the bookmark button, share buttons and contact form, followed by the image gallery.

### Bookmark
1. On mount, `BookmarButton` calls `POST /api/bookmarks/check`. A click calls `POST /api/bookmarks`, which pushes or pulls the recipe id in `user.bookmarks`. A toast shows the result.

### Messaging
1. A visitor fills in `RecipeContactForm`, which sends `POST /api/messages` with `recipient = recipe.owner`.
2. In the owner's navbar, `UnreadMessageCount` shows a badge using GlobalContext.
3. On `/messages`, the owner can mark a message read or unread, or delete it. Each action updates the shared count straight away.

### Search
1. `RecipeSearchForm` sends the user to `/recipes/search-results?searchCriteria=…&recipeType=…`.
2. That page calls `GET /api/recipes/search`, which runs a `$or` regex query plus an optional `category` filter.

---

## 9. Configuration

Environment variables (see `.env.example`):

| Variable | Used by |
|---|---|
| `MONGODB_URI` | `config/database.js` |
| `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` | NextAuth Google provider |
| `NEXTAUTH_URL`, `NEXTAUTH_URL_INTERNAL`, `NEXTAUTH_SECRET` | NextAuth; `NEXTAUTH_URL` is also the base for the post-create redirect |
| `NEXT_PUBLIC_DOMAIN` | Absolute URLs (e.g. share links) |
| `NEXT_PUBLIC_API_DOMAIN` | `utils/requests.js` base URL for API calls |
| `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` | `config/cloudinary.js` |
| `APP_PORT` | docker-compose port mapping (default 9000) |

`next.config.mjs` sets:
- `output: "standalone"`, which the Docker image needs
- `images.remotePatterns` for `lh3.googleusercontent.com` (Google avatars) and `res.cloudinary.com`
- CORS headers on `/api/:path*`

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
- **Vercel:** the main deployment. Route handlers that read the session set `export const dynamic = 'force-dynamic'` so the Vercel build doesn't fail.
- **VPS:** the image is pushed to GitHub Container Registry (`ghcr.io`), pulled on the VPS, and run with an `.env` file copied over separately.

**Seed data:** `recipes-import.json` can be loaded into the `recipes` collection (e.g. with `mongoimport`). The image file names in it resolve to `public/images/recipes/`.

---

## 11. Design notes and known issues

Things found while reviewing the code that are worth tracking:

**Security**
- `ReadMe.Docker.txt` contains a live-looking GitHub personal access token and a server address in plain text. It's in git history, so revoke the token and remove the file or the secret.
- The CORS setup combines `Access-Control-Allow-Origin: *` with `Allow-Credentials: true`. Browsers reject that pairing for credentialed requests, and it's broader than a same-origin app needs.

**Bugs**
- None currently known.

**Structure**
- Server Components call the app's own API over HTTP. This adds a network hop and needs `NEXT_PUBLIC_API_DOMAIN` at build time. Querying Mongoose directly would be simpler.
- There are two lockfiles (`package-lock.json` and `bun.lock`), no automated tests, and the package name in `package.json` is `recepi-app`.
- `Message.property` would be clearer renamed to `recipe`.
