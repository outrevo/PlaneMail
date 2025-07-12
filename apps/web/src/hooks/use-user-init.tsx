'use client';

import { useUser } from '@clerk/nextjs';
import { useEffect } from 'react';

async function ensureUserInDatabase(clerkUserId: string) {
  try {
    const response = await fetch('/api/user/init', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clerkUserId }),
    });
    
    if (!response.ok) {
      console.error('Failed to initialize user in database');
    }
  } catch (error) {
    console.error('Error initializing user:', error);
  }
}

export function useUserInit() {
  const { user, isLoaded } = useUser();

  useEffect(() => {
    if (isLoaded && user?.id) {
      // Ensure user exists in appUsers table
      ensureUserInDatabase(user.id);
    }
  }, [isLoaded, user?.id]);
}
