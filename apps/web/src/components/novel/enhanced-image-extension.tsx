import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer } from '@tiptap/react';
import { ImageNodeView } from './image-node-view';

export interface ImageOptions {
  inline: boolean;
  allowBase64: boolean;
  HTMLAttributes: Record<string, any>;
  uploadFunction?: (file: File) => Promise<{
    url: string;
    emailOptimizedUrl: string;
    thumbnailUrl: string;
  } | null>;
  onOpenLibrary?: () => void;
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    enhancedImage: {
      /**
       * Add an image
       */
      setImage: (options: { 
        src: string; 
        alt?: string; 
        title?: string;
        width?: number;
        height?: number;
        align?: 'left' | 'center' | 'right';
        caption?: string;
      }) => ReturnType;
      /**
       * Upload and add an image
       */
      uploadImage: (file: File, options?: {
        alt?: string;
        title?: string;
        align?: 'left' | 'center' | 'right';
        caption?: string;
      }) => ReturnType;
      /**
       * Open image library
       */
      openImageLibrary: () => ReturnType;
    };
  }
}

export const EnhancedImage = Node.create<ImageOptions>({
  name: 'enhancedImage',

  addOptions() {
    return {
      inline: false,
      allowBase64: false,
      HTMLAttributes: {},
      uploadFunction: undefined,
      onOpenLibrary: undefined,
    };
  },

  inline() {
    return this.options.inline;
  },

  group() {
    return this.options.inline ? 'inline' : 'block';
  },

  draggable: true,

  addAttributes() {
    return {
      src: {
        default: null,
      },
      alt: {
        default: null,
      },
      title: {
        default: null,
      },
      width: {
        default: null,
      },
      height: {
        default: null,
      },
      align: {
        default: 'center',
      },
      caption: {
        default: null,
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'img[src]',
        getAttrs: (element) => {
          const img = element as HTMLImageElement;
          return {
            src: img.getAttribute('src'),
            alt: img.getAttribute('alt'),
            title: img.getAttribute('title'),
            width: img.width || null,
            height: img.height || null,
            align: img.getAttribute('data-align') || 'center',
            caption: img.getAttribute('data-caption'),
          };
        },
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ['img', mergeAttributes(this.options.HTMLAttributes, HTMLAttributes)];
  },

  addNodeView() {
    return ReactNodeViewRenderer(ImageNodeView);
  },

  addCommands() {
    return {
      setImage:
        (options) =>
        ({ commands }) => {
          return commands.insertContent({
            type: this.name,
            attrs: options,
          });
        },
      uploadImage:
        (file, options = {}) =>
        ({ commands, editor }) => {
          if (!this.options.uploadFunction) {
            console.warn('Upload function not provided to EnhancedImage extension, falling back to base64');
            // Fallback to base64 if no upload function is provided
            const reader = new FileReader();
            reader.onload = (e) => {
              const base64 = e.target?.result as string;
              commands.insertContent({
                type: this.name,
                attrs: {
                  src: base64,
                  alt: options.alt || file.name,
                  title: options.title || file.name,
                  align: options.align || 'center',
                  caption: options.caption,
                },
              });
            };
            reader.readAsDataURL(file);
            return true;
          }

          // Handle upload asynchronously but return true immediately
          this.options.uploadFunction(file)
            .then((uploadResult) => {
              if (uploadResult) {
                // Use the email-optimized URL for the editor
                commands.insertContent({
                  type: this.name,
                  attrs: {
                    src: uploadResult.emailOptimizedUrl,
                    alt: options.alt || file.name,
                    title: options.title || file.name,
                    align: options.align || 'center',
                    caption: options.caption,
                  },
                });
                console.log('Image uploaded successfully to ImageKit:', uploadResult.emailOptimizedUrl);
              } else {
                console.error('Upload failed: No result returned, falling back to base64');
                // Fallback to base64 if upload fails
                const reader = new FileReader();
                reader.onload = (e) => {
                  const base64 = e.target?.result as string;
                  commands.insertContent({
                    type: this.name,
                    attrs: {
                      src: base64,
                      alt: options.alt || file.name,
                      title: options.title || file.name,
                      align: options.align || 'center',
                      caption: options.caption,
                    },
                  });
                };
                reader.readAsDataURL(file);
              }
            })
            .catch((error) => {
              console.error('Image upload failed:', error, 'falling back to base64');
              // Fallback to base64 if upload fails
              const reader = new FileReader();
              reader.onload = (e) => {
                const base64 = e.target?.result as string;
                commands.insertContent({
                  type: this.name,
                  attrs: {
                    src: base64,
                    alt: options.alt || file.name,
                    title: options.title || file.name,
                    align: options.align || 'center',
                    caption: options.caption,
                  },
                });
              };
              reader.readAsDataURL(file);
            });

          return true; // Return immediately, upload happens asynchronously
        },
      openImageLibrary:
        () =>
        ({ commands, editor }) => {
          if (this.options.onOpenLibrary) {
            this.options.onOpenLibrary();
          } else {
            console.warn('Image library handler not configured');
          }
          return true;
        },
    };
  },
});
