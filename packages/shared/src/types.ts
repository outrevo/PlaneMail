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

// Marketing Automation Sequence Types
export interface MarketingSequence {
  id: string;
  userId: string;
  orgId?: string;
  name: string;
  description?: string;
  status: 'draft' | 'active' | 'paused' | 'completed';
  triggerType: 'subscription' | 'tag_added' | 'tag_removed' | 'manual' | 'webhook' | 'date_based';
  triggerConfig: SequenceTriggerConfig;
  steps: SequenceStep[];
  settings: SequenceSettings;
  stats: SequenceStats;
  createdAt: Date;
  updatedAt: Date;
}

export interface SequenceTriggerConfig {
  // For subscription trigger
  subscriptionEvent?: 'new_subscriber' | 'resubscription';
  segmentIds?: string[];
  
  // For tag-based triggers  
  tagIds?: string[];
  requiredTags?: string[]; // Tags required for enrollment
  
  // For date-based triggers
  dateField?: 'created_at' | 'birthday' | 'custom_date';
  dateOffset?: number; // Days before/after the date
  
  // For webhook triggers
  webhookUrl?: string;
  webhookSecret?: string;
  
  // Conditions for all triggers
  conditions?: SequenceCondition[];
}

export interface SequenceCondition {
  field: string;
  operator: 'equals' | 'not_equals' | 'contains' | 'not_contains' | 'greater_than' | 'less_than';
  value: string | number;
}

export interface SequenceStep {
  id: string;
  type: 'email' | 'wait' | 'condition' | 'action';
  order: number;
  name: string;
  config: SequenceStepConfig;
  isActive: boolean;
}

export interface SequenceStepConfig {
  // Email step config
  emailConfig?: {
    templateId?: string;
    subject: string;
    fromName: string;
    fromEmail: string;
    htmlContent: string;
    sendingProviderId: 'brevo' | 'mailgun' | 'amazon_ses';
  };
  
  // Wait step config
  waitConfig?: {
    duration: number; // in hours
    waitType: 'hours' | 'days' | 'weeks';
    exactTime?: string; // HH:MM format for specific time delivery
    timezone?: string;
  };
  
  // Condition step config
  conditionConfig?: {
    conditions: SequenceCondition[];
    trueStepId?: string; // Next step if condition is true
    falseStepId?: string; // Next step if condition is false
  };
  
  // Action step config
  actionConfig?: {
    actionType: 'add_tag' | 'remove_tag' | 'update_field' | 'webhook';
    tagIds?: string[];
    fieldUpdates?: Record<string, any>;
    webhookUrl?: string;
    webhookData?: Record<string, any>;
  };
  
  // Retry configuration for all step types
  retryCount?: number;
  maxRetries?: number;
}

export interface SequenceSettings {
  maxDuration?: number; // Maximum sequence duration in days
  exitOnGoalAchievement?: boolean;
  allowReentry?: boolean;
  businessHoursOnly?: boolean;
  timezone?: string;
  sendingSchedule?: {
    daysOfWeek: number[]; // 0-6, Sunday=0
    startTime: string; // HH:MM
    endTime: string; // HH:MM
  };
}

export interface SequenceStats {
  totalEntered: number;
  totalCompleted: number;
  totalExited: number;
  totalEnrollments?: number; // Track total enrollments separately
  currentActive: number;
  conversionRate: number;
  avgCompletionTime: number; // in hours
  stepStats: SequenceStepStats[];
  lastEnrollmentAt?: string; // ISO date string
  updatedAt?: string; // ISO date string
}

export interface SequenceStepStats {
  stepId: string;
  totalEntered: number;
  totalCompleted: number;
  emailStats?: {
    sent: number;
    delivered: number;
    opened: number;
    clicked: number;
    bounced: number;
    unsubscribed: number;
  };
}

// Sequence Enrollment
export interface SequenceEnrollment {
  id: string;
  sequenceId: string;
  subscriberId: string;
  status: 'active' | 'completed' | 'exited' | 'paused';
  currentStepId?: string;
  currentStepStartedAt?: Date;
  nextScheduledAt?: Date;
  enrolledAt: Date;
  completedAt?: Date;
  exitedAt?: Date;
  exitReason?: string;
  metadata?: Record<string, any>;
}

// Sequence Job Data for Queue
export interface SequenceJobData {
  type: 'sequence_step' | 'sequence_enrollment' | 'sequence_trigger_check' | 'sequence_unsubscribe';
  sequenceId: string;
  enrollmentId?: string;
  stepId?: string;
  subscriberId?: string;
  userId: string;
  orgId?: string;
  scheduledFor?: Date;
  metadata?: Record<string, any>;
}

