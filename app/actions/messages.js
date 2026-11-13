'use server';

import { isValidObjectId } from 'mongoose';
import { revalidatePath } from 'next/cache';
import connectDB from '@/config/database';
import Message from '@/models/Message';
import Recipe from '@/models/Recipe';
import { getSessionUser } from '@/utils/getSessionUser';

// Send a message to a recipe's owner. The recipient is looked up from the
// recipe rather than trusted from the client. Returns { message } or { error }.
export async function sendMessage({ recipeId, name, email, phone, message }) {
  const sessionUser = await getSessionUser();
  if (!sessionUser?.userId) {
    return { error: 'You must be logged in to send a message!' };
  }
  if (!isValidObjectId(recipeId)) {
    return { error: 'Recipe not found.' };
  }

  try {
    await connectDB();

    const recipe = await Recipe.findById(recipeId).select('owner').lean();
    if (!recipe) {
      return { error: 'Recipe not found.' };
    }

    if (recipe.owner.toString() === sessionUser.userId) {
      return { error: 'Cannot send a message to yourself!' };
    }

    await Message.create({
      sender: sessionUser.userId,
      recipient: recipe.owner,
      property: recipe._id,
      name,
      email,
      phone,
      body: message,
    });

    return { message: 'Message sent successfully!' };
  } catch (error) {
    console.error('Failed to send message:', error);
    return { error: 'Error sending message' };
  }
}

// Load a message the current user received, or return { error }.
async function findOwnMessage(messageId) {
  const sessionUser = await getSessionUser();
  if (!sessionUser?.userId) {
    return { error: 'You must be signed in.' };
  }
  if (!isValidObjectId(messageId)) {
    return { error: 'Message not found!' };
  }

  await connectDB();

  const message = await Message.findById(messageId);
  if (!message) {
    return { error: 'Message not found!' };
  }
  if (message.recipient.toString() !== sessionUser.userId) {
    return { error: 'Unauthorised!' };
  }

  return { message };
}

// Toggle a message between read and unread. Returns { read } or { error }.
export async function toggleMessageRead(messageId) {
  try {
    const { message, error } = await findOwnMessage(messageId);
    if (error) return { error };

    message.read = !message.read;
    await message.save();

    revalidatePath('/messages');
    return { read: message.read };
  } catch (error) {
    console.error('Failed to update message:', error);
    return { error: 'Something went wrong' };
  }
}

// Delete a message. Returns { ok: true } or { error }.
export async function deleteMessage(messageId) {
  try {
    const { message, error } = await findOwnMessage(messageId);
    if (error) return { error };

    await message.deleteOne();

    revalidatePath('/messages');
    return { ok: true };
  } catch (error) {
    console.error('Failed to delete message:', error);
    return { error: 'Message was not deleted' };
  }
}
