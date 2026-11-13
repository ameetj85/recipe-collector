import React from 'react';
import Image from 'next/image';
import { imageSrc } from '@/utils/imageSrc';

const RecipeImages = ({ images }) => {
  return (
    <section className='page-bg px-6 pb-10'>
      <div className='container mx-auto'>
        <h3 className='section-title'>Gallery</h3>
        {images.length === 1 ? (
          <Image
            src={imageSrc(images[0])}
            alt=''
            className='object-cover h-[400px] w-full mx-auto rounded-2xl shadow-xl shadow-purple-900/10 ring-1 ring-purple-100'
            width={1800}
            height={400}
            sizes='(min-width: 1536px) 1536px, 100vw'
            preload
          />
        ) : (
          <div className='grid grid-cols-1 sm:grid-cols-2 gap-6'>
            {images.map((img, index) => (
              <div
                key={index}
                className={`
                  ${
                    images.length === 3 && index == 2
                      ? 'col-span-2'
                      : 'col-span-1'
                  }
                `}
              >
                <Image
                  src={imageSrc(img)}
                  alt=''
                  className='object-cover h-[400px] w-full rounded-2xl shadow-xl shadow-purple-900/10 ring-1 ring-purple-100'
                  sizes='(min-width: 1536px) 768px, (min-width: 640px) 50vw, 100vw'
                  width={0}
                  height={0}
                  preload
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default RecipeImages;
