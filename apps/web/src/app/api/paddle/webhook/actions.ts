'use server';

import { appUsers, userSubscriptions } from '@/db/schema';
import { db } from '@/lib/drizzle';
import { eq } from 'drizzle-orm';

interface PaddleWebhookEvent {
  event_type: string;
  data: any;
  event_id: string;
  occurred_at: string;
}

interface SubscriptionCreated {
  id: string;
  customer_id: string;
  status: 'active' | 'trialing' | 'past_due' | 'paused' | 'canceled';
  billing_cycle: {
    interval: 'day' | 'week' | 'month' | 'year';
    frequency: number;
  };
  collection_mode: 'automatic' | 'manual';
  created_at: string;
  updated_at: string;
  started_at: string | null;
  first_billed_at: string | null;
  next_billed_at: string | null;
  paused_at: string | null;
  canceled_at: string | null;
  trial_dates: {
    starts_at: string | null;
    ends_at: string | null;
  } | null;
  items: Array<{
    price_id: string;
    price: {
      id: string;
      name: string;
      description: string;
      product_id: string;
      billing_cycle: {
        interval: 'day' | 'week' | 'month' | 'year';
        frequency: number;
      };
      trial_period: {
        interval: 'day' | 'week' | 'month' | 'year';
        frequency: number;
      } | null;
      unit_price: {
        amount: string;
        currency_code: string;
      };
    };
    quantity: number;
  }>;
  custom_data: Record<string, any> | null;
}

export async function handlePaddleWebhook(
  event: PaddleWebhookEvent
): Promise<{ success: boolean; message: string }> {
  try {
    console.log(`Processing Paddle webhook: ${event.event_type}`);

    switch (event.event_type) {
      case 'subscription.created':
        await handleSubscriptionCreated(event.data as SubscriptionCreated);
        break;
      
      case 'subscription.updated':
        await handleSubscriptionUpdated(event.data as SubscriptionCreated);
        break;
      
      case 'subscription.canceled':
        await handleSubscriptionCanceled(event.data as SubscriptionCreated);
        break;
      
      case 'subscription.paused':
        await handleSubscriptionPaused(event.data as SubscriptionCreated);
        break;
      
      case 'subscription.resumed':
        await handleSubscriptionResumed(event.data as SubscriptionCreated);
        break;
      
      case 'transaction.completed':
        await handleTransactionCompleted(event.data);
        break;
      
      default:
        console.log(`Unhandled webhook event type: ${event.event_type}`);
    }

    return { success: true, message: 'Webhook processed successfully' };
  } catch (error) {
    console.error('Error processing Paddle webhook:', error);
    return { success: false, message: 'Failed to process webhook' };
  }
}

async function handleSubscriptionCreated(subscription: SubscriptionCreated) {
  // Extract user email from custom_data or customer
  const userEmail = subscription.custom_data?.user_email;
  const clerkUserId = subscription.custom_data?.user_id;
  
  if (!userEmail && !clerkUserId) {
    console.error('No user email or user ID found in subscription data');
    return;
  }

  // Find the user in your database
  let user;
  if (clerkUserId) {
    user = await db.query.appUsers.findFirst({
      where: eq(appUsers.clerkUserId, clerkUserId),
    });
  } else if (userEmail) {
    // If we only have email, we need to find user by email from Clerk
    // This is more complex since appUsers doesn't store email directly
    console.log('Only email provided, consider storing email in appUsers or using Clerk API');
    return;
  }

  if (!user && clerkUserId) {
    // User doesn't exist in appUsers table, create them
    console.log(`Creating user in appUsers table: ${clerkUserId}`);
    try {
      await db.insert(appUsers).values({
        clerkUserId: clerkUserId,
      });
      
      // Fetch the newly created user
      user = await db.query.appUsers.findFirst({
        where: eq(appUsers.clerkUserId, clerkUserId),
      });
      
      console.log(`Successfully created user: ${clerkUserId}`);
    } catch (error) {
      console.error(`Failed to create user ${clerkUserId}:`, error);
      return;
    }
  }

  if (!user) {
    console.error(`User still not found after creation attempt: ${clerkUserId || userEmail}`);
    return;
  }

  // Determine the plan based on price_id
  const priceId = subscription.items[0]?.price_id;
  let planType = 'hosted';
  
  if (priceId === process.env.PADDLE_PRO_PRICE_ID) {
    planType = 'pro';
  } else if (priceId === process.env.PADDLE_ENTERPRISE_PRICE_ID) {
    planType = 'enterprise';
  }

  // Check if subscription already exists
  const existingSubscription = await db.query.userSubscriptions.findFirst({
    where: eq(userSubscriptions.userId, user.clerkUserId),
  });

  if (existingSubscription) {
    // Update existing subscription
    await db.update(userSubscriptions).set({
      paddleSubscriptionId: subscription.id,
      paddlePlanId: priceId,
      status: subscription.status,
      currentPeriodStart: subscription.started_at ? new Date(subscription.started_at) : null,
      currentPeriodEnd: subscription.next_billed_at ? new Date(subscription.next_billed_at) : null,
      cancelAtPeriodEnd: false,
      updatedAt: new Date(),
    }).where(eq(userSubscriptions.userId, user.clerkUserId));
    
    console.log(`Subscription updated for user ${user.clerkUserId}: ${subscription.id}`);
  } else {
    // Create new subscription
    await db.insert(userSubscriptions).values({
      userId: user.clerkUserId,
      paddleSubscriptionId: subscription.id,
      paddlePlanId: priceId,
      status: subscription.status,
      currentPeriodStart: subscription.started_at ? new Date(subscription.started_at) : null,
      currentPeriodEnd: subscription.next_billed_at ? new Date(subscription.next_billed_at) : null,
      cancelAtPeriodEnd: false,
    });
    
    console.log(`Subscription created for user ${user.clerkUserId}: ${subscription.id}`);
  }
}

