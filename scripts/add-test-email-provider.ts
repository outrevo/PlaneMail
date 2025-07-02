#!/usr/bin/env tsx

/**
 * Quick script to add a test email provider configuration
 * Run this script to add a Brevo test configuration for your user
 */

import { db } from '../apps/web/src/lib/drizzle';
import { userIntegrations } from '../apps/web/src/db/schema';
import { eq, and } from 'drizzle-orm';

async function addTestEmailProvider() {
  const userId = 'user_2yNOWFVB4o2arWJhvmjEqYBWGmz'; // Replace with your actual user ID
  const provider = 'brevo';
  const testApiKey = 'test-api-key-123'; // Replace with a real Brevo API key if you have one

  try {
    // Check if integration already exists
    const existing = await db.query.userIntegrations.findFirst({
      where: and(
        eq(userIntegrations.userId, userId),
        eq(userIntegrations.provider, provider)
      ),
    });

    if (existing) {
      // Update existing
      await db.update(userIntegrations)
        .set({
          apiKey: testApiKey,
          status: 'active',
          connectedAt: new Date(),
          updatedAt: new Date(),
          meta: {
            senders: [
              {
                email: 'test@example.com',
                name: 'Test Sender',
                verified: true
              }
            ]
          }
        })
        .where(eq(userIntegrations.id, existing.id));
      
      console.log('✅ Updated existing Brevo integration');
    } else {
      // Create new
      await db.insert(userIntegrations).values({
        userId,
        provider,
        apiKey: testApiKey,
        status: 'active',
        connectedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
        meta: {
          senders: [
            {
              email: 'test@example.com',
              name: 'Test Sender',
              verified: true
            }
          ]
        }
      });
      
      console.log('✅ Created new Brevo integration');
    }

    console.log(`📧 Brevo integration configured for user: ${userId}`);
    console.log('🔧 You can now send real emails using the Brevo provider');
    console.log('💡 To use a real API key, replace "test-api-key-123" with your actual Brevo API key');
    
  } catch (error) {
    console.error('❌ Failed to add test email provider:', error);
  }

  process.exit(0);
}

if (require.main === module) {
  addTestEmailProvider();
}
