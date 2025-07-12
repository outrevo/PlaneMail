"use client";

import { useState } from 'react';
import { UpgradeDialog } from '@/components/organization/UpgradeDialog';

export function useUpgradeDialog() {
  const [isOpen, setIsOpen] = useState(false);
  const [upgradeInfo, setUpgradeInfo] = useState<{
    feature?: string;
    reason?: string;
  }>({});

  const showUpgradeDialog = (feature?: string, reason?: string) => {
    setUpgradeInfo({ feature, reason });
    setIsOpen(true);
  };

  const UpgradeDialogComponent = () => (
    <UpgradeDialog
      open={isOpen}
      onOpenChange={setIsOpen}
      feature={upgradeInfo.feature}
      reason={upgradeInfo.reason}
    />
  );

  return {
    showUpgradeDialog,
    UpgradeDialog: UpgradeDialogComponent,
  };
}
