import React from 'react';
import Hero from '@/components/Hero';
import InfoBoxes from '@/components/InfoBoxes';
import HomeRecipes from '@/components/HomeRecipes';

const HomePage = () => {
  return (
    <>
      <Hero />
      <InfoBoxes />
      <HomeRecipes />
    </>
  );
};

export default HomePage;