async function handleSubscriptionUpdated(subscription: SubscriptionCreated) {
  // Handle subscription updates (plan changes, etc.)
  console.log(`Subscription updated: ${subscription.id}`);
  
  // Find subscription by Paddle subscription ID
  const existingSubscription = await db.query.userSubscriptions.findFirst({
    where: eq(userSubscriptions.paddleSubscriptionId, subscription.id),
  });

  if (!existingSubscription) {
    console.error(`Subscription not found for Paddle ID: ${subscription.id}`);
    return;
  }

  // Determine the plan based on price_id
  const priceId = subscription.items[0]?.price_id;
  
  // Update subscription in database
  await db.update(userSubscriptions).set({
    paddlePlanId: priceId,
    status: subscription.status,
    currentPeriodStart: subscription.started_at ? new Date(subscription.started_at) : null,
    currentPeriodEnd: subscription.next_billed_at ? new Date(subscription.next_billed_at) : null,
    cancelAtPeriodEnd: subscription.canceled_at ? true : false,
    updatedAt: new Date(),
  }).where(eq(userSubscriptions.paddleSubscriptionId, subscription.id));

  console.log(`Subscription updated in database: ${subscription.id}`);
}

async function handleSubscriptionCanceled(subscription: SubscriptionCreated) {
  console.log(`Subscription canceled: ${subscription.id}`);
  
  // Find subscription by Paddle subscription ID
  const existingSubscription = await db.query.userSubscriptions.findFirst({
    where: eq(userSubscriptions.paddleSubscriptionId, subscription.id),
  });

  if (!existingSubscription) {
    console.error(`Subscription not found for Paddle ID: ${subscription.id}`);
    return;
  }

  // Update subscription status to canceled
  await db.update(userSubscriptions).set({
    status: 'canceled',
    currentPeriodEnd: subscription.canceled_at ? new Date(subscription.canceled_at) : null,
    cancelAtPeriodEnd: true,
    updatedAt: new Date(),
  }).where(eq(userSubscriptions.paddleSubscriptionId, subscription.id));

  console.log(`Subscription canceled in database: ${subscription.id}`);
}

async function handleSubscriptionPaused(subscription: SubscriptionCreated) {
  console.log(`Subscription paused: ${subscription.id}`);
  
  // Find subscription by Paddle subscription ID
  const existingSubscription = await db.query.userSubscriptions.findFirst({
    where: eq(userSubscriptions.paddleSubscriptionId, subscription.id),
  });

  if (!existingSubscription) {
    console.error(`Subscription not found for Paddle ID: ${subscription.id}`);
    return;
  }

  // Update subscription status to paused
  await db.update(userSubscriptions).set({
    status: 'paused',
    updatedAt: new Date(),
  }).where(eq(userSubscriptions.paddleSubscriptionId, subscription.id));

  console.log(`Subscription paused in database: ${subscription.id}`);
}

