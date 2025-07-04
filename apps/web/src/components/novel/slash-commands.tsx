'use client';

import React from 'react';
import { ReactRenderer } from '@tiptap/react';
import tippy from 'tippy.js';
import { Extension } from '@tiptap/core';
import Suggestion from '@tiptap/suggestion';
import { 
  Heading1, 
  Heading2, 
  Heading3, 
  Type, 
  List, 
  ListOrdered, 
  Quote, 
  Code, 
  Image,
  Minus,
  CheckSquare,
  Table,
  Calendar,
  FileText,
  Images
} from 'lucide-react';

export interface SuggestionItem {
  title: string;
  description: string;
  icon: React.ComponentType<any>;
  command: (props: any) => void;
}

export const createSlashCommand = (items: SuggestionItem[]) => {
  return Extension.create({
    name: 'slashCommand',
    
    addOptions() {
      return {
        suggestion: {
          char: '/',
          command: ({ editor, range, props }: any) => {
            props.command({ editor, range });
          },
        },
      };
    },

    addProseMirrorPlugins() {
      return [
        Suggestion({
          editor: this.editor,
          ...this.options.suggestion,
          items: ({ query }: { query: string }) => {
            return items
              .filter(item => 
                item.title.toLowerCase().includes(query.toLowerCase()) ||
                item.description.toLowerCase().includes(query.toLowerCase())
              )
              .slice(0, 10);
          },
          render: () => {
            let component: ReactRenderer;
            let popup: any;

            return {
              onStart: (props: any) => {
                component = new ReactRenderer(SlashCommandList, {
                  props: {
                    ...props,
                    items: props.items || [],
                  },
                  editor: props.editor,
                });

                if (!props.clientRect) {
                  return;
                }

                popup = tippy('body', {
                  getReferenceClientRect: props.clientRect,
                  appendTo: () => document.body,
                  content: component.element,
                  showOnCreate: true,
                  interactive: true,
                  trigger: 'manual',
                  placement: 'bottom-start',
                });
              },
              onUpdate: (props: any) => {
                component?.updateProps({
                  ...props,
                  items: props.items || [],
                });

                if (!props.clientRect) {
                  return;
                }

                popup?.[0]?.setProps({
                  getReferenceClientRect: props.clientRect,
                });
              },
              onKeyDown: (props: any) => {
                if (props.event.key === 'Escape') {
                  popup?.[0]?.hide();
                  return true;
                }
                return (component as any)?.ref?.onKeyDown?.(props) || false;
              },
              onExit: () => {
                popup?.[0]?.destroy();
                component?.destroy();
              },
            };
          },
        }),
      ];
    },
  });
};

interface SlashCommandListProps {
  items: SuggestionItem[];
  command: (item: SuggestionItem) => void;
}

