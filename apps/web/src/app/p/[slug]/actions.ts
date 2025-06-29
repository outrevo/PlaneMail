import { db } from '@/lib/drizzle';
import { posts, segments, postSegments, publicSiteSettings } from '@/db/schema';
import { eq, and, sql } from 'drizzle-orm';
import { notFound } from 'next/navigation';

export interface PublishedPost {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string | null;
  seoTitle: string | null;
  seoDescription: string | null;
  publishedAt: string;
  fromName: string | null;
  fromEmail: string | null;
  readingTime: number | null;
  webViews: number;
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

export async function getPublishedPost(slug: string): Promise<PublishedPost | null> {
  try {
    const result = await db
      .select()
      .from(posts)
      .where(
        and(
          eq(posts.slug, slug),
          eq(posts.webEnabled, true),
          eq(posts.status, 'published')
        )
      )
      .limit(1);

    if (result.length === 0) {
      return null;
    }

    const post = result[0];
    
    return {
      id: post.id,
      title: post.title,
      slug: post.slug,
      content: post.content || '',
      excerpt: post.excerpt,
      seoTitle: post.seoTitle,
      seoDescription: post.seoDescription,
      publishedAt: (post.publishedAt || post.createdAt).toISOString(),
      fromName: post.fromName,
      fromEmail: post.fromEmail,
      readingTime: calculateReadingTime(post.content || ''),
      webViews: post.webViews || 0,
    };
  } catch (error) {
    console.error('Error fetching published post:', error);
    return null;
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

export async function trackPostView(postId: string) {
  try {
    await db
      .update(posts)
      .set({
        webViews: sql`${posts.webViews} + 1`,
      })
      .where(eq(posts.id, postId));
  } catch (error) {
    console.error('Error tracking post view:', error);
  }
}

export async function getPublishedPostForCustomDomain(slug: string, userId: string): Promise<PublishedPost | null> {
  try {
    const result = await db
      .select()
      .from(posts)
      .where(
        and(
          eq(posts.slug, slug),
          eq(posts.userId, userId),
          eq(posts.webEnabled, true),
          eq(posts.status, 'published')
        )
      )
      .limit(1);

    if (result.length === 0) {
      return null;
    }

    const post = result[0];
    return {
      id: post.id,
      title: post.title,
      slug: post.slug,
      content: post.content || '',
      excerpt: post.excerpt,
      seoTitle: post.seoTitle,
      seoDescription: post.seoDescription,
      publishedAt: post.publishedAt?.toISOString() || new Date().toISOString(),
      fromName: post.fromName,
      fromEmail: post.fromEmail,
      readingTime: null, // Will be calculated in UI if needed
      webViews: post.webViews || 0,
    };
  } catch (error) {
    console.error('Error fetching published post for custom domain:', error);
    return null;
  }
}
