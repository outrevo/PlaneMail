'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PageHeader } from '@/components/common/PageHeader';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Mail, 
  PlusCircle, 
  Edit3, 
  Eye, 
  MoreHorizontal,
  Play,
  Pause,
  Users,
  BarChart3,
  Clock,
  Zap,
  Settings,
  Copy,
  Trash2,
  Check,
  Loader2
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

interface MarketingSequence {
  id: string;
  name: string;
  description?: string;
  status: 'draft' | 'active' | 'paused' | 'completed';
  triggerType: 'subscription' | 'tag_added' | 'tag_removed' | 'manual' | 'webhook' | 'date_based';
  stepCount: number;
  stats: {
    totalEntered: number;
    totalCompleted: number;
    currentActive: number;
    conversionRate: number;
  };
  createdAt: string;
  updatedAt: string;
}

// Mock data - replace with actual API calls
const mockSequences: MarketingSequence[] = [
  {
    id: '1',
    name: 'Welcome Series',
    description: 'Welcome new subscribers with a 3-email sequence',
    status: 'active',
    triggerType: 'subscription',
    stepCount: 3,
    stats: {
      totalEntered: 245,
      totalCompleted: 198,
      currentActive: 47,
      conversionRate: 80.8,
    },
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-01-15T10:30:00Z',
  },
  {
    id: '2',
    name: 'Product Demo Follow-up',
    description: 'Follow up with users who requested a demo',
    status: 'active',
    triggerType: 'tag_added',
    stepCount: 5,
    stats: {
      totalEntered: 89,
      totalCompleted: 67,
      currentActive: 22,
      conversionRate: 75.3,
    },
    createdAt: '2024-01-10T14:20:00Z',
    updatedAt: '2024-01-14T16:45:00Z',
  },
  {
    id: '3',
    name: 'Re-engagement Campaign',
    description: 'Re-engage inactive subscribers',
    status: 'paused',
    triggerType: 'manual',
    stepCount: 4,
    stats: {
      totalEntered: 156,
      totalCompleted: 89,
      currentActive: 0,
      conversionRate: 57.1,
    },
    createdAt: '2024-01-05T09:15:00Z',
    updatedAt: '2024-01-20T11:30:00Z',
  },
];

