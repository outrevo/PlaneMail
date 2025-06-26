import { Worker, WorkerOptions } from 'bullmq';
import { EmailJobData } from '@planemail/shared';
import { emailQueueManager } from './queue-manager';
import { processEmailJob } from './processors';
import { redis } from './redis';

// Worker configuration
const WORKER_CONFIG = {
  concurrency: {
    newsletter: 2, // Process 2 newsletter jobs concurrently
    transactional: 5, // Process 5 transactional emails concurrently
    bulk: 1, // Process 1 bulk job at a time to avoid overwhelming providers
  },
};

const WORKER_OPTIONS: WorkerOptions = {
  connection: redis,
  removeOnComplete: { count: 100 },
  removeOnFail: { count: 50 },
};

class EmailWorkerManager {
  private static instance: EmailWorkerManager;
  private isStarted = false;
  private workers: Worker[] = [];

  private constructor() {}

  public static getInstance(): EmailWorkerManager {
    if (!EmailWorkerManager.instance) {
      EmailWorkerManager.instance = new EmailWorkerManager();
    }
    return EmailWorkerManager.instance;
  }

  public async startWorkers(): Promise<void> {
    if (this.isStarted) {
      console.log('Email workers are already started');
      return;
    }

    console.log('🚀 Starting BullMQ email workers...');

    // Newsletter queue worker
    const newsletterWorker = new Worker(
      'newsletter-emails',
      async (job) => this.createJobProcessor('newsletter')(job),
      {
        ...WORKER_OPTIONS,
        concurrency: WORKER_CONFIG.concurrency.newsletter,
      }
    );

    // Transactional queue worker
    const transactionalWorker = new Worker(
      'transactional-emails',
      async (job) => this.createJobProcessor('transactional')(job),
      {
        ...WORKER_OPTIONS,
        concurrency: WORKER_CONFIG.concurrency.transactional,
      }
    );

    // Bulk queue worker
    const bulkWorker = new Worker(
      'bulk-emails',
      async (job) => this.createJobProcessor('bulk')(job),
      {
        ...WORKER_OPTIONS,
        concurrency: WORKER_CONFIG.concurrency.bulk,
      }
    );

    this.workers = [newsletterWorker, transactionalWorker, bulkWorker];

    // Set up worker event listeners
    this.setupWorkerEventListeners();

    this.isStarted = true;
    console.log('✅ BullMQ email workers started successfully');
  }

  private createJobProcessor(queueType: string) {
    return async (job: any) => {
      console.log(`Processing ${queueType} job ${job.id} for user ${job.data.userId}`);
      
      const startTime = Date.now();
      
      try {
        // Set initial progress
        await job.updateProgress(0);
        
        // Process the email job
        const result = await processEmailJob(job);
        
        // Set completion progress
        await job.updateProgress(100);
        
        const processingTime = Date.now() - startTime;
        console.log(
          `✅ Completed ${queueType} job ${job.id} in ${processingTime}ms. ` +
          `Sent: ${result.totalSent}, Failed: ${result.totalFailed}`
        );
        
        return result;
      } catch (error: any) {
        const processingTime = Date.now() - startTime;
        console.error(
          `❌ Failed ${queueType} job ${job.id} after ${processingTime}ms:`,
          error.message
        );
        throw error;
      }
    };
  }

  private setupWorkerEventListeners(): void {
    const workers = [
      { worker: this.workers[0], name: 'newsletter' },
      { worker: this.workers[1], name: 'transactional' },
      { worker: this.workers[2], name: 'bulk' },
    ];

    workers.forEach(({ worker, name }) => {
      worker.on('completed', (job, result) => {
        console.log(`✅ ${name} job ${job.id} completed successfully`);
        console.log(`📊 Result: ${result.totalSent} sent, ${result.totalFailed} failed`);
      });

      worker.on('failed', (job, err) => {
        console.error(`❌ ${name} job ${job?.id} failed:`, err.message);
        
        // Log additional context for debugging
        if (job?.data) {
          console.error(`📋 Job data:`, {
            userId: job.data.userId,
            sendingProvider: job.data.sendingProviderId,
            recipientCount: job.data.recipients?.length,
            newsletterId: job.data.newsletterId,
          });
        }
      });

      worker.on('stalled', (jobId) => {
        console.warn(`⚠️ ${name} job ${jobId} stalled and will be retried`);
      });

      worker.on('progress', (job, progress) => {
        if (typeof progress === 'number' && progress % 25 === 0) { // Log every 25% progress
          console.log(`📈 ${name} job ${job.id} progress: ${progress}%`);
        }
      });

      worker.on('active', (job) => {
        console.log(`🔄 ${name} job ${job.id} started processing`);
      });

      worker.on('error', (error) => {
        console.error(`💥 ${name} worker error:`, error);
      });

      worker.on('ready', () => {
        console.log(`🟢 ${name} worker is ready`);
      });

      worker.on('closing', () => {
        console.log(`🔴 ${name} worker is closing`);
      });
    });
  }

  public async stopWorkers(): Promise<void> {
    if (!this.isStarted) {
      console.log('Email workers are not started');
      return;
    }

    console.log('🛑 Stopping BullMQ email workers...');

    // Close all workers
    await Promise.all(this.workers.map(worker => worker.close()));

    this.workers = [];
    this.isStarted = false;
    console.log('✅ BullMQ email workers stopped successfully');
  }

  public async getWorkerStatus() {
    const stats = await emailQueueManager.getQueueStats();
    
    return {
      isStarted: this.isStarted,
      workerCount: this.workers.length,
      queues: stats,
      workers: {
        newsletter: {
          concurrency: WORKER_CONFIG.concurrency.newsletter,
          queue: 'newsletter-emails',
          isRunning: this.isStarted && this.workers[0] && !this.workers[0].closing,
        },
        transactional: {
          concurrency: WORKER_CONFIG.concurrency.transactional,
          queue: 'transactional-emails',
          isRunning: this.isStarted && this.workers[1] && !this.workers[1].closing,
        },
        bulk: {
          concurrency: WORKER_CONFIG.concurrency.bulk,
          queue: 'bulk-emails',
          isRunning: this.isStarted && this.workers[2] && !this.workers[2].closing,
        },
      },
    };
  }

  // Utility methods for queue management
  public async cleanOldJobs(): Promise<void> {
    await emailQueueManager.cleanQueues();
    console.log('🧹 Cleaned old jobs from all queues');
  }

  public async pauseAllQueues(): Promise<void> {
    await Promise.all([
      emailQueueManager.pauseQueue('newsletter'),
      emailQueueManager.pauseQueue('transactional'),
      emailQueueManager.pauseQueue('bulk'),
    ]);
    console.log('⏸️ All queues paused');
  }

  public async resumeAllQueues(): Promise<void> {
    await Promise.all([
      emailQueueManager.resumeQueue('newsletter'),
      emailQueueManager.resumeQueue('transactional'),
      emailQueueManager.resumeQueue('bulk'),
    ]);
    console.log('▶️ All queues resumed');
  }
}

// Export singleton instance
export const emailWorkerManager = EmailWorkerManager.getInstance();
export default EmailWorkerManager;
