'use client';

import './editor.css';
import React, { useEffect, useState, useRef } from 'react';
import { EditorProvider, useEditor, EditorContent, type Editor, BubbleMenu, type JSONContent } from '@tiptap/react';
import { NodeSelection } from '@tiptap/pm/state';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Link from '@tiptap/extension-link';
import TextStyle from '@tiptap/extension-text-style';
import { Color } from '@tiptap/extension-color';
import Highlight from '@tiptap/extension-highlight';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import FontFamily from '@tiptap/extension-font-family';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import HorizontalRule from '@tiptap/extension-horizontal-rule';
import CharacterCount from '@tiptap/extension-character-count';
import Dropcursor from '@tiptap/extension-dropcursor';
import Gapcursor from '@tiptap/extension-gapcursor';
import { useDebouncedCallback } from 'use-debounce';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  Bold, 
  Italic, 
  Underline as UnderlineIcon, 
  Strikethrough,
  Code,
  Link as LinkIcon,
  Unlink,
  Highlighter,
  Type,
  Palette,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Code2,
  Image as ImageIcon,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Type as FontIcon,
  ChevronDown
} from 'lucide-react';
import { Provider } from 'jotai';
import tunnel from 'tunnel-rat';
import { novelStore } from './store';
import { EditorCommandTunnelContext } from './editor-command-context';
import { createBaseTemplate } from './slash-commands';
import { BlockMenu, BlockIndicator } from './block-menu';
import SlashCommand from './slash-command-extension';
import { EnhancedImage } from './enhanced-image-extension';
import { useImageUpload } from '@/hooks/use-image-upload';
import { Progress } from '@/components/ui/progress';
import { Loader2 } from 'lucide-react';
import { ImageLibrary } from './image-library';

interface NovelEditorProps {
  initialContent?: string | JSONContent;
  onUpdate?: (content: string, html: string, json: JSONContent) => void;
  placeholder?: string;
  className?: string;
  editable?: boolean;
  showBaseTemplate?: boolean;
}

