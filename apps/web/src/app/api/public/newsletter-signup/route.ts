import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { subscribers, publicSiteSettings, appUsers } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { generateConfirmationToken } from '@planemail/shared';
import { convertToEmailHTML } from '@/lib/email-html-converter';
import { queueClient } from '@/lib/queue-client';
import { 
  getBrevoIntegrationDetails, 
  getMailgunIntegrationDetails, 
  getAmazonSESIntegrationDetails 
} from '@/app/(app)/integrations/actions';

// Type guards to narrow integration detail types
function isBrevo(details: any): details is { connected: boolean; senders?: { email: string; name?: string }[] } {
  return typeof details === 'object' && details !== null && 'connected' in details;
}
function isMailgun(details: any): details is { connected: boolean; domain: string | null; region: 'us' | 'eu' | null } {
  return typeof details === 'object' && details !== null && 'connected' in details;
}
function isSES(details: any): details is { connected: boolean; region: string | null; verifiedIdentities?: string[] } {
  return typeof details === 'object' && details !== null && 'connected' in details;
}

function fromEmailFallback(provider: string, details: any): string {
  if (provider === 'brevo' && isBrevo(details.brevo) && details.brevo.senders && details.brevo.senders.length > 0) {
    return details.brevo.senders[0].email;
  }
  if (provider === 'mailgun' && isMailgun(details.mailgun) && details.mailgun.domain) {
    return `no-reply@${details.mailgun.domain}`;
  }
  if (provider === 'amazon_ses' && isSES(details.ses) && details.ses.verifiedIdentities && details.ses.verifiedIdentities.length > 0) {
    return details.ses.verifiedIdentities[0];
  }
  return 'no-reply@planemail.dev';
}

