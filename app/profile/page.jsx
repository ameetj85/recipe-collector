'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { UseSessionOptions, useSession } from 'next-auth/react';
import profileDefault from '@/assets/images/profile.png';
import Spinner from '@/components/Spinner';
import { toast } from 'react-toastify';

const toastOptions = {
  autoClose: false,
  position: 'bottom-right',
  closeOnClick: true,
};

const ProfilePage = () => {
  const { data: session } = useSession();
  const profileImage = session?.user?.image;
  const profileName = session?.user?.name;
  const profileEmail = session?.user?.email;

  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserRecipes = async (userId) => {
      if (!userId) {
        return;
      }

      try {
        const res = await fetch(`/api/recipes/user/${userId}`);

        if (res.status === 200) {
          const data = await res.json();
          setRecipes(data);
        }
      } catch (error) {
        console.log(error);
      } finally {
        setLoading(false);
      }
    };

    // Fetch user recipes when session is available
    if (session?.user?.id) {
      fetchUserRecipes(session.user.id);
    }
  }, [session]);

  const handleDeleteRecipe = async (recipeId) => {
    const confirmed = window.confirm(
      'Are you sure you want to delete this recipe?'
    );

    if (!confirmed) return;

    try {
      const res = await fetch(`/api/recipes/${recipeId}`, {
        method: 'DELETE',
      });

      console.log('Delete status:', res.status);

      if (res.status === 200) {
        // Remove the recipeId from state
        const updatedRecipes = recipes.filter(
          (recipe) => recipe._id !== recipeId
        );

        setRecipes(updatedRecipes);

        toast.success('Recipe Deleted', { position: 'bottom-right' });
      } else {
        toast.error('Failed to delete recipe', toastOptions);
      }
    } catch (error) {
      console.log(error);
      toast.error('Failed to delete recipe'), toastOptions;
    }
  };

  return (
    <section className='page-bg'>
      <div className='container m-auto py-16'>
        <div className='panel overflow-hidden mb-4 m-4 md:m-0'>
          <div className='gradient-hero px-8 pt-10 pb-20'>
            <h1 className='font-display text-4xl font-bold text-white'>
              Your Profile
            </h1>
          </div>
          <div className='flex flex-col md:flex-row gap-8 px-6 md:px-10 pb-10'>
            <div className='md:w-1/4 text-center md:text-left'>
              <div className='mb-6 -mt-16'>
                <Image
                  className='h-32 w-32 md:h-44 md:w-44 rounded-full mx-auto md:mx-0 ring-4 ring-white shadow-xl shadow-purple-900/20'
                  src={profileImage || profileDefault}
                  width={200}
                  height={200}
                  alt='User'
                />
              </div>
              <h2 className='text-xl mb-4 text-slate-700 break-words'>
                <span className='block text-xs font-semibold uppercase tracking-wider text-purple-500'>
                  Name
                </span>
                {profileName}
              </h2>
              <h2 className='text-xl text-slate-700 break-words'>
                <span className='block text-xs font-semibold uppercase tracking-wider text-purple-500'>
                  Email
                </span>
                {profileEmail}
              </h2>
            </div>

            <div className='md:w-3/4 md:pt-6'>
              <h2 className='section-title !mt-0'>Your Listings</h2>
              {!loading && recipes.length === 0 && (
                <p className='rounded-xl bg-purple-50 p-6 text-purple-700'>
                  You have no recipe listings
                </p>
              )}
              <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>

              {loading ? (
                <Spinner loading={loading} />
              ) : (
                recipes.map((recipe) => (
                  <div
                    key={recipe._id}
                    className='overflow-hidden rounded-2xl bg-white ring-1 ring-purple-100 shadow-md transition hover:shadow-xl hover:shadow-purple-700/10'
                  >
                    <Link href={`/recipes/${recipe._id}`}>
                      <Image
                        className='h-40 w-full object-cover'
                        src={
                          recipe.images[0].includes('http')
                            ? recipe.images[0]
                            : `/images/recipes/${recipe.images[0]}`
                        }
                        alt=''
                        width={500}
                        height={100}
                        priority={true}
                      />
                    </Link>
                    <div className='px-5 pt-4'>
                      <p className='font-display text-lg font-bold text-purple-950'>
                        {recipe.name}
                      </p>
                      <p className='mt-1 text-sm text-slate-500 line-clamp-2'>
                        {recipe.description}
                      </p>
                    </div>
                    <div className='flex gap-3 px-5 py-4'>
                      <Link
                        href={`/recipes/${recipe._id}/edit`}
                        className='btn-primary text-sm px-6'
                      >
                        Edit
                      </Link>
                      <button
                        onClick={() => handleDeleteRecipe(recipe._id)}
                        className='btn-danger text-sm px-6'
                        type='button'
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))
              )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ProfilePage;
