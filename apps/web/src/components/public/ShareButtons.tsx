'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Share2, Twitter, Facebook, Linkedin, Link as LinkIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ShareButtonsProps {
  url: string;
  title: string;
}

export function ShareButtons({ url, title }: ShareButtonsProps) {
  const { toast } = useToast();

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(url);
      toast({
        title: 'Copied!',
        description: 'Link copied to clipboard.',
      });
    } catch (error) {
      console.error('Failed to copy:', error);
      toast({
        title: 'Error',
        description: 'Failed to copy link.',
        variant: 'destructive',
      });
    }
  };

  const shareToTwitter = () => {
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`;
    window.open(twitterUrl, '_blank', 'width=550,height=420');
  };

  const shareToFacebook = () => {
    const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
    window.open(facebookUrl, '_blank', 'width=550,height=420');
  };

  const shareToLinkedIn = () => {
    const linkedinUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`;
    window.open(linkedinUrl, '_blank', 'width=550,height=420');
  };

  const nativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title,
          url,
        });
      } catch (error) {
        console.error('Native share failed:', error);
      }
    }
  };

  return (
    <div className="flex items-center gap-2">
      {typeof navigator !== 'undefined' && 'share' in navigator && (
        <Button variant="outline" size="sm" onClick={nativeShare}>
          <Share2 className="h-4 w-4" />
        </Button>
      )}
      
      <Button variant="outline" size="sm" onClick={shareToTwitter}>
        <Twitter className="h-4 w-4" />
      </Button>
      
      <Button variant="outline" size="sm" onClick={shareToFacebook}>
        <Facebook className="h-4 w-4" />
      </Button>
      
      <Button variant="outline" size="sm" onClick={shareToLinkedIn}>
        <Linkedin className="h-4 w-4" />
      </Button>
      
      <Button variant="outline" size="sm" onClick={copyToClipboard}>
        <LinkIcon className="h-4 w-4" />
      </Button>
    </div>
  );
}
