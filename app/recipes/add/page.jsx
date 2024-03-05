import React from 'react';
import RecipeAddForm from '@/components/RecipeAddForm';

const RecipeAddPage = () => {
  return (
    <section className='bg-blue-50'>
      <div className='container m-auto max-w-5xl py-24'>
        <div className='bg-white px-6 py-8 mb-4 shadow-md rounded-md border m-4 md:m-0'>
          <RecipeAddForm />
        </div>
      </div>
    </section>
  );
};

export default RecipeAddPage;
