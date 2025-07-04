'use client';

import React, { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Mail, 
  ChevronDown, 
  ChevronUp, 
  Loader2, 
  CheckCircle, 
  AlertCircle,
  X
} from 'lucide-react';
import { NewsletterProgressTracker, NewsletterJob } from './progress-tracker';

interface NewsletterProgressWidgetProps {
  jobs: NewsletterJob[];
  onJobComplete?: (jobId: string, success: boolean) => void;
  onJobRemove?: (jobId: string) => void;
  onClearAll?: () => void;
  className?: string;
}

export function NewsletterProgressWidget({ 
  jobs, 
  onJobComplete, 
  onJobRemove,
  onClearAll,
  className 
}: NewsletterProgressWidgetProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (jobs.length === 0) {
    return null;
  }

  // Count jobs by status (we'll assume status from the age since we don't have it here)
  const activeJobs = jobs.length; // Simplified - the tracker component will handle real status
  const hasActiveJobs = activeJobs > 0;

  return (
    <div className={className}>
      <Card className="w-full">
        <CardHeader 
          className="pb-2 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="relative">
                <Mail className="h-4 w-4" />
                {hasActiveJobs && (
                  <div className="absolute -top-1 -right-1 w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                )}
              </div>
              <CardTitle className="text-sm font-medium">
                Newsletter Progress
              </CardTitle>
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant="secondary" className="text-xs">
                {jobs.length} {jobs.length === 1 ? 'job' : 'jobs'}
              </Badge>
              {hasActiveJobs && (
                <Loader2 className="h-3 w-3 text-blue-500 animate-spin" />
              )}
              {isExpanded ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </div>
          </div>
        </CardHeader>
        
        {isExpanded && (
          <CardContent className="pt-0">
            <div className="space-y-3">
              {/* Quick stats */}
              <div className="flex items-center justify-between text-xs text-muted-foreground border-b pb-2">
                <span>Track your newsletter campaigns in real-time</span>
                {onClearAll && jobs.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onClearAll}
                    className="h-6 text-xs"
                  >
                    Clear All
                  </Button>
                )}
              </div>
              
              {/* Progress tracker */}
              <NewsletterProgressTracker
                jobs={jobs}
                onJobComplete={onJobComplete}
                onJobRemove={onJobRemove}
              />
            </div>
          </CardContent>
        )}
      </Card>
    </div>
  );
}

export default NewsletterProgressWidget;
