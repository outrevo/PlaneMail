
'use server';

import { db } from '@/lib/drizzle';
import { subscribers, posts } from '@/db/schema';
import { auth } from '@clerk/nextjs/server';
import { eq, and, desc } from 'drizzle-orm';
import { formatDistanceToNow } from 'date-fns';

export type DashboardStats = {
  totalSubscribers: number;
  postsSent: number;
};

export type ActivityItem = {
  id: string;
  type: 'post' | 'subscriber';
  text: string;
  timestamp: Date;
  timeAgo: string;
};

export async function getDashboardStats(): Promise<DashboardStats> {
  const { userId } = await auth();
  if (!userId) {
    // Or return default/error state
    return { totalSubscribers: 0, postsSent: 0 };
  }

  try {
    // Drizzle's count() isn't straightforward for a simple number.
    // This workaround gets the length of the filtered array.
    const totalSubscribers = (await db.select({id: subscribers.id}).from(subscribers).where(eq(subscribers.userId, userId))).length;
    const postsSent = (await db.select({id: posts.id}).from(posts).where(and(eq(posts.userId, userId), eq(posts.status, 'sent')))).length;


    return {
      totalSubscribers: totalSubscribers || 0,
      postsSent: postsSent || 0,
    };
  } catch (error) {
    console.error('Failed to fetch dashboard stats:', error);
    return { totalSubscribers: 0, postsSent: 0 };
  }
}

export async function getRecentActivityItems(): Promise<ActivityItem[]> {
  const { userId } = await auth();
  if (!userId) {
    return [];
  }

  try {
    const recentPosts = await db
      .select({
        id: posts.id,
        title: posts.title,
        sentAt: posts.sentAt,
      })
      .from(posts)
      .where(and(eq(posts.userId, userId), eq(posts.status, 'sent')))
      .orderBy(desc(posts.sentAt))
      .limit(3);

    const recentSubscribers = await db
      .select({
        id: subscribers.id,
        email: subscribers.email,
        dateAdded: subscribers.dateAdded,
      })
      .from(subscribers)
      .where(eq(subscribers.userId, userId))
      .orderBy(desc(subscribers.dateAdded))
      .limit(3);

    const activities: ActivityItem[] = [];

    recentPosts.forEach(post => {
      if (post.sentAt) {
        activities.push({
          id: post.id,
          type: 'post',
          text: `Post "${post.title || 'Untitled'}" sent as email.`,
          timestamp: post.sentAt,
          timeAgo: formatDistanceToNow(post.sentAt, { addSuffix: true }),
        });
      }
    });

    recentSubscribers.forEach(sub => {
      activities.push({
        id: sub.id,
        type: 'subscriber',
        text: `New subscriber: ${sub.email}.`,
        timestamp: sub.dateAdded,
        timeAgo: formatDistanceToNow(sub.dateAdded, { addSuffix: true }),
      });
    });

    // Sort all activities by timestamp descending
    activities.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    return activities.slice(0, 5); // Return top 5 recent activities overall
  } catch (error) {
    console.error('Failed to fetch recent activity:', error);
    return [];
  }
}
