import React, { useState, useEffect } from 'react';
import { FaBookmark } from 'react-icons/fa';
import { useSession } from 'next-auth/react';
import { toast } from 'react-toastify';

const BookmarkButton = ({ recipe }) => {
  const { data: session } = useSession();
  const userId = session?.user?.id;
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    const checkBookmarkStatus = async () => {
      try {
        const res = await fetch(`/api/bookmarks/check`, {
          method: 'POST',
          headers: {
            'content-type': 'application/json',
          },
          body: JSON.stringify({ recipeId: recipe._id }),
        });

        if (res.status === 200) {
          const data = await res.json();
          setIsBookmarked(data.isBookmarked);
        }
      } catch (error) {
        console.log(error);
      } finally {
        setLoading(false);
      }
    };
    checkBookmarkStatus();
  }, [recipe._id, userId]);

  const onHandleClick = async () => {
    if (!userId) {
      toast.error('You need to sign in to bookmark a recipe.');
      return;
    }

    try {
      const res = await fetch(`/api/bookmarks`, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
        },
        body: JSON.stringify({ recipeId: recipe._id }),
      });

      if (res.status === 200) {
        const data = await res.json();
        toast.success(data.message);
        setIsBookmarked(data.isBookmarked);
      }
    } catch (error) {
      console.log(error);
      toast.error('Something went wrong.');
    }
  };

  if (loading) {
    return (
      <div className='h-12 w-full animate-pulse rounded-full bg-purple-100' />
    );
  }

  return isBookmarked ? (
    <button
      onClick={onHandleClick}
      className='btn-secondary w-full py-3'
    >
      <FaBookmark /> Remove Bookmark
    </button>
  ) : (
    <button
      onClick={onHandleClick}
      className='btn-primary w-full py-3'
    >
      <FaBookmark /> Bookmark Recipe
    </button>
  );
};

export default BookmarkButton;
