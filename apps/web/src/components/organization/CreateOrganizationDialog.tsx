"use client";

import { useState, useEffect } from 'react';
import { CreateOrganization } from '@clerk/nextjs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Building2, Crown, AlertTriangle } from 'lucide-react';
import { UpgradeDialog } from './UpgradeDialog';

interface CreateOrganizationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function CreateOrganizationDialog({
  open,
  onOpenChange,
  onSuccess,
}: CreateOrganizationDialogProps) {
  const [canCreate, setCanCreate] = useState<boolean | null>(null);
  const [upgradeReason, setUpgradeReason] = useState<string>('');
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (open) {
      checkBillingPermissions();
    }
  }, [open]);

  const checkBillingPermissions = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/billing/can-create-organization');
      const data = await response.json();
      
      setCanCreate(data.allowed);
      if (!data.allowed) {
        setUpgradeReason(data.reason || 'Upgrade required to create organizations');
      }
    } catch (error) {
      console.error('Error checking billing permissions:', error);
      setCanCreate(false);
      setUpgradeReason('Unable to verify billing permissions');
    } finally {
      setLoading(false);
    }
  };

  const handleUpgradeClick = () => {
    setShowUpgrade(true);
  };

  if (loading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Building2 className="h-5 w-5" />
              <span>Create Organization</span>
            </DialogTitle>
          </DialogHeader>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (canCreate === false) {
    return (
      <>
        <Dialog open={open} onOpenChange={onOpenChange}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle className="flex items-center space-x-2">
                <Building2 className="h-5 w-5" />
                <span>Create Organization</span>
              </DialogTitle>
            </DialogHeader>
            
            <Alert className="border-yellow-200 bg-yellow-50">
              <Crown className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-3">
                  <p className="font-medium">Upgrade Required</p>
                  <p className="text-sm">{upgradeReason}</p>
                  <div className="flex gap-2">
                    <Button onClick={handleUpgradeClick} size="sm">
                      <Crown className="h-4 w-4 mr-2" />
                      View Plans
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => onOpenChange(false)}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              </AlertDescription>
            </Alert>
          </DialogContent>
        </Dialog>

        <UpgradeDialog
          open={showUpgrade}
          onOpenChange={setShowUpgrade}
          feature="organizations"
          reason="Organizations are only available on paid plans"
        />
      </>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[80vh] p-0 overflow-hidden">
        <DialogHeader className="px-6 pt-6">
          <DialogTitle className="flex items-center space-x-2">
            <Building2 className="h-5 w-5" />
            <span>Create Organization</span>
          </DialogTitle>
        </DialogHeader>
        
        <div className="px-6 pb-6 overflow-y-auto">
          <Alert className="mb-4 border-blue-200 bg-blue-50">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="text-sm">
              <strong>Note:</strong> You can create one organization with your current plan. 
              Additional organizations require separate subscriptions.
            </AlertDescription>
          </Alert>
          
          <div className="min-h-0">
            <CreateOrganization
              afterCreateOrganizationUrl="/dashboard?newOrg=true"
              skipInvitationScreen={true}
              appearance={{
                elements: {
                  card: "shadow-none border-0 bg-transparent",
                  headerTitle: "hidden",
                  headerSubtitle: "hidden",
                  formButtonPrimary: "bg-primary hover:bg-primary/90 text-primary-foreground",
                  rootBox: "w-full",
                  cardBox: "w-full",
                  formFieldInput: "w-full",
                }
              }}
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
