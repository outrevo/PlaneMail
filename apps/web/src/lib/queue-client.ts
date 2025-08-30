import { EmailServiceOptions, EmailServiceResult } from '@planemail/shared';
import { env } from './env';

export class QueueClient {
  private baseUrl: string;

  constructor(baseUrl: string = env.QUEUE_SERVICE_URL || 'http://localhost:3002') {
    this.baseUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
  }

  private async request(endpoint: string, options: RequestInit = {}) {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${env.INTERNAL_API_KEY || env.QUEUE_API_KEY || ''}`,
        ...options.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`Queue API Error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  async addEmailJob(options: EmailServiceOptions): Promise<EmailServiceResult> {
    try {
      const queueType = options.queueType || 'newsletter';
      const result = await this.request(`/api/queue/${queueType}`, {
        method: 'POST',
        body: JSON.stringify(options),
      });
      return result;
    } catch (error) {
      console.error('Failed to add email job:', error);
      throw new Error('Queue service unavailable');
    }
  }

  // Backward compatibility methods
  async addNewsletterJob(jobData: any): Promise<any> {
    return this.addEmailJob({ ...jobData, queueType: 'newsletter' });
  }

  async addTransactionalJob(jobData: any): Promise<any> {
    return this.addEmailJob({ ...jobData, queueType: 'transactional' });
  }

  async addBulkJob(jobData: any): Promise<any> {
    return this.addEmailJob({ ...jobData, queueType: 'bulk' });
  }

  async addSequenceJob(jobData: any): Promise<any> {
    try {
      const result = await this.request('/api/queue/sequence', {
        method: 'POST',
        body: JSON.stringify(jobData),
      });
      return result;
    } catch (error) {
      console.error('Failed to add sequence job:', error);
      throw new Error('Queue service unavailable');
    }
  }

  async getJobStatus(jobId: string): Promise<any> {
    try {
      return await this.request(`/api/jobs/${jobId}/status`);
    } catch (error) {
      console.error('Failed to get job status:', error);
      throw new Error('Queue service unavailable');
    }
  }

  async getQueueStats(): Promise<any> {
    try {
      return await this.request('/api/stats');
    } catch (error) {
      console.error('Failed to get queue stats:', error);
      throw new Error('Queue service unavailable');
    }
  }

  async health(): Promise<{ status: string; queues: any }> {
    try {
      return await this.request('/health');
    } catch (error) {
      console.error('Queue health check failed:', error);
      throw new Error('Queue service unavailable');
    }
  }
}

// Backward compatibility export
export class QueueServiceClient extends QueueClient {}

export const queueClient = new QueueClient();
