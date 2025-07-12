import { NextRequest, NextResponse } from 'next/server';
import { handlePaddleWebhook } from './actions';
import crypto from 'crypto';

// Paddle webhook signature verification
function verifyPaddleSignature(rawBody: string, signature: string, secret: string): boolean {
  try {
    // Paddle sends signatures in the format: ts=1234567890;h1=abc123...
    const parts = signature.split(';');
    const timestamp = parts.find(part => part.startsWith('ts='))?.replace('ts=', '');
    const hash = parts.find(part => part.startsWith('h1='))?.replace('h1=', '');
    
    if (!timestamp || !hash) {
      console.error('Invalid signature format');
      return false;
    }

    // Check if timestamp is within 5 minutes (300 seconds) to prevent replay attacks
    const currentTime = Math.floor(Date.now() / 1000);
    const webhookTime = parseInt(timestamp);
    if (Math.abs(currentTime - webhookTime) > 300) {
      console.error('Webhook timestamp too old');
      return false;
    }

    // Create the signed payload string as per Paddle docs
    const signedPayload = `${timestamp}:${rawBody}`;
    
    // Generate HMAC SHA256 signature
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(signedPayload, 'utf8')
      .digest('hex');

    // Compare signatures using timing-safe comparison
    if (hash.length !== expectedSignature.length) {
      return false;
    }
    
    return crypto.timingSafeEqual(
      Buffer.from(hash, 'hex'),
      Buffer.from(expectedSignature, 'hex')
    );
  } catch (error) {
    console.error('Error verifying Paddle signature:', error);
    return false;
  }
}

export async function POST(request: NextRequest) {
  try {
    const signature = request.headers.get('paddle-signature');
    
    if (!signature) {
      return NextResponse.json(
        { error: 'Missing Paddle signature' },
        { status: 400 }
      );
    }

    const rawBody = await request.text();
    
    // Verify webhook signature
    const webhookSecret = process.env.PADDLE_WEBHOOK_SECRET;
    if (!webhookSecret) {
      console.error('PADDLE_WEBHOOK_SECRET not configured');
      return NextResponse.json(
        { error: 'Webhook secret not configured' },
        { status: 500 }
      );
    }

    const isDevelopment = process.env.NODE_ENV === 'development';
    
    // In development, you can skip signature verification for testing
    // but it's recommended to test with real signatures
    if (!isDevelopment) {
      const isValidSignature = verifyPaddleSignature(rawBody, signature, webhookSecret);
      if (!isValidSignature) {
        console.error('Invalid Paddle webhook signature');
        return NextResponse.json(
          { error: 'Invalid signature' },
          { status: 400 }
        );
      }
    } else {
      console.log('Development mode: Skipping signature verification');
    }

    const event = JSON.parse(rawBody);
    console.log('Processing Paddle webhook event:', event.event_type);
    
    const result = await handlePaddleWebhook(event);
    
    if (!result.success) {
      console.error('Webhook processing failed:', result.message);
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
