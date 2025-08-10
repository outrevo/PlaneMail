import { Job } from 'bullmq';
import { EmailJobData, EmailSendResult, BulkEmailSendResult, generateUnsubscribeUrl } from '@planemail/shared';
import * as Brevo from '@getbrevo/brevo';
import Mailgun from 'mailgun.js';
import formData from 'form-data';
import { SESv2Client, SendEmailCommand } from '@aws-sdk/client-sesv2';

// Base email processor class
abstract class BaseEmailProcessor {
  abstract sendSingleEmail(
    jobData: EmailJobData,
    recipient: EmailJobData['recipients'][0]
  ): Promise<EmailSendResult>;

  async processBulkEmail(job: Job<EmailJobData>): Promise<BulkEmailSendResult> {
    const { recipients } = job.data;
    const results: EmailSendResult[] = [];
    const errors: string[] = [];
    let totalSent = 0;
    let totalFailed = 0;

    console.log(`📧 Starting bulk email processing for ${recipients.length} recipients`);

    // Process emails in optimized batches for high volume
    const batchSize = this.getBatchSize();
    const totalBatches = Math.ceil(recipients.length / batchSize);
    
    console.log(`📦 Processing in ${totalBatches} batches of ${batchSize} emails each`);

    // Use cursor-based pagination for memory efficiency
    let cursor = 0;
    let batchNumber = 1;

    while (cursor < recipients.length) {
      const batchEnd = Math.min(cursor + batchSize, recipients.length);
      const batch = recipients.slice(cursor, batchEnd);
      
      console.log(`📤 Processing batch ${batchNumber}/${totalBatches} (${batch.length} emails)`);
      
      const batchResults = await this.processBatch(job.data, batch, job, batchNumber);
      results.push(...batchResults);
      
      // Update job progress more granularly
      const progress = Math.round((batchEnd / recipients.length) * 100);
      await job.updateProgress(progress);

      // Count results
      batchResults.forEach((result) => {
        if (result.success) {
          totalSent++;
        } else {
          totalFailed++;
          if (result.error) {
            errors.push(`${result.recipientEmail}: ${result.error}`);
          }
        }
      });

      // Log progress
      console.log(`✅ Batch ${batchNumber} completed: ${batchResults.filter(r => r.success).length} sent, ${batchResults.filter(r => !r.success).length} failed`);

      // Move cursor forward
      cursor = batchEnd;
      batchNumber++;

      // Add intelligent delay between batches based on provider limits
      if (cursor < recipients.length) {
        const delay = this.getBatchDelay();
        console.log(`⏳ Waiting ${delay}ms before next batch...`);
        await this.delay(delay);
      }

      // Memory cleanup for large batches
      if (batchNumber % 10 === 0) {
        // Force garbage collection hint for very large email jobs
        if (global.gc) {
          global.gc();
        }
      }
    }

    console.log(`🎉 Bulk email processing completed: ${totalSent} sent, ${totalFailed} failed`);

    return {
      success: totalFailed === 0,
      totalSent,
      totalFailed,
      results,
      errors,
    };
  }

  private async processBatch(
    jobData: EmailJobData,
    batch: EmailJobData['recipients'],
    job: Job<EmailJobData>,
    batchNumber?: number
  ): Promise<EmailSendResult[]> {
    const promises = batch.map((recipient) => 
      this.sendSingleEmail(jobData, recipient).catch((error) => ({
        success: false,
        recipientEmail: recipient.email,
        error: error.message || 'Unknown error',
      }))
    );

    return Promise.all(promises);
  }

  protected chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }

  protected delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  // Override these in subclasses based on provider limits
  protected getBatchSize(): number {
    return 50; // Increased default batch size for better throughput
  }

  protected getBatchDelay(): number {
    return 200; // Reduced default delay for faster processing
  }
}

