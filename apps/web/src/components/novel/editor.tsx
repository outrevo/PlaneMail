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
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
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
  ChevronDown,
  GripVertical,
  Search,
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
import { AnimatePresence, motion } from 'framer-motion'; // Added for smooth animations

// Import the provided ImageLibrary component
import { ImageLibrary } from './image-library'; // Adjust the import path as needed

interface NovelEditorProps {
  initialContent?: string | JSONContent;
  onUpdate?: (content: string, html: string, json: JSONContent) => void;
  placeholder?: string;
  className?: string;
  editable?: boolean;
  showBaseTemplate?: boolean;
  // Callback when campaign meta (subject, preheader etc.) change
  onMetaChange?: (meta: { subject: string; preheader: string; fromName: string; fromEmail: string }) => void;
  defaultMeta?: { subject?: string; preheader?: string; fromName?: string; fromEmail?: string };
  mode?: 'embedded' | 'campaign'; // embedded = minimal (for workflow wrapper), campaign = standalone full UI
  onComplianceChange?: (status: ComplianceStatus) => void;
  hideComplianceSnippets?: boolean; // allow parent to control snippets insertion UI
}

interface ComplianceStatus {
  hasUnsubscribe: boolean;
  hasSenderAddress: boolean;
  wordCount: number;
  readingTimeMin: number;
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
    const url = window.prompt('Enter URL', previousUrl || 'https://');
    if (url === null) return;
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  };

  const unsetLink = () => editor.chain().focus().unsetLink().run();

  const openImageLibrary = () => editor.commands.openImageLibrary();

  return (
    <BubbleMenu
      editor={editor}
      tippyOptions={{ 
        duration: 200,
        animation: 'shift-away',
        onShow: () => setIsOpen(true),
        onHide: () => setIsOpen(false),
        placement: 'top',
        maxWidth: 'none',
      }}
      className="bubble-menu-glass backdrop-blur-md bg-background/80 border border-border/50 rounded-xl shadow-lg p-1 flex items-center gap-1"
    >
      {/* Grouped Formatting */}
      <div className="flex items-center bg-muted/50 rounded-lg p-0.5">
        <Button size="sm" variant={editor.isActive('bold') ? 'secondary' : 'ghost'} onClick={toggleBold} className="h-7 w-7 p-0" title="Bold (Ctrl+B)"><Bold className="h-4 w-4" /></Button>
        <Button size="sm" variant={editor.isActive('italic') ? 'secondary' : 'ghost'} onClick={toggleItalic} className="h-7 w-7 p-0" title="Italic (Ctrl+I)"><Italic className="h-4 w-4" /></Button>
        <Button size="sm" variant={editor.isActive('underline') ? 'secondary' : 'ghost'} onClick={toggleUnderline} className="h-7 w-7 p-0" title="Underline (Ctrl+U)"><UnderlineIcon className="h-4 w-4" /></Button>
        <Button size="sm" variant={editor.isActive('strike') ? 'secondary' : 'ghost'} onClick={toggleStrike} className="h-7 w-7 p-0" title="Strikethrough"><Strikethrough className="h-4 w-4" /></Button>
      </div>

      <Separator orientation="vertical" className="mx-1 h-5 bg-border/50" />

      {/* Headings and Lists */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button size="sm" variant="ghost" className="h-7 px-2 gap-1 text-xs"><Type className="h-4 w-4" />Style<ChevronDown className="h-3 w-3" /></Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="dropdown-glass backdrop-blur-md bg-background/90 border-border/50" sideOffset={8}>
          <DropdownMenuItem onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}><Heading1 className="mr-2 h-4 w-4" />Heading 1</DropdownMenuItem>
          <DropdownMenuItem onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}><Heading2 className="mr-2 h-4 w-4" />Heading 2</DropdownMenuItem>
          <DropdownMenuItem onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}><Heading3 className="mr-2 h-4 w-4" />Heading 3</DropdownMenuItem>
          <Separator className="my-1" />
          <DropdownMenuItem onClick={() => editor.chain().focus().toggleBulletList().run()}><List className="mr-2 h-4 w-4" />Bullet List</DropdownMenuItem>
          <DropdownMenuItem onClick={() => editor.chain().focus().toggleOrderedList().run()}><ListOrdered className="mr-2 h-4 w-4" />Numbered List</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Separator orientation="vertical" className="mx-1 h-5 bg-border/50" />

      {/* Alignment */}
      <div className="flex items-center bg-muted/50 rounded-lg p-0.5">
        <Button size="sm" variant={editor.isActive({ textAlign: 'left' }) ? 'secondary' : 'ghost'} onClick={setAlignLeft} className="h-7 w-7 p-0" title="Align Left"><AlignLeft className="h-4 w-4" /></Button>
        <Button size="sm" variant={editor.isActive({ textAlign: 'center' }) ? 'secondary' : 'ghost'} onClick={setAlignCenter} className="h-7 w-7 p-0" title="Align Center"><AlignCenter className="h-4 w-4" /></Button>
        <Button size="sm" variant={editor.isActive({ textAlign: 'right' }) ? 'secondary' : 'ghost'} onClick={setAlignRight} className="h-7 w-7 p-0" title="Align Right"><AlignRight className="h-4 w-4" /></Button>
        <Button size="sm" variant={editor.isActive({ textAlign: 'justify' }) ? 'secondary' : 'ghost'} onClick={setAlignJustify} className="h-7 w-7 p-0" title="Justify"><AlignJustify className="h-4 w-4" /></Button>
      </div>

      <Separator orientation="vertical" className="mx-1 h-5 bg-border/50" />

      {/* Advanced Tools */}
      <div className="flex items-center bg-muted/50 rounded-lg p-0.5">
        <Button size="sm" variant={editor.isActive('highlight') ? 'secondary' : 'ghost'} onClick={toggleHighlight} className="h-7 w-7 p-0" title="Highlight"><Highlighter className="h-4 w-4" /></Button>
        <Button size="sm" variant={editor.isActive('code') ? 'secondary' : 'ghost'} onClick={toggleCode} className="h-7 w-7 p-0" title="Code"><Code className="h-4 w-4" /></Button>
        {editor.isActive('link') ? (
          <Button size="sm" variant="secondary" onClick={unsetLink} className="h-7 w-7 p-0" title="Remove Link"><Unlink className="h-4 w-4" /></Button>
        ) : (
          <Button size="sm" variant="ghost" onClick={setLink} className="h-7 w-7 p-0" title="Add Link"><LinkIcon className="h-4 w-4" /></Button>
        )}
        <Button size="sm" variant="ghost" onClick={openImageLibrary} className="h-7 w-7 p-0" title="Insert Image"><ImageIcon className="h-4 w-4" /></Button>
      </div>

      {/* Font Family (Submenu for sleekness) */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button size="sm" variant="ghost" className="h-7 px-2 gap-1 text-xs"><FontIcon className="h-4 w-4" />Font<ChevronDown className="h-3 w-3" /></Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="dropdown-glass backdrop-blur-md bg-background/90 border-border/50" sideOffset={8}>
          <DropdownMenuItem onClick={() => editor.chain().focus().setFontFamily('Inter, sans-serif').run()} className="font-sans">Inter (Default)</DropdownMenuItem>
          <DropdownMenuItem onClick={() => editor.chain().focus().setFontFamily('serif').run()} className="font-serif">Serif</DropdownMenuItem>
          <DropdownMenuItem onClick={() => editor.chain().focus().setFontFamily('Georgia, serif').run()} style={{ fontFamily: 'Georgia, serif' }}>Georgia</DropdownMenuItem>
          <DropdownMenuItem onClick={() => editor.chain().focus().setFontFamily('Times New Roman, serif').run()} style={{ fontFamily: 'Times New Roman, serif' }}>Times New Roman</DropdownMenuItem>
          <DropdownMenuItem onClick={() => editor.chain().focus().setFontFamily('Helvetica, sans-serif').run()} style={{ fontFamily: 'Helvetica, sans-serif' }}>Helvetica</DropdownMenuItem>
          <DropdownMenuItem onClick={() => editor.chain().focus().setFontFamily('Arial, sans-serif').run()} style={{ fontFamily: 'Arial, sans-serif' }}>Arial</DropdownMenuItem>
          <DropdownMenuItem onClick={() => editor.chain().focus().setFontFamily('Monaco, Consolas, monospace').run()} className="font-mono">Monospace</DropdownMenuItem>
          <DropdownMenuItem onClick={() => editor.chain().focus().unsetFontFamily().run()}>Reset</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </BubbleMenu>
  );
};

