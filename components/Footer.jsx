import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import logo from '@/assets/images/logo.png';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className='relative mt-24 bg-gradient-to-br from-purple-950 via-purple-900 to-fuchsia-900 text-purple-100'>
      <div className='h-1 w-full bg-gradient-to-r from-purple-400 via-fuchsia-400 to-purple-400' />
      <div className='container mx-auto px-6 py-10 flex flex-col md:flex-row items-center justify-between gap-6'>
        <div className='flex items-center gap-3'>
          <Image
            src={logo}
            alt='Logo'
            className='h-10 w-auto rounded-lg bg-white/90 p-1'
          />
          <span className='font-display text-xl font-bold text-white'>
            Recipe <span className='text-fuchsia-300'>App</span>
          </span>
        </div>

        <nav className='flex gap-6 text-sm'>
          <Link href='/' className='hover:text-white transition-colors'>
            Home
          </Link>
          <Link href='/recipes' className='hover:text-white transition-colors'>
            Recipes
          </Link>
          <Link
            href='/recipes/add'
            className='hover:text-white transition-colors'
          >
            Add Recipe
          </Link>
        </nav>

        <p className='text-sm text-purple-300'>
          &copy; {currentYear} Pillys Recipe App. All rights reserved.
        </p>
      </div>
    </footer>
  );
};

export default Footer;
