'use server';

import { db } from '@/lib/drizzle';
import { userIntegrations, appUsers, apiKeys as apiKeysTable, segments, subscribers as subscribersTable, subscriberSegments } from '@/db/schema';
import { auth } from '@clerk/nextjs/server';
import { eq, and, desc, inArray } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import * as Brevo from '@getbrevo/brevo';
import Mailgun from 'mailgun.js';
import formData from 'form-data'; // mailgun.js requires this
import { SESv2Client, GetAccountCommand, ListEmailIdentitiesCommand } from "@aws-sdk/client-sesv2"; // AWS SES SDK
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { triggerSubscriberCreated, triggerSegmentCreated } from '@/lib/webhooks/dispatcher';

const BREVO_PROVIDER_ID = 'brevo';
const MAILGUN_PROVIDER_ID = 'mailgun';
const AMAZON_SES_PROVIDER_ID = 'amazon_ses';

const brevoApiKeySchema = z.string().min(20, { message: 'Brevo API key seems too short.' }).max(200, { message: 'Brevo API key seems too long.' });
const mailgunApiKeySchema = z.string().min(20, { message: 'Mailgun API key seems too short.' }).max(200, { message: 'Mailgun API key seems too long.' });
const mailgunDomainSchema = z.string().min(3, { message: 'Domain seems too short.' }).max(255, { message: 'Domain seems too long.' })
  .refine(val => val.includes('.'), { message: 'Domain must contain a dot.'});
const mailgunRegionSchema = z.enum(['us', 'eu']);

const awsAccessKeyIdSchema = z.string().min(16, "Access Key ID must be at least 16 characters.").max(128, "Access Key ID is too long.");
const awsSecretAccessKeySchema = z.string().min(30, "Secret Access Key must be at least 30 characters.").max(128, "Secret Access Key is too long.");
const awsRegionSchema = z.string().min(5, "Region must be at least 5 characters (e.g., us-east-1).").max(30, "Region is too long.");


// Function to mask API key for display
const maskApiKeyDisplay = (key: string | null | undefined): string => {
  if (!key || key.length < 8) return 'Invalid Key';
  return `${key.substring(0, 4)}...${key.substring(key.length - 4)}`;
};

export type VerifiedBrevoSender = {
  email: string;
  name?: string;
};

export type BrevoIntegrationDetailsType = {
  connected: boolean;
  apiKeySet: boolean;
  maskedApiKey?: string;
  connectedAt?: Date | null;
  status?: string;
  senders?: VerifiedBrevoSender[];
};

export type MailgunIntegrationDetailsType = {
  connected: boolean;
  apiKeySet: boolean;
  maskedApiKey?: string;
  domain: string | null;
  region: 'us' | 'eu' | null;
  connectedAt?: Date | null;
  status?: string;
};

export type AmazonSESIntegrationDetailsType = {
  connected: boolean;
  accessKeyIdSet: boolean;
  secretAccessKeySet: boolean; // We won't display the secret key
  maskedAccessKeyId?: string;
  region: string | null;
  connectedAt?: Date | null;
  status?: string;
  verifiedIdentities?: string[]; // To store fetched verified emails/domains
};


export async function getBrevoIntegrationDetails(): Promise<BrevoIntegrationDetailsType> {
  const { userId } = await auth();
  if (!userId) {
    throw new Error('Not authenticated');
  }

  try {
    const integration = await db.query.userIntegrations.findFirst({
      where: and(eq(userIntegrations.userId, userId), eq(userIntegrations.provider, BREVO_PROVIDER_ID)),
    });

    if (!integration) {
      return { connected: false, apiKeySet: false, status: 'inactive', senders: [] };
    }

    const senders = (integration.meta as any)?.senders as VerifiedBrevoSender[] || [];

    return {
      connected: integration.status === 'active',
      apiKeySet: !!integration.apiKey,
      maskedApiKey: maskApiKeyDisplay(integration.apiKey),
      connectedAt: integration.connectedAt,
      status: integration.status,
      senders: senders,
    };
  } catch (error) {
    console.error('Failed to fetch Brevo integration details:', error);
    throw new Error('Could not retrieve Brevo integration status due to a database error.');
  }
}

