import React from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import AuthProvider from '@/components/AuthProvider';
import { ToastContainer, toast } from 'react-toastify';
import '@/assets/styles/globals.css';
import 'react-toastify/dist/ReactToastify.css';
import { GlobalProvider } from '@/context/GlobalContext';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/utils/authOptions';

export const metadata = {
  title: 'Recepi App | Find the perfect recipe',
  description: 'Find the inspiration for ypur next meal.',
  keywords: 'recipe, find, dream',
};

// The layout reads the session cookie, so every page is rendered per request.
export const dynamic = 'force-dynamic';

const MainLayout = async ({ children }) => {
  // Resolve the session on the server so the Navbar renders the correct
  // Login / profile controls in the initial HTML, with no client round-trip.
  let session = null;
  try {
    session = await getServerSession(authOptions);
  } catch (error) {
    console.error('Failed to load session in layout:', error);
  }

  return (
    <GlobalProvider>
      <AuthProvider session={session}>
        <html lang='en'>
          <body>
            <Navbar />
            <div>{children}</div>
            <Footer />
            <ToastContainer />
          </body>
        </html>
      </AuthProvider>
    </GlobalProvider>
  );
};

export default MainLayout;
