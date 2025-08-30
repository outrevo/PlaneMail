import { Job } from 'bullmq';
import { 
  EmailJobData, 
  EmailRecipient, 
  ProviderConfig,
  DatabaseService, 
  EmailQueueService, 
  MarketingSequence, 
  SequenceStep,
  SequenceEnrollment,
  SequenceStepExecution,
  SequenceJobData
} from '@planemail/shared';

// Import from new modular structure
export * from './processors/base-processor';
export * from './processors/email-step-processor';
export * from './processors/step-processors';
export * from './processors/sequence-job-processor';

// Re-export types from shared for convenience
export type { 
  SequenceJobData, 
  DatabaseService, 
  EmailQueueService,
  MarketingSequence,
  SequenceStep,
  SequenceEnrollment,
  SequenceStepExecution
} from '@planemail/shared';

export interface SequenceProcessorResult {
  success: boolean;
  processed?: number;
  errors?: string[];
  error?: string;
  nextJobs?: SequenceJobData[];
  nextStepId?: string;
  nextScheduledAt?: Date;
  shouldExit?: boolean;
  exitReason?: string;
  metadata?: Record<string, any>;
}

// Import utilities from the correct location
import { 
  getSequenceStepProcessor
} from './processors/step-processors';

// Sequence job scheduling utilities
export const SEQUENCE_JOB_CONSTANTS = {
  PRIORITY_HIGH: 1,
  PRIORITY_NORMAL: 2,
  PRIORITY_LOW: 3,
  MAX_RETRY_ATTEMPTS: 3,
  TRIGGER_CHECK_INTERVAL: 60 * 60 * 1000, // 1 hour in milliseconds
} as const;

/**
 * Calculate optimal delay for sequence step execution
 */
export function calculateSequenceDelay(scheduledAt: Date): number {
  const now = new Date();
  const delay = scheduledAt.getTime() - now.getTime();
  return Math.max(0, delay);
}

/**
 * Estimate sequence completion time
 */
export function estimateSequenceCompletionTime(steps: any[]): number {
  let totalHours = 0;
  
  for (const step of steps) {
    if (step.type === 'wait' && step.config.waitConfig) {
      const { duration, waitType } = step.config.waitConfig;
      
      switch (waitType) {
        case 'hours':
          totalHours += duration;
          break;
        case 'days':
          totalHours += duration * 24;
          break;
        case 'weeks':
          totalHours += duration * 24 * 7;
          break;
      }
    } else {
      // Add minimal time for other step types
      totalHours += 0.1; // 6 minutes
    }
  }
  
  return totalHours;
}

// Re-export the main processing function
export async function processSequenceJob(
  job: Job<SequenceJobData>,
  dbService: DatabaseService,
  emailQueueService: EmailQueueService
): Promise<SequenceProcessorResult> {
  const processor = new (await import('./processors/sequence-job-processor')).SequenceJobProcessor(dbService, emailQueueService);
  return await processor.processSequenceJob(job);
}

// Export utility functions for creating sequence jobs
export { 
  createSequenceUnsubscribeJob,
  createSequenceEnrollmentJob,
  createSequenceStepJob 
} from './processors/sequence-job-processor';
