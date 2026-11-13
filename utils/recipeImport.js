// Parse recipe data out of a recipe web page (used by the "Import" button on
// the add-recipe form, via app/actions/import.js).
//
// Allrecipes (like most recipe sites) embeds a schema.org `Recipe` object as
// JSON-LD in the page for search engines; that is far more stable than
// scraping the visible markup, so it's the only thing parsed here.
// Plain JS with no Next/`@/` imports so it can be tested from Node.

// Hosts the importer accepts. Requests only ever go to IMPORT_ORIGIN.
export const IMPORT_HOSTS = ['www.allrecipes.com', 'allrecipes.com'];
export const IMPORT_ORIGIN = 'https://www.allrecipes.com';

// Returns the URL to fetch (always https://www.allrecipes.com/...) or null if
// the input isn't an Allrecipes URL.
export function toImportUrl(input) {
  let url;
  try {
    url = new URL(String(input).trim());
  } catch {
    return null;
  }
  if (!['http:', 'https:'].includes(url.protocol)) return null;
  if (!IMPORT_HOSTS.includes(url.hostname.toLowerCase())) return null;
  if (url.username || url.password || (url.port && url.port !== '443' && url.port !== '80')) {
    return null;
  }
  return `${IMPORT_ORIGIN}${url.pathname}${url.search}`;
}

const NAMED_ENTITIES = {
  amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ',
  rsquo: '’', lsquo: '‘', rdquo: '”', ldquo: '“',
  ndash: '–', mdash: '—', hellip: '…', deg: '°',
  frac12: '½', frac14: '¼', frac34: '¾', eacute: 'é',
};

// JSON-LD text often still contains HTML entities and the odd tag.
export function cleanText(value) {
  if (value == null) return '';
  return String(value)
    .replace(/<[^>]*>/g, '')
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
    .replace(/&([a-z0-9]+);/gi, (m, name) => NAMED_ENTITIES[name.toLowerCase()] ?? m)
    .replace(/[ \t ]+/g, ' ')
    .trim();
}

// ISO-8601 duration (PT1H30M, P1DT2H, PT90M) -> whole minutes, or null.
export function durationToMinutes(value) {
  const match = /^P(?:(\d+(?:\.\d+)?)D)?(?:T(?:(\d+(?:\.\d+)?)H)?(?:(\d+(?:\.\d+)?)M)?(?:(\d+(?:\.\d+)?)S)?)?$/i.exec(
    String(value ?? '').trim()
  );
  if (!match || match.slice(1).every((part) => part === undefined)) return null;
  const [, d = 0, h = 0, m = 0, s = 0] = match.map((part) => Number(part ?? 0));
  return Math.round(d * 1440 + h * 60 + m + s / 60);
}

// First number in a value such as "268 kcal", "16 g", "4 servings", ["4", "4 servings"].
export function firstNumber(value) {
  const text = Array.isArray(value) ? value.join(' ') : String(value ?? '');
  const match = /\d+(?:\.\d+)?/.exec(text.replace(/,/g, ''));
  return match ? Number(match[0]) : null;
}

// Collect every JSON-LD node in the page (handles arrays and @graph).
function jsonLdNodes(html) {
  const nodes = [];
  const scripts = html.matchAll(
    /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi
  );
  const visit = (value) => {
    if (Array.isArray(value)) value.forEach(visit);
    else if (value && typeof value === 'object') {
      nodes.push(value);
      if (value['@graph']) visit(value['@graph']);
    }
  };
  for (const [, body] of scripts) {
    try {
      visit(JSON.parse(body));
    } catch {
      // ignore malformed blocks
    }
  }
  return nodes;
}

const isRecipe = (node) => [].concat(node['@type'] ?? []).includes('Recipe');

// Directions: strings, HowToStep objects, or HowToSection groups of steps.
function instructionLines(value) {
  const lines = [];
  const visit = (item) => {
    if (!item) return;
    if (typeof item === 'string') {
      item.split(/\r?\n/).forEach((line) => lines.push(cleanText(line)));
    } else if (Array.isArray(item)) {
      item.forEach(visit);
    } else if (item.itemListElement) {
      visit(item.itemListElement);
    } else {
      lines.push(cleanText(item.text ?? item.name));
    }
  };
  visit(value);
  return lines.filter(Boolean);
}

// Extract the add-form fields from a recipe page. Returns { fields, missing }
// or null if the page has no schema.org Recipe data. Only fields that were
// found are included in `fields`; `missing` lists the ones that weren't.
export function parseRecipePage(html) {
  const recipe = jsonLdNodes(html).find(isRecipe);
  if (!recipe) return null;

  const fields = {};
  const missing = [];
  const set = (key, value, label = key) => {
    if (value === null || value === undefined || value === '' || (Array.isArray(value) && !value.length)) {
      missing.push(label);
    } else {
      fields[key] = value;
    }
  };

  set('name', cleanText(recipe.name));
  set('description', cleanText(recipe.description));

  const rating = Number(recipe.aggregateRating?.ratingValue);
  set(
    'starRating',
    Number.isFinite(rating) && rating > 0 ? String(Math.min(5, Math.ceil(rating))) : null,
    'star rating'
  );

  set('prepTime', durationToMinutes(recipe.prepTime), 'prep time');
  set('cookTime', durationToMinutes(recipe.cookTime), 'cook time');
  set('totalTime', durationToMinutes(recipe.totalTime), 'total time');
  set('servings', firstNumber(recipe.recipeYield), 'servings');

  const ingredients = [].concat(recipe.recipeIngredient ?? recipe.ingredients ?? [])
    .map(cleanText)
    .filter(Boolean);
  set('ingredients', ingredients);

  set('directions', instructionLines(recipe.recipeInstructions).join('\n'));

  const n = recipe.nutrition ?? {};
  const nutritionInfo = {
    calories: firstNumber(n.calories),
    fat: firstNumber(n.fatContent),
    carbs: firstNumber(n.carbohydrateContent),
    protein: firstNumber(n.proteinContent),
    sugars: firstNumber(n.sugarContent),
  };
  if (Object.values(nutritionInfo).some((v) => v !== null)) {
    for (const [key, value] of Object.entries(nutritionInfo)) {
      if (value === null) missing.push(key);
    }
    fields.nutritionInfo = Object.fromEntries(
      Object.entries(nutritionInfo).filter(([, v]) => v !== null)
    );
  } else {
    missing.push('nutrition facts');
  }

  return { fields, missing };
}
