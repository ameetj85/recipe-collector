import React from 'react';
import InfoBox from './InfoBox';

const InfoBoxes = () => {
  return (
    <section>
      <div className='container-xl lg:container m-auto'>
        <div className='grid grid-cols-1 md:grid-cols-2 gap-4 p-4 rounded-lg'>
          <InfoBox
            heading='Browse'
            backgroundColor='bg-gray-100'
            buttonInfo={{
              text: 'Browse Recipe',
              link: '/recipes',
              backgroundColor: 'bg-black',
            }}
          >
            Find the inspiration for your next meal. Bookmark recipes and
            contact authors.
          </InfoBox>

          <InfoBox
            heading='For Recipe Owners'
            backgroundColor='bg-blue-100'
            buttonInfo={{
              text: 'Add Recipe',
              link: '/recipes/add',
              backgroundColor: 'bg-blue-500',
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
