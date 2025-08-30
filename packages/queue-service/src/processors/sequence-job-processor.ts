import { Job } from 'bullmq';
import { 
  DatabaseService, 
  EmailQueueService,
  MarketingSequence, 
  SequenceEnrollment, 
  SequenceStep,
  SequenceStepExecution
} from '@planemail/shared';
import { SequenceJobData, SequenceProcessorResult } from '../sequence-processors';
import { BaseSequenceProcessor } from './base-processor';
import { getSequenceStepProcessor } from './step-processors';

export class SequenceJobProcessor extends BaseSequenceProcessor {
  async executeStep(): Promise<SequenceProcessorResult> {
    throw new Error('SequenceJobProcessor should not execute individual steps');
  }

  async processSequenceJob(job: Job<SequenceJobData>): Promise<SequenceProcessorResult> {
    const { type, sequenceId, enrollmentId, stepId, subscriberId, userId, orgId } = job.data;

    console.log(`🔄 Processing sequence job: ${type} for sequence ${sequenceId}`);

    try {
      switch (type) {
        case 'sequence_step':
          return await this.processSequenceStep(job.data);
        case 'sequence_enrollment':
          return await this.processSequenceEnrollment(job.data);
        case 'sequence_trigger_check':
          return await this.processSequenceTriggerCheck(job.data);
        case 'sequence_unsubscribe':
          return await this.processSequenceUnsubscribe(job.data);
        default:
          throw new Error(`Unknown sequence job type: ${type}`);
      }
    } catch (error: any) {
      console.error(`❌ Error processing sequence job:`, error);
      return {
        success: false,
        error: error.message || 'Unknown sequence processing error',
      };
    }
  }

  private async processSequenceStep(jobData: SequenceJobData): Promise<SequenceProcessorResult> {
    if (!jobData.enrollmentId || !jobData.stepId || !jobData.subscriberId) {
      throw new Error('Missing required fields for sequence step processing');
    }

    console.log(`📧 Processing sequence step: ${jobData.stepId} for enrollment: ${jobData.enrollmentId}`);
    
    try {
      // Load data from database with parallel requests for performance
      const [sequence, enrollment, step, subscriberData] = await Promise.all([
        this.dbService.getSequenceWithSteps(jobData.sequenceId),
        this.dbService.getEnrollment(jobData.enrollmentId),
        this.dbService.getStep(jobData.stepId),
        this.dbService.getSubscriber(jobData.subscriberId),
      ]);

      // Validate all required data exists
      if (!sequence) {
        throw new Error(`Sequence not found: ${jobData.sequenceId}`);
      }
      if (!enrollment) {
        throw new Error(`Enrollment not found: ${jobData.enrollmentId}`);
      }
      if (!step) {
        throw new Error(`Step not found: ${jobData.stepId}`);
      }
      if (!subscriberData) {
        throw new Error(`Subscriber not found: ${jobData.subscriberId}`);
      }

      // Validate sequence execution prerequisites
      const validation = this.validateSequenceExecution(sequence, enrollment, step, subscriberData);
      if (!validation.isValid) {
        return {
          success: false,
          error: validation.error,
          shouldExit: true,
          exitReason: 'validation_failed',
        };
      }

      // Check if step is already completed (idempotency)
      const existingExecution = await this.dbService.checkExistingExecution(enrollment.id, step.id);
      if (existingExecution?.status === 'completed') {
        console.log(`Step ${step.id} already completed for enrollment ${enrollment.id}`);
        return this.getNextStepResult(sequence, step);
      }

      // Create step execution record
      const execution = await this.dbService.createStepExecution({
        enrollmentId: enrollment.id,
        stepId: step.id,
        status: 'executing',
        startedAt: new Date(),
      });

      try {
        // Use the appropriate step processor
        const stepProcessor = getSequenceStepProcessor(step.type, this.dbService, this.emailQueueService);
        
        // Execute the step with timeout protection
        const executionPromise = stepProcessor.executeStep(sequence, enrollment, step, subscriberData);
        const timeoutPromise = new Promise<SequenceProcessorResult>((_, reject) => {
          setTimeout(() => reject(new Error('Step execution timeout')), 300000); // 5 minutes
        });

        const result = await Promise.race([executionPromise, timeoutPromise]);

        // Update execution record
        await this.dbService.updateStepExecution(execution.id, {
          status: result.success ? 'completed' : 'failed',
          completedAt: new Date(),
          result: result.metadata,
          error: result.error,
        });

        // Update enrollment with next step info
        if (result.success) {
          await this.updateEnrollmentProgress(enrollment, result);
        }

        return result;
      } catch (error: any) {
        // Handle execution error with retry logic
        const errorResult = await this.handleStepExecutionError(error, sequence, enrollment, step);
        
        // Update execution record with error
        await this.dbService.updateStepExecution(execution.id, {
          status: errorResult.shouldExit ? 'failed' : 'pending',
          completedAt: errorResult.shouldExit ? new Date() : undefined,
          error: error.message,
        });

        return errorResult;
      }
    } catch (error: any) {
      console.error(`❌ Critical error in sequence step processing:`, error);
      return {
        success: false,
        error: `Critical processing error: ${error.message}`,
        shouldExit: true,
        exitReason: 'critical_error',
      };
    }
  }

