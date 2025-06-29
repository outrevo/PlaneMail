import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { posts } from '@/lib/db/schema';
import { eq, sql } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  try {
    const { postId } = await request.json();

    if (!postId) {
      return NextResponse.json(
        { success: false, message: 'Post ID is required' },
        { status: 400 }
      );
    }

    // Increment web views count
    await db
      .update(posts)
      .set({
        webViews: sql`${posts.webViews} + 1`,
        updatedAt: new Date(),
      })
      .where(eq(posts.id, postId));

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Post view tracking error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to track view' },
      { status: 500 }
    );
  }
}
