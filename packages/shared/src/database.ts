import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { eq, and } from 'drizzle-orm';
import { pgTable, text, varchar, timestamp, uuid, boolean, integer, jsonb } from 'drizzle-orm/pg-core';
import { 
  DatabaseService, 
  MarketingSequence, 
  SequenceEnrollment, 
  SequenceStep, 
  SequenceStepExecution,
  ProviderConfig,
  EmailQueueService,
  EmailJobData
} from './types';

// Essential schema tables for sequence processing
export const appUsers = pgTable('app_users', {
  clerkUserId: varchar('clerk_user_id', { length: 255 }).primaryKey(), 
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().$onUpdate(() => new Date()),
});

export const subscribers = pgTable('subscribers', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: varchar('user_id', { length: 255 }).notNull(),
  clerkOrgId: varchar('clerk_org_id', { length: 255 }),
  email: varchar('email', { length: 255 }).notNull(),
  name: varchar('name', { length: 255 }),
  status: varchar('status', { length: 50 }).default('active').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().$onUpdate(() => new Date()),
});

export const userIntegrations = pgTable('user_integrations', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: varchar('user_id', { length: 255 }).notNull(),
  clerkOrgId: varchar('clerk_org_id', { length: 255 }),
  provider: varchar('provider', { length: 50 }).notNull(),
  apiKey: text('api_key'),
  secretApiKey: text('secret_api_key'),
  status: varchar('status', { length: 50 }).default('inactive').notNull(),
  meta: jsonb('meta'),
  connectedAt: timestamp('connected_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().$onUpdate(() => new Date()),
});

export const marketingSequences = pgTable('marketing_sequences', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: varchar('user_id', { length: 255 }).notNull(),
  clerkOrgId: varchar('clerk_org_id', { length: 255 }),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  status: varchar('status', { length: 50 }).default('draft').notNull(),
  triggerType: varchar('trigger_type', { length: 50 }).notNull(),
  triggerConfig: jsonb('trigger_config').notNull(),
  settings: jsonb('settings').notNull(),
  stats: jsonb('stats').default('{"totalEntered":0,"totalCompleted":0,"totalExited":0,"currentActive":0,"conversionRate":0,"avgCompletionTime":0,"stepStats":[]}').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().$onUpdate(() => new Date()),
});

export const sequenceSteps = pgTable('sequence_steps', {
  id: uuid('id').defaultRandom().primaryKey(),
  sequenceId: uuid('sequence_id').notNull().references(() => marketingSequences.id, { onDelete: 'cascade' }),
  type: varchar('type', { length: 50 }).notNull(),
  order: integer('order').notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  config: jsonb('config').notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().$onUpdate(() => new Date()),
});

