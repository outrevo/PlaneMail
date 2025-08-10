'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { NovelEditor } from '@/components/novel/editor';
import { X, ArrowLeft, ArrowRight, Save, Send, Globe, Mail, Users, Eye, Edit3 } from 'lucide-react';
import { type JSONContent } from '@tiptap/react';
import { useToast } from '@/hooks/use-toast';

interface FullScreenPostEditorProps {
  workflowData: any;
  setWorkflowData: (data: any) => void;
  currentStep: string;
  setCurrentStep: (step: string) => void;
  onSave: () => Promise<void>;
  onPublish: () => Promise<void>;
  onClose: () => void;
  isSaving: boolean;
  pageData: any;
  autoSaveStatus?: 'idle' | 'saving' | 'saved' | 'error';
  availableProviders?: Array<{
    id: string;
    name: string;
    connected: boolean;
    status: string;
    senders?: Array<{ email: string; name?: string }>;
  }>;
}

const WORKFLOW_STEPS = [
  { id: 'compose', label: 'Compose', icon: Edit3 },
  { id: 'audience', label: 'Audience', icon: Users },
  { id: 'email', label: 'Email', icon: Mail },
  { id: 'web', label: 'Web', icon: Globe },
  { id: 'review', label: 'Review', icon: Eye },
];