function pickProvider(details: { brevo: any; mailgun: any; ses: any; }) {
  if (details.brevo?.connected) return 'brevo';
  if (details.mailgun?.connected) return 'mailgun';
  if (details.ses?.connected) return 'amazon_ses';
  return null;
}

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email || !email.trim()) {
      return NextResponse.json(
        { success: false, message: 'Email is required' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { success: false, message: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Get the site owner (first user with site settings)
    const siteOwner = await db
      .select({ userId: publicSiteSettings.userId })
      .from(publicSiteSettings)
      .limit(1);

    const userId = siteOwner.length > 0 ? siteOwner[0].userId : 'system';
    
    // Fetch site settings (including double opt-in preference)
    const siteSettings = await db
      .select({ enableDoubleOptIn: publicSiteSettings.enableDoubleOptIn })
      .from(publicSiteSettings)
      .where(eq(publicSiteSettings.userId, userId))
      .limit(1);
    const doubleOptInEnabled = siteSettings[0]?.enableDoubleOptIn ?? false;

    // Check if subscriber already exists for this user
    const existingSubscriber = await db
      .select()
      .from(subscribers)
      .where(eq(subscribers.email, email.toLowerCase().trim()))
      .limit(1);

    if (existingSubscriber.length > 0) {
      const subscriber = existingSubscriber[0];
      
      if (subscriber.status === 'active') {
        return NextResponse.json(
          { success: false, message: 'You are already subscribed' },
          { status: 400 }
        );
      } else {
        // Reactivate subscriber
        await db
          .update(subscribers)
          .set({
            status: 'active',
            dateAdded: new Date(),
            updatedAt: new Date(),
          })
          .where(eq(subscribers.id, subscriber.id));

        return NextResponse.json({
          success: true,
          message: 'Successfully resubscribed to newsletter',
        });
      }
    }

    // Create subscriber respecting double opt-in setting
    const initialStatus = doubleOptInEnabled ? 'pending' : 'active';
    const [newSubscriber] = await db.insert(subscribers).values({
      userId: userId,
      email: email.toLowerCase().trim(),
      status: initialStatus,
    }).returning({ id: subscribers.id });

    // If double opt-in disabled, return success immediately
    if (!doubleOptInEnabled) {
      return NextResponse.json({
        success: true,
        message: 'Successfully subscribed to newsletter',
        pending: false,
      });
    }

    // Double opt-in path: generate confirmation token & URL
    const token = generateConfirmationToken(newSubscriber.id, email.toLowerCase().trim());
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || 'http://localhost:3000';
    const confirmationUrl = `${baseUrl}/api/public/confirm/${token}?email=${encodeURIComponent(email.toLowerCase().trim())}&id=${newSubscriber.id}`;

    // Build email content
    // Fetch sender address (if available) for compliance footer
    const userProfile = await db
      .select({
        senderAddressLine1: appUsers.senderAddressLine1,
        senderAddressLine2: appUsers.senderAddressLine2,
        senderCity: appUsers.senderCity,
        senderState: appUsers.senderState,
        senderPostalCode: appUsers.senderPostalCode,
        senderCountry: appUsers.senderCountry,
      })
      .from(appUsers)
      .where(eq(appUsers.clerkUserId, userId))
      .limit(1);

    let senderAddress = 'Update your sender address in settings';
    if (userProfile.length > 0) {
      const a = userProfile[0];
      const parts = [a.senderAddressLine1, a.senderAddressLine2, a.senderCity, a.senderState, a.senderPostalCode, a.senderCountry]
        .filter(Boolean)
        .join(', ');
      if (parts.trim()) senderAddress = parts;
    }

    const rawHtml = `
      <h2>Confirm your subscription</h2>
      <p>Thanks for signing up! Please confirm your email address by clicking the button below.</p>
      <p style="text-align:center;margin:32px 0;">
        <a href="${confirmationUrl}" style="background:#2563eb;color:#ffffff;padding:12px 20px;border-radius:6px;text-decoration:none;display:inline-block;font-weight:600;">Confirm Subscription</a>
      </p>
      <p>If the button doesn't work, copy and paste this URL into your browser:<br />
      <a href="${confirmationUrl}">${confirmationUrl}</a></p>
    `.trim();

    const htmlContent = convertToEmailHTML(rawHtml, {
      // No unsubscribe link required before confirmation; use placeholder '#'
      unsubscribeUrl: '#',
      senderAddress,
    });

    // Attempt to send confirmation email if a provider is configured
    const [brevo, mailgun, ses] = await Promise.all([
      getBrevoIntegrationDetails().catch(() => ({ connected: false })),
      getMailgunIntegrationDetails().catch(() => ({ connected: false })),
      getAmazonSESIntegrationDetails().catch(() => ({ connected: false })),
    ]);
    const details = { brevo, mailgun, ses };
    const provider = pickProvider(details);

    if (provider) {
      let providerConfig: any = {};
      if (provider === 'brevo' && details.brevo.connected) {
        // We only have masked key in details; cannot send real confirmation without stored key server-side.
        providerConfig = { brevo: { apiKey: '', senders: isBrevo(details.brevo) ? details.brevo.senders || [] : [] } };
      } else if (provider === 'mailgun' && details.mailgun.connected) {
        providerConfig = { mailgun: { apiKey: '', domain: isMailgun(details.mailgun) && details.mailgun.domain ? details.mailgun.domain : '', region: isMailgun(details.mailgun) && details.mailgun.region ? details.mailgun.region : 'us' } };
      } else if (provider === 'amazon_ses' && details.ses.connected) {
        providerConfig = { amazon_ses: { accessKeyId: '', secretAccessKey: '', region: isSES(details.ses) && details.ses.region ? details.ses.region : 'us-east-1', verifiedIdentities: isSES(details.ses) && details.ses.verifiedIdentities ? details.ses.verifiedIdentities : [] } };
      }

      try {
        await queueClient.addNewsletterJob({
          id: newSubscriber.id,
            userId,
            subject: 'Confirm your subscription',
            fromName: 'Newsletter',
            fromEmail: fromEmailFallback(provider, details) ,
            htmlContent,
            sendingProviderId: provider as any,
            recipients: [{ email: email.toLowerCase().trim() }],
            providerConfig,
            priority: 1,
            attempts: 0,
            createdAt: new Date(),
        } as any);
      } catch (e) {
        console.error('Failed to queue confirmation email:', e);
      }
    } else {
      console.warn('No email provider configured; subscriber pending without confirmation email sent');
    }

    return NextResponse.json({
      success: true,
      message: provider
        ? 'Confirmation email sent. Please check your inbox.'
        : 'Subscription pending. Email provider not configured; contact site owner to confirm.',
      pending: true,
      doubleOptIn: true,
    });

  } catch (error) {
    console.error('Newsletter signup error:', error);
    return NextResponse.json(
      { success: false, message: 'An error occurred. Please try again.' },
      { status: 500 }
    );
  }
}
