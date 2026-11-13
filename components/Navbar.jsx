'use client';
import Image from 'next/image';
import logo from '@/assets/images/logo.jpg';
import profileDefault from '@/assets/images/profile.png';
import Link from 'next/link';
import { FaGoogle } from 'react-icons/fa';
import { useState } from 'react';
import { usePathname } from 'next/navigation';
import UnreadMessageCount from './UnreadMessageCount';
import { signIn, signOut, useSession } from 'next-auth/react';

const navLinkClass = (active) =>
  `${
    active
      ? 'bg-white/15 text-white shadow-inner ring-1 ring-white/20'
      : 'text-purple-100 hover:bg-white/10 hover:text-white'
  } rounded-full px-4 py-2 text-sm font-medium transition-colors`;

const mobileLinkClass = (active) =>
  `${
    active ? 'bg-white/15 text-white' : 'text-purple-100 hover:bg-white/10'
  } block rounded-xl px-4 py-2.5 text-base font-medium`;

const Navbar = () => {
  // status: 'loading' | 'authenticated' | 'unauthenticated'
  const { data: session, status } = useSession();
  const profileImage = session?.user?.image;

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);

  const pathname = usePathname();

  return (
    <nav className='sticky top-0 z-40 bg-linear-to-r from-purple-950 via-purple-800 to-fuchsia-800 shadow-lg shadow-purple-950/20'>
      <div className='mx-auto max-w-7xl px-2 sm:px-6 lg:px-8'>
        <div className='relative flex h-20 items-center justify-between'>
          <div className='absolute inset-y-0 left-0 flex items-center md:hidden'>
            {/* <!-- Mobile menu button--> */}
            <button
              type='button'
              id='mobile-dropdown-button'
              className='relative inline-flex items-center justify-center rounded-full p-2 text-purple-200 hover:bg-white/10 hover:text-white focus:outline-hidden focus:ring-2 focus:ring-inset focus:ring-white'
              aria-controls='mobile-menu'
              aria-expanded={isMobileMenuOpen}
              onClick={() => setIsMobileMenuOpen((prev) => !prev)}
            >
              <span className='absolute -inset-0.5'></span>
              <span className='sr-only'>Open main menu</span>
              <svg
                className='block h-6 w-6'
                fill='none'
                viewBox='0 0 24 24'
                strokeWidth='1.5'
                stroke='currentColor'
                aria-hidden='true'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  d='M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5'
                />
              </svg>
            </button>
          </div>

          <div className='flex flex-1 items-center justify-center md:items-stretch md:justify-start'>
            {/* <!-- Logo --> */}
            <Link className='flex shrink-0 items-center group' href='/'>
              <Image
                className='h-11 w-11 rounded-full object-cover ring-2 ring-white/40 group-hover:ring-fuchsia-300 transition'
                src={logo}
                alt='RecipeApp'
              />

              <span className='hidden md:block font-display text-2xl font-bold ml-3 text-white tracking-tight'>
                Recipe
                <span className='text-fuchsia-300'> App</span>
              </span>
            </Link>
            {/* <!-- Desktop Menu Hidden below md screens --> */}
            <div className='hidden md:ml-8 md:flex md:items-center'>
              <div className='flex space-x-1'>
                <Link href='/' className={navLinkClass(pathname === '/')}>
                  Home
                </Link>
                <Link
                  href='/recipes'
                  className={navLinkClass(pathname === '/recipes')}
                >
                  Recipes
                </Link>
                {session && (
                  <Link
                    href='/recipes/add'
                    className={navLinkClass(pathname === '/recipes/add')}
                  >
                    Add Recipe
                  </Link>
                )}
              </div>
            </div>
          </div>

          {/* <!-- Right Side Menu (Logged Out) --> */}
          {/* Rendered as soon as NextAuth knows there is no session; no
              dependency on a separate getProviders() request. */}
          {status === 'unauthenticated' && (
            <div className='hidden md:block md:ml-6'>
              <div className='flex items-center'>
                <button
                  onClick={() => signIn('google')}
                  className='btn bg-white text-purple-800 hover:bg-purple-50 shadow-md text-sm'
                >
                  <FaGoogle />
                  <span>Login or Register</span>
                </button>
              </div>
            </div>
          )}

          {/* <!-- Right Side Menu (Logged In) --> */}
          {session && (
            <div className='absolute inset-y-0 right-0 flex items-center pr-2 md:static md:inset-auto md:ml-6 md:pr-0'>
              <Link href='/messages' className='relative group'>
                <button
                  type='button'
                  className='relative rounded-full bg-white/10 p-2 text-purple-100 hover:bg-white/20 hover:text-white transition focus:outline-hidden focus:ring-2 focus:ring-white'
                >
                  <span className='absolute -inset-1.5'></span>
                  <span className='sr-only'>View notifications</span>
                  <svg
                    className='h-6 w-6'
                    fill='none'
                    viewBox='0 0 24 24'
                    strokeWidth='1.5'
                    stroke='currentColor'
                    aria-hidden='true'
                  >
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      d='M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0'
                    />
                  </svg>
                </button>

                <UnreadMessageCount session={session} />
              </Link>
              {/* <!-- Profile dropdown button --> */}
              <div className='relative ml-4'>
                <div>
                  <button
                    type='button'
                    className='relative flex rounded-full text-sm ring-2 ring-white/40 hover:ring-fuchsia-300 transition focus:outline-hidden focus:ring-fuchsia-300'
                    id='user-menu-button'
                    aria-expanded={isProfileMenuOpen}
                    aria-haspopup='true'
                    onClick={() => setIsProfileMenuOpen((prev) => !prev)}
                  >
                    <span className='absolute -inset-1.5'></span>
                    <span className='sr-only'>Open user menu</span>
                    <Image
                      className='h-9 w-9 rounded-full'
                      src={profileImage || profileDefault}
                      alt=''
                      width={40}
                      height={40}
                    />
                  </button>
                </div>

                {/* <!-- Profile dropdown --> */}
                {isProfileMenuOpen && (
                  <div
                    id='user-menu'
                    className='absolute right-0 z-50 mt-3 w-52 origin-top-right overflow-hidden rounded-2xl bg-white py-2 shadow-2xl shadow-purple-900/20 ring-1 ring-purple-100 focus:outline-hidden'
                    role='menu'
                    aria-orientation='vertical'
                    aria-labelledby='user-menu-button'
                    tabIndex='-1'
                  >
                    <Link
                      href='/profile'
                      className='block px-4 py-2 text-sm text-slate-700 hover:bg-purple-50 hover:text-purple-800'
                      role='menuitem'
                      tabIndex='-1'
                      id='user-menu-item-0'
                      onClick={() => {
                        setIsProfileMenuOpen(false);
                      }}
                    >
                      Your Profile
                    </Link>
                    <Link
                      href='/recipes/saved'
                      className='block px-4 py-2 text-sm text-slate-700 hover:bg-purple-50 hover:text-purple-800'
                      role='menuitem'
                      tabIndex='-1'
                      id='user-menu-item-1'
                      onClick={() => {
                        setIsProfileMenuOpen(false);
                      }}
                    >
                      Saved Recipes
                    </Link>
                    <div className='my-1 border-t border-purple-100' />
                    <button
                      onClick={() => {
                        setIsProfileMenuOpen(false);
                        signOut();
                      }}
                      className='block w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-purple-50 hover:text-purple-800'
                      role='menuitem'
                      tabIndex='-1'
                      id='user-menu-item-2'
                    >
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* <!-- Mobile menu, show/hide based on menu state. --> */}
      {isMobileMenuOpen && (
        <div id='mobile-menu' className='md:hidden border-t border-white/10'>
          <div className='space-y-1 px-3 pb-4 pt-3'>
            <Link href='/' className={mobileLinkClass(pathname === '/')}>
              Home
            </Link>
            <Link
              href='/recipes'
              className={mobileLinkClass(pathname === '/recipes')}
            >
              Recipes
            </Link>

            {session && (
              <Link
                href='/recipes/add'
                className={mobileLinkClass(pathname === '/recipes/add')}
              >
                Add Recipe
              </Link>
            )}

            {status === 'unauthenticated' && (
              <button
                onClick={() => signIn('google')}
                className='btn bg-white text-purple-800 hover:bg-purple-50 mt-2 w-full'
              >
                <FaGoogle />
                <span>Login or Register</span>
              </button>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
