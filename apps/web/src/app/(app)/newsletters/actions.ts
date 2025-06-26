
'use server';

import { db } from '@/lib/drizzle';
import { newsletters, templates as dbTemplates, segments as dbSegments, userIntegrations } from '@/db/schema';
import { auth } from '@clerk/nextjs/server';
import { eq, and, desc } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { 
    getBrevoIntegrationDetails, 
    getMailgunIntegrationDetails, 
    getAmazonSESIntegrationDetails,
    type BrevoIntegrationDetailsType, 
    type MailgunIntegrationDetailsType,
    type AmazonSESIntegrationDetailsType
} from '../integrations/actions';
import { queueClient } from '@/lib/queue-client';
import { EmailJobData } from '@planemail/shared'; 

// Email rendering is handled by Unlayer's exportHtml function
// The template content is stored with both design JSON and HTML from Unlayer


const newsletterSchema = z.object({
  subject: z.string().min(1, { message: 'Subject is required.' }).max(255),
  fromName: z.string().min(1, { message: 'From Name is required.'}).max(255),
  fromEmail: z.string().email({ message: 'Valid From Email is required.'}),
  templateId: z.string().uuid().optional(),
  segmentId: z.string().uuid().optional(), 
  content: z.string().optional(), // This will be the email-builder JSON string if no template is used
  sendingProviderId: z.enum(['brevo', 'mailgun', 'amazon_ses'], { required_error: 'Sending provider must be selected.'}),
});

export type NewsletterPageDataType = {
  templates: Pick<typeof dbTemplates.$inferSelect, 'id' | 'name'>[];
  segments: Pick<typeof dbSegments.$inferSelect, 'id' | 'name'>[];
  brevoIntegration: BrevoIntegrationDetailsType;
  mailgunIntegration: MailgunIntegrationDetailsType;
  amazonSESIntegration: AmazonSESIntegrationDetailsType;
};

export async function getNewsletterPageData(): Promise<NewsletterPageDataType> {
  const { userId } = await auth();
  if (!userId) {
    throw new Error('Not authenticated');
  }
  try {
    const userTemplates = await db.select({ id: dbTemplates.id, name: dbTemplates.name })
      .from(dbTemplates)
      .where(eq(dbTemplates.userId, userId))
      .orderBy(desc(dbTemplates.name));
    
    const userSegments = await db.select({ id: dbSegments.id, name: dbSegments.name })
      .from(dbSegments)
      .where(eq(dbSegments.userId, userId))
      .orderBy(desc(dbSegments.name));
      
    const allSubscribersSegment = { id: 'all', name: 'All Subscribers (Test Send Target)' };


    const [brevoDetails, mailgunDetails, amazonSESDetails] = await Promise.all([
        getBrevoIntegrationDetails(),
        getMailgunIntegrationDetails(),
        getAmazonSESIntegrationDetails() 
    ]);

    return { 
      templates: userTemplates, 
      segments: [allSubscribersSegment, ...userSegments],
      brevoIntegration: brevoDetails,
      mailgunIntegration: mailgunDetails,
      amazonSESIntegration: amazonSESDetails,
    };
  } catch (error) {
    console.error('Failed to fetch newsletter page data:', error);
    return { 
      templates: [], 
      segments: [],
      brevoIntegration: { connected: false, apiKeySet: false, status: 'inactive', senders: [] },
      mailgunIntegration: { connected: false, apiKeySet: false, status: 'inactive', domain: null, region: null },
      amazonSESIntegration: { connected: false, accessKeyIdSet: false, secretAccessKeySet: false, region: null, status: 'inactive', verifiedIdentities: [] },
    };
  }
}


