import { db } from '@/lib/drizzle';
import { webhooks } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

interface WebhookPayload {
  event: string;
  data: any;
  timestamp: string;
  userId: string;
}

interface WebhookEvent {
  userId: string;
  event: 'subscriber.created' | 'subscriber.updated' | 'subscriber.unsubscribed' | 
         'subscriber.tagged' | 'subscriber.untagged' | 'post.published' | 
         'post.sent' | 'segment.created' | 'segment.updated';
  data: any;
}

/**
 * Trigger webhooks for a specific event
 */
export async function triggerWebhooks(eventData: WebhookEvent): Promise<void> {
  try {
    // Get all active webhooks for this user that listen for this event
    const userWebhooks = await db
      .select()
      .from(webhooks)
      .where(and(
        eq(webhooks.userId, eventData.userId),
        eq(webhooks.isActive, true)
      ));

    // Filter webhooks that listen for this specific event
    const relevantWebhooks = userWebhooks.filter(webhook => {
      const events = webhook.events as string[];
      return events.includes(eventData.event);
    });

    if (relevantWebhooks.length === 0) {
      return; // No webhooks to trigger
    }

    const payload: WebhookPayload = {
      event: eventData.event,
      data: eventData.data,
      timestamp: new Date().toISOString(),
      userId: eventData.userId
    };

    // Trigger all relevant webhooks in parallel
    const webhookPromises = relevantWebhooks.map(webhook => 
      sendWebhook(webhook.url, payload, webhook.id)
    );

    await Promise.allSettled(webhookPromises);

  } catch (error) {
    console.error('Error triggering webhooks:', error);
    // Don't throw error - webhook failures shouldn't break main functionality
  }
}

/**
 * Send a single webhook
 */
async function sendWebhook(url: string, payload: WebhookPayload, webhookId: string): Promise<void> {
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'PlaneMail-Webhook/1.0',
        'X-PlaneMail-Event': payload.event,
        'X-PlaneMail-Timestamp': payload.timestamp,
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(10000), // 10 second timeout
    });

    // Update lastTriggeredAt regardless of response status
    await db
      .update(webhooks)
      .set({ lastTriggeredAt: new Date() })
      .where(eq(webhooks.id, webhookId));

    if (!response.ok) {
      console.warn(`Webhook ${webhookId} returned ${response.status}: ${response.statusText}`);
    }

  } catch (error) {
    console.error(`Failed to send webhook ${webhookId}:`, error);
    // Could implement retry logic here in the future
  }
}

/**
 * Helper functions for common webhook events
 */

export async function triggerSubscriberCreated(userId: string, subscriber: any): Promise<void> {
  await triggerWebhooks({
    userId,
    event: 'subscriber.created',
    data: {
      subscriber: {
        id: subscriber.id,
        email: subscriber.email,
        name: subscriber.name,
        status: subscriber.status,
        dateAdded: subscriber.dateAdded,
      }
    }
  });
}

export async function triggerSubscriberUpdated(userId: string, subscriber: any, changes: any): Promise<void> {
  await triggerWebhooks({
    userId,
    event: 'subscriber.updated',
    data: {
      subscriber: {
        id: subscriber.id,
        email: subscriber.email,
        name: subscriber.name,
        status: subscriber.status,
        dateAdded: subscriber.dateAdded,
      },
      changes
    }
  });
}

export async function triggerSubscriberUnsubscribed(userId: string, subscriber: any): Promise<void> {
  await triggerWebhooks({
    userId,
    event: 'subscriber.unsubscribed',
    data: {
      subscriber: {
        id: subscriber.id,
        email: subscriber.email,
        name: subscriber.name,
        dateUnsubscribed: new Date().toISOString(),
      }
    }
  });
}

export async function triggerSubscriberTagged(userId: string, subscriber: any, segment: any): Promise<void> {
  await triggerWebhooks({
    userId,
    event: 'subscriber.tagged',
    data: {
      subscriber: {
        id: subscriber.id,
        email: subscriber.email,
        name: subscriber.name,
      },
      segment: {
        id: segment.id,
        name: segment.name,
      }
    }
  });
}

export async function triggerPostPublished(userId: string, post: any): Promise<void> {
  await triggerWebhooks({
    userId,
    event: 'post.published',
    data: {
      post: {
        id: post.id,
        title: post.title,
        slug: post.slug,
        publishedAt: post.publishedAt,
        webUrl: post.webUrl,
      }
    }
  });
}

export async function triggerPostSent(userId: string, post: any, emailStats: any): Promise<void> {
  await triggerWebhooks({
    userId,
    event: 'post.sent',
    data: {
      post: {
        id: post.id,
        title: post.title,
        slug: post.slug,
      },
      email: {
        sentAt: new Date().toISOString(),
        recipientCount: emailStats.recipientCount,
        provider: emailStats.provider,
      }
    }
  });
}

export async function triggerSegmentCreated(userId: string, segment: any): Promise<void> {
  await triggerWebhooks({
    userId,
    event: 'segment.created',
    data: {
      segment: {
        id: segment.id,
        name: segment.name,
        description: segment.description,
        createdAt: segment.createdAt,
      }
    }
  });
}
