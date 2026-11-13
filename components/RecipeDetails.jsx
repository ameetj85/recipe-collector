import React from 'react';
import {
  FaCopy,
  FaPrint,
  FaStar,
  FaClock,
  FaFire,
  FaExternalLinkAlt,
  FaUtensils,
} from 'react-icons/fa';
import { toast } from 'react-toastify';
import '@/components/RecipeDetails.css';

const RecipeDetails = ({ recipe }) => {
  const directions = recipe.directions.split('\n').filter((d) => d.trim());
  const rating = Math.max(
    0,
    Math.min(5, Math.round(Number(recipe.starRating) || 0))
  );

  const handleCopyIngredients = () => {
    const ingredients = recipe.ingredients.join('\r\n');
    navigator.clipboard.writeText(ingredients);
    toast.success('Ingredients copied to clipboard');
  };

  const nutrition = [
    ['Calories', recipe.nutritionInfo.calories],
    ['Fat', recipe.nutritionInfo.fat],
    ['Carbs', recipe.nutritionInfo.carbs],
    ['Protein', recipe.nutritionInfo.protein],
  ];

  const times = [
    ['Prep Time', recipe.prepTime],
    ['Cook Time', recipe.cookTime],
    ['Total Time', recipe.totalTime],
  ];

  return (
    <main>
      <div className='panel p-6 md:p-8'>
        <div className='flex flex-wrap items-center gap-3 mb-4'>
          <span className='badge-purple'>
            <FaUtensils /> {recipe.type}
          </span>
          <span className='badge bg-fuchsia-100 text-fuchsia-700'>
            {recipe.category}
          </span>
          <span className='flex items-center gap-0.5 ml-1'>
            {[...Array(5)].map((_, i) => (
              <FaStar
                key={i}
                className={i < rating ? 'text-amber-400' : 'text-purple-100'}
              />
            ))}
            <span className='ml-2 text-sm text-slate-500'>
              {recipe.starRating} stars
            </span>
          </span>
          <button
            title='Print this Recipe'
            className='btn-icon ml-auto'
            onClick={() => window.print()}
          >
            <FaPrint />
          </button>
        </div>
        <h1 className='font-display text-3xl md:text-4xl font-bold text-purple-950'>
          {recipe.name}
        </h1>
        {recipe.url && (
          <a
            target='_blank'
            href={recipe.url}
            rel='noopener noreferrer'
            className='mt-3 inline-flex items-center gap-2 text-sm font-medium text-purple-600 hover:text-fuchsia-600'
          >
            View original recipe <FaExternalLinkAlt className='text-xs' />
          </a>
        )}
      </div>

      <h3 className='section-title'>Description</h3>
      <div className='panel p-6 text-slate-600 leading-relaxed'>
        {recipe.description}
      </div>

      <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
        <div>
          <h3 className='section-title'>Nutrition Information</h3>
          <div className='panel p-5 grid grid-cols-4 gap-3 text-center'>
            {nutrition.map(([label, value]) => (
              <div
                key={label}
                className='rounded-xl bg-gradient-to-br from-purple-50 to-fuchsia-50 py-3'
              >
                <FaFire className='mx-auto mb-1 text-fuchsia-400' />
                <div className='text-lg font-bold text-purple-800'>{value}</div>
                <div className='text-xs uppercase tracking-wide text-purple-400'>
                  {label}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h3 className='section-title'>Preparation</h3>
          <div className='panel p-5 grid grid-cols-3 gap-3 text-center'>
            {times.map(([label, value]) => (
              <div
                key={label}
                className='rounded-xl bg-gradient-to-br from-purple-50 to-fuchsia-50 py-3'
              >
                <FaClock className='mx-auto mb-1 text-purple-400' />
                <div className='text-lg font-bold text-purple-800'>
                  {value}
                  <span className='text-xs font-medium text-purple-400'>
                    {' '}
                    min
                  </span>
                </div>
                <div className='text-xs uppercase tracking-wide text-purple-400'>
                  {label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className='flex items-center justify-between'>
        <h3 className='section-title'>Ingredients</h3>
        <button
          title='Copy Ingredients to Clipboard'
          className='btn-icon mt-5'
          onClick={handleCopyIngredients}
        >
          <FaCopy />
        </button>
      </div>
      <div className='panel p-6'>
        <ul className='grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2'>
          {recipe.ingredients.map((i, index) => (
            <li key={index} className='flex items-start gap-3 text-slate-700'>
              <span className='mt-2 h-2 w-2 flex-shrink-0 rounded-full bg-gradient-to-br from-purple-500 to-fuchsia-500' />
              {i}
            </li>
          ))}
        </ul>
      </div>

      <h3 className='section-title'>Directions</h3>
      <div className='panel p-6'>
        <ol className='space-y-4'>
          {directions.map((step, index) => (
            <li key={index} className='flex gap-4'>
              <span className='flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-purple-600 to-fuchsia-600 text-sm font-bold text-white shadow-md shadow-purple-500/30'>
                {index + 1}
              </span>
              <p className='pt-1 text-slate-700 leading-relaxed'>{step}</p>
            </li>
          ))}
        </ol>
      </div>
    </main>
  );
};

export default RecipeDetails;