// Brevo email processor
export class BrevoEmailProcessor extends BaseEmailProcessor {
  async sendSingleEmail(
    jobData: EmailJobData,
    recipient: EmailJobData['recipients'][0]
  ): Promise<EmailSendResult> {
    try {
      const { providerConfig, subject, fromName, fromEmail, htmlContent } = jobData;
      
      if (!providerConfig.brevo) {
        throw new Error('Brevo configuration is missing');
      }

      const unsubscribeUrl = recipient.metadata?.subscriberId
        ? generateUnsubscribeUrl(recipient.metadata.subscriberId, recipient.email, process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL)
        : undefined;
      
      const finalHtml = unsubscribeUrl
        ? htmlContent
            .replace(/\{\{UNSUBSCRIBE_TOKEN\}\}/g, unsubscribeUrl.split('/').slice(-1)[0].split('?')[0])
            .replace(/\{\{SUBSCRIBER_EMAIL\}\}/g, encodeURIComponent(recipient.email))
            .replace(/\{\{SUBSCRIBER_ID\}\}/g, String(recipient.metadata?.subscriberId))
        : htmlContent;

      const { apiKey } = providerConfig.brevo;
      
      const transacEmailApi = new Brevo.TransactionalEmailsApi();
      transacEmailApi.setApiKey(Brevo.TransactionalEmailsApiApiKeys.apiKey, apiKey);
      
      const sendSmtpEmail = new Brevo.SendSmtpEmail();
      sendSmtpEmail.sender = { email: fromEmail, name: fromName };
      sendSmtpEmail.to = [{ email: recipient.email, name: recipient.name }];
      sendSmtpEmail.subject = subject;
      sendSmtpEmail.htmlContent = finalHtml;

      // Add custom headers for tracking
      sendSmtpEmail.headers = {
        'X-Newsletter-ID': jobData.newsletterId || '',
        'X-User-ID': jobData.userId,
      };

      const response = await transacEmailApi.sendTransacEmail(sendSmtpEmail);
      
      return {
        success: true,
        messageId: response.body.messageId,
        recipientEmail: recipient.email,
        providerResponse: response.body,
      };
    } catch (error: any) {
      return {
        success: false,
        recipientEmail: recipient.email,
        error: error.message || 'Unknown Brevo error',
        providerResponse: error.response?.body,
      };
    }
  }

  protected getBatchSize(): number {
    return 100; // Brevo allows higher batch sizes
  }

  protected getBatchDelay(): number {
    return 100; // Faster processing for Brevo
  }
}

// Mailgun email processor
export class MailgunEmailProcessor extends BaseEmailProcessor {
  async sendSingleEmail(
    jobData: EmailJobData,
    recipient: EmailJobData['recipients'][0]
  ): Promise<EmailSendResult> {
    try {
      const { providerConfig, subject, fromName, fromEmail, htmlContent } = jobData;
      
      if (!providerConfig.mailgun) {
        throw new Error('Mailgun configuration is missing');
      }

      const unsubscribeUrl = recipient.metadata?.subscriberId
        ? generateUnsubscribeUrl(recipient.metadata.subscriberId, recipient.email, process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL)
        : undefined;

      const finalHtml = unsubscribeUrl
        ? htmlContent
            .replace(/\{\{UNSUBSCRIBE_TOKEN\}\}/g, unsubscribeUrl.split('/').slice(-1)[0].split('?')[0])
            .replace(/\{\{SUBSCRIBER_EMAIL\}\}/g, encodeURIComponent(recipient.email))
            .replace(/\{\{SUBSCRIBER_ID\}\}/g, String(recipient.metadata?.subscriberId))
        : htmlContent;

      const { apiKey, domain, region } = providerConfig.mailgun;
      
      const mailgun = new Mailgun(formData);
      const mg = mailgun.client({
        username: 'api',
        key: apiKey,
        url: region === 'eu' ? 'https://api.eu.mailgun.net' : 'https://api.mailgun.net',
      });

      const response = await mg.messages.create(domain, {
        from: `${fromName} <${fromEmail}>`,
        to: [recipient.email],
        subject: subject,
        html: finalHtml,
        'h:X-Newsletter-ID': jobData.newsletterId || '',
        'h:X-User-ID': jobData.userId,
      });

      return {
        success: true,
        messageId: response.id,
        recipientEmail: recipient.email,
        providerResponse: response,
      };
    } catch (error: any) {
      return {
        success: false,
        recipientEmail: recipient.email,
        error: error.message || 'Unknown Mailgun error',
        providerResponse: error.response?.body,
      };
    }
  }

