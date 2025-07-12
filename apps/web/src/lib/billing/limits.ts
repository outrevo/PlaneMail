import { db } from '@/lib/db';
import { pricingPlans, organizationSubscriptions, organizationUsage } from '@/db/schema';
import { eq } from 'drizzle-orm';

export interface PlanLimits {
  maxSubscribers: number;
  maxPostsPerMonth: number;
  maxCustomDomains: number;
  maxTeamMembers: number;
  maxIntegrations: number;
  maxApiKeys: number;
  maxWebhooks: number;
  maxImageUploads: number;
  maxEmailsPerMonth: number;
  allowOrganizations: boolean;
  allowAdvancedAnalytics: boolean;
  allowCustomDomains: boolean;
  allowApiAccess: boolean;
}

export interface CurrentUsage {
  currentSubscribers: number;
  currentPostsThisMonth: number;
  currentCustomDomains: number;
  currentTeamMembers: number;
  currentIntegrations: number;
  currentApiKeys: number;
  currentWebhooks: number;
  currentImageUploadsThisMonth: number;
  currentEmailsThisMonth: number;
}

export async function getOrganizationPlan(clerkOrgId: string): Promise<PlanLimits | null> {
  try {
    const subscription = await db
      .select()
      .from(organizationSubscriptions)
      .leftJoin(pricingPlans, eq(organizationSubscriptions.planId, pricingPlans.id))
      .where(eq(organizationSubscriptions.clerkOrgId, clerkOrgId))
      .limit(1);

    if (!subscription[0]?.pricing_plans) {
      return null;
    }

    const plan = subscription[0].pricing_plans;
    
    return {
      maxSubscribers: plan.maxSubscribers || 0,
      maxPostsPerMonth: plan.maxPostsPerMonth || 0,
      maxCustomDomains: plan.maxCustomDomains || 0,
      maxTeamMembers: plan.maxTeamMembers || 0,
      maxIntegrations: plan.maxIntegrations || 0,
      maxApiKeys: plan.maxApiKeys || 0,
      maxWebhooks: plan.maxWebhooks || 0,
      maxImageUploads: plan.maxImageUploads || 0,
      maxEmailsPerMonth: plan.maxEmailsPerMonth || 0,
      allowOrganizations: plan.allowOrganizations || false,
      allowAdvancedAnalytics: plan.allowAdvancedAnalytics || false,
      allowCustomDomains: plan.allowCustomDomains || false,
      allowApiAccess: plan.allowApiAccess || false,
    };
  } catch (error) {
    console.error('Error fetching organization plan:', error);
    return null;
  }
}

export async function getOrganizationUsage(clerkOrgId: string): Promise<CurrentUsage | null> {
  try {
    const usage = await db
      .select()
      .from(organizationUsage)
      .where(eq(organizationUsage.clerkOrgId, clerkOrgId))
      .limit(1);

    if (!usage[0]) {
      return null;
    }

    const current = usage[0];
    
    return {
      currentSubscribers: current.currentSubscribers || 0,
      currentPostsThisMonth: current.currentPostsThisMonth || 0,
      currentCustomDomains: current.currentCustomDomains || 0,
      currentTeamMembers: current.currentTeamMembers || 0,
      currentIntegrations: current.currentIntegrations || 0,
      currentApiKeys: current.currentApiKeys || 0,
      currentWebhooks: current.currentWebhooks || 0,
      currentImageUploadsThisMonth: current.currentImageUploadsThisMonth || 0,
      currentEmailsThisMonth: current.currentEmailsThisMonth || 0,
    };
  } catch (error) {
    console.error('Error fetching organization usage:', error);
    return null;
  }
}

export async function checkOrganizationLimit(
  clerkOrgId: string,
  limitType: keyof PlanLimits
): Promise<{ allowed: boolean; current: number; limit: number }> {
  const plan = await getOrganizationPlan(clerkOrgId);
  const usage = await getOrganizationUsage(clerkOrgId);

  if (!plan || !usage) {
    return { allowed: false, current: 0, limit: 0 };
  }

  const limit = plan[limitType];
  
  // Handle boolean limits (feature flags)
  if (typeof limit === 'boolean') {
    return { allowed: limit, current: 0, limit: limit ? 1 : 0 };
  }

  // Handle numeric limits
  const currentUsageMap: Record<string, keyof CurrentUsage> = {
    maxSubscribers: 'currentSubscribers',
    maxPostsPerMonth: 'currentPostsThisMonth',
    maxCustomDomains: 'currentCustomDomains',
    maxTeamMembers: 'currentTeamMembers',
    maxIntegrations: 'currentIntegrations',
    maxApiKeys: 'currentApiKeys',
    maxWebhooks: 'currentWebhooks',
    maxImageUploads: 'currentImageUploadsThisMonth',
    maxEmailsPerMonth: 'currentEmailsThisMonth',
  };

  const currentUsageKey = currentUsageMap[limitType as string];
  const current = currentUsageKey ? usage[currentUsageKey] : 0;

  // -1 means unlimited
  if (limit === -1) {
    return { allowed: true, current, limit: -1 };
  }

  return { allowed: current < limit, current, limit };
}

export async function canCreateOrganization(clerkOrgId: string): Promise<boolean> {
  const plan = await getOrganizationPlan(clerkOrgId);
  return plan?.allowOrganizations || false;
}

export async function canAddTeamMember(clerkOrgId: string): Promise<boolean> {
  const { allowed } = await checkOrganizationLimit(clerkOrgId, 'maxTeamMembers');
  return allowed;
}

export async function canCreatePost(clerkOrgId: string): Promise<boolean> {
  const { allowed } = await checkOrganizationLimit(clerkOrgId, 'maxPostsPerMonth');
  return allowed;
}

export async function canAddSubscriber(clerkOrgId: string): Promise<boolean> {
  const { allowed } = await checkOrganizationLimit(clerkOrgId, 'maxSubscribers');
  return allowed;
}

export async function canCreateCustomDomain(clerkOrgId: string): Promise<boolean> {
  const plan = await getOrganizationPlan(clerkOrgId);
  if (!plan?.allowCustomDomains) return false;
  
  const { allowed } = await checkOrganizationLimit(clerkOrgId, 'maxCustomDomains');
  return allowed;
}

export async function canUseApiAccess(clerkOrgId: string): Promise<boolean> {
  const plan = await getOrganizationPlan(clerkOrgId);
  return plan?.allowApiAccess || false;
}

export async function incrementUsage(
  clerkOrgId: string,
  usageType: keyof CurrentUsage,
  amount: number = 1
): Promise<void> {
  try {
    const updateData: Partial<CurrentUsage> = {
      [usageType]: amount,
    };

    await db
      .update(organizationUsage)
      .set(updateData)
      .where(eq(organizationUsage.clerkOrgId, clerkOrgId));
  } catch (error) {
    console.error(`Error incrementing ${usageType} usage:`, error);
  }
}

export async function createOrganizationUsageRecord(clerkOrgId: string): Promise<void> {
  try {
    const now = new Date();
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    await db.insert(organizationUsage).values({
      clerkOrgId,
      currentSubscribers: 0,
      currentPostsThisMonth: 0,
      currentCustomDomains: 0,
      currentTeamMembers: 1, // Creator is first team member
      currentIntegrations: 0,
      currentApiKeys: 0,
      currentWebhooks: 0,
      currentImageUploadsThisMonth: 0,
      currentEmailsThisMonth: 0,
      usagePeriodStart: now,
      usagePeriodEnd: endOfMonth,
    });
  } catch (error) {
    console.error('Error creating organization usage record:', error);
  }
}
