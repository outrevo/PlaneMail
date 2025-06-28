'use client';

import { Extension } from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';
import { Decoration, DecorationSet } from '@tiptap/pm/view';

export const BlockIndicator = Extension.create({
  name: 'blockIndicator',

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: new PluginKey('blockIndicator'),
        
        props: {
          decorations(state) {
            const decorations: Decoration[] = [];
            const { doc, selection } = state;
            
            // Find empty paragraphs and add indicators
            doc.descendants((node, pos) => {
              if (node.type.name === 'paragraph' && node.content.size === 0) {
                const decoration = Decoration.widget(pos, () => {
                  const widget = document.createElement('div');
                  widget.className = 'block-indicator-widget';
                  widget.innerHTML = `
                    <div class="flex items-center opacity-0 hover:opacity-100 transition-opacity duration-200">
                      <button class="w-6 h-6 rounded border border-gray-300 hover:border-gray-400 bg-white hover:bg-gray-50 flex items-center justify-center text-gray-400 hover:text-gray-600 mr-2" data-add-block>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                          <line x1="12" y1="5" x2="12" y2="19"></line>
                          <line x1="5" y1="12" x2="19" y2="12"></line>
                        </svg>
                      </button>
                      <div class="w-1 h-1 bg-gray-300 rounded-full"></div>
                    </div>
                  `;
                  
                  widget.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    
                    // Focus the editor at this position
                    const view = (state as any).view;
                    if (view) {
                      view.focus();
                      view.dispatch(view.state.tr.setSelection(view.state.selection.constructor.near(view.state.doc.resolve(pos))));
                      
                      // Simulate typing "/" to trigger slash commands
                      setTimeout(() => {
                        view.dispatch(view.state.tr.insertText('/'));
                      }, 10);
                    }
                  });
                  
                  return widget;
                }, {
                  side: -1,
                });
                
                decorations.push(decoration);
              }
            });
            
            return DecorationSet.create(doc, decorations);
          },
        },
      }),
    ];
  },
});
