'use client';

import { useUser } from '@clerk/nextjs';
import { useEffect, useState } from 'react';
import { getUserSubscriptionStatus } from '@/app/actions/subscription';

interface SubscriptionStatus {
  hasAccess: boolean;
  plan: string;
  status: string;
  trialEndsAt: Date | null;
  isTrialing: boolean | null;
  subscription?: any;
}

export function useSubscription() {
  const { user } = useUser();
  const [subscriptionStatus, setSubscriptionStatus] = useState<SubscriptionStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchSubscriptionStatus() {
      if (!user?.id) {
        setIsLoading(false);
        return;
      }

      try {
        const result = await getUserSubscriptionStatus(user.id);
        
        if (result.success && result.data) {
          setSubscriptionStatus(result.data);
          setError(null);
        } else {
          setError(result.error || 'Failed to load subscription');
        }
      } catch (err) {
        setError('Failed to load subscription');
        console.error('Subscription fetch error:', err);
      } finally {
        setIsLoading(false);
      }
    }

    fetchSubscriptionStatus();
  }, [user?.id]);

  const refetch = async () => {
    if (!user?.id) return;
    
    setIsLoading(true);
    try {
      const result = await getUserSubscriptionStatus(user.id);
      if (result.success && result.data) {
        setSubscriptionStatus(result.data);
        setError(null);
      } else {
        setError(result.error || 'Failed to load subscription');
      }
    } catch (err) {
      setError('Failed to load subscription');
    } finally {
      setIsLoading(false);
    }
  };

  return {
    subscriptionStatus,
    isLoading,
    error,
    refetch,
    // Convenience properties
    hasAccess: subscriptionStatus?.hasAccess || false,
    plan: subscriptionStatus?.plan || 'free',
    isTrialing: subscriptionStatus?.isTrialing || false,
    trialEndsAt: subscriptionStatus?.trialEndsAt,
  };
}