  protected getBatchSize(): number {
    return 200; // Mailgun has very high limits
  }

  protected getBatchDelay(): number {
    return 50; // Minimal delay for Mailgun
  }
}

// Amazon SES email processor
export class AmazonSESEmailProcessor extends BaseEmailProcessor {
  async sendSingleEmail(
    jobData: EmailJobData,
    recipient: EmailJobData['recipients'][0]
  ): Promise<EmailSendResult> {
    try {
      const { providerConfig, subject, fromEmail, htmlContent } = jobData;
      
      if (!providerConfig.amazon_ses) {
        throw new Error('Amazon SES configuration is missing');
      }

      const unsubscribeUrl = recipient.metadata?.subscriberId
        ? generateUnsubscribeUrl(recipient.metadata.subscriberId, recipient.email, process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL)
        : undefined;

      const finalHtml = unsubscribeUrl
        ? htmlContent
            .replace(/\{\{UNSUBSCRIBE_TOKEN\}\}/g, unsubscribeUrl.split('/').slice(-1)[0].split('?')[0])
            .replace(/\{\{SUBSCRIBER_EMAIL\}\}/g, encodeURIComponent(recipient.email))
            .replace(/\{\{SUBSCRIBER_ID\}\}/g, String(recipient.metadata?.subscriberId))
        : htmlContent;

      const { accessKeyId, secretAccessKey, region } = providerConfig.amazon_ses;
      
      const sesClient = new SESv2Client({
        region,
        credentials: { accessKeyId, secretAccessKey },
      });

      const command = new SendEmailCommand({
        Destination: { ToAddresses: [recipient.email] },
        Content: {
          Simple: {
            Subject: { Data: subject, Charset: 'UTF-8' },
            Body: { Html: { Data: finalHtml, Charset: 'UTF-8' } },
          },
        },
        FromEmailAddress: fromEmail,
        // Note: Tags are not supported in SendEmailCommand, use ConfigurationSetName for tracking
      });

      const response = await sesClient.send(command);

      return {
        success: true,
        messageId: response.MessageId,
        recipientEmail: recipient.email,
        providerResponse: response,
      };
    } catch (error: any) {
      return {
        success: false,
        recipientEmail: recipient.email,
        error: error.message || 'Unknown Amazon SES error',
        providerResponse: error,
      };
    }
  }

  protected getBatchSize(): number {
    return 14; // SES has a 14 emails per second limit
  }

  protected getBatchDelay(): number {
    return 1000; // 1 second delay to respect SES rate limits
  }
}

// Simple SMTP processor for testing and development
export class SMTPEmailProcessor extends BaseEmailProcessor {
  async sendSingleEmail(
    jobData: EmailJobData,
    recipient: EmailJobData['recipients'][0]
  ): Promise<EmailSendResult> {
    try {
      const { providerConfig, subject, fromName, fromEmail, htmlContent } = jobData;
      
      if (!providerConfig || Object.keys(providerConfig).length === 0) {
        throw new Error('SMTP configuration is missing');
      }

      // SMTP is not fully implemented - require real provider
      throw new Error('SMTP provider is not fully implemented. Please use Brevo, Mailgun, or Amazon SES for sending emails.');
    } catch (error: any) {
      return {
        success: false,
        recipientEmail: recipient.email,
        error: error.message || 'Unknown SMTP error',
        providerResponse: error,
      };
    }
  }

  protected getBatchSize(): number {
    return 5; // Small batch size for testing
  }

  protected getBatchDelay(): number {
    return 1000; // 1 second delay for testing
  }
}

// Factory function to get the appropriate processor
export function getEmailProcessor(provider: 'brevo' | 'mailgun' | 'amazon_ses' | 'smtp'): BaseEmailProcessor {
  switch (provider) {
    case 'brevo':
      return new BrevoEmailProcessor();
    case 'mailgun':
      return new MailgunEmailProcessor();
    case 'amazon_ses':
      return new AmazonSESEmailProcessor();
    case 'smtp':
      return new SMTPEmailProcessor();
    default:
      throw new Error(`Unsupported email provider: ${provider}`);
  }
}

