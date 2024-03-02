export { default } from 'next-auth/middleware';

// Using a built-in middleware to protect routes.
export const config = {
  matcher: ['/recipes/add', '/profile', '/recipes/saved', '/messages'],
};
