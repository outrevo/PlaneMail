import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { eq } from 'drizzle-orm';
import dotenv from 'dotenv';
import { pgTable, uuid, text, timestamp, integer, boolean, jsonb, varchar } from 'drizzle-orm/pg-core';

// Load environment variables
dotenv.config({ path: '.env.local' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const db = drizzle(pool);

const userIntegrations = pgTable('user_integrations', {
  id: uuid('id').primaryKey(),
  userId: varchar('user_id'),
  provider: varchar('provider'),
  apiKey: text('api_key'),
  secretApiKey: text('secret_api_key'),
  status: varchar('status'),
  meta: jsonb('meta'),
  connectedAt: timestamp('connected_at'),
  createdAt: timestamp('created_at'),
  updatedAt: timestamp('updated_at'),
  clerkOrgId: varchar('clerk_org_id'),
});

async function configureBrevoProvider() {
  console.log('🔧 Configuring Brevo email provider...\n');

  const providerId = 'c1249d8a-de0f-49b9-abbd-306437a4091b';

  // Check current state
  const provider = await db.select().from(userIntegrations).where(eq(userIntegrations.id, providerId));
  
  if (provider.length === 0) {
    console.log('❌ Provider not found');
    return;
  }

  console.log('📋 Current provider state:');
  console.log(`  ID: ${provider[0].id}`);
  console.log(`  Provider: ${provider[0].provider}`);
  console.log(`  Status: ${provider[0].status}`);
  console.log(`  API Key: ${provider[0].apiKey ? 'SET' : 'NOT SET'}`);
  console.log(`  Meta: ${provider[0].meta ? JSON.stringify(provider[0].meta) : 'null'}`);

  // For testing purposes, let's use a placeholder API key
  // In production, you would get this from your Brevo account
  const testApiKey = 'test-brevo-api-key-placeholder';
  
  console.log('\n🔑 Updating Brevo provider with API configuration...');

  await db.update(userIntegrations)
    .set({
      apiKey: testApiKey,
      meta: {
        provider: 'brevo',
        apiVersion: 'v3',
        configuredAt: new Date().toISOString(),
        features: ['transactional', 'newsletters']
      },
      connectedAt: new Date(),
      updatedAt: new Date()
    })
    .where(eq(userIntegrations.id, providerId));

  console.log('✅ Provider configuration updated!');

  // Verify the update
  const updatedProvider = await db.select().from(userIntegrations).where(eq(userIntegrations.id, providerId));
  
  console.log('\n📋 Updated provider state:');
  console.log(`  ID: ${updatedProvider[0].id}`);
  console.log(`  Provider: ${updatedProvider[0].provider}`);
  console.log(`  Status: ${updatedProvider[0].status}`);
  console.log(`  API Key: ${updatedProvider[0].apiKey ? 'SET' : 'NOT SET'}`);
  console.log(`  Meta:`, JSON.stringify(updatedProvider[0].meta, null, 2));

  console.log('\n🎉 Brevo provider is now configured!');
  console.log('\n📝 Next steps:');
  console.log('   1. Replace the test API key with your real Brevo API key');
  console.log('   2. Get your API key from: https://app.brevo.com/settings/keys/api');
  console.log('   3. The sequence should now send emails successfully');
  console.log('   4. Test by adding a new subscriber to the sequence');
}

configureBrevoProvider()
  .then(() => {
    console.log('✅ Configuration completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Error:', error);
    process.exit(1);
  });
