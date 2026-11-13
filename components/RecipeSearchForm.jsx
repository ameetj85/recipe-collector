'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { FaSearch } from 'react-icons/fa';

const fieldClass =
  'w-full px-5 py-3.5 rounded-xl bg-white text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-4 focus:ring-fuchsia-300/60';

const RecipeSearchForm = () => {
  const [searchCriteria, setSearchCriteria] = useState('');
  const [recipeType, setRecipeType] = useState('All');

  const router = useRouter();

  const handleSubmit = (e) => {
    e.preventDefault();

    if (searchCriteria === '' && recipeType === 'All') {
      router.push('/recipes');
    } else {
      const query = `?searchCriteria=${searchCriteria}&recipeType=${recipeType}`;

      router.push(`/recipes/search-results${query}`);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className='mx-auto max-w-3xl w-full flex flex-col md:flex-row items-center gap-3 rounded-2xl bg-white/10 p-3 ring-1 ring-white/20 backdrop-blur-md shadow-2xl shadow-purple-950/40'
    >
      <div className='w-full md:w-3/5'>
        <label htmlFor='searchCriteria' className='sr-only'>
          Search Criteria
        </label>
        <input
          type='text'
          id='searchCriteria'
          placeholder='Recipe name, type, ingredient or directions'
          value={searchCriteria}
          onChange={(e) => setSearchCriteria(e.target.value)}
          className={fieldClass}
        />
      </div>
      <div className='w-full md:w-2/5'>
        <label htmlFor='recipe-type' className='sr-only'>
          Recipe Type
        </label>
        <select
          id='recipe-type'
          value={recipeType}
          onChange={(e) => setRecipeType(e.target.value)}
          className={fieldClass}
        >
          <option value='All'>All Cuisines</option>
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
        className='btn-primary w-full md:w-auto px-7 py-3.5 rounded-xl'
      >
        <FaSearch /> Search
      </button>
    </form>
  );
};

export default RecipeSearchForm;