export const SlashCommandList = ({ items, command }: SlashCommandListProps) => {
  const [selectedIndex, setSelectedIndex] = React.useState(0);

  React.useEffect(() => {
    setSelectedIndex(0);
  }, [items]);

  const onKeyDown = React.useCallback(
    (event: KeyboardEvent) => {
      if (event.key === 'ArrowUp') {
        setSelectedIndex((selectedIndex + items.length - 1) % items.length);
        return true;
      }

      if (event.key === 'ArrowDown') {
        setSelectedIndex((selectedIndex + 1) % items.length);
        return true;
      }

      if (event.key === 'Enter') {
        if (items[selectedIndex]) {
          command(items[selectedIndex]);
        }
        return true;
      }

      return false;
    },
    [selectedIndex, items, command],
  );

  React.useEffect(() => {
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [onKeyDown]);

  return (
    <div className="z-50 max-h-80 overflow-y-auto rounded-md border border-border bg-popover p-1 shadow-lg">
      {items.length === 0 ? (
        <div className="px-2 py-1 text-sm text-muted-foreground">No results</div>
      ) : (
        items.map((item, index) => (
          <button
            key={item.title}
            className={`flex w-full items-center space-x-2 rounded-sm px-2 py-1 text-left text-sm hover:bg-accent ${
              index === selectedIndex ? 'bg-accent' : ''
            }`}
            onClick={() => command(item)}
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-sm border border-muted bg-background">
              <item.icon className="h-4 w-4" />
            </div>
            <div>
              <p className="font-medium">{item.title}</p>
              <p className="text-xs text-muted-foreground">{item.description}</p>
            </div>
          </button>
        ))
      )}
    </div>
  );
};

// Default slash command items
export const defaultSlashCommands: SuggestionItem[] = [
  {
    title: 'Heading 1',
    description: 'Large section heading',
    icon: Heading1,
    command: ({ editor, range }: any) => {
      editor.chain().focus().deleteRange(range).setHeading({ level: 1 }).run();
    },
  },
  {
    title: 'Heading 2',
    description: 'Medium section heading',
    icon: Heading2,
    command: ({ editor, range }: any) => {
      editor.chain().focus().deleteRange(range).setHeading({ level: 2 }).run();
    },
  },
  {
    title: 'Heading 3',
    description: 'Small section heading',
    icon: Heading3,
    command: ({ editor, range }: any) => {
      editor.chain().focus().deleteRange(range).setHeading({ level: 3 }).run();
    },
  },
  {
    title: 'Paragraph',
    description: 'Regular text',
    icon: Type,
    command: ({ editor, range }: any) => {
      editor.chain().focus().deleteRange(range).setParagraph().run();
    },
  },
  {
    title: 'Bullet List',
    description: 'Create a bulleted list',
    icon: List,
    command: ({ editor, range }: any) => {
      editor.chain().focus().deleteRange(range).toggleBulletList().run();
    },
  },
  {
    title: 'Numbered List',
    description: 'Create a numbered list',
    icon: ListOrdered,
    command: ({ editor, range }: any) => {
      editor.chain().focus().deleteRange(range).toggleOrderedList().run();
    },
  },
  {
    title: 'Quote',
    description: 'Create a quote block',
    icon: Quote,
    command: ({ editor, range }: any) => {
      editor.chain().focus().deleteRange(range).toggleBlockquote().run();
    },
  },
  {
    title: 'Code Block',
    description: 'Code block with syntax highlighting',
    icon: Code,
    command: ({ editor, range }: any) => {
      editor.chain().focus().deleteRange(range).toggleCodeBlock().run();
    },
  },
  {
    title: 'Image',
    description: 'Browse and upload images',
    icon: Image,
    command: ({ editor, range }: any) => {
      // Delete the slash command text
      editor.chain().focus().deleteRange(range).run();
      // Open the image library
      editor.commands.openImageLibrary();
    },
  },
  {
    title: 'Divider',
    description: 'Horizontal line',
    icon: Minus,
    command: ({ editor, range }: any) => {
      editor.chain().focus().deleteRange(range).setHorizontalRule().run();
    },
  },
  {
    title: 'To-do List',
    description: 'Create a task list',
    icon: CheckSquare,
    command: ({ editor, range }: any) => {
      editor.chain().focus().deleteRange(range).toggleTaskList().run();
    },
  },
  {
    title: 'Callout',
    description: 'Create a callout box',
    icon: FileText,
    command: ({ editor, range }: any) => {
      editor.chain().focus().deleteRange(range).insertContent({
        type: 'paragraph',
        attrs: { class: 'callout' },
        content: [{ type: 'text', text: '💡 ' }]
      }).run();
    },
  },
];

// Utility to create a block template for new documents
export const createBaseTemplate = () => {
  return {
    type: 'doc',
    content: [
      {
        type: 'heading',
        attrs: { level: 1 },
        content: [{ type: 'text', text: 'Untitled' }]
      },
      {
        type: 'paragraph',
        content: [{ type: 'text', text: 'Start writing your post here. Press "/" for commands or just start typing...' }]
      }
    ]
  };
};
