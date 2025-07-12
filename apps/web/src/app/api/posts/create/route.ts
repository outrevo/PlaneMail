import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { 
  checkOrganizationAccess, 
  checkPostCreationLimit, 
  trackPostCreation 
} from '@/lib/billing/middleware';
import { db } from '@/lib/db';
import { posts } from '@/db/schema';

export async function POST(request: NextRequest) {
  try {
    const { userId, orgId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if organizations are allowed (for organization posts)
    if (orgId) {
      const orgCheck = await checkOrganizationAccess(request);
      if (orgCheck) return orgCheck;
    }

    // Check post creation limits
    const limitCheck = await checkPostCreationLimit(request);
    if (limitCheck) return limitCheck;

    // Parse request body
    const body = await request.json();
    const { title, content, slug, status = 'draft' } = body;

    if (!title || !slug) {
      return NextResponse.json(
        { error: 'Title and slug are required' },
        { status: 400 }
      );
    }

    // Create the post
    const newPost = await db.insert(posts).values({
      userId,
      clerkOrgId: orgId || null, // Set organization ID if in org context
      title,
      content: content || '',
      slug,
      status,
    }).returning();

    // Track usage (increment post count)
    if (orgId) {
      await trackPostCreation(orgId);
    }

    return NextResponse.json({
      success: true,
      post: newPost[0]
    });

  } catch (error) {
    console.error('Error creating post:', error);
    
    // Handle unique constraint violations (duplicate slug)
    if (error instanceof Error && error.message.includes('duplicate key')) {
      return NextResponse.json(
        { error: 'A post with this slug already exists' },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
