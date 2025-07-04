'use client';

import { useState, useEffect, useCallback } from 'react';
import { NewsletterJob } from '@/components/newsletter/progress-tracker';

const STORAGE_KEY = 'planemail-newsletter-jobs';
const MAX_JOBS = 10; // Keep only the 10 most recent jobs

export function useNewsletterJobs() {
  const [jobs, setJobs] = useState<NewsletterJob[]>([]);

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
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.error('Failed to clear newsletter jobs from localStorage:', error);
    }
  }, []);

  // Get active jobs (not completed or failed)
  const getActiveJobs = useCallback(() => {
    // We don't have status info in the hook, so we return all jobs
    // The component will filter based on actual status
    return jobs;
  }, [jobs]);

  return {
    jobs,
    addJob,
    removeJob,
    markJobCompleted,
    clearJobs,
    getActiveJobs
  };
}

export default useNewsletterJobs;
