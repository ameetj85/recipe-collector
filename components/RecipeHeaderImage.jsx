import React from 'react';
import Image from 'next/image';

const RecipeHeaderImage = ({ image }) => {
  // We want to retain our test properties, whose images are stored on disc.
  // We also want to show our images that stared in Cloudinary.
  let imagePath = `/images/recipes/${image}`;
  if (image.includes('http')) {
    imagePath = image;
  }

  return (
    <section>
      <div className='container-xl m-auto'>
        <div className='grid grid-cols-1'>
          <img
            src={imagePath}
            alt=''
            className='object-cover h-[400px] w-full'
            width={0}
            height={0}
            sizes='100vw'
            priority={true}
          />
        </div>
      </div>
    </section>
  );
};

export default RecipeHeaderImage;
