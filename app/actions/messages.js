'use server';

import { revalidatePath } from 'next/cache';
import * as messages from '@/models/messages';
import * as recipes from '@/models/recipes';
import { normalizeId } from '@/utils/ids';
import { getSessionUser } from '@/utils/getSessionUser';

// Send a message to a recipe's owner. The recipient is looked up from the
// recipe rather than trusted from the client. Returns { message } or { error }.
export async function sendMessage({ recipeId, name, email, phone, message }) {
  const sessionUser = await getSessionUser();
  if (!sessionUser?.userId) {
    return { error: 'You must be logged in to send a message!' };
  }
  const id = normalizeId(recipeId);
  if (!id) {
    return { error: 'Recipe not found.' };
  }
  if (!name || !email) {
    return { error: 'Name and email are required.' };
  }

  try {
    const ownerId = recipes.findOwnerId(id);
    if (!ownerId) {
      return { error: 'Recipe not found.' };
    }

    if (ownerId === sessionUser.userId) {
      return { error: 'Cannot send a message to yourself!' };
    }

    messages.create({
      senderId: sessionUser.userId,
      recipientId: ownerId,
      recipeId: id,
      name: String(name),
      email: String(email),
      phone: phone ? String(phone) : null,
      body: message ? String(message) : null,
    });

    return { message: 'Message sent successfully!' };
  } catch (error) {
    console.error('Failed to send message:', error);
    return { error: 'Error sending message' };
  }
}

// Check that the message exists and belongs to the current user.
// Returns { id } or { error }.
async function findOwnMessage(messageId) {
  const sessionUser = await getSessionUser();
  if (!sessionUser?.userId) {
    return { error: 'You must be signed in.' };
  }
  const id = normalizeId(messageId);
  if (!id) {
    return { error: 'Message not found!' };
  }

  const message = messages.findById(id);
  if (!message) {
    return { error: 'Message not found!' };
  }
  if (message.recipient_id !== sessionUser.userId) {
    return { error: 'Unauthorised!' };
  }

  return { id };
}

// Toggle a message between read and unread. Returns { read } or { error }.
export async function toggleMessageRead(messageId) {
  try {
    const { id, error } = await findOwnMessage(messageId);
    if (error) return { error };

    const read = messages.toggleRead(id);

    revalidatePath('/messages');
    return { read };
  } catch (error) {
    console.error('Failed to update message:', error);
    return { error: 'Something went wrong' };
  }
}

// Delete a message. Returns { ok: true } or { error }.
export async function deleteMessage(messageId) {
  try {
    const { id, error } = await findOwnMessage(messageId);
    if (error) return { error };

    messages.remove(id);

    revalidatePath('/messages');
    return { ok: true };
  } catch (error) {
    console.error('Failed to delete message:', error);
    return { error: 'Message was not deleted' };
  }
}
