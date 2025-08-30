import { EmailQueueService, EmailJobData } from '@planemail/shared';
import { emailQueueManager } from '../queue-manager';

/**
 * Concrete implementation of EmailQueueService that wraps the existing emailQueueManager
 */
export class EmailQueueServiceImpl implements EmailQueueService {
  async addEmailJob(jobData: EmailJobData, delay?: number): Promise<string> {
    try {
      console.log(`📧 Adding email job for ${jobData.recipients[0]?.email} with priority ${jobData.priority}`);
      
      // Determine which queue to use based on priority and type
      let job;
      
      if (jobData.priority === 1) {
        // Transactional emails (highest priority)
        job = await emailQueueManager.addTransactionalEmail(jobData, { delay });
      } else if (jobData.priority >= 4) {
        // Bulk emails (lower priority)
        job = await emailQueueManager.addBulkEmail(jobData, { delay });
      } else {
        // Newsletter/sequence emails (medium priority)
        job = await emailQueueManager.addNewsletterEmail(jobData, { delay });
      }
      
      console.log(`✅ Email job queued with ID: ${job.id}`);
      return job.id || `job_${Date.now()}`;
    } catch (error: any) {
      console.error(`❌ Failed to queue email job:`, error);
      throw new Error(`Failed to queue email: ${error.message}`);
    }
  }
}

// Export singleton instance
export const emailQueueService = new EmailQueueServiceImpl();
