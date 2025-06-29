
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { authenticateApiKey } from '@/lib/auth/api-key-auth';
import { addSubscriberFromApi } from '@/app/(app)/integrations/actions';
import { db } from '@/lib/drizzle';
import { subscribers, segments, subscriberSegments } from '@/db/schema';
import { eq, and, like, desc, asc, sql, count, inArray } from 'drizzle-orm';

const addSubscriberApiSchema = z.object({
  email: z.string().email({ message: "Invalid email address." }),
  name: z.string().max(255).optional(),
  status: z.enum(['active', 'unsubscribed', 'pending', 'bounced']).optional().default('active'),
  segmentNames: z.array(z.string().min(1)).optional().default([]),
});

const listSubscribersSchema = z.object({
  page: z.string().optional().default('1').transform(val => Math.max(1, parseInt(val))),
  limit: z.string().optional().default('50').transform(val => Math.min(1000, Math.max(1, parseInt(val)))),
  search: z.string().optional(),
  status: z.enum(['active', 'unsubscribed', 'pending', 'bounced']).optional(),
  segment: z.string().optional(),
  sort: z.enum(['email', 'name', 'dateAdded', '-email', '-name', '-dateAdded']).optional().default('-dateAdded'),
});

// GET - List subscribers with pagination and filters
export async function GET(req: NextRequest) {
  try {
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

    const { searchParams } = new URL(req.url);
    const queryParams = Object.fromEntries(searchParams.entries());
    
    const validationResult = listSubscribersSchema.safeParse(queryParams);
    if (!validationResult.success) {
      return NextResponse.json({ 
        error: 'Invalid query parameters.', 
        details: validationResult.error.flatten().fieldErrors 
      }, { status: 400 });
    }

    const { page, limit, search, status, segment, sort } = validationResult.data;
    const offset = (page - 1) * limit;

    // Build WHERE conditions
    const whereConditions = [eq(subscribers.userId, authResult.userId)];

    // Add search filter
    if (search) {
      whereConditions.push(
        sql`(${subscribers.email} ILIKE ${`%${search}%`} OR ${subscribers.name} ILIKE ${`%${search}%`})`
      );
    }

    // Add status filter
    if (status) {
      whereConditions.push(eq(subscribers.status, status));
    }

    // Handle segment filtering - if segment is provided, add it to where conditions
    if (segment) {
      // Find the segment ID first
      const segmentRecord = await db
        .select({ id: segments.id })
        .from(segments)
        .where(and(eq(segments.userId, authResult.userId), eq(segments.name, segment)))
        .limit(1);
      
      if (segmentRecord.length === 0) {
        return NextResponse.json({ 
          error: `Segment '${segment}' not found.` 
        }, { status: 404 });
      }

      // Add condition to filter subscribers by segment
      whereConditions.push(
        sql`EXISTS (SELECT 1 FROM ${subscriberSegments} WHERE ${subscriberSegments.subscriberId} = ${subscribers.id} AND ${subscriberSegments.segmentId} = ${segmentRecord[0].id})`
      );
    }

    // Build sort order
    const sortField = sort.startsWith('-') ? sort.substring(1) : sort;
    const sortDirection = sort.startsWith('-') ? desc : asc;
    
    let orderBy;
    switch (sortField) {
      case 'email':
        orderBy = sortDirection(subscribers.email);
        break;
      case 'name':
        orderBy = sortDirection(subscribers.name);
        break;
      case 'dateAdded':
      default:
        orderBy = sortDirection(subscribers.dateAdded);
        break;
    }

    // Get total count for pagination
    const [{ count: totalCount }] = await db
      .select({ count: count() })
      .from(subscribers)
      .where(and(...whereConditions));

    // Get subscribers
    const subscribersList = await db
      .select({
        id: subscribers.id,
        email: subscribers.email,
        name: subscribers.name,
        status: subscribers.status,
        dateAdded: subscribers.dateAdded,
      })
      .from(subscribers)
      .where(and(...whereConditions))
      .orderBy(orderBy)
      .limit(limit)
      .offset(offset);

    // Get all subscriber IDs for efficient segment fetching
    const subscriberIds = subscribersList.map(s => s.id);
    
    // Get all segments for these subscribers in one query
    const subscriberSegmentMap = new Map();
    if (subscriberIds.length > 0) {
      const segmentData = await db
        .select({
          subscriberId: subscriberSegments.subscriberId,
          segmentId: segments.id,
          segmentName: segments.name,
        })
        .from(subscriberSegments)
        .innerJoin(segments, eq(subscriberSegments.segmentId, segments.id))
        .where(inArray(subscriberSegments.subscriberId, subscriberIds));

      // Group segments by subscriber ID
      for (const item of segmentData) {
        if (!subscriberSegmentMap.has(item.subscriberId)) {
          subscriberSegmentMap.set(item.subscriberId, []);
        }
        subscriberSegmentMap.get(item.subscriberId).push({
          id: item.segmentId,
          name: item.segmentName,
        });
      }
    }

    // Combine subscribers with their segments
    const subscribersWithSegments = subscribersList.map(subscriber => ({
      ...subscriber,
      segments: subscriberSegmentMap.get(subscriber.id) || [],
    }));

    // Calculate pagination metadata
    const totalPages = Math.ceil(totalCount / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    return NextResponse.json({ 
      subscribers: subscribersWithSegments,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages,
        hasNextPage,
        hasPrevPage,
        nextPage: hasNextPage ? page + 1 : null,
        prevPage: hasPrevPage ? page - 1 : null,
      },
      filters: {
        search: search || null,
        status: status || null,
        segment: segment || null,
        sort,
      }
    }, { status: 200 });

  } catch (error: any) {
    console.error('API Error (/api/v1/subscribers GET):', error);
    return NextResponse.json({ error: 'An unexpected internal server error occurred.' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
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

    let rawBody;
    try {
        rawBody = await req.json();
    } catch (e) {
        return NextResponse.json({ error: 'Invalid JSON payload.' }, { status: 400 });
    }
    
    const validationResult = addSubscriberApiSchema.safeParse(rawBody);
    if (!validationResult.success) {
      return NextResponse.json({ error: 'Validation failed.', details: validationResult.error.flatten().fieldErrors }, { status: 400 });
    }

    const { email, name, status, segmentNames } = validationResult.data;

    // Call the refined server action logic for adding subscriber
    const result = await addSubscriberFromApi(authResult.userId, { email, name, status, segmentNames });

    if (result.success && result.subscriberId) {
      return NextResponse.json({ message: result.message, subscriberId: result.subscriberId }, { status: result.statusCode });
    } else {
      return NextResponse.json({ error: result.message, details: result.errors }, { status: result.statusCode });
    }

  } catch (error: any) {
    console.error('API Error (/api/v1/subscribers):', error);
    return NextResponse.json({ error: 'An unexpected internal server error occurred.' }, { status: 500 });
  }
}
