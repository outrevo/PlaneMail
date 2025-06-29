'use client';

import './editor.css';
import React, { useEffect, useState, useRef } from 'react';
import { EditorProvider, useEditor, EditorContent, type Editor, BubbleMenu, type JSONContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Link from '@tiptap/extension-link';
import TextStyle from '@tiptap/extension-text-style';
import { Color } from '@tiptap/extension-color';
import Highlight from '@tiptap/extension-highlight';
import Underline from '@tiptap/extension-underline';
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
  Code2
} from 'lucide-react';
import { Provider } from 'jotai';
import tunnel from 'tunnel-rat';
import { novelStore } from './store';
import { EditorCommandTunnelContext } from './editor-command-context';
import { createBaseTemplate } from './slash-commands';
import { BlockMenu, BlockIndicator } from './block-menu';
import SlashCommand from './slash-command-extension';
import { EnhancedImage } from './enhanced-image-extension';

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

  return (
    <BubbleMenu
      editor={editor}
      tippyOptions={{ 
        duration: 100,
        onShow: () => setIsOpen(true),
        onHide: () => setIsOpen(false),
      }}
      className="bg-background border border-border rounded-lg shadow-xl p-1 flex items-center gap-1"
    >
      {/* Text Formatting */}
      <Button
        size="sm"
        variant={editor.isActive('bold') ? 'default' : 'ghost'}
        onClick={toggleBold}
        className="h-8 w-8 p-0"
      >
        <Bold className="h-4 w-4" />
      </Button>

      <Button
        size="sm"
        variant={editor.isActive('italic') ? 'default' : 'ghost'}
        onClick={toggleItalic}
        className="h-8 w-8 p-0"
      >
        <Italic className="h-4 w-4" />
      </Button>

      <Button
        size="sm"
        variant={editor.isActive('underline') ? 'default' : 'ghost'}
        onClick={toggleUnderline}
        className="h-8 w-8 p-0"
      >
        <UnderlineIcon className="h-4 w-4" />
      </Button>

      <Button
        size="sm"
        variant={editor.isActive('strike') ? 'default' : 'ghost'}
        onClick={toggleStrike}
        className="h-8 w-8 p-0"
      >
        <Strikethrough className="h-4 w-4" />
      </Button>

      <Button
        size="sm"
        variant={editor.isActive('code') ? 'default' : 'ghost'}
        onClick={toggleCode}
        className="h-8 w-8 p-0"
      >
        <Code className="h-4 w-4" />
      </Button>

      <Separator orientation="vertical" className="mx-1 h-6" />

      <Button
        size="sm"
        variant={editor.isActive('highlight') ? 'default' : 'ghost'}
        onClick={toggleHighlight}
        className="h-8 w-8 p-0"
      >
        <Highlighter className="h-4 w-4" />
      </Button>

      <Separator orientation="vertical" className="mx-1 h-6" />

      {/* Headings */}
      <Button
        size="sm"
        variant={editor.isActive('heading', { level: 1 }) ? 'default' : 'ghost'}
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        className="h-8 w-8 p-0"
      >
        <Heading1 className="h-4 w-4" />
      </Button>

      <Button
        size="sm"
        variant={editor.isActive('heading', { level: 2 }) ? 'default' : 'ghost'}
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        className="h-8 w-8 p-0"
      >
        <Heading2 className="h-4 w-4" />
      </Button>

      <Button
        size="sm"
        variant={editor.isActive('heading', { level: 3 }) ? 'default' : 'ghost'}
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        className="h-8 w-8 p-0"
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
      >
        <List className="h-4 w-4" />
      </Button>

      <Button
        size="sm"
        variant={editor.isActive('orderedList') ? 'default' : 'ghost'}
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        className="h-8 w-8 p-0"
      >
        <ListOrdered className="h-4 w-4" />
      </Button>

      <Separator orientation="vertical" className="mx-1 h-6" />

      {/* Link */}
      {editor.isActive('link') ? (
        <Button
          size="sm"
          variant="default"
          onClick={unsetLink}
          className="h-8 w-8 p-0"
        >
          <Unlink className="h-4 w-4" />
        </Button>
      ) : (
        <Button
          size="sm"
          variant="ghost"
          onClick={setLink}
          className="h-8 w-8 p-0"
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
  const tunnelInstance = useRef(tunnel()).current;

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
      allowBase64: true,
      HTMLAttributes: {
        class: 'rounded-lg border border-muted max-w-full h-auto my-4',
      },
    }),
    TextStyle,
    Color,
    Highlight.configure({ 
      multicolor: true,
      HTMLAttributes: {
        class: 'rounded-sm bg-yellow-200 dark:bg-yellow-800 px-1 py-0.5',
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

  const editor = useEditor({
    extensions,
    content: typeof initialContent === 'string' 
      ? (initialContent || (showBaseTemplate ? createBaseTemplate() : ''))
      : (initialContent || (showBaseTemplate ? createBaseTemplate() : '')),
    editable,
    editorProps: {
      attributes: {
        class: `prose prose-lg dark:prose-invert prose-headings:font-title font-default focus:outline-none max-w-full prose-pre:bg-muted prose-pre:text-foreground prose-img:my-4 ${className}`,
      },
      handleDrop: (view, event, slice, moved) => {
        // Handle file drops
        const hasFiles = event.dataTransfer?.files?.length;
        if (hasFiles && event.dataTransfer.files[0]) {
          const file = event.dataTransfer.files[0];
          if (file.type.includes('image/')) {
            // Handle image upload
            event.preventDefault();
            const reader = new FileReader();
            reader.onload = (e) => {
              const base64 = e.target?.result as string;
              editor?.chain().focus().setImage({ 
                src: base64,
                alt: file.name,
                title: file.name
              }).run();
            };
            reader.readAsDataURL(file);
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
          if (file) {
            event.preventDefault();
            const reader = new FileReader();
            reader.onload = (e) => {
              const base64 = e.target?.result as string;
              editor?.chain().focus().setImage({ 
                src: base64,
                alt: 'Pasted image',
                title: 'Pasted image'
              }).run();
            };
            reader.readAsDataURL(file);
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
          {/* Save Status */}
          <div className="absolute right-5 top-5 z-10 mb-5 gap-2 flex">
            <div className="rounded-lg bg-accent px-2 py-1 text-sm text-muted-foreground">
              {saveStatus}
            </div>
            <div className="rounded-lg bg-accent px-2 py-1 text-sm text-muted-foreground">
              {editor.storage.characterCount?.words() || 0} words
            </div>
            <div className="rounded-lg bg-accent px-2 py-1 text-sm text-muted-foreground">
              {editor.storage.characterCount?.characters() || 0} characters
            </div>
          </div>

          {/* Editor */}
          <div className="relative min-h-[600px] w-full bg-background group">
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
                className="px-12 py-8 prose-lg prose-headings:mb-4 prose-p:mb-4 prose-ul:mb-4 prose-ol:mb-4 prose-blockquote:mb-4 prose-pre:mb-4 prose-hr:mb-4 min-h-[500px]" 
              />
              
              {/* Subtle word count in bottom left */}
              {editor && (
                <div className="absolute bottom-2 left-2 text-xs text-muted-foreground/60 bg-background/80 backdrop-blur-sm px-2 py-1 rounded">
                  {editor.storage.characterCount.words} words · {editor.storage.characterCount.characters} characters
                </div>
              )}
            </div>
            
            {/* Empty state helper */}
            {editor.isEmpty && (
              <div className="absolute inset-0 px-12 py-8 pointer-events-none">
                <div className="text-muted-foreground text-lg">
                  <div className="mb-4 text-2xl font-semibold">Start writing...</div>
                  <div className="space-y-2 text-sm">
                    <div>• Type <kbd className="px-1 py-0.5 bg-muted rounded text-xs font-mono">/</kbd> for commands</div>
                    <div>• Drag and drop images to upload</div>
                    <div>• Paste images from clipboard</div>
                    <div>• Use the bubble menu for formatting</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </EditorCommandTunnelContext.Provider>
    </Provider>
  );
}
