'use server';

import { isValidObjectId } from 'mongoose';
import { revalidatePath } from 'next/cache';
import connectDB from '@/config/database';
import User from '@/models/User';
import { getSessionUser } from '@/utils/getSessionUser';

// Add or remove a bookmark. Returns { message, isBookmarked } or { error }.
export async function toggleBookmark(recipeId) {
  const sessionUser = await getSessionUser();
  if (!sessionUser?.userId) {
    return { error: 'You need to sign in to bookmark a recipe.' };
  }
  if (!isValidObjectId(recipeId)) {
    return { error: 'Recipe not found.' };
  }

  try {
    await connectDB();

    const user = await User.findById(sessionUser.userId);
    if (!user) {
      return { error: 'User not found.' };
    }

    let isBookmarked = user.bookmarks.includes(recipeId);
    let message;

    if (isBookmarked) {
      user.bookmarks.pull(recipeId);
      message = 'Bookmark removed successfully.';
      isBookmarked = false;
    } else {
      user.bookmarks.push(recipeId);
      message = 'Bookmark added successfully!';
      isBookmarked = true;
    }

    await user.save();

    revalidatePath('/recipes/saved');
    return { message, isBookmarked };
  } catch (error) {
    console.error('Failed to toggle bookmark:', error);
    return { error: 'Something went wrong.' };
  }
}
