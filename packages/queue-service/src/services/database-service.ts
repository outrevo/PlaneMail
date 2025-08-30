import {
  DatabaseService,
  MarketingSequence,
  SequenceEnrollment,
  SequenceStep,
  SequenceStepExecution
} from '@planemail/shared';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from '@planemail/shared';
import { randomUUID } from 'node:crypto';
import { eq, and } from 'drizzle-orm';
import { env } from '../env';

console.log(`🔧 Database service using DATABASE_URL: ${env.DATABASE_URL ? 'SET' : 'NOT SET'}`);

// Create database connection using the same pattern as the web app
const pool = new Pool({
  connectionString: env.DATABASE_URL,
});

const db = drizzle(pool, { schema });

/**
 * Concrete implementation of DatabaseService using the real database
 */
class DatabaseServiceImpl implements DatabaseService {
  async getSequence(sequenceId: string): Promise<MarketingSequence | null> {
    try {
      const sequences = await db
        .select()
        .from(schema.marketingSequences)
        .where(eq(schema.marketingSequences.id, sequenceId))
        .limit(1);
      
      const result = sequences[0];
      if (!result) return null;
      
      // Add the steps property to match MarketingSequence interface
      return {
        ...result,
        steps: []
      } as MarketingSequence;
    } catch (error: any) {
      console.error(`❌ Error fetching sequence ${sequenceId}:`, error);
      throw new Error(`Failed to fetch sequence: ${error.message}`);
    }
  }

  async getSequenceWithSteps(sequenceId: string): Promise<MarketingSequence | null> {
    try {
      const sequence = await this.getSequence(sequenceId);
      if (!sequence) return null;

      // Fetch steps for this sequence
      const steps = await db
        .select()
        .from(schema.sequenceSteps)
        .where(eq(schema.sequenceSteps.sequenceId, sequenceId))
        .orderBy(schema.sequenceSteps.order);

      console.log(`🔍 Found ${steps.length} steps for sequence ${sequenceId}:`, steps.map(s => ({ id: s.id, name: s.name, order: s.order, isActive: s.isActive })));

      return {
        ...sequence,
        steps: steps as SequenceStep[]
      };
    } catch (error: any) {
      console.error(`❌ Error fetching sequence with steps ${sequenceId}:`, error);
      throw new Error(`Failed to fetch sequence with steps: ${error.message}`);
    }
  }

  async getEnrollment(enrollmentId: string): Promise<SequenceEnrollment | null> {
    try {
      const enrollments = await db
        .select()
        .from(schema.sequenceEnrollments)
        .where(eq(schema.sequenceEnrollments.id, enrollmentId))
        .limit(1);
      
      return enrollments[0] as SequenceEnrollment || null;
    } catch (error: any) {
      console.error(`❌ Error fetching enrollment ${enrollmentId}:`, error);
      throw new Error(`Failed to fetch enrollment: ${error.message}`);
    }
  }

  async getStep(stepId: string): Promise<SequenceStep | null> {
    try {
      const steps = await db
        .select()
        .from(schema.sequenceSteps)
        .where(eq(schema.sequenceSteps.id, stepId))
        .limit(1);
      
      return steps[0] as SequenceStep || null;
    } catch (error: any) {
      console.error(`❌ Error fetching step ${stepId}:`, error);
      throw new Error(`Failed to fetch step: ${error.message}`);
    }
  }

  async getSubscriber(subscriberId: string): Promise<any> {
    try {
      const subscribers = await db
        .select()
        .from(schema.subscribers)
        .where(eq(schema.subscribers.id, subscriberId))
        .limit(1);
      
      return subscribers[0] || null;
    } catch (error: any) {
      console.error(`❌ Error fetching subscriber ${subscriberId}:`, error);
      throw new Error(`Failed to fetch subscriber: ${error.message}`);
    }
  }

  async getUserIntegrations(userId: string, orgId?: string): Promise<any> {
    try {
      const integrations = await db
        .select()
        .from(schema.userIntegrations)
        .where(
          orgId 
            ? and(
                eq(schema.userIntegrations.userId, userId),
                eq(schema.userIntegrations.clerkOrgId, orgId)
              )
            : eq(schema.userIntegrations.userId, userId)
        );
      
      return integrations;
    } catch (error: any) {
      console.error(`❌ Error fetching user integrations for ${userId}:`, error);
      throw new Error(`Failed to fetch user integrations: ${error.message}`);
    }
  }

  async checkExistingExecution(enrollmentId: string, stepId: string): Promise<SequenceStepExecution | null> {
    try {
      const executions = await db
        .select()
        .from(schema.sequenceStepExecutions)
        .where(
          and(
            eq(schema.sequenceStepExecutions.enrollmentId, enrollmentId),
            eq(schema.sequenceStepExecutions.stepId, stepId)
          )
        )
        .limit(1);
      
      return executions[0] as SequenceStepExecution || null;
    } catch (error: any) {
      console.error(`❌ Error checking existing execution:`, error);
      throw new Error(`Failed to check existing execution: ${error.message}`);
    }
  }

