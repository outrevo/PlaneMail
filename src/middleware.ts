
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

// Routes that should be accessible to everyone, logged in or not.
const isPublicRoute = createRouteMatcher([
  '/', // Landing page
  '/pricing',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/docs(.*)', // All documentation pages
  '/api/v1/subscribers', // API route for adding subscribers
  // Add any other public API routes or webhooks here
  // e.g., '/api/webhooks/(.*)'
]);


export default clerkMiddleware(async (auth, req) => {
  if (!isPublicRoute(req)) await auth.protect()
})

export const config = {
  matcher: ['/((?!.*\\..*|_next).*)', '/', '/(api|trpc)(.*)'],
};
