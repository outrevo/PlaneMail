'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowRight, Sparkles } from 'lucide-react';
import { openPaddleCheckout, PADDLE_PRICE_IDS } from '@/lib/paddle';
import { useUser } from '@clerk/nextjs';

interface PricingButtonProps {
  plan: {
    name: string;
    price: string;
    frequency: string;
    description: string;
    cta: string;
    priceId: string;
    isPopular: boolean;
    hasTrial: boolean;
  };
}

export function PricingButton({ plan }: PricingButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useUser();

  const handleCheckout = async () => {
    if (plan.priceId === 'enterprise') {
      // Handle enterprise contact
      window.location.href = 'mailto:hello@planemail.com';
      return;
    }

    // Check if user is signed in
    if (!user) {
      // Redirect to sign-up with the plan information
      window.location.href = `/sign-up?plan=${plan.priceId}&trial=14`;
      return;
    }

    if (!PADDLE_PRICE_IDS[plan.priceId as keyof typeof PADDLE_PRICE_IDS]) {
      console.error(`Price ID not found for plan: ${plan.priceId}`);
      alert('This plan is not available yet. Please try again later.');
      return;
    }

    setIsLoading(true);
    
    try {
      await openPaddleCheckout({
        priceId: PADDLE_PRICE_IDS[plan.priceId as keyof typeof PADDLE_PRICE_IDS],
        customer: {
          email: user?.emailAddresses[0]?.emailAddress,
          name: user?.fullName || user?.firstName || 'User',
        },
        customData: {
          user_email: user?.emailAddresses[0]?.emailAddress,
          user_id: user?.id,
          plan_name: plan.name,
          has_trial: plan.hasTrial,
        },
      });
    } catch (error) {
      console.error('Checkout error:', error);
      alert('Failed to open checkout. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      className={`w-full ${
        plan.isPopular
          ? 'bg-black hover:bg-black/90 text-white'
          : 'border border-black/20 hover:border-black/40 bg-white text-black'
      }`}
      variant={plan.isPopular ? 'default' : 'outline'}
      onClick={handleCheckout}
      disabled={isLoading}
    >
      <div className="flex items-center justify-center">
        {plan.hasTrial && (
          <Sparkles className="mr-2 h-4 w-4" />
        )}
        <span>{isLoading ? 'Loading...' : plan.cta}</span>
        <ArrowRight className="ml-2 h-4 w-4" />
      </div>
    </Button>
  );
}
