import React from 'react';
import { FaBookOpen, FaPlusCircle } from 'react-icons/fa';
import InfoBox from './InfoBox';

const InfoBoxes = () => {
  return (
    <section className='relative z-10 -mt-12 px-4'>
      <div className='container-xl lg:container m-auto'>
        <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
          <InfoBox
            heading='Browse Recipes'
            icon={<FaBookOpen />}
            variant='light'
            buttonInfo={{
              text: 'Browse Recipes',
              link: '/recipes',
            }}
          >
            Find the inspiration for your next meal. Bookmark recipes and
            contact authors.
          </InfoBox>

          <InfoBox
            heading='For Recipe Owners'
            icon={<FaPlusCircle />}
            variant='dark'
            buttonInfo={{
              text: 'Add Recipe',
              link: '/recipes/add',
            }}
          >
            Add your recipes and expand the community of users.
          </InfoBox>
        </div>
      </div>
    </section>
  );
};

export default InfoBoxes;
