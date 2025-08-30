import { EmailJobData, EmailQueueService } from '@planemail/shared';
import { emailQueueManager } from './queue-manager';

/**
 * Concrete implementation of EmailQueueService interface
 * This class bridges the gap between the sequence processors and the actual queue manager
 */
export class EmailQueueServiceImpl implements EmailQueueService {
  async addEmailJob(jobData: EmailJobData, delay?: number): Promise<string> {
    try {
      console.log(`📧 Adding email job: ${jobData.subject} to ${jobData.recipients.map(r => r.email).join(', ')}`);
      
      // Determine which queue to use based on priority or job type
      let job;
      
      if (jobData.priority === 1) {
        // High priority - use transactional queue
        job = await emailQueueManager.addTransactionalEmail(jobData, { delay });
      } else if (jobData.recipients.length > 100) {
        // Large recipient list - use bulk queue
        job = await emailQueueManager.addBulkEmail(jobData, { delay });
      } else {
        // Default - use newsletter queue
        job = await emailQueueManager.addNewsletterEmail(jobData, { delay });
      }
      
      console.log(`✅ Email job queued with ID: ${job.id}`);
      return job.id || `job_${Date.now()}`;
    } catch (error: any) {
      console.error(`❌ Failed to queue email job:`, error);
      throw new Error(`Failed to queue email: ${error.message}`);
    }
  }

  async getEmailJobStatus(jobId: string): Promise<{ status: string; result?: any; error?: string } | null> {
    try {
      const jobInfo = await emailQueueManager.getJob(jobId);
      
      if (!jobInfo) {
        return null;
      }
      
      const { job } = jobInfo;
      
      return {
        status: await job.getState(),
        result: job.returnvalue,
        error: job.failedReason,
      };
    } catch (error: any) {
      console.error(`Failed to get job status for ${jobId}:`, error);
      return null;
    }
  }

  async retryEmailJob(jobId: string): Promise<boolean> {
    try {
      const jobInfo = await emailQueueManager.getJob(jobId);
      
      if (!jobInfo) {
        return false;
      }
      
      const { job } = jobInfo;
      await job.retry();
      
      return true;
    } catch (error: any) {
      console.error(`Failed to retry job ${jobId}:`, error);
      return false;
    }
  }
}

// Export singleton instance
export const emailQueueService = new EmailQueueServiceImpl();
