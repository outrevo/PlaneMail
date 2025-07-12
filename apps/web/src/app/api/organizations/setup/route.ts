import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { checkOrganizationAccess } from '@/lib/billing/middleware';
import { createOrganizationUsageRecord } from '@/lib/billing/limits';

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse request body
    const body = await request.json();
    const { organizationId } = body;

    if (!organizationId) {
      return NextResponse.json(
        { error: 'Organization ID is required' },
        { status: 400 }
      );
    }

    // This would be called after Clerk creates the organization
    // Check if the user's current plan allows organizations
    const tempRequest = new NextRequest(request.url, {
      method: 'POST',
      headers: request.headers,
    });

    // Note: This check would need to be done before organization creation
    // For now, we'll create the usage record for the new organization
    await createOrganizationUsageRecord(organizationId);

    return NextResponse.json({
      success: true,
      message: 'Organization billing setup completed'
    });

  } catch (error) {
    console.error('Error setting up organization billing:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Example endpoint to check if user can create organizations
export async function GET(request: NextRequest) {
  try {
    const { userId, orgId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // If user is already in an organization context, they can create more orgs
    if (orgId) {
      return NextResponse.json({ canCreate: true });
    }

    // For personal accounts, they need to upgrade to Pro
    // In a real implementation, you'd check their current subscription
    return NextResponse.json({ 
      canCreate: false,
      reason: 'Organizations require a Pro plan. Please upgrade to create organizations.',
      upgradeUrl: '/billing?upgrade=organization'
    });

  } catch (error) {
    console.error('Error checking organization creation permission:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