export async function createNewsletter(formDataObj: FormData) {
  const { userId } = await auth();
  if (!userId) return { success: false, message: 'Not authenticated', errors: null };

  const validatedFields = newsletterSchema.safeParse({
    subject: formDataObj.get('subject'),
    fromName: formDataObj.get('fromName'),
    fromEmail: formDataObj.get('fromEmail'),
    templateId: formDataObj.get('templateId') === 'none' ? undefined : formDataObj.get('templateId'),
    segmentId: formDataObj.get('segmentId') === 'all' ? undefined : formDataObj.get('segmentId'),
    content: formDataObj.get('content'), 
    sendingProviderId: formDataObj.get('sendingProviderId') as 'brevo' | 'mailgun' | 'amazon_ses',
  });

  if (!validatedFields.success) {
    return { success: false, message: 'Validation failed.', errors: validatedFields.error.flatten().fieldErrors };
  }

  const { subject, fromName, fromEmail, templateId, segmentId, content, sendingProviderId } = validatedFields.data;

  let htmlEmailContent = '';
    let finalContentToStore = content || ''; 

  try {
    let parsedContent: any;
    if (templateId) {
      const template = await db.select({ content: dbTemplates.content }).from(dbTemplates).where(eq(dbTemplates.id, templateId)).limit(1);
      if (template[0]?.content) {
        finalContentToStore = template[0].content; 
        parsedContent = JSON.parse(template[0].content);
        
        // Templates from Unlayer should have both design and html
        if (parsedContent.html) {
          htmlEmailContent = parsedContent.html;
        } else {
          return { success: false, message: 'Template does not contain rendered HTML content.', errors: null };
        }
      } else {
        return { success: false, message: 'Selected template content not found.', errors: null };
      }
    } else if (content) {
      finalContentToStore = content;
      parsedContent = JSON.parse(content);
      
      // If content has HTML (from Unlayer), use it; otherwise treat as plain text
      if (parsedContent.html) {
        htmlEmailContent = parsedContent.html;
      } else {
        // Fallback: treat content as plain text and wrap in basic HTML
        htmlEmailContent = `
          <html>
            <body style="font-family: Arial, sans-serif; line-height: 1.6; margin: 20px;">
              ${content.replace(/\n/g, '<br>')}
            </body>
          </html>
        `;
      }
    } else {
      return { success: false, message: 'Email content is missing.', errors: null };
    }

  } catch (e: any) {
    console.error('Error processing email content for sending:', e);
    return { success: false, message: 'Error processing email content: ' + e.message, errors: null };
  }


  // Create newsletter record first to get the ID
  const sentTimestamp = new Date();
  const [newNewsletter] = await db.insert(newsletters).values({
    userId,
    subject,
    fromName,
    fromEmail,
    content: finalContentToStore,
    templateId: templateId || null,
    status: 'queued', // Start with queued status
    sentAt: null, // Will be updated when actually sent
    recipientCount: 1, // Test send to fromEmail
    sendingProviderId,
    providerMessageId: null, // Will be updated when sent
    totalOpens: 0,
    uniqueOpens: 0,
    totalClicks: 0,
    uniqueClicks: 0,
    totalBounces: 0,
  }).returning();

  try {
    // Get provider configuration from database
    let providerConfig = {};
    try {
      const integration = await db.query.userIntegrations.findFirst({
        where: and(eq(userIntegrations.userId, userId), eq(userIntegrations.provider, sendingProviderId)),
      });

      if (!integration || integration.status !== 'active') {
        return { 
          success: false, 
          message: `${sendingProviderId} integration is not active. Please configure it in the integrations page.`, 
          errors: null 
        };
      }

      // Build provider config based on the selected provider
      switch (sendingProviderId) {
        case 'brevo':
          providerConfig = {
            brevo: {
              apiKey: integration.apiKey,
              senders: (integration.meta as any)?.senders || []
            }
          };
          break;
        case 'mailgun':
          providerConfig = {
            mailgun: {
              apiKey: integration.apiKey,
              domain: (integration.meta as any)?.domain,
              region: (integration.meta as any)?.region || 'us'
            }
          };
          break;
        case 'amazon_ses':
          providerConfig = {
            amazon_ses: {
              accessKeyId: integration.apiKey, // Using apiKey field for access key
              secretAccessKey: (integration.meta as any)?.secretAccessKey,
              region: (integration.meta as any)?.region || 'us-east-1'
            }
          };
          break;
        default:
          return { 
            success: false, 
            message: `Unsupported email provider: ${sendingProviderId}`, 
            errors: null 
          };
      }
    } catch (error) {
      console.error('Error fetching provider configuration:', error);
      return { 
        success: false, 
        message: 'Failed to fetch email provider configuration.', 
        errors: null 
      };
    }

    // Send email via queue service
    const emailJobData: EmailJobData = {
      id: newNewsletter.id,
      subject,
      fromName,
      fromEmail,
      htmlContent: htmlEmailContent,
      sendingProviderId,
      newsletterId: newNewsletter.id,
      templateId: templateId || undefined,
      segmentId: segmentId || undefined,
      recipients: [{ email: fromEmail, name: fromName }], // Test send to fromEmail
      userId,
      providerConfig,
      priority: 3,
      attempts: 3,
      createdAt: new Date()
    };

    const emailResult = await queueClient.addNewsletterJob(emailJobData);

    if (!emailResult.success) {
      // Update newsletter status to failed
      await db.update(newsletters)
        .set({ status: 'failed' })
        .where(eq(newsletters.id, newNewsletter.id));
      
      return { 
        success: false, 
        message: emailResult.message, 
        errors: null 
      };
    }

    // Update newsletter status to processing (the queue will handle actual sending)
    await db.update(newsletters)
      .set({ 
        status: 'processing',
        providerMessageId: emailResult.jobId 
      })
      .where(eq(newsletters.id, newNewsletter.id));

    revalidatePath('/newsletters');
    revalidatePath(`/newsletters/${newNewsletter.id}/analytics`);
    
    return { 
      success: true, 
      message: `Newsletter "${subject}" queued for sending via ${sendingProviderId}. Job ID: ${emailResult.jobId}`, 
      newsletter: newNewsletter,
      jobId: emailResult.jobId
    };

  } catch (error: any) {
    console.error(`Failed to queue newsletter via ${sendingProviderId}:`, error);
    
    // Update newsletter status to failed
    await db.update(newsletters)
      .set({ status: 'failed' })
      .where(eq(newsletters.id, newNewsletter.id));
    
    let message = `Failed to queue newsletter via ${sendingProviderId}.`;
    if (error.message) {
      message = `Error: ${error.message}`;
    }
    return { success: false, message, errors: null };
  }
}

export async function getSentNewsletters() {
  const { userId } = await auth();
  if (!userId) throw new Error('Not authenticated');

  try {
    const sent = await db.select({
        id: newsletters.id,
        subject: newsletters.subject,
        sentDate: newsletters.sentAt,
        recipients: newsletters.recipientCount,
        status: newsletters.status,
        sendingProvider: newsletters.sendingProviderId,
        providerMessageId: newsletters.providerMessageId,
        totalOpens: newsletters.totalOpens,
        uniqueOpens: newsletters.uniqueOpens,
        totalClicks: newsletters.totalClicks,
        uniqueClicks: newsletters.uniqueClicks,
      })
      .from(newsletters)
      .where(eq(newsletters.userId, userId)) // Include all newsletters, not just sent ones
      .orderBy(desc(newsletters.sentAt));
    
    return sent.map(nl => ({
        ...nl,
        sentDate: nl.sentDate ? new Date(nl.sentDate).toLocaleDateString() : 'N/A', 
        recipients: nl.recipients || 0,
    }));

  } catch (error) {
    console.error('Failed to fetch sent newsletters:', error);
    return [];
  }
}

export { getBrevoIntegrationDetails };
