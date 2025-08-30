import { Queue, QueueOptions, QueueEvents } from 'bullmq';
import { EmailJobData, EmailServiceOptions } from '@planemail/shared';
import { redis } from './redis';

// Queue configuration using BullMQ
const QUEUE_OPTIONS: QueueOptions = {
  connection: redis,
  defaultJobOptions: {
    removeOnComplete: 100, // Keep last 100 completed jobs
    removeOnFail: 50, // Keep last 50 failed jobs
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
  },
};

// Create different queues for different email types using BullMQ
class EmailQueueManager {
  private static instance: EmailQueueManager;
  
  // Different queues for different priorities and types
  public newsletterQueue: Queue<EmailJobData>;
  public transactionalQueue: Queue<EmailJobData>;
  public bulkQueue: Queue<EmailJobData>;
  public sequenceQueue: Queue<any>; // For sequence processing jobs

  private constructor() {
    // Newsletter queue - for newsletter campaigns
    this.newsletterQueue = new Queue('newsletter-emails', QUEUE_OPTIONS);
    
    // Transactional queue - for immediate emails (confirmations, etc.)
    this.transactionalQueue = new Queue('transactional-emails', {
      ...QUEUE_OPTIONS,
      defaultJobOptions: {
        ...QUEUE_OPTIONS.defaultJobOptions,
        priority: 1, // Highest priority
        attempts: 5, // More retry attempts for important emails
      },
    });
    
    // Bulk queue - for large email campaigns
    this.bulkQueue = new Queue('bulk-emails', {
      ...QUEUE_OPTIONS,
      defaultJobOptions: {
        ...QUEUE_OPTIONS.defaultJobOptions,
        priority: 5, // Lower priority
        delay: 1000, // Add delay between bulk emails
      },
    });

    // Sequence queue - for marketing sequence processing
    this.sequenceQueue = new Queue('sequence-processing', {
      ...QUEUE_OPTIONS,
      defaultJobOptions: {
        ...QUEUE_OPTIONS.defaultJobOptions,
        priority: 2, // High priority for sequence processing
        attempts: 3,
      },
    });

    this.setupQueueEventHandlers();
  }

  public static getInstance(): EmailQueueManager {
    if (!EmailQueueManager.instance) {
      EmailQueueManager.instance = new EmailQueueManager();
    }
    return EmailQueueManager.instance;
  }

  private setupQueueEventHandlers(): void {
    // Queue event handling is done at the worker level
    console.log('Queue manager initialized with event handlers');
  }

  // Add newsletter email job
  public async addNewsletterEmail(
    emailData: EmailJobData,
    options?: { priority?: number; delay?: number }
  ) {
    return this.newsletterQueue.add('send-newsletter-email', emailData, {
      priority: options?.priority || emailData.priority || 3,
      attempts: emailData.attempts || 3,
      delay: options?.delay,
    });
  }

  // Add transactional email job
  public async addTransactionalEmail(
    emailData: EmailJobData,
    options?: { priority?: number; delay?: number }
  ) {
    return this.transactionalQueue.add('send-transactional-email', emailData, {
      priority: 1, // Highest priority
      attempts: 5,
      delay: options?.delay,
    });
  }

  // Add bulk email job
  public async addBulkEmail(
    emailData: EmailJobData,
    options?: { priority?: number; delay?: number }
  ) {
    return this.bulkQueue.add('send-bulk-email', emailData, {
      priority: options?.priority || emailData.priority || 5,
      delay: options?.delay || 1000, // Default 1 second delay
      attempts: 2,
    });
  }

  // Add sequence job
  public async addSequenceJob(
    sequenceJobData: any,
    options?: { priority?: number; delay?: number }
  ) {
    return this.sequenceQueue.add('process-sequence', sequenceJobData, {
      priority: options?.priority || 2,
      attempts: 3,
      delay: options?.delay,
    });
  }

  // Get queue statistics
  public async getQueueStats() {
    const [newsletterStats, transactionalStats, bulkStats] = await Promise.all([
      this.getQueueCounts(this.newsletterQueue),
      this.getQueueCounts(this.transactionalQueue),
      this.getQueueCounts(this.bulkQueue),
    ]);

    return {
      newsletter: newsletterStats,
      transactional: transactionalStats,
      bulk: bulkStats,
      total: {
        waiting: newsletterStats.waiting + transactionalStats.waiting + bulkStats.waiting,
        active: newsletterStats.active + transactionalStats.active + bulkStats.active,
        completed: newsletterStats.completed + transactionalStats.completed + bulkStats.completed,
        failed: newsletterStats.failed + transactionalStats.failed + bulkStats.failed,
      },
    };
  }

  private async getQueueCounts(queue: Queue) {
    const [waiting, active, completed, failed, delayed] = await Promise.all([
      queue.getWaiting(),
      queue.getActive(),
      queue.getCompleted(),
      queue.getFailed(),
      queue.getDelayed(),
    ]);

    return {
      waiting: waiting.length,
      active: active.length,
      completed: completed.length,
      failed: failed.length,
      delayed: delayed.length,
    };
  }

  // Clean up old jobs
  public async cleanQueues(): Promise<void> {
    const queues = [this.newsletterQueue, this.transactionalQueue, this.bulkQueue, this.sequenceQueue];
    
    await Promise.all(
      queues.map(async (queue) => {
        await queue.clean(24 * 60 * 60 * 1000, 100, 'completed'); // Remove completed jobs older than 24 hours
        await queue.clean(7 * 24 * 60 * 60 * 1000, 50, 'failed'); // Remove failed jobs older than 7 days
      })
    );
  }

  // Pause/Resume queues
  public async pauseQueue(queueType: 'newsletter' | 'transactional' | 'bulk'): Promise<void> {
    const queue = this.getQueueByType(queueType);
    await queue.pause();
  }

  public async resumeQueue(queueType: 'newsletter' | 'transactional' | 'bulk'): Promise<void> {
    const queue = this.getQueueByType(queueType);
    await queue.resume();
  }

  private getQueueByType(queueType: 'newsletter' | 'transactional' | 'bulk'): Queue {
    switch (queueType) {
      case 'newsletter':
        return this.newsletterQueue;
      case 'transactional':
        return this.transactionalQueue;
      case 'bulk':
        return this.bulkQueue;
      default:
        throw new Error(`Unknown queue type: ${queueType}`);
    }
  }

  // Get job by ID across all queues
  public async getJob(jobId: string) {
    const queues = [this.newsletterQueue, this.transactionalQueue, this.bulkQueue];
    
    for (const queue of queues) {
      const job = await queue.getJob(jobId);
      if (job) {
        return { job, queueName: queue.name };
      }
    }
    
    return null;
  }

  // Graceful shutdown
  public async close(): Promise<void> {
    await Promise.all([
      this.newsletterQueue.close(),
      this.transactionalQueue.close(),
      this.bulkQueue.close(),
    ]);
  }
}

// Export singleton instance
export const emailQueueManager = EmailQueueManager.getInstance();
export default EmailQueueManager;
