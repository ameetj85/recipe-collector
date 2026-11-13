'use server';

import { revalidatePath } from 'next/cache';
import * as users from '@/models/users';
import * as recipes from '@/models/recipes';
import { normalizeId } from '@/utils/ids';
import { getSessionUser } from '@/utils/getSessionUser';

// Add or remove a bookmark. Returns { message, isBookmarked } or { error }.
export async function toggleBookmark(recipeId) {
  const sessionUser = await getSessionUser();
  if (!sessionUser?.userId) {
    return { error: 'You need to sign in to bookmark a recipe.' };
  }
  const id = normalizeId(recipeId);
  if (!id) {
    return { error: 'Recipe not found.' };
  }

  try {
    if (!users.findById(sessionUser.userId)) {
      return { error: 'User not found.' };
    }
    if (!recipes.findOwnerId(id)) {
      return { error: 'Recipe not found.' };
    }

    const isBookmarked = users.toggleBookmark(sessionUser.userId, id);
    const message = isBookmarked
      ? 'Bookmark added successfully!'
      : 'Bookmark removed successfully.';

    revalidatePath('/recipes/saved');
    return { message, isBookmarked };
  } catch (error) {
    console.error('Failed to toggle bookmark:', error);
    return { error: 'Something went wrong.' };
  }
}