export async function saveBrevoApiKey(apiKey: string) {
  const { userId } = await auth();
  if (!userId) return { success: false, message: 'Not authenticated' };

  const validation = brevoApiKeySchema.safeParse(apiKey);
  if (!validation.success) {
    return { success: false, message: validation.error.flatten().formErrors.join(', ') || 'Invalid API key format.' };
  }

  const validatedApiKey = validation.data;
  const currentTimestamp = new Date();
  let verifiedSenders: VerifiedBrevoSender[] = [];

  const accountApi = new Brevo.AccountApi();
  accountApi.setApiKey(Brevo.AccountApiApiKeys.apiKey, validatedApiKey);
  try {
    await accountApi.getAccount(); // Verify API key
    
    const sendersApi = new Brevo.SendersApi();
    sendersApi.setApiKey(Brevo.SendersApiApiKeys.apiKey, validatedApiKey);
    const senderData = await sendersApi.getSenders();
    if (senderData.body.senders) {
      verifiedSenders = senderData.body.senders
        .filter(sender => sender.active) 
        .map(sender => ({ email: sender.email, name: sender.name || undefined }));
    }
  } catch (error: any) {
    console.error("Brevo API key validation or sender fetch failed:", error.response?.data || error.message);
    let message = "Invalid Brevo API Key or connection issue.";
    if (error.response?.data?.message) {
      message = `Brevo API Error: ${error.response.data.message}`;
    } else if (error.message && typeof error.message === 'string') {
      message = `Brevo API Error: ${error.message}`;
    }
    return { success: false, message };
  }

  try {
    await db.insert(appUsers)
      .values({ clerkUserId: userId })
      .onConflictDoNothing({ target: appUsers.clerkUserId });

    await db.insert(userIntegrations)
      .values({
        userId,
        provider: BREVO_PROVIDER_ID,
        apiKey: validatedApiKey,
        status: 'active',
        connectedAt: currentTimestamp,
        updatedAt: currentTimestamp,
        meta: { senders: verifiedSenders },
      })
      .onConflictDoUpdate({
        target: [userIntegrations.userId, userIntegrations.provider],
        set: {
          apiKey: validatedApiKey,
          status: 'active',
          updatedAt: currentTimestamp,
          meta: { senders: verifiedSenders }, 
        },
      });

    revalidatePath('/integrations');
    revalidatePath('/newsletters'); 
    return { success: true, message: 'Brevo API key saved and validated. Verified senders fetched.' };
  } catch (error) {
    console.error('Database error during saveBrevoApiKey:', error);
    return { success: false, message: 'Database error occurred while saving the Brevo API key. Please check server logs for details.' };
  }
}

export async function disconnectBrevo() {
  const { userId } = await auth();
  if (!userId) return { success: false, message: 'Not authenticated' };

  try {
    const result = await db.update(userIntegrations)
      .set({
        apiKey: null,
        status: 'inactive',
        updatedAt: new Date(),
        meta: null, 
      })
      .where(and(eq(userIntegrations.userId, userId), eq(userIntegrations.provider, BREVO_PROVIDER_ID)))
      .returning();

    if (result.length === 0) {
        console.warn(`No Brevo integration found to disconnect for user ${userId}`);
    }

    revalidatePath('/integrations');
    revalidatePath('/newsletters');
    return { success: true, message: 'Brevo integration disconnected successfully.' };
  } catch (error) {
    console.error('Database error during disconnectBrevo:', error);
    return { success: false, message: 'Database error occurred while disconnecting Brevo. Please check server logs for details.' };
  }
}


