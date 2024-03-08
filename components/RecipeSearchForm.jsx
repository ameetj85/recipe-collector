'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

const RecipeSearchForm = () => {
  const [searchCriteria, setSearchCriteria] = useState('');
  const [recipeType, setRecipeType] = useState('All');

  const router = useRouter();

  const handleSubmit = (e) => {
    e.preventDefault();

    if (searchCriteria === '' && recipeType === 'All') {
      router.push('/recipe');
    } else {
      const query = `?searchCriteria=${searchCriteria}&recipeType=${recipeType}`;

      router.push(`/recipes/search-results${query}`);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className='mt-3 mx-auto max-w-2xl w-full flex flex-col md:flex-row items-center'
    >
      <div className='w-full md:w-3/5 md:pr-2 mb-4 md:mb-0'>
        <label htmlFor='searchCriteria' className='sr-only'>
          Search Criteria
        </label>
        <input
          type='text'
          id='searchCriteria'
          placeholder='Enter Recipe Name, Type, Ingredient(s) or Directions'
          value={searchCriteria}
          onChange={(e) => setSearchCriteria(e.target.value)}
          className='w-full px-4 py-3 rounded-lg bg-white text-gray-800 focus:outline-none focus:ring focus:ring-blue-500'
        />
      </div>
      <div className='w-full md:w-2/5 md:pl-2'>
        <label htmlFor='recipe-type' className='sr-only'>
          Recipe Type
        </label>
        <select
          id='recipe-type'
          value={recipeType}
          onChange={(e) => setRecipeType(e.target.value)}
          className='w-full px-4 py-3 rounded-lg bg-white text-gray-800 focus:outline-none focus:ring focus:ring-blue-500'
        >
          <option value='All'>All</option>
          <option value='American'>American</option>
          <option value='Chinese'>Chinese</option>
          <option value='Cuban'>Cuban</option>
          <option value='French'>French</option>
          <option value='Greek'>Greek</option>
          <option value='Japanese'>Japanese</option>
          <option value='Indian'>Indian</option>
          <option value='Italian'>Italian</option>
          <option value='Mexican'>Mexican</option>
          <option value='Thai'>Thai</option>
          <option value='Other'>Other</option>
        </select>
      </div>
      <button
        type='submit'
        className='md:ml-4 mt-4 md:mt-0 w-full md:w-auto px-6 py-3 rounded-lg bg-blue-500 text-white hover:bg-blue-600 focus:outline-none focus:ring focus:ring-blue-500'
      >
        Search
      </button>
    </form>
  );
};

export default RecipeSearchForm;
