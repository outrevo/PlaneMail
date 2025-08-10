'use client';

import { useParams, notFound } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, Edit3, Share2, Globe, Calendar } from 'lucide-react';
import Link from 'next/link';

interface ContentItem {
  id: string;
  title: string;
  content: string;
  status: 'draft' | 'scheduled' | 'published' | 'sent';
  publishedToWeb: boolean;
  sentAsNewsletter: boolean;
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
  metadata?: {
    subject?: string;
    preheader?: string;
    webSlug?: string;
    tags?: string[];
  };
}

// Mock data - same as edit page
const mockContentItems: Record<string, ContentItem> = {
  '1': {
    id: '1',
    title: 'Welcome to Our Newsletter',
    content: JSON.stringify({
      type: 'doc',
      content: [
        {
          type: 'heading',
          attrs: { level: 1 },
          content: [{ type: 'text', text: 'Welcome to Our Newsletter' }]
        },
        {
          type: 'paragraph',
          content: [
            { type: 'text', text: 'We\'re excited to have you as part of our community! This weekly newsletter will keep you updated on the latest news, insights, and updates from our team.' }
          ]
        },
        {
          type: 'paragraph',
          content: [
            { type: 'text', text: 'Here\'s what you can expect:' }
          ]
        },
        {
          type: 'bulletList',
          content: [
            {
              type: 'listItem',
              content: [
                {
                  type: 'paragraph',
                  content: [{ type: 'text', text: 'Weekly product updates and feature announcements' }]
                }
              ]
            },
            {
              type: 'listItem', 
              content: [
                {
                  type: 'paragraph',
                  content: [{ type: 'text', text: 'Industry insights and best practices' }]
                }
              ]
            },
            {
              type: 'listItem',
              content: [
                {
                  type: 'paragraph',
                  content: [{ type: 'text', text: 'Exclusive content and early access to new features' }]
                }
              ]
            }
          ]
        },
        {
          type: 'paragraph',
          content: [
            { type: 'text', text: 'Thank you for subscribing, and welcome aboard!' }
          ]
        }
      ]
    }),
    status: 'published',
    publishedToWeb: true,
    sentAsNewsletter: true,
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-01-15T10:30:00Z',
    publishedAt: '2024-01-15T10:30:00Z',
    metadata: {
      subject: 'Welcome to Our Newsletter!',
      preheader: 'We\'re excited to have you as part of our community',
      webSlug: 'welcome-to-our-newsletter',
      tags: ['welcome', 'introduction']
    }
  }
};

// Simple function to convert TipTap JSON to HTML
const convertToSimpleHTML = (json: any): string => {
  if (!json || !json.content) return '';
  
  const convertNode = (node: any): string => {
    if (!node) return '';
    
    switch (node.type) {
      case 'doc':
        return node.content?.map(convertNode).join('') || '';
      
      case 'heading':
        const level = node.attrs?.level || 1;
        const headingText = node.content?.map(convertNode).join('') || '';
        return `<h${level} class="heading-${level}">${headingText}</h${level}>`;
      
      case 'paragraph':
        const paragraphText = node.content?.map(convertNode).join('') || '';
        return `<p>${paragraphText}</p>`;
      
      case 'bulletList':
        const listItems = node.content?.map(convertNode).join('') || '';
        return `<ul>${listItems}</ul>`;
      
      case 'orderedList':
        const orderedItems = node.content?.map(convertNode).join('') || '';
        return `<ol>${orderedItems}</ol>`;
      
      case 'listItem':
        const itemContent = node.content?.map(convertNode).join('') || '';
        return `<li>${itemContent}</li>`;
      
      case 'text':
        let text = node.text || '';
        if (node.marks) {
          node.marks.forEach((mark: any) => {
            switch (mark.type) {
              case 'bold':
                text = `<strong>${text}</strong>`;
                break;
              case 'italic':
                text = `<em>${text}</em>`;
                break;
              case 'link':
                text = `<a href="${mark.attrs?.href || ''}" target="_blank" rel="noopener noreferrer">${text}</a>`;
                break;
            }
          });
        }
        return text;
      
      case 'hardBreak':
        return '<br>';
      
      default:
        return node.content?.map(convertNode).join('') || '';
    }
  };
  
  return convertNode(json);
};

