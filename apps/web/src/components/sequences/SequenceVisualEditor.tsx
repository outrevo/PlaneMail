'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { 
  ReactFlow, 
  MiniMap, 
  Controls, 
  Background, 
  useNodesState, 
  useEdgesState, 
  addEdge,
  Connection,
  Edge,
  Node,
  NodeTypes,
  MarkerType,
  Handle,
  Position,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PageHeader } from '@/components/common/PageHeader';
import { Badge } from '@/components/ui/badge';
import { 
  Save, 
  Play, 
  Plus, 
  Undo, 
  Redo,
  ZoomIn,
  ZoomOut,
  Maximize,
  Settings,
  Mail,
  Clock,
  Filter,
  Target,
  Users,
  Zap,
  ChevronDown,
  X,
  Copy,
  Trash2,
  Edit3,
  Pause
} from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { getAvailableEmailProviders } from '@/app/(app)/posts/actions';

// Custom Node Types
interface StepNodeData {
  id: string;
  label: string;
  type: 'trigger' | 'email' | 'wait' | 'condition' | 'action';
  config: any;
  status?: 'active' | 'inactive' | 'error';
  isConfigured: boolean;
}

// Step configuration types
interface StepConfig {
  email?: {
    subject: string;
    templateId?: string;
    delayAfterPrevious: { amount: number; unit: string };
  };
  wait?: {
    delay: { amount: number; unit: string };
  };
  condition?: {
    field: string;
    operator: string;
    value: string;
  };
  action?: {
    actionType: string;
    params: any;
  };
  trigger?: {
    triggerType: string;
    triggerConfig: any;
  };
}

const stepTypes = [
  { type: 'email', label: 'Send Email', icon: Mail, color: 'bg-blue-500', description: 'Send an email to the subscriber' },
  { type: 'wait', label: 'Wait', icon: Clock, color: 'bg-orange-500', description: 'Wait for a specific time period' },
  { type: 'condition', label: 'Condition', icon: Filter, color: 'bg-purple-500', description: 'Branch based on subscriber data' },
  { type: 'action', label: 'Action', icon: Target, color: 'bg-green-500', description: 'Perform an action (tag, move list, etc.)' },
];

const triggerTypes = [
  { type: 'subscription', label: 'New Subscriber', icon: Users, description: 'When someone subscribes' },
  { type: 'tag_added', label: 'Tag Added', icon: Zap, description: 'When a tag is added' },
  { type: 'tag_removed', label: 'Tag Removed', icon: Zap, description: 'When a tag is removed' },
  { type: 'manual', label: 'Manual', icon: Play, description: 'Start manually' },
];

// Custom Node Components
const TriggerNode = ({ data, selected }: { data: StepNodeData; selected: boolean }) => {
  const triggerType = triggerTypes.find(t => t.type === data.config?.triggerType);
  const Icon = triggerType?.icon || Users;
  
  return (
    <div className={`px-4 py-3 shadow-lg rounded-lg border-2 min-w-[200px] transition-all ${
      selected ? 'border-indigo-500 shadow-indigo-200' : 'border-gray-200 hover:border-indigo-300'
    } bg-white relative`}>
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center">
          <Icon className="w-4 h-4 text-white" />
        </div>
        <div className="flex-1">
          <div className="font-medium text-sm">Trigger</div>
          <div className="text-xs text-gray-500">{triggerType?.label || 'Configure trigger'}</div>
        </div>
        {!data.isConfigured && (
          <div className="w-2 h-2 bg-red-400 rounded-full animate-pulse"></div>
        )}
      </div>
      
      {/* ReactFlow Handle for connections */}
      <Handle
        type="source"
        position={Position.Bottom}
        id="trigger-output"
        className="!w-3 !h-3 !bg-indigo-500 !border-2 !border-white"
      />
    </div>
  );
};

const StepNode = ({ data, selected }: { data: StepNodeData; selected: boolean }) => {
  const stepType = stepTypes.find(t => t.type === data.type);
  const Icon = stepType?.icon || Mail;
  
  // Calculate if the step is actually configured based on config data
  const hasConfig = data.config && Object.keys(data.config).length > 0;
  const isActuallyConfigured = data.isConfigured || hasConfig;
  
  return (
    <div className={`px-4 py-3 shadow-lg rounded-lg border-2 min-w-[200px] transition-all relative ${
      selected ? 'border-blue-500 shadow-blue-200' : 'border-gray-200 hover:border-blue-300 hover:shadow-md'
    } bg-white group`}>
      <div className="flex items-center gap-2">
        <div className={`w-8 h-8 rounded-full ${stepType?.color} flex items-center justify-center transition-transform group-hover:scale-110`}>
          <Icon className="w-4 h-4 text-white" />
        </div>
        <div className="flex-1">
          <div className="font-medium text-sm">{data.label}</div>
          <div className="text-xs text-gray-500 line-clamp-1">{stepType?.description}</div>
          {isActuallyConfigured && (
            <div className="text-xs text-green-600 mt-1">✓ Configured</div>
          )}
        </div>
        {!isActuallyConfigured && (
          <div className="w-2 h-2 bg-amber-400 rounded-full animate-pulse"></div>
        )}
      </div>
      
      {/* ReactFlow Handles for connections */}
      <Handle
        type="target"
        position={Position.Top}
        id="step-input"
        className="!w-3 !h-3 !bg-blue-500 !border-2 !border-white"
      />
      <Handle
        type="source"
        position={Position.Bottom}
        id="step-output"
        className="!w-3 !h-3 !bg-blue-500 !border-2 !border-white"
      />
      
      {/* Status indicator */}
      {data.status && (
        <div className={`absolute -top-1 -right-1 w-3 h-3 rounded-full border-2 border-white ${
          data.status === 'active' ? 'bg-green-400' : 
          data.status === 'error' ? 'bg-red-400' : 'bg-gray-400'
        }`}></div>
      )}
    </div>
  );
};

// Define nodeTypes outside component to prevent re-creation
const nodeTypes: NodeTypes = {
  trigger: TriggerNode,
  step: StepNode,
};

interface SequenceVisualEditorProps {
  sequenceId?: string;
  initialData?: any;
}

