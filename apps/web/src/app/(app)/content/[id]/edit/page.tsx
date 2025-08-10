'use client';

import { useRouter, useParams } from 'next/navigation';
import { NovelEditor } from '@/components/novel/editor';
import { useEffect, useState } from 'react';
import { PageHeader } from '@/components/common/PageHeader';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Eye, Send, Calendar, Globe } from 'lucide-react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

interface ContentItem {
  id: string;
  title: string;
  content: string;
  status: 'draft' | 'scheduled' | 'published' | 'sent';
  publishedToWeb: boolean;
  sentAsNewsletter: boolean;
  createdAt: string;
  updatedAt: string;
  scheduledFor?: string;
  metadata?: {
    subject?: string;
    preheader?: string;
    webSlug?: string;
    tags?: string[];
  };
}

// Mock data - replace with actual API calls
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
    metadata: {
      subject: 'Welcome to Our Newsletter!',
      preheader: 'We\'re excited to have you as part of our community',
      webSlug: 'welcome-to-our-newsletter',
      tags: ['welcome', 'introduction']
    }
  },
  '2': {
    id: '2',
    title: 'Product Update: New Features',
    content: JSON.stringify({
      type: 'doc',
      content: [
        {
          type: 'heading',
          attrs: { level: 1 },
          content: [{ type: 'text', text: 'Exciting New Features Coming Your Way' }]
        },
        {
          type: 'paragraph',
          content: [
            { type: 'text', text: 'We\'ve been hard at work developing new features that will make your experience even better. Here\'s what\'s coming in our next update:' }
          ]
        }
      ]
    }),
    status: 'scheduled',
    publishedToWeb: true,
    sentAsNewsletter: true,
    createdAt: '2024-01-14T14:20:00Z',
    updatedAt: '2024-01-14T16:45:00Z',
    scheduledFor: '2024-01-20T09:00:00Z',
    metadata: {
      subject: 'New Features Coming Soon!',
      preheader: 'Check out what we\'ve been building for you',
      webSlug: 'new-features-update',
      tags: ['product', 'update', 'features']
    }
  },
  '3': {
    id: '3',
    title: 'How to Boost Email Engagement',
    content: JSON.stringify({
      type: 'doc',
      content: [
        {
          type: 'heading',
          attrs: { level: 1 },
          content: [{ type: 'text', text: 'How to Boost Email Engagement' }]
        },
        {
          type: 'paragraph',
          content: [
            { type: 'text', text: 'Email engagement is crucial for the success of your campaigns. Here are some proven strategies to improve your open rates, click-through rates, and overall engagement.' }
          ]
        }
      ]
    }),
    status: 'draft',
    publishedToWeb: false,
    sentAsNewsletter: false,
    createdAt: '2024-01-13T09:15:00Z',
    updatedAt: '2024-01-14T11:30:00Z',
    metadata: {
      subject: '',
      preheader: '',
      webSlug: '',
      tags: ['tips', 'engagement']
    }
  }
};

export default function EditContentPage() {
  const router = useRouter();
  const params = useParams();
  const contentId = params.id as string;
  
  const [content, setContent] = useState<ContentItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    // Simulate API call
    const loadContent = async () => {
      setLoading(true);
      // In a real app, fetch from API
      const contentItem = mockContentItems[contentId];
      if (contentItem) {
        setContent(contentItem);
      }
      setLoading(false);
    };

    if (contentId) {
      loadContent();
    }
  }, [contentId]);

  const handleUpdate = async (contentText: string, html: string, json: any) => {
    if (!content) return;
    
    setSaving(true);
    try {
      // In a real app, save to API
      const updatedContent = {
        ...content,
        content: contentText,
        updatedAt: new Date().toISOString(),
      };
      setContent(updatedContent);
      console.log('Saving content:', updatedContent);
    } catch (error) {
      console.error('Failed to save:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleMetaChange = async (meta: { subject: string; preheader: string; fromName: string; fromEmail: string }) => {
    if (!content) return;
    
    setSaving(true);
    try {
      // In a real app, save to API
      const updatedContent = {
        ...content,
        metadata: {
          ...content.metadata,
          subject: meta.subject,
          preheader: meta.preheader,
        },
        updatedAt: new Date().toISOString(),
      };
      setContent(updatedContent);
      console.log('Saving metadata:', meta);
    } catch (error) {
      console.error('Failed to save metadata:', error);
    } finally {
      setSaving(false);
    }
  };

  const getStatusBadge = () => {
    if (!content) return null;
    
    const variants = {
      draft: { variant: 'secondary' as const, text: 'Draft' },
      scheduled: { variant: 'outline' as const, text: 'Scheduled' },
      published: { variant: 'default' as const, text: 'Published' },
      sent: { variant: 'default' as const, text: 'Sent' },
    };
    
    const config = variants[content.status];
    return <Badge variant={config.variant}>{config.text}</Badge>;
  };

  const getDistributionBadges = () => {
    if (!content) return null;
    
    const badges = [];
    if (content.publishedToWeb) {
      badges.push(
        <Badge key="web" variant="outline" className="text-xs">
          <Globe className="h-3 w-3 mr-1" />
          Web
        </Badge>
      );
    }
    if (content.sentAsNewsletter) {
      badges.push(
        <Badge key="email" variant="outline" className="text-xs">
          <Send className="h-3 w-3 mr-1" />
          Email
        </Badge>
      );
    }
    return badges;
  };

  if (loading) {
    return (
      <div className="container mx-auto py-6 space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" disabled>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <Skeleton className="h-8 w-48" />
        </div>
        <Skeleton className="h-[400px] w-full" />
      </div>
    );
  }

  if (!content) {
    return (
      <div className="container mx-auto py-6 space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => router.push('/content')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <PageHeader title="Content not found" />
        </div>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <h3 className="text-lg font-semibold mb-2">Content not found</h3>
              <p className="text-muted-foreground mb-4">
                The content item you're looking for doesn't exist or may have been deleted.
              </p>
              <Button asChild>
                <Link href="/content">Back to Content</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => router.push('/content')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl font-bold">{content.title}</h1>
              {getStatusBadge()}
              <div className="flex gap-1">
                {getDistributionBadges()}
              </div>
            </div>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span>Last updated {new Date(content.updatedAt).toLocaleDateString()}</span>
              {content.status === 'scheduled' && content.scheduledFor && (
                <span className="flex items-center gap-1 text-blue-600">
                  <Calendar className="h-3 w-3" />
                  Scheduled for {new Date(content.scheduledFor).toLocaleDateString()}
                </span>
              )}
              {saving && <span className="text-green-600">Saving...</span>}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {content.status === 'published' && content.publishedToWeb && (
            <Button variant="outline" asChild>
              <Link href={`/p/${content.metadata?.webSlug || content.id}`} target="_blank">
                <Eye className="h-4 w-4 mr-2" />
                Preview
              </Link>
            </Button>
          )}
          
          <Button variant="outline">
            <Send className="h-4 w-4 mr-2" />
            Send Test
          </Button>
        </div>
      </div>

      {/* Editor */}
      <div className="space-y-6">
        <NovelEditor
          initialContent={content.content}
          mode="campaign"
          onUpdate={handleUpdate}
          onMetaChange={handleMetaChange}
          defaultMeta={{
            subject: content.metadata?.subject || '',
            preheader: content.metadata?.preheader || '',
            fromName: '',
            fromEmail: ''
          }}
          className="min-h-[500px]"
        />
      </div>
    </div>
  );
}