  async createStepExecution(execution: Omit<SequenceStepExecution, 'id' | 'createdAt' | 'updatedAt'>): Promise<SequenceStepExecution> {
    try {
      const executions = await db
        .insert(schema.sequenceStepExecutions)
        .values({
          id: randomUUID(),
          ...execution,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning();
      
      return executions[0] as SequenceStepExecution;
    } catch (error: any) {
      console.error(`❌ Error creating step execution:`, error);
      throw new Error(`Failed to create step execution: ${error.message}`);
    }
  }

  async updateStepExecution(executionId: string, updates: Partial<SequenceStepExecution>): Promise<void> {
    try {
      await db
        .update(schema.sequenceStepExecutions)
        .set({
          ...updates,
          updatedAt: new Date(),
        })
        .where(eq(schema.sequenceStepExecutions.id, executionId));
    } catch (error: any) {
      console.error(`❌ Error updating step execution ${executionId}:`, error);
      throw new Error(`Failed to update step execution: ${error.message}`);
    }
  }

  async updateEnrollment(enrollmentId: string, updates: Partial<SequenceEnrollment>): Promise<void> {
    try {
      await db
        .update(schema.sequenceEnrollments)
        .set({
          ...updates,
          updatedAt: new Date(),
        })
        .where(eq(schema.sequenceEnrollments.id, enrollmentId));
    } catch (error: any) {
      console.error(`❌ Error updating enrollment ${enrollmentId}:`, error);
      throw new Error(`Failed to update enrollment: ${error.message}`);
    }
  }

  async findExistingEnrollment(sequenceId: string, subscriberId: string): Promise<SequenceEnrollment | null> {
    try {
      const enrollments = await db
        .select()
        .from(schema.sequenceEnrollments)
        .where(
          and(
            eq(schema.sequenceEnrollments.sequenceId, sequenceId),
            eq(schema.sequenceEnrollments.subscriberId, subscriberId)
          )
        )
        .limit(1);
      
      return enrollments[0] as SequenceEnrollment || null;
    } catch (error: any) {
      console.error(`❌ Error finding existing enrollment:`, error);
      throw new Error(`Failed to find existing enrollment: ${error.message}`);
    }
  }

  async enrollSubscriber(sequenceId: string, subscriberId: string): Promise<SequenceEnrollment> {
    try {
      console.log(`👤 Creating enrollment for subscriber ${subscriberId} in sequence ${sequenceId}`);
      
      const enrollments = await db
        .insert(schema.sequenceEnrollments)
        .values({
          id: randomUUID(),
          sequenceId,
          subscriberId,
          status: 'active',
          enrolledAt: new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning();
      
      const enrollment = enrollments[0] as SequenceEnrollment;
      console.log(`✅ Created enrollment:`, { id: enrollment.id, sequenceId: enrollment.sequenceId, subscriberId: enrollment.subscriberId, status: enrollment.status });
      
      return enrollment;
    } catch (error: any) {
      console.error(`❌ Error enrolling subscriber:`, error);
      throw new Error(`Failed to enroll subscriber: ${error.message}`);
    }
  }

  async updateSequenceStats(sequenceId: string, stats: any): Promise<void> {
    try {
      await db
        .update(schema.marketingSequences)
        .set({
          stats: stats,
          updatedAt: new Date(),
        })
        .where(eq(schema.marketingSequences.id, sequenceId));
    } catch (error: any) {
      console.error(`❌ Error updating sequence stats:`, error);
      throw new Error(`Failed to update sequence stats: ${error.message}`);
    }
  }

  async findEligibleSubscribers(sequence: MarketingSequence): Promise<any[]> {
    try {
      // Basic implementation - find active subscribers
      // This would be enhanced based on sequence trigger conditions
      const subscribers = await db
        .select()
        .from(schema.subscribers)
        .where(eq(schema.subscribers.status, 'subscribed'))
        .limit(100); // Limit for safety
      
      return subscribers;
    } catch (error: any) {
      console.error(`❌ Error finding eligible subscribers:`, error);
      throw new Error(`Failed to find eligible subscribers: ${error.message}`);
    }
  }

  async exitSubscriberFromSequence(sequenceId: string, subscriberId: string, reason: string): Promise<void> {
    try {
      await db
        .update(schema.sequenceEnrollments)
        .set({
          status: 'exited',
          exitReason: reason,
          completedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(schema.sequenceEnrollments.sequenceId, sequenceId),
            eq(schema.sequenceEnrollments.subscriberId, subscriberId)
          )
        );
    } catch (error: any) {
      console.error(`❌ Error exiting subscriber from sequence:`, error);
      throw new Error(`Failed to exit subscriber from sequence: ${error.message}`);
    }
  }

  async exitSubscriberFromAllSequences(subscriberId: string, reason: string): Promise<void> {
    try {
      await db
        .update(schema.sequenceEnrollments)
        .set({
          status: 'exited',
          exitReason: reason,
          completedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(schema.sequenceEnrollments.subscriberId, subscriberId),
            eq(schema.sequenceEnrollments.status, 'active')
          )
        );
    } catch (error: any) {
      console.error(`❌ Error exiting subscriber from all sequences:`, error);
      throw new Error(`Failed to exit subscriber from all sequences: ${error.message}`);
    }
  }

  async getActiveEnrollmentsForSubscriber(subscriberId: string): Promise<SequenceEnrollment[]> {
    try {
      const enrollments = await db
        .select()
        .from(schema.sequenceEnrollments)
        .where(
          and(
            eq(schema.sequenceEnrollments.subscriberId, subscriberId),
            eq(schema.sequenceEnrollments.status, 'active')
          )
        );
      
      return enrollments as SequenceEnrollment[];
    } catch (error: any) {
      console.error(`❌ Error getting active enrollments for subscriber ${subscriberId}:`, error);
      throw new Error(`Failed to get active enrollments: ${error.message}`);
    }
  }
}

// Export singleton instance
export const databaseService = new DatabaseServiceImpl();

// Export class for testing
export { DatabaseServiceImpl };