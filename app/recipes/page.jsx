import React from 'react';
import RecipeCard from '@/components/RecipeCard';
import { fetchRecipes } from '@/utils/requests';
import RecipeSearchForm from '@/components/RecipeSearchForm';

const RecipesPage = async () => {
  const recipes = await fetchRecipes();

  // sort recipes by name
  recipes.sort((a, b) => {
    return a.name > b.name ? 1 : b.name > a.name ? -1 : 0;
  });

  return (
    <>
      <section className='gradient-hero py-12'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
          <h1 className='font-display text-4xl font-bold text-white text-center mb-6'>
            All Recipes
          </h1>
          <RecipeSearchForm />
        </div>
      </section>

      <section className='page-bg px-4 py-10'>
        <div className='container-xl lg:container m-auto px-4'>
          {recipes.length === 0 ? (
            <p className='text-center text-purple-700'>No recipes found</p>
          ) : (
            <>
              <p className='mb-6 text-sm text-slate-500'>
                Showing{' '}
                <span className='font-semibold text-purple-700'>
                  {recipes.length}
                </span>{' '}
                recipes
              </p>
              <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8'>
                {recipes.map((recipe) => (
                  <RecipeCard key={recipe._id} recipe={recipe} />
                ))}
              </div>
            </>
          )}
        </div>
      </section>
    </>
  );
};

export default RecipesPage;