const EditorBubbleMenu = ({ editor }: { editor: Editor }) => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleBold = () => editor.chain().focus().toggleBold().run();
  const toggleItalic = () => editor.chain().focus().toggleItalic().run();
  const toggleUnderline = () => editor.chain().focus().toggleUnderline().run();
  const toggleStrike = () => editor.chain().focus().toggleStrike().run();
  const toggleCode = () => editor.chain().focus().toggleCode().run();
  const toggleHighlight = () => editor.chain().focus().toggleHighlight().run();

  const setAlignLeft = () => editor.chain().focus().setTextAlign('left').run();
  const setAlignCenter = () => editor.chain().focus().setTextAlign('center').run();
  const setAlignRight = () => editor.chain().focus().setTextAlign('right').run();
  const setAlignJustify = () => editor.chain().focus().setTextAlign('justify').run();

  const setLink = () => {
    const previousUrl = editor.getAttributes('link').href;
    const url = window.prompt('URL', previousUrl);

    if (url === null) return;

    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }

    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  };

  const unsetLink = () => {
    editor.chain().focus().unsetLink().run();
  };

  const openImageLibrary = () => {
    editor.commands.openImageLibrary();
  };

  return (
    <BubbleMenu
      editor={editor}
      tippyOptions={{ 
        duration: 100,
        onShow: () => setIsOpen(true),
        onHide: () => setIsOpen(false),
        placement: 'top',
        maxWidth: 'none',
      }}
      className="bubble-menu-glass"
    >
      {/* Font Family */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            size="sm"
            variant="ghost"
            className="font-dropdown-button text-xs font-medium gap-1"
          >
            <FontIcon className="h-4 w-4 flex-shrink-0" />
            <span className="hidden sm:inline max-w-16 truncate">
              {editor.getAttributes('textStyle').fontFamily?.split(',')[0] || 'Font'}
            </span>
            <ChevronDown className="h-3 w-3 flex-shrink-0" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent 
          align="start" 
          side="bottom"
          className="dropdown-glass"
          sideOffset={8}
          alignOffset={-20}
          avoidCollisions={true}
          collisionPadding={20}
        >
          <DropdownMenuItem
            onClick={() => editor.chain().focus().setFontFamily('Inter, sans-serif').run()}
            className="font-sans"
          >
            Inter (Default)
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => editor.chain().focus().setFontFamily('serif').run()}
            className="font-serif"
          >
            Serif
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => editor.chain().focus().setFontFamily('Georgia, serif').run()}
            style={{ fontFamily: 'Georgia, serif' }}
          >
            Georgia
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => editor.chain().focus().setFontFamily('Times New Roman, serif').run()}
            style={{ fontFamily: 'Times New Roman, serif' }}
          >
            Times New Roman
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => editor.chain().focus().setFontFamily('Helvetica, sans-serif').run()}
            style={{ fontFamily: 'Helvetica, sans-serif' }}
          >
            Helvetica
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => editor.chain().focus().setFontFamily('Arial, sans-serif').run()}
            style={{ fontFamily: 'Arial, sans-serif' }}
          >
            Arial
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => editor.chain().focus().setFontFamily('Monaco, Consolas, monospace').run()}
            className="font-mono"
          >
            Monospace
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => editor.chain().focus().unsetFontFamily().run()}
          >
            Reset
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Separator orientation="vertical" className="mx-1 h-6" />

      {/* Core Formatting */}
      <Button
        size="sm"
        variant={editor.isActive('bold') ? 'default' : 'ghost'}
        onClick={toggleBold}
        className="h-8 w-8 p-0"
        title="Bold"
      >
        <Bold className="h-4 w-4" />
      </Button>

      <Button
        size="sm"
        variant={editor.isActive('italic') ? 'default' : 'ghost'}
        onClick={toggleItalic}
        className="h-8 w-8 p-0"
        title="Italic"
      >
        <Italic className="h-4 w-4" />
      </Button>

      <Button
        size="sm"
        variant={editor.isActive('underline') ? 'default' : 'ghost'}
        onClick={toggleUnderline}
        className="h-8 w-8 p-0"
        title="Underline"
      >
        <UnderlineIcon className="h-4 w-4" />
      </Button>

      <Button
        size="sm"
        variant={editor.isActive('strike') ? 'default' : 'ghost'}
        onClick={toggleStrike}
        className="h-8 w-8 p-0"
        title="Strikethrough"
      >
        <Strikethrough className="h-4 w-4" />
      </Button>

      <Separator orientation="vertical" className="mx-1 h-6" />

      {/* Headings */}
      <Button
        size="sm"
        variant={editor.isActive('heading', { level: 1 }) ? 'default' : 'ghost'}
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        className="h-8 w-8 p-0"
        title="Heading 1"
      >
        <Heading1 className="h-4 w-4" />
      </Button>

      <Button
        size="sm"
        variant={editor.isActive('heading', { level: 2 }) ? 'default' : 'ghost'}
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        className="h-8 w-8 p-0"
        title="Heading 2"
      >
        <Heading2 className="h-4 w-4" />
      </Button>

      <Button
        size="sm"
        variant={editor.isActive('heading', { level: 3 }) ? 'default' : 'ghost'}
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        className="h-8 w-8 p-0"
        title="Heading 3"
      >
        <Heading3 className="h-4 w-4" />
      </Button>

      <Separator orientation="vertical" className="mx-1 h-6" />

      {/* Lists */}
      <Button
        size="sm"
        variant={editor.isActive('bulletList') ? 'default' : 'ghost'}
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        className="h-8 w-8 p-0"
        title="Bullet List"
      >
        <List className="h-4 w-4" />
      </Button>

      <Button
        size="sm"
        variant={editor.isActive('orderedList') ? 'default' : 'ghost'}
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        className="h-8 w-8 p-0"
        title="Numbered List"
      >
        <ListOrdered className="h-4 w-4" />
      </Button>

      <Separator orientation="vertical" className="mx-1 h-6" />

      {/* Alignment */}
      <Button
        size="sm"
        variant={editor.isActive({ textAlign: 'left' }) ? 'default' : 'ghost'}
        onClick={setAlignLeft}
        className="h-8 w-8 p-0"
        title="Align Left"
      >
        <AlignLeft className="h-4 w-4" />
      </Button>

      <Button
        size="sm"
        variant={editor.isActive({ textAlign: 'center' }) ? 'default' : 'ghost'}
        onClick={setAlignCenter}
        className="h-8 w-8 p-0"
        title="Center"
      >
        <AlignCenter className="h-4 w-4" />
      </Button>

      <Button
        size="sm"
        variant={editor.isActive({ textAlign: 'right' }) ? 'default' : 'ghost'}
        onClick={setAlignRight}
        className="h-8 w-8 p-0"
        title="Align Right"
      >
        <AlignRight className="h-4 w-4" />
      </Button>

      <Separator orientation="vertical" className="mx-1 h-6" />

      {/* Additional Tools */}
      <Button
        size="sm"
        variant={editor.isActive('highlight') ? 'default' : 'ghost'}
        onClick={toggleHighlight}
        className="h-8 w-8 p-0"
        title="Highlight"
      >
        <Highlighter className="h-4 w-4" />
      </Button>

      <Button
        size="sm"
        variant={editor.isActive('code') ? 'default' : 'ghost'}
        onClick={toggleCode}
        className="h-8 w-8 p-0"
        title="Inline Code"
      >
        <Code className="h-4 w-4" />
      </Button>

      <Separator orientation="vertical" className="mx-1 h-6" />

      {/* Image */}
      <Button
        size="sm"
        variant="ghost"
        onClick={openImageLibrary}
        className="h-8 w-8 p-0"
        title="Insert Image"
      >
        <ImageIcon className="h-4 w-4" />
      </Button>

      {/* Link */}
      {editor.isActive('link') ? (
        <Button
          size="sm"
          variant="default"
          onClick={unsetLink}
          className="h-8 w-8 p-0"
          title="Remove Link"
        >
          <Unlink className="h-4 w-4" />
        </Button>
      ) : (
        <Button
          size="sm"
          variant="ghost"
          onClick={setLink}
          className="h-8 w-8 p-0"
          title="Add Link"
        >
          <LinkIcon className="h-4 w-4" />
        </Button>
      )}
    </BubbleMenu>
  );
};

