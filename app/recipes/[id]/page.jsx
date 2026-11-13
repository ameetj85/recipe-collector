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
import BookmarkButton from '@/components/BookmarButton';
import ShareButtons from '@/components/ShareButtons';
import RecipeContactForm from '@/components/RecipeContactForm';

const RecipePage = () => {
  const { id } = useParams();
  const [recipe, setRecipe] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRecipeData = async () => {
      if (!id) return;

      try {
        const recipe = await fetchRecipe(id);
        setRecipe(recipe);
      } catch (error) {
        console.error('Error fetching recipe: ', error);
        return null;
      } finally {
        setLoading(false);
      }
    };

    if (recipe === null) {
      fetchRecipeData();
    }
  }, [id, recipe]);

  if (!recipe && !loading) {
    return (
      <h1 className='font-display text-center text-3xl font-bold mt-16 gradient-text'>
        Recipe Not Found
      </h1>
    );
  }

  return (
    <>
      {loading && <Spinner loading={loading} />}

      {!loading && recipe && (
        <>
          <RecipeHeaderImage
            image={recipe.images[0]}
            title={recipe.name}
            subtitle={`${recipe.category} · ${recipe.type}`}
          />

          <section className='page-bg'>
            <div className='container m-auto pt-6 px-6'>
              <Link
                href='/recipes'
                className='inline-flex items-center font-medium text-purple-600 hover:text-fuchsia-600'
              >
                <FaArrowLeft className='mr-2'></FaArrowLeft> Back to Recipes
              </Link>
            </div>
          </section>

          <section className='page-bg'>
            <div className='container m-auto py-8 px-6'>
              <div className='grid grid-cols-1 md:grid-cols-70/30 w-full gap-6'>
                <RecipeDetails recipe={recipe} />

                {/* <!-- Sidebar --> */}
                <aside className='space-y-6 md:sticky md:top-28 self-start'>
                  <BookmarkButton recipe={recipe} />
                  <ShareButtons recipe={recipe} />
                  <RecipeContactForm recipe={recipe} />
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
