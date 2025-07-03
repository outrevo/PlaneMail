import axios, { AxiosInstance } from 'axios';
import { EmailJobData, EmailJobResponse } from '@planemail/shared';

export class QueueServiceClient {
  private baseUrl: string;
  private axiosInstance: AxiosInstance;

  constructor(baseUrl: string = process.env.QUEUE_SERVICE_URL || 'http://localhost:3002') {
    this.baseUrl = baseUrl;
    
    // Create axios instance with authentication
    this.axiosInstance = axios.create({
      baseURL: baseUrl,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.QUEUE_API_KEY || process.env.INTERNAL_API_KEY || ''}`
      }
    });

    // Add request interceptor for logging
    this.axiosInstance.interceptors.request.use(
      (config) => {
        console.log(`Queue API Request: ${config.method?.toUpperCase()} ${config.url}`);
        return config;
      },
      (error) => {
        console.error('Queue API Request Error:', error);
        return Promise.reject(error);
      }
    );

    // Add response interceptor for error handling
    this.axiosInstance.interceptors.response.use(
      (response) => response,
      (error) => {
        console.error('Queue API Response Error:', error.response?.data || error.message);
        return Promise.reject(error);
      }
    );
  }

  async addNewsletterJob(jobData: EmailJobData): Promise<EmailJobResponse> {
    try {
      const response = await this.axiosInstance.post('/api/queue/newsletter', jobData);
      return response.data;
    } catch (error) {
      console.error('Failed to add newsletter job:', error);
      throw new Error('Queue service unavailable');
    }
  }

  async addTransactionalJob(jobData: EmailJobData): Promise<EmailJobResponse> {
    try {
      const response = await this.axiosInstance.post('/api/queue/transactional', jobData);
      return response.data;
    } catch (error) {
      console.error('Failed to add transactional job:', error);
      throw new Error('Queue service unavailable');
    }
  }

  async addBulkJob(jobData: EmailJobData): Promise<EmailJobResponse> {
    try {
      const response = await this.axiosInstance.post('/api/queue/bulk', jobData);
      return response.data;
    } catch (error) {
      console.error('Failed to add bulk job:', error);
      throw new Error('Queue service unavailable');
    }
  }

  async getJobStatus(jobId: string): Promise<any> {
    try {
      const response = await this.axiosInstance.get(`/api/queue/status/${jobId}`);
      return response.data;
    } catch (error) {
      console.error('Failed to get job status:', error);
      throw new Error('Queue service unavailable');
    }
  }

  async getQueueStats(): Promise<any> {
    try {
      const response = await this.axiosInstance.get('/api/queue/stats');
      return response.data;
    } catch (error) {
      console.error('Failed to get queue stats:', error);
      throw new Error('Queue service unavailable');
    }
  }

  async health(): Promise<{ status: string; queues: any }> {
    try {
      // Health endpoint doesn't require auth
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
