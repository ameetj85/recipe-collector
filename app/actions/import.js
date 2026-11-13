'use server';

// "Import" on the add-recipe form: fetch an Allrecipes page on the server and
// return the recipe fields found in it. Server Actions are public endpoints,
// so this requires a session (it must not become an open fetch proxy) and
// only ever requests https://www.allrecipes.com URLs.
import { getSessionUser } from '@/utils/getSessionUser';
import { toImportUrl, parseRecipePage, IMPORT_HOSTS } from '@/utils/recipeImport';

const FETCH_TIMEOUT_MS = 15_000;
const MAX_PAGE_BYTES = 5 * 1024 * 1024;
const MAX_REDIRECTS = 3;

// Read the body, giving up past MAX_PAGE_BYTES.
async function readLimited(response) {
  const reader = response.body.getReader();
  const chunks = [];
  let total = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.length;
    if (total > MAX_PAGE_BYTES) {
      await reader.cancel();
      throw new Error('page too large');
    }
    chunks.push(value);
  }
  return Buffer.concat(chunks).toString('utf8');
}

// Fetch the page, following redirects manually so they can't leave Allrecipes.
async function fetchPage(startUrl) {
  let url = startUrl;
  for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
    const response = await fetch(url, {
      redirect: 'manual',
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      headers: { Accept: 'text/html' },
    });

    if (response.status >= 300 && response.status < 400) {
      const next = new URL(response.headers.get('location') || '', url);
      if (next.protocol !== 'https:' || !IMPORT_HOSTS.includes(next.hostname)) {
        return { error: 'The page redirected away from Allrecipes.' };
      }
      url = next.href;
      continue;
    }

    if (!response.ok) {
      await response.body?.cancel();
      if (response.status === 404) return { error: 'That Allrecipes page was not found.' };
      if (response.status === 403 || response.status === 429) {
        return {
          error: `Allrecipes blocked the request (HTTP ${response.status}). Paste the page source instead.`,
        };
      }
      return { error: `Allrecipes returned HTTP ${response.status}.` };
    }

    return { html: await readLimited(response) };
  }
  return { error: 'Too many redirects.' };
}

// Returns { fields, missing } (fields: name, description, starRating,
// prepTime, cookTime, totalTime, servings, ingredients[], directions,
// nutritionInfo{}) or { error, canPaste }. canPaste is true when the page
// couldn't be fetched or read, so the form offers the paste-the-page-source
// fallback (parsed in the browser with the same parseRecipePage).
export async function importRecipeFromUrl(rawUrl) {
  const sessionUser = await getSessionUser();
  if (!sessionUser?.userId) {
    return { error: 'You must be signed in to import a recipe.' };
  }

  const url = toImportUrl(rawUrl);
  if (!url) {
    return { error: 'Import only works with www.allrecipes.com recipe URLs.' };
  }

  try {
    const { html, error } = await fetchPage(url);
    if (error) return { error, canPaste: true };

    const result = parseRecipePage(html);
    if (!result) {
      return { error: 'No recipe data was found on that page.', canPaste: true };
    }
    return result;
  } catch (error) {
    console.error(`Recipe import failed for ${url}:`, error);
    return {
      error:
        error?.name === 'TimeoutError'
          ? 'Allrecipes took too long to respond.'
          : 'Could not import that page.',
      canPaste: true,
    };
  }
}
