'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PageHeader } from '@/components/common/PageHeader';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Settings, 
  Code, 
  Eye,
  ArrowLeft
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import SequenceVisualEditor from '@/components/sequences/SequenceVisualEditor';

export default function NewSequencePage() {
  const router = useRouter();
  const [editorMode, setEditorMode] = useState<'visual' | 'advanced'>('visual');

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <div className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 flex-shrink-0">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/sequences">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Sequences
            </Link>
          </Button>
          <div className="h-6 w-px bg-gray-300" />
          <h1 className="text-xl font-semibold">Create New Sequence</h1>
        </div>
        
        <div className="flex items-center gap-2">
          <Tabs value={editorMode} onValueChange={(value) => setEditorMode(value as any)}>
            <TabsList>
              <TabsTrigger value="visual" className="flex items-center gap-2">
                <Eye className="w-4 h-4" />
                Visual Editor
              </TabsTrigger>
              <TabsTrigger value="advanced" className="flex items-center gap-2">
                <Code className="w-4 h-4" />
                Advanced
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      {/* Editor Content */}
      <div className="flex-1">
        {editorMode === 'visual' ? (
          <SequenceVisualEditor />
        ) : (
          <div className="h-full flex items-center justify-center bg-gray-50">
            <Card className="w-96">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="w-5 h-5" />
                  Advanced Editor
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  The advanced editor allows you to create sequences using JSON configuration or import from external sources.
                </p>
                <Badge variant="outline">Coming Soon</Badge>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
