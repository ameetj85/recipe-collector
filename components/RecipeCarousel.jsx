import React from 'react';
import RecipeCard from './RecipeCard';

// Continuously auto-scrolling (right to left) carousel. Pure CSS: the list is
// rendered twice and the track slides by -50%, so the loop is seamless.
// Hovering or focusing a card pauses it; reduced-motion users get a normal
// horizontally scrollable row instead. Styles live in globals.css (.marquee).
const RecipeCarousel = ({ recipes }) => {
  if (!recipes || recipes.length === 0) {
    return (
      <p className='text-center text-purple-700'>No recipes found</p>
    );
  }

  // Short lists are repeated so one copy is always wider than the viewport.
  let items = recipes;
  while (items.length < 8) {
    items = items.concat(recipes);
  }

  // Keep the speed constant (~5s per card) regardless of how many there are.
  const duration = `${items.length * 5}s`;

  return (
    <div className='marquee overflow-hidden py-6'>
      <div className='marquee-track' style={{ '--marquee-duration': duration }}>
        {[0, 1].map((copy) =>
          items.map((recipe, index) => (
            <div
              key={`${copy}-${index}-${recipe._id}`}
              className='w-72 sm:w-80 flex-shrink-0 px-3'
              // The duplicate set only exists for the seamless loop.
              aria-hidden={copy === 1 ? 'true' : undefined}
            >
              <RecipeCard recipe={recipe} />
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default RecipeCarousel;
