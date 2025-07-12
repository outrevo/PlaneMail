import { db } from '@/lib/drizzle';
import { userSubscriptions, pricingPlans } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { auth, clerkClient } from '@clerk/nextjs/server';

export async function getUserBillingStatus() {
  const { userId } = await auth();
  
  if (!userId) {
    return { 
      subscription: null, 
      plan: null, 
      canCreateOrganizations: false,
      hasActiveSubscription: false,
      error: 'Not authenticated' 
    };
  }

  try {
    // Get user subscription with plan details
    const subscription = await db.query.userSubscriptions.findFirst({
      where: eq(userSubscriptions.userId, userId),
    });

    let plan = null;
    
    if (subscription?.paddlePlanId) {
      // Get plan details from pricing_plans table using paddlePlanId
      plan = await db.query.pricingPlans.findFirst({
        where: eq(pricingPlans.paddlePriceId, subscription.paddlePlanId),
      });
    }

    // If no subscription or plan found, user is on free tier
    if (!subscription || !plan) {
      return {
        subscription: null,
        plan: null,
        canCreateOrganizations: false,
        hasActiveSubscription: false,
        isFreeTier: true,
      };
    }

    // Consider both active and trialing subscriptions as valid
    const hasActiveSubscription = subscription.status === 'active' || subscription.status === 'trialing';
    const canCreateOrganizations = hasActiveSubscription && (plan.allowOrganizations ?? false);

    return {
      subscription,
      plan,
      canCreateOrganizations,
      hasActiveSubscription,
      isFreeTier: false,
    };
  } catch (error) {
    console.error('Error fetching user billing status:', error);
    return {
      subscription: null,
      plan: null,
      canCreateOrganizations: false,
      hasActiveSubscription: false,
      error: 'Failed to fetch billing status',
    };
  }
}

export async function canUserCreateOrganization() {
  const billing = await getUserBillingStatus();
  
  if (!billing.canCreateOrganizations) {
    return {
      allowed: false,
      reason: billing.isFreeTier 
        ? 'Organizations are only available on paid plans. Please upgrade to create an organization.'
        : 'Your current plan does not include organization features. Please upgrade to create an organization.',
      needsUpgrade: true,
    };
  }

  // Check organization limits for the user's plan
  try {
    const { userId } = await auth();
    if (!userId) {
      return {
        allowed: false,
        reason: 'Authentication required',
        needsUpgrade: false,
      };
    }

    // Get user's current organizations from Clerk
    const clerk = await clerkClient();
    const userOrganizations = await clerk.users.getOrganizationMembershipList({
      userId: userId,
    });

    const currentOrgCount = userOrganizations.data.length;
    
    // Get plan limits (most plans allow 1 organization)
    const maxOrgs = billing.plan?.maxTeamMembers === -1 ? -1 : 1; // -1 means unlimited
    
    if (maxOrgs !== -1 && currentOrgCount >= maxOrgs) {
      return {
        allowed: false,
        reason: `Your ${billing.plan?.name} plan allows ${maxOrgs} organization${maxOrgs === 1 ? '' : 's'}. You currently have ${currentOrgCount}. Upgrade to create more organizations.`,
        needsUpgrade: true,
      };
    }

    return {
      allowed: true,
      reason: null,
      needsUpgrade: false,
    };
    
  } catch (error) {
    console.error('Error checking organization limits:', error);
    return {
      allowed: false,
      reason: 'Unable to verify organization limits',
      needsUpgrade: false,
    };
  }
}

export async function getUserPlanLimits() {
  const billing = await getUserBillingStatus();
  
  if (!billing.plan) {
    // Free tier limits
    return {
      maxSubscribers: 100,
      maxPostsPerMonth: 4,
      maxCustomDomains: 0,
      maxTeamMembers: 1,
      maxIntegrations: 0,
      allowOrganizations: false,
      allowApiAccess: false,
      allowCustomDomains: false,
      planName: 'Free',
    };
  }

  return {
    maxSubscribers: billing.plan.maxSubscribers || 0,
    maxPostsPerMonth: billing.plan.maxPostsPerMonth || 0,
    maxCustomDomains: billing.plan.maxCustomDomains || 0,
    maxTeamMembers: billing.plan.maxTeamMembers || 1,
    maxIntegrations: billing.plan.maxIntegrations || 0,
    allowOrganizations: billing.plan.allowOrganizations || false,
    allowApiAccess: billing.plan.allowApiAccess || false,
    allowCustomDomains: billing.plan.allowCustomDomains || false,
    planName: billing.plan.name,
  };
}
