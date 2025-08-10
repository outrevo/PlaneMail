'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PageHeader } from '@/components/common/PageHeader';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Mail, 
  Globe, 
  PlusCircle, 
  Edit3, 
  Eye, 
  Calendar,
  MoreHorizontal,
  FileText,
  Send,
  Clock,
  Users,
  BarChart3
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

interface ContentItem {
  id: string;
  title: string;
  status: 'draft' | 'scheduled' | 'published' | 'sent';
  publishedToWeb: boolean;
  sentAsNewsletter: boolean;
  createdAt: string;
  updatedAt: string;
  scheduledFor?: string;
  wordCount: number;
  excerpt?: string;
  emailStats?: {
    sent: number;
    opens: number;
    clicks: number;
  };
  webStats?: {
    views: number;
    shares: number;
  };
}

// Mock data - replace with actual API calls
const mockContent: ContentItem[] = [
  {
    id: '1',
    title: 'Welcome to Our Newsletter',
    status: 'published',
    publishedToWeb: true,
    sentAsNewsletter: true,
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-01-15T10:30:00Z',
    wordCount: 450,
    excerpt: 'An introduction to our weekly newsletter and what subscribers can expect.',
    emailStats: { sent: 1250, opens: 780, clicks: 156 },
    webStats: { views: 2340, shares: 28 }
  },
  {
    id: '2',
    title: 'Product Update: New Features',
    status: 'scheduled',
    publishedToWeb: true,
    sentAsNewsletter: true,
    createdAt: '2024-01-14T14:20:00Z',
    updatedAt: '2024-01-14T16:45:00Z',
    scheduledFor: '2024-01-20T09:00:00Z',
    wordCount: 680,
    excerpt: 'Exciting new features and improvements coming to our platform.',
  },
  {
    id: '3',
    title: 'How to Boost Email Engagement',
    status: 'draft',
    publishedToWeb: false,
    sentAsNewsletter: false,
    createdAt: '2024-01-13T09:15:00Z',
    updatedAt: '2024-01-14T11:30:00Z',
    wordCount: 320,
    excerpt: 'Tips and strategies for improving your email marketing performance.',
  }
];

export default function ContentPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('all');
  const [content] = useState<ContentItem[]>(mockContent);

  const filteredContent = content.filter(item => {
    switch (activeTab) {
      case 'drafts':
        return item.status === 'draft';
      case 'scheduled':
        return item.status === 'scheduled';
      case 'published':
        return item.status === 'published' || item.status === 'sent';
      default:
        return true;
    }
  });

  const getStatusBadge = (item: ContentItem) => {
    const variants = {
      draft: { variant: 'secondary' as const, text: 'Draft' },
      scheduled: { variant: 'outline' as const, text: 'Scheduled' },
      published: { variant: 'default' as const, text: 'Published' },
      sent: { variant: 'default' as const, text: 'Sent' },
    };
    
    const config = variants[item.status];
    return <Badge variant={config.variant}>{config.text}</Badge>;
  };

  const getDistributionBadges = (item: ContentItem) => {
    const badges = [];
    if (item.publishedToWeb) {
      badges.push(
        <Badge key="web" variant="outline" className="text-xs">
          <Globe className="h-3 w-3 mr-1" />
          Web
        </Badge>
      );
    }
    if (item.sentAsNewsletter) {
      badges.push(
        <Badge key="email" variant="outline" className="text-xs">
          <Mail className="h-3 w-3 mr-1" />
          Email
        </Badge>
      );
    }
    return badges;
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <PageHeader 
          title="Content" 
          description="Create and manage your newsletters, blog posts, and campaigns"
        />
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href="/settings/site">
              <Globe className="h-4 w-4 mr-2" />
              Site Settings
            </Link>
          </Button>
          <Button onClick={() => router.push('/content/new')}>
            <PlusCircle className="h-4 w-4 mr-2" />
            Create Content
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Content</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{content.length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Published</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {content.filter(item => item.status === 'published' || item.status === 'sent').length}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Scheduled</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {content.filter(item => item.status === 'scheduled').length}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Drafts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">
              {content.filter(item => item.status === 'draft').length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Content List */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 max-w-md">
          <TabsTrigger value="all">All Content</TabsTrigger>
          <TabsTrigger value="published">Published</TabsTrigger>
          <TabsTrigger value="scheduled">Scheduled</TabsTrigger>
          <TabsTrigger value="drafts">Drafts</TabsTrigger>
        </TabsList>
        
        <TabsContent value={activeTab} className="space-y-4">
          {filteredContent.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-12">
                  <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">
                    {activeTab === 'drafts' 
                      ? 'No drafts yet' 
                      : activeTab === 'published' 
                        ? 'No published content yet'
                        : activeTab === 'scheduled'
                          ? 'No scheduled content'
                          : 'No content yet'
                    }
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    {activeTab === 'drafts' 
                      ? 'Start creating content and save drafts for later'
                      : activeTab === 'published'
                        ? 'Publish content to see it here'
                        : activeTab === 'scheduled'
                          ? 'Schedule content for future publication'
                          : 'Create your first piece of content to get started'
                    }
                  </p>
                  <Button onClick={() => router.push('/content/new')}>
                    <PlusCircle className="h-4 w-4 mr-2" />
                    Create Content
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {filteredContent.map((item) => (
                <Card key={item.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="text-lg font-semibold truncate">{item.title}</h3>
                          {getStatusBadge(item)}
                          <div className="flex gap-1">
                            {getDistributionBadges(item)}
                          </div>
                        </div>
                        
                        {item.excerpt && (
                          <p className="text-muted-foreground text-sm mb-3 line-clamp-2">
                            {item.excerpt}
                          </p>
                        )}
                        
                        <div className="flex items-center gap-6 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <FileText className="h-3 w-3" />
                            {item.wordCount} words
                          </span>
                          
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {new Date(item.updatedAt).toLocaleDateString()}
                          </span>
                          
                          {item.status === 'scheduled' && item.scheduledFor && (
                            <span className="flex items-center gap-1 text-blue-600">
                              <Clock className="h-3 w-3" />
                              Scheduled for {new Date(item.scheduledFor).toLocaleDateString()}
                            </span>
                          )}
                          
                          {item.emailStats && (
                            <span className="flex items-center gap-1">
                              <Mail className="h-3 w-3" />
                              {item.emailStats.sent} sent, {item.emailStats.opens} opens
                            </span>
                          )}
                          
                          {item.webStats && (
                            <span className="flex items-center gap-1">
                              <Eye className="h-3 w-3" />
                              {item.webStats.views} views
                            </span>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2 ml-4">
                        {item.status === 'published' && item.publishedToWeb && (
                          <Button variant="ghost" size="sm" asChild>
                            <Link href={`/content/${item.id}/view`} target="_blank">
                              <Eye className="h-4 w-4" />
                            </Link>
                          </Button>
                        )}
                        
                        <Button variant="ghost" size="sm" asChild>
                          <Link href={`/content/${item.id}/edit`}>
                            <Edit3 className="h-4 w-4" />
                          </Link>
                        </Button>
                        
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>
                              <Edit3 className="h-4 w-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Send className="h-4 w-4 mr-2" />
                              Duplicate
                            </DropdownMenuItem>
                            {item.status === 'published' && (
                              <DropdownMenuItem>
                                <BarChart3 className="h-4 w-4 mr-2" />
                                Analytics
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem className="text-red-600">
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
