import React from 'react';
import { div, FaBreadSlice, FaCorn } from 'react-icons/fa';

const RecipeDetails = ({ recipe }) => {
  console.log(recipe.cookTime);
  console.log(recipe.directions.split('\n'));
  let directions = recipe.directions.split('\n');

  return (
    <main>
      <div className='bg-white p-6 rounded-lg shadow-md text-center md:text-left'>
        <div className='text-gray-500 mb-4'>
          {recipe.type}
          <span className='ml-6  bg-white px-4 py-2 rounded-lg text-blue-500 font-bold'>
            {recipe.starRating} stars
          </span>
        </div>
        <h1 className='text-3xl font-bold mb-4 text-blue-800'>
          <a target='_blank' href={recipe.url} rel='noopener noreferrer'>
            {recipe.name}
          </a>
        </h1>
        <div className='text-gray-500 mb-4'>{recipe.category}</div>
      </div>

      <h3 className='text-lg font-bold my-4 bg-gray-800 text-white p-2'>
        Description
      </h3>
      <div className='flex flex-col md:flex-row justify-around'>
        <div className='flex items-center justify-center mb-4 border-b border-gray-200 md:border-b-0 pb-4 md:pb-0'>
          {recipe.description}
        </div>
      </div>

      <h3 className='mt-6 text-lg font-bold mb-2  bg-gray-800 text-white p-2'>
        Nutrition Information
      </h3>

      <div className='bg-white p-6 rounded-lg shadow-md text-center md:text-left'>
        <div className='flex  gap-4 text-gray-500 mb-2'>
          <p>
            <FaBreadSlice className='inline mr-2' />{' '}
            {recipe.nutritionInfo.calories}{' '}
            <span className='md:hidden lg:inline'>Calories</span>
          </p>
          <p>
            <FaBreadSlice className='inline mr-2' /> {recipe.nutritionInfo.fat}{' '}
            <span className='md:hidden lg:inline'>Fat</span>
          </p>
          <p>
            <FaBreadSlice className='inline mr-2' />
            {recipe.nutritionInfo.carbs}{' '}
            <span className='md:hidden lg:inline'>Carbs</span>
          </p>
          <p>
            <FaBreadSlice className='inline mr-2' />
            {recipe.nutritionInfo.protein}{' '}
            <span className='md:hidden lg:inline'>Protein</span>
          </p>
        </div>
      </div>

      <h3 className='mt-6 text-lg font-bold mb-2  bg-gray-800 text-white p-2'>
        Recipe Preparation Information
      </h3>

      <div className='bg-white p-6 rounded-lg shadow-md text-center md:text-left'>
        <div className='flex  gap-4 text-gray-500 mb-2'>
          <p>
            <div className='inline mr-2' /> Prep Time:{' '}
            <span className='md:hidden lg:inline'>
              {recipe.prepTime} minutes
            </span>
          </p>
          <p>
            <div className='inline mr-2' /> Cook Time:{' '}
            <span className='md:hidden lg:inline'>
              {recipe.cookTime} minutes
            </span>
          </p>
          <p>
            <div className='inline mr-2' />
            Total Time:{' '}
            <span className='md:hidden lg:inline'>
              {recipe.totalTime} minutes
            </span>
          </p>
        </div>
      </div>

      <h3 className='text-lg font-bold my-6 bg-gray-800 text-white p-2'>
        Ingredients
      </h3>
      <div className='ml-5 '>
        <div>
          <ul>
            {recipe.ingredients.map((i, index) => (
              <li key={index}>&#x2022; {i}</li>
            ))}
          </ul>
        </div>
      </div>
      <h3 className='text-lg font-bold my-6 bg-gray-800 text-white p-2'>
        Directions
      </h3>
      <div className=''>
        <div className='ml-4'>
          <ul>
            {directions.map((i, index) => (
              <li key={index}>&#x2022; {i}</li>
            ))}
          </ul>
        </div>
      </div>
    </main>
  );
};

export default RecipeDetails;
