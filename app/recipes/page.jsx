import React from 'react';
import Link from 'next/link';
import RecipeCard from '@/components/RecipeCard';
import { fetchRecipes } from '@/utils/requests';
import RecipeSearchForm from '@/components/RecipeSearchForm';

const RecipesPage = async () => {
  const recipes = await fetchRecipes();

  // sort recipes by category
  // objs.sort(function(a,b) {return (a.last_nom > b.last_nom) ? 1 : ((b.last_nom > a.last_nom) ? -1 : 0)
  recipes.sort((a, b) => {
    return a.name > b.name ? 1 : b.name > a.name ? -1 : 0;
  });

  return (
    <>
      <section className='bg-blue-700 py-4'>
        <div className='max-w-7xl mx-auto px-4 flex flex-col items-start sm:px-6 lg:px-8'>
          <RecipeSearchForm />
        </div>
      </section>

      <section className='px-4 py-6'>
        <div className='container-xl lg:container m-auto px-4 py-6'>
          {recipes.length === 0 ? (
            <p>No recipes found</p>
          ) : (
            <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
              {recipes.map((recipe) => (
                <RecipeCard key={recipe._id} recipe={recipe} />
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  );
};

export default RecipesPage;