// Mailgun Integration Actions
export async function getMailgunIntegrationDetails(): Promise<MailgunIntegrationDetailsType> {
  const { userId } = await auth();
  if (!userId) {
    throw new Error('Not authenticated');
  }

  try {
    const integration = await db.query.userIntegrations.findFirst({
      where: and(eq(userIntegrations.userId, userId), eq(userIntegrations.provider, MAILGUN_PROVIDER_ID)),
    });

    if (!integration) {
      return { connected: false, apiKeySet: false, domain: null, region: null, status: 'inactive' };
    }
    
    const meta = integration.meta as any;
    return {
      connected: integration.status === 'active',
      apiKeySet: !!integration.apiKey,
      maskedApiKey: maskApiKeyDisplay(integration.apiKey),
      domain: meta?.domain || null,
      region: meta?.region || null,
      connectedAt: integration.connectedAt,
      status: integration.status,
    };
  } catch (error) {
    console.error('Failed to fetch Mailgun integration details:', error);
    throw new Error('Could not retrieve Mailgun integration status due to a database error.');
  }
}

export async function saveMailgunCredentials(apiKey: string, domain: string, region: 'us' | 'eu') {
  const { userId } = await auth();
  if (!userId) return { success: false, message: 'Not authenticated' };

  const apiKeyValidation = mailgunApiKeySchema.safeParse(apiKey);
  const domainValidation = mailgunDomainSchema.safeParse(domain);
  const regionValidation = mailgunRegionSchema.safeParse(region);

  if (!apiKeyValidation.success || !domainValidation.success || !regionValidation.success) {
    let errors = {};
    if (!apiKeyValidation.success) errors = {...errors, apiKey: apiKeyValidation.error.flatten().formErrors};
    if (!domainValidation.success) errors = {...errors, domain: domainValidation.error.flatten().formErrors};
    if (!regionValidation.success) errors = {...errors, region: regionValidation.error.flatten().formErrors};
    return { success: false, message: 'Invalid input.', errors };
  }
  
  const validatedApiKey = apiKeyValidation.data;
  const validatedDomain = domainValidation.data;
  const validatedRegion = regionValidation.data;

  try {
    const mg = new Mailgun(formData); 
    const client = mg.client({ 
        username: 'api', 
        key: validatedApiKey,
        url: validatedRegion === 'eu' ? 'https://api.eu.mailgun.net' : 'https://api.mailgun.net' 
    });
    await client.domains.get(validatedDomain); 
  } catch (error: any) {
    console.error("Mailgun API key or domain validation failed:", error.details || error.message);
    let message = "Invalid Mailgun API Key, Domain, or connection issue.";
    if (error.status === 404) {
      message = `Mailgun Error: Domain "${validatedDomain}" not found or API key lacks permission.`;
    } else if (error.details) {
      message = `Mailgun API Error: ${error.details}`;
    } else if (error.message) {
       message = `Mailgun API Error: ${error.message}`;
    }
    return { success: false, message };
  }

  try {
    await db.insert(appUsers)
      .values({ clerkUserId: userId })
      .onConflictDoNothing({ target: appUsers.clerkUserId });

    await db.insert(userIntegrations)
      .values({
        userId,
        provider: MAILGUN_PROVIDER_ID,
        apiKey: validatedApiKey,
        status: 'active',
        connectedAt: new Date(),
        updatedAt: new Date(),
        meta: { domain: validatedDomain, region: validatedRegion },
      })
      .onConflictDoUpdate({
        target: [userIntegrations.userId, userIntegrations.provider],
        set: {
          apiKey: validatedApiKey,
          status: 'active',
          updatedAt: new Date(),
          meta: { domain: validatedDomain, region: validatedRegion },
        },
      });

    revalidatePath('/integrations');
    revalidatePath('/newsletters');
    return { success: true, message: 'Mailgun credentials saved and validated.' };
  } catch (error) {
    console.error('Database error during saveMailgunCredentials:', error);
    return { success: false, message: 'Database error occurred while saving Mailgun credentials.' };
  }
}

