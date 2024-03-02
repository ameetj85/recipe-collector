import React from 'react';
import '@/assets/styles/globals.css';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import AuthProvider from '@/components/AuthProvider';

export const metadata = {
  title: 'Recepi App | Find the perfect recipe',
  description: 'Find the inspiration for ypur next meal.',
  keywords: 'recipe, find, dream',
};

const MainLayout = ({ children }) => {
  return (
    <AuthProvider>
      <html lang='en'>
        <body>
          <Navbar />
          <div>{children}</div>
          <Footer />
        </body>
      </html>
    </AuthProvider>
  );
};

export default MainLayout;
