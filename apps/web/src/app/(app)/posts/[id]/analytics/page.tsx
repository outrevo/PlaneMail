'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { PageHeader } from '@/components/common/PageHeader';
import { 
  ArrowLeft, 
  Mail, 
  Globe, 
  Eye, 
  MousePointer, 
  Users, 
  TrendingUp,
  Calendar,
  ExternalLink,
  Loader2
} from 'lucide-react';
import Link from 'next/link';
import { getPostAnalytics, type PostAnalyticsData } from './actions';

export default function PostAnalyticsPage() {
  const params = useParams();
  const postId = params.id as string;
  const [analyticsData, setAnalyticsData] = useState<PostAnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const data = await getPostAnalytics(postId);
        if (data) {
          setAnalyticsData(data);
        } else {
          setError('Post not found');
        }
      } catch (err) {
        console.error('Failed to fetch analytics:', err);
        setError('Failed to load analytics');
      } finally {
        setIsLoading(false);
      }
    };

    if (postId) {
      fetchAnalytics();
    }
  }, [postId]);

  if (isLoading) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </div>
    );
  }

  if (error || !analyticsData) {
    return (
      <div className="container mx-auto py-6">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <h3 className="text-lg font-semibold mb-2">Error</h3>
              <p className="text-muted-foreground mb-4">{error || 'Failed to load analytics'}</p>
              <Button asChild>
                <Link href="/posts">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Posts
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { post, emailStats, webStats } = analyticsData;

  const formatDate = (date: Date | null) => {
    if (!date) return 'Not published';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatPercent = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" asChild>
          <Link href="/posts">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Posts
          </Link>
        </Button>
      </div>

      <PageHeader 
        title={`Analytics: ${post.title}`}
        description="Detailed performance metrics for your post"
      />

      {/* Post Status Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Post Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Status</label>
              <div>
                <Badge variant={
                  post.status === 'published' ? 'default' :
                  post.status === 'sent' ? 'secondary' :
                  post.status === 'draft' ? 'outline' : 'destructive'
                }>
                  {post.status}
                </Badge>
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Publishing Channels</label>
              <div className="flex gap-2">
                {post.sentAt && (
                  <Badge variant="outline">
                    <Mail className="h-3 w-3 mr-1" />
                    Email
                  </Badge>
                )}
                {post.webPublishedAt && (
                  <Badge variant="outline">
                    <Globe className="h-3 w-3 mr-1" />
                    Web
                  </Badge>
                )}
                {!post.sentAt && !post.webPublishedAt && (
                  <Badge variant="secondary">Draft Only</Badge>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Total Engagement</label>
              <div className="text-2xl font-bold">
                {(post.uniqueOpens + webStats.views).toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">
                Combined email opens + web views
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Email Analytics */}
        {post.sentAt && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Email Performance
              </CardTitle>
              <CardDescription>
                Sent on {formatDate(post.sentAt)} via {post.sendingProviderId?.replace('_', ' ').toUpperCase()}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">Recipients</label>
                  <div className="text-2xl font-bold">{(post.recipientCount || 0).toLocaleString()}</div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">Delivery Rate</label>
                  <div className="text-2xl font-bold text-green-600">{formatPercent(emailStats.deliveryRate)}</div>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <Eye className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Opens</span>
                  </div>
                  <div className="text-right">
                    <div className="font-bold">{post.uniqueOpens.toLocaleString()}</div>
                    <div className="text-sm text-muted-foreground">{formatPercent(emailStats.openRate)}</div>
                  </div>
                </div>

                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <MousePointer className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Clicks</span>
                  </div>
                  <div className="text-right">
                    <div className="font-bold">{post.uniqueClicks.toLocaleString()}</div>
                    <div className="text-sm text-muted-foreground">{formatPercent(emailStats.clickRate)}</div>
                  </div>
                </div>

                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Click-to-Open Rate</span>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-blue-600">{formatPercent(emailStats.clickToOpenRate)}</div>
                  </div>
                </div>
              </div>

              {post.emailSubject && (
                <>
                  <Separator />
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">Email Details</label>
                    <div className="space-y-1 text-sm">
                      <p><strong>Subject:</strong> {post.emailSubject}</p>
                      <p><strong>From:</strong> {post.fromName} &lt;{post.fromEmail}&gt;</p>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        )}

        {/* Web Analytics */}
        {post.webPublishedAt && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                Web Performance
              </CardTitle>
              <CardDescription>
                Published on {formatDate(post.webPublishedAt)}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">Page Views</label>
                  <div className="text-3xl font-bold">{webStats.views.toLocaleString()}</div>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Published</span>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {formatDate(webStats.publishedDate)}
                  </div>
                </div>
              </div>

              <Separator />

              <Button variant="outline" className="w-full" asChild>
                <Link href={`/posts/${post.id}`} target="_blank">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  View Web Page
                </Link>
              </Button>
            </CardContent>
          </Card>
        )}

        {/* If neither email nor web is published */}
        {!post.sentAt && !post.webPublishedAt && (
          <Card className="lg:col-span-2">
            <CardContent className="pt-6">
              <div className="text-center py-12">
                <h3 className="text-lg font-semibold mb-2">No Analytics Available</h3>
                <p className="text-muted-foreground mb-4">
                  This post hasn't been published via email or web yet.
                </p>
                <Button asChild>
                  <Link href="/posts">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Posts
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Benchmarks Section */}
      {post.sentAt && (
        <Card>
          <CardHeader>
            <CardTitle>Industry Benchmarks</CardTitle>
            <CardDescription>
              How your post performs compared to industry averages
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">Open Rate</label>
                <div className="flex items-center gap-2">
                  <div className="font-bold">{formatPercent(emailStats.openRate)}</div>
                  <span className="text-sm text-muted-foreground">vs 21.5% avg</span>
                  {emailStats.openRate > 21.5 ? (
                    <Badge variant="default" className="text-xs">Above Average</Badge>
                  ) : (
                    <Badge variant="secondary" className="text-xs">Below Average</Badge>
                  )}
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">Click Rate</label>
                <div className="flex items-center gap-2">
                  <div className="font-bold">{formatPercent(emailStats.clickRate)}</div>
                  <span className="text-sm text-muted-foreground">vs 2.6% avg</span>
                  {emailStats.clickRate > 2.6 ? (
                    <Badge variant="default" className="text-xs">Above Average</Badge>
                  ) : (
                    <Badge variant="secondary" className="text-xs">Below Average</Badge>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">Click-to-Open Rate</label>
                <div className="flex items-center gap-2">
                  <div className="font-bold">{formatPercent(emailStats.clickToOpenRate)}</div>
                  <span className="text-sm text-muted-foreground">vs 12.4% avg</span>
                  {emailStats.clickToOpenRate > 12.4 ? (
                    <Badge variant="default" className="text-xs">Above Average</Badge>
                  ) : (
                    <Badge variant="secondary" className="text-xs">Below Average</Badge>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
