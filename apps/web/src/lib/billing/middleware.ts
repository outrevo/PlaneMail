import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { 
  canCreateOrganization, 
  canAddTeamMember, 
  canCreatePost, 
  canAddSubscriber,
  canCreateCustomDomain,
  canUseApiAccess,
  incrementUsage
} from '@/lib/billing/limits';

export async function checkOrganizationAccess(request: NextRequest) {
  const { userId, orgId } = await auth();
  
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Personal account access (no organization)
  if (!orgId) {
    return null; // Allow personal account actions
  }

  // Check if organization features are allowed
  const canUseOrgs = await canCreateOrganization(orgId);
  if (!canUseOrgs) {
    return NextResponse.json({ 
      error: 'Organization features require a paid plan. Please upgrade your subscription.',
      code: 'UPGRADE_REQUIRED'
    }, { status: 403 });
  }

  return null;
}

export async function checkPostCreationLimit(request: NextRequest) {
  const { userId, orgId } = await auth();
  
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // For organization posts
  if (orgId) {
    const canCreate = await canCreatePost(orgId);
    if (!canCreate) {
      return NextResponse.json({ 
        error: 'Post creation limit reached. Please upgrade your plan or wait for next month.',
        code: 'LIMIT_REACHED'
      }, { status: 403 });
    }
  }

  return null;
}

export async function checkSubscriberLimit(request: NextRequest) {
  const { userId, orgId } = await auth();
  
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // For organization subscribers
  if (orgId) {
    const canAdd = await canAddSubscriber(orgId);
    if (!canAdd) {
      return NextResponse.json({ 
        error: 'Subscriber limit reached. Please upgrade your plan.',
        code: 'LIMIT_REACHED'
      }, { status: 403 });
    }
  }

  return null;
}

export async function checkCustomDomainLimit(request: NextRequest) {
  const { userId, orgId } = await auth();
  
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // For organization custom domains
  if (orgId) {
    const canCreate = await canCreateCustomDomain(orgId);
    if (!canCreate) {
      return NextResponse.json({ 
        error: 'Custom domains require a paid plan or you have reached your limit.',
        code: 'UPGRADE_REQUIRED'
      }, { status: 403 });
    }
  }

  return null;
}

export async function checkApiAccess(request: NextRequest) {
  const { userId, orgId } = await auth();
  
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // For organization API access
  if (orgId) {
    const canUse = await canUseApiAccess(orgId);
    if (!canUse) {
      return NextResponse.json({ 
        error: 'API access requires a paid plan. Please upgrade your subscription.',
        code: 'UPGRADE_REQUIRED'
      }, { status: 403 });
    }
  }

  return null;
}

export async function checkTeamMemberLimit(request: NextRequest) {
  const { userId, orgId } = await auth();
  
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // For organization team members
  if (orgId) {
    const canAdd = await canAddTeamMember(orgId);
    if (!canAdd) {
      return NextResponse.json({ 
        error: 'Team member limit reached. Please upgrade your plan.',
        code: 'LIMIT_REACHED'
      }, { status: 403 });
    }
  }

  return null;
}

// Usage tracking functions
export async function trackPostCreation(orgId: string) {
  if (orgId) {
    await incrementUsage(orgId, 'currentPostsThisMonth', 1);
  }
}

export async function trackSubscriberAddition(orgId: string) {
  if (orgId) {
    await incrementUsage(orgId, 'currentSubscribers', 1);
  }
}

export async function trackEmailSent(orgId: string, count: number = 1) {
  if (orgId) {
    await incrementUsage(orgId, 'currentEmailsThisMonth', count);
  }
}

export async function trackImageUpload(orgId: string) {
  if (orgId) {
    await incrementUsage(orgId, 'currentImageUploadsThisMonth', 1);
  }
}

export async function trackCustomDomainCreation(orgId: string) {
  if (orgId) {
    await incrementUsage(orgId, 'currentCustomDomains', 1);
  }
}

export async function trackIntegrationCreation(orgId: string) {
  if (orgId) {
    await incrementUsage(orgId, 'currentIntegrations', 1);
  }
}

export async function trackApiKeyCreation(orgId: string) {
  if (orgId) {
    await incrementUsage(orgId, 'currentApiKeys', 1);
  }
}

export async function trackWebhookCreation(orgId: string) {
  if (orgId) {
    await incrementUsage(orgId, 'currentWebhooks', 1);
  }
}