  private getNextStepResult(sequence: MarketingSequence, currentStep: SequenceStep): SequenceProcessorResult {
    const nextStep = sequence.steps?.find(s => s.order === currentStep.order + 1);
    
    if (!nextStep) {
      return {
        success: true,
        shouldExit: true,
        exitReason: 'sequence_completed',
      };
    }

    return {
      success: true,
      nextStepId: nextStep.id,
      nextScheduledAt: this.calculateNextScheduledTime(nextStep, sequence.settings),
    };
  }

  private async updateEnrollmentProgress(enrollment: SequenceEnrollment, result: SequenceProcessorResult): Promise<void> {
    const updates: Partial<SequenceEnrollment> = {
      currentStepId: result.nextStepId,
      currentStepStartedAt: result.nextStepId ? new Date() : undefined,
      nextScheduledAt: result.nextScheduledAt,
    };

    if (result.shouldExit) {
      updates.status = 'completed';
      updates.completedAt = new Date();
      updates.exitReason = result.exitReason;
    }

    await this.dbService.updateEnrollment(enrollment.id, updates);
  }

  private async processSequenceEnrollment(jobData: SequenceJobData): Promise<SequenceProcessorResult> {
    if (!jobData.subscriberId) {
      throw new Error('Missing subscriberId for sequence enrollment');
    }

    console.log(`👤 Processing sequence enrollment for subscriber: ${jobData.subscriberId}`);
    
    try {
      // Load sequence with steps and subscriber data
      const [sequence, subscriberData] = await Promise.all([
        this.dbService.getSequenceWithSteps(jobData.sequenceId),
        this.dbService.getSubscriber(jobData.subscriberId),
      ]);

      if (!sequence) {
        throw new Error(`Sequence not found: ${jobData.sequenceId}`);
      }

      if (!subscriberData) {
        throw new Error(`Subscriber not found: ${jobData.subscriberId}`);
      }

      // Validate sequence is active and can accept new enrollments
      if (sequence.status !== 'active') {
        return {
          success: false,
          error: `Cannot enroll in inactive sequence: ${sequence.status}`,
        };
      }

      // Check if subscriber is eligible for enrollment
      const eligibilityCheck = await this.checkEnrollmentEligibility(sequence, subscriberData);
      if (!eligibilityCheck.isEligible) {
        return {
          success: false,
          error: eligibilityCheck.reason,
        };
      }

      // Validate sequence has steps
      if (!sequence.steps || sequence.steps.length === 0) {
        return {
          success: false,
          error: 'Sequence has no steps configured',
        };
      }

      // Find first step (should be order 1)
      const firstStep = sequence.steps
        .filter(step => step.isActive)
        .sort((a, b) => a.order - b.order)[0];

      if (!firstStep) {
        return {
          success: false,
          error: 'No active first step found in sequence',
        };
      }

      // Check for existing enrollment to prevent duplicates
      const existingEnrollment = await this.dbService.findExistingEnrollment(jobData.sequenceId, jobData.subscriberId);
      if (existingEnrollment && existingEnrollment.status === 'active') {
        console.log(`Subscriber ${jobData.subscriberId} already enrolled in sequence ${jobData.sequenceId}`);
        return {
          success: true,
          nextStepId: existingEnrollment.currentStepId || firstStep.id,
          nextScheduledAt: existingEnrollment.nextScheduledAt || this.calculateNextScheduledTime(firstStep, sequence.settings),
          metadata: {
            enrollmentId: existingEnrollment.id,
            isExistingEnrollment: true,
          },
        };
      }

      // Create new enrollment
      const enrollment = await this.dbService.enrollSubscriber(jobData.sequenceId, jobData.subscriberId);

      // Calculate when to execute first step
      const nextScheduledAt = this.calculateNextScheduledTime(firstStep, sequence.settings);

      // Update enrollment with first step info
      await this.dbService.updateEnrollment(enrollment.id, {
        currentStepId: firstStep.id,
        currentStepStartedAt: new Date(),
        nextScheduledAt,
      });

      // Update sequence stats
      await this.updateSequenceEnrollmentStats(jobData.sequenceId);

      console.log(`✅ Successfully enrolled subscriber ${jobData.subscriberId} in sequence ${jobData.sequenceId}`);

      return {
        success: true,
        nextStepId: firstStep.id,
        nextScheduledAt,
        metadata: {
          enrollmentId: enrollment.id,
          firstStepId: firstStep.id,
        },
      };
    } catch (error: any) {
      console.error(`❌ Error processing sequence enrollment:`, error);
      return {
        success: false,
        error: `Enrollment failed: ${error.message}`,
      };
    }
  }