export async function disconnectMailgun() {
  const { userId } = await auth();
  if (!userId) return { success: false, message: 'Not authenticated' };

  try {
    await db.update(userIntegrations)
      .set({ apiKey: null, status: 'inactive', meta: null, updatedAt: new Date() })
      .where(and(eq(userIntegrations.userId, userId), eq(userIntegrations.provider, MAILGUN_PROVIDER_ID)));
    
    revalidatePath('/integrations');
    revalidatePath('/newsletters');
    return { success: true, message: 'Mailgun integration disconnected.' };
  } catch (error) {
    console.error('Database error during disconnectMailgun:', error);
    return { success: false, message: 'Database error occurred while disconnecting Mailgun.' };
  }
}

// Amazon SES Integration Actions
export async function getAmazonSESIntegrationDetails(): Promise<AmazonSESIntegrationDetailsType> {
  const { userId } = await auth();
  if (!userId) {
    throw new Error('Not authenticated');
  }

  try {
    const integration = await db.query.userIntegrations.findFirst({
      where: and(eq(userIntegrations.userId, userId), eq(userIntegrations.provider, AMAZON_SES_PROVIDER_ID)),
    });

    if (!integration) {
      return { 
        connected: false, 
        accessKeyIdSet: false, 
        secretAccessKeySet: false, 
        region: null, 
        status: 'inactive',
        verifiedIdentities: []
      };
    }
    
    const meta = integration.meta as any;
    // apiKey stores Access Key ID, secretApiKey stores Secret Access Key
    return {
      connected: integration.status === 'active',
      accessKeyIdSet: !!integration.apiKey, // Access Key ID is stored in apiKey field
      secretAccessKeySet: !!integration.secretApiKey, // Placeholder for check
      maskedAccessKeyId: maskApiKeyDisplay(integration.apiKey),
      region: meta?.region || null,
      connectedAt: integration.connectedAt,
      status: integration.status,
      verifiedIdentities: meta?.verifiedIdentities || []
    };
  } catch (error) {
    console.error('Failed to fetch Amazon SES integration details:', error);
    throw new Error('Could not retrieve Amazon SES integration status due to a database error.');
  }
}

export async function saveAmazonSESCredentials(accessKeyId: string, secretAccessKey: string, region: string) {
  const { userId } = await auth();
  if (!userId) return { success: false, message: 'Not authenticated' };

  const accessKeyIdValidation = awsAccessKeyIdSchema.safeParse(accessKeyId);
  const secretAccessKeyValidation = awsSecretAccessKeySchema.safeParse(secretAccessKey);
  const regionValidation = awsRegionSchema.safeParse(region);

  let errors: any = {};
  if (!accessKeyIdValidation.success) errors.accessKeyId = accessKeyIdValidation.error.flatten().formErrors;
  if (!secretAccessKeyValidation.success) errors.secretAccessKey = secretAccessKeyValidation.error.flatten().formErrors;
  if (!regionValidation.success) errors.region = regionValidation.error.flatten().formErrors;

  if (Object.keys(errors).length > 0) {
    return { success: false, message: 'Invalid input.', errors };
  }
  
  const validatedAccessKeyId = accessKeyIdValidation.data!;
  const validatedSecretAccessKey = secretAccessKeyValidation.data!;
  const validatedRegion = regionValidation.data!;
  let verifiedIdentities: string[] = [];

  try {
    const sesClient = new SESv2Client({
      region: validatedRegion,
      credentials: {
        accessKeyId: validatedAccessKeyId,
        secretAccessKey: validatedSecretAccessKey,
      },
    });
    await sesClient.send(new GetAccountCommand({})); // Basic check if credentials are valid

    // Optionally, fetch verified identities
    const identitiesResponse = await sesClient.send(new ListEmailIdentitiesCommand({})); // Using correct command
    if (identitiesResponse.EmailIdentities) { // Adjusted to EmailIdentities
        verifiedIdentities = identitiesResponse.EmailIdentities
                                .filter(idInfo => idInfo.IdentityName !== undefined)
                                .map(idInfo => idInfo.IdentityName as string);
    }
    // You might also want to list verified DOMAINS if your app supports that.

  } catch (error: any) {
    console.error("AWS SES API validation failed:", error.message || error);
    let message = "Invalid AWS SES credentials or region, or insufficient IAM permissions.";
     if (error.name === 'AccessDeniedException') {
        message = 'AWS SES Error: Access Denied. Check IAM permissions for the provided credentials.';
    } else if (error.message) {
       message = `AWS SES API Error: ${error.message}`;
    }
    return { success: false, message };
  }

  try {
    await db.insert(appUsers)
      .values({ clerkUserId: userId })
      .onConflictDoNothing({ target: appUsers.clerkUserId });

    await db.insert(userIntegrations)
      .values({
        userId,
        provider: AMAZON_SES_PROVIDER_ID,
        apiKey: validatedAccessKeyId, // Store Access Key ID in apiKey
        secretApiKey: validatedSecretAccessKey, // Store Secret Key in new field secretApiKey
        status: 'active',
        connectedAt: new Date(),
        updatedAt: new Date(),
        meta: { region: validatedRegion, verifiedIdentities },
      })
      .onConflictDoUpdate({
        target: [userIntegrations.userId, userIntegrations.provider],
        set: {
          apiKey: validatedAccessKeyId,
          secretApiKey: validatedSecretAccessKey,
          status: 'active',
          updatedAt: new Date(),
          meta: { region: validatedRegion, verifiedIdentities },
        },
      });

    revalidatePath('/integrations');
    revalidatePath('/newsletters');
    return { success: true, message: 'Amazon SES credentials saved and validated. Verified identities fetched.' };
  } catch (error) {
    console.error('Database error during saveAmazonSESCredentials:', error);
    return { success: false, message: 'Database error occurred while saving Amazon SES credentials.' };
  }
}

