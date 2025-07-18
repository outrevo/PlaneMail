
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

// Routes that should be accessible to everyone, logged in or not.
const isPublicRoute = createRouteMatcher([
  '/', // Landing page
  '/pricing',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/docs(.*)', // All documentation pages
  '/api/v1/subscribers', // API route for adding subscribers
  '/api/paddle/webhook', // Paddle webhook
  '/api/public/(.*)', // Public API routes
  '/api/images/(.*)', // Image API routes (for development)
  '/privacy-policy', // Privacy policy page
  '/terms-of-service', // Terms of service page
  '/about', // About page
  '/contact', // Contact page
  '/blog(.*)', // All blog pages
  '/sitemap.xml', // Sitemap
  '/robots.txt', // Robots.txt file
  '/favicon.ico', // Favicon
  '/apple-touch-icon.png', // Apple touch icon
  '/manifest.json', // Web app manifest
  '/images/(.*)', // All images
  '/fonts/(.*)', // All font files
  '/static/(.*)', // All static assets
  '/p/(.*)', // Public post pages
  '/archive', // Public archive page
  // Add any other public API routes or webhooks here
]);

export default clerkMiddleware(async (auth, req) => {
  // Standard Clerk authentication - protect non-public routes
  if (!isPublicRoute(req)) {
    await auth.protect();
  }
});

export const config = {
  matcher: ['/((?!.*\\..*|_next).*)', '/', '/(api|trpc)(.*)'],
};