export async function processEmailJob(job: Job<EmailJobData>): Promise<BulkEmailSendResult> {
  const { sendingProviderId, recipients, providerConfig } = job.data;
  
  try {
    console.log(`📧 Processing email job for ${recipients.length} recipients with provider: ${sendingProviderId}`);
    console.log(`🔧 Provider config keys:`, Object.keys(providerConfig || {}));
    
    // Check if we have actual recipients
    if (!recipients || recipients.length === 0) {
      console.log('⚠️ No recipients found in job data');
      return {
        success: false,
        totalSent: 0,
        totalFailed: 0,
        results: [],
        errors: ['No recipients provided']
      };
    }
    
    // REQUIRE real provider configuration - no simulation allowed
    const hasProviderConfig = providerConfig && Object.keys(providerConfig).length > 0;
    console.log(`🔧 Has provider config: ${hasProviderConfig}`);
    
    if (!hasProviderConfig) {
      const errorMessage = 'Email provider configuration is required to send emails. Please configure an email provider in the Integrations section (Brevo, Mailgun, or Amazon SES).';
      console.error('❌ ' + errorMessage);
      throw new Error(errorMessage);
    }
    
    // Validate that the provider config matches the selected provider
    if (!providerConfig[sendingProviderId]) {
      const errorMessage = `Configuration for provider '${sendingProviderId}' is missing. Please configure this provider in the Integrations section.`;
      console.error('❌ ' + errorMessage);
      throw new Error(errorMessage);
    }
    
    // Get the appropriate processor for real email sending
    console.log(`🚀 Using real email provider: ${sendingProviderId}`);
    const processor = getEmailProcessor(sendingProviderId);
    
    // Process the email with cursor-based pagination
    const result = await processor.processBulkEmail(job);
    
    console.log(`📊 Email job completed: ${result.totalSent} sent, ${result.totalFailed} failed`);
    
    return result;
  } catch (error: any) {
    console.error('❌ Error processing email job:', error);
    throw error;
  }
}

// Utility functions for handling large email jobs

export const EMAIL_JOB_CONSTANTS = {
  MAX_RECIPIENTS_PER_JOB: 1000, // Split large jobs into smaller chunks
  PRIORITY_NEWSLETTER: 3,
  PRIORITY_TRANSACTIONAL: 1,
  PRIORITY_BULK: 5,
} as const;

/**
 * Split a large email job into smaller manageable chunks
 * This prevents memory issues and allows better queue management
 */
export function splitLargeEmailJob(
  originalJobData: EmailJobData,
  maxRecipientsPerJob: number = EMAIL_JOB_CONSTANTS.MAX_RECIPIENTS_PER_JOB
): EmailJobData[] {
  const { recipients } = originalJobData;
  
  if (recipients.length <= maxRecipientsPerJob) {
    return [originalJobData];
  }

  const chunks: EmailJobData[] = [];
  for (let i = 0; i < recipients.length; i += maxRecipientsPerJob) {
    const chunkRecipients = recipients.slice(i, i + maxRecipientsPerJob);
    chunks.push({
      ...originalJobData,
      recipients: chunkRecipients,
    });
  }

  console.log(`📦 Split large job with ${recipients.length} recipients into ${chunks.length} smaller jobs`);
  return chunks;
}

/**
 * Estimate processing time for an email job based on provider and recipient count
 */
export function estimateProcessingTime(
  recipientCount: number,
  provider: 'brevo' | 'mailgun' | 'amazon_ses'
): number {
  const processor = getEmailProcessor(provider);
  const batchSize = (processor as any).getBatchSize();
  const batchDelay = (processor as any).getBatchDelay();
  
  const batches = Math.ceil(recipientCount / batchSize);
  const totalDelay = (batches - 1) * batchDelay;
  const processingTime = batches * 100; // Estimate 100ms per batch processing
  
  return totalDelay + processingTime;
}