// Validation schemas for sequences
export const sequenceStepSchema = z.object({
  id: z.string(),
  type: z.enum(['email', 'wait', 'condition', 'action']),
  order: z.number(),
  name: z.string(),
  isActive: z.boolean(),
  config: z.object({
    emailConfig: z.object({
      templateId: z.string().optional(),
      subject: z.string(),
      fromName: z.string(),
      fromEmail: z.string().email(),
      htmlContent: z.string(),
      sendingProviderId: z.enum(['brevo', 'mailgun', 'amazon_ses']),
    }).optional(),
    waitConfig: z.object({
      duration: z.number().positive(),
      waitType: z.enum(['hours', 'days', 'weeks']),
      exactTime: z.string().optional(),
      timezone: z.string().optional(),
    }).optional(),
    conditionConfig: z.object({
      conditions: z.array(z.object({
        field: z.string(),
        operator: z.enum(['equals', 'not_equals', 'contains', 'not_contains', 'greater_than', 'less_than']),
        value: z.union([z.string(), z.number()]),
      })),
      trueStepId: z.string().optional(),
      falseStepId: z.string().optional(),
    }).optional(),
    actionConfig: z.object({
      actionType: z.enum(['add_tag', 'remove_tag', 'update_field', 'webhook']),
      tagIds: z.array(z.string()).optional(),
      fieldUpdates: z.record(z.any()).optional(),
      webhookUrl: z.string().url().optional(),
      webhookData: z.record(z.any()).optional(),
    }).optional(),
  }),
});

export const marketingSequenceSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  status: z.enum(['draft', 'active', 'paused', 'completed']),
  triggerType: z.enum(['subscription', 'tag_added', 'tag_removed', 'manual', 'webhook', 'date_based']),
  triggerConfig: z.object({
    subscriptionEvent: z.enum(['new_subscriber', 'resubscription']).optional(),
    segmentIds: z.array(z.string()).optional(),
    tagIds: z.array(z.string()).optional(),
    dateField: z.enum(['created_at', 'birthday', 'custom_date']).optional(),
    dateOffset: z.number().optional(),
    webhookUrl: z.string().url().optional(),
    webhookSecret: z.string().optional(),
    conditions: z.array(z.object({
      field: z.string(),
      operator: z.enum(['equals', 'not_equals', 'contains', 'not_contains', 'greater_than', 'less_than']),
      value: z.union([z.string(), z.number()]),
    })).optional(),
  }),
  steps: z.array(sequenceStepSchema),
  settings: z.object({
    maxDuration: z.number().positive().optional(),
    exitOnGoalAchievement: z.boolean().optional(),
    allowReentry: z.boolean().optional(),
    businessHoursOnly: z.boolean().optional(),
    timezone: z.string().optional(),
    sendingSchedule: z.object({
      daysOfWeek: z.array(z.number().min(0).max(6)),
      startTime: z.string(),
      endTime: z.string(),
    }).optional(),
  }),
});

// Database service interface for sequence processing
export interface DatabaseService {
  getSequence(sequenceId: string): Promise<MarketingSequence | null>;
  getSequenceWithSteps(sequenceId: string): Promise<MarketingSequence | null>;
  getEnrollment(enrollmentId: string): Promise<SequenceEnrollment | null>;
  getStep(stepId: string): Promise<SequenceStep | null>;
  getSubscriber(subscriberId: string): Promise<any>;
  getUserIntegrations(userId: string, orgId?: string): Promise<ProviderConfig>;
  findEligibleSubscribers(sequence: MarketingSequence): Promise<any[]>;
  enrollSubscriber(sequenceId: string, subscriberId: string): Promise<SequenceEnrollment>;
  updateEnrollment(enrollmentId: string, updates: Partial<SequenceEnrollment>): Promise<void>;
  createStepExecution(execution: Omit<SequenceStepExecution, 'id' | 'createdAt' | 'updatedAt'>): Promise<SequenceStepExecution>;
  updateStepExecution(executionId: string, updates: Partial<SequenceStepExecution>): Promise<void>;
  updateSequenceStats(sequenceId: string, stats: any): Promise<void>;
  findExistingEnrollment(sequenceId: string, subscriberId: string): Promise<SequenceEnrollment | null>;
  checkExistingExecution(enrollmentId: string, stepId: string): Promise<SequenceStepExecution | null>;
  getActiveEnrollmentsForSubscriber(subscriberId: string): Promise<SequenceEnrollment[]>;
  exitSubscriberFromAllSequences(subscriberId: string, reason: string): Promise<void>;
  exitSubscriberFromSequence(sequenceId: string, subscriberId: string, reason: string): Promise<void>;
}

// Email queue service interface
export interface EmailQueueService {
  addEmailJob(jobData: EmailJobData, delay?: number): Promise<string>;
}

// Sequence step execution interface
export interface SequenceStepExecution {
  id: string;
  enrollmentId: string;
  stepId: string;
  status: 'pending' | 'executing' | 'completed' | 'failed' | 'skipped';
  startedAt?: Date;
  completedAt?: Date;
  result?: any;
  error?: string;
  emailJobId?: string;
  emailMessageId?: string;
  createdAt: Date;
  updatedAt: Date;
}
