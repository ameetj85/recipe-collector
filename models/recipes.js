// Recipe data access (SQLite). Functions return the same JSON shape the
// Mongoose models used to produce (see docs/SQLITE_MIGRATION.md §2.1), so
// pages and components didn't need to change.
//
// Image BLOBs are never selected here; list queries read only the image ids /
// seed file names.
import { getDb } from '../config/database.js';
import { newId } from '../utils/ids.js';

export const imageUrl = (imageRow) =>
  imageRow.seed_file ? imageRow.seed_file : `/api/images/${imageRow.id}`;

export function serializeRecipe(row, imageRows = []) {
  return {
    _id: row.id,
    owner: row.owner_id,
    name: row.name,
    type: row.type,
    description: row.description ?? '',
    url: row.url ?? '',
    starRating: row.star_rating,
    category: row.category,
    images: [...imageRows]
      .sort((a, b) => a.position - b.position)
      .map(imageUrl),
    isFeatured: row.is_featured === 1,
    prepTime: row.prep_time,
    cookTime: row.cook_time,
    totalTime: row.total_time,
    servings: row.servings,
    nutritionInfo: {
      calories: row.calories,
      fat: row.fat,
      carbs: row.carbs,
      protein: row.protein,
      sugars: row.sugars,
    },
    ingredients: JSON.parse(row.ingredients || '[]'),
    directions: row.directions ?? '',
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// Attach image references to a list of recipe rows with a single query.
function withImages(rows) {
  if (rows.length === 0) return [];

  const ids = rows.map((r) => r.id);
  const imageRows = getDb()
    .prepare(
      `SELECT id, recipe_id, position, seed_file FROM recipe_images
       WHERE recipe_id IN (SELECT value FROM json_each(?))
       ORDER BY recipe_id, position`
    )
    .all(JSON.stringify(ids));

  const byRecipe = new Map();
  for (const img of imageRows) {
    if (!byRecipe.has(img.recipe_id)) byRecipe.set(img.recipe_id, []);
    byRecipe.get(img.recipe_id).push(img);
  }

  return rows.map((row) => serializeRecipe(row, byRecipe.get(row.id) || []));
}

export function listAll() {
  return withImages(
    getDb().prepare('SELECT * FROM recipes ORDER BY created_at').all()
  );
}

export function findById(id) {
  const row = getDb().prepare('SELECT * FROM recipes WHERE id = ?').get(id);
  return row ? withImages([row])[0] : null;
}

// Owner id only (for ownership checks without loading the whole recipe).
export function findOwnerId(id) {
  const row = getDb().prepare('SELECT owner_id FROM recipes WHERE id = ?').get(id);
  return row ? row.owner_id : null;
}

export function findByOwner(ownerId) {
  return withImages(
    getDb()
      .prepare('SELECT * FROM recipes WHERE owner_id = ? ORDER BY created_at')
      .all(ownerId)
  );
}

export function findByIds(ids) {
  if (ids.length === 0) return [];
  return withImages(
    getDb()
      .prepare(
        `SELECT * FROM recipes WHERE id IN (SELECT value FROM json_each(?))
         ORDER BY created_at`
      )
      .all(JSON.stringify(ids))
  );
}

// Escape LIKE wildcards so user input is matched literally.
const escapeLike = (str) => str.replace(/[\\%_]/g, (c) => `\\${c}`);

// Case-insensitive substring match on name, description, type, directions and
// any ingredient; optional cuisine (category) substring filter.
export function search({ criteria = '', category = null } = {}) {
  const p = `%${escapeLike(criteria)}%`;
  const cat = category ? `%${escapeLike(category)}%` : null;

  const rows = getDb()
    .prepare(
      `SELECT * FROM recipes r
       WHERE (r.name LIKE @p ESCAPE '\\' OR r.description LIKE @p ESCAPE '\\'
              OR r.type LIKE @p ESCAPE '\\' OR r.directions LIKE @p ESCAPE '\\'
              OR EXISTS (SELECT 1 FROM json_each(r.ingredients)
                         WHERE value LIKE @p ESCAPE '\\'))
         AND (@cat IS NULL OR r.category LIKE @cat ESCAPE '\\')
       ORDER BY r.created_at`
    )
    .all({ p, cat });

  return withImages(rows);
}

// Columns written from recipe data (as built by app/actions/recipes.js).
const toColumns = (data) => ({
  name: data.name,
  type: data.type,
  description: data.description,
  url: data.url,
  star_rating: data.starRating ?? '1',
  category: data.category,
  is_featured: data.isFeatured,
  prep_time: data.prepTime,
  cook_time: data.cookTime,
  total_time: data.totalTime,
  servings: data.servings,
  calories: data.nutritionInfo.calories,
  fat: data.nutritionInfo.fat,
  carbs: data.nutritionInfo.carbs,
  protein: data.nutritionInfo.protein,
  sugars: data.nutritionInfo.sugars,
  ingredients: JSON.stringify(data.ingredients ?? []),
  directions: data.directions,
});

function insertImages(db, recipeId, processedImages, now) {
  const insert = db.prepare(
    `INSERT INTO recipe_images
       (id, recipe_id, position, mime_type, data, byte_size, width, height, created_at)
     VALUES (@id, @recipe_id, @position, @mime_type, @data, @byte_size, @width, @height, @created_at)`
  );
  processedImages.forEach((img, position) => {
    insert.run({
      id: newId(),
      recipe_id: recipeId,
      position,
      mime_type: img.mimeType,
      data: img.data,
      byte_size: img.byteSize,
      width: img.width,
      height: img.height,
      created_at: now,
    });
  });
}

// Create a recipe and its images in one transaction. `processedImages` are
// the results of processImage() — all async work happens before this call,
// because better-sqlite3 transactions are synchronous. Returns the new id.
export function create(ownerId, data, processedImages = []) {
  const db = getDb();
  const id = newId();
  const now = new Date().toISOString();

  db.transaction(() => {
    db.prepare(
      `INSERT INTO recipes
         (id, owner_id, name, type, description, url, star_rating, category,
          is_featured, prep_time, cook_time, total_time, servings,
          calories, fat, carbs, protein, sugars, ingredients, directions,
          created_at, updated_at)
       VALUES
         (@id, @owner_id, @name, @type, @description, @url, @star_rating, @category,
          @is_featured, @prep_time, @cook_time, @total_time, @servings,
          @calories, @fat, @carbs, @protein, @sugars, @ingredients, @directions,
          @created_at, @updated_at)`
    ).run({
      ...toColumns(data),
      id,
      owner_id: ownerId,
      created_at: now,
      updated_at: now,
    });
    insertImages(db, id, processedImages, now);
  })();

  return id;
}

// Update a recipe. If `processedImages` is non-empty they replace all existing
// images (old rows deleted in the same transaction).
export function update(id, data, processedImages = []) {
  const db = getDb();
  const now = new Date().toISOString();

  db.transaction(() => {
    db.prepare(
      `UPDATE recipes SET
         name = @name, type = @type, description = @description, url = @url,
         star_rating = @star_rating, category = @category, is_featured = @is_featured,
         prep_time = @prep_time, cook_time = @cook_time, total_time = @total_time,
         servings = @servings, calories = @calories, fat = @fat, carbs = @carbs,
         protein = @protein, sugars = @sugars, ingredients = @ingredients,
         directions = @directions, updated_at = @updated_at
       WHERE id = @id`
    ).run({ ...toColumns(data), id, updated_at: now });

    if (processedImages.length > 0) {
      db.prepare('DELETE FROM recipe_images WHERE recipe_id = ?').run(id);
      insertImages(db, id, processedImages, now);
    }
  })();
}

// Delete a recipe. Its images, bookmarks and messages go with it through
// ON DELETE CASCADE.
export function remove(id) {
  return getDb().prepare('DELETE FROM recipes WHERE id = ?').run(id).changes > 0;
}
