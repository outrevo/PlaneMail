'use client';

import React, { useState, useEffect } from 'react';
import { Editor } from '@tiptap/react';
import { Button } from '@/components/ui/button';
import { 
  Plus,
  GripVertical,
  Type,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Code,
  Image,
  Minus
} from 'lucide-react';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface BlockMenuProps {
  editor: Editor;
  position: { top: number; left: number };
  visible: boolean;
  onClose: () => void;
}

export const BlockMenu = ({ editor, position, visible, onClose }: BlockMenuProps) => {
  if (!visible) return null;

  const insertBlock = (type: string) => {
    const { from } = editor.state.selection;
    
    switch (type) {
      case 'heading1':
        editor.chain().focus().setHeading({ level: 1 }).run();
        break;
      case 'heading2':
        editor.chain().focus().setHeading({ level: 2 }).run();
        break;
      case 'heading3':
        editor.chain().focus().setHeading({ level: 3 }).run();
        break;
      case 'paragraph':
        editor.chain().focus().setParagraph().run();
        break;
      case 'bulletList':
        editor.chain().focus().toggleBulletList().run();
        break;
      case 'orderedList':
        editor.chain().focus().toggleOrderedList().run();
        break;
      case 'blockquote':
        editor.chain().focus().toggleBlockquote().run();
        break;
      case 'codeBlock':
        editor.chain().focus().toggleCodeBlock().run();
        break;
      case 'horizontalRule':
        editor.chain().focus().setHorizontalRule().run();
        break;
      case 'image':
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.onchange = (e: any) => {
          const file = e.target?.files?.[0];
          if (file && file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = (e: any) => {
              const src = e.target?.result;
              if (src) {
                editor.chain().focus().setImage({ src, alt: file.name }).run();
              }
            };
            reader.readAsDataURL(file);
          }
        };
        input.click();
        break;
    }
    onClose();
  };

  const menuItems = [
    { id: 'paragraph', label: 'Text', icon: Type, description: 'Plain text paragraph' },
    { id: 'heading1', label: 'Heading 1', icon: Heading1, description: 'Large heading' },
    { id: 'heading2', label: 'Heading 2', icon: Heading2, description: 'Medium heading' },
    { id: 'heading3', label: 'Heading 3', icon: Heading3, description: 'Small heading' },
    { id: 'bulletList', label: 'Bullet List', icon: List, description: 'Bulleted list' },
    { id: 'orderedList', label: 'Numbered List', icon: ListOrdered, description: 'Numbered list' },
    { id: 'blockquote', label: 'Quote', icon: Quote, description: 'Quote block' },
    { id: 'codeBlock', label: 'Code', icon: Code, description: 'Code block' },
    { id: 'image', label: 'Image', icon: Image, description: 'Upload image' },
    { id: 'horizontalRule', label: 'Divider', icon: Minus, description: 'Horizontal line' },
  ];

  return (
    <div 
      className="fixed z-50 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-2 min-w-[280px]"
      style={{ 
        top: position.top, 
        left: position.left,
        maxHeight: '400px',
        overflowY: 'auto'
      }}
    >
      <div className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2 px-2">
        Add a block
      </div>
      {menuItems.map((item) => (
        <button
          key={item.id}
          onClick={() => insertBlock(item.id)}
          className="flex items-center w-full p-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
        >
          <div className="flex items-center justify-center w-8 h-8 mr-3 rounded border">
            <item.icon className="w-4 h-4" />
          </div>
          <div>
            <div className="font-medium text-sm">{item.label}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">{item.description}</div>
          </div>
        </button>
      ))}
    </div>
  );
};

interface BlockIndicatorProps {
  editor: Editor;
  position: number;
  onMenuOpen: (position: { top: number; left: number }) => void;
}

export const BlockIndicator = ({ editor, position, onMenuOpen }: BlockIndicatorProps) => {
  const [isHovered, setIsHovered] = useState(false);

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const rect = e.currentTarget.getBoundingClientRect();
    onMenuOpen({
      top: rect.bottom + 5,
      left: rect.left
    });
  };

  return (
    <div 
      className={`absolute left-0 flex items-center gap-1 transition-opacity ${
        isHovered ? 'opacity-100' : 'opacity-0 hover:opacity-100'
      }`}
      style={{ top: position }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Button
        size="sm"
        variant="ghost"
        className="w-6 h-6 p-0 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
        onClick={handleClick}
      >
        <Plus className="w-4 h-4" />
      </Button>
      <Button
        size="sm"
        variant="ghost"
        className="w-6 h-6 p-0 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 cursor-grab"
      >
        <GripVertical className="w-4 h-4" />
      </Button>
    </div>
  );
};
