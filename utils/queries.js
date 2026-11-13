// Server-side data reads, called directly from Server Components.
//
// These are plain async functions, NOT Server Actions: nothing here is
// exposed as an endpoint. Never import this file from a 'use client' module.
// Mutations live in app/actions/*.
//
// The models return JSON-plain objects (ids and dates as strings), so the
// results can be passed straight to Client Components. Each function catches
// its own errors and returns []/null/false/0 so pages still render.
import { normalizeId } from '@/utils/ids';
import * as recipes from '@/models/recipes';
import * as users from '@/models/users';
import * as messages from '@/models/messages';

// All recipes.
export async function getRecipes() {
  try {
    return recipes.listAll();
  } catch (error) {
    console.error('Failed to load recipes:', error);
    return [];
  }
}

// One recipe, or null if the id is invalid / not found / on failure.
export async function getRecipeById(id) {
  const recipeId = normalizeId(id);
  if (!recipeId) return null;

  try {
    return recipes.findById(recipeId);
  } catch (error) {
    console.error(`Failed to load recipe ${id}:`, error);
    return null;
  }
}

// Recipes owned by a user.
export async function getRecipesByOwner(userId) {
  if (!userId) return [];

  try {
    return recipes.findByOwner(userId);
  } catch (error) {
    console.error('Failed to load user recipes:', error);
    return [];
  }
}

// Case-insensitive match on name, description, type, ingredients and
// directions; optional cuisine (`category`) filter unless 'All'.
export async function searchRecipes({ searchCriteria = '', recipeType } = {}) {
  try {
    // If searchCriteria arrives with a URL glued on, keep only the value
    // after the first `?...=` (legacy behaviour of the old API route).
    const criteria = searchCriteria.includes('?')
      ? searchCriteria.split('?')[1].split('=')[1] || ''
      : searchCriteria;

    const category = recipeType && recipeType !== 'All' ? recipeType : null;

    return recipes.search({ criteria, category });
  } catch (error) {
    console.error('Recipe search failed:', error);
    return [];
  }
}

// The user's bookmarked recipes.
export async function getBookmarkedRecipes(userId) {
  if (!userId) return [];

  try {
    return users.listBookmarkedRecipes(userId);
  } catch (error) {
    console.error('Failed to load bookmarks:', error);
    return [];
  }
}

// Whether the user has bookmarked the recipe.
export async function isRecipeBookmarked(userId, recipeId) {
  const id = normalizeId(recipeId);
  if (!userId || !id) return false;

  try {
    return users.isBookmarked(userId, id);
  } catch (error) {
    console.error('Failed to check bookmark:', error);
    return false;
  }
}

// The user's inbox: unread first, each group newest first, with the sender's
// username and the recipe name populated.
export async function getMessages(userId) {
  if (!userId) return [];

  try {
    return messages.listForRecipient(userId);
  } catch (error) {
    console.error('Failed to load messages:', error);
    return [];
  }
}

// Number of unread messages for the user.
export async function getUnreadMessageCount(userId) {
  if (!userId) return 0;

  try {
    return messages.unreadCount(userId);
  } catch (error) {
    console.error('Failed to count unread messages:', error);
    return 0;
  }
}
