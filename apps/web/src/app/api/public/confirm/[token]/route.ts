import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { subscribers } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { verifyConfirmationToken } from '@planemail/shared';

// Temporary declaration to avoid type error if shared types not rebuilt
// (runtime export exists after shared build)
// @ts-ignore
declare module '@planemail/shared' {
  export function verifyConfirmationToken(token: string, subscriberId: string, email: string, maxAge?: number): boolean;
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
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/confirm-error?reason=invalid-params`);
    }

    // Verify token
    if (!verifyConfirmationToken(token, subscriberId, email)) {
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/confirm-error?reason=invalid-token`);
    }

    // Find and confirm the subscriber (only if still pending)
    const result = await db
      .update(subscribers)
      .set({
        status: 'active',
        confirmedAt: new Date(), // set confirmation timestamp
        updatedAt: new Date(),
      })
      .where(and(
        eq(subscribers.id, subscriberId),
        eq(subscribers.email, email.toLowerCase().trim()),
        eq(subscribers.status, 'pending')
      ))
      .returning({ id: subscribers.id, email: subscribers.email });

    if (result.length === 0) {
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/confirm-error?reason=not-found`);
    }

    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/confirm-success`);

  } catch (error) {
    console.error('Confirmation error:', error);
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/confirm-error?reason=server-error`);
  }
}
