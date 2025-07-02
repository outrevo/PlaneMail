import axios from 'axios';
import { EmailJobData, EmailJobResponse } from '@planemail/shared';

export class QueueServiceClient {
  private baseUrl: string;

  constructor(baseUrl: string = process.env.QUEUE_SERVICE_URL || 'http://localhost:3002') {
    this.baseUrl = baseUrl;
  }

  async addNewsletterJob(jobData: EmailJobData): Promise<EmailJobResponse> {
    try {
      const response = await axios.post(`${this.baseUrl}/api/queue/newsletter`, jobData);
      return response.data;
    } catch (error) {
      console.error('Failed to add newsletter job:', error);
      throw new Error('Queue service unavailable');
    }
  }

  async addTransactionalJob(jobData: EmailJobData): Promise<EmailJobResponse> {
    try {
      const response = await axios.post(`${this.baseUrl}/api/queue/transactional`, jobData);
      return response.data;
    } catch (error) {
      console.error('Failed to add transactional job:', error);
      throw new Error('Queue service unavailable');
    }
  }

  async addBulkJob(jobData: EmailJobData): Promise<EmailJobResponse> {
    try {
      const response = await axios.post(`${this.baseUrl}/api/queue/bulk`, jobData);
      return response.data;
    } catch (error) {
      console.error('Failed to add bulk job:', error);
      throw new Error('Queue service unavailable');
    }
  }

  async getJobStatus(jobId: string): Promise<any> {
    try {
      const response = await axios.get(`${this.baseUrl}/api/queue/status/${jobId}`);
      return response.data;
    } catch (error) {
      console.error('Failed to get job status:', error);
      throw new Error('Queue service unavailable');
    }
  }

  async getQueueStats(): Promise<any> {
    try {
      const response = await axios.get(`${this.baseUrl}/api/queue/stats`);
      return response.data;
    } catch (error) {
      console.error('Failed to get queue stats:', error);
      throw new Error('Queue service unavailable');
    }
  }

  async health(): Promise<{ status: string; queues: any }> {
    try {
      const response = await axios.get(`${this.baseUrl}/health`);
      return response.data;
    } catch (error) {
      console.error('Queue service health check failed:', error);
      throw new Error('Queue service unavailable');
    }
  }
}

// Singleton instance
export const queueClient = new QueueServiceClient();
