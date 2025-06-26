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
      className={`w-full font-medium transition-colors duration-200 ${
        plan.isPopular
          ? 'bg-black hover:bg-gray-900 text-white rounded-full'
          : 'border border-gray-200 hover:bg-gray-50 bg-white text-black rounded-full'
      }`}
      variant={plan.isPopular ? 'default' : 'outline'}
      onClick={handleCheckout}
      disabled={isLoading}
      style={{letterSpacing: '-0.01em'}}
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