export default function SequencesPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('all');
  const [sequences, setSequences] = useState<MarketingSequence[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch sequences from API
  useEffect(() => {
    const fetchSequences = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await fetch('/api/sequences');
        if (!response.ok) {
          throw new Error('Failed to fetch sequences');
        }
        
        const data = await response.json();
        
        // Transform API data to match our interface
        const transformedSequences: MarketingSequence[] = data.sequences.map((seq: any) => ({
          id: seq.id.toString(),
          name: seq.name || 'Untitled Sequence',
          description: seq.description || '',
          status: seq.status || 'draft',
          triggerType: seq.triggerConfig?.triggerType || 'manual',
          stepCount: seq.nodes?.filter((node: any) => node.type !== 'trigger').length || 0,
          stats: {
            totalEntered: 0, // TODO: Implement stats tracking
            totalCompleted: 0,
            currentActive: 0,
            conversionRate: 0,
          },
          createdAt: seq.createdAt || new Date().toISOString(),
          updatedAt: seq.updatedAt || new Date().toISOString(),
        }));
        
        setSequences(transformedSequences);
      } catch (err) {
        console.error('Error fetching sequences:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch sequences');
      } finally {
        setLoading(false);
      }
    };

    fetchSequences();
  }, []);

  // Delete sequence function
  const deleteSequence = async (sequenceId: string) => {
    if (!confirm('Are you sure you want to delete this sequence? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`/api/sequences/${sequenceId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete sequence');
      }

      // Remove from local state
      setSequences(prev => prev.filter(seq => seq.id !== sequenceId));
      
      // Show success message (you could use a toast here)
      alert('Sequence deleted successfully');
    } catch (err) {
      console.error('Error deleting sequence:', err);
      alert('Failed to delete sequence. Please try again.');
    }
  };

  // Duplicate sequence function
  const duplicateSequence = async (sequence: MarketingSequence) => {
    try {
      // First, fetch the full sequence data
      const response = await fetch(`/api/sequences/${sequence.id}`);
      if (!response.ok) {
        throw new Error('Failed to fetch sequence details');
      }
      
      const { sequence: fullSequence } = await response.json();
      
      // Create a copy with a new name
      const duplicatedData = {
        ...fullSequence,
        name: `${fullSequence.name} (Copy)`,
        status: 'draft',
      };
      delete duplicatedData.id; // Remove ID so a new one is created
      
      // Create the duplicate
      const createResponse = await fetch('/api/sequences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(duplicatedData),
      });
      
      if (!createResponse.ok) {
        throw new Error('Failed to create duplicate');
      }
      
      // Refresh the list
      window.location.reload();
    } catch (err) {
      console.error('Error duplicating sequence:', err);
      alert('Failed to duplicate sequence. Please try again.');
    }
  };

  // Toggle sequence status function
  const toggleSequenceStatus = async (sequenceId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'paused' : 'active';
    const action = newStatus === 'active' ? 'activate' : 'pause';

    if (!confirm(`Are you sure you want to ${action} this sequence?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/sequences/${sequenceId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        throw new Error(`Failed to ${action} sequence`);
      }

      // Update local state
      setSequences(prev => prev.map(seq => 
        seq.id === sequenceId 
          ? { ...seq, status: newStatus as any }
          : seq
      ));
      
      alert(`Sequence ${action}d successfully`);
    } catch (err) {
      console.error(`Error ${action}ing sequence:`, err);
      alert(`Failed to ${action} sequence. Please try again.`);
    }
  };

  const filteredSequences = sequences.filter(sequence => {
    switch (activeTab) {
      case 'active':
        return sequence.status === 'active';
      case 'paused':
        return sequence.status === 'paused';
      case 'draft':
        return sequence.status === 'draft';
      default:
        return true;
    }
  });

  const getStatusBadge = (status: MarketingSequence['status']) => {
    const variants = {
      draft: { variant: 'secondary' as const, text: 'Draft', icon: Edit3 },
      active: { variant: 'default' as const, text: 'Active', icon: Play },
      paused: { variant: 'outline' as const, text: 'Paused', icon: Pause },
      completed: { variant: 'outline' as const, text: 'Completed', icon: Check },
    };
    
    const config = variants[status] || variants.draft;
    const Icon = config.icon;
    
    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {config.text}
      </Badge>
    );
  };

  const getTriggerBadge = (triggerType: MarketingSequence['triggerType']) => {
    const triggers = {
      subscription: { text: 'New Subscriber', icon: Users },
      tag_added: { text: 'Tag Added', icon: Zap },
      tag_removed: { text: 'Tag Removed', icon: Zap },
      manual: { text: 'Manual', icon: Play },
      webhook: { text: 'Webhook', icon: Settings },
      date_based: { text: 'Date Based', icon: Clock },
    };
    
    const config = triggers[triggerType];
    const Icon = config.icon;
    
    return (
      <Badge variant="outline" className="text-xs flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {config.text}
      </Badge>
    );
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <PageHeader 
          title="Marketing Sequences" 
          description="Create automated email sequences to nurture and convert your subscribers"
        />
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href="/sequences/analytics">
              <BarChart3 className="h-4 w-4 mr-2" />
              Analytics
            </Link>
          </Button>
          <Button onClick={() => router.push('/sequences/new')}>
            <PlusCircle className="h-4 w-4 mr-2" />
            Create Sequence
          </Button>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Loading sequences...</span>
        </div>
      )}

      {/* Error State */}
      {error && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <div className="text-red-500 mb-2">Error loading sequences</div>
              <p className="text-muted-foreground mb-4">{error}</p>
              <Button onClick={() => window.location.reload()}>
                Try Again
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Content */}
      {!loading && !error && (
        <>
          {/* Quick Stats */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Sequences</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{sequences.length}</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Active Sequences</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {sequences.filter(s => s.status === 'active').length}
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Enrolled</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">
                  {sequences.reduce((sum, s) => sum + s.stats.currentActive, 0)}
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Draft Sequences</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-600">
                  {sequences.filter(s => s.status === 'draft').length}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sequences List */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 max-w-md">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="active">Active</TabsTrigger>
          <TabsTrigger value="paused">Paused</TabsTrigger>
          <TabsTrigger value="draft">Drafts</TabsTrigger>
        </TabsList>
        
        <TabsContent value={activeTab} className="space-y-4">
          {filteredSequences.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-12">
                  <Mail className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">
                    {activeTab === 'draft' 
                      ? 'No draft sequences yet' 
                      : activeTab === 'active' 
                        ? 'No active sequences yet'
                        : activeTab === 'paused'
                          ? 'No paused sequences'
                          : 'No sequences yet'
                    }
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    Create your first marketing sequence to start automating your email campaigns.
                  </p>
                  <Button onClick={() => router.push('/sequences/new')}>
                    <PlusCircle className="h-4 w-4 mr-2" />
                    Create Your First Sequence
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {filteredSequences.map((sequence) => (
                <Card key={sequence.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold truncate">{sequence.name}</h3>
                          {getStatusBadge(sequence.status)}
                          {getTriggerBadge(sequence.triggerType)}
                        </div>
                        
                        {sequence.description && (
                          <p className="text-muted-foreground text-sm mb-3 line-clamp-2">
                            {sequence.description}
                          </p>
                        )}
                        
                        <div className="flex items-center gap-6 text-xs text-muted-foreground mb-4">
                          <span className="flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            {sequence.stepCount} steps
                          </span>
                          
                          <span className="flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            {sequence.stats.currentActive} active
                          </span>
                          
                          <span className="flex items-center gap-1">
                            <BarChart3 className="h-3 w-3" />
                            {sequence.stats.conversionRate}% conversion
                          </span>
                          
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            Updated {new Date(sequence.updatedAt).toLocaleDateString()}
                          </span>
                        </div>

                        {/* Progress bar for completion rate */}
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full" 
                            style={{ width: `${sequence.stats.conversionRate}%` }}
                          ></div>
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {sequence.stats.totalCompleted} of {sequence.stats.totalEntered} completed
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2 ml-4">
                        <Button variant="ghost" size="sm" asChild>
                          <Link href={`/sequences/${sequence.id}/analytics`}>
                            <BarChart3 className="h-4 w-4" />
                          </Link>
                        </Button>
                        
                        <Button variant="ghost" size="sm" asChild>
                          <Link href={`/sequences/${sequence.id}/edit`}>
                            <Edit3 className="h-4 w-4" />
                          </Link>
                        </Button>
                        
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild>
                              <Link href={`/sequences/${sequence.id}/analytics`}>
                                <Eye className="h-4 w-4 mr-2" />
                                View Details
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => duplicateSequence(sequence)}>
                              <Copy className="h-4 w-4 mr-2" />
                              Duplicate
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            {sequence.status === 'active' ? (
                              <DropdownMenuItem onClick={() => toggleSequenceStatus(sequence.id, sequence.status)}>
                                <Pause className="h-4 w-4 mr-2" />
                                Pause Sequence
                              </DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem onClick={() => toggleSequenceStatus(sequence.id, sequence.status)}>
                                <Play className="h-4 w-4 mr-2" />
                                Activate Sequence
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              className="text-red-600"
                              onClick={() => deleteSequence(sequence.id)}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
            )}
          </TabsContent>
        </Tabs>
        </>
      )}
    </div>
  );
}