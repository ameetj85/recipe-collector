import React from 'react';
import { redirect } from 'next/navigation';
import RecipeEditForm from '@/components/RecipeEditForm';
import { getSessionUser } from '@/utils/getSessionUser';
import { getRecipeById } from '@/utils/queries';

const RecipeEditPage = async (props) => {
  const { id } = await props.params;
  const [recipe, sessionUser] = await Promise.all([
    getRecipeById(id),
    getSessionUser(),
  ]);

  if (!recipe) {
    return (
      <h1 className='font-display text-center text-3xl font-bold mt-16 gradient-text'>
        Recipe Not Found
      </h1>
    );
  }

  // Only the owner may edit; everyone else goes back to the recipe.
  // (updateRecipe re-checks this, since Server Actions are public endpoints.)
  if (recipe.owner !== sessionUser?.userId) {
    redirect(`/recipes/${recipe._id}`);
  }

  return (
    <section className='page-bg'>
      <div className='container m-auto max-w-2xl py-16'>
        <div className='panel px-6 md:px-10 py-10 mb-4 m-4 md:m-0'>
          <RecipeEditForm recipe={recipe} />
        </div>
      </div>
    </section>
  );
};

export default RecipeEditPage;
