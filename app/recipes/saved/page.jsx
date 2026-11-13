import React from 'react';
import RecipeCard from '@/components/RecipeCard';
import { getSessionUser } from '@/utils/getSessionUser';
import { getBookmarkedRecipes } from '@/utils/queries';

const SavedRecipesPage = async () => {
  // middleware.js guards this route, so a session is expected
  const sessionUser = await getSessionUser();
  const recipes = await getBookmarkedRecipes(sessionUser?.userId);

  return (
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
