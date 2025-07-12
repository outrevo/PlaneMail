'use server';

import { getUserBillingStatus } from '@/lib/user-billing';
import { format } from 'date-fns';

export type SubscriptionStatus = {
  planName: string;
  status: string;
  currentPeriodEnd: string | null;
  renewsAt: string | null;
  manageBillingUrl?: string;
  canUpgrade: boolean;
  canCreateOrganizations: boolean;
};

export async function getSubscriptionStatus(): Promise<SubscriptionStatus | null> {
  try {
    const billingStatus = await getUserBillingStatus();
    
    if (billingStatus.error) {
      return null;
    }
    
    // Handle free tier users
    if (billingStatus.isFreeTier || !billingStatus.subscription || !billingStatus.plan) {
      return {
        planName: 'Personal (Free)',
        status: 'active',
        currentPeriodEnd: 'N/A - Free Plan',
        renewsAt: null,
        manageBillingUrl: process.env.NEXT_PUBLIC_PADDLE_CUSTOMER_PORTAL_URL || '#',
        canUpgrade: true,
        canCreateOrganizations: false,
      };
    }
    
    // Handle users with subscriptions
    const subscription = billingStatus.subscription;
    const plan = billingStatus.plan;
    
    // Consider both active and trialing as valid for organization creation
    const hasValidSubscription = subscription.status === 'active' || subscription.status === 'trialing';
    const canCreateOrganizations = hasValidSubscription && (plan.allowOrganizations ?? false);
    
    // Format dates properly
    const formatDate = (date: Date | null) => {
      return date ? format(date, 'MMM dd, yyyy') : null;
    };
    
    return {
      planName: plan.name,
      status: subscription.status,
      currentPeriodEnd: formatDate(subscription.currentPeriodEnd),
      renewsAt: formatDate(subscription.currentPeriodEnd),
      manageBillingUrl: process.env.NEXT_PUBLIC_PADDLE_CUSTOMER_PORTAL_URL || '#',
      canUpgrade: true, // Users can always upgrade to a higher plan
      canCreateOrganizations,
    };
    
  } catch (error) {
    console.error('Failed to fetch subscription status:', error);
    return {
      planName: 'Error Fetching Plan',
      status: 'error',
      currentPeriodEnd: null,
      renewsAt: null,
      manageBillingUrl: '#',
      canUpgrade: false,
      canCreateOrganizations: false,
    };
  }
}
