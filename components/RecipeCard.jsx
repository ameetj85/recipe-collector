import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { FaBreadSlice, FaCorn } from 'react-icons/fa';

const RecipeCard = ({ recipe }) => {
  return (
    <div className='rounded-xl shadow-md relative'>
      <Image
        src={`/images/recipes/${recipe.images[0]}`}
        alt=''
        sizes='100vw'
        height={0}
        width={0}
        className='w-full h-auto rounded-t-xl'
      />

      <div className='p-2'>
        <div className='text-left md:text-center lg:text-left mb-2'>
          <div className='text-gray-600'>{recipe.category}</div>
          <h3 className='text-xl font-bold'>{recipe.name}</h3>
        </div>
        <h3 className='absolute top-[10px] right-[10px] bg-white px-4 py-2 rounded-lg text-blue-500 font-bold text-right md:text-center lg:text-right'>
          Star Rating: {recipe.starRating}
        </h3>

        <div className='flex justify-center gap-4 text-gray-500 mb-2'>
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

      <div className='p-2'>
        <div className='flex flex-col lg:flex-row justify-between mb-2'>
          <Link
            href={`/recipes/${recipe._id}`}
            className='h-[36px] bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-center text-sm'
          >
            Details
          </Link>
        </div>
      </div>
    </div>
  );
};

export default RecipeCard;
