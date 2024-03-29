import React from 'react';
import { div, FaBreadSlice, FaCorn } from 'react-icons/fa';
import { FaCopy, FaPrint } from 'react-icons/fa';
// import Tooltip from '@/components/Tooltip';
import { Tooltip } from 'react-tooltip';
import '@/components/RecipeDetails.css';

const RecipeDetails = ({ recipe }) => {
  let directions = recipe.directions.split('\n');

  const handleCopyIngredients = () => {
    let ingredients = '';

    recipe.ingredients.map((i) => (ingredients = ingredients + i + '\r\n'));

    navigator.clipboard.writeText(`${ingredients}`);
    window.confirm('Ingredients list copied to Clipboard.);');
  };

  return (
    <main>
      <div className='bg-white p-6 rounded-lg shadow-md text-center md:text-left'>
        <div className='text-gray-500 mb-4'>
          {recipe.type}
          <span className='ml-6  bg-white px-4 py-2 rounded-lg text-blue-500 font-bold'>
            {recipe.starRating} stars
          </span>
          <button
            title='Print this Recipe'
            className='float-right  bg-blue-500 text-white px-2 py-1 mt-1 rounded-md'
            onClick={() => window.print()}
          >
            <FaPrint />
          </button>
        </div>
        <h1 className='text-3xl font-bold mb-4 text-blue-800'>
          <a target='_blank' href={recipe.url} rel='noopener noreferrer'>
            {recipe.name}
          </a>
        </h1>
        <div className='text-gray-500 mb-4'>{recipe.category}</div>
      </div>

      <h3 className='mt-6 text-lg font-bold mb-2  bg-gray-800 text-white p-2'>
        Description
      </h3>
      <div className='bg-white p-6 rounded-lg shadow-md text-center md:text-left'>
        <div className='flex  gap-4 text-gray-500 mb-2'>
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

      <div className='bg-white  text-gray-500 rounded-lg shadow-md mb-2 pl-2'>
        <button
          title='Copy Ingredients to Clipboard'
          className='float-right  bg-blue-500 text-white px-2 py-1 mt-1 mr-2 rounded-md'
          onClick={() => handleCopyIngredients()}
        >
          <FaCopy />
        </button>
        <ul>
          {recipe.ingredients.map((i, index) => (
            <li key={index}>&#x2022; {i}</li>
          ))}
        </ul>
      </div>
      <h3 className='mt-6 text-lg font-bold mb-2  bg-gray-800 text-white p-2'>
        Directions
      </h3>
      <div className=''>
        <div className='bg-white  text-gray-500 rounded-lg shadow-md mb-2 p-2 '>
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
