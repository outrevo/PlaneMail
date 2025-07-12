import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/drizzle';
import { appUsers } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    const { clerkUserId } = await request.json();

    // Verify the authenticated user matches the requested user
    if (!userId || userId !== clerkUserId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if user already exists in appUsers table
    const existingUser = await db.query.appUsers.findFirst({
      where: eq(appUsers.clerkUserId, clerkUserId),
    });

    if (!existingUser) {
      // Create user in appUsers table
      console.log(`Creating user in appUsers table: ${clerkUserId}`);
      await db.insert(appUsers).values({
        clerkUserId: clerkUserId,
      });
      console.log(`Successfully created user: ${clerkUserId}`);
      
      return NextResponse.json({
        success: true,
        message: 'User created in database',
      });
    }

    return NextResponse.json({
      success: true,
      message: 'User already exists',
    });
  } catch (error) {
    console.error('Error initializing user:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
