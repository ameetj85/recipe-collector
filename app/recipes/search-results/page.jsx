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
      <section className='bg-blue-700 py-4'>
        <div className='max-w-7xl mx-auto px-4 flex flex-col items-start sm:px-6 lg:px-8'>
          <RecipeSearchForm />
        </div>
      </section>
      {loading ? (
        <Spinner loading={loading} />
      ) : (
        <section className='px-4 py-6'>
          <div className='container-xl lg:container m-auto px-4 py-6'>
            <Link
              href='/recipes'
              className='flex items-center text-blue-500 hover:underline mb-3'
            >
              <FaArrowAltCircleLeft className='mr-2 mb-1' />
              Back to Recipes
            </Link>
            <h1 className='text-2xl mb-4'>Search Results</h1>
            {recipes.length === 0 ? (
              <p>No search results found</p>
            ) : (
              <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
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
