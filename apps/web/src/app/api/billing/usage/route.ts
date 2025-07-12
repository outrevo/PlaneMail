import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getOrganizationPlan, getOrganizationUsage } from '@/lib/billing/limits';

export async function GET(request: NextRequest) {
  try {
    const { userId, orgId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // For personal accounts (no organization)
    if (!orgId) {
      return NextResponse.json({
        plan: {
          name: 'Personal',
          allowOrganizations: false,
          allowAdvancedAnalytics: false,
          allowCustomDomains: false,
          allowApiAccess: false,
        },
        limits: {
          maxSubscribers: 1000,
          maxPostsPerMonth: 10,
          maxCustomDomains: 0,
          maxTeamMembers: 1,
          maxIntegrations: 1,
          maxApiKeys: 2,
          maxWebhooks: 2,
          maxImageUploads: 50,
          maxEmailsPerMonth: 10000,
        },
        usage: {
          currentSubscribers: 0, // TODO: Fetch from user's personal account
          currentPostsThisMonth: 0,
          currentCustomDomains: 0,
          currentTeamMembers: 1,
          currentIntegrations: 0,
          currentApiKeys: 0,
          currentWebhooks: 0,
          currentImageUploadsThisMonth: 0,
          currentEmailsThisMonth: 0,
        }
      });
    }

    // For organizations
    const [plan, usage] = await Promise.all([
      getOrganizationPlan(orgId),
      getOrganizationUsage(orgId)
    ]);

    if (!plan || !usage) {
      // If no plan/usage found, return default Pro plan data
      return NextResponse.json({
        plan: {
          name: 'Pro',
          allowOrganizations: true,
          allowAdvancedAnalytics: true,
          allowCustomDomains: true,
          allowApiAccess: true,
        },
        limits: {
          maxSubscribers: 10000,
          maxPostsPerMonth: 100,
          maxCustomDomains: 3,
          maxTeamMembers: 5,
          maxIntegrations: 5,
          maxApiKeys: 10,
          maxWebhooks: 10,
          maxImageUploads: 500,
          maxEmailsPerMonth: 100000,
        },
        usage: {
          currentSubscribers: 0,
          currentPostsThisMonth: 0,
          currentCustomDomains: 0,
          currentTeamMembers: 1,
          currentIntegrations: 0,
          currentApiKeys: 0,
          currentWebhooks: 0,
          currentImageUploadsThisMonth: 0,
          currentEmailsThisMonth: 0,
        }
      });
    }

    // Determine plan name based on limits
    let planName = 'Pro';
    if (plan.maxSubscribers === 1000 && !plan.allowOrganizations) {
      planName = 'Personal';
    } else if (plan.maxSubscribers === -1) {
      planName = 'Business';
    }

    return NextResponse.json({
      plan: {
        name: planName,
        allowOrganizations: plan.allowOrganizations,
        allowAdvancedAnalytics: plan.allowAdvancedAnalytics,
        allowCustomDomains: plan.allowCustomDomains,
        allowApiAccess: plan.allowApiAccess,
      },
      limits: {
        maxSubscribers: plan.maxSubscribers,
        maxPostsPerMonth: plan.maxPostsPerMonth,
        maxCustomDomains: plan.maxCustomDomains,
        maxTeamMembers: plan.maxTeamMembers,
        maxIntegrations: plan.maxIntegrations,
        maxApiKeys: plan.maxApiKeys,
        maxWebhooks: plan.maxWebhooks,
        maxImageUploads: plan.maxImageUploads,
        maxEmailsPerMonth: plan.maxEmailsPerMonth,
      },
      usage: {
        currentSubscribers: usage.currentSubscribers,
        currentPostsThisMonth: usage.currentPostsThisMonth,
        currentCustomDomains: usage.currentCustomDomains,
        currentTeamMembers: usage.currentTeamMembers,
        currentIntegrations: usage.currentIntegrations,
        currentApiKeys: usage.currentApiKeys,
        currentWebhooks: usage.currentWebhooks,
        currentImageUploadsThisMonth: usage.currentImageUploadsThisMonth,
        currentEmailsThisMonth: usage.currentEmailsThisMonth,
      }
    });

  } catch (error) {
    console.error('Error fetching usage data:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
