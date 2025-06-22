
'use client';

import React, { useState, useEffect, useTransition } from 'react';
import { PageHeader } from '@/components/common/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'; // Removed DialogTrigger as it's part of <Dialog>
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { PlusCircle, Edit3, Trash2, MoreHorizontal, Users, Search, Filter, Tags, CheckCircle, XCircle, Loader2, UploadCloud } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getSubscribers, addSubscriber, updateSubscriber, deleteSubscriber, getSegments, createSegment } from './actions';
import type { subscribers as SubscriberType, segments as SegmentType } from '@/db/schema';
import { ImportSubscribersDialog } from './components/ImportSubscribersDialog'; // New component

type SubscriberWithSegments = SubscriberType & { segments: Pick<SegmentType, 'id' | 'name'>[] };

export default function SubscribersPage() {
  const { toast } = useToast();
  const [subscribers, setSubscribers] = useState<SubscriberWithSegments[]>([]);
  const [segmentsList, setSegmentsList] = useState<SegmentType[]>([]);
  const [selectedSubscribers, setSelectedSubscribers] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isManageSegmentsDialogOpen, setIsManageSegmentsDialogOpen] = useState(false);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [editingSubscriber, setEditingSubscriber] = useState<SubscriberWithSegments | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [isPending, startTransition] = useTransition();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('active');
  const [currentSegments, setCurrentSegments] = useState<string[]>([]); 

  const [newSegmentName, setNewSegmentName] = useState('');
  const [newSegmentDescription, setNewSegmentDescription] = useState('');


  const fetchSubscribersAndSegments = React.useCallback(() => {
    setIsLoading(true);
    startTransition(async () => {
      try {
        const [subsData, segsData] = await Promise.all([
          getSubscribers(searchTerm),
          getSegments()
        ]);
        setSubscribers(subsData as SubscriberWithSegments[]); 
        setSegmentsList(segsData);
      } catch (error) {
        toast({ title: 'Error', description: 'Failed to fetch data.', variant: 'destructive' });
      } finally {
        setIsLoading(false);
      }
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm, toast]); 
  
  useEffect(() => {
    fetchSubscribersAndSegments();
  }, [fetchSubscribersAndSegments]);

  const handleSelectAll = (checked: boolean | 'indeterminate') => {
    if (checked === true) {
      setSelectedSubscribers(subscribers.map(sub => sub.id));
    } else {
      setSelectedSubscribers([]);
    }
  };

  const handleSelectRow = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedSubscribers(prev => [...prev, id]);
    } else {
      setSelectedSubscribers(prev => prev.filter(subId => subId !== id));
    }
  };

  const openAddDialog = () => {
    setEditingSubscriber(null);
    setName('');
    setEmail('');
    setStatus('active');
    setCurrentSegments([]);
    setIsAddDialogOpen(true);
  };
  
  const openEditDialog = (subscriber: SubscriberWithSegments) => {
    setEditingSubscriber(subscriber);
    setName(subscriber.name || '');
    setEmail(subscriber.email);
    setStatus(subscriber.status);
    setCurrentSegments(subscriber.segments.map(s => s.id));
    setIsAddDialogOpen(true);
  };

  const handleSaveSubscriber = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSaving(true);
    const formData = new FormData();
    formData.append('name', name);
    formData.append('email', email);
    formData.append('status', status);
    currentSegments.forEach(segId => formData.append('segmentIds[]', segId));

    startTransition(async () => {
      try {
        const result = editingSubscriber 
          ? await updateSubscriber(editingSubscriber.id, formData) 
          : await addSubscriber(formData);

        if (result.success) {
          toast({ title: 'Success', description: result.message });
          setIsAddDialogOpen(false);
          fetchSubscribersAndSegments(); 
        } else {
          toast({ title: 'Error', description: result.message || 'Failed to save subscriber.', variant: 'destructive' });
          if (result.errors) console.error("Validation Errors:", result.errors);
        }
      } catch (e) {
        toast({ title: 'Error', description: 'An unexpected error occurred.', variant: 'destructive' });
      } finally {
        setIsSaving(false);
      }
    });
  };
  
  const handleDelete = (id: string) => {
    startTransition(async () => {
      const result = await deleteSubscriber(id);
      if (result.success) {
        toast({ title: 'Success', description: result.message });
        fetchSubscribersAndSegments(); 
      } else {
        toast({ title: 'Error', description: result.message || 'Failed to delete.', variant: 'destructive' });
      }
    });
  };

  const handleSegmentToggle = (segmentId: string) => {
    setCurrentSegments(prev => 
        prev.includes(segmentId) ? prev.filter(sId => sId !== segmentId) : [...prev, segmentId]
    );
  };

  const handleCreateNewSegment = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSaving(true);
    const formData = new FormData();
    formData.append('name', newSegmentName);
    formData.append('description', newSegmentDescription);
    
    startTransition(async () => {
        const result = await createSegment(formData);
        if (result.success) {
            toast({ title: 'Success', description: result.message });
            setNewSegmentName('');
            setNewSegmentDescription('');
            fetchSubscribersAndSegments(); 
        } else {
            toast({ title: 'Error', description: result.message || 'Failed to create segment.', variant: 'destructive' });
        }
        setIsSaving(false);
    });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Subscribers"
        description="Manage your audience and segments."
        actions={
          <div className="flex gap-2">
            <Button onClick={() => setIsImportDialogOpen(true)} variant="outline" disabled={isPending}>
              <UploadCloud className="mr-2 h-4 w-4" /> Import Subscribers
            </Button>
            <Button onClick={openAddDialog} disabled={isPending}>
              <PlusCircle className="mr-2 h-4 w-4" /> Add Subscriber
            </Button>
          </div>
        }
      />

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input 
            placeholder="Search by name or email..." 
            className="pl-10" 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            disabled={isPending}
          />
        </div>
        <div className="flex gap-2">
            <Button variant="outline" disabled={isPending}>
                <Filter className="mr-2 h-4 w-4" /> Filter
            </Button>
            <Button variant="outline" onClick={() => setIsManageSegmentsDialogOpen(true)} disabled={isPending}>
                <Tags className="mr-2 h-4 w-4" /> Manage Segments
            </Button>
        </div>
      </div>

      <Card className="shadow-sm">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center p-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="ml-2">Loading subscribers...</p>
            </div>
          ) : subscribers.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px]">
                    <Checkbox 
                      checked={selectedSubscribers.length === subscribers.length && subscribers.length > 0 ? true : (selectedSubscribers.length > 0 ? 'indeterminate' : false)}
                      onCheckedChange={handleSelectAll}
                      disabled={isPending}
                    />
                  </TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Segments</TableHead>
                  <TableHead>Date Added</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {subscribers.map((sub) => (
                  <TableRow key={sub.id} data-state={selectedSubscribers.includes(sub.id) ? "selected" : ""}>
                    <TableCell>
                      <Checkbox 
                        checked={selectedSubscribers.includes(sub.id)}
                        onCheckedChange={(checked) => handleSelectRow(sub.id, !!checked)}
                        disabled={isPending}
                      />
                    </TableCell>
                    <TableCell className="font-medium">{sub.name || '-'}</TableCell>
                    <TableCell>{sub.email}</TableCell>
                    <TableCell>
                      <Badge variant={sub.status === 'active' ? 'default' : (sub.status === 'unsubscribed' ? 'secondary' : 'destructive')}
                        className={sub.status === 'active' ? 'bg-green-500/20 text-green-700 border-green-500/30 dark:bg-green-500/10 dark:text-green-400 dark:border-green-500/20' 
                                 : (sub.status === 'unsubscribed' ? 'bg-yellow-500/20 text-yellow-700 border-yellow-500/30 dark:bg-yellow-500/10 dark:text-yellow-400 dark:border-yellow-500/20' 
                                 : 'bg-red-500/20 text-red-700 border-red-500/30 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20')}
                      >
                        {sub.status === 'active' && <CheckCircle className="mr-1 h-3 w-3" />}
                        {sub.status !== 'active' && sub.status !== 'pending' && <XCircle className="mr-1 h-3 w-3" />}
                        {sub.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate">
                        {sub.segments.map(seg => <Badge key={seg.id} variant="outline" className="mr-1 mb-1 text-xs">{seg.name}</Badge>)}
                        {sub.segments.length === 0 && <span className="text-xs text-muted-foreground">-</span>}
                    </TableCell>
                    <TableCell>{new Date(sub.dateAdded).toLocaleDateString()}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" disabled={isPending}>
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Actions</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem onClick={() => openEditDialog(sub)} disabled={isPending}>
                            <Edit3 className="mr-2 h-4 w-4" /> Edit
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-destructive focus:text-destructive focus:bg-destructive/10" disabled={isPending}>
                                    <Trash2 className="mr-2 h-4 w-4" /> Delete
                                </DropdownMenuItem>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader><AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                <AlertDialogDescription>This will permanently delete {sub.email}.</AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDelete(sub.id)} variant="destructive" disabled={isPending}>
                                    {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                                    Delete
                                </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="py-12 text-center">
              <Users className="mx-auto h-12 w-12 text-muted-foreground" />
              <p className="mt-4 text-muted-foreground">
                No subscribers found{searchTerm ? ' matching your search' : ''}, or you haven't added any yet.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
      {selectedSubscribers.length > 0 && (
        <div className="fixed bottom-4 right-4 rounded-lg border bg-card p-4 shadow-lg">
          <p className="text-sm font-medium">{selectedSubscribers.length} subscriber(s) selected</p>
          <div className="mt-2 flex gap-2">
            <Button size="sm" variant="outline" disabled={isPending}>Bulk Actions</Button>
            <Button size="sm" variant="destructive" onClick={() => setSelectedSubscribers([])} disabled={isPending}>Deselect All</Button>
          </div>
        </div>
      )}

      {/* Add/Edit Subscriber Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-[525px]">
          <form onSubmit={handleSaveSubscriber}>
            <DialogHeader>
              <DialogTitle>{editingSubscriber ? 'Edit Subscriber' : 'Add New Subscriber'}</DialogTitle>
              <DialogDescription>
                {editingSubscriber ? 'Update the details for this subscriber.' : 'Enter the details for the new subscriber.'}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">Name</Label>
                <Input id="name" value={name} onChange={(e) => setName(e.target.value)} className="col-span-3" placeholder="John Doe"/>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="email" className="text-right">Email</Label>
                <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="col-span-3" placeholder="john.doe@example.com" required/>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="status" className="text-right">Status</Label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger id="status" className="col-span-3">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="unsubscribed">Unsubscribed</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="bounced">Bounced</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-start gap-4">
                <Label className="text-right pt-2">Segments</Label>
                <div className="col-span-3 flex flex-wrap gap-2">
                  {segmentsList.length === 0 && <p className="text-xs text-muted-foreground">No segments available. Create one in 'Manage Segments'.</p>}
                  {segmentsList.map(seg => (
                      <Button 
                          key={seg.id} 
                          type="button"
                          variant={currentSegments.includes(seg.id) ? "default" : "outline"}
                          size="sm"
                          onClick={() => handleSegmentToggle(seg.id)}
                          className="text-xs"
                      >
                          {currentSegments.includes(seg.id) && <CheckCircle className="mr-1 h-3 w-3"/>}
                          {seg.name}
                      </Button>
                  ))}
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)} disabled={isSaving}>Cancel</Button>
              <Button type="submit" disabled={isSaving} className="bg-accent hover:bg-accent/90 text-accent-foreground">
                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                {editingSubscriber ? 'Save Changes' : 'Add Subscriber'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Manage Segments Dialog */}
      <Dialog open={isManageSegmentsDialogOpen} onOpenChange={setIsManageSegmentsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Manage Segments</DialogTitle>
            <DialogDescription>Create new segments or view existing ones.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <form onSubmit={handleCreateNewSegment} className="space-y-3">
              <h4 className="font-medium">Create New Segment</h4>
              <div>
                <Label htmlFor="newSegmentName">Segment Name</Label>
                <Input id="newSegmentName" value={newSegmentName} onChange={(e) => setNewSegmentName(e.target.value)} placeholder="E.g., VIP Customers" required />
              </div>
              <div>
                <Label htmlFor="newSegmentDescription">Description (Optional)</Label>
                <Textarea id="newSegmentDescription" value={newSegmentDescription} onChange={(e) => setNewSegmentDescription(e.target.value)} placeholder="Internal notes about this segment" />
              </div>
              <Button type="submit" disabled={isSaving || isPending} className="w-full bg-accent hover:bg-accent/90 text-accent-foreground">
                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>} Create Segment
              </Button>
            </form>
            <div className="space-y-2">
              <h4 className="font-medium">Existing Segments</h4>
              {isLoading && <p className="text-xs text-muted-foreground">Loading segments...</p>}
              {!isLoading && segmentsList.length === 0 && <p className="text-xs text-muted-foreground">No segments created yet.</p>}
              <div className="max-h-60 overflow-y-auto space-y-1 pr-2">
                {segmentsList.map(segment => (
                  <div key={segment.id} className="flex justify-between items-center p-2 border rounded-md text-sm">
                    <span>{segment.name}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsManageSegmentsDialogOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Import Subscribers Dialog */}
      <ImportSubscribersDialog
        isOpen={isImportDialogOpen}
        onOpenChange={setIsImportDialogOpen}
        segments={segmentsList}
        onImportComplete={fetchSubscribersAndSegments}
      />
    </div>
  );
}
