'use client';

import React, { useTransition } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { toast } from 'react-toastify';
import { deleteRecipe } from '@/app/actions/recipes';
import { imageSrc } from '@/utils/imageSrc';

const toastOptions = {
  autoClose: false,
  position: 'bottom-right',
  closeOnClick: true,
};

// The user's own recipes on the profile page. After a delete, the action
// revalidates and the server re-renders this list without the recipe.
const ProfileRecipes = ({ recipes }) => {
  const [isPending, startTransition] = useTransition();

  const handleDeleteRecipe = (recipeId) => {
    const confirmed = window.confirm(
      'Are you sure you want to delete this recipe?'
    );

    if (!confirmed) return;

    startTransition(async () => {
      const result = await deleteRecipe(recipeId);

      if (result.error) {
        toast.error(result.error, toastOptions);
        return;
      }

      toast.success('Recipe Deleted', { position: 'bottom-right' });
    });
  };

  if (recipes.length === 0) {
    return (
      <p className='rounded-xl bg-purple-50 p-6 text-purple-700'>
        You have no recipe listings
      </p>
    );
  }

  return (
    <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
      {recipes.map((recipe) => (
        <div
          key={recipe._id}
          className='overflow-hidden rounded-2xl bg-white ring-1 ring-purple-100 shadow-md transition hover:shadow-xl hover:shadow-purple-700/10'
        >
          <Link href={`/recipes/${recipe._id}`}>
            <Image
              className='h-40 w-full object-cover'
              src={imageSrc(recipe.images[0])}
              alt=''
              width={500}
              height={100}
              sizes='(min-width: 1024px) 50vw, 100vw'
              preload
            />
          </Link>
          <div className='px-5 pt-4'>
            <p className='font-display text-lg font-bold text-purple-950'>
              {recipe.name}
            </p>
            <p className='mt-1 text-sm text-slate-500 line-clamp-2'>
              {recipe.description}
            </p>
          </div>
          <div className='flex gap-3 px-5 py-4'>
            <Link
              href={`/recipes/${recipe._id}/edit`}
              className='btn-primary text-sm px-6'
            >
              Edit
            </Link>
            <button
              onClick={() => handleDeleteRecipe(recipe._id)}
              disabled={isPending}
              className='btn-danger text-sm px-6'
              type='button'
            >
              Delete
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ProfileRecipes;
