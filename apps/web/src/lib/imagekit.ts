import ImageKit from 'imagekit';

// Check if ImageKit environment variables are configured
const isImageKitConfigured = Boolean(
  process.env.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY &&
  process.env.IMAGEKIT_PRIVATE_KEY &&
  process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT
);

// ImageKit configuration - only initialize if properly configured
const imagekit = isImageKitConfigured ? new ImageKit({
  publicKey: process.env.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY!,
  privateKey: process.env.IMAGEKIT_PRIVATE_KEY!,
  urlEndpoint: process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT!,
}) : null;

export interface ImageUploadOptions {
  file: File;
  fileName?: string;
  folder?: string;
  useUniqueFileName?: boolean;
  tags?: string[];
}

export interface ImageTransformOptions {
  width?: number;
  height?: number;
  quality?: number;
  format?: 'webp' | 'jpeg' | 'png' | 'auto';
  progressive?: boolean;
  crop?: 'at_max' | 'at_least' | 'maintain_ratio';
  focus?: 'auto' | 'face' | 'center';
}

export interface UploadResponse {
  success: boolean;
  url?: string;
  emailOptimizedUrl?: string;
  thumbnailUrl?: string;
  error?: string;
}

class ImageKitService {
  /**
   * Upload image to ImageKit
   */
  async uploadImage(options: ImageUploadOptions): Promise<UploadResponse> {
    try {
      if (!imagekit) {
        return {
          success: false,
          error: 'ImageKit is not configured. Please set up your ImageKit environment variables.',
        };
      }

      const { file, fileName, folder = 'planemail/posts', useUniqueFileName = true, tags = ['post-image'] } = options;

      // Convert file to base64 - handle both browser and server environments
      const base64 = await this.fileToBase64(file);

      const uploadResponse = await imagekit.upload({
        file: base64,
        fileName: fileName || file.name,
        folder,
        useUniqueFileName,
        tags,
        isPrivateFile: false,
      });

      // Generate optimized URLs
      const emailOptimizedUrl = this.getEmailOptimizedUrl(uploadResponse.url);
      const thumbnailUrl = this.getThumbnailUrl(uploadResponse.url);

      return {
        success: true,
        url: uploadResponse.url,
        emailOptimizedUrl,
        thumbnailUrl,
      };
    } catch (error) {
      console.error('ImageKit upload error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Upload failed',
      };
    }
  }

  /**
   * Get email-optimized image URL with transforms
   * Optimized for email clients with 600px max width, compressed quality
   */
  getEmailOptimizedUrl(originalUrl: string, options: ImageTransformOptions = {}): string {
    const {
      width = 600,
      height,
      quality = 80,
      format = 'auto',
      progressive = true,
      crop = 'at_max',
      focus = 'auto'
    } = options;

    const transforms = [
      `w-${width}`,
      height ? `h-${height}` : '',
      `q-${quality}`,
      `f-${format}`,
      progressive ? 'pr-true' : '',
      `c-${crop}`,
      `fo-${focus}`,
      'dpr-auto', // Auto device pixel ratio
    ].filter(Boolean).join(',');

    return this.addTransforms(originalUrl, transforms);
  }

  /**
   * Get thumbnail URL for editor preview
   */
  getThumbnailUrl(originalUrl: string): string {
    const transforms = 'w-200,h-150,c-at_max,q-70,f-webp';
    return this.addTransforms(originalUrl, transforms);
  }

  /**
   * Get responsive image URLs for different screen sizes
   */
  getResponsiveUrls(originalUrl: string): { small: string; medium: string; large: string } {
    return {
      small: this.addTransforms(originalUrl, 'w-400,q-75,f-auto'),
      medium: this.addTransforms(originalUrl, 'w-800,q-80,f-auto'),
      large: this.addTransforms(originalUrl, 'w-1200,q-85,f-auto'),
    };
  }

  /**
   * Add transforms to ImageKit URL
   */
  private addTransforms(url: string, transforms: string): string {
    if (!url || !transforms) return url;
    
    const urlEndpoint = process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT || '';
    if (!urlEndpoint || !url.includes(urlEndpoint)) return url;

    // Insert transforms after the endpoint
    const transformedUrl = url.replace(
      urlEndpoint + '/',
      urlEndpoint + '/tr:' + transforms + '/'
    );

    return transformedUrl;
  }

  /**
   * Convert File to base64 string - works in both browser and server environments
   */
  private async fileToBase64(file: File): Promise<string> {
    // Check if we're in a browser environment
    if (typeof window !== 'undefined' && typeof FileReader !== 'undefined') {
      // Browser environment - use FileReader
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => {
          const result = reader.result as string;
          // Remove data URL prefix
          const base64 = result.split(',')[1];
          resolve(base64);
        };
        reader.onerror = error => reject(error);
      });
    } else {
      // Server environment - use Buffer
      try {
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        return buffer.toString('base64');
      } catch (error) {
        console.error('Error converting file to base64 on server:', error);
        throw new Error('Failed to convert file to base64');
      }
    }
  }

  /**
   * Validate image file
   */
  validateImageFile(file: File): { valid: boolean; error?: string } {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
    const maxSize = 10 * 1024 * 1024; // 10MB

    if (!allowedTypes.includes(file.type)) {
      return {
        valid: false,
        error: 'Invalid file type. Please upload JPEG, PNG, WebP, or GIF images.',
      };
    }

    if (file.size > maxSize) {
      return {
        valid: false,
        error: 'File size too large. Please upload images smaller than 10MB.',
      };
    }

    return { valid: true };
  }

  /**
   * Get image info from ImageKit
   */
  async getImageInfo(fileId: string) {
    try {
      if (!imagekit) {
        console.error('ImageKit is not configured');
        return null;
      }
      return await imagekit.getFileDetails(fileId);
    } catch (error) {
      console.error('Error getting image info:', error);
      return null;
    }
  }

  /**
   * Delete image from ImageKit
   */
  async deleteImage(fileId: string): Promise<boolean> {
    try {
      if (!imagekit) {
        console.error('ImageKit is not configured');
        return false;
      }
      await imagekit.deleteFile(fileId);
      return true;
    } catch (error) {
      console.error('Error deleting image:', error);
      return false;
    }
  }
}

export const imagekitService = new ImageKitService();
export default imagekitService;
