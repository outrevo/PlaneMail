'use server';

import { db } from '@/lib/drizzle';
import { marketingSequences, sequenceEnrollments, sequenceStepExecutions } from '@/db/schema';
import { auth } from '@clerk/nextjs/server';
import { eq, and, sql, desc } from 'drizzle-orm';

export interface SequenceStats {
  totalEntered: number;
  totalCompleted: number;
  currentActive: number;
  conversionRate: number;
  averageTimeToComplete: number;
  emailsSent: number;
  openRate: number;
  clickRate: number;
  unsubscribeRate: number;
}

export interface StepStats {
  stepId: string;
  stepName: string;
  type: 'email' | 'wait' | 'condition' | 'action';
  entered: number;
  completed: number;
  openRate?: number;
  clickRate?: number;
  conversionRate: number;
  averageTimeSpent: number;
}

export async function getSequenceAnalytics(sequenceId?: string, timeRange: string = '30d'): Promise<{
  overallStats: SequenceStats;
  stepStats: StepStats[];
  sequences: Array<{
    id: string;
    name: string;
    description: string | null;
    status: string;
    triggerType: string;
    stepCount: number;
    stats: {
      totalEntered: number;
      totalCompleted: number;
      currentActive: number;
      conversionRate: number;
    };
    createdAt: Date;
    updatedAt: Date | null;
  }>;
}> {
  const { userId } = await auth();
  if (!userId) {
    throw new Error('Not authenticated');
  }

  try {
    // Get date filter based on timeRange
    const now = new Date();
    let dateFilter: Date | null = null;
    
    switch (timeRange) {
      case '7d':
        dateFilter = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        dateFilter = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '90d':
        dateFilter = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      default:
        dateFilter = null; // All time
    }

    // Get all sequences for the user
    const userSequences = await db.select({
      id: marketingSequences.id,
      name: marketingSequences.name,
      description: marketingSequences.description,
      status: marketingSequences.status,
      triggerType: marketingSequences.triggerType,
      triggerConfig: marketingSequences.triggerConfig,
      settings: marketingSequences.settings,
      stats: marketingSequences.stats,
      createdAt: marketingSequences.createdAt,
      updatedAt: marketingSequences.updatedAt,
    })
    .from(marketingSequences)
    .where(eq(marketingSequences.userId, userId))
    .orderBy(desc(marketingSequences.updatedAt));

    // Process sequences to extract stats
    const sequenceStatsPromises = userSequences.map(async (sequence) => {
      // Count total enrollments
      const enrollmentStats = await db.select({
        totalEnrollments: sql<number>`COUNT(*)`,
        completedEnrollments: sql<number>`COUNT(CASE WHEN status = 'completed' THEN 1 END)`,
        activeEnrollments: sql<number>`COUNT(CASE WHEN status = 'active' THEN 1 END)`,
      })
      .from(sequenceEnrollments)
      .where(
        and(
          eq(sequenceEnrollments.sequenceId, sequence.id),
          dateFilter ? sql`${sequenceEnrollments.enrolledAt} >= ${dateFilter}` : sql`1=1`
        )
      );

      const stats = enrollmentStats[0];
      const totalEntered = stats?.totalEnrollments || 0;
      const totalCompleted = stats?.completedEnrollments || 0;
      const currentActive = stats?.activeEnrollments || 0;
      const conversionRate = totalEntered > 0 ? (totalCompleted / totalEntered) * 100 : 0;

      // For step count, we'll estimate from the stored stats or return 0 for now
      // In a future implementation, you might want to store this in the sequence settings
      const storedStats = sequence.stats as any || {};
      const stepCount = storedStats.stepStats?.length || 0;

      return {
        id: sequence.id,
        name: sequence.name,
        description: sequence.description,
        status: sequence.status,
        triggerType: sequence.triggerType,
        stepCount,
        stats: {
          totalEntered,
          totalCompleted,
          currentActive,
          conversionRate,
        },
        createdAt: sequence.createdAt,
        updatedAt: sequence.updatedAt,
      };
    });

    const sequenceStats = await Promise.all(sequenceStatsPromises);

    // Calculate overall stats
    const overallStats: SequenceStats = {
      totalEntered: sequenceStats.reduce((sum, seq) => sum + seq.stats.totalEntered, 0),
      totalCompleted: sequenceStats.reduce((sum, seq) => sum + seq.stats.totalCompleted, 0),
      currentActive: sequenceStats.reduce((sum, seq) => sum + seq.stats.currentActive, 0),
      conversionRate: 0, // Will calculate below
      averageTimeToComplete: 0, // TODO: Calculate from actual enrollment data
      emailsSent: 0, // TODO: Calculate from step executions
      openRate: 0, // TODO: Calculate from email tracking
      clickRate: 0, // TODO: Calculate from email tracking
      unsubscribeRate: 0, // TODO: Calculate from subscriber data
    };

    // Calculate overall conversion rate
    if (overallStats.totalEntered > 0) {
      overallStats.conversionRate = (overallStats.totalCompleted / overallStats.totalEntered) * 100;
    }

    // Get step stats for specific sequence if provided
    let stepStats: StepStats[] = [];
    if (sequenceId) {
      const sequence = userSequences.find(s => s.id === sequenceId);
      if (sequence) {
        // Get stored step stats from the sequence stats field
        const storedStats = sequence.stats as any || {};
        const storedStepStats = storedStats.stepStats || [];
        
        stepStats = storedStepStats.map((stepStat: any, index: number) => ({
          stepId: stepStat.stepId || `step-${index}`,
          stepName: stepStat.stepName || `Step ${index + 1}`,
          type: stepStat.type || 'action',
          entered: stepStat.entered || 0,
          completed: stepStat.completed || 0,
          conversionRate: stepStat.conversionRate || 0,
          averageTimeSpent: stepStat.averageTimeSpent || 0,
          openRate: stepStat.openRate,
          clickRate: stepStat.clickRate,
        }));
      }
    }

    return {
      overallStats,
      stepStats,
      sequences: sequenceStats,
    };
  } catch (error) {
    console.error('Failed to fetch sequence analytics:', error);
    // Return empty data instead of throwing
    return {
      overallStats: {
        totalEntered: 0,
        totalCompleted: 0,
        currentActive: 0,
        conversionRate: 0,
        averageTimeToComplete: 0,
        emailsSent: 0,
        openRate: 0,
        clickRate: 0,
        unsubscribeRate: 0,
      },
      stepStats: [],
      sequences: [],
    };
  }
}
