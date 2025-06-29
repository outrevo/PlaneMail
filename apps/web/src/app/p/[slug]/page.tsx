import { notFound } from 'next/navigation';
import { headers } from 'next/headers';
import { PublicPageLayout } from '@/components/public/PublicPageLayout';
import { NewsletterSignupForm } from '@/components/public/NewsletterSignupForm';
import { ShareButtons } from '@/components/public/ShareButtons';
import { getPublishedPost, getPublicSiteSettings, trackPostView as trackView, getPublishedPostForCustomDomain } from './actions';
import { Metadata } from 'next';

interface PageProps {
  params: Promise<{
    slug: string;
  }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPublishedPost(slug);
  
  if (!post) {
    return {
      title: 'Post Not Found',
    };
  }

  return {
    title: post.seoTitle || post.title,
    description: post.seoDescription || post.excerpt || undefined,
    openGraph: {
      title: post.seoTitle || post.title,
      description: post.seoDescription || post.excerpt || undefined,
      type: 'article',
      publishedTime: post.publishedAt,
      authors: [post.fromName || 'PlaneMail'],
    },
    twitter: {
      card: 'summary_large_image',
      title: post.seoTitle || post.title,
      description: post.seoDescription || post.excerpt || undefined,
    },
  };
}

export default async function PublicPostPage({ params }: PageProps) {
  const { slug } = await params;
  const headersList = await headers();
  const isCustomDomain = headersList.get('x-custom-domain');
  const customDomainUserId = headersList.get('x-domain-user-id');
  
  let post: any;
  let siteSettings: any;

  if (isCustomDomain && customDomainUserId) {
    // Custom domain: get post for specific user
    post = await getPublishedPostForCustomDomain(slug, customDomainUserId);
    
    // Try to get site settings from custom header first
    const customSiteSettings = headersList.get('x-site-settings');
    if (customSiteSettings) {
      try {
        siteSettings = JSON.parse(customSiteSettings);
      } catch (error) {
        console.error('Failed to parse custom site settings:', error);
        siteSettings = await getPublicSiteSettings();
      }
    } else {
      siteSettings = await getPublicSiteSettings();
    }
  } else {
    // Main domain: get any published post
    const [postResult, settingsResult] = await Promise.all([
      getPublishedPost(slug),
      getPublicSiteSettings(),
    ]);
    post = postResult;
    siteSettings = settingsResult;
  }

  if (!post) {
    notFound();
  }

  // Track page view
  await trackView(post.id);

  return (
    <PublicPageLayout siteSettings={siteSettings}>
      <article className="max-w-4xl mx-auto px-4 py-8">
        {/* Post Header */}
        <header className="mb-8">
          <h1 className="text-4xl font-bold mb-4">{post.title}</h1>
          
          {post.excerpt && (
            <p className="text-xl text-muted-foreground mb-6">{post.excerpt}</p>
          )}
          
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            {post.fromName && (
              <span>By {post.fromName}</span>
            )}
            <span>•</span>
            <time dateTime={post.publishedAt}>
              {new Date(post.publishedAt).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </time>
            {post.readingTime && (
              <>
                <span>•</span>
                <span>{post.readingTime} min read</span>
              </>
            )}
          </div>
        </header>

        {/* Post Content */}
        <div 
          className="prose prose-lg max-w-none dark:prose-invert"
          dangerouslySetInnerHTML={{ __html: post.content }}
        />

        {/* Post Footer */}
        <footer className="mt-12 pt-8 border-t">
          <div className="flex flex-col gap-4">
            {/* Newsletter Signup */}
            {siteSettings.enableNewsletterSignup && (
              <div className="bg-muted/50 rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-2">Subscribe to our newsletter</h3>
                <p className="text-muted-foreground mb-4">
                  Get the latest posts delivered right to your inbox.
                </p>
                <NewsletterSignupForm />
              </div>
            )}

            {/* Share Buttons */}
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium">Share:</span>
              <ShareButtons 
                url={`${siteSettings.baseUrl}/p/${post.slug}`}
                title={post.title}
              />
            </div>
          </div>
        </footer>
      </article>
    </PublicPageLayout>
  );
}

// Track post view for analytics
async function trackPostView(postId: string) {
  try {
    await fetch('/api/posts/track-view', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ postId }),
    });
  } catch (error) {
    console.error('Failed to track post view:', error);
  }
}
