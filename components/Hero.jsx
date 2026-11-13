import React from 'react';
import RecipeSearchForm from './RecipeSearchForm';

const Hero = () => {
  return (
    <section className='relative overflow-hidden gradient-hero py-24 md:py-32'>
      {/* Decorative glow blobs */}
      <div className='pointer-events-none absolute -top-24 -left-24 h-96 w-96 rounded-full bg-fuchsia-500/30 blur-3xl' />
      <div className='pointer-events-none absolute -bottom-32 right-0 h-[28rem] w-[28rem] rounded-full bg-purple-400/30 blur-3xl' />
      <div className='pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.08)_1px,transparent_0)] [background-size:24px_24px]' />

      <div className='relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col items-center'>
        <div className='text-center'>
          <span className='inline-block mb-5 rounded-full bg-white/10 px-4 py-1.5 text-sm font-medium text-fuchsia-200 ring-1 ring-white/20 backdrop-blur'>
            Cook. Share. Savor.
          </span>
          <h1 className='font-display text-5xl font-extrabold tracking-tight text-white sm:text-6xl md:text-7xl'>
            Find The{' '}
            <span className='bg-gradient-to-r from-fuchsia-300 via-pink-200 to-purple-200 bg-clip-text text-transparent'>
              Perfect Recipe
            </span>
          </h1>
          <p className='mt-6 mb-8 text-lg md:text-xl text-purple-100/90 max-w-2xl mx-auto'>
            Discover your next delicious meal from a growing collection of
            home-cooked favourites.
          </p>
        </div>

        <RecipeSearchForm />
      </div>
    </section>
  );
};

export default Hero;
