import { 
  DatabaseService, 
  EmailQueueService,
  createSequenceUnsubscribeJob 
} from '../sequence-processors';

export interface UnsubscribeEvent {
  subscriberId: string;
  userId: string;
  orgId?: string;
  sequenceId?: string; // If unsubscribing from specific sequence
  reason: 'email_unsubscribe' | 'website_unsubscribe' | 'admin_action' | 'bounce' | 'complaint';
  source?: string; // Source of unsubscribe (email, website, etc.)
  timestamp?: Date;
}

export class UnsubscribeHandler {
  constructor(
    private dbService: DatabaseService,
    private emailQueueService: EmailQueueService,
    private queueService: any // The actual queue service for adding jobs
  ) {}

  /**
   * Process an unsubscribe event and remove subscriber from sequences
   */
  async handleUnsubscribe(event: UnsubscribeEvent): Promise<void> {
    console.log(`🚫 Processing unsubscribe event for subscriber ${event.subscriberId}`);

    try {
      // Validate subscriber exists
      const subscriber = await this.dbService.getSubscriber(event.subscriberId);
      if (!subscriber) {
        console.warn(`Subscriber ${event.subscriberId} not found, skipping unsubscribe processing`);
        return;
      }

      // Create unsubscribe job
      const unsubscribeJob = createSequenceUnsubscribeJob(
        event.subscriberId,
        event.userId,
        event.reason,
        event.sequenceId, // undefined for global unsubscribe
        event.orgId
      );

      // Add job to queue for processing
      await this.queueService.addSequenceJob(unsubscribeJob);

      console.log(`✅ Queued unsubscribe job for subscriber ${event.subscriberId}`, {
        sequenceId: event.sequenceId || 'all',
        reason: event.reason
      });

    } catch (error: any) {
      console.error(`❌ Error processing unsubscribe event:`, error);
      throw new Error(`Unsubscribe processing failed: ${error.message}`);
    }
  }

  /**
   * Handle bulk unsubscribe (e.g., when a user deletes their account)
   */
  async handleBulkUnsubscribe(
    subscriberIds: string[],
    userId: string,
    reason: string = 'bulk_unsubscribe',
    orgId?: string
  ): Promise<void> {
    console.log(`🚫 Processing bulk unsubscribe for ${subscriberIds.length} subscribers`);

    const jobs = subscriberIds.map(subscriberId => 
      createSequenceUnsubscribeJob(subscriberId, userId, reason, undefined, orgId)
    );

    try {
      // Add all jobs to queue
      await Promise.all(
        jobs.map(job => this.queueService.addSequenceJob(job))
      );

      console.log(`✅ Queued ${jobs.length} unsubscribe jobs`);
    } catch (error: any) {
      console.error(`❌ Error processing bulk unsubscribe:`, error);
      throw new Error(`Bulk unsubscribe processing failed: ${error.message}`);
    }
  }

  /**
   * Handle sequence-specific unsubscribe
   */
  async handleSequenceUnsubscribe(
    sequenceId: string,
    subscriberId: string,
    userId: string,
    reason: string = 'sequence_unsubscribe',
    orgId?: string
  ): Promise<void> {
    console.log(`🚫 Processing sequence unsubscribe: ${subscriberId} from sequence ${sequenceId}`);

    try {
      const unsubscribeJob = createSequenceUnsubscribeJob(
        subscriberId,
        userId,
        reason,
        sequenceId,
        orgId
      );

      await this.queueService.addSequenceJob(unsubscribeJob);

      console.log(`✅ Queued sequence unsubscribe job for subscriber ${subscriberId}`);
    } catch (error: any) {
      console.error(`❌ Error processing sequence unsubscribe:`, error);
      throw new Error(`Sequence unsubscribe processing failed: ${error.message}`);
    }
  }
}

// Example usage for webhook endpoints
export function createUnsubscribeWebhookHandler(
  dbService: DatabaseService,
  emailQueueService: EmailQueueService,
  queueService: any
) {
  const handler = new UnsubscribeHandler(dbService, emailQueueService, queueService);

  return {
    // Global unsubscribe webhook
    handleGlobalUnsubscribe: async (req: any, res: any) => {
      try {
        const { subscriberId, userId, reason = 'email_unsubscribe', orgId } = req.body;

        if (!subscriberId || !userId) {
          return res.status(400).json({ error: 'Missing required fields' });
        }

        await handler.handleUnsubscribe({
          subscriberId,
          userId,
          orgId,
          reason,
          source: 'webhook',
          timestamp: new Date(),
        });

        res.status(200).json({ success: true, message: 'Unsubscribe processed' });
      } catch (error: any) {
        console.error('Webhook unsubscribe error:', error);
        res.status(500).json({ error: error.message });
      }
    },

    // Sequence-specific unsubscribe webhook
    handleSequenceUnsubscribe: async (req: any, res: any) => {
      try {
        const { sequenceId, subscriberId, userId, reason = 'sequence_unsubscribe', orgId } = req.body;

        if (!sequenceId || !subscriberId || !userId) {
          return res.status(400).json({ error: 'Missing required fields' });
        }

        await handler.handleSequenceUnsubscribe(sequenceId, subscriberId, userId, reason, orgId);

        res.status(200).json({ success: true, message: 'Sequence unsubscribe processed' });
      } catch (error: any) {
        console.error('Webhook sequence unsubscribe error:', error);
        res.status(500).json({ error: error.message });
      }
    },
  };
}
