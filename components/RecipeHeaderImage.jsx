import React from 'react';
import Image from 'next/image';
import { imageSrc } from '@/utils/imageSrc';

const RecipeHeaderImage = ({ image, title, subtitle }) => {
  return (
    <section className='relative h-[320px] md:h-[440px] overflow-hidden'>
      {/* Full-bleed: sizes="100vw" lets next/image pick a variant that
          matches the screen width (and DPR) instead of sending the original. */}
      <Image
        src={imageSrc(image)}
        alt=''
        fill
        sizes='100vw'
        preload
        className='object-cover'
      />
      <div className='absolute inset-0 bg-linear-to-t from-purple-950/90 via-purple-900/40 to-fuchsia-900/10' />
      {title && (
        <div className='relative container m-auto h-full px-6 flex flex-col justify-end pb-10'>
          {subtitle && (
            <span className='mb-3 self-start rounded-full bg-white/15 px-4 py-1 text-sm font-medium text-fuchsia-100 ring-1 ring-white/25 backdrop-blur-sm'>
              {subtitle}
            </span>
          )}
          <h1 className='font-display text-4xl md:text-6xl font-bold text-white drop-shadow-lg max-w-4xl'>
            {title}
          </h1>
        </div>
      )}
    </section>
  );
};

export default RecipeHeaderImage;
