import React from 'react';
import Link from 'next/link';
import { FaExclamationTriangle } from 'react-icons/fa';

const NotFoundPage = () => {
  return (
    <section className='page-bg min-h-screen grow'>
      <div className='container m-auto max-w-2xl py-24'>
        <div className='panel px-6 py-20 mb-4 m-4 md:m-0'>
          <div className='flex justify-center'>
            <div className='flex h-28 w-28 items-center justify-center rounded-full bg-linear-to-br from-purple-100 to-fuchsia-100'>
              <FaExclamationTriangle className='text-6xl text-fuchsia-500' />
            </div>
          </div>
          <div className='text-center'>
            <h1 className='font-display text-4xl font-bold mt-6 mb-2 gradient-text'>
              Page Not Found
            </h1>
            <p className='text-slate-500 text-lg mb-10'>
              The page you are looking for does not exist.
            </p>
            <Link href='/' className='btn-primary px-8 py-3'>
              Go Home
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};

export default NotFoundPage;
