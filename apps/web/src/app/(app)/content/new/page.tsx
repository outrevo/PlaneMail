'use client';

import { NovelEditor } from '@/components/novel/editor';
import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  ArrowLeft, 
  ArrowRight, 
  Save, 
  Send, 
  Globe, 
  Mail, 
  Users, 
  Eye, 
  Edit3,
  Settings,
  CheckCircle2,
  AlertCircle,
  Clock,
  Calendar
} from 'lucide-react';
import type { JSONContent } from '@tiptap/react';

interface ComplianceStatus {
  hasUnsubscribe: boolean;
  hasSenderAddress: boolean;
  wordCount: number;
  readingTimeMin: number;
}

const WORKFLOW_STEPS = [
  { id: 'compose', label: 'Compose', icon: Edit3, description: 'Write your content' },
  { id: 'settings', label: 'Settings', icon: Settings, description: 'Configure distribution' },
  { id: 'review', label: 'Review', icon: Eye, description: 'Review and publish' },
];

export default function NewContentPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [currentStep, setCurrentStep] = useState('compose');
  const [isSaving, setIsSaving] = useState(false);
  
  // Unified content state
  const [contentData, setContentData] = useState({
    // Basic content
    title: '',
    slug: '',
    content: '',
    contentHtml: '',
    contentJson: {} as JSONContent,
    
    // Distribution settings
    publishToWeb: true,
    sendAsNewsletter: false,
    
    // Web settings
    excerpt: '',
    seoTitle: '',
    seoDescription: '',
    
    // Email settings
    emailSubject: '',
    emailPreheader: '',
    fromName: '',
    fromEmail: '',
    selectedSegments: [] as string[],
    selectedProvider: '',
    
    // Scheduling
    publishNow: true,
    scheduledDate: '',
    scheduledTime: '',
  });
  
  const [compliance, setCompliance] = useState<ComplianceStatus>({
    hasUnsubscribe: false,
    hasSenderAddress: false,
    wordCount: 0,
    readingTimeMin: 1,
  });

  const handleContentUpdate = (text: string, html: string, json: JSONContent) => {
    setContentData(prev => ({
      ...prev,
      content: text,
      contentHtml: html,
      contentJson: json,
    }));
  };

  const handleMetaChange = (meta: { subject: string; preheader: string; fromName: string; fromEmail: string }) => {
    setContentData(prev => ({
      ...prev,
      emailSubject: meta.subject,
      emailPreheader: meta.preheader,
      fromName: meta.fromName,
      fromEmail: meta.fromEmail,
    }));
  };

  const handleComplianceChange = (status: ComplianceStatus) => {
    setCompliance(status);
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
        return contentData.title.trim() && contentData.contentHtml.trim();
      case 'settings':
        if (contentData.sendAsNewsletter) {
          return contentData.emailSubject.trim() && 
                 contentData.fromName.trim() && 
                 contentData.fromEmail.trim() &&
                 compliance.hasUnsubscribe &&
                 compliance.hasSenderAddress;
        }
        return true;
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

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // TODO: Implement save logic
      console.log('Saving content:', contentData);
      
      toast({
        title: 'Content Saved',
        description: 'Your content has been saved as a draft.',
      });
    } catch (error) {
      console.error('Failed to save content:', error);
      toast({
        title: 'Save Failed',
        description: 'Failed to save content. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handlePublish = async () => {
    setIsSaving(true);
    try {
      // TODO: Implement publish logic
      console.log('Publishing content:', contentData);
      
      toast({
        title: 'Content Published',
        description: `Your content has been ${contentData.sendAsNewsletter ? 'sent and ' : ''}published successfully.`,
      });
      
      router.push('/content');
    } catch (error) {
      console.error('Failed to publish content:', error);
      toast({
        title: 'Publish Failed',
        description: 'Failed to publish content. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 'compose':
        return (
          <div className="h-full flex flex-col">
            {/* Title Input */}
            <div className="px-6 py-4 border-b border-border/20">
              <Input
                placeholder="Enter your title..."
                value={contentData.title}
                onChange={(e) => setContentData(prev => ({ ...prev, title: e.target.value }))}
                className="text-lg font-semibold border-none px-0 py-0 h-auto focus-visible:ring-0 placeholder:text-muted-foreground"
              />
            </div>
            
            {/* Editor */}
            <div className="flex-1 overflow-hidden">
              <NovelEditor
                mode="campaign"
                initialContent={contentData.contentHtml}
                placeholder="Start writing your content..."
                onUpdate={handleContentUpdate}
                onMetaChange={handleMetaChange}
                onComplianceChange={handleComplianceChange}
                defaultMeta={{
                  subject: contentData.emailSubject,
                  preheader: contentData.emailPreheader,
                  fromName: contentData.fromName,
                  fromEmail: contentData.fromEmail,
                }}
                hideComplianceSnippets={!contentData.sendAsNewsletter}
              />
            </div>
          </div>
        );

      case 'settings':
        return (
          <div className="max-w-2xl mx-auto p-6 space-y-8">
            {/* Distribution Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-5 w-5" />
                  Distribution Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Web Publishing */}
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label className="text-sm font-medium">Publish to Website</Label>
                    <p className="text-xs text-muted-foreground">Make this content available on your public website</p>
                  </div>
                  <Switch
                    checked={contentData.publishToWeb}
                    onCheckedChange={(checked) => setContentData(prev => ({ ...prev, publishToWeb: checked }))}
                  />
                </div>
                
                {/* Newsletter */}
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label className="text-sm font-medium">Send as Newsletter</Label>
                    <p className="text-xs text-muted-foreground">Email this content to your subscribers</p>
                  </div>
                  <Switch
                    checked={contentData.sendAsNewsletter}
                    onCheckedChange={(checked) => setContentData(prev => ({ ...prev, sendAsNewsletter: checked }))}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Web Settings */}
            {contentData.publishToWeb && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Globe className="h-5 w-5" />
                    Web Settings
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>URL Slug</Label>
                    <Input
                      value={contentData.slug}
                      onChange={(e) => setContentData(prev => ({ ...prev, slug: e.target.value }))}
                      placeholder="my-blog-post"
                    />
                  </div>
                  
                  <div>
                    <Label>Excerpt</Label>
                    <Textarea
                      value={contentData.excerpt}
                      onChange={(e) => setContentData(prev => ({ ...prev, excerpt: e.target.value }))}
                      placeholder="Brief description for previews..."
                      rows={3}
                    />
                  </div>
                  
                  <div>
                    <Label>SEO Title</Label>
                    <Input
                      value={contentData.seoTitle}
                      onChange={(e) => setContentData(prev => ({ ...prev, seoTitle: e.target.value }))}
                      placeholder="SEO-optimized title"
                    />
                  </div>
                  
                  <div>
                    <Label>SEO Description</Label>
                    <Textarea
                      value={contentData.seoDescription}
                      onChange={(e) => setContentData(prev => ({ ...prev, seoDescription: e.target.value }))}
                      placeholder="Meta description for search engines..."
                      rows={2}
                    />
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Email Settings */}
            {contentData.sendAsNewsletter && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Mail className="h-5 w-5" />
                    Email Settings
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>From Name</Label>
                      <Input
                        value={contentData.fromName}
                        onChange={(e) => setContentData(prev => ({ ...prev, fromName: e.target.value }))}
                        placeholder="Your Name"
                      />
                    </div>
                    
                    <div>
                      <Label>From Email</Label>
                      <Input
                        type="email"
                        value={contentData.fromEmail}
                        onChange={(e) => setContentData(prev => ({ ...prev, fromEmail: e.target.value }))}
                        placeholder="sender@yourdomain.com"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <Label>Subject Line</Label>
                    <Input
                      value={contentData.emailSubject}
                      onChange={(e) => setContentData(prev => ({ ...prev, emailSubject: e.target.value }))}
                      placeholder="Your email subject"
                    />
                  </div>
                  
                  <div>
                    <Label>Preheader</Label>
                    <Input
                      value={contentData.emailPreheader}
                      onChange={(e) => setContentData(prev => ({ ...prev, emailPreheader: e.target.value }))}
                      placeholder="Preview text that appears after subject"
                    />
                  </div>

                  {/* Compliance Status */}
                  <div className="mt-6 p-4 border border-border/40 rounded-md bg-muted/20">
                    <h4 className="font-medium mb-3 flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4" />
                      Compliance Status
                    </h4>
                    <div className="space-y-2">
                      <div className={`flex items-center gap-2 text-sm ${
                        compliance.hasUnsubscribe ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {compliance.hasUnsubscribe ? '✓' : '✗'} Unsubscribe link present
                      </div>
                      <div className={`flex items-center gap-2 text-sm ${
                        compliance.hasSenderAddress ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {compliance.hasSenderAddress ? '✓' : '✗'} Physical address included
                      </div>
                      {!(compliance.hasUnsubscribe && compliance.hasSenderAddress) && (
                        <p className="text-xs text-amber-600 mt-2">
                          ⚠️ Add missing compliance elements in the content editor before sending.
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        );

      case 'review':
        return (
          <div className="max-w-2xl mx-auto p-6 space-y-6">
            {/* Content Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Content Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-sm font-medium">Title</Label>
                  <p className="mt-1">{contentData.title || 'Untitled'}</p>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium">Word Count</Label>
                    <p className="mt-1">{compliance.wordCount} words</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Reading Time</Label>
                    <p className="mt-1">~{compliance.readingTimeMin} minutes</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Distribution Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Distribution</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2">
                  <Globe className="h-4 w-4" />
                  <span>Website: {contentData.publishToWeb ? 'Yes' : 'No'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  <span>Newsletter: {contentData.sendAsNewsletter ? 'Yes' : 'No'}</span>
                </div>
                
                {contentData.sendAsNewsletter && (
                  <div className="mt-4 p-3 border border-border/40 rounded-md">
                    <p className="text-sm font-medium">Email Details</p>
                    <div className="mt-2 space-y-1 text-sm text-muted-foreground">
                      <p>From: {contentData.fromName} &lt;{contentData.fromEmail}&gt;</p>
                      <p>Subject: {contentData.emailSubject}</p>
                      {contentData.emailPreheader && (
                        <p>Preheader: {contentData.emailPreheader}</p>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Publishing Options */}
            <Card>
              <CardHeader>
                <CardTitle>Publishing</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label className="text-sm font-medium">Publish Immediately</Label>
                    <p className="text-xs text-muted-foreground">Content will be published right away</p>
                  </div>
                  <Switch
                    checked={contentData.publishNow}
                    onCheckedChange={(checked) => setContentData(prev => ({ ...prev, publishNow: checked }))}
                  />
                </div>
                
                {!contentData.publishNow && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Scheduled Date</Label>
                      <Input
                        type="date"
                        value={contentData.scheduledDate}
                        onChange={(e) => setContentData(prev => ({ ...prev, scheduledDate: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label>Scheduled Time</Label>
                      <Input
                        type="time"
                        value={contentData.scheduledTime}
                        onChange={(e) => setContentData(prev => ({ ...prev, scheduledTime: e.target.value }))}
                      />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-border/40">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => router.push('/content')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Content
          </Button>
          
          <div className="flex items-center gap-3">
            <h1 className="text-lg font-semibold">Create Content</h1>
            <Badge variant="secondary" className="text-xs">
              {contentData.sendAsNewsletter && contentData.publishToWeb ? 'Newsletter + Web' : 
               contentData.sendAsNewsletter ? 'Newsletter' : 'Web Only'}
            </Badge>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Progress */}
          <div className="flex items-center gap-2">
            <Progress value={getProgressPercentage()} className="w-24 h-2" />
            <span className="text-xs text-muted-foreground">
              {getCurrentStepIndex() + 1}/{WORKFLOW_STEPS.length}
            </span>
          </div>
          
          {/* Actions */}
          <Button variant="outline" onClick={handleSave} disabled={isSaving}>
            <Save className="h-4 w-4 mr-2" />
            {isSaving ? 'Saving...' : 'Save Draft'}
          </Button>
          
          {currentStep === 'review' ? (
            <Button onClick={handlePublish} disabled={isSaving || !canProceedToNextStep()}>
              <Send className="h-4 w-4 mr-2" />
              {contentData.publishNow ? 'Publish' : 'Schedule'}
            </Button>
          ) : (
            <Button onClick={nextStep} disabled={!canProceedToNextStep()}>
              Next: {WORKFLOW_STEPS[getCurrentStepIndex() + 1]?.label}
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          )}
        </div>
      </div>

      {/* Step Navigation */}
      <div className="px-6 py-3 border-b border-border/20 bg-muted/10">
        <div className="flex items-center justify-center gap-8">
          {WORKFLOW_STEPS.map((step, index) => {
            const isActive = step.id === currentStep;
            const isCompleted = index < getCurrentStepIndex();
            const StepIcon = step.icon;
            
            return (
              <button
                key={step.id}
                onClick={() => setCurrentStep(step.id)}
                className={`flex items-center gap-3 px-4 py-2 rounded-lg transition-colors ${
                  isActive 
                    ? 'bg-primary text-primary-foreground' 
                    : isCompleted 
                      ? 'bg-green-500/10 text-green-600 hover:bg-green-500/20' 
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                }`}
              >
                <StepIcon className="h-4 w-4" />
                <div className="text-left">
                  <div className="text-sm font-medium">{step.label}</div>
                  <div className="text-xs opacity-80">{step.description}</div>
                </div>
                {isCompleted && <CheckCircle2 className="h-4 w-4" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* Step Content */}
      <div className="flex-1 overflow-hidden">
        {renderStepContent()}
      </div>
    </div>
  );
}
