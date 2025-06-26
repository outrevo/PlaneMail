
'use server';

import { db } from '@/lib/drizzle';
import { subscribers, newsletters } from '@/db/schema';
import { auth } from '@clerk/nextjs/server';
import { eq, and, desc } from 'drizzle-orm';
import { formatDistanceToNow } from 'date-fns';

export type DashboardStats = {
  totalSubscribers: number;
  newslettersSent: number;
};

export type ActivityItem = {
  id: string;
  type: 'newsletter' | 'subscriber';
  text: string;
  timestamp: Date;
  timeAgo: string;
};

export async function getDashboardStats(): Promise<DashboardStats> {
  const { userId } = await auth();
  if (!userId) {
    // Or return default/error state
    return { totalSubscribers: 0, newslettersSent: 0 };
  }

  try {
    // Drizzle's count() isn't straightforward for a simple number.
    // This workaround gets the length of the filtered array.
    const totalSubscribers = (await db.select({id: subscribers.id}).from(subscribers).where(eq(subscribers.userId, userId))).length;
    const newslettersSent = (await db.select({id: newsletters.id}).from(newsletters).where(and(eq(newsletters.userId, userId), eq(newsletters.status, 'sent')))).length;


    return {
      totalSubscribers: totalSubscribers || 0,
      newslettersSent: newslettersSent || 0,
    };
  } catch (error) {
    console.error('Failed to fetch dashboard stats:', error);
    return { totalSubscribers: 0, newslettersSent: 0 };
  }
}

export async function getRecentActivityItems(): Promise<ActivityItem[]> {
  const { userId } = await auth();
  if (!userId) {
    return [];
  }

  try {
    const recentNewsletters = await db
      .select({
        id: newsletters.id,
        subject: newsletters.subject,
        sentAt: newsletters.sentAt,
      })
      .from(newsletters)
      .where(and(eq(newsletters.userId, userId), eq(newsletters.status, 'sent')))
      .orderBy(desc(newsletters.sentAt))
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

    recentNewsletters.forEach(nl => {
      if (nl.sentAt) {
        activities.push({
          id: nl.id,
          type: 'newsletter',
          text: `Newsletter "${nl.subject || 'Untitled'}" sent.`,
          timestamp: nl.sentAt,
          timeAgo: formatDistanceToNow(nl.sentAt, { addSuffix: true }),
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
