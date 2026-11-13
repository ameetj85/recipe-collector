'use server';

// Server Actions are public POST endpoints: every exported function must do
// its own session and ownership checks.
import { isValidObjectId } from 'mongoose';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import connectDB from '@/config/database';
import Recipe from '@/models/Recipe';
import User from '@/models/User';
import Message from '@/models/Message';
import { getSessionUser } from '@/utils/getSessionUser';
import { uploadImages, deleteImages } from '@/utils/cloudinaryImages';
import { parseIngredients } from '@/utils/parseIngredients';

const MAX_IMAGES = 2;

// Image File objects from the form, ignoring the empty entry a file input
// submits when nothing is selected. The form limits to 2; enforce it here too.
const getImageFiles = (formData) =>
  formData
    .getAll('images')
    .filter((image) => typeof image === 'object' && image.size > 0)
    .slice(0, MAX_IMAGES);

// Build the recipe fields from the add/edit form (nested fields use dotted
// names, e.g. nutritionInfo.calories).
const recipeFieldsFromForm = (formData) => ({
  name: formData.get('name'),
  description: formData.get('description'),
  url: formData.get('url'),
  starRating: formData.get('starRating'),
  category: formData.get('category'),
  type: formData.get('type'),
  isFeatured: formData.get('isFeatured'),
  prepTime: formData.get('prepTime'),
  cookTime: formData.get('cookTime'),
  totalTime: formData.get('totalTime'),
  servings: formData.get('servings'),
  directions: formData.get('directions'),
  nutritionInfo: {
    calories: formData.get('nutritionInfo.calories'),
    fat: formData.get('nutritionInfo.fat'),
    carbs: formData.get('nutritionInfo.carbs'),
    protein: formData.get('nutritionInfo.protein'),
    sugars: formData.get('nutritionInfo.sugars'),
  },
  ingredients: parseIngredients(formData.get('ingredients')),
});

// Create a recipe, then redirect to it. Used with useFormState, so it takes
// (prevState, formData) and returns { error } on failure.
export async function addRecipe(prevState, formData) {
  const sessionUser = await getSessionUser();
  if (!sessionUser?.userId) {
    return { error: 'You must be signed in to add a recipe.' };
  }

  let recipeId;
  try {
    await connectDB();

    const recipe = new Recipe({
      ...recipeFieldsFromForm(formData),
      owner: sessionUser.userId,
      images: await uploadImages(getImageFiles(formData)),
    });
    await recipe.save();
    recipeId = recipe._id.toString();
  } catch (error) {
    console.error('Failed to add recipe:', error);
    return { error: 'Failed to add recipe.' };
  }

  // redirect() throws, so it must stay outside the try/catch.
  revalidatePath('/', 'layout');
  redirect(`/recipes/${recipeId}`);
}

// Update a recipe (owner only), then redirect to it. Bind the id:
// updateRecipe.bind(null, id) gives the (prevState, formData) form action.
// New images, if any, replace the old ones, which are then deleted.
export async function updateRecipe(recipeId, prevState, formData) {
  const sessionUser = await getSessionUser();
  if (!sessionUser?.userId) {
    return { error: 'You must be signed in to edit a recipe.' };
  }
  if (!isValidObjectId(recipeId)) {
    return { error: 'Recipe does not exist!' };
  }

  try {
    await connectDB();

    const existingRecipe = await Recipe.findById(recipeId);
    if (!existingRecipe) {
      return { error: 'Recipe does not exist!' };
    }
    if (existingRecipe.owner.toString() !== sessionUser.userId) {
      return { error: 'Permission denied.' };
    }

    const recipeData = recipeFieldsFromForm(formData);

    const newImageFiles = getImageFiles(formData);
    let oldImagesToDelete = [];
    if (newImageFiles.length > 0) {
      recipeData.images = await uploadImages(newImageFiles);
      oldImagesToDelete = existingRecipe.images;
    }

    await Recipe.findByIdAndUpdate(recipeId, recipeData);

    // remove replaced images only after the DB update succeeded
    await deleteImages(oldImagesToDelete);
  } catch (error) {
    console.error('Failed to update recipe:', error);
    return { error: 'Failed to update recipe.' };
  }

  revalidatePath('/', 'layout');
  redirect(`/recipes/${recipeId}`);
}

// Delete a recipe (owner only) and everything that references it: other
// users' bookmarks, messages about it, and its Cloudinary images. Keep this in
// sync if new references to recipes are added.
export async function deleteRecipe(recipeId) {
  const sessionUser = await getSessionUser();
  if (!sessionUser?.userId) {
    return { error: 'You must be signed in to delete a recipe.' };
  }
  if (!isValidObjectId(recipeId)) {
    return { error: 'Recipe not found.' };
  }

  try {
    await connectDB();

    const recipe = await Recipe.findById(recipeId);
    if (!recipe) {
      return { error: 'Recipe not found.' };
    }
    if (recipe.owner.toString() !== sessionUser.userId) {
      return { error: 'Permission denied.' };
    }

    await recipe.deleteOne();

    await Promise.all([
      User.updateMany(
        { bookmarks: recipe._id },
        { $pull: { bookmarks: recipe._id } }
      ),
      Message.deleteMany({ property: recipe._id }),
      deleteImages(recipe.images),
    ]);
  } catch (error) {
    console.error('Failed to delete recipe:', error);
    return { error: 'Failed to delete recipe.' };
  }

  revalidatePath('/', 'layout');
  return { ok: true };
}
