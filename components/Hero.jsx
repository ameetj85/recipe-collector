import React from 'react';

const Hero = () => {
  return (
    <section className='bg-blue-700 py-20 mb-4'>
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col items-center'>
        <div className='text-center'>
          <h1 className='text-4xl font-extrabold text-white sm:text-5xl md:text-6xl'>
            Find The Perfect Recipe
          </h1>
          <p className='my-4 text-xl text-white'>
            Discover your next delicious meal.
          </p>
        </div>
        <form className='mt-3 mx-auto max-w-2xl w-full flex flex-col md:flex-row items-center'>
          <div className='w-full md:w-3/5 md:pr-2 mb-4 md:mb-0'>
            <label htmlFor='search' className='sr-only'>
              Search
            </label>
            <input
              type='text'
              id='search'
              placeholder='Enter search criteria'
              className='w-full px-4 py-3 rounded-lg bg-white text-gray-800 focus:outline-none focus:ring focus:ring-blue-500'
            />
          </div>
          <div className='w-full md:w-2/5 md:pl-2'>
            <label htmlFor='cuisine-type' className='sr-only'>
              Cuisine Type
            </label>
            <select
              id='cuisine-type'
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
      </div>
    </section>
  );
};

export default Hero;
