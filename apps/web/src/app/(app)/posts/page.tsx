'use client';

import React, { useState, useEffect, useTransition } from 'react';
import { PageHeader } from '@/components/common/PageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { 
  PlusCircle, 
  Send, 
  FileText, 
  Users, 
  Eye, 
  BarChart2 as AnalyticsIcon, 
  Loader2, 
  AlertTriangle, 
  Server, 
  Mail, 
  Globe,
  Edit3,
  ArrowRight,
  ArrowLeft,
  CheckCircle,
  Clock,
  ExternalLink
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { 
  getPostPageData, 
  createPost, 
  updatePost,
  getUserPosts, 
  sendPostAsEmail,
  publishPostToWeb,
  deletePost,
  autoSaveDraft,
  getAvailableEmailProviders,
  type PostPageDataType,
  type PostWithSegments 
} from './actions';
import Link from 'next/link';
import { NewsletterProgressWidget } from '@/components/newsletter/progress-widget';
import { useNewsletterJobs } from '@/hooks/use-newsletter-jobs';
import { NovelEditor } from '@/components/novel/editor';
import { FullScreenPostEditor } from '@/components/novel/full-screen-editor';
import { useDebouncedCallback } from 'use-debounce';

// Multi-step workflow steps
const WORKFLOW_STEPS = [
  { id: 'compose', label: 'Compose', icon: Edit3 },
  { id: 'audience', label: 'Audience', icon: Users },
  { id: 'email', label: 'Email', icon: Mail },
  { id: 'web', label: 'Web', icon: Globe },
  { id: 'review', label: 'Review', icon: Eye },
];

