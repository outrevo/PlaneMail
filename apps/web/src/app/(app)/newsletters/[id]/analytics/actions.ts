
'use server';

import { db } from '@/lib/drizzle';
import { newsletters } from '@/db/schema';
import { auth } from '@clerk/nextjs/server';
import { eq, and } from 'drizzle-orm';

export type NewsletterAnalyticsData = typeof newsletters.$inferSelect & {
  openRate?: number;
  clickToOpenRate?: number;
  bounceRate?: number;
};

export async function getNewsletterWithAnalytics(newsletterId: string): Promise<NewsletterAnalyticsData | null> {
  const { userId } = await auth();
  if (!userId) {
    throw new Error('Not authenticated');
  }

  try {
    const result = await db.query.newsletters.findFirst({
      where: and(eq(newsletters.id, newsletterId), eq(newsletters.userId, userId)),
    });

    if (!result) {
      return null;
    }
    
    // Calculate rates if recipientCount > 0
    const recipientCount = result.recipientCount || 0;
    const openRate = recipientCount > 0 ? ((result.uniqueOpens || 0) / recipientCount) * 100 : 0;
    // Click-to-open rate (CTOR) is unique clicks / unique opens
    const clickToOpenRate = (result.uniqueOpens || 0) > 0 ? ((result.uniqueClicks || 0) / (result.uniqueOpens || 1)) * 100 : 0;
    const bounceRate = recipientCount > 0 ? ((result.totalBounces || 0) / recipientCount) * 100 : 0;


    return {
      ...result,
      openRate: parseFloat(openRate.toFixed(2)),
      clickToOpenRate: parseFloat(clickToOpenRate.toFixed(2)),
      bounceRate: parseFloat(bounceRate.toFixed(2)),
    };
  } catch (error) {
    console.error(`Failed to fetch analytics for newsletter ${newsletterId}:`, error);
    return null;
  }
}

// Placeholder for time-series data fetching
export async function getNewsletterTimeSeriesData(newsletterId: string, eventType: 'open' | 'click') {
  // In a real implementation, this would query a 'newsletter_events' table
  // and aggregate data by day/hour for the last month.
  console.log(`Fetching time-series data for ${newsletterId}, event: ${eventType} - (Not Implemented)`);
  
  // Return mock data structure for now
  const mockData = Array.from({ length: 30 }, (_, i) => ({
    date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    count: Math.floor(Math.random() * (eventType === 'open' ? 50 : 15)),
  }));
  return mockData;
}
