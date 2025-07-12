"use client";

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { CheckCircle, X } from 'lucide-react';

export function NewOrgNotification() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [showNotification, setShowNotification] = useState(false);

  useEffect(() => {
    if (searchParams.get('newOrg') === 'true') {
      setShowNotification(true);
      // Remove the parameter from URL without triggering a reload
      const url = new URL(window.location.href);
      url.searchParams.delete('newOrg');
      window.history.replaceState({}, '', url.pathname + url.search);
    }
  }, [searchParams]);

  const handleDismiss = () => {
    setShowNotification(false);
  };

  const handleViewBilling = () => {
    router.push('/billing');
    setShowNotification(false);
  };

  if (!showNotification) return null;

  return (
    <Alert className="border-green-200 bg-green-50 text-green-800 mb-6">
      <CheckCircle className="h-4 w-4" />
      <AlertDescription className="flex items-center justify-between">
        <div>
          <p className="font-medium">Organization created successfully! 🎉</p>
          <p className="text-sm mt-1">
            Your organization is now active and ready to use. Team collaboration features are available based on your subscription plan.
          </p>
        </div>
        <div className="flex gap-2 ml-4">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleViewBilling}
            className="border-green-300 text-green-700 hover:bg-green-100"
          >
            Manage Billing
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleDismiss}
            className="text-green-600 hover:bg-green-100"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  );
}
