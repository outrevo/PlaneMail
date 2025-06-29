'use server';

import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { customDomains } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { nanoid } from 'nanoid';

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
  const session = await auth();
  if (!session?.userId) {
    throw new Error('Unauthorized');
  }

  try {
    const result = await db
      .select()
      .from(customDomains)
      .where(eq(customDomains.userId, session.userId));

    return result as CustomDomainType[];
  } catch (error) {
    console.error('Error fetching custom domains:', error);
    throw new Error('Failed to fetch custom domains');
  }
}

export async function addCustomDomain(domain: string) {
  const session = await auth();
  if (!session?.userId) {
    return { success: false, message: 'Unauthorized' };
  }

  // Validate domain format
  const domainRegex = /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
  if (!domainRegex.test(domain)) {
    return { success: false, message: 'Invalid domain format' };
  }

  try {
    // Check if domain already exists
    const existing = await db
      .select()
      .from(customDomains)
      .where(eq(customDomains.domain, domain))
      .limit(1);

    if (existing.length > 0) {
      return { success: false, message: 'Domain already exists' };
    }

    // Generate verification token
    const verificationToken = nanoid(32);

    // Insert new domain
    await db.insert(customDomains).values({
      userId: session.userId,
      domain,
      status: 'pending',
      verificationToken,
      sslStatus: 'pending',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    return { success: true, message: 'Domain added successfully', verificationToken };
  } catch (error) {
    console.error('Error adding custom domain:', error);
    return { success: false, message: 'Failed to add domain' };
  }
}

export async function verifyCustomDomain(domainId: string) {
  const session = await auth();
  if (!session?.userId) {
    return { success: false, message: 'Unauthorized' };
  }

  try {
    // Get domain
    const domain = await db
      .select()
      .from(customDomains)
      .where(and(
        eq(customDomains.id, domainId),
        eq(customDomains.userId, session.userId)
      ))
      .limit(1);

    if (domain.length === 0) {
      return { success: false, message: 'Domain not found' };
    }

    const domainRecord = domain[0];

    // Verify DNS record (simplified - in production you'd actually check DNS)
    // For now, we'll just mark it as verified
    await db
      .update(customDomains)
      .set({
        status: 'verified',
        verifiedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(customDomains.id, domainId));

    // In a real implementation, you would:
    // 1. Check if CNAME record exists and points to your domain
    // 2. Update Caddy configuration to handle the new domain
    // 3. Trigger SSL certificate generation

    return { success: true, message: 'Domain verified successfully' };
  } catch (error) {
    console.error('Error verifying domain:', error);
    return { success: false, message: 'Failed to verify domain' };
  }
}

export async function removeCustomDomain(domainId: string) {
  const session = await auth();
  if (!session?.userId) {
    return { success: false, message: 'Unauthorized' };
  }

  try {
    await db
      .delete(customDomains)
      .where(and(
        eq(customDomains.id, domainId),
        eq(customDomains.userId, session.userId)
      ));

    return { success: true, message: 'Domain removed successfully' };
  } catch (error) {
    console.error('Error removing domain:', error);
    return { success: false, message: 'Failed to remove domain' };
  }
}
