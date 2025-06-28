'use server';

import { db } from '@/lib/drizzle';
import { posts } from '@/db/schema';
import { auth } from '@clerk/nextjs/server';
import { eq, and } from 'drizzle-orm';

export type PostAnalyticsData = {
  post: {
    id: string;
    title: string;
    status: string;
    sentAt: Date | null;
    webPublishedAt: Date | null;
    recipientCount: number | null;
    totalOpens: number;
    uniqueOpens: number;
    totalClicks: number;
    uniqueClicks: number;
    webViews: number;
    emailSubject?: string | null;
    fromName?: string | null;
    fromEmail?: string | null;
    sendingProviderId?: string | null;
  };
  emailStats: {
    deliveryRate: number;
    openRate: number;
    clickRate: number;
    clickToOpenRate: number;
  };
  webStats: {
    views: number;
    publishedDate: Date | null;
  };
};

export async function getPostAnalytics(postId: string): Promise<PostAnalyticsData | null> {
  const { userId } = await auth();
  if (!userId) {
    throw new Error('Not authenticated');
  }

  try {
    const [post] = await db.select({
      id: posts.id,
      title: posts.title,
      status: posts.status,
      sentAt: posts.sentAt,
      webPublishedAt: posts.webPublishedAt,
      recipientCount: posts.recipientCount,
      totalOpens: posts.totalOpens,
      uniqueOpens: posts.uniqueOpens,
      totalClicks: posts.totalClicks,
      uniqueClicks: posts.uniqueClicks,
      webViews: posts.webViews,
      emailSubject: posts.emailSubject,
      fromName: posts.fromName,
      fromEmail: posts.fromEmail,
      sendingProviderId: posts.sendingProviderId,
    })
    .from(posts)
    .where(and(
      eq(posts.id, postId),
      eq(posts.userId, userId)
    ))
    .limit(1);

    if (!post) {
      return null;
    }

    // Calculate email statistics
    const recipientCount = post.recipientCount || 0;
    const emailStats = {
      deliveryRate: recipientCount > 0 ? ((recipientCount - 0) / recipientCount) * 100 : 0, // Assuming no bounces for now
      openRate: recipientCount > 0 ? (post.uniqueOpens / recipientCount) * 100 : 0,
      clickRate: recipientCount > 0 ? (post.uniqueClicks / recipientCount) * 100 : 0,
      clickToOpenRate: post.uniqueOpens > 0 ? (post.uniqueClicks / post.uniqueOpens) * 100 : 0,
    };

    const webStats = {
      views: post.webViews,
      publishedDate: post.webPublishedAt,
    };

    return {
      post,
      emailStats,
      webStats,
    };
  } catch (error) {
    console.error('Failed to fetch post analytics:', error);
    return null;
  }
}
