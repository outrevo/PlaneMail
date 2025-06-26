import { Job } from 'bullmq';
import { EmailJobData, EmailSendResult, BulkEmailSendResult } from '@planemail/shared';
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

    // Process emails in batches to avoid overwhelming the provider
    const batchSize = this.getBatchSize();
    const batches = this.chunkArray(recipients, batchSize);

    for (let i = 0; i < batches.length; i++) {
      const batch = batches[i];
      const batchResults = await this.processBatch(job.data, batch, job);
      
      results.push(...batchResults);
      
      // Update job progress
      const progress = Math.round(((i + 1) / batches.length) * 100);
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

      // Add delay between batches to respect rate limits
      if (i < batches.length - 1) {
        await this.delay(this.getBatchDelay());
      }
    }

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
    job: Job<EmailJobData>
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
    return 10; // Default batch size
  }

  protected getBatchDelay(): number {
    return 1000; // Default 1 second delay between batches
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

      const { apiKey } = providerConfig.brevo;
      
      const transacEmailApi = new Brevo.TransactionalEmailsApi();
      transacEmailApi.setApiKey(Brevo.TransactionalEmailsApiApiKeys.apiKey, apiKey);
      
      const sendSmtpEmail = new Brevo.SendSmtpEmail();
      sendSmtpEmail.sender = { email: fromEmail, name: fromName };
      sendSmtpEmail.to = [{ email: recipient.email, name: recipient.name }];
      sendSmtpEmail.subject = subject;
      sendSmtpEmail.htmlContent = htmlContent;

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
    return 50; // Brevo allows higher batch sizes
  }

  protected getBatchDelay(): number {
    return 500; // Shorter delay for Brevo
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
        html: htmlContent,
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
    return 100; // Mailgun has high limits
  }

  protected getBatchDelay(): number {
    return 100; // Very short delay for Mailgun
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
            Body: { Html: { Data: htmlContent, Charset: 'UTF-8' } },
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
    return 1000; // 1 second delay to respect rate limits
  }
}

// Factory function to get the appropriate processor
export function getEmailProcessor(provider: 'brevo' | 'mailgun' | 'amazon_ses'): BaseEmailProcessor {
  switch (provider) {
    case 'brevo':
      return new BrevoEmailProcessor();
    case 'mailgun':
      return new MailgunEmailProcessor();
    case 'amazon_ses':
      return new AmazonSESEmailProcessor();
    default:
      throw new Error(`Unsupported email provider: ${provider}`);
  }
}

export async function processEmailJob(job: Job<EmailJobData>): Promise<BulkEmailSendResult> {
  const { sendingProviderId, recipients, providerConfig } = job.data;
  
  try {
    // For now, if providerConfig is empty, simulate a successful send for testing
    if (!providerConfig || Object.keys(providerConfig).length === 0) {
      console.log('🧪 Simulating email send (no provider config)');
      return {
        success: true,
        totalSent: recipients.length,
        totalFailed: 0,
        results: recipients.map(r => ({
          success: true,
          recipientEmail: r.email,
          messageId: 'sim_' + Math.random().toString(36).substring(7)
        })),
        errors: []
      };
    }
    
    // Get the appropriate processor
    const processor = getEmailProcessor(sendingProviderId);
    
    // Process the email
    const result = await processor.processBulkEmail(job);
    
    return result;
  } catch (error: any) {
    console.error('Error processing email job:', error);
    throw error;
  }
}