export async function disconnectAmazonSES() {
  const { userId } = await auth();
  if (!userId) return { success: false, message: 'Not authenticated' };

  try {
    await db.update(userIntegrations)
      .set({ apiKey: null, secretApiKey: null, status: 'inactive', meta: null, updatedAt: new Date() })
      .where(and(eq(userIntegrations.userId, userId), eq(userIntegrations.provider, AMAZON_SES_PROVIDER_ID)));
    
    revalidatePath('/integrations');
    revalidatePath('/newsletters');
    return { success: true, message: 'Amazon SES integration disconnected.' };
  } catch (error) {
    console.error('Database error during disconnectAmazonSES:', error);
    return { success: false, message: 'Database error occurred while disconnecting Amazon SES.' };
  }
}


// API Key Management Actions
const apiKeyNameSchema = z.string().min(1, "API Key name cannot be empty.").max(100, "API Key name is too long.");

export async function listApiKeys() {
  const { userId } = await auth();
  if (!userId) throw new Error("Not authenticated");

  try {
    const keys = await db.select({
      id: apiKeysTable.id,
      name: apiKeysTable.name,
      prefix: apiKeysTable.prefix,
      createdAt: apiKeysTable.createdAt,
      lastUsedAt: apiKeysTable.lastUsedAt,
    })
    .from(apiKeysTable)
    .where(eq(apiKeysTable.userId, userId))
    .orderBy(desc(apiKeysTable.createdAt));
    return keys;
  } catch (error) {
    console.error("Failed to list API keys:", error);
    return [];
  }
}

export async function generateApiKey(name: string): Promise<{ success: boolean; message: string; apiKey?: string, errors?: any }> {
  const { userId } = await auth();
  if (!userId) return { success: false, message: "Not authenticated" };

  const nameValidation = apiKeyNameSchema.safeParse(name);
  if (!nameValidation.success) {
    return { success: false, message: "Validation failed", errors: nameValidation.error.flatten().fieldErrors };
  }

  const apiKey = `plm_${crypto.randomBytes(24).toString('hex')}`; 
  const prefix = apiKey.substring(0, 12); 

  try {
    const salt = await bcrypt.genSalt(10);
    const hashedKey = await bcrypt.hash(apiKey, salt);

    await db.insert(appUsers)
      .values({ clerkUserId: userId })
      .onConflictDoNothing({ target: appUsers.clerkUserId });
      
    await db.insert(apiKeysTable).values({
      userId,
      name: nameValidation.data,
      prefix,
      hashedKey,
    });

    revalidatePath('/integrations');
    return { success: true, message: "API Key generated successfully. Copy it now, it won't be shown again!", apiKey };
  } catch (error) {
    console.error("Failed to generate API key:", error);
    if (error instanceof Error && error.message.includes('duplicate key value violates unique constraint "api_keys_prefix_unique"')) {
       return { success: false, message: "Failed to generate a unique API key prefix. Please try again." };
    }
    return { success: false, message: "Database error occurred while generating API key." };
  }
}

