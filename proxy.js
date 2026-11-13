// Next 16 renamed middleware.js to proxy.js (it runs on the Node.js runtime).
// next-auth's withAuth redirects signed-out users to the sign-in page.
import { withAuth } from 'next-auth/middleware';

export const proxy = withAuth;

export const config = {
  matcher: ['/recipes/add', '/profile', '/recipes/saved', '/messages'],
};