export function FullScreenPostEditor({
  workflowData,
  setWorkflowData,
  currentStep,
  setCurrentStep,
  onSave,
  onPublish,
  onClose,
  isSaving,
  pageData,
  autoSaveStatus = 'idle',
  availableProviders = [],
}: FullScreenPostEditorProps) {
  const [titleFocused, setTitleFocused] = useState(false);
  const { toast } = useToast();

  // Derived compliance state
  const isEmailCompliant = !workflowData.emailEnabled || (
    workflowData.compliance?.hasUnsubscribe && workflowData.compliance?.hasSenderAddress
  );

  const getCurrentStepIndex = () => {
    return WORKFLOW_STEPS.findIndex(step => step.id === currentStep);
  };

  const getProgressPercentage = () => {
    return ((getCurrentStepIndex() + 1) / WORKFLOW_STEPS.length) * 100;
  };

  const canProceedToNextStep = () => {
    switch (currentStep) {
      case 'compose':
        return workflowData.title?.trim() && workflowData.content?.trim();
      case 'audience':
        return true;
      case 'email':
        return !workflowData.emailEnabled || (
          workflowData.emailSubject?.trim() &&
          workflowData.fromName?.trim() &&
          workflowData.fromEmail?.trim() &&
          workflowData.selectedSendingProvider
        );
      case 'web':
        return !workflowData.webEnabled || workflowData.slug?.trim();
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

  // Auto-generate slug from title
  useEffect(() => {
    if (workflowData.title) {
      const slug = workflowData.title
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim();
      setWorkflowData((prev: any) => ({ ...prev, slug }));
    }
  }, [workflowData.title, setWorkflowData]);

  return (
    <div className="fixed inset-0 bg-background z-50 flex flex-col">
      {/* Header */}
      <div className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        {/* Progress Bar */}
        <div className="h-1 bg-muted">
          <div 
            className="h-full bg-primary transition-all duration-300"
            style={{ width: `${getProgressPercentage()}%` }}
          />
        </div>
        
        <div className="px-6 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
            <div className="flex items-center space-x-2">
              {WORKFLOW_STEPS.map((step, index) => (
                <React.Fragment key={step.id}>
                  <button
                    onClick={() => setCurrentStep(step.id)}
                    className={`flex items-center space-x-2 px-3 py-1 rounded-md text-sm transition-colors ${
                      currentStep === step.id
                        ? 'bg-primary text-primary-foreground'
                        : index <= getCurrentStepIndex()
                        ? 'bg-muted text-foreground hover:bg-muted/80'
                        : 'text-muted-foreground'
                    }`}
                  >
                    <step.icon className="h-4 w-4" />
                    <span>{step.label}</span>
                  </button>
                  {index < WORKFLOW_STEPS.length - 1 && (
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            {/* Auto-save status */}
            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
              {autoSaveStatus === 'saving' && (
                <>
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                  <span>Saving...</span>
                </>
              )}
              {autoSaveStatus === 'saved' && (
                <>
                  <div className="w-2 h-2 bg-green-500 rounded-full" />
                  <span>Saved</span>
                </>
              )}
              {autoSaveStatus === 'error' && (
                <>
                  <div className="w-2 h-2 bg-red-500 rounded-full" />
                  <span>Save failed</span>
                </>
              )}
            </div>
            
            <Button variant="outline" onClick={onSave} disabled={isSaving}>
              <Save className="h-4 w-4 mr-2" />
              Save Draft
            </Button>
            {getCurrentStepIndex() < WORKFLOW_STEPS.length - 1 ? (
              <Button 
                onClick={nextStep}
                disabled={!canProceedToNextStep()}
              >
                Next
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            ) : (
              <div className="flex items-center gap-3">
                {!isEmailCompliant && workflowData.emailEnabled && (
                  <span className="text-xs text-amber-600">Email compliance incomplete</span>
                )}
                <Button 
                  onClick={onPublish}
                  disabled={!canProceedToNextStep() || isSaving || !isEmailCompliant}
                  className="bg-green-600 hover:bg-green-700 disabled:opacity-60"
                >
                  <Send className="h-4 w-4 mr-2" />
                  Publish
                </Button>
              </div>
            )}
          </div>
        </div>
        {!isEmailCompliant && workflowData.emailEnabled && (
          <div className="px-6 py-2 bg-amber-50 border-t border-b border-amber-200 text-amber-800 text-xs flex items-center gap-2">
            <span>Missing:</span>
            {!workflowData.compliance?.hasUnsubscribe && <span>Unsubscribe link</span>}
            {!workflowData.compliance?.hasSenderAddress && <span>Sender address</span>}
            <Button size="sm" variant="outline" className="ml-auto h-6 px-2 text-[11px]" onClick={() => setCurrentStep('compose')}>Fix in Compose</Button>
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        {currentStep === 'compose' && (
          <div className="max-w-4xl mx-auto">
            {/* Title Section */}
            <div className="px-12 pt-16 pb-8">
              <div className="space-y-6">
                <div>
                  <input
                    type="text"
                    value={workflowData.title || ''}
                    onChange={(e) => setWorkflowData((prev: any) => ({ ...prev, title: e.target.value }))}
                    onFocus={() => setTitleFocused(true)}
                    onBlur={() => setTitleFocused(false)}
                    placeholder="Untitled"
                    className="w-full text-5xl font-bold bg-transparent border-none outline-none placeholder:text-muted-foreground resize-none"
                    style={{ 
                      lineHeight: '1.1',
                      fontFamily: 'inherit',
                    }}
                  />
                </div>
                
                {(titleFocused || workflowData.excerpt) && (
                  <div>
                    <textarea
                      value={workflowData.excerpt || ''}
                      onChange={(e) => setWorkflowData((prev: any) => ({ ...prev, excerpt: e.target.value }))}
                      placeholder="Write an excerpt..."
                      className="w-full text-xl text-muted-foreground bg-transparent border-none outline-none placeholder:text-muted-foreground resize-none"
                      rows={2}
                      style={{ lineHeight: '1.4' }}
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Editor */}
            <div className="pb-20">
              <NovelEditor
                initialContent={workflowData.contentHtml || workflowData.content || ''}
                onUpdate={(text, html, json) => {
                  setWorkflowData((prev: any) => ({ 
                    ...prev, 
                    content: text, 
                    contentHtml: html,
                    contentJson: json
                  }));
                }}
                onComplianceChange={(status) => setWorkflowData((prev: any) => ({ ...prev, compliance: status }))}
                placeholder="Start writing your post... Press '/' for commands"
                className="min-h-[60vh]"
                showBaseTemplate={!workflowData.contentHtml && !workflowData.content}
                mode="embedded"
              />
            </div>
          </div>
        )}

        {currentStep === 'audience' && (
          <div className="max-w-2xl mx-auto px-12 pt-16">
            <div className="space-y-8">
              <div>
                <h2 className="text-3xl font-bold mb-4">Choose your audience</h2>
                <p className="text-lg text-muted-foreground">
                  Select which segments to target when sending as email. Leave unselected to send to all subscribers.
                </p>
              </div>
              
              <div className="space-y-4">
                {pageData?.segments?.map((segment: { id: React.Key | null | undefined; name: string | number | bigint | boolean | React.ReactElement<any, string | React.JSXElementConstructor<any>> | Iterable<React.ReactNode> | React.ReactPortal | Promise<React.AwaitedReactNode> | null | undefined; description: string | number | bigint | boolean | React.ReactElement<any, string | React.JSXElementConstructor<any>> | Iterable<React.ReactNode> | React.ReactPortal | Promise<React.AwaitedReactNode> | null | undefined; }) => (
                  <label
                    key={segment.id}
                    className="flex items-center space-x-3 p-4 border border-border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={workflowData.selectedSegments?.includes(segment.id) || false}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setWorkflowData((prev: { selectedSegments: any; }) => ({
                            ...prev,
                            selectedSegments: [...(prev.selectedSegments || []), segment.id]
                          }));
                        } else {
                          setWorkflowData((prev: { selectedSegments: any; }) => ({
                            ...prev,
                            selectedSegments: (prev.selectedSegments || []).filter((id: any) => id !== segment.id)
                          }));
                        }
                      }}
                      className="w-4 h-4 rounded border-gray-300"
                    />
                    <div>
                      <div className="font-medium">{segment.name}</div>
                      {segment.description && (
                        <div className="text-sm text-muted-foreground">{segment.description}</div>
                      )}
                    </div>
                  </label>
                ))}
              </div>
            </div>
          </div>
        )}

        {currentStep === 'email' && (
          <div className="max-w-2xl mx-auto px-12 pt-16">
            <div className="space-y-8">
              <div>
                <h2 className="text-3xl font-bold mb-4">Email settings</h2>
                <p className="text-lg text-muted-foreground">
                  Configure how your post will be sent as an email newsletter.
                </p>
              </div>

              <div className="space-y-6">
                <label className="flex items-center space-x-3 p-4 border border-border rounded-lg cursor-pointer transition-colors hover:bg-muted/50">
                  <input
                    type="checkbox"
                    checked={workflowData.emailEnabled || false}
                    onChange={(e) => setWorkflowData((prev: any) => ({ ...prev, emailEnabled: e.target.checked }))}
                    className="w-4 h-4 rounded border-gray-300"
                  />
                  <div>
                    <div className="font-medium">Send as email newsletter</div>
                    <div className="text-sm text-muted-foreground">
                      Send this post to your subscribers via email
                    </div>
                  </div>
                </label>

                {workflowData.emailEnabled && (
                  <div className="space-y-6 pl-6 border-l-2 border-primary">
                    {/* Email Provider Selection */}
                    <div>
                      <Label className="text-base font-medium">Email provider</Label>
                      <p className="text-sm text-muted-foreground mb-3">
                        Choose which email service to use for sending
                      </p>
                      {availableProviders.length > 0 ? (
                        <div className="space-y-2">
                          {availableProviders.map((provider) => (
                            <label
                              key={provider.id}
                              className={`flex items-center space-x-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                                workflowData.selectedSendingProvider === provider.id
                                  ? 'border-primary bg-primary/5'
                                  : 'border-border hover:bg-muted/50'
                              }`}
                            >
                              <input
                                type="radio"
                                name="emailProvider"
                                value={provider.id}
                                checked={workflowData.selectedSendingProvider === provider.id}
                                onChange={(e) => setWorkflowData((prev: any) => ({ 
                                  ...prev, 
                                  selectedSendingProvider: e.target.value,
                                  // Auto-populate from email if available
                                  fromEmail: !prev.fromEmail && provider.senders?.[0]?.email 
                                    ? provider.senders[0].email 
                                    : prev.fromEmail
                                }))}
                                className="w-4 h-4"
                              />
                              <div className="flex-1">
                                <div className="flex items-center space-x-2">
                                  <span className="font-medium">{provider.name}</span>
                                  <span className={`text-xs px-2 py-1 rounded-full ${
                                    provider.status === 'active' 
                                      ? 'bg-green-100 text-green-800' 
                                      : 'bg-gray-100 text-gray-800'
                                  }`}>
                                    {provider.status}
                                  </span>
                                </div>
                                {provider.senders && provider.senders.length > 0 && (
                                  <div className="text-sm text-muted-foreground mt-1">
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
                        <div className="p-4 border border-orange-200 bg-orange-50 rounded-lg">
                          <p className="text-sm text-orange-800">
                            No email providers connected. 
                            <a href="/integrations" className="underline ml-1">Set up an email provider</a> to send emails.
                          </p>
                        </div>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="email-subject" className="text-base font-medium">Subject line</Label>
                      <Input
                        id="email-subject"
                        value={workflowData.emailSubject || ''}
                        onChange={(e) => setWorkflowData((prev: any) => ({ ...prev, emailSubject: e.target.value }))}
                        placeholder="Email subject line"
                        className="mt-2"
                      />
                      {workflowData.emailEnabled && workflowData.selectedSendingProvider && (
                        <div className="mt-3">
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            disabled={!workflowData.fromEmail || !workflowData.emailSubject}
                            onClick={async () => {
                              try {
                                const res = await fetch('/api/email/test-send', {
                                  method: 'POST',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({
                                    subject: workflowData.emailSubject,
                                    fromName: workflowData.fromName || 'Test',
                                    fromEmail: workflowData.fromEmail,
                                    html: workflowData.contentHtml || ''
                                  })
                                });
                                if (res.ok) {
                                  toast({ title: 'Test email queued', description: 'Check your inbox shortly.' });
                                } else {
                                  const data = await res.json().catch(()=>({ message: 'Failed'}));
                                  toast({ title: 'Test failed', description: data.message || 'Error', variant: 'destructive' });
                                }
                              } catch (e:any) {
                                toast({ title: 'Test failed', description: e.message, variant: 'destructive' });
                              }
                            }}
                          >Send Test</Button>
                        </div>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="from-name" className="text-base font-medium">From name</Label>
                        <Input
                          id="from-name"
                          value={workflowData.fromName || ''}
                          onChange={(e) => setWorkflowData((prev: any) => ({ ...prev, fromName: e.target.value }))}
                          placeholder="Your name"
                          className="mt-2"
                        />
                      </div>
                      <div>
                        <Label htmlFor="from-email" className="text-base font-medium">From email</Label>
                        <div className="mt-2">
                          {/* Show available sender emails as suggestions */}
                          {workflowData.selectedSendingProvider && availableProviders.find(p => p.id === workflowData.selectedSendingProvider)?.senders ? (
                            <select
                              value={workflowData.fromEmail || ''}
                              onChange={(e) => setWorkflowData((prev: any) => ({ ...prev, fromEmail: e.target.value }))}
                              className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                            >
                              <option value="">Select sender email</option>
                              {availableProviders
                                .find(p => p.id === workflowData.selectedSendingProvider)
                                ?.senders?.map((sender) => (
                                <option key={sender.email} value={sender.email}>
                                  {sender.name ? `${sender.name} <${sender.email}>` : sender.email}
                                </option>
                              ))}
                            </select>
                          ) : (
                            <Input
                              id="from-email"
                              type="email"
                              value={workflowData.fromEmail || ''}
                              onChange={(e) => setWorkflowData((prev: any) => ({ ...prev, fromEmail: e.target.value }))}
                              placeholder="your@email.com"
                            />
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {currentStep === 'web' && (
          <div className="max-w-2xl mx-auto px-12 pt-16">
            <div className="space-y-8">
              <div>
                <h2 className="text-3xl font-bold mb-4">Web publishing</h2>
                <p className="text-lg text-muted-foreground">
                  Publish your post as a web page that anyone can visit.
                </p>
              </div>

              <div className="space-y-6">
                <label className="flex items-center space-x-3 p-4 border border-border rounded-lg cursor-pointer transition-colors hover:bg-muted/50">
                  <input
                    type="checkbox"
                    checked={workflowData.webEnabled || false}
                    onChange={(e) => setWorkflowData((prev: any) => ({ ...prev, webEnabled: e.target.checked }))}
                    className="w-4 h-4 rounded border-gray-300"
                  />
                  <div>
                    <div className="font-medium">Publish as web page</div>
                    <div className="text-sm text-muted-foreground">
                      Make this post publicly accessible on the web
                    </div>
                  </div>
                </label>

                {workflowData.webEnabled && (
                  <div className="space-y-6 pl-6 border-l-2 border-primary">
                    <div>
                      <Label htmlFor="custom-slug" className="text-base font-medium">URL slug</Label>
                      <p className="text-sm text-muted-foreground mb-2">
                        Customize the URL for your post. Use lowercase letters, numbers, and hyphens only.
                      </p>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-muted-foreground">yourdomain.com/</span>
                        <Input
                          id="custom-slug"
                          value={workflowData.slug || ''}
                          onChange={(e) => {
                            const slug = e.target.value
                              .toLowerCase()
                              .replace(/[^a-z0-9\s-]/g, '')
                              .replace(/\s+/g, '-')
                              .replace(/-+/g, '-');
                            setWorkflowData((prev: any) => ({ ...prev, slug }));
                          }}
                          placeholder="my-post-title"
                          className="flex-1"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <Label htmlFor="seo-title" className="text-base font-medium">SEO title</Label>
                      <Input
                        id="seo-title"
                        value={workflowData.seoTitle || ''}
                        onChange={(e) => setWorkflowData((prev: any) => ({ ...prev, seoTitle: e.target.value }))}
                        placeholder="SEO optimized title"
                        className="mt-2"
                      />
                    </div>
                    <div>
                      <Label htmlFor="seo-description" className="text-base font-medium">SEO description</Label>
                      <textarea
                        id="seo-description"
                        value={workflowData.seoDescription || ''}
                        onChange={(e) => setWorkflowData((prev: any) => ({ ...prev, seoDescription: e.target.value }))}
                        placeholder="Brief description for search engines"
                        rows={3}
                        className="mt-2 w-full px-3 py-2 border border-border rounded-md bg-background resize-none"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {currentStep === 'review' && (
          <div className="max-w-2xl mx-auto px-12 pt-16">
            <div className="space-y-8">
              <div>
                <h2 className="text-3xl font-bold mb-4">Review & publish</h2>
                <p className="text-lg text-muted-foreground">
                  Review your post before publishing.
                </p>
              </div>

              <div className="space-y-6">
                <div className="p-6 border border-border rounded-lg">
                  <h3 className="text-xl font-semibold mb-2">{workflowData.title}</h3>
                  {workflowData.excerpt && (
                    <p className="text-muted-foreground mb-4">{workflowData.excerpt}</p>
                  )}
                  <div className="flex gap-2 mb-4">
                    {workflowData.emailEnabled && (
                      <Badge variant="outline">
                        <Mail className="h-3 w-3 mr-1" />
                        Email
                      </Badge>
                    )}
                    {workflowData.webEnabled && (
                      <Badge variant="outline">
                        <Globe className="h-3 w-3 mr-1" />
                        Web
                      </Badge>
                    )}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    URL: /{workflowData.slug}
                  </div>
                </div>

                <div className="p-6 border border-border rounded-lg">
                  <h4 className="font-medium mb-3">Content preview</h4>
                  <div className="prose prose-sm max-w-none text-muted-foreground">
                    {workflowData.content?.substring(0, 300)}
                    {workflowData.content?.length > 300 && '...'}
                  </div>
                </div>

                {workflowData.emailEnabled && (
                  <div className="p-6 border border-border rounded-lg">
                    <h4 className="font-medium mb-3">Email Compliance</h4>
                    <ul className="space-y-2 text-sm">
                      <li className={`flex items-center gap-2 ${workflowData.compliance?.hasUnsubscribe ? 'text-green-600' : 'text-red-600'}`}>{workflowData.compliance?.hasUnsubscribe ? '✓' : '✗'} Unsubscribe link present</li>
                      <li className={`flex items-center gap-2 ${workflowData.compliance?.hasSenderAddress ? 'text-green-600' : 'text-red-600'}`}>{workflowData.compliance?.hasSenderAddress ? '✓' : '✗'} Sender physical address placeholder</li>
                      <li className="flex items-center gap-2 text-muted-foreground">Words: {workflowData.compliance?.wordCount || 0} · Read ~{workflowData.compliance?.readingTimeMin || 1}m</li>
                    </ul>
                    {(!workflowData.compliance?.hasUnsubscribe || !workflowData.compliance?.hasSenderAddress) && (
                      <div className="mt-4 p-3 rounded border border-amber-300 bg-amber-50 text-amber-800 text-xs flex items-center gap-2">
                        Missing required compliance elements.
                        <Button size="sm" variant="outline" className="h-6 px-2 text-[11px]" onClick={() => setCurrentStep('compose')}>Fix Now</Button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Navigation Footer */}
      <div className="border-t border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-6 py-4">
        <div className="flex justify-between items-center">
          <div>
            {getCurrentStepIndex() > 0 && (
              <Button variant="outline" onClick={previousStep}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Previous
              </Button>
            )}
          </div>
          <div className="text-sm text-muted-foreground">
            Step {getCurrentStepIndex() + 1} of {WORKFLOW_STEPS.length}
          </div>
        </div>
      </div>
    </div>
  );
}
