'use client';
import React from 'react';
import ClipLoader from 'react-spinners/ClipLoader';

const override = {
  display: 'block',
  margin: '100px auto',
  borderWidth: '6px',
};

const Spinner = ({ loading }) => {
  return (
    <ClipLoader
      color='#9333ea'
      loading={loading}
      cssOverride={override}
      size={120}
      aria-label='Loading Spinner'
    />
  );
};

export default Spinner;