export default function PostsPage() {
  const { toast } = useToast();
  
  // Workflow state
  const [currentStep, setCurrentStep] = useState('compose');
  const [workflowData, setWorkflowData] = useState({
    // Basic post info
    title: '',
    slug: '',
    excerpt: '',
    
    // Compose step
    content: '',
    contentHtml: '', // Store HTML separately for the editor
    
    // Audience step
    selectedSegments: [] as string[],
    
    // Email step
    emailEnabled: false,
    emailSubject: '',
    fromName: '',
    fromEmail: '',
    selectedSendingProvider: '' as string,
    
    // Web step
    webEnabled: false,
    seoTitle: '',
    seoDescription: '',
  });
  
  // Page data and state
  const [pageData, setPageData] = useState<PostPageDataType | null>(null);
  const [userPosts, setUserPosts] = useState<PostWithSegments[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [activeTab, setActiveTab] = useState('posts');
  const [editingPostId, setEditingPostId] = useState<string | null>(null);
  const [showCreateFlow, setShowCreateFlow] = useState(false);

  // Auto-save state
  const [autoSaveStatus, setAutoSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [availableProviders, setAvailableProviders] = useState<any[]>([]);

  // Newsletter jobs tracking
  const { 
    jobs: newsletterJobs, 
    addJob: addNewsletterJob, 
    removeJob: removeNewsletterJob, 
    markJobCompleted,
    clearJobs: clearNewsletterJobs 
  } = useNewsletterJobs();

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const postsPerPage = 12;

  useEffect(() => {
    setIsLoading(true);
    startTransition(async () => {
      try {
        const [pageDataResult, postsResult, providersResult] = await Promise.all([
          getPostPageData(),
          getUserPosts(),
          getAvailableEmailProviders()
        ]);
        setPageData(pageDataResult);
        setUserPosts(postsResult);
        setAvailableProviders(providersResult.providers);
      } catch (error) {
        console.error('Failed to fetch data:', error);
        toast({
          title: 'Error',
          description: 'Failed to load data. Please refresh the page.',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    });
  }, [toast]);

  // Auto-generate slug from title
  useEffect(() => {
    if (workflowData.title && !editingPostId) {
      const slug = workflowData.title
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim();
      setWorkflowData(prev => ({ ...prev, slug }));
    }
  }, [workflowData.title, editingPostId]);

  // Auto-generate email subject from title
  useEffect(() => {
    if (workflowData.title && !workflowData.emailSubject) {
      setWorkflowData(prev => ({ ...prev, emailSubject: workflowData.title }));
    }
  }, [workflowData.title, workflowData.emailSubject]);

  // Auto-generate SEO title from title
  useEffect(() => {
    if (workflowData.title && !workflowData.seoTitle) {
      setWorkflowData(prev => ({ ...prev, seoTitle: workflowData.title }));
    }
  }, [workflowData.title, workflowData.seoTitle]);

  const resetWorkflow = () => {
    setCurrentStep('compose');
    setWorkflowData({
      title: '',
      slug: '',
      excerpt: '',
      content: '',
      contentHtml: '',
      selectedSegments: [],
      emailEnabled: false,
      emailSubject: '',
      fromName: '',
      fromEmail: '',
      selectedSendingProvider: '',
      webEnabled: false,
      seoTitle: '',
      seoDescription: '',
    });
    setEditingPostId(null);
    setShowCreateFlow(false);
  };

  const getCurrentStepIndex = () => {
    return WORKFLOW_STEPS.findIndex(step => step.id === currentStep);
  };

  const getProgressPercentage = () => {
    return ((getCurrentStepIndex() + 1) / WORKFLOW_STEPS.length) * 100;
  };

  const canProceedToNextStep = () => {
    switch (currentStep) {
      case 'compose':
        return workflowData.title?.trim() && (workflowData.content?.trim() || workflowData.contentHtml?.trim());
      case 'audience':
        return true; // Optional step
      case 'email':
        return !workflowData.emailEnabled || (
          workflowData.emailSubject.trim() &&
          workflowData.fromName.trim() &&
          workflowData.fromEmail.trim() &&
          workflowData.selectedSendingProvider
        );
      case 'web':
        return true; // Optional step
      case 'review':
        return true;
      default:
        return false;
    }
  };

  const nextStep = () => {
    const currentIndex = getCurrentStepIndex();
    if (currentIndex < WORKFLOW_STEPS.length - 1) {
      setCurrentStep(WORKFLOW_STEPS[currentIndex + 1].id);
    }
  };

  const previousStep = () => {
    const currentIndex = getCurrentStepIndex();
    if (currentIndex > 0) {
      setCurrentStep(WORKFLOW_STEPS[currentIndex - 1].id);
    }
  };

  const handleSaveDraft = async () => {
    setIsSaving(true);
    try {
      const formData = new FormData();
      formData.append('title', workflowData.title);
      formData.append('slug', workflowData.slug);
      formData.append('excerpt', workflowData.excerpt);
      formData.append('content', workflowData.contentHtml || workflowData.content || '');
      formData.append('emailSubject', workflowData.emailSubject);
      formData.append('fromName', workflowData.fromName);
      formData.append('fromEmail', workflowData.fromEmail);
      formData.append('webEnabled', workflowData.webEnabled.toString());
      formData.append('seoTitle', workflowData.seoTitle);
      formData.append('seoDescription', workflowData.seoDescription);
      formData.append('status', 'draft');
      formData.append('segmentIds', workflowData.selectedSegments.join(','));
      formData.append('sendingProviderId', workflowData.selectedSendingProvider);

      let result;
      if (editingPostId) {
        result = await updatePost(editingPostId, formData);
      } else {
        result = await createPost(formData);
        if (result.success && result.postId) {
          setEditingPostId(result.postId);
        }
      }

      if (result.success) {
        toast({
          title: 'Success',
          description: result.message,
        });
        // Refresh posts list
        const updatedPosts = await getUserPosts();
        setUserPosts(updatedPosts);
      } else {
        toast({
          title: 'Error',
          description: result.message,
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Failed to save post:', error);
      toast({
        title: 'Error',
        description: 'Failed to save post. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handlePublishPost = async () => {
    if (!editingPostId) {
      // Save first if not saved
      await handleSaveDraft();
      if (!editingPostId) return;
    }

    setIsSaving(true);
    try {
      const promises = [];

      // Send email if enabled
      if (workflowData.emailEnabled) {
        const emailFormData = new FormData();
        emailFormData.append('postId', editingPostId);
        emailFormData.append('emailSubject', workflowData.emailSubject);
        emailFormData.append('fromName', workflowData.fromName);
        emailFormData.append('fromEmail', workflowData.fromEmail);
        emailFormData.append('segmentIds', workflowData.selectedSegments.join(','));
        emailFormData.append('sendingProviderId', workflowData.selectedSendingProvider);
        
        promises.push(sendPostAsEmail(emailFormData));
      }

      // Publish to web if enabled
      if (workflowData.webEnabled) {
        promises.push(publishPostToWeb(editingPostId));
      }

      if (promises.length > 0) {
        const results = await Promise.all(promises);
        const failed = results.filter(r => !r.success);
        
        // Track newsletter job if email was sent successfully
        if (workflowData.emailEnabled) {
          const emailResult = results[0] as any; // Email is always first promise
          if (emailResult.success && emailResult.jobId) {
            // Estimate recipient count - use a simple approximation
            const totalRecipients = workflowData.selectedSegments.length > 0 
              ? 50 // Approximation - could be improved with actual counts
              : 100; // Default for all subscribers

            addNewsletterJob({
              jobId: emailResult.jobId,
              postTitle: workflowData.title || 'Untitled Post',
              recipientCount: totalRecipients,
              createdAt: new Date(),
              postId: editingPostId
            });
          }
        }
        
        if (failed.length === 0) {
          toast({
            title: 'Success',
            description: 'Post published successfully!',
          });
          resetWorkflow();
          setActiveTab('posts');
          // Refresh posts list
          const updatedPosts = await getUserPosts();
          setUserPosts(updatedPosts);
        } else {
          toast({
            title: 'Partial Success',
            description: `Some publishing operations failed: ${failed.map(f => f.message).join(', ')}`,
            variant: 'destructive',
          });
        }
      } else {
        toast({
          title: 'Info',
          description: 'No publishing options selected. Post saved as draft.',
        });
      }
    } catch (error) {
      console.error('Failed to publish post:', error);
      toast({
        title: 'Error',
        description: 'Failed to publish post. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeletePost = async (postId: string) => {
    if (!confirm('Are you sure you want to delete this post? This action cannot be undone.')) {
      return;
    }

    try {
      const result = await deletePost(postId);
      if (result.success) {
        toast({
          title: 'Success',
          description: result.message,
        });
        // Refresh posts list
        const updatedPosts = await getUserPosts();
        setUserPosts(updatedPosts);
      } else {
        toast({
          title: 'Error',
          description: result.message,
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Failed to delete post:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete post. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const editPost = (post: PostWithSegments) => {
    setWorkflowData({
      title: post.title,
      slug: post.slug,
      excerpt: post.excerpt || '',
      content: post.content || '',
      contentHtml: post.content || '', // Use content as HTML initially
      selectedSegments: post.segments.map(s => s.id),
      emailEnabled: !!post.emailSubject,
      emailSubject: post.emailSubject || '',
      fromName: post.fromName || '',
      fromEmail: post.fromEmail || '',
      selectedSendingProvider: post.sendingProviderId || '',
      webEnabled: post.webEnabled || false,
      seoTitle: post.seoTitle || '',
      seoDescription: post.seoDescription || '',
    });
    setEditingPostId(post.id);
    setCurrentStep('compose');
    setShowCreateFlow(true);
  };

  // Auto-save functionality with debouncing
  const debouncedAutoSave = useDebouncedCallback(async () => {
    if (!workflowData.title?.trim()) return;
    
    setAutoSaveStatus('saving');
    try {
      const formData = new FormData();
      formData.append('title', workflowData.title);
      formData.append('content', workflowData.content || '');
      formData.append('excerpt', workflowData.excerpt || '');
      
      const result = await autoSaveDraft(editingPostId, formData);
      
      if (result.success && result.postId && !editingPostId) {
        setEditingPostId(result.postId);
      }
      
      setAutoSaveStatus('saved');
      setTimeout(() => setAutoSaveStatus('idle'), 2000);
    } catch (error) {
      console.error('Auto-save failed:', error);
      setAutoSaveStatus('error');
      setTimeout(() => setAutoSaveStatus('idle'), 3000);
    }
  }, 2000);

  // Trigger auto-save when content changes
  useEffect(() => {
    if (showCreateFlow && (workflowData.title || workflowData.content)) {
      debouncedAutoSave();
    }
  }, [workflowData.title, workflowData.content, showCreateFlow, debouncedAutoSave]);

  // Pagination logic
  const publishedPosts = userPosts.filter(post => 
    post.status === 'published' || post.status === 'sent' || post.webEnabled
  );
  const totalPages = Math.ceil(publishedPosts.length / postsPerPage);
  const paginatedPosts = publishedPosts.slice(
    (currentPage - 1) * postsPerPage,
    currentPage * postsPerPage
  );

  if (isLoading) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <PageHeader 
          title="Posts" 
          description="Create posts that can be sent as newsletters and published as web pages"
        />
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href="/settings/site">
              <Globe className="h-4 w-4 mr-2" />
              Site Settings
            </Link>
          </Button>
          <Button onClick={() => { resetWorkflow(); setShowCreateFlow(true); }}>
            <PlusCircle className="h-4 w-4 mr-2" />
            New Post
          </Button>
        </div>
      </div>

      {/* Newsletter Progress Widget */}
      {newsletterJobs.length > 0 && (
        <NewsletterProgressWidget
          jobs={newsletterJobs}
          onJobComplete={markJobCompleted}
          onJobRemove={removeNewsletterJob}
          onClearAll={clearNewsletterJobs}
        />
      )}

      {showCreateFlow ? (
        <FullScreenPostEditor
          workflowData={workflowData}
          setWorkflowData={setWorkflowData}
          currentStep={currentStep}
          setCurrentStep={setCurrentStep}
          onSave={handleSaveDraft}
          onPublish={handlePublishPost}
          onClose={resetWorkflow}
          isSaving={isSaving}
          pageData={pageData}
          autoSaveStatus={autoSaveStatus}
          availableProviders={availableProviders}
        />
      ) : (
        /* Posts List View */
        <div className="space-y-6">
          {isLoading ? (
            <div className="flex items-center justify-center min-h-[400px]">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : paginatedPosts.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-12">
                  <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No published posts yet</h3>
                  <p className="text-muted-foreground mb-4">
                    Create your first post to get started
                  </p>
                  <Button onClick={() => { resetWorkflow(); setShowCreateFlow(true); }}>
                    <PlusCircle className="h-4 w-4 mr-2" />
                    Create Post
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Posts Grid */}
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {paginatedPosts.map((post) => (
                  <Card key={post.id} className="hover:shadow-md transition-shadow">
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div className="space-y-1">
                          <CardTitle className="text-lg line-clamp-2">{post.title}</CardTitle>
                          <div className="flex items-center gap-2">
                            <Badge variant={
                              post.status === 'published' ? 'default' :
                              post.status === 'sent' ? 'secondary' :
                              post.status === 'draft' ? 'outline' : 'destructive'
                            }>
                              {post.status}
                            </Badge>
                            {post.sentAt && (
                              <Badge variant="outline">
                                <Mail className="h-3 w-3 mr-1" />
                                Email
                              </Badge>
                            )}
                            {post.webEnabled && (
                              <Badge variant="outline">
                                <Globe className="h-3 w-3 mr-1" />
                                Web
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                      {post.excerpt && (
                        <CardDescription className="line-clamp-3">{post.excerpt}</CardDescription>
                      )}
                    </CardHeader>
                    
                    <CardContent>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <Label className="text-xs text-muted-foreground">Created</Label>
                          <p>{new Date(post.createdAt).toLocaleDateString()}</p>
                        </div>
                        {post.sentAt && (
                          <div>
                            <Label className="text-xs text-muted-foreground">Opens</Label>
                            <p>{post.uniqueOpens}</p>
                          </div>
                        )}
                        {post.webEnabled && (
                          <div>
                            <Label className="text-xs text-muted-foreground">Views</Label>
                            <p>{post.webViews}</p>
                          </div>
                        )}
                        <div>
                          <Label className="text-xs text-muted-foreground">Engagement</Label>
                          <p>{post.uniqueOpens + post.webViews}</p>
                        </div>
                      </div>
                    </CardContent>
                    
                    <CardFooter className="flex justify-between">
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => editPost(post)}>
                          <Edit3 className="h-4 w-4" />
                        </Button>
                        {post.webEnabled && (
                          <Button variant="outline" size="sm" asChild>
                            <Link href={`/p/${post.slug}`} target="_blank">
                              <ExternalLink className="h-4 w-4" />
                            </Link>
                          </Button>
                        )}
                      </div>
                      <div className="flex gap-2">
                        {(post.sentAt || post.webEnabled) && (
                          <Button variant="outline" size="sm" asChild>
                            <Link href={`/posts/${post.id}/analytics`}>
                              <AnalyticsIcon className="h-4 w-4" />
                            </Link>
                          </Button>
                        )}
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => handleDeletePost(post.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          Delete
                        </Button>
                      </div>
                    </CardFooter>
                  </Card>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                  >
                    Previous
                  </Button>
                  
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <Button
                      key={page}
                      variant={currentPage === page ? "default" : "outline"}
                      size="sm"
                      onClick={() => setCurrentPage(page)}
                    >
                      {page}
                    </Button>
                  ))}
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                  >
                    Next
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
