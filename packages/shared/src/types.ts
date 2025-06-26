import { z } from 'zod';

// Email job types
export interface EmailJobResponse {
  success: boolean;
  jobId: string | null;
  message: string;
}

export interface EmailJobData {
  // Base email data
  id: string;
  userId: string;
  subject: string;
  fromName: string;
  fromEmail: string;
  htmlContent: string;
  
  // Provider configuration
  sendingProviderId: 'brevo' | 'mailgun' | 'amazon_ses';
  
  // Newsletter metadata
  newsletterId?: string;
  templateId?: string;
  segmentId?: string;
  
  // Recipient data
  recipients: EmailRecipient[];
  
  // Provider-specific configuration
  providerConfig: ProviderConfig;
  
  // Job metadata
  priority: number;
  attempts: number;
  createdAt: Date;
}

export interface EmailRecipient {
  email: string;
  name?: string;
  metadata?: Record<string, any>;
}

export interface ProviderConfig {
  brevo?: {
    apiKey: string;
    senders: { email: string; name?: string }[];
  };
  mailgun?: {
    apiKey: string;
    domain: string;
    region: 'us' | 'eu';
  };
  amazon_ses?: {
    accessKeyId: string;
    secretAccessKey: string;
    region: string;
    verifiedIdentities: string[];
  };
}

// Email service types
export interface EmailServiceOptions {
  // Email content
  subject: string;
  fromName: string;
  fromEmail: string;
  htmlContent: string;
  
  // Recipients
  recipients: EmailRecipient[];
  
  // Provider selection
  sendingProviderId: 'brevo' | 'mailgun' | 'amazon_ses';
  
  // Optional metadata
  newsletterId?: string;
  templateId?: string;
  segmentId?: string;
  
  // Queue options
  priority?: number;
  delay?: number;
  queueType?: 'newsletter' | 'transactional' | 'bulk';
}

export interface EmailServiceResult {
  success: boolean;
  jobId?: string;
  message: string;
  queuePosition?: number;
  estimatedProcessingTime?: number;
}

// Email send results
export interface EmailSendResult {
  success: boolean;
  messageId?: string;
  recipientEmail: string;
  error?: string;
  providerResponse?: any;
}

export interface BulkEmailSendResult {
  success: boolean;
  totalSent: number;
  totalFailed: number;
  results: EmailSendResult[];
  errors: string[];
}

// Queue management types
export interface QueueStats {
  newsletter: QueueMetrics;
  transactional: QueueMetrics;
  bulk: QueueMetrics;
  total: QueueMetrics;
}

export interface QueueMetrics {
  waiting: number;
  active: number;
  completed: number;
  failed: number;
  delayed?: number;
}

export interface HealthStatus {
  status: 'healthy' | 'warning' | 'critical';
  issues: string[];
  metrics: {
    totalActive: number;
    totalFailed: number;
    totalWaiting: number;
    totalCompleted: number;
  } | null;
  timestamp: string;
}

// Validation schemas
export const emailJobDataSchema = z.object({
  id: z.string(),
  userId: z.string(),
  subject: z.string(),
  fromName: z.string(),
  fromEmail: z.string().email(),
  htmlContent: z.string(),
  sendingProviderId: z.enum(['brevo', 'mailgun', 'amazon_ses']),
  newsletterId: z.string().optional(),
  templateId: z.string().optional(),
  segmentId: z.string().optional(),
  recipients: z.array(z.object({
    email: z.string().email(),
    name: z.string().optional(),
    metadata: z.record(z.any()).optional(),
  })),
  priority: z.number(),
  attempts: z.number(),
  createdAt: z.date(),
});

export const emailServiceOptionsSchema = z.object({
  subject: z.string().min(1),
  fromName: z.string().min(1),
  fromEmail: z.string().email(),
  htmlContent: z.string().min(1),
  recipients: z.array(z.object({
    email: z.string().email(),
    name: z.string().optional(),
    metadata: z.record(z.any()).optional(),
  })).min(1),
  sendingProviderId: z.enum(['brevo', 'mailgun', 'amazon_ses']),
  newsletterId: z.string().optional(),
  templateId: z.string().optional(),
  segmentId: z.string().optional(),
  priority: z.number().optional(),
  delay: z.number().optional(),
  queueType: z.enum(['newsletter', 'transactional', 'bulk']).optional(),
});
