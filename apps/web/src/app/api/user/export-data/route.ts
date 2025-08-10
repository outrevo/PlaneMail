import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { 
  appUsers, 
  subscribers, 
  posts, 
  segments, 
  userIntegrations,
  apiKeys,
  webhooks,
  publicSiteSettings,
  images
} from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Export all user data for GDPR compliance
    const userData = {
      exportDate: new Date().toISOString(),
      userId,
      description: 'Complete export of your PlaneMail account data as required by GDPR',
      
      // User profile
      profile: await db
        .select()
        .from(appUsers)
        .where(eq(appUsers.clerkUserId, userId)),

      // Posts and content
      posts: await db
        .select()
        .from(posts)
        .where(eq(posts.userId, userId)),

      // Subscribers
      subscribers: await db
        .select()
        .from(subscribers)
        .where(eq(subscribers.userId, userId)),

      // Audience segments
      segments: await db
        .select()
        .from(segments)
        .where(eq(segments.userId, userId)),

      // Site settings
      siteSettings: await db
        .select()
        .from(publicSiteSettings)
        .where(eq(publicSiteSettings.userId, userId)),

      // Images and media
      images: await db
        .select()
        .from(images)
        .where(eq(images.userId, userId)),

      // API keys (without sensitive data)
      apiKeys: await db
        .select({
          id: apiKeys.id,
          name: apiKeys.name,
          prefix: apiKeys.prefix,
          createdAt: apiKeys.createdAt,
          lastUsedAt: apiKeys.lastUsedAt,
          expiresAt: apiKeys.expiresAt,
        })
        .from(apiKeys)
        .where(eq(apiKeys.userId, userId)),

      // Webhooks
      webhooks: await db
        .select()
        .from(webhooks)
        .where(eq(webhooks.userId, userId)),

      // Integrations (without API keys for security)
      integrations: await db
        .select({
          id: userIntegrations.id,
          provider: userIntegrations.provider,
          status: userIntegrations.status,
          connectedAt: userIntegrations.connectedAt,
          createdAt: userIntegrations.createdAt,
        })
        .from(userIntegrations)
        .where(eq(userIntegrations.userId, userId)),
    };

    // Set appropriate headers for download
    const headers = new Headers({
      'Content-Type': 'application/json',
      'Content-Disposition': `attachment; filename="planemail-data-export-${userId}-${new Date().toISOString().split('T')[0]}.json"`,
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
    });

    return new NextResponse(JSON.stringify(userData, null, 2), { 
      status: 200, 
      headers 
    });

  } catch (error) {
    console.error('Data export error:', error);
    return NextResponse.json(
      { error: 'Failed to export data' }, 
      { status: 500 }
    );
  }
}
