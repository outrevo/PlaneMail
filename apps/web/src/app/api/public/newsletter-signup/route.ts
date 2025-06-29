import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { subscribers, publicSiteSettings } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email || !email.trim()) {
      return NextResponse.json(
        { success: false, message: 'Email is required' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { success: false, message: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Get the site owner (first user with site settings)
    const siteOwner = await db
      .select({ userId: publicSiteSettings.userId })
      .from(publicSiteSettings)
      .limit(1);

    const userId = siteOwner.length > 0 ? siteOwner[0].userId : 'system';

    // Check if subscriber already exists for this user
    const existingSubscriber = await db
      .select()
      .from(subscribers)
      .where(eq(subscribers.email, email.toLowerCase().trim()))
      .limit(1);

    if (existingSubscriber.length > 0) {
      const subscriber = existingSubscriber[0];
      
      if (subscriber.status === 'active') {
        return NextResponse.json(
          { success: false, message: 'You are already subscribed' },
          { status: 400 }
        );
      } else {
        // Reactivate subscriber
        await db
          .update(subscribers)
          .set({
            status: 'active',
            dateAdded: new Date(),
            updatedAt: new Date(),
          })
          .where(eq(subscribers.id, subscriber.id));

        return NextResponse.json({
          success: true,
          message: 'Successfully resubscribed to newsletter',
        });
      }
    }

    // Create new subscriber
    await db.insert(subscribers).values({
      userId: userId,
      email: email.toLowerCase().trim(),
      status: 'active',
    });

    return NextResponse.json({
      success: true,
      message: 'Successfully subscribed to newsletter',
    });

  } catch (error) {
    console.error('Newsletter signup error:', error);
    return NextResponse.json(
      { success: false, message: 'An error occurred. Please try again.' },
      { status: 500 }
    );
  }
}
