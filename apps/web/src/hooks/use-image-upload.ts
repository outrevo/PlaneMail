'use client';

import { useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';

interface UploadResult {
  url: string;
  emailOptimizedUrl: string;
  thumbnailUrl: string;
}

interface UseImageUploadReturn {
  uploadImage: (file: File, options?: { folder?: string; tags?: string }) => Promise<UploadResult | null>;
  isUploading: boolean;
  uploadProgress: number;
}

export function useImageUpload(): UseImageUploadReturn {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const { toast } = useToast();

  const uploadImage = useCallback(async (
    file: File, 
    options: { folder?: string; tags?: string } = {}
  ): Promise<UploadResult | null> => {
    console.log('useImageUpload called with file:', file.name, 'options:', options);
    setIsUploading(true);
    setUploadProgress(0);

    try {
      // Validate file size and type on client side
      const maxSize = 10 * 1024 * 1024; // 10MB
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];

      if (!allowedTypes.includes(file.type)) {
        toast({
          title: 'Invalid file type',
          description: 'Please upload JPEG, PNG, WebP, or GIF images.',
          variant: 'destructive',
        });
        return null;
      }

      if (file.size > maxSize) {
        toast({
          title: 'File too large',
          description: 'Please upload images smaller than 10MB.',
          variant: 'destructive',
        });
        return null;
      }

      // Create form data
      const formData = new FormData();
      formData.append('file', file);
      if (options.folder) {
        formData.append('folder', options.folder);
      }
      if (options.tags) {
        formData.append('tags', options.tags);
      }

      // Simulate progress for better UX
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      // Upload to API
      const response = await fetch('/api/images/upload', {
        method: 'POST',
        body: formData,
      });

      console.log('Upload API response status:', response.status);
      clearInterval(progressInterval);
      setUploadProgress(100);

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Upload API error:', errorData);
        throw new Error(errorData.error || 'Upload failed');
      }

      const result = await response.json();
      console.log('Upload API result:', result);

      if (!result.success) {
        throw new Error(result.error || 'Upload failed');
      }

      toast({
        title: 'Image uploaded',
        description: 'Your image has been uploaded successfully.',
      });

      return result.data;

    } catch (error) {
      console.error('Image upload error:', error);
      toast({
        title: 'Upload failed',
        description: error instanceof Error ? error.message : 'Failed to upload image',
        variant: 'destructive',
      });
      return null;
    } finally {
      setIsUploading(false);
      setTimeout(() => setUploadProgress(0), 1000);
    }
  }, [toast]);

  return {
    uploadImage,
    isUploading,
    uploadProgress,
  };
}

export default useImageUpload;
