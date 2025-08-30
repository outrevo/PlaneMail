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
import { emailQueueService } from './services/email-queue-service';

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
  job: Job<SequenceJobData>
): Promise<SequenceProcessorResult> {
  console.log(`🔄 Processing sequence job using real implementation: ${job.data.type} for sequence ${job.data.sequenceId}`);
  
  try {
    // Import the real services
    const { databaseService } = await import('./services/database-service');
    const { emailQueueService } = await import('./services/email-queue-service');
    const { processSequenceJob: realProcessSequenceJob } = await import('./processors/sequence-job-processor');
    
    // Use the real sequence job processor with concrete implementations
    const result = await realProcessSequenceJob(job, databaseService, emailQueueService);
    
    console.log(`✅ Sequence job completed: ${result.success ? 'SUCCESS' : 'FAILED'}`);
    if (result.error) {
      console.log(`📊 Error: ${result.error}`);
    }
    if (result.metadata) {
      console.log(`📊 Metadata:`, result.metadata);
    }
    
    return result;
  } catch (error: any) {
    console.error(`❌ Critical error in sequence job processing:`, error);
    return {
      success: false,
      error: `Critical sequence processing error: ${error.message}`,
    };
  }
}

// Process sequence enrollment (when someone is enrolled in a sequence)
async function processSequenceEnrollment(data: SequenceJobData): Promise<SequenceProcessorResult> {
  console.log('Processing sequence enrollment for sequenceId:', data.sequenceId);
  
  // TODO: In a full implementation, this would:
  // 1. Get the sequence from the database
  // 2. Get the first step of the sequence
  // 3. Schedule the first step to be executed
  
  // For now, let's simulate scheduling the first step
  console.log('📅 Scheduling first step of sequence for subscriber');
  
  return {
    success: true,
    processed: 1,
    nextJobs: [{
      type: 'sequence_step',
      sequenceId: data.sequenceId,
      enrollmentId: data.enrollmentId,
      stepId: 'step_1', // Mock step ID
      subscriberId: data.subscriberId,
      userId: data.userId,
      orgId: data.orgId,
      scheduledFor: new Date(Date.now() + 1000), // Schedule 1 second from now
      metadata: { stepOrder: 1, stepType: 'email' }
    }]
  };
}

// Process individual sequence step
async function processSequenceStep(data: SequenceJobData): Promise<SequenceProcessorResult> {
  console.log('Processing sequence step:', data.stepId, 'for enrollment:', data.enrollmentId);
  
  const stepType = data.metadata?.stepType || 'email';
  
  switch (stepType) {
    case 'email':
      return await processEmailStep(data);
    
    case 'wait':
      console.log('⏳ Processing wait step');
      return { success: true, processed: 1 };
    
    case 'condition':
      console.log('🔀 Processing condition step');
      return { success: true, processed: 1 };
    
    case 'action':
      console.log('⚡ Processing action step');
      return { success: true, processed: 1 };
    
    default:
      console.warn('Unknown step type:', stepType);
      return { success: false, error: `Unknown step type: ${stepType}` };
  }
}

// Process email step (send an email)
async function processEmailStep(data: SequenceJobData): Promise<SequenceProcessorResult> {
  console.log('📧 Processing email step for subscriber:', data.subscriberId);
  
  try {
    // Import the email processor
    const { processEmailJob } = await import('./processors');
    
    // Create mock email job data for the sequence email
    const emailJobData = {
      id: `sequence_email_${data.enrollmentId}_${data.stepId}`,
      userId: data.userId,
      subject: `Welcome to our sequence! Step ${data.metadata?.stepOrder || 1}`,
      fromName: 'PlaneMail Team',
      fromEmail: 'hello@planemail.com',
      htmlContent: `
        <h2>Welcome to our email sequence!</h2>
        <p>This is step ${data.metadata?.stepOrder || 1} of your journey with us.</p>
        <p>Stay tuned for more great content!</p>
      `,
      sendingProviderId: 'brevo' as const,
      recipients: [{
        email: `subscriber_${data.subscriberId}@example.com`, // Mock email
        name: 'Valued Subscriber',
        metadata: {
          subscriberId: data.subscriberId,
          sequenceId: data.sequenceId,
          stepId: data.stepId
        }
      }],
      providerConfig: {
        brevo: {
          apiKey: 'mock_api_key', // This would come from user integrations
          senders: [{ email: 'hello@planemail.com', name: 'PlaneMail Team' }]
        }
      },
      priority: 1,
      attempts: 0,
      createdAt: new Date()
    };
    
    // Create a mock job for the email processor
    const mockEmailJob = {
      id: emailJobData.id,
      data: emailJobData,
      updateProgress: async (progress: number) => {
        console.log(`📧 Email job progress: ${progress}%`);
      }
    };
    
    console.log('🚀 Sending sequence email...');
    
    // For now, just simulate sending (since we don't have real provider configs)
    console.log('✅ Sequence email sent successfully (simulated)');
    
    return {
      success: true,
      processed: 1,
      metadata: {
        emailSent: true,
        recipientEmail: emailJobData.recipients[0].email,
        stepOrder: data.metadata?.stepOrder || 1
      }
    };
    
  } catch (error) {
    console.error('❌ Failed to send sequence email:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to send email'
    };
  }
}

// Export utility functions for creating sequence jobs
export { 
  createSequenceUnsubscribeJob,
  createSequenceEnrollmentJob,
  createSequenceStepJob 
} from './processors/sequence-job-processor';
