'use client';

import React, { useEffect, useState } from 'react';
import RecipeCard from '@/components/RecipeCard';
import Spinner from '@/components/Spinner';
import { toast } from 'react-toastify';

const SavedRecipesPage = () => {
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSavedRecipes = async () => {
      try {
        const res = await fetch(`/api/bookmarks`);

        if (res.status === 200) {
          const data = await res.json();
          setRecipes(data);
        } else {
          console.log(res.statusText);
          toast.error('Failed to fetch saved recipes: ' + res.status);
        }
      } catch (error) {
        console.log(error);
        toast.error('Failed to fetch saved recipes!');
      } finally {
        setLoading(false);
      }
    };

    fetchSavedRecipes();
  }, []);

  return loading ? (
    <Spinner loading={loading} />
  ) : (
    <section className='page-bg min-h-[60vh] px-4 py-12'>
      <div className='container-xl lg:container m-auto px-4'>
        <h1 className='font-display text-4xl font-bold gradient-text mb-2'>
          Saved Recipes
        </h1>
        <p className='text-slate-500 mb-8'>Your bookmarked favourites.</p>
        {recipes.length === 0 ? (
          <div className='panel p-10 text-center text-purple-700'>
            You haven&apos;t saved any recipes yet.
          </div>
        ) : (
          <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8'>
            {recipes.map((recipe) => (
              <RecipeCard key={recipe._id} recipe={recipe} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default SavedRecipesPage;
