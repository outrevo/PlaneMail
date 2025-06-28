import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://planemail.in'
  
  return {
    rules: [
      {
        userAgent: '*',
        allow: [
          '/',
          '/pricing',
          '/docs',
          '/docs/*',
          '/privacy',
          '/terms',
        ],
        disallow: [
          '/api/*',
          '/(app)/*',
          '/dashboard',
          '/posts',
          '/settings',
          '/integrations',
          '/user-profile',
          '/sign-in',
          '/sign-up',
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  }
}
