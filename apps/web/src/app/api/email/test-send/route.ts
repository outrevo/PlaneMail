import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { appUsers, userIntegrations, subscribers } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { queueClient } from '@/lib/queue-client';
import { convertToEmailHTML } from '@/lib/email-html-converter';

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { subject, fromName, fromEmail, html } = body;
    if (!subject || !html) {
      return NextResponse.json({ success: false, message: 'Missing subject or html' }, { status: 400 });
    }

    // Get a fallback test recipient: first active subscriber or the user themselves placeholder
    const existingSubscriber = await db.query.subscribers.findFirst({
      where: and(eq(subscribers.userId, userId), eq(subscribers.status, 'active')),
    });
    const recipientEmail = existingSubscriber?.email || fromEmail || 'test@example.com';

    // Fetch provider integration (pick first active)
    const integration = await db.query.userIntegrations.findFirst({
      where: and(eq(userIntegrations.userId, userId), eq(userIntegrations.status, 'active')),
    });
    if (!integration) {
      return NextResponse.json({ success: false, message: 'No active email provider configured' }, { status: 400 });
    }

    // Build providerConfig similar to send flow
    let providerConfig: any = {};
    switch (integration.provider as 'brevo' | 'mailgun' | 'amazon_ses') {
      case 'brevo':
        providerConfig = { brevo: { apiKey: integration.apiKey } };
        break;
      case 'mailgun':
        const mgMeta: any = integration.meta || {};
        providerConfig = { mailgun: { apiKey: integration.apiKey, domain: mgMeta.domain || '', region: mgMeta.region || 'us' } };
        break;
      case 'amazon_ses':
        const sesMeta: any = integration.meta || {};
        providerConfig = { amazon_ses: { accessKeyId: integration.apiKey, secretAccessKey: sesMeta.secretAccessKey || '', region: sesMeta.region || 'us-east-1' } };
        break;
    }

    // Sender address for footer
    const profile = await db.query.appUsers.findFirst({ where: eq(appUsers.clerkUserId, userId) });
    let senderAddress = 'Update your address in settings';
    if (profile) {
      const parts = [profile.senderAddressLine1, profile.senderAddressLine2, profile.senderCity, profile.senderState, profile.senderPostalCode, profile.senderCountry].filter(Boolean).join(', ');
      if (parts) senderAddress = parts;
    }

    const unsubscribeUrlTemplate = '#'; // Not needed for test send
    const emailHtmlContent = convertToEmailHTML(html, { unsubscribeUrl: unsubscribeUrlTemplate, senderAddress });

    const now = new Date();
    const jobData = {
      id: `test-${now.getTime()}`,
      userId,
      subject: subject,
      fromName: fromName || 'Test',
      fromEmail: fromEmail || recipientEmail,
      htmlContent: emailHtmlContent,
      sendingProviderId: integration.provider as any,
      recipients: [{ email: recipientEmail }],
      providerConfig,
      priority: 1,
      attempts: 0,
      createdAt: now,
    } as any;

    const result = await queueClient.addTransactionalJob(jobData);
    if (!result.success) {
      return NextResponse.json({ success: false, message: result.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, jobId: result.jobId });
  } catch (error) {
    console.error('Test send error:', error);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}
