'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import React from 'react';
import Link from 'next/link';
import { FaArrowLeft } from 'react-icons/fa';
import Spinner from '@/components/Spinner';
import { fetchRecipe } from '@/utils/requests';
import RecipeHeaderImage from '@/components/RecipeHeaderImage';
import RecipeDetails from '@/components/RecipeDetails';
import RecipeImages from '@/components/RecipeImages';

const RecipePage = () => {
  const { id } = useParams();
  const [recipe, setRecipe] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPropertyData = async () => {
      if (!id) return;

      try {
        const recipe = await fetchRecipe(id);
        setRecipe(recipe);
      } catch (error) {
        console.error('Error fetching property: ', error);
        return null;
      } finally {
        setLoading(false);
      }
    };

    if (recipe === null) {
      fetchPropertyData();
    }
  }, [id, recipe]);

  if (!recipe && !loading) {
    return (
      <h1 className='text-center text-2xl font-bold mt-10'>
        Recipe Not Found!!
      </h1>
    );
  }

  return (
    <>
      {loading && <Spinner loading={loading} />}

      {!loading && recipe && (
        <>
          <RecipeHeaderImage image={recipe.images[0]} />

          <section>
            <div className='container m-auto py-6 px-6'>
              <Link
                href='/recipes'
                className='text-blue-500 hover:text-blue-600 flex items-center'
              >
                <FaArrowLeft className='mr-2'></FaArrowLeft> Back to Recipes
              </Link>
            </div>
          </section>

          <section className='bg-blue-50'>
            <div className='container m-auto py-10 px-6'>
              <div className='grid grid-cols-1 md:grid-cols-70/30 w-full gap-6'>
                <RecipeDetails recipe={recipe} />

                {/* <!-- Sidebar --> */}
                <aside className='space-y-4'>
                  <button className='bg-blue-500 hover:bg-blue-600 text-white font-bold w-full py-2 px-4 rounded-full flex items-center justify-center'>
                    <i className='fas fa-bookmark mr-2'></i> Bookmark Recipe
                  </button>
                  <button className='bg-orange-500 hover:bg-orange-600 text-white font-bold w-full py-2 px-4 rounded-full flex items-center justify-center'>
                    <i className='fas fa-share mr-2'></i> Share Recipe
                  </button>

                  {/* <!-- Contact Form --> */}
                  <div className='bg-white p-6 rounded-lg shadow-md'>
                    <h3 className='text-xl font-bold mb-6'>
                      Contact Recipe Owner
                    </h3>
                    <form>
                      <div className='mb-4'>
                        <label
                          className='block text-gray-700 text-sm font-bold mb-2'
                          htmlFor='name'
                        >
                          Name:
                        </label>
                        <input
                          className='shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline'
                          id='name'
                          type='text'
                          placeholder='Enter your name'
                          required
                        />
                      </div>
                      <div className='mb-4'>
                        <label
                          className='block text-gray-700 text-sm font-bold mb-2'
                          htmlFor='email'
                        >
                          Email:
                        </label>
                        <input
                          className='shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline'
                          id='email'
                          type='email'
                          placeholder='Enter your email'
                          required
                        />
                      </div>
                      <div className='mb-4'>
                        <label
                          className='block text-gray-700 text-sm font-bold mb-2'
                          htmlFor='phone'
                        >
                          Phone:
                        </label>
                        <input
                          className='shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline'
                          id='phone'
                          type='text'
                          placeholder='Enter your phone number'
                        />
                      </div>
                      <div className='mb-4'>
                        <label
                          className='block text-gray-700 text-sm font-bold mb-2'
                          htmlFor='message'
                        >
                          Message:
                        </label>
                        <textarea
                          className='shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 h-44 focus:outline-none focus:shadow-outline'
                          id='message'
                          placeholder='Enter your message'
                        ></textarea>
                      </div>
                      <div>
                        <button
                          className='bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-full w-full focus:outline-none focus:shadow-outline flex items-center justify-center'
                          type='submit'
                        >
                          <i className='fas fa-paper-plane mr-2'></i> Send
                          Message
                        </button>
                      </div>
                    </form>
                  </div>
                </aside>
              </div>
            </div>
          </section>
          <RecipeImages images={recipe.images} />
        </>
      )}
    </>
  );
};

export default RecipePage;
