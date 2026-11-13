import GoogleProvider from 'next-auth/providers/google';
import * as users from '@/models/users';

export const authOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      authorization: {
        params: {
          prompt: 'consent',
          access_type: 'offline',
          response_type: 'code',
        },
      },
    }),
  ],
  callbacks: {
    // invoked on successful sign-in
    async signIn({ profile }) {
      // Create the user on first sign-in (no-op if the email already exists).
      // The username is truncated if too long.
      users.createIfMissing({
        email: profile.email,
        username: (profile.name || profile.email).slice(0, 20),
        image: profile.picture,
      });
      return true;
    },
    // Modifies the session object
    async session({ session }) {
      // Expose the database id as session.user.id (client and server code
      // depend on it). Guard against a missing user row.
      const user = users.findByEmail(session.user.email);
      if (user) {
        session.user.id = user.id;
      }
      // 3. return the session
      return session;
    },
  },
};