// Helper to evaluate compliance from HTML
function evaluateCompliance(html: string): ComplianceStatus {
  const lower = html.toLowerCase();
  const hasUnsubscribe = lower.includes('{{unsubscribe_url}}') || /unsubscribe/i.test(lower);
  const hasSenderAddress = lower.includes('{{sender_address}}');
  const textOnly = html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  const words = textOnly ? textOnly.split(' ').length : 0;
  return {
    hasUnsubscribe,
    hasSenderAddress,
    wordCount: words,
    readingTimeMin: Math.max(1, Math.round(words / 200) || 1),
  };
}

// Quick insert helpers
const complianceSnippets = {
  unsubscribe: '<p>If you no longer wish to receive these emails you can <a href="{{UNSUBSCRIBE_URL}}">unsubscribe here</a>.</p>',
  senderAddress: '<p class="sender-address">{{SENDER_ADDRESS}}</p>',
  viewOnline: '<p><a href="{{VIEW_ON_WEB_URL}}" target="_blank" rel="noopener noreferrer">View this email in your browser</a></p>',
};

// Footer templates for quick insertion
const footerTemplates = [
  { 
    name: 'Basic', 
    html: '<div style="margin-top: 32px; border-top: 1px solid #e0e0e0; padding-top: 16px; font-size: 12px; color: #666;"><p>You are receiving this email because you subscribed to our updates.</p><p><a href="{{UNSUBSCRIBE_URL}}" style="color: #007aff;">Unsubscribe</a> | {{SENDER_ADDRESS}}</p></div>'
  },
  { 
    name: 'Centered', 
    html: '<div style="text-align: center; margin-top: 32px; border-top: 1px solid #e0e0e0; padding-top: 16px; font-size: 12px; color: #666;"><p>—</p><p>You subscribed to our updates.</p><p><a href="{{UNSUBSCRIBE_URL}}" style="color: #007aff;">Unsubscribe</a> · {{SENDER_ADDRESS}}</p></div>'
  },
  { 
    name: 'Minimal', 
    html: '<hr style="margin: 32px 0 16px 0; border: none; border-top: 1px solid #e0e0e0;" /><div style="font-size: 12px; color: #888;"><p>If you no longer wish to receive these emails, you can <a href="{{UNSUBSCRIBE_URL}}" style="color: #007aff;">unsubscribe here</a>.</p><p>{{SENDER_ADDRESS}}</p></div>'
  },
];

