
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { customDomainMiddleware, shouldHandleCustomDomain } from "@/lib/middleware/custom-domains";

// Routes that should be accessible to everyone, logged in or not.
const isPublicRoute = createRouteMatcher([
  '/', // Landing page
  '/pricing',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/docs(.*)', // All documentation pages
  '/api/v1/subscribers', // API route for adding subscribers
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
  '/api/public/(.*)', // Public API routes
  // Add any other public API routes or webhooks here
  // e.g., '/api/webhooks/(.*)'
]);

export default clerkMiddleware(async (auth, req) => {
  // Handle custom domains first
  if (shouldHandleCustomDomain(req)) {
    return await customDomainMiddleware(req);
  }

  // For custom domains, all public routes should be accessible
  if (req.headers.get('x-custom-domain') && isPublicRoute(req)) {
    return;
  }

  // Standard Clerk authentication for main domain
  if (!isPublicRoute(req)) await auth.protect();
});

export const config = {
  matcher: ['/((?!.*\\..*|_next).*)', '/', '/(api|trpc)(.*)'],
};