  private async checkEnrollmentEligibility(sequence: MarketingSequence, subscriberData: any): Promise<{ isEligible: boolean; reason?: string }> {
    // Check if subscriber is unsubscribed
    if (subscriberData.status === 'unsubscribed' || subscriberData.globalUnsubscribe) {
      return { isEligible: false, reason: 'Subscriber is unsubscribed' };
    }

    // Check if subscriber has required tags (if specified in trigger config)
    if (sequence.triggerConfig?.requiredTags && Array.isArray(sequence.triggerConfig.requiredTags)) {
      const subscriberTags = subscriberData.tags || [];
      const hasRequiredTags = sequence.triggerConfig.requiredTags.every((requiredTag: string) =>
        subscriberTags.some((tag: any) => 
          typeof tag === 'string' ? tag === requiredTag : tag?.id === requiredTag
        )
      );

      if (!hasRequiredTags) {
        return { isEligible: false, reason: 'Subscriber does not have required tags' };
      }
    }

    // Check if subscriber has valid email
    if (!subscriberData.email || !this.isValidEmail(subscriberData.email)) {
      return { isEligible: false, reason: 'Subscriber has invalid email address' };
    }

    return { isEligible: true };
  }

  private async updateSequenceEnrollmentStats(sequenceId: string): Promise<void> {
    try {
      // Get current sequence stats
      const sequence = await this.dbService.getSequence(sequenceId);
      if (!sequence) {
        console.warn(`Sequence ${sequenceId} not found for stats update`);
        return;
      }

      // Calculate new stats - these would typically be aggregated from the database
      const currentStats = sequence.stats || {};
      const updatedStats = {
        ...currentStats,
        totalEnrollments: (currentStats.totalEnrollments || 0) + 1,
        lastEnrollmentAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await this.dbService.updateSequenceStats(sequenceId, updatedStats);
      console.log(`📊 Updated enrollment stats for sequence ${sequenceId}`, updatedStats);
    } catch (error) {
      console.warn(`Failed to update sequence stats:`, error);
      // Don't throw - stats update failure shouldn't fail the enrollment
    }
  }

  private async processSequenceTriggerCheck(jobData: SequenceJobData): Promise<SequenceProcessorResult> {
    console.log(`🎯 Processing sequence trigger check for sequence: ${jobData.sequenceId}`);
    
    const sequence = await this.dbService.getSequence(jobData.sequenceId);
    if (!sequence) {
      throw new Error(`Sequence not found: ${jobData.sequenceId}`);
    }

    const eligibleSubscribers = await this.dbService.findEligibleSubscribers(sequence);
    console.log(`Found ${eligibleSubscribers.length} eligible subscribers for sequence ${sequence.id}`);

    for (const subscriber of eligibleSubscribers) {
      try {
        await this.dbService.enrollSubscriber(sequence.id, subscriber.id);
        console.log(`✅ Enrolled subscriber ${subscriber.id} in sequence ${sequence.id}`);
      } catch (error: any) {
        console.error(`❌ Failed to enroll subscriber ${subscriber.id}:`, error.message);
      }
    }

    return {
      success: true,
      metadata: {
        eligibleSubscribers: eligibleSubscribers.length,
      },
    };
  }

  private async processSequenceUnsubscribe(jobData: SequenceJobData): Promise<SequenceProcessorResult> {
    if (!jobData.subscriberId) {
      throw new Error('Missing subscriberId for sequence unsubscribe processing');
    }

    console.log(`🚫 Processing sequence unsubscribe for subscriber: ${jobData.subscriberId}`);
    
    try {
      const unsubscribeReason = jobData.metadata?.reason || 'subscriber_unsubscribed';
      
      if (jobData.sequenceId) {
        // Unsubscribe from specific sequence
        await this.dbService.exitSubscriberFromSequence(
          jobData.sequenceId, 
          jobData.subscriberId, 
          unsubscribeReason
        );
        console.log(`✅ Removed subscriber ${jobData.subscriberId} from sequence ${jobData.sequenceId}`);
      } else {
        // Unsubscribe from all sequences (global unsubscribe)
        await this.dbService.exitSubscriberFromAllSequences(
          jobData.subscriberId, 
          unsubscribeReason
        );
        console.log(`✅ Removed subscriber ${jobData.subscriberId} from all sequences`);
      }

      return {
        success: true,
        metadata: {
          subscriberId: jobData.subscriberId,
          reason: unsubscribeReason,
          sequenceId: jobData.sequenceId,
        },
      };
    } catch (error: any) {
      console.error(`❌ Error processing sequence unsubscribe:`, error);
      return {
        success: false,
        error: `Unsubscribe processing failed: ${error.message}`,
      };
    }
  }
}

// Export convenience function for backward compatibility
export async function processSequenceJob(
  job: Job<SequenceJobData>,
  dbService: DatabaseService,
  emailQueueService: EmailQueueService
): Promise<SequenceProcessorResult> {
  const processor = new SequenceJobProcessor(dbService, emailQueueService);
  return await processor.processSequenceJob(job);
}

// Utility functions for creating sequence jobs
export function createSequenceUnsubscribeJob(
  subscriberId: string,
  userId: string,
  reason: string = 'subscriber_unsubscribed',
  sequenceId?: string,
  orgId?: string
): SequenceJobData {
  return {
    type: 'sequence_unsubscribe',
    sequenceId: sequenceId || '', // Will be handled as global unsubscribe if empty
    subscriberId,
    userId,
    orgId,
    metadata: {
      reason,
      triggeredAt: new Date().toISOString(),
    },
  };
}

export function createSequenceEnrollmentJob(
  sequenceId: string,
  subscriberId: string,
  userId: string,
  orgId?: string
): SequenceJobData {
  return {
    type: 'sequence_enrollment',
    sequenceId,
    subscriberId,
    userId,
    orgId,
    metadata: {
      triggeredAt: new Date().toISOString(),
    },
  };
}

export function createSequenceStepJob(
  sequenceId: string,
  enrollmentId: string,
  stepId: string,
  subscriberId: string,
  userId: string,
  scheduledFor?: Date,
  orgId?: string
): SequenceJobData {
  return {
    type: 'sequence_step',
    sequenceId,
    enrollmentId,
    stepId,
    subscriberId,
    userId,
    orgId,
    scheduledFor,
    metadata: {
      triggeredAt: new Date().toISOString(),
    },
  };
}
