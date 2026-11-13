import React from 'react';
import Image from 'next/image';

const RecipeImages = ({ images }) => {
  return (
    <section className='page-bg px-6 pb-10'>
      <div className='container mx-auto'>
        <h3 className='section-title'>Gallery</h3>
        {images.length === 1 ? (
          <Image
            src={
              images[0].includes('http')
                ? images[0]
                : `/images/recipes/${images[0]}`
            }
            alt=''
            className='object-cover h-[400px] w-full mx-auto rounded-2xl shadow-xl shadow-purple-900/10 ring-1 ring-purple-100'
            width={1800}
            height={400}
            priority
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
                  src={img.includes('http') ? img : `/images/recipes/${img}`}
                  alt=''
                  className='object-cover h-[400px] w-full rounded-2xl shadow-xl shadow-purple-900/10 ring-1 ring-purple-100'
                  sizes='100vw'
                  width={0}
                  height={0}
                  priority
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
