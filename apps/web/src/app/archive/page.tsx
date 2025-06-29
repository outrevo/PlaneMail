import { Metadata } from 'next';
import Link from 'next/link';
import { PublicPageLayout } from '@/components/public/PublicPageLayout';
import { getPublishedPosts, getPublicSiteSettings } from './actions';

export const metadata: Metadata = {
  title: 'Archive',
  description: 'Browse all published posts',
};

export default async function ArchivePage() {
  const [posts, siteSettings] = await Promise.all([
    getPublishedPosts(),
    getPublicSiteSettings(),
  ]);

  return (
    <PublicPageLayout siteSettings={siteSettings}>
      <div className="max-w-4xl mx-auto px-4 py-8">
        <header className="mb-8">
          <h1 className="text-4xl font-bold mb-4">Archive</h1>
          <p className="text-xl text-muted-foreground">
            Browse all published posts
          </p>
        </header>

        {posts.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No posts published yet.</p>
          </div>
        ) : (
          <div className="space-y-8">
            {posts.map((post) => (
              <article key={post.id} className="border-b pb-8 last:border-b-0">
                <header className="mb-4">
                  <h2 className="text-2xl font-semibold mb-2">
                    <Link 
                      href={`/p/${post.slug}`}
                      className="hover:text-primary transition-colors"
                    >
                      {post.title}
                    </Link>
                  </h2>
                  
                  {post.excerpt && (
                    <p className="text-muted-foreground mb-3">{post.excerpt}</p>
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
              </article>
            ))}
          </div>
        )}
      </div>
    </PublicPageLayout>
  );
}
