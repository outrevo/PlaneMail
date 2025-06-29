'use server';

import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { publicSiteSettings } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export interface SiteSettingsType {
  siteName: string;
  siteDescription: string;
  baseUrl: string;
  logoUrl: string | null;
  favicon: string | null;
  primaryColor: string;
  headerEnabled: boolean;
  headerContent: string | null;
  footerEnabled: boolean;
  footerContent: string | null;
  enableNewsletterSignup: boolean;
  customCss: string | null;
  customJs: string | null;
  analyticsCode: string | null;
}

export async function getSiteSettings(): Promise<SiteSettingsType> {
  const session = await auth();
  if (!session?.userId) {
    throw new Error('Unauthorized');
  }

  try {
    const result = await db
      .select()
      .from(publicSiteSettings)
      .where(eq(publicSiteSettings.userId, session.userId))
      .limit(1);

    if (result.length === 0) {
      // Return default settings
      return {
        siteName: 'PlaneMail',
        siteDescription: 'Email marketing and newsletter platform',
        baseUrl: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
        logoUrl: null,
        favicon: null,
        primaryColor: '#1e40af',
        headerEnabled: true,
        headerContent: null,
        footerEnabled: true,
        footerContent: null,
        enableNewsletterSignup: true,
        customCss: null,
        customJs: null,
        analyticsCode: null,
      };
    }

    return result[0] as SiteSettingsType;
  } catch (error) {
    console.error('Error fetching site settings:', error);
    throw new Error('Failed to fetch site settings');
  }
}

export async function updateSiteSettings(settings: SiteSettingsType) {
  const session = await auth();
  if (!session?.userId) {
    return { success: false, message: 'Unauthorized' };
  }

  try {
    // Check if settings exist
    const existing = await db
      .select()
      .from(publicSiteSettings)
      .where(eq(publicSiteSettings.userId, session.userId))
      .limit(1);

    const settingsData = {
      userId: session.userId,
      ...settings,
      updatedAt: new Date(),
    };

    if (existing.length === 0) {
      // Insert new settings
      await db.insert(publicSiteSettings).values({
        ...settingsData,
        createdAt: new Date(),
      });
    } else {
      // Update existing settings
      await db
        .update(publicSiteSettings)
        .set(settingsData)
        .where(eq(publicSiteSettings.userId, session.userId));
    }

    return { success: true, message: 'Site settings updated successfully' };
  } catch (error) {
    console.error('Error updating site settings:', error);
    return { success: false, message: 'Failed to update site settings' };
  }
}
