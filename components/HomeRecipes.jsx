import React from 'react';
import Link from 'next/link';
import { FaArrowRight } from 'react-icons/fa';
import RecipeCarousel from './RecipeCarousel';
import { fetchRecipes } from '@/utils/requests';

const HomeRecipes = async () => {
  const recipes = await fetchRecipes();

  // Shuffle so the carousel shows a different order on each visit.
  const featured = [...recipes]
    .sort(() => Math.random() - 0.5)
    .slice(0, 12);

  return (
    <section className='py-16'>
      <div className='text-center px-4 mb-4'>
        <span className='badge-purple mb-3'>Fresh from our kitchen</span>
        <h2 className='font-display text-4xl md:text-5xl font-bold gradient-text'>
          Recent Recipes
        </h2>
        <p className='mt-3 text-slate-500 max-w-xl mx-auto'>
          Hover over a card to pause and take a closer look.
        </p>
      </div>

      <RecipeCarousel recipes={featured} />

      <div className='mt-8 text-center px-4'>
        <Link href='/recipes' className='btn-dark px-8 py-4'>
          View All Recipes <FaArrowRight />
        </Link>
      </div>
    </section>
  );
};

export default HomeRecipes;
