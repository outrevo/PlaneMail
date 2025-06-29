import { db } from '@/lib/db';
import { posts, publicSiteSettings } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

export interface PublishedPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  publishedAt: string;
  fromName: string | null;
  readingTime: number | null;
}

export interface PublicSiteSettings {
  siteName: string;
  siteDescription: string;
  baseUrl: string;
  logoUrl: string | null;
  favicon: string | null;
  primaryColor: string;
  headerEnabled: boolean;
  headerContent: string | null;
  footerEnabled: boolean;
  footerContent: string | null;
  enableNewsletterSignup: boolean;
  customCss: string | null;
  customJs: string | null;
  analyticsCode: string | null;
}

export async function getPublishedPosts(): Promise<PublishedPost[]> {
  try {
    const result = await db
      .select({
        id: posts.id,
        title: posts.title,
        slug: posts.slug,
        excerpt: posts.excerpt,
        publishedAt: posts.publishedAt,
        fromName: posts.fromName,
        content: posts.content,
        createdAt: posts.createdAt,
      })
      .from(posts)
      .where(
        and(
          eq(posts.webEnabled, true),
          eq(posts.status, 'published')
        )
      )
      .orderBy(posts.publishedAt);

    return result.map(post => ({
      id: post.id,
      title: post.title,
      slug: post.slug,
      excerpt: post.excerpt,
      publishedAt: (post.publishedAt || post.createdAt).toISOString(),
      fromName: post.fromName,
      readingTime: calculateReadingTime(post.content || ''),
    }));
  } catch (error) {
    console.error('Error fetching published posts:', error);
    return [];
  }
}

export async function getPublicSiteSettings(): Promise<PublicSiteSettings> {
  try {
    const result = await db
      .select()
      .from(publicSiteSettings)
      .limit(1);

    if (result.length === 0) {
      // Return default settings
      return getDefaultSiteSettings();
    }

    return result[0] as PublicSiteSettings;
  } catch (error) {
    console.error('Error fetching site settings:', error);
    return getDefaultSiteSettings();
  }
}

function getDefaultSiteSettings(): PublicSiteSettings {
  return {
    siteName: 'PlaneMail',
    siteDescription: 'Email marketing and newsletter platform',
    baseUrl: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
    logoUrl: null,
    favicon: null,
    primaryColor: '#1e40af',
    headerEnabled: true,
    headerContent: null,
    footerEnabled: true,
    footerContent: null,
    enableNewsletterSignup: true,
    customCss: null,
    customJs: null,
    analyticsCode: null,
  };
}

function calculateReadingTime(content: string): number {
  const wordsPerMinute = 200;
  const wordCount = content.split(/\s+/).length;
  return Math.ceil(wordCount / wordsPerMinute);
}
