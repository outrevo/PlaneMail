'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  CheckCircle, 
  AlertCircle, 
  Clock, 
  Mail, 
  Loader2, 
  X,
  RefreshCw,
  Users,
  Send
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { QueueServiceClient } from '@/lib/queue-client';

export interface NewsletterJob {
  jobId: string;
  postTitle: string;
  recipientCount: number;
  createdAt: Date;
  postId?: string;
}

export interface JobStatus {
  success: boolean;
  jobId: string;
  queueName: string;
  status: 'waiting' | 'active' | 'completed' | 'failed' | 'delayed' | 'paused';
  progress: number;
  data: {
    id: string;
    userId: string;
    subject: string;
    recipients: Array<{ email: string; name?: string }>;
    sendingProviderId: string;
  };
  processedOn?: number;
  finishedOn?: number;
  failedReason?: string;
  returnValue?: {
    success: boolean;
    totalSent: number;
    totalFailed: number;
    results: Array<any>;
    errors: string[];
  };
}

interface NewsletterProgressTrackerProps {
  jobs: NewsletterJob[];
  jobStatuses?: Record<string, JobStatus>;
  isPolling?: boolean;
  onJobComplete?: (jobId: string, success: boolean) => void;
  onJobRemove?: (jobId: string) => void;
  className?: string;
}

const queueClient = new QueueServiceClient();