export async function revokeApiKey(apiKeyId: string): Promise<{ success: boolean; message: string }> {
  const { userId } = await auth();
  if (!userId) return { success: false, message: "Not authenticated" };

  try {
    const result = await db.delete(apiKeysTable)
      .where(and(eq(apiKeysTable.id, apiKeyId), eq(apiKeysTable.userId, userId)))
      .returning();

    if (result.length === 0) {
      return { success: false, message: "API Key not found or you do not have permission to revoke it." };
    }
    
    revalidatePath('/integrations');
    return { success: true, message: "API Key revoked successfully." };
  } catch (error) {
    console.error("Failed to revoke API key:", error);
    return { success: false, message: "Database error occurred while revoking API key." };
  }
}

// Helper for API endpoint - Subscriber creation
const AddSubscriberApiSchema = z.object({
  email: z.string().email(),
  name: z.string().optional(),
  status: z.enum(['active', 'unsubscribed', 'pending', 'bounced']).optional().default('active'),
  segmentNames: z.array(z.string()).optional().default([]),
});

export async function addSubscriberFromApi(
  apiUserId: string, 
  data: z.infer<typeof AddSubscriberApiSchema>
): Promise<{ success: boolean; message: string; subscriberId?: string; statusCode: number, errors?: any }> {
  
  const { email, name, status, segmentNames } = data;

  const existingSubscriber = await db.query.subscribers.findFirst({
    where: and(eq(subscribersTable.userId, apiUserId), eq(subscribersTable.email, email)),
  });

  if (existingSubscriber) {
    return { success: false, message: 'Subscriber with this email already exists.', statusCode: 409 };
  }

  let segmentIds: string[] = [];
  if (segmentNames.length > 0) {
    const foundSegments = await db.select({ id: segments.id })
      .from(segments)
      .where(and(eq(segments.userId, apiUserId), inArray(segments.name, segmentNames)));
    segmentIds = foundSegments.map(s => s.id);
    
    if (segmentIds.length !== segmentNames.length) {
      console.warn(`API: Not all segment names resolved to IDs for user ${apiUserId}. Provided: ${segmentNames.join(', ')}, Found IDs for: ${segmentIds.length} segments.`);
    }
  }

  try {
    const [newSubscriber] = await db.insert(subscribersTable).values({
      userId: apiUserId,
      email,
      name: name || null,
      status,
      dateAdded: new Date(),
    }).returning({ 
      id: subscribersTable.id,
      email: subscribersTable.email,
      name: subscribersTable.name,
      status: subscribersTable.status,
      dateAdded: subscribersTable.dateAdded
    });

    if (segmentIds.length > 0 && newSubscriber) {
      const segmentLinks = segmentIds.map(segmentId => ({ subscriberId: newSubscriber.id, segmentId }));
      await db.insert(subscriberSegments).values(segmentLinks).onConflictDoNothing();
    }
    
    // Trigger webhook for new subscriber
    triggerSubscriberCreated(apiUserId, newSubscriber).catch(err => 
      console.error('Failed to trigger subscriber.created webhook:', err)
    );
    
    return { success: true, message: 'Subscriber added successfully.', subscriberId: newSubscriber.id, statusCode: 201 };
  } catch (dbError: any) {
    console.error(`API: Error adding subscriber for user ${apiUserId}:`, dbError);
    return { success: false, message: 'Failed to add subscriber due to a database error.', statusCode: 500 };
  }
}

