'use client';

import { useState, useEffect } from 'react';
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

interface EditSequencePageProps {
  params: Promise<{
    id: string;
  }>;
}

export default function EditSequencePage({ params }: EditSequencePageProps) {
  const router = useRouter();
  const [editorMode, setEditorMode] = useState<'visual' | 'advanced'>('visual');
  const [sequence, setSequence] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [sequenceId, setSequenceId] = useState<string | null>(null);

  // Extract params asynchronously
  useEffect(() => {
    const getParams = async () => {
      const resolvedParams = await params;
      setSequenceId(resolvedParams.id);
    };
    getParams();
  }, [params]);

  // Mock data - replace with actual API call
  useEffect(() => {
    if (!sequenceId) return; // Wait for sequenceId to be resolved
    
    // Fetch actual sequence data from API
    const fetchSequence = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/sequences/${sequenceId}`);
        if (!response.ok) {
          throw new Error('Failed to fetch sequence');
        }
        
        const data = await response.json();
        console.log('Fetched sequence data:', data.sequence);
        setSequence(data.sequence);
      } catch (error) {
        console.error('Error fetching sequence:', error);
        // Fallback to mock data for now
        setSequence({
          id: sequenceId,
          name: 'Welcome Series',
          description: 'Welcome new subscribers with a 3-email sequence',
          status: 'active',
          triggerType: 'subscription',
          steps: [
            { id: 'step-1', type: 'email', name: 'Welcome Email', config: { subject: 'Welcome to our newsletter!' } },
            { id: 'step-2', type: 'wait', name: 'Wait 1 day', config: { amount: 1, unit: 'days' } },
            { id: 'step-3', type: 'email', name: 'Getting Started', config: { subject: 'How to get started' } },
          ],
        });
      } finally {
        setLoading(false);
      }
    };

    fetchSequence();
  }, [sequenceId]);

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading sequence...</p>
        </div>
      </div>
    );
  }

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
          <div>
            <h1 className="text-xl font-semibold">{sequence?.name}</h1>
            <div className="flex items-center gap-2">
              <Badge variant={sequence?.status === 'active' ? 'default' : 'secondary'}>
                {sequence?.status === 'active' ? 'Active' : 'Paused'}
              </Badge>
              <span className="text-sm text-muted-foreground">
                {(() => {
                  // Count step nodes (exclude trigger nodes)
                  const nodes = sequence?.nodes || [];
                  const stepCount = nodes.filter((node: any) => node.type !== 'trigger').length;
                  console.log('Step count calculation:', { nodes: nodes.length, stepCount, nodeTypes: nodes.map((n: any) => n.type) });
                  return stepCount;
                })()} steps
              </span>
            </div>
          </div>
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
        {editorMode === 'visual' && sequenceId ? (
          <SequenceVisualEditor 
            sequenceId={sequenceId}
            initialData={sequence}
          />
        ) : editorMode === 'visual' ? (
          <div className="h-full flex items-center justify-center">
            <div className="text-gray-500">Loading...</div>
          </div>
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
                  The advanced editor allows you to edit sequences using JSON configuration or import from external sources.
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
