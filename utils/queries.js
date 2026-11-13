// Server-side data reads, called directly from Server Components.
//
// These are plain async functions, NOT Server Actions: nothing here is
// exposed as an endpoint. Never import this file from a 'use client' module.
// Mutations live in app/actions/*.
import { isValidObjectId } from 'mongoose';
import connectDB from '@/config/database';
import Recipe from '@/models/Recipe';
import User from '@/models/User';
import Message from '@/models/Message';

// Mongoose documents (ObjectIds, Dates) cannot be passed to Client
// Components. Round-tripping through JSON gives the same plain shape the old
// REST API returned (ids and dates as strings).
export const serialize = (value) => JSON.parse(JSON.stringify(value));

// Escape regex special characters so user input is matched literally
// (prevents broken queries and expensive/malicious patterns).
const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// All recipes. Returns [] on failure so pages still render.
export async function getRecipes() {
  try {
    await connectDB();
    const recipes = await Recipe.find({}).lean();
    return serialize(recipes);
  } catch (error) {
    console.error('Failed to load recipes:', error);
    return [];
  }
}

// One recipe, or null if the id is invalid / not found / on failure.
export async function getRecipeById(id) {
  if (!isValidObjectId(id)) return null;

  try {
    await connectDB();
    const recipe = await Recipe.findById(id).lean();
    return recipe ? serialize(recipe) : null;
  } catch (error) {
    console.error(`Failed to load recipe ${id}:`, error);
    return null;
  }
}

// Recipes owned by a user.
export async function getRecipesByOwner(userId) {
  if (!userId) return [];

  try {
    await connectDB();
    const recipes = await Recipe.find({ owner: userId }).lean();
    return serialize(recipes);
  } catch (error) {
    console.error('Failed to load user recipes:', error);
    return [];
  }
}

// Case-insensitive match on name, description, type, ingredients and
// directions; optional cuisine (`category`) filter unless 'All'.
export async function searchRecipes({ searchCriteria = '', recipeType } = {}) {
  try {
    await connectDB();

    // If searchCriteria arrives with a URL glued on, keep only the value
    // after the first `?...=` (legacy behaviour of the old API route).
    const criteria = searchCriteria.includes('?')
      ? searchCriteria.split('?')[1].split('=')[1] || ''
      : searchCriteria;

    const criteriaPattern = new RegExp(escapeRegex(criteria), 'i');

    const query = {
      $or: [
        { name: criteriaPattern },
        { description: criteriaPattern },
        { type: criteriaPattern },
        { ingredients: criteriaPattern },
        { directions: criteriaPattern },
      ],
    };

    if (recipeType && recipeType !== 'All') {
      query.category = new RegExp(escapeRegex(recipeType), 'i');
    }

    const recipes = await Recipe.find(query).lean();
    return serialize(recipes);
  } catch (error) {
    console.error('Recipe search failed:', error);
    return [];
  }
}

// The user's bookmarked recipes.
export async function getBookmarkedRecipes(userId) {
  if (!userId) return [];

  try {
    await connectDB();
    const user = await User.findById(userId).select('bookmarks').lean();
    if (!user) return [];

    const recipes = await Recipe.find({ _id: { $in: user.bookmarks } }).lean();
    return serialize(recipes);
  } catch (error) {
    console.error('Failed to load bookmarks:', error);
    return [];
  }
}

// Whether the user has bookmarked the recipe.
export async function isRecipeBookmarked(userId, recipeId) {
  if (!userId || !isValidObjectId(recipeId)) return false;

  try {
    await connectDB();
    return Boolean(await User.exists({ _id: userId, bookmarks: recipeId }));
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
    await connectDB();

    const find = (read) =>
      Message.find({ recipient: userId, read })
        .sort({ createdAt: -1 })
        .populate('sender', 'username')
        .populate('property', 'name')
        .lean();

    const [unreadMessages, readMessages] = await Promise.all([
      find(false),
      find(true),
    ]);

    return serialize([...unreadMessages, ...readMessages]);
  } catch (error) {
    console.error('Failed to load messages:', error);
    return [];
  }
}

// Number of unread messages for the user.
export async function getUnreadMessageCount(userId) {
  if (!userId) return 0;

  try {
    await connectDB();
    return await Message.countDocuments({ recipient: userId, read: false });
  } catch (error) {
    console.error('Failed to count unread messages:', error);
    return 0;
  }
}
