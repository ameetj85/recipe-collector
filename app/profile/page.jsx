import React from 'react';
import Image from 'next/image';
import profileDefault from '@/assets/images/profile.png';
import ProfileRecipes from '@/components/ProfileRecipes';
import { getSessionUser } from '@/utils/getSessionUser';
import { getRecipesByOwner } from '@/utils/queries';

const ProfilePage = async () => {
  // middleware.js guards this route, so a session is expected
  const sessionUser = await getSessionUser();
  const profileImage = sessionUser?.user?.image;
  const profileName = sessionUser?.user?.name;
  const profileEmail = sessionUser?.user?.email;

  const recipes = await getRecipesByOwner(sessionUser?.userId);

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
              <ProfileRecipes recipes={recipes} />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ProfilePage;
