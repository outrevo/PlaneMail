'use server';

import { getUserSubscription, checkSubscriptionAccess } from '@/app/api/paddle/webhook/actions';

export async function getUserSubscriptionStatus(clerkUserId: string) {
  try {
    const accessInfo = await checkSubscriptionAccess(clerkUserId);
    return { success: true, data: accessInfo };
  } catch (error) {
    console.error('Error checking subscription access:', error);
    return { success: false, error: 'Failed to check subscription status' };
  }
}

export async function getUserCurrentSubscription(clerkUserId: string) {
  try {
    const subscription = await getUserSubscription(clerkUserId);
    return { success: true, data: subscription };
  } catch (error) {
    console.error('Error getting user subscription:', error);
    return { success: false, error: 'Failed to get subscription' };
  }
}
