
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
import * as Brevo from '@getbrevo/brevo';
import Mailgun from 'mailgun.js';
import formData from 'form-data'; 
import { SESv2Client, SendEmailCommand } from "@aws-sdk/client-sesv2"; 

import { renderToStaticMarkup, type TReaderDocument } from '@usewaypoint/email-builder';


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
    let designJson: TReaderDocument;
    if (templateId) {
      const template = await db.select({ content: dbTemplates.content }).from(dbTemplates).where(eq(dbTemplates.id, templateId)).limit(1);
      if (template[0]?.content) {
        finalContentToStore = template[0].content; 
        designJson = JSON.parse(template[0].content);
      } else {
        return { success: false, message: 'Selected template content not found.', errors: null };
      }
    } else if (content) {
      finalContentToStore = content;
      designJson = JSON.parse(content);
    } else {
      return { success: false, message: 'Email content is missing.', errors: null };
    }

    // Convert email-builder JSON to HTML using the correct function
    htmlEmailContent = renderToStaticMarkup(designJson, { rootBlockId: 'root' });

  } catch (e: any) {
    console.error('Error processing email content for sending:', e);
    return { success: false, message: 'Error processing email content: ' + e.message, errors: null };
  }


  let providerMessageId: string | undefined = undefined;
  let actualRecipientCount = 1; 

  try {
    if (sendingProviderId === 'brevo') {
        const brevoIntegration = await db.query.userIntegrations.findFirst({
            where: and(eq(userIntegrations.userId, userId), eq(userIntegrations.provider, 'brevo'), eq(userIntegrations.status, 'active')),
        });
        if (!brevoIntegration || !brevoIntegration.apiKey) {
            return { success: false, message: 'Brevo integration is not active or API key is missing.', errors: null };
        }
        const verifiedSenders = (brevoIntegration.meta as any)?.senders as { email: string, name?:string }[] || [];
        if (!verifiedSenders.some(s => s.email === fromEmail)) {
            return { success: false, message: `From Email "${fromEmail}" is not a verified Brevo sender. Please check Integrations.`, errors: {fromEmail: ['Not a verified Brevo sender.']}};
        }

        const transacEmailApi = new Brevo.TransactionalEmailsApi();
        transacEmailApi.setApiKey(Brevo.TransactionalEmailsApiApiKeys.apiKey, brevoIntegration.apiKey);
        const sendSmtpEmail = new Brevo.SendSmtpEmail();
        sendSmtpEmail.sender = { email: fromEmail, name: fromName };
        sendSmtpEmail.to = [{ email: fromEmail, name: `Test Recipient ${fromName}` }]; 
        sendSmtpEmail.subject = subject;
        sendSmtpEmail.htmlContent = htmlEmailContent;
        
        const brevoResponse = await transacEmailApi.sendTransacEmail(sendSmtpEmail);
        if (brevoResponse.body.messageId) {
          providerMessageId = brevoResponse.body.messageId;
        }

    } else if (sendingProviderId === 'mailgun') {
        const mailgunIntegration = await db.query.userIntegrations.findFirst({
            where: and(eq(userIntegrations.userId, userId), eq(userIntegrations.provider, 'mailgun'), eq(userIntegrations.status, 'active')),
        });
        if (!mailgunIntegration || !mailgunIntegration.apiKey || !(mailgunIntegration.meta as any)?.domain) {
            return { success: false, message: 'Mailgun integration is not active, API key or domain is missing.', errors: null };
        }
        const mailgunApiKey = mailgunIntegration.apiKey;
        const mailgunDomain = (mailgunIntegration.meta as any).domain;
        const mailgunRegion = (mailgunIntegration.meta as any).region || 'us';

        if (!fromEmail.endsWith(`@${mailgunDomain}`)) {
            return { success: false, message: `From Email must use your verified Mailgun domain (${mailgunDomain}).`, errors: { fromEmail: [`Must use @${mailgunDomain}`]}};
        }

        const mailgun = new Mailgun(formData);
        const mg = mailgun.client({ 
            username: 'api', 
            key: mailgunApiKey,
            url: mailgunRegion === 'eu' ? 'https://api.eu.mailgun.net' : 'https://api.mailgun.net'
        });
        
        const mailgunResponse = await mg.messages.create(mailgunDomain, {
            from: `${fromName} <${fromEmail}>`,
            to: [fromEmail], 
            subject: subject,
            html: htmlEmailContent,
        });
        if (mailgunResponse.id) {
          providerMessageId = mailgunResponse.id;
        }
    } else if (sendingProviderId === 'amazon_ses') {
        const sesIntegration = await db.query.userIntegrations.findFirst({
            where: and(eq(userIntegrations.userId, userId), eq(userIntegrations.provider, 'amazon_ses'), eq(userIntegrations.status, 'active')),
        });

        if (!sesIntegration || !sesIntegration.apiKey || !sesIntegration.secretApiKey || !(sesIntegration.meta as any)?.region) {
            return { success: false, message: 'Amazon SES integration is not active or credentials/region are missing.', errors: null };
        }
        const accessKeyId = sesIntegration.apiKey;
        const secretAccessKey = sesIntegration.secretApiKey;
        const region = (sesIntegration.meta as any).region;

        const sesClient = new SESv2Client({
            region,
            credentials: { accessKeyId, secretAccessKey },
        });

        const command = new SendEmailCommand({
            Destination: { ToAddresses: [fromEmail] }, 
            Content: {
                Simple: {
                    Subject: { Data: subject, Charset: 'UTF-8' },
                    Body: { Html: { Data: htmlEmailContent, Charset: 'UTF-8' } },
                },
            },
            FromEmailAddress: fromEmail,
        });
        
        const sesResponse = await sesClient.send(command);
        if (sesResponse.MessageId) {
            providerMessageId = sesResponse.MessageId;
        } else {
            throw new Error("Amazon SES did not return a MessageId.");
        }
    } else {
      return { success: false, message: 'Invalid sending provider selected.', errors: null };
    }
    
    const sentTimestamp = new Date();
    const [newNewsletter] = await db.insert(newsletters).values({
      userId,
      subject,
      fromName,
      fromEmail,
      content: finalContentToStore,
      templateId: templateId || null,
      status: 'sent', 
      sentAt: sentTimestamp,
      recipientCount: actualRecipientCount,
      sendingProviderId,
      providerMessageId,
      totalOpens: 0,
      uniqueOpens: 0,
      totalClicks: 0,
      uniqueClicks: 0,
      totalBounces: 0,
    }).returning();

    revalidatePath('/newsletters');
    revalidatePath(`/newsletters/${newNewsletter.id}/analytics`);
    return { success: true, message: `Newsletter "${subject}" sent via ${sendingProviderId} (to ${fromEmail}).`, newsletter: newNewsletter };

  } catch (error: any) {
    console.error(`Failed to send newsletter via ${sendingProviderId}:`, error.response?.data || error.response?.body || error.message || error);
    let message = `Failed to send newsletter via ${sendingProviderId}.`;
    if (error.name === 'MessageRejected' && sendingProviderId === 'amazon_ses') {
        message = 'Amazon SES rejected the email. This often means the "From" email address is not verified in SES for the selected region, or there are sending limit issues.';
    } else if (error.response?.data?.message) { 
        message = `${sendingProviderId} API Error: ${error.response.data.message}`;
    } else if (error.response?.body?.message) { 
        message = `${sendingProviderId} API Error: ${error.response.body.message}`;
    } else if (error.message) {
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
      .where(and(eq(newsletters.userId, userId), eq(newsletters.status, 'sent'))) 
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
