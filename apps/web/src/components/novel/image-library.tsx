'use client';

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useImageUpload } from '@/hooks/use-image-upload';
import { Progress } from '@/components/ui/progress';
import { Loader2, Upload, Search, Image as ImageIcon, X, Check } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ImageItem {
  id: string;
  url: string;
  emailOptimizedUrl: string;
  thumbnailUrl: string;
  filename: string;
  uploadedAt: string;
  size?: number;
}

interface ImageLibraryProps {
  open: boolean;
  onClose: () => void;
  onImageSelect: (image: ImageItem) => void;
}

export function ImageLibrary({ open, onClose, onImageSelect }: ImageLibraryProps) {
  const [images, setImages] = useState<ImageItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedImage, setSelectedImage] = useState<ImageItem | null>(null);
  const { uploadImage, isUploading, uploadProgress } = useImageUpload();
  const { toast } = useToast();

  // Mock data for now - in real implementation, this would fetch from an API
  useEffect(() => {
    if (open) {
      loadImages();
    }
  }, [open]);

  const loadImages = async () => {
    setLoading(true);
    try {
      console.log('Loading images from API...');
      const response = await fetch('/api/images/library');
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || `HTTP error! status: ${response.status}`);
      }
      
      if (data.success && data.images) {
        console.log(`Loaded ${data.images.length} images from API`);
        setImages(data.images);
      } else {
        throw new Error(data.error || 'Invalid response format');
      }
    } catch (error) {
      console.error('Failed to load images:', error);
      toast({
        title: 'Error',
        description: 'Failed to load images',
        variant: 'destructive',
      });
      // Set empty array on error
      setImages([]);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (file: File) => {
    try {
      const result = await uploadImage(file, {
        folder: 'planemail/posts',
        tags: 'post-image'
      });

      if (result) {
        const newImage: ImageItem = {
          id: Date.now().toString(),
          url: result.url,
          emailOptimizedUrl: result.emailOptimizedUrl,
          thumbnailUrl: result.thumbnailUrl,
          filename: file.name,
          uploadedAt: new Date().toISOString(),
          size: file.size,
        };

        setImages(prev => [newImage, ...prev]);
        
        toast({
          title: 'Success',
          description: 'Image uploaded successfully',
        });
      }
    } catch (error) {
      console.error('Upload failed:', error);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files);
    const imageFiles = files.filter(file => file.type.startsWith('image/'));
    
    imageFiles.forEach(handleFileUpload);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    files.forEach(handleFileUpload);
  };

  const filteredImages = images.filter(image =>
    image.filename.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleImageClick = (image: ImageItem) => {
    setSelectedImage(image);
  };

  const handleInsertImage = () => {
    if (selectedImage) {
      onImageSelect(selectedImage);
      onClose();
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '';
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ImageIcon className="h-5 w-5" />
            Image Library
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="library" className="flex-1 flex flex-col overflow-hidden">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="library">Library</TabsTrigger>
            <TabsTrigger value="upload">Upload New</TabsTrigger>
          </TabsList>

          <TabsContent value="library" className="flex-1 flex flex-col overflow-hidden">
            {/* Search */}
            <div className="flex items-center gap-2 mb-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search images..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              {selectedImage && (
                <Button onClick={handleInsertImage} className="flex items-center gap-2">
                  <Check className="h-4 w-4" />
                  Insert Selected
                </Button>
              )}
            </div>

            {/* Image Grid */}
            <div className="flex-1 overflow-auto">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              ) : filteredImages.length === 0 ? (
                <div className="flex items-center justify-center py-12 text-center">
                  <div>
                    <ImageIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">
                      {searchTerm ? 'No images found' : 'No images uploaded yet'}
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Upload your first image to get started
                    </p>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {filteredImages.map((image) => (
                    <div
                      key={image.id}
                      className={`relative group cursor-pointer rounded-lg border-2 transition-all ${
                        selectedImage?.id === image.id
                          ? 'border-primary shadow-md'
                          : 'border-transparent hover:border-muted-foreground'
                      }`}
                      onClick={() => handleImageClick(image)}
                    >
                      <div className="aspect-square overflow-hidden rounded-lg">
                        <img
                          src={image.thumbnailUrl}
                          alt={image.filename}
                          className="w-full h-full object-cover transition-transform group-hover:scale-105"
                        />
                      </div>
                      
                      {/* Overlay with info */}
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-colors rounded-lg flex items-end">
                        <div className="p-2 text-white opacity-0 group-hover:opacity-100 transition-opacity">
                          <p className="text-xs font-medium truncate">{image.filename}</p>
                          <p className="text-xs text-white/80">{formatDate(image.uploadedAt)}</p>
                          {image.size && (
                            <p className="text-xs text-white/80">{formatFileSize(image.size)}</p>
                          )}
                        </div>
                      </div>

                      {/* Selection indicator */}
                      {selectedImage?.id === image.id && (
                        <div className="absolute top-2 right-2 bg-primary text-primary-foreground rounded-full p-1">
                          <Check className="h-3 w-3" />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="upload" className="flex-1 flex flex-col">
            {/* Upload Area */}
            <div
              className="flex-1 border-2 border-dashed border-muted-foreground/25 rounded-lg flex items-center justify-center p-8 transition-colors hover:border-muted-foreground/50"
              onDrop={handleDrop}
              onDragOver={(e) => e.preventDefault()}
            >
              <div className="text-center">
                <Upload className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Upload Images</h3>
                <p className="text-muted-foreground mb-4">
                  Drag and drop images here, or click to select files
                </p>
                <Input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleFileSelect}
                  className="hidden"
                  id="file-upload"
                />
                <Button asChild>
                  <label htmlFor="file-upload" className="cursor-pointer">
                    Choose Files
                  </label>
                </Button>
              </div>
            </div>

            {/* Upload Progress */}
            {isUploading && (
              <div className="mt-4 p-4 bg-muted rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm font-medium">Uploading...</span>
                </div>
                <Progress value={uploadProgress} className="w-full" />
                <p className="text-xs text-muted-foreground mt-1">
                  {uploadProgress}% complete
                </p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