export function NewsletterProgressTracker({ 
  jobs, 
  jobStatuses: providedJobStatuses,
  isPolling: providedIsPolling,
  onJobComplete, 
  onJobRemove,
  className 
}: NewsletterProgressTrackerProps) {
  const [jobStatuses, setJobStatuses] = useState<Record<string, JobStatus>>(providedJobStatuses || {});
  const [isPolling, setIsPolling] = useState(false);
  const { toast } = useToast();

  // Use provided statuses if available, otherwise fetch our own
  const shouldUseOwnPolling = !providedJobStatuses;

  // Update local state when provided statuses change
  useEffect(() => {
    if (providedJobStatuses) {
      setJobStatuses(providedJobStatuses);
    }
  }, [providedJobStatuses]);

  // Use provided polling state if available
  const effectiveIsPolling = providedIsPolling !== undefined ? providedIsPolling : isPolling;

  const fetchJobStatus = useCallback(async (jobId: string): Promise<JobStatus | null> => {
    try {
      const status = await queueClient.getJobStatus(jobId);
      return status;
    } catch (error) {
      console.error(`Failed to fetch status for job ${jobId}:`, error);
      return null;
    }
  }, []);

  const pollJobStatuses = useCallback(async () => {
    if (jobs.length === 0) return;

    setIsPolling(true);
    const statusPromises = jobs.map(job => fetchJobStatus(job.jobId));
    const statuses = await Promise.all(statusPromises);

    const newJobStatuses: Record<string, JobStatus> = {};
    
    jobs.forEach((job, index) => {
      const status = statuses[index];
      if (status) {
        newJobStatuses[job.jobId] = status;
        
        // Check if job completed since last poll
        const previousStatus = jobStatuses[job.jobId];
        if (previousStatus && previousStatus.status !== 'completed' && status.status === 'completed') {
          const success = status.returnValue?.success || false;
          const totalSent = status.returnValue?.totalSent || 0;
          const totalFailed = status.returnValue?.totalFailed || 0;
          
          toast({
            title: success ? 'Newsletter Sent!' : 'Newsletter Partially Sent',
            description: success 
              ? `Successfully sent to ${totalSent} subscribers`
              : `Sent to ${totalSent} subscribers, ${totalFailed} failed`,
            variant: success ? 'default' : 'destructive',
          });
          
          onJobComplete?.(job.jobId, success);
        }
        
        // Check if job failed since last poll
        if (previousStatus && previousStatus.status !== 'failed' && status.status === 'failed') {
          toast({
            title: 'Newsletter Failed',
            description: status.failedReason || 'Unknown error occurred',
            variant: 'destructive',
          });
          
          onJobComplete?.(job.jobId, false);
        }
      }
    });

    setJobStatuses(newJobStatuses);
    setIsPolling(false);
  }, [jobs, jobStatuses, fetchJobStatus, onJobComplete, toast]);

  // Poll job statuses every 2 seconds for active jobs (only if not using provided statuses)
  useEffect(() => {
    if (!shouldUseOwnPolling) return;
    
    const activeJobs = jobs.filter(job => {
      const status = jobStatuses[job.jobId];
      return !status || ['waiting', 'active', 'delayed'].includes(status.status);
    });

    if (activeJobs.length === 0) return;

    const interval = setInterval(pollJobStatuses, 2000);
    return () => clearInterval(interval);
  }, [jobs, jobStatuses, pollJobStatuses, shouldUseOwnPolling]);

  // Initial fetch (only if not using provided statuses)
  useEffect(() => {
    if (!shouldUseOwnPolling) return;
    
    if (jobs.length > 0) {
      pollJobStatuses();
    }
  }, [jobs.length > 0 ? jobs.map(j => j.jobId).join(',') : '', shouldUseOwnPolling]);

  const getStatusIcon = (status?: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'failed':
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      case 'active':
        return <Loader2 className="h-4 w-4 text-blue-600 animate-spin" />;
      case 'waiting':
      case 'delayed':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      default:
        return <Mail className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusBadge = (status?: string, progress?: number) => {
    switch (status) {
      case 'completed':
        return <Badge variant="default" className="bg-green-100 text-green-800">Completed</Badge>;
      case 'failed':
        return <Badge variant="destructive">Failed</Badge>;
      case 'active':
        return <Badge variant="secondary" className="bg-blue-100 text-blue-800">Sending ({progress || 0}%)</Badge>;
      case 'waiting':
        return <Badge variant="outline">Queued</Badge>;
      case 'delayed':
        return <Badge variant="outline" className="bg-yellow-100 text-yellow-800">Delayed</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const formatDuration = (startTime?: number, endTime?: number) => {
    if (!startTime) return 'Not started';
    
    const start = new Date(startTime);
    const end = endTime ? new Date(endTime) : new Date();
    const duration = Math.round((end.getTime() - start.getTime()) / 1000);
    
    if (duration < 60) return `${duration}s`;
    if (duration < 3600) return `${Math.round(duration / 60)}m`;
    return `${Math.round(duration / 3600)}h`;
  };

  if (jobs.length === 0) {
    return null;
  }

  return (
    <div className={className}>
      <div className="space-y-4">
        {jobs.map((job) => {
          const status = jobStatuses[job.jobId];
          const isActive = status && ['waiting', 'active', 'delayed'].includes(status.status);
          
          return (
            <Card key={job.jobId} className="relative">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    {getStatusIcon(status?.status)}
                    <CardTitle className="text-sm font-medium">{job.postTitle}</CardTitle>
                  </div>
                  <div className="flex items-center space-x-2">
                    {getStatusBadge(status?.status, status?.progress)}
                    {onJobRemove && !isActive && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onJobRemove(job.jobId)}
                        className="h-6 w-6 p-0"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </div>
                <CardDescription className="flex items-center space-x-4 text-xs">
                  <span className="flex items-center space-x-1">
                    <Users className="h-3 w-3" />
                    <span>{job.recipientCount} recipients</span>
                  </span>
                  <span className="flex items-center space-x-1">
                    <Send className="h-3 w-3" />
                    <span>{status?.data?.sendingProviderId || 'Unknown provider'}</span>
                  </span>
                  <span>Started {formatDuration(status?.processedOn)}</span>
                </CardDescription>
              </CardHeader>
              
              <CardContent className="pt-0">
                {status && (
                  <div className="space-y-3">
                    {/* Progress bar for active jobs */}
                    {status.status === 'active' && (
                      <div className="space-y-1">
                        <Progress value={status.progress || 0} className="h-2" />
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>Progress: {status.progress || 0}%</span>
                          {effectiveIsPolling && <RefreshCw className="h-3 w-3 animate-spin" />}
                        </div>
                      </div>
                    )}
                    
                    {/* Results for completed jobs */}
                    {status.status === 'completed' && status.returnValue && (
                      <div className="grid grid-cols-2 gap-4 text-xs">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Sent:</span>
                          <span className="font-medium text-green-600">
                            {status.returnValue.totalSent}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Failed:</span>
                          <span className="font-medium text-red-600">
                            {status.returnValue.totalFailed}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Duration:</span>
                          <span className="font-medium">
                            {formatDuration(status.processedOn, status.finishedOn)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Success Rate:</span>
                          <span className="font-medium">
                            {Math.round((status.returnValue.totalSent / (status.returnValue.totalSent + status.returnValue.totalFailed)) * 100)}%
                          </span>
                        </div>
                      </div>
                    )}
                    
                    {/* Error info for failed jobs */}
                    {status.status === 'failed' && (
                      <div className="text-xs text-red-600 bg-red-50 p-2 rounded">
                        <strong>Error:</strong> {status.failedReason || 'Unknown error occurred'}
                      </div>
                    )}
                  </div>
                )}
                
                {!status && (
                  <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    <span>Loading status...</span>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

export default NewsletterProgressTracker;
