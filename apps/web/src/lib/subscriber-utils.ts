import { db } from '@/lib/drizzle';
import { marketingSequences, sequenceEnrollments } from '@/db/schema';
import { eq, and, inArray } from 'drizzle-orm';
import { SequenceDatabaseService } from '@/lib/sequence-database';
import { queueClient } from '@/lib/queue-client';

/**
 * Common function for automatic sequence enrollment
 * Enrolls a subscriber in all active sequences with subscription trigger type
 * Handles segment filtering and duplicate prevention
 */
export async function enrollSubscriberInSequences(
  subscriberId: string,
  userId: string,
  segmentIds: string[] = []
): Promise<void> {
  try {
    const sequences = await db.query.marketingSequences.findMany({
      where: and(
        eq(marketingSequences.userId, userId),
        eq(marketingSequences.triggerType, 'subscription'),
        eq(marketingSequences.status, 'active')
      ),
    });

    const sequenceDb = new SequenceDatabaseService();

    for (const sequence of sequences) {
      try {
        // Check if trigger config has specific segment requirements
        const triggerConfig = sequence.triggerConfig as any;
        let shouldEnroll = true;

        // If sequence is configured for specific segments, check if subscriber matches
        if (triggerConfig?.segmentIds && Array.isArray(triggerConfig.segmentIds) && triggerConfig.segmentIds.length > 0) {
          // Subscriber must be in at least one of the required segments
          const hasMatchingSegment = segmentIds.some(segmentId => 
            triggerConfig.segmentIds.includes(segmentId)
          );
          shouldEnroll = hasMatchingSegment;
        }

        if (shouldEnroll) {
          // Check if subscriber is already enrolled to avoid duplicates
          const existingEnrollment = await db.query.sequenceEnrollments.findFirst({
            where: and(
              eq(sequenceEnrollments.sequenceId, sequence.id),
              eq(sequenceEnrollments.subscriberId, subscriberId)
            ),
          });

          if (!existingEnrollment) {
            const enrollment = await sequenceDb.enrollSubscriber(sequence.id, subscriberId, {
              source: 'subscription_trigger',
              enrolledAt: new Date(),
            });
            
            // Trigger sequence processing by adding a sequence enrollment job
            try {
              const sequenceJobData = {
                type: 'sequence_enrollment',
                sequenceId: sequence.id,
                subscriberId: subscriberId,
                userId: userId,
                metadata: {
                  triggeredAt: new Date().toISOString(),
                  source: 'subscription_trigger',
                },
              };
              
              await queueClient.addSequenceJob(sequenceJobData);
              console.log(`Successfully queued sequence enrollment job for subscriber ${subscriberId} in sequence "${sequence.name}" (${sequence.id})`);
            } catch (queueError) {
              console.error(`Failed to queue sequence enrollment job for subscriber ${subscriberId} in sequence "${sequence.name}" (${sequence.id}):`, queueError);
              // Continue even if queue job fails - enrollment is already created
            }
            
            console.log(`Successfully enrolled subscriber ${subscriberId} in sequence "${sequence.name}" (${sequence.id})`);
          } else {
            console.log(`Subscriber ${subscriberId} already enrolled in sequence "${sequence.name}" (${sequence.id})`);
          }
        } else {
          console.log(`Subscriber ${subscriberId} does not match segment requirements for sequence "${sequence.name}" (${sequence.id})`);
        }
      } catch (enrollmentError) {
        console.error(`Failed to enroll subscriber ${subscriberId} in sequence "${sequence.name}" (${sequence.id}):`, enrollmentError);
        // Continue with other sequences even if one fails
      }
    }
  } catch (error) {
    console.error('Failed to enroll subscriber in sequences:', error);
  }
}

/**
 * Optimized bulk enrollment function for multiple subscribers
 * Reduces database queries and improves performance for bulk operations
 */
