'use client';

import { NovelEditor } from '@/components/novel/editor';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import type { JSONContent } from '@tiptap/react';

interface ComplianceStatus {
  hasUnsubscribe: boolean;
  hasSenderAddress: boolean;
  wordCount: number;
  readingTimeMin: number;
}

export default function NewCampaignPage() {
  const router = useRouter();
  const { toast } = useToast();
  
  const [campaignMeta, setCampaignMeta] = useState({
    subject: '',
    preheader: '',
    fromName: '',
    fromEmail: '',
  });
  
  const [compliance, setCompliance] = useState<ComplianceStatus>({
    hasUnsubscribe: false,
    hasSenderAddress: false,
    wordCount: 0,
    readingTimeMin: 1,
  });
  
  const [content, setContent] = useState({
    text: '',
    html: '',
    json: {} as JSONContent,
  });

  const handleContentUpdate = (text: string, html: string, json: JSONContent) => {
    setContent({ text, html, json });
  };

  const handleMetaChange = (meta: typeof campaignMeta) => {
    setCampaignMeta(meta);
  };

  const handleComplianceChange = (status: ComplianceStatus) => {
    setCompliance(status);
  };

  const handleSave = async () => {
    try {
      // TODO: Implement save logic
      console.log('Saving campaign:', {
        meta: campaignMeta,
        content,
        compliance,
      });
      
      toast({
        title: 'Campaign Saved',
        description: 'Your campaign has been saved successfully.',
      });
    } catch (error) {
      console.error('Failed to save campaign:', error);
      toast({
        title: 'Save Failed',
        description: 'Failed to save campaign. Please try again.',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="min-h-screen">
      <NovelEditor
        mode="campaign"
        initialContent=""
        placeholder="Start writing your campaign..."
        onUpdate={handleContentUpdate}
        onMetaChange={handleMetaChange}
        onComplianceChange={handleComplianceChange}
        defaultMeta={campaignMeta}
      />
    </div>
  );
}
