import React from 'react';
import Image from 'next/image';

const RecipeImages = ({ images }) => {
  return (
    <section className='bg-blue-50 p-4'>
      <div className='container mx-auto'>
        {images.length === 1 ? (
          <Image
            src={images[0]}
            alt=''
            className='object-cover h-[400px] mx-auto rounded-xl'
            width={1800}
            height={400}
            priority={true}
          />
        ) : (
          <div className='grid grid-cols-2 gap-4'>
            {images.map((img, index) => (
              <>
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
                    className='object-cover h-[400px] w-full rounded-xl'
                    sizes='100vw'
                    width={0}
                    height={0}
                    priority={true}
                  />
                </div>
              </>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default RecipeImages;
