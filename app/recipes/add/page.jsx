import React from 'react';
import RecipeAddForm from '@/components/RecipeAddForm';

const RecipeAddPage = () => {
  return (
    <section className='page-bg'>
      <div className='container m-auto max-w-5xl py-16'>
        <div className='panel px-6 md:px-10 py-10 mb-4 m-4 md:m-0'>
          <RecipeAddForm />
        </div>
      </div>
    </section>
  );
};

export default RecipeAddPage;
