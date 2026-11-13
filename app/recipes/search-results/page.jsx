import React from 'react';
import Link from 'next/link';
import { FaArrowAltCircleLeft } from 'react-icons/fa';
import RecipeCard from '@/components/RecipeCard';
import RecipeSearchForm from '@/components/RecipeSearchForm';
import { searchRecipes } from '@/utils/queries';

const SearchResultsPage = async ({ searchParams }) => {
  const recipes = await searchRecipes({
    searchCriteria: searchParams.searchCriteria || '',
    recipeType: searchParams.recipeType,
  });

  return (
    <>
      <section className='gradient-hero py-10'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
          <RecipeSearchForm />
        </div>
      </section>
      <section className='page-bg min-h-[60vh] px-4 py-10'>
        <div className='container-xl lg:container m-auto px-4'>
          <Link
            href='/recipes'
            className='inline-flex items-center text-purple-600 hover:text-fuchsia-600 font-medium mb-4'
          >
            <FaArrowAltCircleLeft className='mr-2' />
            Back to Recipes
          </Link>
          <h1 className='font-display text-4xl font-bold gradient-text mb-8'>
            Search Results
          </h1>
          {recipes.length === 0 ? (
            <div className='panel p-10 text-center text-purple-700'>
              No search results found
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
    </>
  );
};

export default SearchResultsPage;
