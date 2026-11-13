import React from 'react';
import Link from 'next/link';
import { FaArrowRight } from 'react-icons/fa';

const variants = {
  light: {
    box: 'bg-white ring-1 ring-purple-100',
    heading: 'text-purple-950',
    text: 'text-slate-600',
    icon: 'bg-purple-100 text-purple-700',
    button: 'btn-dark',
  },
  dark: {
    box: 'bg-linear-to-br from-purple-700 via-purple-600 to-fuchsia-600 text-white',
    heading: 'text-white',
    text: 'text-purple-100',
    icon: 'bg-white/15 text-white',
    button: 'btn bg-white text-purple-800 hover:bg-purple-50 shadow-lg',
  },
};

const InfoBox = ({ heading, icon, variant = 'light', buttonInfo, children }) => {
  const v = variants[variant];

  return (
    <div
      className={`${v.box} relative overflow-hidden p-8 rounded-3xl shadow-xl shadow-purple-900/10 transition-transform duration-300 hover:-translate-y-1`}
    >
      <div className='pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-fuchsia-400/20 blur-2xl' />
      {icon && (
        <div
          className={`${v.icon} mb-5 inline-flex h-12 w-12 items-center justify-center rounded-2xl text-xl`}
        >
          {icon}
        </div>
      )}
      <h2 className={`${v.heading} font-display text-2xl font-bold`}>
        {heading}
      </h2>
      <p className={`${v.text} mt-2 mb-6`}>{children}</p>
      <Link href={buttonInfo.link} className={v.button}>
        {buttonInfo.text} <FaArrowRight className='text-sm' />
      </Link>
    </div>
  );
};

export default InfoBox;
