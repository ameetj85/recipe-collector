import React from 'react';
import recipes from '@/recipes.json';
import RecipeCard from './RecipeCard';
import Link from 'next/link';

const HomeRecipes = () => {
  const recentRecipes = recipes
    .sort(() => Math.random() - Math.random())
    .slice(0, 3);

  return (
    <>
      <section className='px-4 py-6'>
        <div className='container-xl lg:container m-auto'>
          <h2 className='text-3xl font-bold text-blue-500 mb-6 text-center'>
            Recent Recipes
          </h2>
          <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
            {recentRecipes === 0 ? (
              <p> No Recipes found</p>
            ) : (
              recentRecipes.map((item) => (
                <RecipeCard key={item._id} recipe={item} />
              ))
            )}
          </div>
        </div>
      </section>

      <section className='m-auto max-w-lg my-10 px-6'>
        <Link
          href='/recipes'
          className='block bg-black text-white text-center py-4 px-6 rounded-xl hover:bg-gray-700'
        >
          View All Recipes
        </Link>
      </section>
    </>
  );
};

export default HomeRecipes;
