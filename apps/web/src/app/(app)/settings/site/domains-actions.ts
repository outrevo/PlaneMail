'use server';

import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/drizzle';
import { customDomains } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import { verifyDNSRecord, checkDomainAccessibility } from '@/lib/dns-verification';

export interface CustomDomainType {
  id: string;
  domain: string;
  status: 'pending' | 'verified' | 'active' | 'failed';
  verificationToken?: string;
  verifiedAt?: Date;
  sslStatus: 'pending' | 'issued' | 'renewed' | 'failed';
  sslIssuedAt?: Date;
  sslExpiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export async function getCustomDomains(): Promise<CustomDomainType[]> {
  const { userId } = await auth();
  if (!userId) {
    throw new Error('Unauthorized');
  }

  try {
    const result = await db
      .select()
      .from(customDomains)
      .where(eq(customDomains.userId, userId));

    return result as CustomDomainType[];
  } catch (error) {
    console.error('Error fetching custom domains:', error);
    throw new Error('Failed to fetch custom domains');
  }
}

export async function addCustomDomain(domain: string) {
  const { userId } = await auth();
  if (!userId) {
    return { success: false, message: 'Unauthorized' };
  }

  // Validate domain format
  const domainRegex = /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
  if (!domainRegex.test(domain)) {
    return { success: false, message: 'Invalid domain format' };
  }

  try {
    // Check if domain already exists
    const existingDomain = await db
      .select()
      .from(customDomains)
      .where(and(
        eq(customDomains.domain, domain),
        eq(customDomains.userId, userId)
      ))
      .limit(1);

    if (existingDomain.length > 0) {
      return { success: false, message: 'Domain already exists' };
    }

    // Check domain accessibility
    const isAccessible = await checkDomainAccessibility(domain);
    if (!isAccessible) {
      return { 
        success: false, 
        message: 'Domain is not accessible or does not exist' 
      };
    }

    // Generate verification token
    const verificationToken = nanoid(32);

    // Add domain to database
    await db.insert(customDomains).values({
      id: nanoid(),
      userId,
      domain,
      status: 'pending',
      verificationToken,
      sslStatus: 'pending',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    return { 
      success: true, 
      message: 'Domain added successfully. Please verify DNS configuration.',
      verificationToken 
    };
  } catch (error) {
    console.error('Error adding custom domain:', error);
    return { success: false, message: 'Failed to add domain' };
  }
}

export async function verifyCustomDomain(domainId: string) {
  const { userId } = await auth();
  if (!userId) {
    return { success: false, message: 'Unauthorized' };
  }

  try {
    // Get domain from database
    const domain = await db
      .select()
      .from(customDomains)
      .where(and(
        eq(customDomains.id, domainId),
        eq(customDomains.userId, userId)
      ))
      .limit(1);

    if (domain.length === 0) {
      return { success: false, message: 'Domain not found' };
    }

    const domainRecord = domain[0];
    const domainName = domainRecord.domain;

    console.log(`Starting verification for domain: ${domainName}`);

    // Verify DNS CNAME record pointing to your main domain
    const expectedTarget = process.env.NEXT_PUBLIC_APP_DOMAIN || 'your-app.render.com';
    const dnsResult = await verifyDNSRecord(domainName, expectedTarget);
    
    if (!dnsResult.success) {
      await db
        .update(customDomains)
        .set({
          status: 'failed',
          updatedAt: new Date(),
        })
        .where(eq(customDomains.id, domainId));

      return { 
        success: false, 
        message: `DNS verification failed: ${dnsResult.error}` 
      };
    }

    console.log(`DNS verification successful for ${domainName}`);

    // Update domain status to verified
    await db
      .update(customDomains)
      .set({
        status: 'verified',
        verifiedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(customDomains.id, domainId));

    return { 
      success: true, 
      message: 'Domain verified successfully! You can now configure this domain in your Render.com dashboard.' 
    };
  } catch (error) {
    console.error('Error verifying domain:', error);
    
    // Update domain status to failed
    await db
      .update(customDomains)
      .set({
        status: 'failed',
        updatedAt: new Date(),
      })
      .where(eq(customDomains.id, domainId));

    return { success: false, message: 'Failed to verify domain' };
  }
}

export async function removeCustomDomain(domainId: string) {
  const { userId } = await auth();
  if (!userId) {
    return { success: false, message: 'Unauthorized' };
  }

  try {
    // Get domain from database
    const domain = await db
      .select()
      .from(customDomains)
      .where(and(
        eq(customDomains.id, domainId),
        eq(customDomains.userId, userId)
      ))
      .limit(1);

    if (domain.length === 0) {
      return { success: false, message: 'Domain not found' };
    }

    // Remove domain from database
    await db
      .delete(customDomains)
      .where(eq(customDomains.id, domainId));

    return { 
      success: true, 
      message: 'Domain removed successfully. Please also remove it from your Render.com dashboard.' 
    };
  } catch (error) {
    console.error('Error removing domain:', error);
    return { success: false, message: 'Failed to remove domain' };
  }
}
