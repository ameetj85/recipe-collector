import React from 'react';
import Link from 'next/link';
// import recipes from '@/recipes.json';
import RecipeCard from '@/components/RecipeCard';
import { fetchRecipes } from '@/utils/requests';

const RecipesPage = async () => {
  const recipes = await fetchRecipes();

  // sort recipes by category
  // objs.sort(function(a,b) {return (a.last_nom > b.last_nom) ? 1 : ((b.last_nom > a.last_nom) ? -1 : 0)
  recipes.sort((a, b) => {
    return a.name > b.name ? 1 : b.name > a.name ? -1 : 0;
  });

  return (
    <section className='px-4 py-6'>
      <div className='container-xl lg:container m-auto px-4 py-6'>
        {recipes.length === 0 ? (
          <p>No recipes found</p>
        ) : (
          <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
            {recipes.map((item) => (
              <RecipeCard key={item._id} recipe={item} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default RecipesPage;
