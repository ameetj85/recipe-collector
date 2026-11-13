'use client';

import React from 'react';
import { SessionProvider } from 'next-auth/react';

// `session` is resolved on the server (see app/layout.jsx) so useSession()
// has a definite status on the very first render instead of 'loading'.
const AuthProvider = ({ children, session }) => {
  return <SessionProvider session={session}>{children}</SessionProvider>;
};

export default AuthProvider;
