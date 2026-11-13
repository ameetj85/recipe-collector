import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { FaStar, FaArrowRight } from 'react-icons/fa';

const NUTRIENTS = [
  ['calories', 'Cal'],
  ['fat', 'Fat'],
  ['carbs', 'Carbs'],
  ['protein', 'Protein'],
];

const RecipeCard = ({ recipe }) => {
  // We want to retain our test recipe, whose images are stored on disc.
  // We also want to show our images that stared in Cloudinary.
  let imagePath = `/images/recipes/${recipe.images[0]}`;
  if (recipe.images[0].includes('https')) {
    imagePath = recipe.images[0];
  }

  const rating = Math.max(0, Math.min(5, Math.round(Number(recipe.starRating) || 0)));
  const href = `/recipes/${recipe._id}`;

  return (
    <div className='group relative flex h-full flex-col overflow-hidden rounded-2xl bg-white shadow-lg shadow-purple-900/5 ring-1 ring-purple-100 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-purple-700/20 hover:ring-purple-300'>
      <Link href={href} className='relative block h-56 overflow-hidden'>
        <Image
          src={imagePath}
          alt={recipe.name}
          fill
          sizes='(max-width: 768px) 100vw, 33vw'
          className='object-cover transition-transform duration-500 group-hover:scale-110'
        />
        <div className='absolute inset-0 bg-linear-to-t from-purple-950/70 via-purple-900/10 to-transparent' />

        <div className='absolute top-3 right-3 flex items-center gap-0.5 rounded-full bg-white/95 px-3 py-1.5 shadow-md'>
          {[...Array(5)].map((_, i) => (
            <FaStar
              key={i}
              className={`text-xs ${
                i < rating ? 'text-amber-400' : 'text-purple-100'
              }`}
            />
          ))}
          <span className='sr-only'>{recipe.starRating} stars</span>
        </div>

        <span className='absolute bottom-3 left-3 rounded-full bg-purple-600/90 px-3 py-1 text-xs font-semibold text-white backdrop-blur-sm'>
          {recipe.category}
        </span>
      </Link>

      <div className='flex flex-1 flex-col p-5'>
        <p className='text-xs font-medium uppercase tracking-wider text-fuchsia-600'>
          {recipe.type}
        </p>
        <h3 className='mt-1 mb-4 font-display text-xl font-bold leading-snug text-purple-950 line-clamp-2'>
          <Link href={href} className='hover:text-purple-700'>
            {recipe.name}
          </Link>
        </h3>

        <div className='mt-auto grid grid-cols-4 gap-2 text-center'>
          {NUTRIENTS.map(([key, label]) => (
            <div key={key} className='rounded-xl bg-purple-50 py-2'>
              <div className='text-sm font-semibold text-purple-800'>
                {recipe.nutritionInfo?.[key] ?? '-'}
              </div>
              <div className='text-[10px] uppercase tracking-wide text-purple-400'>
                {label}
              </div>
            </div>
          ))}
        </div>

        <Link href={href} className='btn-primary mt-5 w-full text-sm'>
          View Recipe
          <FaArrowRight className='transition-transform group-hover:translate-x-1' />
        </Link>
      </div>
    </div>
  );
};

export default RecipeCard;
