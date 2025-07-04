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
import { getSubscribers, addSubscriber, updateSubscriber, deleteSubscriber, bulkDeleteSubscribers, getAllSubscriberIds, getSegments, createSegment } from './actions';
import type { subscribers, segments } from '@/db/schema';
import { ImportSubscribersDialog } from './components/ImportSubscribersDialog'; // New component
import { Pagination } from '@/components/ui/pagination';

type SubscriberType = typeof subscribers.$inferSelect;
type SegmentType = typeof segments.$inferSelect;
type SubscriberWithSegments = SubscriberType & { segments: Pick<SegmentType, 'id' | 'name'>[] };

export default function SubscribersPage() {
  const { toast } = useToast();
  const [subscribers, setSubscribers] = useState<SubscriberWithSegments[]>([]);
  const [segmentsList, setSegmentsList] = useState<SegmentType[]>([]);
  const [selectedSubscribers, setSelectedSubscribers] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [isSelectAllMode, setIsSelectAllMode] = useState(false); // Track if "select all" across pages is active
  const [allSubscriberIds, setAllSubscriberIds] = useState<string[]>([]); // Store all IDs when select all is active
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
          getSubscribers(searchTerm, currentPage, pageSize, statusFilter),
          getSegments()
        ]);
        setSubscribers(subsData.subscribers as SubscriberWithSegments[]); 
        setTotalCount(subsData.totalCount);
        setTotalPages(subsData.totalPages);
        setSegmentsList(segsData);
      } catch (error) {
        toast({ title: 'Error', description: 'Failed to fetch data.', variant: 'destructive' });
      } finally {
        setIsLoading(false);
      }
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm, currentPage, pageSize, statusFilter, toast]); 
  
  useEffect(() => {
    fetchSubscribersAndSegments();
  }, [fetchSubscribersAndSegments]);

  const handleSelectAll = async (checked: boolean | 'indeterminate') => {
    if (checked === true) {
      // First select current page
      const currentPageIds = subscribers.map(sub => sub.id);
      setSelectedSubscribers(currentPageIds);
      
      // If user has already selected all on current page, offer to select all across all pages
      if (selectedSubscribers.length === subscribers.length && subscribers.length > 0) {
        setIsSelectAllMode(true);
        // Fetch all subscriber IDs
        const allIds = await getAllSubscriberIds(searchTerm, statusFilter);
        setAllSubscriberIds(allIds);
        setSelectedSubscribers(allIds);
      }
    } else {
      setSelectedSubscribers([]);
      setIsSelectAllMode(false);
      setAllSubscriberIds([]);
    }
  };

  const handleSelectAllAcrossPages = async () => {
    setIsSelectAllMode(true);
    const allIds = await getAllSubscriberIds(searchTerm, statusFilter);
    setAllSubscriberIds(allIds);
    setSelectedSubscribers(allIds);
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
    setCurrentSegments(subscriber.segments.map((s: Pick<SegmentType, 'id' | 'name'>) => s.id));
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

  const handleBulkDelete = async () => {
    if (selectedSubscribers.length === 0) {
      toast({ title: 'No Selection', description: 'Please select subscribers to delete.', variant: 'destructive' });
      return;
    }

    startTransition(async () => {
      const result = await bulkDeleteSubscribers(selectedSubscribers);
      if (result.success) {
        toast({ title: 'Success', description: result.message });
        setSelectedSubscribers([]);
        setIsSelectAllMode(false);
        setAllSubscriberIds([]);
        fetchSubscribersAndSegments();
      } else {
        toast({ title: 'Error', description: result.message || 'Failed to delete subscribers.', variant: 'destructive' });
      }
    });
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    setSelectedSubscribers([]); // Clear selection when changing pages
    setIsSelectAllMode(false); // Reset select all mode
    setAllSubscriberIds([]);
  };

  const handlePageSizeChange = (newPageSize: number) => {
    setPageSize(newPageSize);
    setCurrentPage(1); // Reset to first page
    setSelectedSubscribers([]); // Clear selection
    setIsSelectAllMode(false); // Reset select all mode
    setAllSubscriberIds([]);
  };

  const handleStatusFilterChange = (status: string) => {
    setStatusFilter(status);
    setCurrentPage(1); // Reset to first page
    setSelectedSubscribers([]); // Clear selection
    setIsSelectAllMode(false); // Reset select all mode
    setAllSubscriberIds([]);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Subscribers"
        description="Manage your audience and segments."
        actions={
          <div className="flex gap-2">
            <Button onClick={() => setIsImportDialogOpen(true)} variant="outline" disabled={isPending} className="font-medium rounded-lg transition-colors duration-200" style={{letterSpacing: '-0.01em'}}>
              <UploadCloud className="mr-2 h-4 w-4" /> Import Subscribers
            </Button>
            <Button onClick={openAddDialog} disabled={isPending} className="font-medium rounded-lg transition-colors duration-200" style={{letterSpacing: '-0.01em'}}>
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
            className="pl-10 border rounded-lg focus:ring-2 focus:ring-black focus:border-transparent" 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            disabled={isPending}
          />
        </div>
        <div className="flex gap-2">
            <Select value={statusFilter} onValueChange={handleStatusFilterChange}>
              <SelectTrigger className="w-[120px] font-medium rounded-lg transition-colors duration-200" style={{letterSpacing: '-0.01em'}}>
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Filter" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="unsubscribed">Unsubscribed</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="bounced">Bounced</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={() => setIsManageSegmentsDialogOpen(true)} disabled={isPending} className="font-medium rounded-lg transition-colors duration-200" style={{letterSpacing: '-0.01em'}}>
                <Tags className="mr-2 h-4 w-4" /> Manage Segments
            </Button>
        </div>
      </div>

      <Card className="border border rounded-2xl shadow-sm">
        <CardContent className="p-0">
          {/* Select All Banner */}
          {selectedSubscribers.length === subscribers.length && subscribers.length > 0 && !isSelectAllMode && (
            <div className="bg-blue-50 dark:bg-blue-950/30 border-b border-blue-200 dark:border-blue-800 px-4 py-3">
              <div className="flex items-center justify-between">
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  {subscribers.length} subscribers on this page are selected.
                </p>
                <Button
                  variant="link"
                  size="sm"
                  onClick={handleSelectAllAcrossPages}
                  className="text-blue-700 dark:text-blue-300 h-auto p-0 font-medium"
                >
                  Select all {totalCount} subscribers
                </Button>
              </div>
            </div>
          )}
          
          {/* Select All Active Banner */}
          {isSelectAllMode && (
            <div className="bg-blue-100 dark:bg-blue-900/40 border-b border-blue-200 dark:border-blue-700 px-4 py-3">
              <div className="flex items-center justify-between">
                <p className="text-sm text-blue-800 dark:text-blue-200 font-medium">
                  All {totalCount} subscribers are selected.
                </p>
                <Button
                  variant="link"
                  size="sm"
                  onClick={() => {
                    setSelectedSubscribers([]);
                    setIsSelectAllMode(false);
                    setAllSubscriberIds([]);
                  }}
                  className="text-blue-800 dark:text-blue-200 h-auto p-0 font-medium"
                >
                  Clear selection
                </Button>
              </div>
            </div>
          )}

          {isLoading ? (
            <div className="flex items-center justify-center p-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              <p className="ml-2 text-muted-foreground">Loading subscribers...</p>
            </div>
          ) : subscribers.length > 0 ? (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[50px]">                      <Checkbox 
                        checked={
                          isSelectAllMode ? true : 
                          (selectedSubscribers.length === subscribers.length && subscribers.length > 0 ? true : 
                          (selectedSubscribers.length > 0 ? 'indeterminate' : false))
                        }
                        onCheckedChange={handleSelectAll}
                        disabled={isPending}
                      />
                      </TableHead>
                      <TableHead className="font-medium" style={{letterSpacing: '-0.01em'}}>Name</TableHead>
                      <TableHead className="font-medium" style={{letterSpacing: '-0.01em'}}>Email</TableHead>
                      <TableHead className="font-medium" style={{letterSpacing: '-0.01em'}}>Status</TableHead>
                      <TableHead className="font-medium" style={{letterSpacing: '-0.01em'}}>Segments</TableHead>
                      <TableHead className="font-medium" style={{letterSpacing: '-0.01em'}}>Date Added</TableHead>
                      <TableHead className="text-right font-medium" style={{letterSpacing: '-0.01em'}}>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {subscribers.map((sub) => (
                      <TableRow key={sub.id} data-state={selectedSubscribers.includes(sub.id) ? "selected" : ""} className="hover:bg-muted/50 transition-colors duration-200">
                        <TableCell>
                          <Checkbox 
                            checked={selectedSubscribers.includes(sub.id)}
                            onCheckedChange={(checked) => handleSelectRow(sub.id, !!checked)}
                            disabled={isPending}
                          />
                        </TableCell>
                        <TableCell className="font-medium" style={{letterSpacing: '-0.01em'}}>{sub.name || '-'}</TableCell>
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
                            {sub.segments.map((seg: Pick<SegmentType, 'id' | 'name'>) => <Badge key={seg.id} variant="outline" className="mr-1 mb-1 text-xs">{seg.name}</Badge>)}
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
                                    <AlertDialogAction onClick={() => handleDelete(sub.id)} className="bg-red-600 hover:bg-red-700 text-white" disabled={isPending}>
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
              </div>
              <div className="border-t p-4">
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  totalCount={totalCount}
                  pageSize={pageSize}
                  onPageChange={handlePageChange}
                  onPageSizeChange={handlePageSizeChange}
                />
              </div>
            </>
          ) : (
            <div className="py-12 text-center">
              <Users className="mx-auto h-12 w-12 text-muted-foreground" />
              <p className="mt-4 text-muted-foreground">
                No subscribers found{searchTerm ? ' matching your search' : ''}{statusFilter !== 'all' ? ` with status "${statusFilter}"` : ''}, or you haven't added any yet.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
      {selectedSubscribers.length > 0 && (
        <div className="fixed bottom-4 right-4 rounded-2xl border bg-card p-4 shadow-lg">
          <p className="text-sm font-medium mb-2" style={{letterSpacing: '-0.01em'}}>
            {isSelectAllMode 
              ? `All ${selectedSubscribers.length} subscribers selected` 
              : `${selectedSubscribers.length} subscriber(s) selected`
            }
            {isSelectAllMode && (
              <span className="block text-xs text-muted-foreground mt-1">
                Across all pages and filters
              </span>
            )}
          </p>
          <div className="flex gap-2">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button size="sm" variant="destructive" className="font-medium rounded-lg transition-colors duration-200" style={{letterSpacing: '-0.01em'}} disabled={isPending}>
                  <Trash2 className="mr-2 h-4 w-4" /> Delete Selected
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>
                    Delete {selectedSubscribers.length} subscribers?
                  </AlertDialogTitle>
                  <AlertDialogDescription>
                    {isSelectAllMode 
                      ? `This action cannot be undone. This will permanently delete ALL ${selectedSubscribers.length} subscribers that match your current search and filter criteria, along with all their associated data.`
                      : `This action cannot be undone. This will permanently delete the selected ${selectedSubscribers.length} subscribers and all their associated data.`
                    }
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction 
                    onClick={handleBulkDelete}
                    className="bg-red-600 hover:bg-red-700 text-white"
                    disabled={isPending}
                  >
                    {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                    Delete {selectedSubscribers.length} Subscribers
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
            <Button 
              size="sm" 
              variant="outline" 
              className="font-medium rounded-lg transition-colors duration-200" 
              style={{letterSpacing: '-0.01em'}} 
              onClick={() => {
                setSelectedSubscribers([]);
                setIsSelectAllMode(false);
                setAllSubscriberIds([]);
              }}
            >
              Clear Selection
            </Button>
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
              <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)} disabled={isSaving} className="font-medium rounded-lg transition-colors duration-200" style={{letterSpacing: '-0.01em'}}>Cancel</Button>
              <Button type="submit" disabled={isSaving} className="font-medium rounded-lg transition-colors duration-200" style={{letterSpacing: '-0.01em'}}>
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
              <h4 className="font-medium" style={{letterSpacing: '-0.01em'}}>Create New Segment</h4>
              <div>
                <Label htmlFor="newSegmentName">Segment Name</Label>
                <Input id="newSegmentName" value={newSegmentName} onChange={(e) => setNewSegmentName(e.target.value)} placeholder="E.g., VIP Customers" required />
              </div>
              <div>
                <Label htmlFor="newSegmentDescription">Description (Optional)</Label>
                <Textarea id="newSegmentDescription" value={newSegmentDescription} onChange={(e) => setNewSegmentDescription(e.target.value)} placeholder="Internal notes about this segment" />
              </div>
              <Button type="submit" disabled={isSaving || isPending} className="w-full font-medium rounded-lg transition-colors duration-200" style={{letterSpacing: '-0.01em'}}>
                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>} Create Segment
              </Button>
            </form>
            <div className="space-y-2">
              <h4 className="font-medium" style={{letterSpacing: '-0.01em'}}>Existing Segments</h4>
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
            <Button variant="outline" onClick={() => setIsManageSegmentsDialogOpen(false)} className="font-medium rounded-lg transition-colors duration-200" style={{letterSpacing: '-0.01em'}}>Close</Button>
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
