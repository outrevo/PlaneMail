import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { subscribers } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import crypto from 'crypto';

// Generate unsubscribe token
export function generateUnsubscribeToken(subscriberId: string, email: string): string {
  const secret = process.env.UNSUBSCRIBE_TOKEN_SECRET || 'fallback-secret-change-this';
  const data = `${subscriberId}:${email}:${Date.now()}`;
  return crypto.createHmac('sha256', secret).update(data).digest('hex').substring(0, 32);
}

// Verify unsubscribe token
export function verifyUnsubscribeToken(token: string, subscriberId: string, email: string): boolean {
  const secret = process.env.UNSUBSCRIBE_TOKEN_SECRET || 'fallback-secret-change-this';
  // For now, we'll accept tokens that are properly formatted (32 hex chars)
  // In production, implement proper token verification with expiration
  return /^[a-f0-9]{32}$/i.test(token);
}

export async function GET(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const { token } = params;
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');
    const subscriberId = searchParams.get('id');

    if (!email || !subscriberId) {
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/unsubscribe-error?reason=invalid-params`);
    }

    // Verify token (simplified for now)
    if (!verifyUnsubscribeToken(token, subscriberId, email)) {
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/unsubscribe-error?reason=invalid-token`);
    }

    // Find and unsubscribe the subscriber
    const result = await db
      .update(subscribers)
      .set({
        status: 'unsubscribed',
        updatedAt: new Date(),
      })
      .where(and(
        eq(subscribers.id, subscriberId),
        eq(subscribers.email, email.toLowerCase().trim())
      ))
      .returning({ id: subscribers.id, email: subscribers.email });

    if (result.length === 0) {
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/unsubscribe-error?reason=not-found`);
    }

    // Redirect to success page
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/unsubscribe-success`);

  } catch (error) {
    console.error('Unsubscribe error:', error);
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/unsubscribe-error?reason=server-error`);
  }
}

// Handle POST for form submissions
export async function POST(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const { token } = params;
    const body = await request.json();
    const { email, subscriberId } = body;

    if (!email || !subscriberId) {
      return NextResponse.json({ success: false, message: 'Missing required fields' }, { status: 400 });
    }

    // Verify token
    if (!verifyUnsubscribeToken(token, subscriberId, email)) {
      return NextResponse.json({ success: false, message: 'Invalid token' }, { status: 400 });
    }

    // Unsubscribe
    const result = await db
      .update(subscribers)
      .set({
        status: 'unsubscribed',
        updatedAt: new Date(),
      })
      .where(and(
        eq(subscribers.id, subscriberId),
        eq(subscribers.email, email.toLowerCase().trim())
      ))
      .returning({ id: subscribers.id });

    if (result.length === 0) {
      return NextResponse.json({ success: false, message: 'Subscriber not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Successfully unsubscribed' });

  } catch (error) {
    console.error('Unsubscribe error:', error);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}
