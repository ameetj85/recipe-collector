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
    return <p className='text-center'>... Loading</p>;
  }

  return isBookmarked ? (
    <button
      onClick={onHandleClick}
      className='bg-red-500 hover:bg-red-600 text-white font-bold w-full py-2 px-4 rounded-full flex items-center justify-center'
    >
      <FaBookmark className='mr-2' /> Remove Bookmark
    </button>
  ) : (
    <button
      onClick={onHandleClick}
      className='bg-blue-500 hover:bg-blue-600 text-white font-bold w-full py-2 px-4 rounded-full flex items-center justify-center'
    >
      <FaBookmark className='mr-2' /> Bookmark Recipe
    </button>
  );
};

export default BookmarkButton;
