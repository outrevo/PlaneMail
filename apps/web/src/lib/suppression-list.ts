import { db } from '@/lib/db';
import { subscribers } from '@/lib/db/schema';
import { eq, and, inArray } from 'drizzle-orm';

/**
 * Suppression list utilities for email compliance
 * Ensures we never send emails to unsubscribed, bounced, or pending subscribers
 */

export type SuppressionReason = 'unsubscribed' | 'bounced' | 'pending' | 'not_found';

export interface SuppressionCheckResult {
  email: string;
  canSend: boolean;
  reason?: SuppressionReason;
}

/**
 * Check if an email address is suppressed (should not receive emails)
 */
export async function checkEmailSuppression(
  userId: string, 
  email: string
): Promise<SuppressionCheckResult> {
  try {
    const subscriber = await db
      .select({ status: subscribers.status })
      .from(subscribers)
      .where(and(
        eq(subscribers.userId, userId),
        eq(subscribers.email, email.toLowerCase().trim())
      ))
      .limit(1);

    if (subscriber.length === 0) {
      return {
        email,
        canSend: false,
        reason: 'not_found'
      };
    }

    const status = subscriber[0].status;
    const canSend = status === 'active';
    
    return {
      email,
      canSend,
      reason: canSend ? undefined : status as SuppressionReason
    };
  } catch (error) {
    console.error('Suppression check error:', error);
    return {
      email,
      canSend: false,
      reason: 'not_found'
    };
  }
}

/**
 * Bulk check multiple email addresses against suppression list
 */
export async function bulkCheckEmailSuppression(
  userId: string, 
  emails: string[]
): Promise<SuppressionCheckResult[]> {
  try {
    if (emails.length === 0) return [];

    // Get all subscriber statuses for these emails
    const subscriberStatuses = await db
      .select({ 
        email: subscribers.email, 
        status: subscribers.status 
      })
      .from(subscribers)
      .where(and(
        eq(subscribers.userId, userId),
        inArray(subscribers.email, emails.map(email => email.toLowerCase().trim()))
      ));

    // Create a map for quick lookup
    const statusMap = new Map(
      subscriberStatuses.map(s => [s.email, s.status])
    );

    // Check each email
    return emails.map(email => {
      const normalizedEmail = email.toLowerCase().trim();
      const status = statusMap.get(normalizedEmail);

      if (!status) {
        return {
          email,
          canSend: false,
          reason: 'not_found'
        };
      }

      const canSend = status === 'active';
      return {
        email,
        canSend,
        reason: canSend ? undefined : status as SuppressionReason
      };
    });
  } catch (error) {
    console.error('Bulk suppression check error:', error);
    // If error, mark all as unsendable for safety
    return emails.map(email => ({
      email,
      canSend: false,
      reason: 'not_found' as SuppressionReason
    }));
  }
}

/**
 * Filter out suppressed emails from a recipient list
 * Returns only emails that are safe to send to
 */
export async function filterSuppressionList(
  userId: string, 
  recipients: Array<{ email: string; [key: string]: any }>
): Promise<{
  sendable: Array<{ email: string; [key: string]: any }>;
  suppressed: Array<{ email: string; reason: SuppressionReason; [key: string]: any }>;
}> {
  try {
    const emails = recipients.map(r => r.email);
    const suppressionResults = await bulkCheckEmailSuppression(userId, emails);
    
    const sendable: Array<{ email: string; [key: string]: any }> = [];
    const suppressed: Array<{ email: string; reason: SuppressionReason; [key: string]: any }> = [];

    recipients.forEach(recipient => {
      const result = suppressionResults.find(r => 
        r.email.toLowerCase() === recipient.email.toLowerCase()
      );

      if (result?.canSend) {
        sendable.push(recipient);
      } else {
        suppressed.push({
          ...recipient,
          reason: result?.reason || 'not_found'
        });
      }
    });

    return { sendable, suppressed };
  } catch (error) {
    console.error('Filter suppression list error:', error);
    // If error, mark all as suppressed for safety
    return {
      sendable: [],
      suppressed: recipients.map(r => ({
        ...r,
        reason: 'not_found' as SuppressionReason
      }))
    };
  }
}

/**
 * Add email to suppression list (mark as unsubscribed)
 */
export async function addToSuppressionList(
  userId: string, 
  email: string, 
  reason: 'unsubscribed' | 'bounced' = 'unsubscribed'
): Promise<boolean> {
  try {
    const result = await db
      .update(subscribers)
      .set({
        status: reason,
        updatedAt: new Date()
      })
      .where(and(
        eq(subscribers.userId, userId),
        eq(subscribers.email, email.toLowerCase().trim())
      ))
      .returning({ id: subscribers.id });

    return result.length > 0;
  } catch (error) {
    console.error('Add to suppression list error:', error);
    return false;
  }
}
