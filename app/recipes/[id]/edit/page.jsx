import React from 'react';
import RecipeEditForm from '@/components/RecipeEditForm';

const RecipeEditPage = () => {
  return (
    <section className='page-bg'>
      <div className='container m-auto max-w-2xl py-16'>
        <div className='panel px-6 md:px-10 py-10 mb-4 m-4 md:m-0'>
          <RecipeEditForm />
        </div>
      </div>
    </section>
  );
};

export default RecipeEditPage;
