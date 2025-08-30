import { db } from '@/lib/db';
import { 
  marketingSequences, 
  sequenceSteps, 
  sequenceEnrollments, 
  sequenceStepExecutions 
} from '@/db/schema';
import { eq, desc, and, gte, lte, count, sql } from 'drizzle-orm';

// Simple types that match our database schema
export interface CreateSequenceData {
  userId: string;
  clerkOrgId?: string;
  name: string;
  description?: string;
  status?: 'draft' | 'active' | 'paused' | 'completed';
  triggerType: string;
  triggerConfig: any;
  settings: any;
}

export interface UpdateSequenceData {
  name?: string;
  description?: string;
  status?: 'draft' | 'active' | 'paused' | 'completed';
  triggerType?: string;
  triggerConfig?: any;
  settings?: any;
  stats?: any;
}

export class SequenceDatabaseService {
  async createSequence(data: CreateSequenceData) {
    const [sequence] = await db
      .insert(marketingSequences)
      .values({
        userId: data.userId,
        clerkOrgId: data.clerkOrgId,
        name: data.name,
        description: data.description,
        status: data.status || 'draft',
        triggerType: data.triggerType,
        triggerConfig: data.triggerConfig,
        settings: data.settings,
      })
      .returning();

    return sequence;
  }

  async updateSequence(id: string, data: UpdateSequenceData) {
    const [sequence] = await db
      .update(marketingSequences)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(marketingSequences.id, id))
      .returning();

    return sequence;
  }

  async getSequence(id: string) {
    const [sequence] = await db
      .select()
      .from(marketingSequences)
      .where(eq(marketingSequences.id, id))
      .limit(1);

    return sequence || null;
  }

  async getSequences(userId: string, filters?: { status?: string; triggerType?: string }) {
    let query = db
      .select()
      .from(marketingSequences)
      .where(eq(marketingSequences.userId, userId));

    const sequences = await query.orderBy(desc(marketingSequences.createdAt));
    return sequences;
  }

  async deleteSequence(id: string) {
    await db.delete(marketingSequences).where(eq(marketingSequences.id, id));
  }

  async createSequenceStep(data: {
    sequenceId: string;
    name: string;
    type: string;
    order: number;
    config: any;
    isActive?: boolean;
  }) {
    const [step] = await db
      .insert(sequenceSteps)
      .values(data)
      .returning();

    return step;
  }

  async getSequenceSteps(sequenceId: string) {
    const steps = await db
      .select()
      .from(sequenceSteps)
      .where(eq(sequenceSteps.sequenceId, sequenceId))
      .orderBy(sequenceSteps.order);

    return steps;
  }

  async deleteSequenceStep(id: string) {
    await db.delete(sequenceSteps).where(eq(sequenceSteps.id, id));
  }

  async enrollSubscriber(sequenceId: string, subscriberId: string, triggerData?: any) {
    const [enrollment] = await db
      .insert(sequenceEnrollments)
      .values({
        sequenceId,
        subscriberId,
        status: 'active',
        currentStepId: null,
        metadata: triggerData || {},
      })
      .returning();

    return enrollment;
  }

  async updateEnrollment(id: string, data: {
    status?: string;
    currentStepId?: string;
    currentStepStartedAt?: Date;
    nextScheduledAt?: Date;
    completedAt?: Date;
    exitedAt?: Date;
    exitReason?: string;
    metadata?: any;
  }) {
    const [enrollment] = await db
      .update(sequenceEnrollments)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(sequenceEnrollments.id, id))
      .returning();

    return enrollment;
  }

  async getEnrollment(id: string) {
    const [enrollment] = await db
      .select()
      .from(sequenceEnrollments)
      .where(eq(sequenceEnrollments.id, id))
      .limit(1);

    return enrollment || null;
  }

  async getActiveEnrollments(sequenceId?: string) {
    if (sequenceId) {
      const enrollments = await db
        .select()
        .from(sequenceEnrollments)
        .where(
          and(
            eq(sequenceEnrollments.status, 'active'),
            eq(sequenceEnrollments.sequenceId, sequenceId)
          )
        )
        .orderBy(sequenceEnrollments.enrolledAt);
      return enrollments;
    } else {
      const enrollments = await db
        .select()
        .from(sequenceEnrollments)
        .where(eq(sequenceEnrollments.status, 'active'))
        .orderBy(sequenceEnrollments.enrolledAt);
      return enrollments;
    }
  }

  async recordStepExecution(data: {
    enrollmentId: string;
    stepId: string;
    status: string;
    result?: any;
    error?: string;
    emailJobId?: string;
    emailMessageId?: string;
  }) {
    const [execution] = await db
      .insert(sequenceStepExecutions)
      .values({
        ...data,
        startedAt: new Date(),
        completedAt: data.status === 'completed' ? new Date() : null,
      })
      .returning();

    return execution;
  }

  async getStepExecutions(enrollmentId: string) {
    const executions = await db
      .select()
      .from(sequenceStepExecutions)
      .where(eq(sequenceStepExecutions.enrollmentId, enrollmentId))
      .orderBy(sequenceStepExecutions.createdAt);

    return executions;
  }

  async getSequenceStats(sequenceId: string, dateRange?: { start: Date; end: Date }) {
    // Build base query conditions
    const conditions = [eq(sequenceEnrollments.sequenceId, sequenceId)];
    
    if (dateRange) {
      conditions.push(
        gte(sequenceEnrollments.enrolledAt, dateRange.start),
        lte(sequenceEnrollments.enrolledAt, dateRange.end)
      );
    }

    const whereClause = conditions.length > 1 ? and(...conditions) : conditions[0];

    // Get basic enrollment stats
    const [stats] = await db
      .select({
        totalEntered: count(),
        totalCompleted: sql<number>`COUNT(CASE WHEN status = 'completed' THEN 1 END)`,
        currentActive: sql<number>`COUNT(CASE WHEN status = 'active' THEN 1 END)`,
        totalExited: sql<number>`COUNT(CASE WHEN status = 'exited' THEN 1 END)`,
      })
      .from(sequenceEnrollments)
      .where(whereClause);

    // Calculate conversion rate
    const conversionRate = stats.totalEntered > 0 
      ? (stats.totalCompleted / stats.totalEntered) * 100 
      : 0;

    return {
      totalEntered: stats.totalEntered,
      totalCompleted: stats.totalCompleted,
      currentActive: stats.currentActive,
      totalExited: stats.totalExited,
      conversionRate: Math.round(conversionRate * 100) / 100,
    };
  }

  async getEnrollmentsDueForExecution(before: Date = new Date()) {
    const enrollments = await db
      .select()
      .from(sequenceEnrollments)
      .where(
        and(
          eq(sequenceEnrollments.status, 'active'),
          lte(sequenceEnrollments.nextScheduledAt, before)
        )
      )
      .orderBy(sequenceEnrollments.nextScheduledAt);

    return enrollments;
  }

  async completeEnrollment(id: string) {
    return this.updateEnrollment(id, { 
      status: 'completed',
      completedAt: new Date(),
    });
  }

  async exitEnrollment(id: string, reason: string) {
    return this.updateEnrollment(id, { 
      status: 'exited',
      exitedAt: new Date(),
      exitReason: reason,
    });
  }
}
