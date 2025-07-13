'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { NewsletterJob, JobStatus } from '@/components/newsletter/progress-tracker';
import { QueueServiceClient } from '@/lib/queue-client';

const STORAGE_KEY = 'planemail-newsletter-jobs';
const MAX_JOBS = 10; // Keep only the 10 most recent jobs
const POLL_INTERVAL = 2000; // Poll every 2 seconds

const queueClient = new QueueServiceClient();

export function useNewsletterJobs() {
  const [jobs, setJobs] = useState<NewsletterJob[]>([]);
  const [jobStatuses, setJobStatuses] = useState<Record<string, JobStatus>>({});
  const [isPolling, setIsPolling] = useState(false);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Load jobs from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsedJobs = JSON.parse(stored);
        // Convert date strings back to Date objects
        const jobsWithDates = parsedJobs.map((job: any) => ({
          ...job,
          createdAt: new Date(job.createdAt)
        }));
        setJobs(jobsWithDates);
      }
    } catch (error) {
      console.error('Failed to load newsletter jobs from localStorage:', error);
    }
  }, []);

  // Save jobs to localStorage whenever jobs change
  const saveJobs = useCallback((newJobs: NewsletterJob[]) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newJobs));
    } catch (error) {
      console.error('Failed to save newsletter jobs to localStorage:', error);
    }
  }, []);

  // Fetch job status from queue service
  const fetchJobStatus = useCallback(async (jobId: string): Promise<JobStatus | null> => {
    try {
      const status = await queueClient.getJobStatus(jobId);
      return status;
    } catch (error) {
      console.error(`Failed to fetch status for job ${jobId}:`, error);
      return null;
    }
  }, []);

  // Poll job statuses for active jobs
  const pollJobStatuses = useCallback(async () => {
    if (jobs.length === 0) return;

    setIsPolling(true);
    try {
      const statusPromises = jobs.map(job => fetchJobStatus(job.jobId));
      const statuses = await Promise.all(statusPromises);
      
      const newJobStatuses: Record<string, JobStatus> = {};
      
      jobs.forEach((job, index) => {
        const status = statuses[index];
        if (status) {
          newJobStatuses[job.jobId] = status;
        }
      });

      setJobStatuses(newJobStatuses);
    } catch (error) {
      console.error('Failed to poll job statuses:', error);
    } finally {
      setIsPolling(false);
    }
  }, [jobs, fetchJobStatus]);

  // Start/stop polling based on active jobs
  useEffect(() => {
    const activeJobs = jobs.filter(job => {
      const status = jobStatuses[job.jobId];
      return !status || ['waiting', 'active', 'delayed'].includes(status.status);
    });

    if (activeJobs.length > 0) {
      // Start polling if we have active jobs
      if (!pollIntervalRef.current) {
        pollJobStatuses(); // Initial fetch
        pollIntervalRef.current = setInterval(pollJobStatuses, POLL_INTERVAL);
      }
    } else {
      // Stop polling if no active jobs
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
    }

    // Cleanup on unmount
    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
    };
  }, [jobs, jobStatuses, pollJobStatuses]);

  // Initial status fetch when jobs are loaded
  useEffect(() => {
    if (jobs.length > 0 && Object.keys(jobStatuses).length === 0) {
      pollJobStatuses();
    }
  }, [jobs.length]);

  // Add a new job
  const addJob = useCallback((job: NewsletterJob) => {
    setJobs(currentJobs => {
      const newJobs = [job, ...currentJobs.slice(0, MAX_JOBS - 1)];
      saveJobs(newJobs);
      return newJobs;
    });
  }, [saveJobs]);

  // Remove a job
  const removeJob = useCallback((jobId: string) => {
    setJobs(currentJobs => {
      const newJobs = currentJobs.filter(job => job.jobId !== jobId);
      saveJobs(newJobs);
      return newJobs;
    });
  }, [saveJobs]);

  // Mark job as completed (for cleanup purposes)
  const markJobCompleted = useCallback((jobId: string, success: boolean) => {
    // For now, we'll keep completed jobs to show results
    // Could add auto-cleanup logic here if needed
    console.log(`Job ${jobId} completed with success: ${success}`);
  }, []);

  // Clear all jobs
  const clearJobs = useCallback(() => {
    setJobs([]);
    setJobStatuses({});
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.error('Failed to clear newsletter jobs from localStorage:', error);
    }
  }, []);

  // Get active jobs (jobs that are still processing)
  const getActiveJobs = useCallback(() => {
    return jobs.filter(job => {
      const status = jobStatuses[job.jobId];
      return !status || ['waiting', 'active', 'delayed'].includes(status.status);
    });
  }, [jobs, jobStatuses]);

  // Get job status for a specific job
  const getJobStatus = useCallback((jobId: string): JobStatus | undefined => {
    return jobStatuses[jobId];
  }, [jobStatuses]);

  return {
    jobs,
    jobStatuses,
    isPolling,
    addJob,
    removeJob,
    markJobCompleted,
    clearJobs,
    getActiveJobs,
    getJobStatus,
    pollJobStatuses
  };
}

export default useNewsletterJobs;
