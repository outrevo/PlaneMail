"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { CreateOrganizationDialog } from '@/components/organization/CreateOrganizationDialog';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';

export default function CreateOrganizationPage() {
  const router = useRouter();
  const [showDialog, setShowDialog] = useState(false);
  const [checking, setChecking] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    checkBillingPermissions();
  }, []);

  const checkBillingPermissions = async () => {
    try {
      const response = await fetch('/api/billing/can-create-organization');
      const data = await response.json();
      
      if (data.allowed) {
        setShowDialog(true);
      } else {
        // Show upgrade message and redirect
        toast({
          title: "Upgrade Required",
          description: data.reason,
          variant: "destructive",
        });
        router.push('/pricing?feature=organizations');
      }
    } catch (error) {
      console.error('Error checking organization permissions:', error);
      toast({
        title: "Error",
        description: "Unable to verify organization permissions",
        variant: "destructive",
      });
      router.push('/dashboard');
    } finally {
      setChecking(false);
    }
  };

  const handleDialogClose = () => {
    setShowDialog(false);
    router.push('/dashboard');
  };

  const handleSuccess = () => {
    setShowDialog(false);
    router.push('/dashboard?newOrg=true');
  };

  if (checking) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex items-center space-x-2">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <span className="text-sm text-muted-foreground">Checking permissions...</span>
        </div>
      </div>
    );
  }

  return (
    <CreateOrganizationDialog
      open={showDialog}
      onOpenChange={handleDialogClose}
      onSuccess={handleSuccess}
    />
  );
}
