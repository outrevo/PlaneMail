import { NextRequest, NextResponse } from 'next/server';
import { authenticateApiKey } from '@/lib/auth/api-key-auth';
import { db } from '@/lib/drizzle';
import { segments } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { z } from 'zod';
import { triggerSegmentCreated } from '@/lib/webhooks/dispatcher';

const createSegmentSchema = z.object({
  name: z.string().min(1).max(100, "Segment name must be between 1 and 100 characters."),
  description: z.string().max(500).optional(),
});

// GET - List segments for authenticated user
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

    const userSegments = await db
      .select({
        id: segments.id,
        name: segments.name,
        description: segments.description,
        createdAt: segments.createdAt,
        updatedAt: segments.updatedAt
      })
      .from(segments)
      .where(eq(segments.userId, authResult.userId));

    return NextResponse.json({ 
      segments: userSegments,
      count: userSegments.length 
    }, { status: 200 });

  } catch (error: any) {
    console.error('API Error (/api/v1/segments GET):', error);
    return NextResponse.json({ error: 'An unexpected internal server error occurred.' }, { status: 500 });
  }
}

// POST - Create a new segment
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
    
    const validationResult = createSegmentSchema.safeParse(rawBody);
    if (!validationResult.success) {
      return NextResponse.json({ 
        error: 'Validation failed.', 
        details: validationResult.error.flatten().fieldErrors 
      }, { status: 400 });
    }

    const { name, description } = validationResult.data;

    // Check if segment name already exists for this user
    const existingSegment = await db
      .select()
      .from(segments)
      .where(and(
        eq(segments.userId, authResult.userId),
        eq(segments.name, name)
      ))
      .limit(1);

    if (existingSegment.length > 0) {
      return NextResponse.json({ 
        error: 'A segment with this name already exists.' 
      }, { status: 409 });
    }

    const [newSegment] = await db.insert(segments).values({
      userId: authResult.userId,
      name,
      description: description || null,
      createdAt: new Date(),
    }).returning({
      id: segments.id,
      name: segments.name,
      description: segments.description,
      createdAt: segments.createdAt
    });

    // Trigger webhook for segment creation
    try {
      await triggerSegmentCreated(authResult.userId, newSegment);
    } catch (webhookError) {
      console.error('Webhook Error (/api/v1/segments POST - triggerSegmentCreated):', webhookError);
      // Don't block the response to the client if the webhook fails
    }

    return NextResponse.json({ 
      message: 'Segment created successfully.',
      segment: newSegment 
    }, { status: 201 });

  } catch (error: any) {
    console.error('API Error (/api/v1/segments POST):', error);
    return NextResponse.json({ error: 'An unexpected internal server error occurred.' }, { status: 500 });
  }
}
