import { NextRequest, NextResponse } from 'next/server';
import { handlePaddleWebhook } from './actions';

export async function POST(request: NextRequest) {
  try {
    const signature = request.headers.get('paddle-signature');
    
    if (!signature) {
      return NextResponse.json(
        { error: 'Missing Paddle signature' },
        { status: 400 }
      );
    }

    const body = await request.text();
    
    // Verify webhook signature (optional but recommended)
    // You can implement signature verification here using your webhook secret
    // const isValid = await verifyPaddleSignature(body, signature);
    // if (!isValid) {
    //   return NextResponse.json(
    //     { error: 'Invalid signature' },
    //     { status: 400 }
    //   );
    // }

    const event = JSON.parse(body);
    
    const result = await handlePaddleWebhook(event);
    
    if (!result.success) {
      return NextResponse.json(
        { error: result.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error processing Paddle webhook:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Disable body parsing to get raw body for signature verification
export const dynamic = 'force-dynamic';
