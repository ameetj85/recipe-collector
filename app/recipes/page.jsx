import React from 'react';
import Link from 'next/link';
import recipes from '@/recipes.json';
import RecipeCard from '@/components/RecipeCard';

const RecipesPage = () => {
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