export const sequenceEnrollments = pgTable('sequence_enrollments', {
  id: uuid('id').defaultRandom().primaryKey(),
  sequenceId: uuid('sequence_id').notNull().references(() => marketingSequences.id, { onDelete: 'cascade' }),
  subscriberId: uuid('subscriber_id').notNull().references(() => subscribers.id, { onDelete: 'cascade' }),
  status: varchar('status', { length: 50 }).default('active').notNull(),
  currentStepId: uuid('current_step_id').references(() => sequenceSteps.id),
  currentStepStartedAt: timestamp('current_step_started_at'),
  nextScheduledAt: timestamp('next_scheduled_at'),
  enrolledAt: timestamp('enrolled_at').defaultNow().notNull(),
  completedAt: timestamp('completed_at'),
  exitedAt: timestamp('exited_at'),
  exitReason: varchar('exit_reason', { length: 255 }),
  metadata: jsonb('metadata').default('{}'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().$onUpdate(() => new Date()),
});

export const sequenceStepExecutions = pgTable('sequence_step_executions', {
  id: uuid('id').defaultRandom().primaryKey(),
  enrollmentId: uuid('enrollment_id').notNull().references(() => sequenceEnrollments.id, { onDelete: 'cascade' }),
  stepId: uuid('step_id').notNull().references(() => sequenceSteps.id, { onDelete: 'cascade' }),
  status: varchar('status', { length: 50 }).notNull(),
  startedAt: timestamp('started_at'),
  completedAt: timestamp('completed_at'),
  result: jsonb('result'),
  error: text('error'),
  emailJobId: varchar('email_job_id', { length: 255 }),
  emailMessageId: text('email_message_id'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().$onUpdate(() => new Date()),
});

// Schema export
export const schema = {
  appUsers,
  subscribers,
  userIntegrations,
  marketingSequences,
  sequenceSteps,
  sequenceEnrollments,
  sequenceStepExecutions,
};

// Database connection utility
export function createDatabase(connectionString?: string) {
  const databaseUrl = connectionString || process.env.DATABASE_URL;
  
  if (!databaseUrl) {
    throw new Error('DATABASE_URL environment variable is required');
  }

  const pool = new Pool({
    connectionString: databaseUrl,
  });

  return drizzle(pool, { schema });
}

// Database service implementation
export class SharedDatabaseService implements DatabaseService {
  private db: ReturnType<typeof createDatabase>;

  constructor(connectionString?: string) {
    this.db = createDatabase(connectionString);
  }

  async getSequence(sequenceId: string): Promise<MarketingSequence | null> {
    try {
      const results = await this.db
        .select()
        .from(marketingSequences)
        .where(eq(marketingSequences.id, sequenceId))
        .limit(1);
      
      const sequence = results[0];
      if (!sequence) return null;

      // Transform to match MarketingSequence interface
      return {
        ...sequence,
        steps: []
      } as MarketingSequence;
    } catch (error) {
      console.error('Error getting sequence:', error);
      throw error;
    }
  }

  async getSequenceWithSteps(sequenceId: string): Promise<MarketingSequence | null> {
    try {
      // Get sequence
      const sequence = await this.getSequence(sequenceId);
      if (!sequence) return null;

      // Get steps for this sequence
      const steps = await this.db
        .select()
        .from(sequenceSteps)
        .where(eq(sequenceSteps.sequenceId, sequenceId))
        .orderBy(sequenceSteps.order);

      // Attach steps to sequence
      return {
        ...sequence,
        steps: steps as SequenceStep[]
      };
    } catch (error) {
      console.error('Error getting sequence with steps:', error);
      throw error;
    }
  }

  async getEnrollment(enrollmentId: string): Promise<SequenceEnrollment | null> {
    try {
      const results = await this.db
        .select()
        .from(sequenceEnrollments)
        .where(eq(sequenceEnrollments.id, enrollmentId))
        .limit(1);
      
      return results[0] as SequenceEnrollment || null;
    } catch (error) {
      console.error('Error getting enrollment:', error);
      throw error;
    }
  }

  async getStep(stepId: string): Promise<SequenceStep | null> {
    try {
      const results = await this.db
        .select()
        .from(sequenceSteps)
        .where(eq(sequenceSteps.id, stepId))
        .limit(1);
      
      return results[0] as SequenceStep || null;
    } catch (error) {
      console.error('Error getting step:', error);
      throw error;
    }
  }

  async getSubscriber(subscriberId: string): Promise<any> {
    try {
      const results = await this.db
        .select()
        .from(subscribers)
        .where(eq(subscribers.id, subscriberId))
        .limit(1);
      
      return results[0] || null;
    } catch (error) {
      console.error('Error getting subscriber:', error);
      throw error;
    }
  }

  async getUserIntegrations(userId: string, orgId?: string): Promise<ProviderConfig> {
    try {
      const whereClause = orgId 
        ? and(eq(userIntegrations.userId, userId), eq(userIntegrations.clerkOrgId, orgId))
        : eq(userIntegrations.userId, userId);

      const results = await this.db
        .select()
        .from(userIntegrations)
        .where(whereClause);
      
      // Transform to ProviderConfig format
      const config: ProviderConfig = {};
      results.forEach((integration: any) => {
        (config as any)[integration.provider] = {
          apiKey: integration.apiKey,
          secretApiKey: integration.secretApiKey,
          meta: integration.meta
        };
      });

      return config;
    } catch (error) {
      console.error('Error getting user integrations:', error);
      throw error;
    }
  }

  async findEligibleSubscribers(sequence: MarketingSequence): Promise<any[]> {
    try {
      // This would implement sequence targeting logic
      // For now, return empty array as this is complex logic
      return [];
    } catch (error) {
      console.error('Error finding eligible subscribers:', error);
      throw error;
    }
  }

  async enrollSubscriber(sequenceId: string, subscriberId: string): Promise<SequenceEnrollment> {
    try {
      const enrollment = {
        id: crypto.randomUUID(),
        sequenceId,
        subscriberId,
        status: 'active' as const,
        enrolledAt: new Date(),
        metadata: {},
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const results = await this.db
        .insert(sequenceEnrollments)
        .values(enrollment)
        .returning();

      return results[0] as SequenceEnrollment;
    } catch (error) {
      console.error('Error enrolling subscriber:', error);
      throw error;
    }
  }

  async updateEnrollment(enrollmentId: string, updates: Partial<SequenceEnrollment>): Promise<void> {
    try {
      await this.db
        .update(sequenceEnrollments)
        .set({ ...updates, updatedAt: new Date() })
        .where(eq(sequenceEnrollments.id, enrollmentId));
    } catch (error) {
      console.error('Error updating enrollment:', error);
      throw error;
    }
  }

  async createStepExecution(execution: Omit<SequenceStepExecution, 'id' | 'createdAt' | 'updatedAt'>): Promise<SequenceStepExecution> {
    try {
      const newExecution = {
        id: crypto.randomUUID(),
        ...execution,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const results = await this.db
        .insert(sequenceStepExecutions)
        .values(newExecution)
        .returning();

      return results[0] as SequenceStepExecution;
    } catch (error) {
      console.error('Error creating step execution:', error);
      throw error;
    }
  }

  async updateStepExecution(executionId: string, updates: Partial<SequenceStepExecution>): Promise<void> {
    try {
      await this.db
        .update(sequenceStepExecutions)
        .set({ ...updates, updatedAt: new Date() })
        .where(eq(sequenceStepExecutions.id, executionId));
    } catch (error) {
      console.error('Error updating step execution:', error);
      throw error;
    }
  }

  async updateSequenceStats(sequenceId: string, stats: any): Promise<void> {
    try {
      await this.db
        .update(marketingSequences)
        .set({ stats, updatedAt: new Date() })
        .where(eq(marketingSequences.id, sequenceId));
    } catch (error) {
      console.error('Error updating sequence stats:', error);
      throw error;
    }
  }

  async findExistingEnrollment(sequenceId: string, subscriberId: string): Promise<SequenceEnrollment | null> {
    try {
      const results = await this.db
        .select()
        .from(sequenceEnrollments)
        .where(
          and(
            eq(sequenceEnrollments.sequenceId, sequenceId),
            eq(sequenceEnrollments.subscriberId, subscriberId)
          )
        )
        .limit(1);
      
      return results[0] as SequenceEnrollment || null;
    } catch (error) {
      console.error('Error finding existing enrollment:', error);
      throw error;
    }
  }

  async checkExistingExecution(enrollmentId: string, stepId: string): Promise<SequenceStepExecution | null> {
    try {
      const results = await this.db
        .select()
        .from(sequenceStepExecutions)
        .where(
          and(
            eq(sequenceStepExecutions.enrollmentId, enrollmentId),
            eq(sequenceStepExecutions.stepId, stepId)
          )
        )
        .limit(1);
      
      return results[0] as SequenceStepExecution || null;
    } catch (error) {
      console.error('Error checking existing execution:', error);
      throw error;
    }
  }

  async getActiveEnrollmentsForSubscriber(subscriberId: string): Promise<SequenceEnrollment[]> {
    try {
      const results = await this.db
        .select()
        .from(sequenceEnrollments)
        .where(
          and(
            eq(sequenceEnrollments.subscriberId, subscriberId),
            eq(sequenceEnrollments.status, 'active')
          )
        );
      
      return results as SequenceEnrollment[];
    } catch (error) {
      console.error('Error getting active enrollments for subscriber:', error);
      throw error;
    }
  }

  async exitSubscriberFromAllSequences(subscriberId: string, reason: string): Promise<void> {
    try {
      await this.db
        .update(sequenceEnrollments)
        .set({ 
          status: 'exited',
          exitReason: reason,
          exitedAt: new Date(),
          updatedAt: new Date()
        })
        .where(
          and(
            eq(sequenceEnrollments.subscriberId, subscriberId),
            eq(sequenceEnrollments.status, 'active')
          )
        );
    } catch (error) {
      console.error('Error exiting subscriber from all sequences:', error);
      throw error;
    }
  }

  async exitSubscriberFromSequence(sequenceId: string, subscriberId: string, reason: string): Promise<void> {
    try {
      await this.db
        .update(sequenceEnrollments)
        .set({ 
          status: 'exited',
          exitReason: reason,
          exitedAt: new Date(),
          updatedAt: new Date()
        })
        .where(
          and(
            eq(sequenceEnrollments.sequenceId, sequenceId),
            eq(sequenceEnrollments.subscriberId, subscriberId),
            eq(sequenceEnrollments.status, 'active')
          )
        );
    } catch (error) {
      console.error('Error exiting subscriber from sequence:', error);
      throw error;
    }
  }
}

// Email queue service implementation
export class SharedEmailQueueService implements EmailQueueService {
  private emailQueueManager: any;

  constructor(emailQueueManager: any) {
    this.emailQueueManager = emailQueueManager;
  }

  async addEmailJob(jobData: EmailJobData, delay?: number): Promise<string> {
    try {
      const job = await this.emailQueueManager.addNewsletterEmail(jobData, { 
        priority: jobData.priority || 3,
        delay: delay || 0
      });
      return job.id!;
    } catch (error) {
      console.error('Error adding email job:', error);
      throw error;
    }
  }
}

// Export the database instance for easy use
export const db = createDatabase();
