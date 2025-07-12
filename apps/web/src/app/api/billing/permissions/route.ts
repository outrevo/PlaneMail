import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { canCreateOrganization } from '@/lib/billing/limits';
import { db } from '@/lib/db';
import { organizationSubscriptions, pricingPlans } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const { userId, orgId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const simulateProPlan = searchParams.get('simulatePro') === 'true';

    // For personal accounts, we need to check if they have a paid personal plan
    if (!orgId) {
      // For development/testing purposes, allow simulation of Pro plan
      if (simulateProPlan) {
        return NextResponse.json({
          canCreateOrganization: true,
          reason: null
        });
      }

      // TODO: In a real implementation, you would check if the user has a personal Pro subscription
      // For now, we'll return false to encourage upgrading to organizational plans
      return NextResponse.json({
        canCreateOrganization: false,
        reason: 'Organizations require a Pro plan or higher. Upgrade to create and manage organizations.'
      });
    }

    // For existing organizations, check if they can create more organizations
    try {
      const canCreate = await canCreateOrganization(orgId);
      
      return NextResponse.json({
        canCreateOrganization: canCreate,
        reason: canCreate ? null : 'Organization creation not allowed on current plan'
      });
    } catch (error) {
      // If organization doesn't exist in our billing system, assume they can't create organizations
      return NextResponse.json({
        canCreateOrganization: false,
        reason: 'Organization billing not set up. Please contact support.'
      });
    }
  } catch (error) {
    console.error('Error checking permissions:', error);
    return NextResponse.json(
      { error: 'Failed to check permissions' },
      { status: 500 }
    );
  }
}
