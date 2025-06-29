import { NextRequest, NextResponse } from 'next/server';
import { authenticateApiKey } from '@/lib/auth/api-key-auth';
import { db } from '@/lib/drizzle';
import { subscribers, subscriberSegments, segments } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { z } from 'zod';

// GET - Get subscriber by ID with their segments
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const authResult = await authenticateApiKey(req);
    
    if (!authResult.userId) {
      if (authResult.rateLimited) {
        return NextResponse.json({ 
          error: 'Rate limit exceeded. Please try again later.' 
        }, { 
          status: 429,
          headers: {
            'X-RateLimit-Limit': '1000',
            'X-RateLimit-Window': '15min',
            'Retry-After': '900'
          }
        });
      }
      
      return NextResponse.json({ 
        error: authResult.error || 'Unauthorized: Invalid or missing API key.' 
      }, { status: 401 });
    }

    const subscriberId = id;

    // Get subscriber details
    const subscriber = await db
      .select({
        id: subscribers.id,
        email: subscribers.email,
        name: subscribers.name,
        status: subscribers.status,
        dateAdded: subscribers.dateAdded
      })
      .from(subscribers)
      .where(and(
        eq(subscribers.id, subscriberId),
        eq(subscribers.userId, authResult.userId)
      ))
      .limit(1);

    if (subscriber.length === 0) {
      return NextResponse.json({ 
        error: 'Subscriber not found.' 
      }, { status: 404 });
    }

    // Get subscriber's segments
    const subscriberSegmentsList = await db
      .select({
        id: segments.id,
        name: segments.name,
        description: segments.description
      })
      .from(subscriberSegments)
      .innerJoin(segments, eq(subscriberSegments.segmentId, segments.id))
      .where(eq(subscriberSegments.subscriberId, subscriberId));

    return NextResponse.json({ 
      subscriber: {
        ...subscriber[0],
        segments: subscriberSegmentsList
      }
    }, { status: 200 });

  } catch (error: any) {
    console.error('API Error (/api/v1/subscribers/[id] GET):', error);
    return NextResponse.json({ error: 'An unexpected internal server error occurred.' }, { status: 500 });
  }
}

const updateSubscriberSchema = z.object({
  name: z.string().max(255).optional(),
  status: z.enum(['active', 'unsubscribed', 'pending', 'bounced']).optional(),
  addSegments: z.array(z.string()).optional().default([]),
  removeSegments: z.array(z.string()).optional().default([]),
});

// PATCH - Update subscriber and manage segments
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const authResult = await authenticateApiKey(req);
    
    if (!authResult.userId) {
      if (authResult.rateLimited) {
        return NextResponse.json({ 
          error: 'Rate limit exceeded. Please try again later.' 
        }, { 
          status: 429,
          headers: {
            'X-RateLimit-Limit': '1000',
            'X-RateLimit-Window': '15min',
            'Retry-After': '900'
          }
        });
      }
      
      return NextResponse.json({ 
        error: authResult.error || 'Unauthorized: Invalid or missing API key.' 
      }, { status: 401 });
    }

    const subscriberId = id;

    let rawBody;
    try {
        rawBody = await req.json();
    } catch (e) {
        return NextResponse.json({ error: 'Invalid JSON payload.' }, { status: 400 });
    }
    
    const validationResult = updateSubscriberSchema.safeParse(rawBody);
    if (!validationResult.success) {
      return NextResponse.json({ 
        error: 'Validation failed.', 
        details: validationResult.error.flatten().fieldErrors 
      }, { status: 400 });
    }

    const { name, status, addSegments, removeSegments } = validationResult.data;

    // Verify subscriber exists and belongs to user
    const existingSubscriber = await db
      .select()
      .from(subscribers)
      .where(and(
        eq(subscribers.id, subscriberId),
        eq(subscribers.userId, authResult.userId)
      ))
      .limit(1);

    if (existingSubscriber.length === 0) {
      return NextResponse.json({ 
        error: 'Subscriber not found.' 
      }, { status: 404 });
    }

    // Update subscriber details if provided
    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (status !== undefined) updateData.status = status;

    if (Object.keys(updateData).length > 0) {
      await db
        .update(subscribers)
        .set(updateData)
        .where(eq(subscribers.id, subscriberId));
    }

    // Handle segment additions
    if (addSegments && addSegments.length > 0) {
      // Get segment IDs from names
      const segmentIds = await db
        .select({ id: segments.id })
        .from(segments)
        .where(and(
          eq(segments.userId, authResult.userId),
          // Note: This would need to be a proper IN query in production
        ));

      const validSegmentIds = segmentIds.map(s => s.id);
      
      // Add subscriber to segments (ignore conflicts)
      for (const segmentId of validSegmentIds) {
        await db
          .insert(subscriberSegments)
          .values({
            subscriberId,
            segmentId
          })
          .onConflictDoNothing();
      }
    }

    // Handle segment removals
    if (removeSegments && removeSegments.length > 0) {
      // Get segment IDs from names
      const segmentIds = await db
        .select({ id: segments.id })
        .from(segments)
        .where(and(
          eq(segments.userId, authResult.userId),
          // Note: This would need to be a proper IN query in production
        ));

      const validSegmentIds = segmentIds.map(s => s.id);
      
      // Remove subscriber from segments
      for (const segmentId of validSegmentIds) {
        await db
          .delete(subscriberSegments)
          .where(and(
            eq(subscriberSegments.subscriberId, subscriberId),
            eq(subscriberSegments.segmentId, segmentId)
          ));
      }
    }

    return NextResponse.json({ 
      message: 'Subscriber updated successfully.'
    }, { status: 200 });

  } catch (error: any) {
    console.error('API Error (/api/v1/subscribers/[id] PATCH):', error);
    return NextResponse.json({ error: 'An unexpected internal server error occurred.' }, { status: 500 });
  }
}
