'use client';

import React, { useState, useTransition } from 'react';
import { FaBookmark } from 'react-icons/fa';
import { useSession } from 'next-auth/react';
import { toast } from 'react-toastify';
import { toggleBookmark } from '@/app/actions/bookmarks';

// initialIsBookmarked is resolved on the server by the recipe page.
const BookmarkButton = ({ recipe, initialIsBookmarked = false }) => {
  const { data: session } = useSession();
  const userId = session?.user?.id;
  const [isBookmarked, setIsBookmarked] = useState(initialIsBookmarked);
  const [isPending, startTransition] = useTransition();

  const onHandleClick = () => {
    if (!userId) {
      toast.error('You need to sign in to bookmark a recipe.');
      return;
    }

    startTransition(async () => {
      const result = await toggleBookmark(recipe._id);

      if (result.error) {
        toast.error(result.error);
        return;
      }

      setIsBookmarked(result.isBookmarked);
      toast.success(result.message);
    });
  };

  return isBookmarked ? (
    <button
      onClick={onHandleClick}
      disabled={isPending}
      className='btn-secondary w-full py-3'
    >
      <FaBookmark /> Remove Bookmark
    </button>
  ) : (
    <button
      onClick={onHandleClick}
      disabled={isPending}
      className='btn-primary w-full py-3'
    >
      <FaBookmark /> Bookmark Recipe
    </button>
  );
};

export default BookmarkButton;
