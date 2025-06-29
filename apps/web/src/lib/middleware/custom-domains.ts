import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/drizzle';
import { customDomains, publicSiteSettings } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

export async function customDomainMiddleware(request: NextRequest) {
  const url = request.nextUrl.clone();
  const hostname = request.headers.get('host') || '';
  
  // Skip if it's a localhost or known development domain
  if (
    hostname.includes('localhost') ||
    hostname.includes('127.0.0.1') ||
    hostname.includes('.vercel.app') ||
    hostname.includes('planemail.app') ||
    process.env.NODE_ENV === 'development'
  ) {
    return NextResponse.next();
  }

  // Check if this is a custom domain
  const isCustomDomain = request.headers.get('x-custom-domain') === 'true';
  
  if (isCustomDomain) {
    try {
      // Get the custom domain configuration
      const domain = await db
        .select({
          userId: customDomains.userId,
          status: customDomains.status,
        })
        .from(customDomains)
        .where(and(
          eq(customDomains.domain, hostname),
          eq(customDomains.status, 'active')
        ))
        .limit(1);

      if (domain.length === 0) {
        // Domain not found or not active
        return new NextResponse('Domain not configured', { status: 404 });
      }

      const domainConfig = domain[0];

      // Get site settings for this user
      const siteSettings = await db
        .select()
        .from(publicSiteSettings)
        .where(eq(publicSiteSettings.userId, domainConfig.userId))
        .limit(1);

      // Set custom headers for the application to use
      const requestHeaders = new Headers(request.headers);
      requestHeaders.set('x-custom-domain', hostname);
      requestHeaders.set('x-domain-user-id', domainConfig.userId);
      
      if (siteSettings.length > 0) {
        requestHeaders.set('x-site-settings', JSON.stringify(siteSettings[0]));
      }

      // Handle public routes for custom domains
      if (url.pathname === '/' || url.pathname.startsWith('/p/') || url.pathname.startsWith('/archive')) {
        // Rewrite to the public pages but preserve the custom domain context
        return NextResponse.rewrite(url, {
          headers: requestHeaders,
        });
      }

      // For other routes, show a 404 or redirect to main domain
      return new NextResponse('Page not found', { status: 404 });

    } catch (error) {
      console.error('Custom domain middleware error:', error);
      return new NextResponse('Internal server error', { status: 500 });
    }
  }

  return NextResponse.next();
}

export function shouldHandleCustomDomain(request: NextRequest): boolean {
  const hostname = request.headers.get('host') || '';
  
  // Check if this looks like a custom domain
  return (
    !hostname.includes('localhost') &&
    !hostname.includes('127.0.0.1') &&
    !hostname.includes('.vercel.app') &&
    !hostname.includes('planemail.app') &&
    process.env.NODE_ENV === 'production' &&
    request.headers.get('x-custom-domain') === 'true'
  );
}
