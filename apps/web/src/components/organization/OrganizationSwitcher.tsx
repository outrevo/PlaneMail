"use client";

import { OrganizationSwitcher as ClerkOrganizationSwitcher } from '@clerk/nextjs';
import { useState } from 'react';
import { CreateOrganizationDialog } from './CreateOrganizationDialog';
import { useToast } from '@/hooks/use-toast';

export function OrganizationSwitcher() {
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const { toast } = useToast();

  const handleCreateOrganization = async () => {
    // Check if user can create organizations before showing Clerk's component
    try {
      const response = await fetch('/api/billing/can-create-organization');
      const data = await response.json();
      
      if (data.allowed) {
        setShowCreateDialog(true);
      } else {
        // Show upgrade message
        toast({
          title: "Upgrade Required",
          description: data.reason,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error checking organization permissions:', error);
      toast({
        title: "Error",
        description: "Unable to verify organization permissions",
        variant: "destructive",
      });
    }
  };

  return (
    <>
      <ClerkOrganizationSwitcher
        hidePersonal={false}
        createOrganizationMode="navigation"
        createOrganizationUrl="/create-organization"
        organizationProfileMode="modal"
        afterCreateOrganizationUrl="/dashboard?newOrg=true"
        afterLeaveOrganizationUrl="/dashboard"
        afterSelectPersonalUrl="/dashboard"
        afterSelectOrganizationUrl="/dashboard"
        appearance={{
          elements: {
            organizationSwitcherTrigger: "border border-input bg-background hover:bg-accent hover:text-accent-foreground rounded-md px-3 py-2 text-sm",
            organizationSwitcherTriggerIcon: "text-muted-foreground",
            organizationPreview: "hover:bg-accent hover:text-accent-foreground",
            organizationPreviewTextContainer: "text-foreground",
            organizationPreviewSecondaryIdentifier: "text-muted-foreground",
            organizationSwitcherPopoverCard: "border border-border bg-popover text-popover-foreground shadow-md",
            organizationSwitcherPopoverActions: "border-t border-border",
            organizationSwitcherPopoverActionButton: "text-foreground hover:bg-accent hover:text-accent-foreground",
            organizationSwitcherPopoverActionButtonIcon: "text-muted-foreground",
          }
        }}
      />

      {/* Custom create organization dialog with billing checks */}
      <CreateOrganizationDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onSuccess={() => {
          setShowCreateDialog(false);
          toast({
            title: "Organization Created",
            description: "Your organization has been created successfully!",
          });
        }}
      />
    </>
  );
}
