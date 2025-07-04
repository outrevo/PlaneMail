'use client';

import React, { useState } from 'react';
import { NodeViewWrapper, NodeViewProps } from '@tiptap/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  AlignLeft, 
  AlignCenter, 
  AlignRight, 
  Settings, 
  Move, 
  RotateCw,
  Crop,
  Download,
  ExternalLink,
  Image
} from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';

export function ImageNodeView({ node, updateAttributes, selected, deleteNode, editor }: NodeViewProps) {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [tempSettings, setTempSettings] = useState({
    alt: node.attrs.alt || '',
    title: node.attrs.title || '',
    caption: node.attrs.caption || '',
    width: node.attrs.width || '',
    height: node.attrs.height || '',
    align: node.attrs.align || 'center',
  });

  const handleUpdateSettings = () => {
    updateAttributes({
      ...tempSettings,
      width: tempSettings.width ? parseInt(tempSettings.width) : null,
      height: tempSettings.height ? parseInt(tempSettings.height) : null,
    });
    setIsSettingsOpen(false);
  };

  const handleAlignChange = (align: 'left' | 'center' | 'right') => {
    updateAttributes({ align });
  };

  const handleOpenImageLibrary = () => {
    if (editor) {
      editor.commands.openImageLibrary();
    }
  };

  const getAlignmentClass = () => {
    switch (node.attrs.align) {
      case 'left': return 'text-left';
      case 'right': return 'text-right';
      case 'center':
      default: return 'text-center';
    }
  };

  const getImageStyle = () => {
    const style: React.CSSProperties = {};
    if (node.attrs.width) style.width = `${node.attrs.width}px`;
    if (node.attrs.height) style.height = `${node.attrs.height}px`;
    return style;
  };

  return (
    <NodeViewWrapper className={`image-node ${selected ? 'ProseMirror-selectednode' : ''}`}>
      <div className={`relative group ${getAlignmentClass()}`}>
        <div className="relative inline-block">
          <img
            src={node.attrs.src}
            alt={node.attrs.alt || ''}
            title={node.attrs.title || ''}
            style={getImageStyle()}
            className="rounded-lg shadow-sm max-w-full h-auto"
            draggable={false}
          />
          
          {/* Image Controls Overlay */}
          {selected && (
            <div className="absolute inset-0 border-2 border-blue-500 rounded-lg">
              {/* Top Controls */}
              <div className="absolute -top-10 left-0 flex items-center gap-1 bg-white border border-gray-200 rounded-md shadow-lg p-1">
                <Button
                  size="sm"
                  variant={node.attrs.align === 'left' ? 'default' : 'ghost'}
                  onClick={() => handleAlignChange('left')}
                  className="h-6 w-6 p-0"
                >
                  <AlignLeft className="h-3 w-3" />
                </Button>
                <Button
                  size="sm"
                  variant={node.attrs.align === 'center' ? 'default' : 'ghost'}
                  onClick={() => handleAlignChange('center')}
                  className="h-6 w-6 p-0"
                >
                  <AlignCenter className="h-3 w-3" />
                </Button>
                <Button
                  size="sm"
                  variant={node.attrs.align === 'right' ? 'default' : 'ghost'}
                  onClick={() => handleAlignChange('right')}
                  className="h-6 w-6 p-0"
                >
                  <AlignRight className="h-3 w-3" />
                </Button>
                
                <div className="w-px h-4 bg-gray-300 mx-1" />
                
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleOpenImageLibrary}
                  className="h-6 w-6 p-0"
                  title="Replace Image"
                >
                  <Image className="h-3 w-3" />
                </Button>
                
                <div className="w-px h-4 bg-gray-300 mx-1" />
                
                <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
                  <DialogTrigger asChild>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-6 w-6 p-0"
                    >
                      <Settings className="h-3 w-3" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle>Image Settings</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="alt">Alt Text</Label>
                        <Input
                          id="alt"
                          value={tempSettings.alt}
                          onChange={(e) => setTempSettings(prev => ({ ...prev, alt: e.target.value }))}
                          placeholder="Describe the image for accessibility"
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="caption">Caption</Label>
                        <Textarea
                          id="caption"
                          value={tempSettings.caption}
                          onChange={(e) => setTempSettings(prev => ({ ...prev, caption: e.target.value }))}
                          placeholder="Optional caption for the image"
                          rows={2}
                        />
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <Label htmlFor="width">Width (px)</Label>
                          <Input
                            id="width"
                            type="number"
                            value={tempSettings.width}
                            onChange={(e) => setTempSettings(prev => ({ ...prev, width: e.target.value }))}
                            placeholder="Auto"
                          />
                        </div>
                        <div>
                          <Label htmlFor="height">Height (px)</Label>
                          <Input
                            id="height"
                            type="number"
                            value={tempSettings.height}
                            onChange={(e) => setTempSettings(prev => ({ ...prev, height: e.target.value }))}
                            placeholder="Auto"
                          />
                        </div>
                      </div>
                      
                      <div>
                        <Label htmlFor="align">Alignment</Label>
                        <Select value={tempSettings.align} onValueChange={(value) => setTempSettings(prev => ({ ...prev, align: value as 'left' | 'center' | 'right' }))}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="left">Left</SelectItem>
                            <SelectItem value="center">Center</SelectItem>
                            <SelectItem value="right">Right</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="flex justify-between">
                        <Button
                          variant="outline"
                          onClick={() => setIsSettingsOpen(false)}
                        >
                          Cancel
                        </Button>
                        <Button onClick={handleUpdateSettings}>
                          Apply Changes
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
                
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={deleteNode}
                  className="h-6 w-6 p-0 text-red-600 hover:text-red-700"
                >
                  ×
                </Button>
              </div>
              
              {/* Resize Handles */}
              <div className="absolute -bottom-2 -right-2 w-4 h-4 bg-blue-500 rounded-full cursor-se-resize" />
            </div>
          )}
        </div>
        
        {/* Caption */}
        {node.attrs.caption && (
          <div className="mt-2 text-sm text-gray-600 italic">
            {node.attrs.caption}
          </div>
        )}
      </div>
    </NodeViewWrapper>
  );
}