export function NovelEditor({
  initialContent = '',
  onUpdate,
  placeholder = 'Press "/" for commands, or start writing...',
  className = '',
  editable = true,
  showBaseTemplate = true,
}: NovelEditorProps) {
  const [saveStatus, setSaveStatus] = useState('Saved');
  const [blockMenuVisible, setBlockMenuVisible] = useState(false);
  const [blockMenuPosition, setBlockMenuPosition] = useState({ top: 0, left: 0 });
  const [imageLibraryOpen, setImageLibraryOpen] = useState(false);
  const tunnelInstance = useRef(tunnel()).current;
  const { uploadImage, isUploading, uploadProgress } = useImageUpload();

  // Create upload function that will be passed to the extension
  const handleImageKitUpload = async (file: File) => {
    console.log('handleImageKitUpload called for file:', file.name);
    try {
      const result = await uploadImage(file, {
        folder: 'planemail/posts',
        tags: 'post-image'
      });
      console.log('Upload result:', result);
      
      if (!result) {
        console.warn('ImageKit upload failed, will fallback to base64');
      }
      
      return result;
    } catch (error) {
      console.error('Upload failed:', error);
      console.warn('ImageKit upload failed, will fallback to base64');
      return null;
    }
  };

  // Handle image library
  const handleOpenImageLibrary = () => {
    setImageLibraryOpen(true);
  };

  const handleImageSelect = (image: any) => {
    if (editor) {
      // Check if there's a currently selected image node
      const { state } = editor;
      const { selection } = state;
      
      // Check if we have a NodeSelection and it's an image
      if (selection instanceof NodeSelection && 
          selection.node.type.name === 'enhancedImage') {
        // Replace the selected image
        editor.commands.updateAttributes('enhancedImage', {
          src: image.emailOptimizedUrl,
          alt: image.filename,
          title: image.filename,
        });
      } else {
        // Insert new image
        editor.commands.setImage({
          src: image.emailOptimizedUrl,
          alt: image.filename,
          title: image.filename,
        });
      }
    }
  };

  const extensions = [
    StarterKit.configure({
      bulletList: {
        keepMarks: true,
        keepAttributes: false,
      },
      orderedList: {
        keepMarks: true,
        keepAttributes: false,
      },
    }),
    Placeholder.configure({
      placeholder,
      showOnlyWhenEditable: true,
      emptyNodeClass: 'is-editor-empty',
    }),
    Link.configure({
      openOnClick: false,
      autolink: true,
      defaultProtocol: 'https',
      HTMLAttributes: {
        class: 'text-primary underline underline-offset-[3px] hover:text-primary/80 transition-colors cursor-pointer',
      },
    }),
    EnhancedImage.configure({
      allowBase64: true, // Allow base64 as fallback when ImageKit is not configured
      HTMLAttributes: {
        class: 'rounded-lg border border-muted max-w-full h-auto my-4',
      },
      uploadFunction: handleImageKitUpload,
      onOpenLibrary: handleOpenImageLibrary,
    }),
    TextAlign.configure({
      types: ['heading', 'paragraph'],
      alignments: ['left', 'center', 'right', 'justify'],
      defaultAlignment: 'left',
    }),
    FontFamily.configure({
      types: ['textStyle'],
    }),
    TextStyle,
    Color,
    Highlight.configure({ 
      multicolor: true,
      HTMLAttributes: {
        class: 'rounded-sm bg-accent/20 px-1 py-0.5',
      },
    }),
    Underline,
    TaskList,
    TaskItem.configure({
      nested: true,
      HTMLAttributes: {
        class: 'flex items-start my-1',
      },
    }),
    HorizontalRule.configure({
      HTMLAttributes: {
        class: 'my-4 border-t border-muted',
      },
    }),
    CharacterCount,
    Dropcursor,
    Gapcursor,
    SlashCommand,
  ];

  // Function to trigger file input for image upload
  const triggerImageUpload = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file && editor) {
        console.log('Manual upload triggered for file:', file.name);
        setSaveStatus('Saving');
        editor.commands.uploadImage(file);
        // Reset status after a delay to allow upload to complete
        setTimeout(() => {
          setSaveStatus('Saved');
        }, 3000);
      }
    };
    input.click();
  };

  const editor = useEditor({
    extensions,
    content: typeof initialContent === 'string' 
      ? (initialContent || (showBaseTemplate ? createBaseTemplate() : ''))
      : (initialContent || (showBaseTemplate ? createBaseTemplate() : '')),
    editable,
    editorProps: {
      attributes: {
        class: `prose prose-lg dark:prose-invert prose-headings:font-title font-default focus:outline-none max-w-full prose-pre:bg-muted prose-pre:text-foreground prose-img:my-4 prose-p:leading-relaxed prose-headings:tracking-tight ${className}`,
      },
      handleDrop: (view, event, slice, moved) => {
        // Handle file drops
        const hasFiles = event.dataTransfer?.files?.length;
        if (hasFiles && event.dataTransfer.files[0]) {
          const file = event.dataTransfer.files[0];
          if (file.type.includes('image/')) {
            // Handle image upload with ImageKit via extension
            event.preventDefault();
            if (editor) {
              console.log('Dropping image file:', file.name);
              setSaveStatus('Saving');
              editor.commands.uploadImage(file);
              // Reset status after a delay to allow upload to complete
              setTimeout(() => {
                setSaveStatus('Saved');
              }, 3000);
            }
            return true;
          }
        }
        return false;
      },
      handlePaste: (view, event, slice) => {
        // Handle image paste
        const items = Array.from(event.clipboardData?.items || []);
        const imageItem = items.find(item => item.type.includes('image/'));
        
        if (imageItem) {
          const file = imageItem.getAsFile();
          if (file && editor) {
            event.preventDefault();
            console.log('Pasting image file:', file.name);
            setSaveStatus('Saving');
            editor.commands.uploadImage(file);
            // Reset status after a delay to allow upload to complete
            setTimeout(() => {
              setSaveStatus('Saved');
            }, 3000);
            return true;
          }
        }
        return false;
      },
    },
    onUpdate: ({ editor }: { editor: Editor }) => {
      setSaveStatus('Unsaved');
      debouncedUpdates(editor);
    },
  });

  const debouncedUpdates = useDebouncedCallback((editor: Editor) => {
    const html = editor.getHTML();
    const text = editor.getText();
    const json = editor.getJSON();
    
    if (onUpdate) {
      onUpdate(text, html, json);
    }
    
    setSaveStatus('Saved');
  }, 500);

  useEffect(() => {
    if (editor && typeof initialContent === 'string' && initialContent !== editor.getHTML()) {
      editor.commands.setContent(initialContent || (showBaseTemplate ? createBaseTemplate() : ''));
    } else if (editor && typeof initialContent === 'object' && initialContent !== editor.getJSON()) {
      editor.commands.setContent(initialContent || (showBaseTemplate ? createBaseTemplate() : {}));
    }
  }, [initialContent, editor, showBaseTemplate]);

  const handleBlockMenuOpen = (position: { top: number; left: number }) => {
    setBlockMenuPosition(position);
    setBlockMenuVisible(true);
  };

  const handleBlockMenuClose = () => {
    setBlockMenuVisible(false);
  };

  if (!editor) {
    return null;
  }

  return (
    <Provider store={novelStore}>
      <EditorCommandTunnelContext.Provider value={tunnelInstance}>
        <div className="relative w-full">
          {/* Editor */}
          <div className="relative min-h-[600px] w-full bg-background border border-border rounded-lg group overflow-hidden">
            <EditorBubbleMenu editor={editor} />
            
            {/* Block Menu */}
            <BlockMenu 
              editor={editor}
              position={blockMenuPosition}
              visible={blockMenuVisible}
              onClose={handleBlockMenuClose}
            />
            
            {/* Click outside to close block menu */}
            {blockMenuVisible && (
              <div 
                className="fixed inset-0 z-40" 
                onClick={handleBlockMenuClose}
              />
            )}
            
            <div className="relative">
              <EditorContent 
                editor={editor} 
                className="px-8 py-6 prose-lg prose-headings:mb-4 prose-p:mb-4 prose-ul:mb-4 prose-ol:mb-4 prose-blockquote:mb-4 prose-pre:mb-4 prose-hr:mb-4 min-h-[500px] focus-within:outline-none" 
              />
              
              {/* Professional Empty State */}
              {!showBaseTemplate && editor.getText().trim() === '' && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="text-center max-w-md mx-auto px-6">
                    <div className="text-4xl mb-4">✍️</div>
                    <h3 className="text-lg font-semibold text-foreground mb-2">
                      Start crafting your story
                    </h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Begin writing your newsletter content. Use "/" to access commands for formatting, adding images, and more.
                    </p>
                    <div className="flex flex-wrap gap-2 justify-center text-xs text-muted-foreground">
                      <span className="bg-muted px-2 py-1 rounded">/ for commands</span>
                      <span className="bg-muted px-2 py-1 rounded">Drag & drop images</span>
                      <span className="bg-muted px-2 py-1 rounded">Paste from clipboard</span>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Image Upload Progress */}
              {isUploading && (
                <div className="absolute top-3 right-3 bg-background/95 backdrop-blur-sm border border-border rounded-lg p-3 shadow-lg min-w-[250px]">
                  <div className="flex items-center gap-2 mb-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-sm font-medium">Uploading image...</span>
                  </div>
                  <Progress value={uploadProgress} className="w-full h-2" />
                  <div className="text-xs text-muted-foreground mt-1">
                    {uploadProgress}% complete
                  </div>
                </div>
              )}
              
              {/* Word count in bottom right */}
              {editor && (
                <div className="absolute bottom-3 right-3 text-xs text-muted-foreground/50 bg-background/90 backdrop-blur-sm px-2 py-1 rounded-md border border-border/50">
                  {saveStatus} · {editor.storage.characterCount?.words() || 0} words
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Image Library Modal */}
        <ImageLibrary
          open={imageLibraryOpen}
          onClose={() => setImageLibraryOpen(false)}
          onImageSelect={handleImageSelect}
        />
      </EditorCommandTunnelContext.Provider>
    </Provider>
  );
}