export async function bulkEnrollSubscribersInSequences(
  subscriberData: Array<{ subscriberId: string; segmentIds: string[] }>,
  userId: string
): Promise<void> {
  if (!subscriberData.length) return;

  try {
    // Fetch all active subscription sequences once
    const sequences = await db.query.marketingSequences.findMany({
      where: and(
        eq(marketingSequences.userId, userId),
        eq(marketingSequences.triggerType, 'subscription'),
        eq(marketingSequences.status, 'active')
      ),
    });

    if (!sequences.length) {
      console.log('No active subscription sequences found for bulk enrollment');
      return;
    }

    // Get all subscriber IDs for bulk duplicate check
    const allSubscriberIds = subscriberData.map(data => data.subscriberId);
    
    // Fetch existing enrollments in bulk to avoid duplicates
    const existingEnrollments = await db.query.sequenceEnrollments.findMany({
      where: and(
        inArray(sequenceEnrollments.subscriberId, allSubscriberIds),
        inArray(sequenceEnrollments.sequenceId, sequences.map(s => s.id))
      ),
      columns: {
        subscriberId: true,
        sequenceId: true,
      }
    });

    // Create a Set for fast lookup of existing enrollments
    const existingEnrollmentKeys = new Set(
      existingEnrollments.map(e => `${e.subscriberId}-${e.sequenceId}`)
    );

    const sequenceDb = new SequenceDatabaseService();
    const enrollmentsToCreate: Array<{
      sequenceId: string;
      subscriberId: string;
      source: string;
      enrolledAt: Date;
    }> = [];
    
    const queueJobsToCreate: Array<{
      type: string;
      sequenceId: string;
      subscriberId: string;
      userId: string;
      metadata: any;
    }> = [];

    // Process each subscriber-sequence combination
    for (const { subscriberId, segmentIds } of subscriberData) {
      for (const sequence of sequences) {
        const enrollmentKey = `${subscriberId}-${sequence.id}`;
        
        // Skip if already enrolled
        if (existingEnrollmentKeys.has(enrollmentKey)) {
          console.log(`Subscriber ${subscriberId} already enrolled in sequence "${sequence.name}" (${sequence.id})`);
          continue;
        }

        // Check segment requirements
        const triggerConfig = sequence.triggerConfig as any;
        let shouldEnroll = true;

        if (triggerConfig?.segmentIds && Array.isArray(triggerConfig.segmentIds) && triggerConfig.segmentIds.length > 0) {
          const hasMatchingSegment = segmentIds.some(segmentId => 
            triggerConfig.segmentIds.includes(segmentId)
          );
          shouldEnroll = hasMatchingSegment;
        }

        if (shouldEnroll) {
          // Prepare enrollment data
          enrollmentsToCreate.push({
            sequenceId: sequence.id,
            subscriberId: subscriberId,
            source: 'subscription_trigger',
            enrolledAt: new Date(),
          });

          // Prepare queue job data
          queueJobsToCreate.push({
            type: 'sequence_enrollment',
            sequenceId: sequence.id,
            subscriberId: subscriberId,
            userId: userId,
            metadata: {
              triggeredAt: new Date().toISOString(),
              source: 'subscription_trigger',
            },
          });

          console.log(`Prepared enrollment for subscriber ${subscriberId} in sequence "${sequence.name}" (${sequence.id})`);
        } else {
          console.log(`Subscriber ${subscriberId} does not match segment requirements for sequence "${sequence.name}" (${sequence.id})`);
        }
      }
    }

    // Bulk create enrollments
    if (enrollmentsToCreate.length > 0) {
      console.log(`Creating ${enrollmentsToCreate.length} sequence enrollments in bulk`);
      
      // Process enrollments in batches to avoid overwhelming the database
      const batchSize = 50;
      for (let i = 0; i < enrollmentsToCreate.length; i += batchSize) {
        const batch = enrollmentsToCreate.slice(i, i + batchSize);
        
        try {
          for (const enrollment of batch) {
            await sequenceDb.enrollSubscriber(enrollment.sequenceId, enrollment.subscriberId, {
              source: enrollment.source,
              enrolledAt: enrollment.enrolledAt,
            });
          }
        } catch (enrollmentError) {
          console.error(`Failed to create enrollment batch ${i / batchSize + 1}:`, enrollmentError);
          // Continue with next batch
        }
      }
    }

    // Bulk create queue jobs
    if (queueJobsToCreate.length > 0) {
      console.log(`Creating ${queueJobsToCreate.length} sequence queue jobs in bulk`);
      
      // Process queue jobs in batches to avoid overwhelming the queue
      const queueBatchSize = 20;
      for (let i = 0; i < queueJobsToCreate.length; i += queueBatchSize) {
        const batch = queueJobsToCreate.slice(i, i + queueBatchSize);
        
        try {
          await Promise.all(
            batch.map(async (jobData) => {
              try {
                await queueClient.addSequenceJob(jobData);
              } catch (queueError) {
                console.error(`Failed to queue sequence job for subscriber ${jobData.subscriberId} in sequence ${jobData.sequenceId}:`, queueError);
                // Continue with other jobs
              }
            })
          );
        } catch (batchError) {
          console.error(`Failed to process queue job batch ${i / queueBatchSize + 1}:`, batchError);
        }
      }
    }

    console.log(`Bulk enrollment complete: ${enrollmentsToCreate.length} enrollments created`);

  } catch (error) {
    console.error('Failed to bulk enroll subscribers in sequences:', error);
  }
}