export default function ViewContentPage() {
  const params = useParams();
  const contentId = params.id as string;
  
  const [content, setContent] = useState<ContentItem | null>(null);
  const [htmlContent, setHtmlContent] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadContent = async () => {
      setLoading(true);
      
      // In a real app, fetch from API
      const contentItem = mockContentItems[contentId];
      if (!contentItem || !contentItem.publishedToWeb) {
        notFound();
        return;
      }

      setContent(contentItem);

      // Convert JSON content to simple HTML for display
      try {
        const jsonContent = JSON.parse(contentItem.content);
        const html = convertToSimpleHTML(jsonContent);
        setHtmlContent(html);
      } catch (error) {
        console.error('Error parsing content:', error);
        setHtmlContent('<p>Error loading content</p>');
      }
      
      setLoading(false);
    };

    if (contentId) {
      loadContent();
    }
  }, [contentId]);

  if (loading) {
    return (
      <div className="container mx-auto py-12 max-w-4xl">
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <Skeleton className="h-6 w-32" />
            <div className="flex gap-2">
              <Skeleton className="h-9 w-20" />
              <Skeleton className="h-9 w-20" />
            </div>
          </div>
          <div className="space-y-4">
            <Skeleton className="h-10 w-3/4" />
            <div className="flex gap-2">
              <Skeleton className="h-5 w-16" />
              <Skeleton className="h-5 w-20" />
            </div>
            <Skeleton className="h-4 w-48" />
          </div>
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    );
  }

  if (!content) {
    notFound();
  }

  const handleShare = async () => {
    const url = window.location.href;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: content.title,
          text: content.metadata?.preheader || 'Check out this article',
          url: url,
        });
      } catch (error) {
        // User cancelled or share failed
        copyToClipboard(url);
      }
    } else {
      copyToClipboard(url);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      // You could add a toast notification here
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
    }
  };

  const getDistributionBadges = () => {
    const badges = [];
    if (content.publishedToWeb) {
      badges.push(
        <Badge key="web" variant="outline" className="text-xs">
          <Globe className="h-3 w-3 mr-1" />
          Web
        </Badge>
      );
    }
    return badges;
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header with controls */}
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container mx-auto py-4 max-w-4xl">
          <div className="flex items-center justify-between">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/content">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Content
              </Link>
            </Button>
            
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handleShare}>
                <Share2 className="h-4 w-4 mr-2" />
                Share
              </Button>
              
              <Button size="sm" asChild>
                <Link href={`/content/${contentId}/edit`}>
                  <Edit3 className="h-4 w-4 mr-2" />
                  Edit
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Article content */}
      <article className="container mx-auto py-12 max-w-4xl">
        <div className="space-y-8">
          {/* Article header */}
          <header className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Badge variant="default">Published</Badge>
                {getDistributionBadges()}
              </div>
              
              <h1 className="text-4xl font-bold leading-tight lg:text-5xl">
                {content.title}
              </h1>
              
              {content.metadata?.preheader && (
                <p className="text-xl text-muted-foreground leading-relaxed">
                  {content.metadata.preheader}
                </p>
              )}

              <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                {content.publishedAt && (
                  <span className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    Published on {new Date(content.publishedAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </span>
                )}
                
                {content.metadata?.tags && content.metadata.tags.length > 0 && (
                  <div className="flex items-center gap-2">
                    {content.metadata.tags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </header>

          {/* Article body */}
          <div 
            className="prose prose-slate max-w-none prose-lg prose-headings:font-bold prose-headings:text-foreground prose-p:text-foreground/90 prose-li:text-foreground/90 prose-strong:text-foreground prose-code:text-foreground prose-blockquote:text-foreground/80 prose-a:text-primary hover:prose-a:text-primary/80"
            dangerouslySetInnerHTML={{ __html: htmlContent }}
          />
        </div>
      </article>
    </div>
  );
}
