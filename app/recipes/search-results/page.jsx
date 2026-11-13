'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { FaArrowAltCircleLeft } from 'react-icons/fa';
import RecipeCard from '@/components/RecipeCard';
import RecipeSearchForm from '@/components/RecipeSearchForm';
import Spinner from '@/components/Spinner';

const SearchResultsPage = () => {
  const searchParams = useSearchParams();
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);

  const searchCriteria = searchParams.get('searchCriteria');
  const recipeType = searchParams.get('recipeType');

  useEffect(() => {
    const fetchSearchResults = async () => {
      try {
        const res = await fetch(
          `/api/recipes/search?searchCriteria=${searchCriteria}&recipeType=${recipeType}`
        );

        if (res.status === 200) {
          const data = await res.json();
          // console.log('Search Results data:', data);
          setRecipes(data);
          // console.log('Search Results recipes:', recipes);
          // console.log('Data 0:', data[0].images[0]);
          // console.log('TypeOf: ', typeof data);
        } else {
          setRecipes([]);
        }
      } catch (error) {
        console.log(error);
      } finally {
        setLoading(false);
      }
    };

    fetchSearchResults();
  }, [searchCriteria, recipeType]);

  return (
    <>
      <section className='gradient-hero py-10'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
          <RecipeSearchForm />
        </div>
      </section>
      {loading ? (
        <Spinner loading={loading} />
      ) : (
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
      )}
    </>
  );
};

export default SearchResultsPage;
