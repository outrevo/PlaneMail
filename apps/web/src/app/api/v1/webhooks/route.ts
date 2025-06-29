import { NextRequest, NextResponse } from 'next/server';
import { authenticateApiKey } from '@/lib/auth/api-key-auth';
import { db } from '@/lib/drizzle';
import { webhooks } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { z } from 'zod';

const createWebhookSchema = z.object({
  url: z.string().url({ message: "Valid webhook URL is required." }),
  events: z.array(z.enum([
    'subscriber.created',
    'subscriber.updated', 
    'subscriber.unsubscribed',
    'subscriber.tagged',
    'subscriber.untagged',
    'post.published',
    'post.sent',
    'segment.created',
    'segment.updated'
  ])).min(1, "At least one event type must be specified"),
  description: z.string().max(255).optional(),
});

// GET - List webhooks for authenticated user
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

    const userWebhooks = await db
      .select({
        id: webhooks.id,
        url: webhooks.url,
        events: webhooks.events,
        description: webhooks.description,
        isActive: webhooks.isActive,
        createdAt: webhooks.createdAt,
        lastTriggeredAt: webhooks.lastTriggeredAt
      })
      .from(webhooks)
      .where(eq(webhooks.userId, authResult.userId));

    return NextResponse.json({ 
      webhooks: userWebhooks,
      count: userWebhooks.length 
    }, { status: 200 });

  } catch (error: any) {
    console.error('API Error (/api/v1/webhooks GET):', error);
    return NextResponse.json({ error: 'An unexpected internal server error occurred.' }, { status: 500 });
  }
}

// POST - Create a new webhook
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
    
    const validationResult = createWebhookSchema.safeParse(rawBody);
    if (!validationResult.success) {
      return NextResponse.json({ 
        error: 'Validation failed.', 
        details: validationResult.error.flatten().fieldErrors 
      }, { status: 400 });
    }

    const { url, events, description } = validationResult.data;

    // Check if webhook URL already exists for this user
    const existingWebhook = await db
      .select()
      .from(webhooks)
      .where(and(
        eq(webhooks.userId, authResult.userId),
        eq(webhooks.url, url)
      ))
      .limit(1);

    if (existingWebhook.length > 0) {
      return NextResponse.json({ 
        error: 'A webhook with this URL already exists for your account.' 
      }, { status: 409 });
    }

    const [newWebhook] = await db.insert(webhooks).values({
      userId: authResult.userId,
      url,
      events,
      description: description || null,
      isActive: true,
      createdAt: new Date(),
    }).returning({
      id: webhooks.id,
      url: webhooks.url,
      events: webhooks.events,
      description: webhooks.description,
      isActive: webhooks.isActive,
      createdAt: webhooks.createdAt
    });

    return NextResponse.json({ 
      message: 'Webhook created successfully.',
      webhook: newWebhook 
    }, { status: 201 });

  } catch (error: any) {
    console.error('API Error (/api/v1/webhooks POST):', error);
    return NextResponse.json({ error: 'An unexpected internal server error occurred.' }, { status: 500 });
  }
}

// DELETE - Delete a webhook (webhook ID should be in query params)
export async function DELETE(req: NextRequest) {
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
    const webhookId = searchParams.get('id');

    if (!webhookId) {
      return NextResponse.json({ 
        error: 'Webhook ID is required in query parameters.' 
      }, { status: 400 });
    }

    // Delete webhook if it belongs to the authenticated user
    const deletedWebhook = await db
      .delete(webhooks)
      .where(and(
        eq(webhooks.id, webhookId),
        eq(webhooks.userId, authResult.userId)
      ))
      .returning({ id: webhooks.id });

    if (deletedWebhook.length === 0) {
      return NextResponse.json({ 
        error: 'Webhook not found or you do not have permission to delete it.' 
      }, { status: 404 });
    }

    return NextResponse.json({ 
      message: 'Webhook deleted successfully.',
      id: deletedWebhook[0].id 
    }, { status: 200 });

  } catch (error: any) {
    console.error('API Error (/api/v1/webhooks DELETE):', error);
    return NextResponse.json({ error: 'An unexpected internal server error occurred.' }, { status: 500 });
  }
}
