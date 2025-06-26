import { initializePaddle, Paddle } from '@paddle/paddle-js';

let paddleInstance: Paddle | undefined = undefined;

export async function initPaddle() {
  if (paddleInstance) {
    return paddleInstance;
  }

  try {
    const environment = process.env.NODE_ENV === 'production' ? 'production' : 'sandbox';
    const paddleClientToken = process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN;
    
    if (!paddleClientToken) {
      throw new Error('NEXT_PUBLIC_PADDLE_CLIENT_TOKEN is not set');
    }

    paddleInstance = await initializePaddle({
      environment,
      token: paddleClientToken,
    });

    return paddleInstance;
  } catch (error) {
    console.error('Failed to initialize Paddle:', error);
    throw error;
  }
}

export interface CheckoutOptions {
  priceId: string;
  customData?: Record<string, any>;
  customer?: {
    email: string;
    name: string;
  };
  discountCode?: string;
  allowLogout?: boolean;
}

export async function openPaddleCheckout(options: CheckoutOptions) {
  const paddle = await initPaddle();

    if (!options.priceId) {
        throw new Error('Price ID is required to open Paddle checkout');
    }

    if (!paddle) {
        throw new Error('Paddle is not initialized. Please ensure Paddle is set up correctly.');
    }
  
  return paddle.Checkout.open({
    items: [
      {
        priceId: options.priceId,
        quantity: 1,
      },
    ],
    customer: options.customer,
    customData: options.customData,
    discountCode: options.discountCode,
    settings: {
      allowLogout: options.allowLogout ?? true,
      successUrl: `${window.location.origin}/dashboard?success=true`,
      frameTarget: 'self',
      frameInitialHeight: 450,
      frameStyle: 'width: 100%; min-width: 312px; background-color: transparent; border: none;',
      // Configure for trial mode - no payment method required during trial
      displayMode: 'overlay',
      variant: 'one-page',
      locale: 'en',
      showAddDiscounts: true,
      showAddTaxId: false,
    },
  });
}

export interface SubscriptionPreview {
  priceId: string;
  quantity?: number;
  discountId?: string;
}

export async function getSubscriptionPreview(options: SubscriptionPreview) {
  const paddle = await initPaddle();

    if (!options.priceId) {
        throw new Error('Price ID is required to get subscription preview');
    }
    if (!paddle) {
        throw new Error('Paddle is not initialized. Please ensure Paddle is set up correctly.');
    }
  
  return paddle.PricePreview({
    items: [
      {
        priceId: options.priceId,
        quantity: options.quantity ?? 1,
      },
    ],
    discountId: options.discountId,
  });
}

// Price IDs for different plans (these should be set from your Paddle dashboard)
export const PADDLE_PRICE_IDS = {
  hosted: process.env.NEXT_PUBLIC_PADDLE_HOSTED_PRICE_ID || '',
  pro: process.env.NEXT_PUBLIC_PADDLE_PRO_PRICE_ID || '',
  enterprise: process.env.NEXT_PUBLIC_PADDLE_ENTERPRISE_PRICE_ID || '',
} as const;
