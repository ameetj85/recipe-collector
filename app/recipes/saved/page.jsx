'use client';

import React, { useEffect, useState } from 'react';
import RecipeCard from '@/components/RecipeCard';
import Spinner from '@/components/Spinner';
import { toast } from 'react-toastify';

const SavedRecipesPage = () => {
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSavedRecipes = async () => {
      try {
        const res = await fetch(`/api/bookmarks`);

        if (res.status === 200) {
          const data = await res.json();
          setRecipes(data);
        } else {
          console.log(res.statusText);
          toast.error('Failed to fetch saved recipes: ' + res.status);
        }
      } catch (error) {
        console.log(error);
        toast.error('Failed to fetch saved recipes!');
      } finally {
        setLoading(false);
      }
    };

    fetchSavedRecipes();
  }, []);

  return loading ? (
    <Spinner loading={loading} />
  ) : (
    <section className='px-4 py-6'>
      <h1 className='text-2xl mb-4'>Saved Recipes</h1>
      <div className='container-xl lg:container m-auto px-4 py-6'>
        {recipes.length === 0 ? (
          <p>No recipes found</p>
        ) : (
          <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
            {recipes.map((recipe) => (
              <RecipeCard key={recipe._id} recipe={recipe} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default SavedRecipesPage;