async function handleSubscriptionResumed(subscription: SubscriptionCreated) {
  console.log(`Subscription resumed: ${subscription.id}`);
  
  // Find subscription by Paddle subscription ID
  const existingSubscription = await db.query.userSubscriptions.findFirst({
    where: eq(userSubscriptions.paddleSubscriptionId, subscription.id),
  });

  if (!existingSubscription) {
    console.error(`Subscription not found for Paddle ID: ${subscription.id}`);
    return;
  }

  // Update subscription status to active
  await db.update(userSubscriptions).set({
    status: 'active',
    cancelAtPeriodEnd: false,
    updatedAt: new Date(),
  }).where(eq(userSubscriptions.paddleSubscriptionId, subscription.id));

  console.log(`Subscription resumed in database: ${subscription.id}`);
}

async function handleTransactionCompleted(transaction: any) {
  console.log(`Transaction completed: ${transaction.id}`);
  // Handle successful payments, update billing history, etc.
}

export async function createTrialSubscription(clerkUserId: string, priceId: string) {
  console.log(`Creating trial subscription for user ${clerkUserId} with price ${priceId}`);
  
  // Check if user exists
  const user = await db.query.appUsers.findFirst({
    where: eq(appUsers.clerkUserId, clerkUserId),
  });

  if (!user) {
    throw new Error(`User not found for ID: ${clerkUserId}`);
  }

  // Check if subscription already exists
  const existingSubscription = await db.query.userSubscriptions.findFirst({
    where: eq(userSubscriptions.userId, clerkUserId),
  });

  if (existingSubscription) {
    console.log(`User ${clerkUserId} already has a subscription`);
    return {
      existing: true,
      subscription: existingSubscription,
    };
  }

  // Create trial subscription record (will be updated when Paddle webhook is received)
  const trialEndsAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000); // 14 days from now
  
  const newSubscription = await db.insert(userSubscriptions).values({
    userId: clerkUserId,
    paddlePlanId: priceId,
    status: 'trialing',
    currentPeriodStart: new Date(),
    currentPeriodEnd: trialEndsAt,
    cancelAtPeriodEnd: false,
  }).returning();

  console.log(`Trial subscription created for user ${clerkUserId}`);
  
  return {
    existing: false,
    subscription: newSubscription[0],
    trialDays: 14,
    trialEndsAt,
  };
}

// Helper functions for subscription management
export async function getUserSubscription(clerkUserId: string) {
  const subscription = await db.query.userSubscriptions.findFirst({
    where: eq(userSubscriptions.userId, clerkUserId),
    with: {
      user: true,
    },
  });

  return subscription;
}

export async function checkSubscriptionAccess(clerkUserId: string) {
  const subscription = await getUserSubscription(clerkUserId);
  
  if (!subscription) {
    return {
      hasAccess: false,
      plan: 'free',
      status: 'none',
      trialEndsAt: null,
      isTrialing: false,
    };
  }

  const now = new Date();
  const isTrialing = subscription.status === 'trialing' && 
    subscription.currentPeriodEnd && 
    subscription.currentPeriodEnd > now;

  const hasAccess = subscription.status === 'active' || 
    subscription.status === 'trialing' ||
    (subscription.status === 'canceled' && !subscription.cancelAtPeriodEnd);

  // Determine plan type based on paddlePlanId
  let planType = 'hosted';
  if (subscription.paddlePlanId === process.env.PADDLE_PRO_PRICE_ID) {
    planType = 'pro';
  } else if (subscription.paddlePlanId === process.env.PADDLE_ENTERPRISE_PRICE_ID) {
    planType = 'enterprise';
  }

  return {
    hasAccess,
    plan: planType,
    status: subscription.status,
    trialEndsAt: subscription.currentPeriodEnd,
    isTrialing,
    subscription,
  };
}

export async function cancelSubscription(clerkUserId: string) {
  const subscription = await getUserSubscription(clerkUserId);
  
  if (!subscription || !subscription.paddleSubscriptionId) {
    throw new Error('No active subscription found');
  }

  // Mark for cancellation at period end
  await db.update(userSubscriptions).set({
    cancelAtPeriodEnd: true,
    updatedAt: new Date(),
  }).where(eq(userSubscriptions.userId, clerkUserId));

  // Note: You should also call Paddle API to cancel the subscription
  // This is just updating the local database
  
  return { success: true };
}
