'use server';

// Server Actions are public POST endpoints: every exported function must do
// its own session and ownership checks.
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import * as recipes from '@/models/recipes';
import { normalizeId } from '@/utils/ids';
import { getSessionUser } from '@/utils/getSessionUser';
import { processImage } from '@/utils/imageProcessing.mjs';
import { parseIngredients } from '@/utils/parseIngredients';
import { toBool, toNum, toText, FormValueError } from '@/utils/formValues';

const MAX_IMAGES = 2;

// Image File objects from the form, ignoring the empty entry a file input
// submits when nothing is selected. The form limits to 2; enforce it here too.
const getImageFiles = (formData) =>
  formData
    .getAll('images')
    .filter((image) => typeof image === 'object' && image.size > 0)
    .slice(0, MAX_IMAGES);

// sharp's messages when the input itself can't be decoded. Anything else is a
// server-side problem and must not be reported to the user as a bad file.
const UNREADABLE_IMAGE =
  /unsupported image format|Input buffer|corrupt|premature end|bad seek|not a known file format/i;

// Resize/re-encode the uploaded files (see utils/imageProcessing.mjs).
// Throws FormValueError if a file isn't a readable image; other errors
// propagate (and are logged by the caller).
const processImageFiles = async (files) =>
  Promise.all(
    files.map(async (file) => {
      try {
        return await processImage(Buffer.from(await file.arrayBuffer()));
      } catch (error) {
        if (UNREADABLE_IMAGE.test(error?.message || '')) {
          throw new FormValueError(`"${file.name}" is not a supported image.`);
        }
        throw new Error(`Processing "${file.name}" failed: ${error?.message}`, {
          cause: error,
        });
      }
    })
  );

// Build the recipe fields from the add/edit form (nested fields use dotted
// names, e.g. nutritionInfo.calories). Throws FormValueError on bad input.
const recipeFieldsFromForm = (formData) => {
  const name = toText(formData.get('name'))?.trim();
  const type = toText(formData.get('type'));
  const category = toText(formData.get('category'));
  if (!name || !type || !category) {
    throw new FormValueError('Name, cuisine and main ingredient are required.');
  }

  return {
    name,
    type,
    category,
    description: toText(formData.get('description')),
    url: toText(formData.get('url')),
    starRating: toText(formData.get('starRating')) ?? '1',
    isFeatured: toBool(formData.get('isFeatured')),
    prepTime: toNum(formData.get('prepTime'), 'Prep time'),
    cookTime: toNum(formData.get('cookTime'), 'Cook time'),
    totalTime: toNum(formData.get('totalTime'), 'Total time'),
    servings: toNum(formData.get('servings'), 'Servings'),
    directions: toText(formData.get('directions')),
    nutritionInfo: {
      calories: toNum(formData.get('nutritionInfo.calories'), 'Calories'),
      fat: toNum(formData.get('nutritionInfo.fat'), 'Fat'),
      carbs: toNum(formData.get('nutritionInfo.carbs'), 'Carbs'),
      protein: toNum(formData.get('nutritionInfo.protein'), 'Protein'),
      sugars: toNum(formData.get('nutritionInfo.sugars'), 'Sugars'),
    },
    ingredients: parseIngredients(formData.get('ingredients')),
  };
};

// Create a recipe, then redirect to it. Used with useActionState, so it takes
// (prevState, formData) and returns { error } on failure.
export async function addRecipe(prevState, formData) {
  const sessionUser = await getSessionUser();
  if (!sessionUser?.userId) {
    return { error: 'You must be signed in to add a recipe.' };
  }

  let recipeId;
  try {
    const data = recipeFieldsFromForm(formData);
    // all async work first: the DB write below is one synchronous transaction
    const images = await processImageFiles(getImageFiles(formData));
    recipeId = recipes.create(sessionUser.userId, data, images);
  } catch (error) {
    if (error instanceof FormValueError) return { error: error.message };
    console.error('Failed to add recipe:', error);
    return { error: 'Failed to add recipe.' };
  }

  // redirect() throws, so it must stay outside the try/catch.
  revalidatePath('/', 'layout');
  redirect(`/recipes/${recipeId}`);
}

// Update a recipe (owner only), then redirect to it. Bind the id:
// updateRecipe.bind(null, id) gives the (prevState, formData) form action.
// New images, if any, replace the old ones in the same transaction.
export async function updateRecipe(recipeId, prevState, formData) {
  const sessionUser = await getSessionUser();
  if (!sessionUser?.userId) {
    return { error: 'You must be signed in to edit a recipe.' };
  }
  const id = normalizeId(recipeId);
  if (!id) {
    return { error: 'Recipe does not exist!' };
  }

  try {
    const ownerId = recipes.findOwnerId(id);
    if (!ownerId) {
      return { error: 'Recipe does not exist!' };
    }
    if (ownerId !== sessionUser.userId) {
      return { error: 'Permission denied.' };
    }

    const data = recipeFieldsFromForm(formData);
    const images = await processImageFiles(getImageFiles(formData));
    recipes.update(id, data, images);
  } catch (error) {
    if (error instanceof FormValueError) return { error: error.message };
    console.error('Failed to update recipe:', error);
    return { error: 'Failed to update recipe.' };
  }

  revalidatePath('/', 'layout');
  redirect(`/recipes/${id}`);
}

// Delete a recipe (owner only). Its images, bookmarks and messages are removed
// by the database (ON DELETE CASCADE).
export async function deleteRecipe(recipeId) {
  const sessionUser = await getSessionUser();
  if (!sessionUser?.userId) {
    return { error: 'You must be signed in to delete a recipe.' };
  }
  const id = normalizeId(recipeId);
  if (!id) {
    return { error: 'Recipe not found.' };
  }

  try {
    const ownerId = recipes.findOwnerId(id);
    if (!ownerId) {
      return { error: 'Recipe not found.' };
    }
    if (ownerId !== sessionUser.userId) {
      return { error: 'Permission denied.' };
    }

    recipes.remove(id);
  } catch (error) {
    console.error('Failed to delete recipe:', error);
    return { error: 'Failed to delete recipe.' };
  }

  revalidatePath('/', 'layout');
  return { ok: true };
}
