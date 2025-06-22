
'use server';

import { db } from '@/lib/drizzle';
import { userSubscriptions, appUsers } from '@/db/schema';
import { auth } from '@clerk/nextjs/server';
import { eq } from 'drizzle-orm';
import { format } from 'date-fns';

export type SubscriptionStatus = {
  planName: string;
  status: string;
  currentPeriodEnd: string | null;
  renewsAt: string | null;
  manageBillingUrl?: string; // This would come from Paddle
  canUpgrade: boolean;
};

// Placeholder for Paddle Product IDs or your internal plan identifiers
const PADDLE_PLAN_IDS: Record<string, string> = {
  // These would be your actual plan identifiers used with Paddle
  // e.g., 'price_xxxxxxxxxxxxxx' or 'plan_launchpad'
  launchpad: 'LaunchPad Plan', // Display name
  ascent: 'Ascent Plan',
  zenith: 'Zenith Plan',
};

export async function getSubscriptionStatus(): Promise<SubscriptionStatus | null> {
  const { userId } = await auth();
  if (!userId) {
    return null; // Or throw new Error('Not authenticated');
  }

  try {
    const subscription = await db.query.userSubscriptions.findFirst({
      where: eq(userSubscriptions.userId, userId),
    });

    if (!subscription) {
      // User might be on a default free plan if no subscription record exists
      return {
        planName: 'LaunchPad (Free)',
        status: 'active',
        currentPeriodEnd: 'N/A - Free Plan',
        renewsAt: null,
        manageBillingUrl: process.env.NEXT_PUBLIC_PADDLE_CUSTOMER_PORTAL_URL || '#', // Fallback to #
        canUpgrade: true,
      };
    }

    const planDisplayName = PADDLE_PLAN_IDS[subscription.paddlePlanId || ''] || subscription.paddlePlanId || 'Unknown Plan';

    return {
      planName: planDisplayName,
      status: subscription.status,
      currentPeriodEnd: subscription.currentPeriodEnd ? format(new Date(subscription.currentPeriodEnd), 'PPP') : 'N/A',
      renewsAt: subscription.cancelAtPeriodEnd === false && subscription.currentPeriodEnd
        ? format(new Date(subscription.currentPeriodEnd), 'PPP')
        : null,
      manageBillingUrl: process.env.NEXT_PUBLIC_PADDLE_CUSTOMER_PORTAL_URL || '#', // Fallback
      canUpgrade: subscription.status !== 'active' || subscription.paddlePlanId !== 'zenith', // Example logic
    };
  } catch (error) {
    console.error('Failed to fetch subscription status:', error);
    // Return a default or error state if needed
    return {
        planName: 'Error Fetching Plan',
        status: 'error',
        currentPeriodEnd: null,
        renewsAt: null,
        manageBillingUrl: '#',
        canUpgrade: false,
      };
  }
}

// Placeholder for initiating a Paddle checkout session
// This would typically involve backend interaction with Paddle if not using Paddle.js directly with client-side token
export async function createPaddleCheckoutSession(planId: string) {
  const { userId } = await auth();
  if (!userId) {
    return { success: false, message: 'Not authenticated', checkoutUrl: null };
  }
  // This is where you would:
  // 1. Verify the planId.
  // 2. Interact with Paddle API to create a checkout session or generate a pay link.
  //    - For Paddle Billing, you'd typically create a transaction: https://developer.paddle.com/api-reference/transactions/create-transaction
  //    - For Paddle Classic, you might generate a pay link.
  // 3. Return the checkout URL or necessary details for Paddle.js.
  console.log(`User ${userId} attempting to checkout for plan ${planId}. (Paddle Integration Needed)`);
  
  // For now, return a placeholder or a link to the pricing page to select again
  // In a real scenario, you'd return a Paddle checkout URL.
  const paddleCheckoutBaseUrl = process.env.NEXT_PUBLIC_PADDLE_CHECKOUT_URL; // e.g., https://your-paddle-domain.paddle.com/checkout/custom/
  if (paddleCheckoutBaseUrl) {
    // Construct a dummy URL - replace with actual Paddle logic
    // This might be a pre-defined pay link from your Paddle dashboard for each plan
    const planPayLinks: Record<string, string> = {
        'ascent': process.env.PADDLE_ASCENT_PLAN_PAY_LINK || `${paddleCheckoutBaseUrl}ascent-plan-id`,
        'zenith': process.env.PADDLE_ZENITH_PLAN_PAY_LINK || `${paddleCheckoutBaseUrl}zenith-plan-id`,
    };
    const checkoutUrl = planPayLinks[planId] || '/pricing'; // Fallback to pricing if plan link not defined
    return { success: true, message: 'Redirecting to checkout...', checkoutUrl };
  }

  return { success: false, message: 'Paddle checkout not configured.', checkoutUrl: '/pricing' };
}