export function NovelEditor({
  initialContent = '',
  onUpdate,
  placeholder = 'Type / for blocks, or start writing...',
  className = '',
  editable = true,
  showBaseTemplate = true,
  onMetaChange,
  defaultMeta = {},
  mode = 'embedded',
  onComplianceChange,
  hideComplianceSnippets = false,
}: NovelEditorProps) {
  // Core editor state
  const [saveStatus, setSaveStatus] = useState('Saved');
  const [compliance, setCompliance] = useState<ComplianceStatus>({ 
    hasUnsubscribe: false, 
    hasSenderAddress: false, 
    wordCount: 0, 
    readingTimeMin: 1 
  });
  
  // UI state
  const [imageLibraryOpen, setImageLibraryOpen] = useState(false);
  const [showSettings, setShowSettings] = useState(mode === 'campaign');
  const [showBlocks, setShowBlocks] = useState(mode === 'campaign');
  const [previewMode, setPreviewMode] = useState<'desktop' | 'mobile' | 'raw'>('desktop');
  const [mergeTagMenuOpen, setMergeTagMenuOpen] = useState(false);
  
  // Campaign metadata
  const [meta, setMeta] = useState({
    subject: defaultMeta.subject || '',
    preheader: defaultMeta.preheader || '',
    fromName: defaultMeta.fromName || '',
    fromEmail: defaultMeta.fromEmail || '',
  });
  
  // Constants
  const mergeTags = [
    { label: 'First Name', tag: '{{FIRST_NAME}}', description: 'Subscriber\'s first name' },
    { label: 'Last Name', tag: '{{LAST_NAME}}', description: 'Subscriber\'s last name' },
    { label: 'Email', tag: '{{EMAIL}}', description: 'Subscriber\'s email address' },
    { label: 'Unsubscribe URL', tag: '{{UNSUBSCRIBE_URL}}', description: 'One-click unsubscribe link' },
    { label: 'Sender Address', tag: '{{SENDER_ADDRESS}}', description: 'Physical mailing address' },
    { label: 'View Online URL', tag: '{{VIEW_ON_WEB_URL}}', description: 'View email in browser link' },
  ];
  
  const tunnelInstance = useRef(tunnel()).current;
  const { uploadImage, isUploading, uploadProgress } = useImageUpload();

  // Image handling
  const handleImageKitUpload = async (file: File) => {
    try {
      const result = await uploadImage(file, { folder: 'planemail/posts', tags: 'post-image' });
      return result ?? null;
    } catch (error) {
      console.error('Upload failed:', error);
      return null;
    }
  };

  const handleOpenImageLibrary = () => setImageLibraryOpen(true);

  const handleImageSelect = (image: any) => {
    if (editor) {
      const { selection } = editor.state;
      if (selection instanceof NodeSelection && selection.node.type.name === 'enhancedImage') {
        editor.commands.updateAttributes('enhancedImage', {
          src: image.emailOptimizedUrl,
          alt: image.filename,
          title: image.filename,
        });
      } else {
        editor.commands.setImage({
          src: image.emailOptimizedUrl,
          alt: image.filename,
          title: image.filename,
        });
      }
    }
    setImageLibraryOpen(false);
  };

  // Content insertion helpers
  const insertSnippet = (key: keyof typeof complianceSnippets) => {
    if (!editor) return;
    editor.chain().focus().insertContent(complianceSnippets[key]).run();
    updateComplianceAndStatus();
  };

  const insertFooter = (template: { name: string; html: string }) => {
    if (!editor) return;
    editor.chain().focus().insertContent(template.html).run();
    updateComplianceAndStatus();
  };

  const insertMergeTag = (tag: string) => {
    if (!editor) return;
    editor.chain().focus().insertContent(tag).run();
    setMergeTagMenuOpen(false);
    updateComplianceAndStatus();
  };

  // Utility to update compliance and save status
  const updateComplianceAndStatus = () => {
    if (!editor) return;
    const html = editor.getHTML();
    const newCompliance = evaluateCompliance(html);
    setCompliance(newCompliance);
    onComplianceChange?.(newCompliance);
    setSaveStatus('Unsaved');
  };

  // Campaign metadata handling
  const updateMeta = (field: keyof typeof meta, value: string) => {
    const updatedMeta = { ...meta, [field]: value };
    setMeta(updatedMeta);
    onMetaChange?.(updatedMeta);
  };

  // Test send functionality
  const sendTest = async () => {
    if (!editor) return;
    
    try {
      setSaveStatus('Sending test...');
      const response = await fetch('/api/email/test-send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: meta.subject || 'Test Email',
          fromName: meta.fromName || 'Test Sender',
          fromEmail: meta.fromEmail || 'no-reply@example.com',
          html: editor.getHTML(),
        }),
      });
      
      if (response.ok) {
        setSaveStatus('Test sent!');
        setTimeout(() => setSaveStatus('Saved'), 2000);
      } else {
        throw new Error('Failed to send test');
      }
    } catch (error) {
      console.error('Test send failed:', error);
      setSaveStatus('Test failed');
      setTimeout(() => setSaveStatus('Saved'), 2000);
    }
  };

  // Primary send action
  const handlePrimaryAction = () => {
    if (!editor) return;
    console.log('Primary send action', { meta, html: editor.getHTML() });
    // TODO: Implement actual sending logic
  };

  const extensions = [
    StarterKit.configure({
      bulletList: { keepMarks: true, keepAttributes: false },
      orderedList: { keepMarks: true, keepAttributes: false },
    }),
    Placeholder.configure({ placeholder, showOnlyWhenEditable: true, emptyNodeClass: 'is-editor-empty' }),
    Link.configure({
      openOnClick: false,
      autolink: true,
      defaultProtocol: 'https',
      HTMLAttributes: { class: 'text-primary underline underline-offset-4 hover:text-primary/80 transition-colors cursor-pointer' },
    }),
    EnhancedImage.configure({
      allowBase64: true,
      HTMLAttributes: { class: 'rounded-md border border-border/50 max-w-full h-auto my-6 shadow-sm' },
      uploadFunction: handleImageKitUpload,
      onOpenLibrary: handleOpenImageLibrary,
    }),
    TextAlign.configure({ types: ['heading', 'paragraph'], alignments: ['left', 'center', 'right', 'justify'], defaultAlignment: 'left' }),
    FontFamily.configure({ types: ['textStyle'] }),
    TextStyle,
    Color,
    Highlight.configure({ multicolor: true, HTMLAttributes: { class: 'rounded-sm bg-accent/20 px-1 py-0.5' } }),
    Underline,
    TaskList,
    TaskItem.configure({ nested: true, HTMLAttributes: { class: 'flex items-start my-1' } }),
    HorizontalRule.configure({ HTMLAttributes: { class: 'my-6 border-t border-border/50' } }),
    CharacterCount,
    Dropcursor,
    Gapcursor,
    SlashCommand, // Assume this is enhanced with icons and categories for Notion-style
  ];

  const triggerImageUpload = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file && editor) {
        setSaveStatus('Saving...');
        editor.commands.uploadImage(file);
        setTimeout(() => setSaveStatus('Saved'), 3000);
      }
    };
    input.click();
  };

  const editor = useEditor({
    extensions,
    content: typeof initialContent === 'string' ? (initialContent || (showBaseTemplate ? createBaseTemplate() : '')) : (initialContent || (showBaseTemplate ? createBaseTemplate() : {})),
    editable,
    editorProps: {
      attributes: {
        class: `prose prose-md dark:prose-invert prose-headings:font-display font-sans focus:outline-none max-w-full prose-pre:bg-muted/50 prose-pre:text-foreground prose-img:my-6 prose-p:leading-normal prose-headings:tracking-tight transition-all ${className}`,
      },
      handleDrop: (view, event, slice, moved) => {
        if (event.dataTransfer?.files?.[0]?.type.includes('image/')) {
          event.preventDefault();
          const file = event.dataTransfer.files[0];
          setSaveStatus('Saving...');
          editor?.commands.uploadImage(file);
          setTimeout(() => setSaveStatus('Saved'), 3000);
          return true;
        }
        return false;
      },
      handlePaste: (view, event) => {
        const imageItem = Array.from(event.clipboardData?.items || []).find(item => item.type.includes('image/'));
        if (imageItem) {
          event.preventDefault();
          const file = imageItem.getAsFile();
          if (file && editor) {
            setSaveStatus('Saving...');
            editor.commands.uploadImage(file);
            setTimeout(() => setSaveStatus('Saved'), 3000);
            return true;
          }
        }
        return false;
      },
    },
    onUpdate: ({ editor }) => {
      setSaveStatus('Unsaved');
      debouncedUpdates(editor);
    },
  });

  const debouncedUpdates = useDebouncedCallback((editor: Editor) => {
    const html = editor.getHTML();
    const text = editor.getText();
    const json = editor.getJSON();
    onUpdate?.(text, html, json);
    const status = evaluateCompliance(html);
    setCompliance(status);
    onComplianceChange?.(status);
    setSaveStatus('Saved');
  }, 750);

  useEffect(() => {
    if (editor) {
      if (typeof initialContent === 'string' && initialContent !== editor.getHTML()) {
        editor.commands.setContent(initialContent || (showBaseTemplate ? createBaseTemplate() : ''));
      } else if (typeof initialContent === 'object' && initialContent !== editor.getJSON()) {
        editor.commands.setContent(initialContent || (showBaseTemplate ? createBaseTemplate() : {}));
      }
      // Evaluate initial compliance
      setCompliance(evaluateCompliance(editor.getHTML()));
    }
  }, [initialContent, editor, showBaseTemplate]);

  // Early return for embedded mode with simplified UI
  if (!editor) return null;
  
  if (mode === 'embedded') {
    return (
      <Provider store={novelStore}>
        <EditorCommandTunnelContext.Provider value={tunnelInstance}>
          <div className={`relative w-full ${className}`}>
            <div className="rounded-md border border-border/40 bg-background/60 backdrop-blur-sm">
              {/* Embedded Header */}
              <div className="flex items-center gap-3 px-3 py-2 border-b border-border/30">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>Words: {compliance.wordCount}</span>
                  <span>•</span>
                  <span>~{compliance.readingTimeMin}m read</span>
                </div>
                <div className={`ml-auto text-[10px] px-2 py-0.5 rounded-full border ${
                  compliance.hasUnsubscribe && compliance.hasSenderAddress 
                    ? 'border-green-500/40 bg-green-500/10 text-green-600' 
                    : 'border-amber-500/40 bg-amber-500/10 text-amber-600'
                }`}>
                  {compliance.hasUnsubscribe && compliance.hasSenderAddress ? '✓ Compliant' : 'Needs compliance'}
                </div>
                {!hideComplianceSnippets && (
                  <div className="flex gap-1">
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="text-[10px] h-6 px-2" 
                      onClick={() => insertSnippet('unsubscribe')}
                      disabled={!editor}
                    >
                      Add Unsubscribe
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="text-[10px] h-6 px-2" 
                      onClick={() => insertSnippet('senderAddress')}
                      disabled={!editor}
                    >
                      Add Address
                    </Button>
                  </div>
                )}
              </div>
              {/* Embedded Editor */}
              <div className="p-4">
                <EditorContent editor={editor} className="focus:outline-none min-h-[320px]" />
              </div>
              {/* Upload Progress */}
              {isUploading && (
                <div className="absolute top-2 right-2 bg-background/90 border border-border/40 rounded-md px-3 py-2 text-xs flex items-center gap-2 shadow-sm">
                  <Progress value={uploadProgress} className="h-1 w-24" />
                  <span>{uploadProgress}%</span>
                </div>
              )}
            </div>
            <EditorBubbleMenu editor={editor} />
          </div>
        </EditorCommandTunnelContext.Provider>
      </Provider>
    );
  }

  // Campaign mode - full editor interface
  const complianceScore = (compliance.hasUnsubscribe ? 50 : 0) + (compliance.hasSenderAddress ? 50 : 0);
  const isCompliant = complianceScore === 100;

  return (
    <Provider store={novelStore}>
      <EditorCommandTunnelContext.Provider value={tunnelInstance}>
        <div className="flex flex-col h-screen w-full overflow-hidden bg-background">
          
          {/* Campaign Header */}
          <div className="flex items-center gap-4 px-4 h-14 border-b border-border/40 bg-background/90 backdrop-blur-sm z-50">
            <div className="flex items-center gap-3">
              <h1 className="font-semibold text-sm">Campaign Editor</h1>
              <div className="flex items-center gap-2">
                <span className={`text-xs px-2 py-1 rounded-full border ${
                  compliance.wordCount > 0 
                    ? 'border-green-500/30 bg-green-500/10 text-green-600' 
                    : 'border-amber-500/30 bg-amber-500/10 text-amber-600'
                }`}>
                  {compliance.wordCount} words
                </span>
                <span className={`text-xs px-2 py-1 rounded-full border ${
                  isCompliant 
                    ? 'border-green-500/30 bg-green-500/10 text-green-600' 
                    : 'border-red-500/30 bg-red-500/10 text-red-600'
                }`}>
                  {isCompliant ? '✓ Compliant' : 'Compliance needed'}
                </span>
              </div>
            </div>

            {/* Header Actions */}
            <div className="flex items-center gap-2 ml-auto">
              {/* Merge Tags Dropdown */}
              <div className="relative">
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="text-xs"
                  onClick={() => setMergeTagMenuOpen(!mergeTagMenuOpen)}
                >
                  Merge Tags
                </Button>
                {mergeTagMenuOpen && (
                  <div className="absolute right-0 mt-1 w-64 bg-popover border border-border/40 rounded-md shadow-lg p-2 z-50">
                    <div className="space-y-1">
                      {mergeTags.map(tag => (
                        <button
                          key={tag.tag}
                          onClick={() => insertMergeTag(tag.tag)}
                          className="w-full text-left text-xs px-2 py-1.5 rounded hover:bg-muted/60 transition-colors"
                        >
                          <div className="font-medium">{tag.label}</div>
                          <div className="text-[10px] text-muted-foreground font-mono">{tag.tag}</div>
                          <div className="text-[10px] text-muted-foreground">{tag.description}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Preview Mode Buttons */}
              <div className="flex items-center border border-border/40 rounded-md overflow-hidden">
                <Button 
                  size="sm" 
                  variant={previewMode === 'desktop' ? 'secondary' : 'ghost'} 
                  className="text-xs rounded-none border-0"
                  onClick={() => setPreviewMode('desktop')}
                >
                  Desktop
                </Button>
                <Button 
                  size="sm" 
                  variant={previewMode === 'mobile' ? 'secondary' : 'ghost'} 
                  className="text-xs rounded-none border-0"
                  onClick={() => setPreviewMode('mobile')}
                >
                  Mobile
                </Button>
                <Button 
                  size="sm" 
                  variant={previewMode === 'raw' ? 'secondary' : 'ghost'} 
                  className="text-xs rounded-none border-0"
                  onClick={() => setPreviewMode('raw')}
                >
                  HTML
                </Button>
              </div>

              <Separator orientation="vertical" className="h-6" />
              
              {/* Status and Actions */}
              <span className={`text-xs ${
                saveStatus === 'Saved' ? 'text-green-600' : 
                saveStatus === 'Unsaved' ? 'text-amber-600' : 
                'text-blue-600'
              }`}>
                {saveStatus}
              </span>
              
              <Button 
                size="sm" 
                variant="outline" 
                className="text-xs"
                onClick={sendTest}
                disabled={!editor || saveStatus.includes('Sending')}
              >
                {saveStatus === 'Sending test...' ? 'Sending...' : 'Send Test'}
              </Button>
              
              <Button 
                size="sm" 
                className="text-xs"
                onClick={handlePrimaryAction}
                disabled={!editor || !isCompliant}
              >
                Send Campaign
              </Button>
            </div>
          </div>
          {/* Main Content Area */}
          <div className="flex flex-1 min-h-0">
            
            {/* Left Sidebar - Blocks */}
            {showBlocks && (
              <div className="w-64 border-r border-border/30 flex flex-col bg-muted/5 overflow-hidden">
                <div className="px-4 py-3 border-b border-border/20 flex items-center justify-between">
                  <h3 className="text-sm font-medium">Content Blocks</h3>
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    className="h-6 w-6 p-0"
                    onClick={() => setShowBlocks(false)}
                  >
                    ×
                  </Button>
                </div>
                
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {/* Compliance Section */}
                  <div className="space-y-2">
                    <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                      Compliance
                    </h4>
                    <div className="space-y-1">
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        className="w-full justify-start text-xs h-8"
                        onClick={() => insertSnippet('unsubscribe')}
                        disabled={!editor}
                      >
                        📧 Unsubscribe Link
                      </Button>
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        className="w-full justify-start text-xs h-8"
                        onClick={() => insertSnippet('senderAddress')}
                        disabled={!editor}
                      >
                        📍 Sender Address
                      </Button>
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        className="w-full justify-start text-xs h-8"
                        onClick={() => insertSnippet('viewOnline')}
                        disabled={!editor}
                      >
                        🌐 View Online
                      </Button>
                    </div>
                    
                    {/* Footer Templates */}
                    <div className="pt-2 border-t border-border/20">
                      <p className="text-[10px] text-muted-foreground mb-2 uppercase tracking-wide">
                        Footer Templates
                      </p>
                      {footerTemplates.map(template => (
                        <Button 
                          key={template.name}
                          size="sm" 
                          variant="outline" 
                          className="w-full justify-start text-xs h-8 mb-1"
                          onClick={() => insertFooter(template)}
                          disabled={!editor}
                        >
                          {template.name} Footer
                        </Button>
                      ))}
                    </div>
                  </div>

                  {/* Layout Elements */}
                  <div className="space-y-2">
                    <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                      Layout
                    </h4>
                    <div className="space-y-1">
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        className="w-full justify-start text-xs h-8"
                        onClick={() => editor?.chain().focus().insertContent('<h2>Heading</h2>').run()}
                        disabled={!editor}
                      >
                        📝 Heading
                      </Button>
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        className="w-full justify-start text-xs h-8"
                        onClick={() => editor?.chain().focus().insertContent('<p>Your content here...</p>').run()}
                        disabled={!editor}
                      >
                        📄 Paragraph
                      </Button>
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        className="w-full justify-start text-xs h-8"
                        onClick={() => editor?.chain().focus().insertContent('<hr />').run()}
                        disabled={!editor}
                      >
                        ➖ Divider
                      </Button>
                    </div>
                  </div>

                  {/* Interactive Elements */}
                  <div className="space-y-2">
                    <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                      Interactive
                    </h4>
                    <div className="space-y-1">
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        className="w-full justify-start text-xs h-8"
                        onClick={() => editor?.chain().focus().insertContent('<p><a href="#" style="display: inline-block; padding: 12px 24px; background-color: #007aff; color: white; text-decoration: none; border-radius: 6px;">Call to Action</a></p>').run()}
                        disabled={!editor}
                      >
                        🔘 Button CTA
                      </Button>
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        className="w-full justify-start text-xs h-8"
                        onClick={() => editor?.chain().focus().insertContent('<blockquote style="border-left: 4px solid #e0e0e0; margin: 16px 0; padding: 8px 16px; background-color: #f8f9fa;">Quote or testimonial text...</blockquote>').run()}
                        disabled={!editor}
                      >
                        💬 Quote Block
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}
            {/* Center Editor Area */}
            <div className="flex-1 flex flex-col min-h-0">
              
              {/* Editor Toolbar */}
              <div className="flex items-center justify-between px-4 py-2 border-b border-border/20 bg-muted/5">
                <div className="flex items-center gap-2">
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    className="text-xs"
                    onClick={() => setShowBlocks(!showBlocks)}
                  >
                    {showBlocks ? 'Hide' : 'Show'} Blocks
                  </Button>
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    className="text-xs"
                    onClick={() => setShowSettings(!showSettings)}
                  >
                    {showSettings ? 'Hide' : 'Show'} Settings
                  </Button>
                </div>
                
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span>Compliance: {compliance.hasUnsubscribe ? '✓' : '✗'} Unsubscribe</span>
                  <span>•</span>
                  <span>{compliance.hasSenderAddress ? '✓' : '✗'} Address</span>
                </div>
              </div>

              {/* Editor Content */}
              <div className={`relative flex-1 overflow-auto transition-all duration-300 ${
                previewMode === 'mobile' 
                  ? 'max-w-[430px] mx-auto border-x bg-muted/5' 
                  : 'max-w-4xl mx-auto'
              } w-full`}>
                
                {previewMode === 'raw' ? (
                  <div className="h-full">
                    <pre className="text-xs p-6 whitespace-pre-wrap break-all font-mono bg-background/80 h-full overflow-auto">
                      {editor.getHTML()}
                    </pre>
                  </div>
                ) : (
                  <div className="px-8 py-6">
                    <EditorContent 
                      editor={editor} 
                      className="focus-within:outline-none min-h-[600px] prose prose-md dark:prose-invert max-w-none" 
                    />
                  </div>
                )}
                
                <EditorBubbleMenu editor={editor} />
                
                {/* Upload Progress Indicator */}
                {isUploading && (
                  <div className="absolute top-4 right-4 bg-background/90 border border-border/40 rounded-md px-3 py-2 text-xs flex items-center gap-2 shadow-lg z-10">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    <span>Uploading {uploadProgress}%</span>
                    <Progress value={uploadProgress} className="h-1 w-20" />
                  </div>
                )}
              </div>
            </div>
            {/* Right Sidebar - Settings */}
            {showSettings && (
              <div className="w-80 border-l border-border/30 flex flex-col bg-muted/5 overflow-hidden">
                <div className="px-4 py-3 border-b border-border/20 flex items-center justify-between">
                  <h3 className="text-sm font-medium">Campaign Settings</h3>
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    className="h-6 w-6 p-0"
                    onClick={() => setShowSettings(false)}
                  >
                    ×
                  </Button>
                </div>
                
                <div className="flex-1 overflow-y-auto p-4 space-y-6">
                  
                  {/* Email Details */}
                  <div className="space-y-4">
                    <h4 className="text-sm font-semibold border-b border-border/20 pb-2">
                      Email Details
                    </h4>
                    
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-medium text-muted-foreground mb-1 uppercase tracking-wide">
                          Subject Line
                        </label>
                        <input 
                          value={meta.subject}
                          onChange={e => updateMeta('subject', e.target.value)}
                          className="w-full h-9 px-3 rounded-md bg-background border border-border/40 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                          placeholder="Enter your subject line"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-xs font-medium text-muted-foreground mb-1 uppercase tracking-wide">
                          Preheader Text
                        </label>
                        <input 
                          value={meta.preheader}
                          onChange={e => updateMeta('preheader', e.target.value)}
                          className="w-full h-9 px-3 rounded-md bg-background border border-border/40 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                          placeholder="Short preview text"
                        />
                        <p className="text-[10px] text-muted-foreground mt-1">
                          Appears after subject in inbox preview
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Sender Information */}
                  <div className="space-y-4">
                    <h4 className="text-sm font-semibold border-b border-border/20 pb-2">
                      Sender Details
                    </h4>
                    
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-medium text-muted-foreground mb-1 uppercase tracking-wide">
                          From Name
                        </label>
                        <input 
                          value={meta.fromName}
                          onChange={e => updateMeta('fromName', e.target.value)}
                          className="w-full h-9 px-3 rounded-md bg-background border border-border/40 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                          placeholder="Your name or brand"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-xs font-medium text-muted-foreground mb-1 uppercase tracking-wide">
                          From Email
                        </label>
                        <input 
                          value={meta.fromEmail}
                          onChange={e => updateMeta('fromEmail', e.target.value)}
                          className="w-full h-9 px-3 rounded-md bg-background border border-border/40 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                          placeholder="sender@yourdomain.com"
                          type="email"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Compliance Status */}
                  <div className="space-y-4">
                    <h4 className="text-sm font-semibold border-b border-border/20 pb-2">
                      Compliance Status
                    </h4>
                    
                    <div className="space-y-3">
                      <div className={`flex items-center gap-2 text-sm ${
                        compliance.hasUnsubscribe ? 'text-green-600' : 'text-red-600'
                      }`}>
                        <span className="text-base">
                          {compliance.hasUnsubscribe ? '✓' : '✗'}
                        </span>
                        <span>Unsubscribe link present</span>
                      </div>
                      
                      <div className={`flex items-center gap-2 text-sm ${
                        compliance.hasSenderAddress ? 'text-green-600' : 'text-red-600'
                      }`}>
                        <span className="text-base">
                          {compliance.hasSenderAddress ? '✓' : '✗'}
                        </span>
                        <span>Physical address included</span>
                      </div>
                      
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span className="text-base">ℹ️</span>
                        <span>Double opt-in handled at signup</span>
                      </div>
                      
                      {!isCompliant && (
                        <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-md">
                          <p className="text-xs text-amber-800 font-medium">
                            ⚠️ Compliance Required
                          </p>
                          <p className="text-xs text-amber-700 mt-1">
                            Add missing elements before sending your campaign.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Content Stats */}
                  <div className="space-y-4">
                    <h4 className="text-sm font-semibold border-b border-border/20 pb-2">
                      Content Statistics
                    </h4>
                    
                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3 rounded-md border border-border/30 bg-background/60">
                        <p className="text-xs text-muted-foreground uppercase tracking-wide">Words</p>
                        <p className="text-lg font-semibold">{compliance.wordCount}</p>
                      </div>
                      
                      <div className="p-3 rounded-md border border-border/30 bg-background/60">
                        <p className="text-xs text-muted-foreground uppercase tracking-wide">Read Time</p>
                        <p className="text-lg font-semibold">~{compliance.readingTimeMin}m</p>
                      </div>
                    </div>
                  </div>

                  {/* Quick Actions */}
                  <div className="space-y-4">
                    <h4 className="text-sm font-semibold border-b border-border/20 pb-2">
                      Quick Actions
                    </h4>
                    
                    <div className="space-y-2">
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="w-full justify-start"
                        onClick={sendTest}
                        disabled={!editor || saveStatus.includes('Sending')}
                      >
                        📧 Send Test Email
                      </Button>
                      
                      <div className="pt-2">
                        <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wide">
                          Insert Footer Templates
                        </p>
                        <div className="space-y-1">
                          {footerTemplates.map(template => (
                            <Button 
                              key={template.name}
                              size="sm" 
                              variant="ghost" 
                              className="w-full justify-start text-xs"
                              onClick={() => insertFooter(template)}
                              disabled={!editor}
                            >
                              {template.name} Footer
                            </Button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                </div>
              </div>
            )}
          </div>

          {/* Floating Image Library */}
          <ImageLibrary 
            open={imageLibraryOpen} 
            onClose={() => setImageLibraryOpen(false)} 
            onImageSelect={handleImageSelect} 
          />
        </div>
      </EditorCommandTunnelContext.Provider>
    </Provider>
  );
}