export default function SequenceVisualEditor({ sequenceId: initialSequenceId, initialData }: SequenceVisualEditorProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [isConfigPanelOpen, setIsConfigPanelOpen] = useState(false);
  const [sequenceName, setSequenceName] = useState('Untitled Sequence');
  const [sequenceDescription, setSequenceDescription] = useState('');
  const [sequenceId, setSequenceId] = useState(initialSequenceId);
  const [sequenceStatus, setSequenceStatus] = useState<'draft' | 'active' | 'paused'>('draft');
  const [isSaving, setIsSaving] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [availableProviders, setAvailableProviders] = useState<any[]>([]);
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const [reactFlowInstance, setReactFlowInstance] = useState<any>(null);

  // Function to calculate step order and update labels
  const updateStepNumbers = useCallback((nodeList: Node[], edgeList: Edge[]) => {
    // Find the trigger node
    const triggerNode = nodeList.find(node => node.type === 'trigger');
    if (!triggerNode) {
      return nodeList;
    }

    // Build a graph to find the order of steps
    const stepNodes = nodeList.filter(node => node.type === 'step');
    
    const adjacencyMap = new Map<string, string[]>();
    
    // Build adjacency list from edges
    edgeList.forEach(edge => {
      if (!adjacencyMap.has(edge.source)) {
        adjacencyMap.set(edge.source, []);
      }
      adjacencyMap.get(edge.source)!.push(edge.target);
    });

    // Traverse from trigger to assign step numbers
    const stepOrder: string[] = [];
    const visited = new Set<string>();
    
    const traverse = (nodeId: string) => {
      if (visited.has(nodeId)) return;
      visited.add(nodeId);
      
      // If this is a step node, add it to the order
      if (stepNodes.find(n => n.id === nodeId)) {
        stepOrder.push(nodeId);
      }
      
      // Visit connected nodes
      const connections = adjacencyMap.get(nodeId) || [];
      connections.forEach(connectedId => traverse(connectedId));
    };

    traverse(triggerNode.id);

    // Update step labels with numbers
    const updatedNodes = nodeList.map(node => {
      if (node.type === 'step') {
        const stepIndex = stepOrder.indexOf(node.id);
        const stepNumber = stepIndex >= 0 ? stepIndex + 1 : stepOrder.length + 1;
        const stepType = stepTypes.find(t => t.type === node.data.type);
        
        // Ensure isConfigured is properly calculated
        const hasConfig = node.data.config && Object.keys(node.data.config).length > 0;
        const isConfigured = node.data.isConfigured || hasConfig;
        
        const newLabel = `Step ${stepNumber}: ${stepType?.label || 'Action'}`;
        
        return {
          ...node,
          data: {
            ...node.data,
            label: newLabel,
            isConfigured: isConfigured,
          }
        };
      }
      return node;
    });

    return updatedNodes;
  }, []);

  // Initialize with trigger node or load existing sequence data
  useEffect(() => {
    if (initialData && initialData.nodes && initialData.edges) {
      // Load existing sequence data
      setSequenceName(initialData.name || 'Untitled Sequence');
      setSequenceDescription(initialData.description || '');
      setSequenceStatus(initialData.status || 'draft');
      
      // Convert saved nodes back to ReactFlow format
      const loadedNodes = initialData.nodes.map((savedNode: any) => {
        // Properly calculate if node is configured
        const hasConfig = savedNode.config && Object.keys(savedNode.config).length > 0;
        const isConfigured = savedNode.isConfigured || hasConfig;
        
        // Convert old node types to new format
        let nodeType = savedNode.type;
        let dataType = savedNode.type;
        
        // Map old types to new React Flow types
        if (savedNode.type === 'email' || savedNode.type === 'action' || savedNode.type === 'wait' || savedNode.type === 'condition') {
          nodeType = 'step'; // All step types use 'step' for React Flow
          dataType = savedNode.type; // But keep the original type in data for step type lookup
        } else if (savedNode.type === 'trigger') {
          nodeType = 'trigger';
          dataType = savedNode.type;
        } else {
          // Default to step for unknown types
          nodeType = 'step';
          dataType = savedNode.type || 'action';
        }
        
        return {
          id: savedNode.id,
          type: nodeType, // Use correct React Flow type
          position: savedNode.position || { x: 100, y: 100 },
          data: {
            id: savedNode.id,
            label: savedNode.label || savedNode.config?.name || savedNode.type,
            type: dataType, // Store original type for step type lookup
            config: savedNode.config || {},
            isConfigured: isConfigured,
          },
          draggable: nodeType !== 'trigger',
        };
      });
      
      // Convert saved edges back to ReactFlow format
      const loadedEdges = initialData.edges.map((savedEdge: any) => ({
        id: savedEdge.id,
        source: savedEdge.source,
        target: savedEdge.target,
        type: 'smoothstep',
        markerEnd: { type: MarkerType.ArrowClosed, color: '#6366f1' },
        style: { strokeWidth: 2, stroke: '#6366f1' },
      }));
      
      // Update step numbers for loaded data - FORCE THIS TO RUN
      const numberedNodes = updateStepNumbers(loadedNodes, loadedEdges);
      
      setNodes(numberedNodes);
      setEdges(loadedEdges);
      
      // ADDITIONAL FORCE UPDATE after a short delay to ensure React state is settled
      setTimeout(() => {
        setNodes(currentNodes => {
          const reNumberedNodes = updateStepNumbers(currentNodes, loadedEdges);
          return [...reNumberedNodes];
        });
      }, 1000);
    } else {
      // Initialize with default trigger node for new sequences
      const triggerNode: Node = {
        id: 'trigger',
        type: 'trigger',
        position: { x: 250, y: 50 },
        data: { 
          id: 'trigger',
          label: 'Trigger', 
          type: 'trigger', 
          config: {},
          isConfigured: false 
        },
        draggable: false,
      };
      
      setNodes([triggerNode]);
    }
  }, [setNodes, setEdges, initialData, updateStepNumbers]);

  // Ensure step numbers are updated when nodes change or when we have step nodes without proper numbering
  useEffect(() => {
    if (nodes.length > 1) { // More than just trigger node
      // Fix node types and step numbering
      let hasChanges = false;
      const fixedNodes = nodes.map(node => {
        // Fix node type conversion for React Flow compatibility
        let correctType = node.type;
        if (node.data.type === 'email' || node.data.type === 'action' || node.data.type === 'wait' || node.data.type === 'condition') {
          if (node.type !== 'step') {
            correctType = 'step';
            hasChanges = true;
          }
        } else if (node.data.type === 'trigger') {
          if (node.type !== 'trigger') {
            correctType = 'trigger';
            hasChanges = true;
          }
        }
        
        return {
          ...node,
          type: correctType
        };
      });
      
      const stepNodes = fixedNodes.filter(n => n.type === 'step');
      
      // Check if any step nodes don't have proper numbering
      const hasUnnumberedSteps = stepNodes.some(node => 
        !node.data.label.startsWith('Step ')
      );
      
      if (hasUnnumberedSteps || hasChanges) {
        const numberedNodes = updateStepNumbers(fixedNodes, edges);
        setNodes(numberedNodes);
      }
    }
  }, [nodes.length, edges.length, updateStepNumbers]); // Add updateStepNumbers to dependencies

  // Force step numbering update after nodes are loaded (handles edge case where useEffect doesn't trigger)
  useEffect(() => {
    if (nodes.length > 1) {
      const timer = setTimeout(() => {
        const stepNodes = nodes.filter(n => n.type === 'step');
        const hasUnnumberedSteps = stepNodes.some(node => !node.data.label.startsWith('Step '));
        
        if (hasUnnumberedSteps) {
          const numberedNodes = updateStepNumbers(nodes, edges);
          
          // Force state update by creating new array
          setNodes([...numberedNodes]);
        }
      }, 500); // Increased delay to ensure everything is loaded
      
      return () => clearTimeout(timer);
    }
  }, [initialData, nodes, edges, updateStepNumbers]); // More comprehensive dependencies

  // Load available email providers
  useEffect(() => {
    const loadProviders = async () => {
      try {
        const providersData = await getAvailableEmailProviders();
        setAvailableProviders(providersData.providers);
      } catch (error) {
        console.error('Failed to load email providers:', error);
        setAvailableProviders([]);
      }
    };

    loadProviders();
  }, []);

  const onConnect = useCallback(
    (params: Connection) => {
      // Validate connection
      if (!params.source || !params.target) {
        console.warn('Invalid connection: missing source or target');
        return;
      }

      // Prevent self-connections
      if (params.source === params.target) {
        console.warn('Cannot connect a node to itself');
        return;
      }

      // Check if connection already exists
      const existingConnection = edges.find(
        edge => edge.source === params.source && edge.target === params.target
      );
      if (existingConnection) {
        console.warn('Connection already exists');
        return;
      }

      // Prevent circular references (basic check)
      const targetNode = nodes.find(node => node.id === params.target);
      const sourceNode = nodes.find(node => node.id === params.source);
      
      if (!targetNode || !sourceNode) {
        console.warn('Invalid connection: node not found');
        return;
      }

      // Add the connection
      const newEdge = {
        ...params,
        id: `${params.source}-${params.target}`,
        type: 'smoothstep',
        markerEnd: { type: MarkerType.ArrowClosed, color: '#6366f1' },
        style: { strokeWidth: 2, stroke: '#6366f1' },
      };

      setEdges((eds: Edge[]) => {
        const updatedEdges = addEdge(newEdge, eds);
        // Update step numbers when connections change
        const numberedNodes = updateStepNumbers(nodes, updatedEdges);
        setNodes(numberedNodes);
        return updatedEdges;
      });
    },
    [setEdges, edges, nodes, updateStepNumbers, setNodes]
  );

  // Connection validation function
  const isValidConnection = useCallback((connection: Connection) => {
    // Prevent self-connections
    if (connection.source === connection.target) {
      return false;
    }

    // Get source and target nodes
    const sourceNode = nodes.find(node => node.id === connection.source);
    const targetNode = nodes.find(node => node.id === connection.target);

    if (!sourceNode || !targetNode) {
      return false;
    }

    // Trigger can only be source, not target
    if (targetNode.type === 'trigger') {
      return false;
    }

    // Check if connection already exists
    const existingConnection = edges.find(
      edge => edge.source === connection.source && edge.target === connection.target
    );

    return !existingConnection;
  }, [nodes, edges]);

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      const type = event.dataTransfer.getData('application/reactflow');
      if (typeof type === 'undefined' || !type) {
        return;
      }

      if (!reactFlowWrapper.current || !reactFlowInstance) {
        return;
      }

      const reactFlowBounds = reactFlowWrapper.current.getBoundingClientRect();
      const position = reactFlowInstance.project({
        x: event.clientX - reactFlowBounds.left,
        y: event.clientY - reactFlowBounds.top,
      });

      const newNodeId = `${type}-${Date.now()}`;
      const stepType = stepTypes.find(t => t.type === type);
      
      const newNode: Node = {
        id: newNodeId,
        type: 'step',
        position,
        data: { 
          id: newNodeId,
          label: stepType?.label || 'Action', // Temporary label, will be updated with proper numbering
          type: type as any,
          config: {},
          isConfigured: false 
        },
      };

      // Add the new node and update step numbers
      setNodes((nds: Node[]) => {
        const updatedNodes = nds.concat(newNode);
        // Update step numbers for all nodes including the new one
        return updateStepNumbers(updatedNodes, edges);
      });
    },
    [reactFlowInstance, setNodes, edges, updateStepNumbers]
  );

  const onNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
    setSelectedNode(node);
    setIsConfigPanelOpen(true);
  }, []);

  const onNodeDoubleClick = useCallback((event: React.MouseEvent, node: Node) => {
    setSelectedNode(node);
    setIsConfigPanelOpen(true);
  }, []);

  const deleteNode = useCallback((nodeId: string) => {
    if (nodeId === 'trigger') return; // Can't delete trigger
    
    setNodes((prevNodes: Node[]) => {
      const filteredNodes = prevNodes.filter((node: Node) => node.id !== nodeId);
      return filteredNodes;
    });
    
    setEdges((prevEdges: Edge[]) => {
      const filteredEdges = prevEdges.filter((edge: Edge) => edge.source !== nodeId && edge.target !== nodeId);
      
      // Update step numbers after deletion
      setTimeout(() => {
        setNodes((currentNodes: Node[]) => updateStepNumbers(currentNodes, filteredEdges));
      }, 0);
      
      return filteredEdges;
    });
    
    setIsConfigPanelOpen(false);
    setSelectedNode(null);
  }, [setNodes, setEdges, updateStepNumbers]);

  const duplicateNode = useCallback((node: Node) => {
    const newId = `${node.data.type}-${Date.now()}`;
    const newNode: Node = {
      ...node,
      id: newId,
      position: {
        x: node.position.x + 50,
        y: node.position.y + 50,
      },
      data: {
        ...node.data,
        id: newId,
      },
    };
    
    setNodes((prevNodes: Node[]) => {
      const updatedNodes = [...prevNodes, newNode];
      // Update step numbers after duplication
      return updateStepNumbers(updatedNodes, edges);
    });
  }, [setNodes, edges, updateStepNumbers]);

  const updateNodeConfig = useCallback((nodeId: string, config: any) => {
    setNodes((nodes: Node[]) =>
      nodes.map((node: Node) =>
        node.id === nodeId
          ? {
              ...node,
              data: {
                ...node.data,
                config,
                isConfigured: true,
              },
            }
          : node
      )
    );
  }, [setNodes]);

  const saveSequence = useCallback(async () => {
    if (isSaving) return; // Prevent multiple simultaneous saves
    
    // Validate sequence before saving
    if (!sequenceName.trim()) {
      alert('Please enter a sequence name');
      return;
    }

    // Check if trigger is configured
    const triggerNode = nodes.find(node => node.type === 'trigger');
    if (!triggerNode?.data.isConfigured) {
      alert('Please configure the trigger before saving');
      return;
    }

    // Check if there are any steps
    const stepNodes = nodes.filter(node => node.type === 'step');
    if (stepNodes.length === 0) {
      alert('Please add at least one step to the sequence');
      return;
    }

    // Check if all steps are configured
    const unconfiguredSteps = stepNodes.filter(node => !node.data.isConfigured);
    if (unconfiguredSteps.length > 0) {
      const proceed = confirm(`${unconfiguredSteps.length} step(s) are not configured. Save anyway?`);
      if (!proceed) return;
    }

    // Check if email steps exist but no email providers are connected
    const emailSteps = stepNodes.filter(node => node.data.type === 'email');
    if (emailSteps.length > 0 && availableProviders.length === 0) {
      const proceed = confirm(
        `This sequence contains ${emailSteps.length} email step(s), but no email providers are connected. ` +
        `Emails cannot be sent without connecting an email provider. ` +
        `Save the sequence anyway? You can connect providers later in the Integrations page.`
      );
      if (!proceed) return;
    }

    // Check if email steps are configured with providers that aren't connected
    if (emailSteps.length > 0 && availableProviders.length > 0) {
      const stepsWithInvalidProviders = emailSteps.filter(node => {
        const configuredProviderId = node.data.config?.sendingProviderId;
        return configuredProviderId && !availableProviders.find(p => p.id === configuredProviderId);
      });
      
      if (stepsWithInvalidProviders.length > 0) {
        const proceed = confirm(
          `${stepsWithInvalidProviders.length} email step(s) are configured with disconnected providers. ` +
          `These emails cannot be sent. Save anyway?`
        );
        if (!proceed) return;
      }
    }

    setIsSaving(true);

    const sequenceData = {
      id: sequenceId,
      name: sequenceName.trim(),
      description: sequenceDescription.trim(),
      status: 'draft',
      nodes: nodes.map((node: Node) => ({
        id: node.id,
        type: node.data.type,
        label: node.data.label,
        position: node.position,
        config: node.data.config,
        isConfigured: node.data.isConfigured,
      })),
      edges: edges.map((edge: Edge) => ({
        id: edge.id,
        source: edge.source,
        target: edge.target,
      })),
      triggerConfig: triggerNode?.data.config || {},
      settings: {
        timezone: 'UTC',
        respectBusinessHours: false,
        businessHours: { start: '09:00', end: '17:00' },
      },
    };
    
    try {
      const response = await fetch('/api/sequences', {
        method: sequenceId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sequenceData)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save sequence');
      }
      
      const result = await response.json();
      
      // Show success message with more details
      const action = sequenceId ? 'updated' : 'created';
      alert(`✅ Sequence "${sequenceName}" ${action} successfully!`);
      
      // Update the sequenceId if this was a new sequence
      if (!sequenceId && result.sequence?.id) {
        setSequenceId(result.sequence.id);
      }
      
      // Update local state to match what was saved to prevent data loss
      if (result.sequence) {
        // Synchronize local state with saved data
        const savedSequence = result.sequence;
        if (savedSequence.name) setSequenceName(savedSequence.name);
        if (savedSequence.description) setSequenceDescription(savedSequence.description);
        
        // Update nodes and edges if they were returned from the server
        if (savedSequence.nodes && savedSequence.edges) {
          const updatedNodes = savedSequence.nodes.map((savedNode: any) => ({
            id: savedNode.id,
            type: savedNode.type || 'step',
            position: savedNode.position || { x: 100, y: 100 },
            data: {
              id: savedNode.id,
              label: savedNode.label || savedNode.config?.name || savedNode.type,
              type: savedNode.type,
              config: savedNode.config || {},
              isConfigured: savedNode.isConfigured || (savedNode.config && Object.keys(savedNode.config).length > 0),
            },
            draggable: savedNode.type !== 'trigger',
          }));
          
          const updatedEdges = savedSequence.edges.map((savedEdge: any) => ({
            id: savedEdge.id,
            source: savedEdge.source,
            target: savedEdge.target,
            type: 'smoothstep',
            markerEnd: { type: MarkerType.ArrowClosed, color: '#6366f1' },
            style: { strokeWidth: 2, stroke: '#6366f1' },
          }));
          
          setNodes(updatedNodes);
          setEdges(updatedEdges);
        }
      }
    } catch (error: any) {
      console.error('Error saving sequence:', error);
      alert(`❌ Failed to save sequence: ${error.message}`);
    } finally {
      setIsSaving(false);
    }
  }, [sequenceName, sequenceDescription, nodes, edges, sequenceId, isSaving]);

  // Toggle sequence status (activate/pause)
  const toggleSequenceStatus = useCallback(async () => {
    if (!sequenceId || isUpdatingStatus) return;

    const newStatus = sequenceStatus === 'active' ? 'paused' : 'active';
    const action = newStatus === 'active' ? 'activate' : 'pause';

    // Basic validation for activation
    if (newStatus === 'active') {
      const triggerNode = nodes.find(node => node.type === 'trigger');
      if (!triggerNode?.data.isConfigured) {
        alert('Please configure the trigger before activating the sequence');
        return;
      }

      const stepNodes = nodes.filter(node => node.type === 'step');
      if (stepNodes.length === 0) {
        alert('Please add at least one step before activating the sequence');
        return;
      }

      // Check email provider requirements for activation
      const emailSteps = stepNodes.filter(node => node.data.type === 'email');
      if (emailSteps.length > 0) {
        if (availableProviders.length === 0) {
          alert(
            'This sequence contains email steps but no email providers are connected. ' +
            'Please connect an email provider in the Integrations page before activating.'
          );
          return;
        }

        // Check if email steps have valid providers configured
        const stepsWithoutProviders = emailSteps.filter(node => !node.data.config?.sendingProviderId);
        const stepsWithInvalidProviders = emailSteps.filter(node => {
          const configuredProviderId = node.data.config?.sendingProviderId;
          return configuredProviderId && !availableProviders.find(p => p.id === configuredProviderId);
        });

        if (stepsWithoutProviders.length > 0) {
          alert(
            `${stepsWithoutProviders.length} email step(s) don't have an email provider selected. ` +
            'Please configure all email steps before activating.'
          );
          return;
        }

        if (stepsWithInvalidProviders.length > 0) {
          alert(
            `${stepsWithInvalidProviders.length} email step(s) are using disconnected providers. ` +
            'Please reconfigure these steps or reconnect the providers before activating.'
          );
          return;
        }
      }
    }

    if (!confirm(`Are you sure you want to ${action} this sequence?`)) {
      return;
    }

    setIsUpdatingStatus(true);

    try {
      const response = await fetch(`/api/sequences/${sequenceId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to ${action} sequence`);
      }

      const result = await response.json();

      // Update local state
      setSequenceStatus(newStatus);
      
      alert(`✅ Sequence ${action}d successfully!`);
    } catch (error: any) {
      console.error(`Error ${action}ing sequence:`, error);
      alert(`❌ Failed to ${action} sequence: ${error.message}`);
    } finally {
      setIsUpdatingStatus(false);
    }
  }, [sequenceId, sequenceStatus, nodes, isUpdatingStatus]);

  const onDragStart = (event: React.DragEvent, nodeType: string) => {
    event.dataTransfer.setData('application/reactflow', nodeType);
    event.dataTransfer.effectAllowed = 'move';
  };

  // Add keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Only handle shortcuts when not typing in an input
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
        return;
      }

      // Delete selected node with Delete or Backspace
      if ((event.key === 'Delete' || event.key === 'Backspace') && selectedNode) {
        event.preventDefault();
        deleteNode(selectedNode.id);
      }

      // Save with Ctrl+S or Cmd+S
      if ((event.ctrlKey || event.metaKey) && event.key === 's') {
        event.preventDefault();
        saveSequence();
      }

      // Escape to close config panel
      if (event.key === 'Escape' && isConfigPanelOpen) {
        setIsConfigPanelOpen(false);
        setSelectedNode(null);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [selectedNode, deleteNode, saveSequence, isConfigPanelOpen]);

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Left Sidebar - Toolbox */}
      <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
        {/* Sidebar Header */}
        <div className="p-4 border-b border-gray-200 bg-white">
          <h2 className="font-semibold text-lg text-gray-900">Sequence Builder</h2>
          <p className="text-sm text-gray-500 mt-1">Design your email sequence</p>
        </div>

        {/* Sidebar Content - Scrollable */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-4">
            {/* Sequence Info */}
            <div className="mb-6">
              <h3 className="font-semibold text-base mb-3">Sequence Settings</h3>
              <div className="space-y-3">
                <div>
                  <Label htmlFor="sequence-name" className="text-sm">Name</Label>
                  <Input
                    id="sequence-name"
                    value={sequenceName}
                    onChange={(e) => setSequenceName(e.target.value)}
                    placeholder="Enter sequence name"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="sequence-description" className="text-sm">Description</Label>
                  <Textarea
                    id="sequence-description"
                    value={sequenceDescription}
                    onChange={(e) => setSequenceDescription(e.target.value)}
                    placeholder="Enter sequence description"
                    rows={2}
                    className="mt-1"
                  />
              </div>
            </div>
          </div>

          <Separator />

          {/* Triggers */}
          <div>
            <h3 className="font-semibold mb-3">Triggers</h3>
            <p className="text-sm text-gray-600 mb-3">
              Choose what starts your sequence
            </p>
            <div className="space-y-2">
              {triggerTypes.map((trigger) => {
                const Icon = trigger.icon;
                return (
                  <div
                    key={trigger.type}
                    className="p-3 border border-gray-200 rounded-lg hover:border-indigo-300 hover:bg-indigo-50 cursor-pointer transition-colors"
                    onClick={() => {
                      setSelectedNode(nodes.find((n: Node) => n.id === 'trigger') || null);
                      setIsConfigPanelOpen(true);
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center">
                        <Icon className="w-4 h-4 text-indigo-600" />
                      </div>
                      <div>
                        <div className="font-medium text-sm">{trigger.label}</div>
                        <div className="text-xs text-gray-500">{trigger.description}</div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <Separator />

          {/* Steps */}
          <div>
            <h3 className="font-semibold mb-3">Steps</h3>
            <p className="text-sm text-gray-600 mb-3">
              Drag and drop to add steps
            </p>
            
            {/* Email Provider Warning */}
            {availableProviders.length === 0 && (
              <div className="mb-4 p-3 border border-amber-200 bg-amber-50 rounded-lg">
                <div className="flex items-start space-x-2">
                  <svg className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <div>
                    <p className="text-xs font-medium text-amber-800">Email steps require a provider</p>
                    <p className="text-xs text-amber-700 mt-1">
                      <a href="/integrations" className="underline hover:text-amber-900">
                        Connect an email provider
                      </a> to send emails from sequences.
                    </p>
                  </div>
                </div>
              </div>
            )}
            
            <div className="space-y-2">
              {stepTypes.map((stepType) => {
                const Icon = stepType.icon;
                const isEmailStep = stepType.type === 'email';
                const hasProvidersForEmail = !isEmailStep || availableProviders.length > 0;
                
                return (
                  <div
                    key={stepType.type}
                    className={`p-3 border rounded-lg cursor-grab active:cursor-grabbing transition-colors relative ${
                      hasProvidersForEmail 
                        ? 'border-gray-200 hover:border-blue-300 hover:bg-blue-50' 
                        : 'border-amber-200 bg-amber-50 hover:border-amber-300'
                    }`}
                    draggable
                    onDragStart={(event) => onDragStart(event, stepType.type)}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 ${stepType.color} rounded-lg flex items-center justify-center ${
                        !hasProvidersForEmail ? 'opacity-75' : ''
                      }`}>
                        <Icon className="w-4 h-4 text-white" />
                      </div>
                      <div className="flex-1">
                        <div className="font-medium text-sm">{stepType.label}</div>
                        <div className={`text-xs ${hasProvidersForEmail ? 'text-gray-500' : 'text-amber-700'}`}>
                          {hasProvidersForEmail ? stepType.description : 'Requires email provider'}
                        </div>
                      </div>
                      {!hasProvidersForEmail && (
                        <svg className="w-4 h-4 text-amber-500 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          </div>
        </div>
      </div>

      {/* Main Canvas */}
      <div className="flex-1 flex flex-col">
        {/* Top Toolbar */}
        <div className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-semibold">{sequenceName}</h1>
            <Badge variant="outline">Visual Editor</Badge>
          </div>
          
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              <Undo className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="sm">
              <Redo className="w-4 h-4" />
            </Button>
            <Separator orientation="vertical" className="h-6" />
            <Button variant="outline" size="sm">
              <Settings className="w-4 h-4 mr-2" />
              Settings
            </Button>
            <Button variant="outline" onClick={saveSequence} disabled={isSaving} data-testid="save-draft-button">
              <Save className="w-4 h-4 mr-2" />
              {isSaving ? 'Saving...' : 'Save Draft'}
            </Button>
            <Button 
              onClick={toggleSequenceStatus} 
              disabled={isUpdatingStatus}
              variant={sequenceStatus === 'active' ? 'outline' : 'default'}
            >
              {sequenceStatus === 'active' ? (
                <>
                  <Pause className="w-4 h-4 mr-2" />
                  {isUpdatingStatus ? 'Pausing...' : 'Pause'}
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 mr-2" />
                  {isUpdatingStatus ? 'Activating...' : 'Activate'}
                </>
              )}
            </Button>
          </div>
        </div>

        {/* React Flow Canvas */}
        <div className="flex-1" ref={reactFlowWrapper}>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onInit={setReactFlowInstance}
            onDrop={onDrop}
            onDragOver={onDragOver}
            onNodeClick={onNodeClick}
            onNodeDoubleClick={onNodeDoubleClick}
            nodeTypes={nodeTypes}
            isValidConnection={isValidConnection}
            fitView
            className="bg-gray-50"
          >
            <Controls position="bottom-left" />
            <MiniMap 
              position="bottom-right"
              nodeColor={(node: any) => {
                if (node.type === 'trigger') return '#6366f1';
                const stepType = stepTypes.find(t => t.type === node.data?.type);
                return stepType?.color.replace('bg-', '#') || '#6366f1';
              }}
            />
            <Background gap={20} size={1} />
          </ReactFlow>
        </div>
      </div>

      {/* Configuration Panel */}
      <Sheet open={isConfigPanelOpen} onOpenChange={setIsConfigPanelOpen}>
        <SheetContent className="w-96 flex flex-col backdrop-blur-xl bg-white/95 dark:bg-slate-900/95 border-l border-white/20 dark:border-slate-700/30 shadow-2xl">
          <SheetHeader className="border-b border-white/20 dark:border-slate-700/30 pb-6 backdrop-blur-sm bg-white/50 dark:bg-slate-800/50 -mx-6 px-6 -mt-6 pt-6 rounded-t-xl">
            <SheetTitle className="flex items-center justify-between text-slate-900 dark:text-white">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg">
                  <Settings className="w-4 h-4 text-white" />
                </div>
                <span className="font-semibold">Configure Step</span>
              </div>
              {selectedNode && selectedNode.id !== 'trigger' && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-white/80 dark:hover:bg-slate-700/80 backdrop-blur-sm rounded-lg">
                      <ChevronDown className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="backdrop-blur-xl bg-white/95 dark:bg-slate-900/95 border border-white/20 dark:border-slate-700/30 shadow-2xl">
                    <DropdownMenuItem onClick={() => selectedNode && duplicateNode(selectedNode)} className="hover:bg-white/80 dark:hover:bg-slate-700/80">
                      <Copy className="w-4 h-4 mr-2" />
                      Duplicate
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => selectedNode && deleteNode(selectedNode.id)}
                      className="text-red-600 hover:bg-red-50/80 dark:hover:bg-red-900/20"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </SheetTitle>
          </SheetHeader>
          
          {/* Scrollable Content Area */}
          <div className="flex-1 overflow-y-auto pt-6 px-1">
            {selectedNode && (
              <div className="space-y-6 pr-1">
                <StepConfigurationPanel
                  node={selectedNode}
                  onUpdate={(config) => updateNodeConfig(selectedNode.id, config)}
                  availableProviders={availableProviders}
                />
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}

// Step Configuration Panel Component
interface StepConfigurationPanelProps {
  node: Node;
  onUpdate: (config: any) => void;
  availableProviders: Array<{
    id: 'brevo' | 'mailgun' | 'amazon_ses';
    name: string;
    connected: boolean;
    status: string;
    senders?: Array<{ email: string; name?: string }>;
    domain?: string;
    verifiedIdentities?: string[];
  }>;
}

function StepConfigurationPanel({ node, onUpdate, availableProviders }: StepConfigurationPanelProps) {
  const [config, setConfig] = useState(node.data.config || {});

  const updateConfig = (newConfig: any) => {
    setConfig(newConfig);
    onUpdate(newConfig);
  };

  if (node.data.type === 'trigger') {
    return <TriggerConfiguration config={config} onUpdate={updateConfig} />;
  }

  if (node.data.type === 'email') {
    return <EmailStepConfiguration config={config} onUpdate={updateConfig} availableProviders={availableProviders} />;
  }

  if (node.data.type === 'wait') {
    return <WaitStepConfiguration config={config} onUpdate={updateConfig} />;
  }

  if (node.data.type === 'condition') {
    return <ConditionStepConfiguration config={config} onUpdate={updateConfig} />;
  }

  if (node.data.type === 'action') {
    return <ActionStepConfiguration config={config} onUpdate={updateConfig} />;
  }

  return <div>Configuration not available for this step type.</div>;
}

// Individual step configuration components
function TriggerConfiguration({ config, onUpdate }: { config: any; onUpdate: (config: any) => void }) {
  return (
    <div className="space-y-6">
      <div className="backdrop-blur-sm bg-white/50 dark:bg-slate-800/50 rounded-xl p-4 border border-white/20 dark:border-slate-700/30 shadow-lg">
        <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">Trigger Type</Label>
        <Select 
          value={config.triggerType || ''} 
          onValueChange={(value) => onUpdate({ ...config, triggerType: value })}
        >
          <SelectTrigger className="mt-2 backdrop-blur-sm bg-white/70 dark:bg-slate-800/70 border-white/30 dark:border-slate-600/30 focus:ring-2 focus:ring-indigo-500/50">
            <SelectValue placeholder="Select trigger type" />
          </SelectTrigger>
          <SelectContent className="backdrop-blur-xl bg-white/95 dark:bg-slate-900/95 border border-white/20 dark:border-slate-700/30 shadow-2xl">
            {triggerTypes.map((trigger) => (
              <SelectItem key={trigger.type} value={trigger.type} className="hover:bg-white/80 dark:hover:bg-slate-700/80">
                {trigger.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {config.triggerType === 'tag_added' && (
        <div className="backdrop-blur-sm bg-white/50 dark:bg-slate-800/50 rounded-xl p-4 border border-white/20 dark:border-slate-700/30 shadow-lg">
          <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">Tag Name</Label>
          <Input
            className="mt-2 backdrop-blur-sm bg-white/70 dark:bg-slate-800/70 border-white/30 dark:border-slate-600/30 focus:ring-2 focus:ring-indigo-500/50"
            value={config.tagName || ''}
            onChange={(e) => onUpdate({ ...config, tagName: e.target.value })}
            placeholder="Enter tag name"
          />
        </div>
      )}

      {config.triggerType === 'tag_removed' && (
        <div className="backdrop-blur-sm bg-white/50 dark:bg-slate-800/50 rounded-xl p-4 border border-white/20 dark:border-slate-700/30 shadow-lg">
          <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">Tag Name</Label>
          <Input
            className="mt-2 backdrop-blur-sm bg-white/70 dark:bg-slate-800/70 border-white/30 dark:border-slate-600/30 focus:ring-2 focus:ring-indigo-500/50"
            value={config.tagName || ''}
            onChange={(e) => onUpdate({ ...config, tagName: e.target.value })}
            placeholder="Enter tag name"
          />
        </div>
      )}
    </div>
  );
}

function EmailStepConfiguration({ config, onUpdate, availableProviders }: { 
  config: any; 
  onUpdate: (config: any) => void;
  availableProviders: Array<{
    id: 'brevo' | 'mailgun' | 'amazon_ses';
    name: string;
    connected: boolean;
    status: string;
    senders?: Array<{ email: string; name?: string }>;
    domain?: string;
    verifiedIdentities?: string[];
  }>;
}) {
  return (
    <div className="space-y-6">
      {/* Provider Status Indicator */}
      <div className={`p-4 rounded-xl border backdrop-blur-sm shadow-lg ${
        availableProviders.length > 0 
          ? 'border-emerald-200/50 bg-emerald-50/70 dark:bg-emerald-900/20 dark:border-emerald-700/30' 
          : 'border-red-200/50 bg-red-50/70 dark:bg-red-900/20 dark:border-red-700/30'
      }`}>
        <div className="flex items-center space-x-3">
          {availableProviders.length > 0 ? (
            <>
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center shadow-lg">
                <svg className="w-4 h-4 text-white" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <span className="text-sm font-medium text-emerald-800 dark:text-emerald-200">
                {availableProviders.length} email provider{availableProviders.length === 1 ? '' : 's'} connected
              </span>
            </>
          ) : (
            <>
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center shadow-lg">
                <svg className="w-4 h-4 text-white" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <span className="text-sm font-medium text-red-800 dark:text-red-200">No email providers connected</span>
            </>
          )}
        </div>
      </div>

      {/* Email Provider Selection */}
      <div className="backdrop-blur-sm bg-white/50 dark:bg-slate-800/50 rounded-xl p-4 border border-white/20 dark:border-slate-700/30 shadow-lg">
        <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">Email Provider</Label>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 mb-3">Choose which email service to use for sending</p>
        {availableProviders.length > 0 ? (
          <div className="space-y-3">
            {availableProviders.map((provider) => (
              <label
                key={provider.id}
                className={`flex items-center space-x-3 p-3 border rounded-lg cursor-pointer transition-all backdrop-blur-sm shadow-sm ${
                  config.sendingProviderId === provider.id
                    ? 'border-indigo-300/50 bg-indigo-50/70 dark:bg-indigo-900/20 dark:border-indigo-600/30 shadow-lg'
                    : 'border-white/30 dark:border-slate-600/30 bg-white/40 dark:bg-slate-700/40 hover:bg-white/60 dark:hover:bg-slate-700/60'
                }`}
              >
                <input
                  type="radio"
                  name="emailProvider"
                  value={provider.id}
                  checked={config.sendingProviderId === provider.id}
                  onChange={(e) => onUpdate({ 
                    ...config, 
                    sendingProviderId: e.target.value,
                    // Auto-populate from email if available
                    fromEmail: !config.fromEmail && provider.senders?.[0]?.email 
                      ? provider.senders[0].email 
                      : config.fromEmail
                  })}
                  className="text-indigo-600 focus:ring-indigo-500"
                />
                <div className="flex-1">
                  <div className="font-medium text-slate-800 dark:text-slate-200">{provider.name}</div>
                  {provider.senders && provider.senders.length > 0 && (
                    <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      {provider.senders.length === 1 
                        ? `Available: ${provider.senders[0].email}`
                        : `${provider.senders.length} verified senders available`
                      }
                    </div>
                  )}
                </div>
              </label>
            ))}
          </div>
        ) : (
          <div className="p-4 border border-red-200/50 bg-red-50/70 dark:bg-red-900/20 dark:border-red-700/30 rounded-lg backdrop-blur-sm">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0">
                <svg className="w-5 h-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-medium text-red-800 dark:text-red-200 mb-1">No Email Providers Connected</h4>
                <p className="text-sm text-red-700 dark:text-red-300 mb-2">
                  You cannot send emails from sequences without connecting an email provider.
                </p>
                <a 
                  href="/integrations" 
                  className="inline-flex items-center text-sm font-medium text-red-800 dark:text-red-200 underline hover:text-red-900 dark:hover:text-red-100"
                >
                  Connect an Email Provider →
                </a>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* From Name */}
      <div className="backdrop-blur-sm bg-white/50 dark:bg-slate-800/50 rounded-xl p-4 border border-white/20 dark:border-slate-700/30 shadow-lg">
        <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">From Name</Label>
        <Input
          className="mt-2 backdrop-blur-sm bg-white/70 dark:bg-slate-800/70 border-white/30 dark:border-slate-600/30 focus:ring-2 focus:ring-indigo-500/50"
          value={config.fromName || ''}
          onChange={(e) => onUpdate({ ...config, fromName: e.target.value })}
          placeholder="Your Name or Company"
        />
      </div>

      {/* From Email */}
      <div className="backdrop-blur-sm bg-white/50 dark:bg-slate-800/50 rounded-xl p-4 border border-white/20 dark:border-slate-700/30 shadow-lg">
        <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">From Email</Label>
        {config.sendingProviderId && availableProviders.length > 0 ? (
          <select
            value={config.fromEmail || ''}
            onChange={(e) => onUpdate({ ...config, fromEmail: e.target.value })}
            className="mt-2 w-full h-10 px-3 backdrop-blur-sm bg-white/70 dark:bg-slate-800/70 border border-white/30 dark:border-slate-600/30 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-transparent"
          >
            <option value="">Select sender email</option>
            {availableProviders
              .find(p => p.id === config.sendingProviderId)
              ?.senders?.map((sender) => (
              <option key={sender.email} value={sender.email}>
                {sender.name ? `${sender.name} <${sender.email}>` : sender.email}
              </option>
            ))}
          </select>
        ) : (
          <Input
            type="email"
            className="mt-2 backdrop-blur-sm bg-white/70 dark:bg-slate-800/70 border-white/30 dark:border-slate-600/30 focus:ring-2 focus:ring-indigo-500/50"
            value={config.fromEmail || ''}
            onChange={(e) => onUpdate({ ...config, fromEmail: e.target.value })}
            placeholder="your@email.com"
          />
        )}
      </div>

      {/* Email Subject */}
      <div className="backdrop-blur-sm bg-white/50 dark:bg-slate-800/50 rounded-xl p-4 border border-white/20 dark:border-slate-700/30 shadow-lg">
        <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">Email Subject</Label>
        <Input
          className="mt-2 backdrop-blur-sm bg-white/70 dark:bg-slate-800/70 border-white/30 dark:border-slate-600/30 focus:ring-2 focus:ring-indigo-500/50"
          value={config.subject || ''}
          onChange={(e) => onUpdate({ ...config, subject: e.target.value })}
          placeholder="Enter email subject"
        />
      </div>

      {/* Email Template */}
      <div className="backdrop-blur-sm bg-white/50 dark:bg-slate-800/50 rounded-xl p-4 border border-white/20 dark:border-slate-700/30 shadow-lg">
        <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">Email Template</Label>
        <Select 
          value={config.templateId || ''} 
          onValueChange={(value) => onUpdate({ ...config, templateId: value })}
        >
          <SelectTrigger className="mt-2 backdrop-blur-sm bg-white/70 dark:bg-slate-800/70 border-white/30 dark:border-slate-600/30 focus:ring-2 focus:ring-indigo-500/50">
            <SelectValue placeholder="Select template" />
          </SelectTrigger>
          <SelectContent className="backdrop-blur-xl bg-white/95 dark:bg-slate-900/95 border border-white/20 dark:border-slate-700/30 shadow-2xl">
            <SelectItem value="welcome" className="hover:bg-white/80 dark:hover:bg-slate-700/80">Welcome Email</SelectItem>
            <SelectItem value="newsletter" className="hover:bg-white/80 dark:hover:bg-slate-700/80">Newsletter</SelectItem>
            <SelectItem value="promotion" className="hover:bg-white/80 dark:hover:bg-slate-700/80">Promotion</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Delay Configuration */}
      <div className="backdrop-blur-sm bg-white/50 dark:bg-slate-800/50 rounded-xl p-4 border border-white/20 dark:border-slate-700/30 shadow-lg">
        <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">Delay After Previous Step</Label>
        <div className="grid grid-cols-2 gap-3 mt-2">
          <Input
            type="number"
            className="backdrop-blur-sm bg-white/70 dark:bg-slate-800/70 border-white/30 dark:border-slate-600/30 focus:ring-2 focus:ring-indigo-500/50"
            value={config.delayAmount || 0}
            onChange={(e) => onUpdate({ 
              ...config, 
              delayAmount: parseInt(e.target.value) || 0 
            })}
            placeholder="Amount"
          />
          <Select 
            value={config.delayUnit || 'hours'} 
            onValueChange={(value) => onUpdate({ ...config, delayUnit: value })}
          >
            <SelectTrigger className="backdrop-blur-sm bg-white/70 dark:bg-slate-800/70 border-white/30 dark:border-slate-600/30 focus:ring-2 focus:ring-indigo-500/50">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="backdrop-blur-xl bg-white/95 dark:bg-slate-900/95 border border-white/20 dark:border-slate-700/30 shadow-2xl">
              <SelectItem value="minutes" className="hover:bg-white/80 dark:hover:bg-slate-700/80">Minutes</SelectItem>
              <SelectItem value="hours" className="hover:bg-white/80 dark:hover:bg-slate-700/80">Hours</SelectItem>
              <SelectItem value="days" className="hover:bg-white/80 dark:hover:bg-slate-700/80">Days</SelectItem>
              <SelectItem value="weeks" className="hover:bg-white/80 dark:hover:bg-slate-700/80">Weeks</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}

function WaitStepConfiguration({ config, onUpdate }: { config: any; onUpdate: (config: any) => void }) {
  return (
    <div className="space-y-6">
      <div className="backdrop-blur-sm bg-white/50 dark:bg-slate-800/50 rounded-xl p-4 border border-white/20 dark:border-slate-700/30 shadow-lg">
        <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">Wait Duration</Label>
        <div className="grid grid-cols-2 gap-3 mt-2">
          <Input
            type="number"
            className="backdrop-blur-sm bg-white/70 dark:bg-slate-800/70 border-white/30 dark:border-slate-600/30 focus:ring-2 focus:ring-indigo-500/50"
            value={config.amount || 1}
            onChange={(e) => onUpdate({ 
              ...config, 
              amount: parseInt(e.target.value) || 1 
            })}
            placeholder="Amount"
            min="1"
          />
          <Select 
            value={config.unit || 'days'} 
            onValueChange={(value) => onUpdate({ ...config, unit: value })}
          >
            <SelectTrigger className="backdrop-blur-sm bg-white/70 dark:bg-slate-800/70 border-white/30 dark:border-slate-600/30 focus:ring-2 focus:ring-indigo-500/50">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="backdrop-blur-xl bg-white/95 dark:bg-slate-900/95 border border-white/20 dark:border-slate-700/30 shadow-2xl">
              <SelectItem value="hours" className="hover:bg-white/80 dark:hover:bg-slate-700/80">Hours</SelectItem>
              <SelectItem value="days" className="hover:bg-white/80 dark:hover:bg-slate-700/80">Days</SelectItem>
              <SelectItem value="weeks" className="hover:bg-white/80 dark:hover:bg-slate-700/80">Weeks</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="backdrop-blur-sm bg-white/50 dark:bg-slate-800/50 rounded-xl p-4 border border-white/20 dark:border-slate-700/30 shadow-lg">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">Respect Business Hours</Label>
          <Switch
            checked={config.respectBusinessHours || false}
            onCheckedChange={(checked) => onUpdate({ ...config, respectBusinessHours: checked })}
          />
        </div>
      </div>
    </div>
  );
}

function ConditionStepConfiguration({ config, onUpdate }: { config: any; onUpdate: (config: any) => void }) {
  return (
    <div className="space-y-4">
      <div>
        <Label>Field to Check</Label>
        <Select 
          value={config.field || ''} 
          onValueChange={(value) => onUpdate({ ...config, field: value })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select field" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="tag">Has Tag</SelectItem>
            <SelectItem value="email_opened">Email Opened</SelectItem>
            <SelectItem value="link_clicked">Link Clicked</SelectItem>
            <SelectItem value="custom_field">Custom Field</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label>Condition</Label>
        <Select 
          value={config.operator || 'equals'} 
          onValueChange={(value) => onUpdate({ ...config, operator: value })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="equals">Equals</SelectItem>
            <SelectItem value="not_equals">Not Equals</SelectItem>
            <SelectItem value="contains">Contains</SelectItem>
            <SelectItem value="not_contains">Does Not Contain</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label>Value</Label>
        <Input
          value={config.value || ''}
          onChange={(e) => onUpdate({ ...config, value: e.target.value })}
          placeholder="Enter comparison value"
        />
      </div>
    </div>
  );
}

function ActionStepConfiguration({ config, onUpdate }: { config: any; onUpdate: (config: any) => void }) {
  return (
    <div className="space-y-4">
      <div>
        <Label>Action Type</Label>
        <Select 
          value={config.actionType || 'add_tag'} 
          onValueChange={(value) => onUpdate({ ...config, actionType: value })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="add_tag">Add Tag</SelectItem>
            <SelectItem value="remove_tag">Remove Tag</SelectItem>
            <SelectItem value="update_field">Update Custom Field</SelectItem>
            <SelectItem value="move_list">Move to List</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {(config.actionType === 'add_tag' || config.actionType === 'remove_tag') && (
        <div>
          <Label>Tag Name</Label>
          <Input
            value={config.tagName || ''}
            onChange={(e) => onUpdate({ ...config, tagName: e.target.value })}
            placeholder="Enter tag name"
          />
        </div>
      )}

      {config.actionType === 'update_field' && (
        <>
          <div>
            <Label>Field Name</Label>
            <Input
              value={config.fieldName || ''}
              onChange={(e) => onUpdate({ ...config, fieldName: e.target.value })}
              placeholder="Enter field name"
            />
          </div>
          <div>
            <Label>Field Value</Label>
            <Input
              value={config.fieldValue || ''}
              onChange={(e) => onUpdate({ ...config, fieldValue: e.target.value })}
              placeholder="Enter field value"
            />
          </div>
        </>
      )}

      {config.actionType === 'move_list' && (
        <div>
          <Label>Target List</Label>
          <Select 
            value={config.listId || ''} 
            onValueChange={(value) => onUpdate({ ...config, listId: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select list" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="list1">Main List</SelectItem>
              <SelectItem value="list2">Newsletter List</SelectItem>
              <SelectItem value="list3">VIP List</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}
    </div>
  );
}
