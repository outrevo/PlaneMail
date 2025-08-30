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

// Define table schemas for the script
const sequenceSteps = pgTable('sequence_steps', {
  id: uuid('id').primaryKey(),
  sequenceId: uuid('sequence_id'),
  type: text('type'),
  name: text('name'),
  order: integer('order'),
  config: jsonb('config'),
  createdAt: timestamp('created_at'),
  updatedAt: timestamp('updated_at'),
});

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

async function fixSequenceEmailConfig() {
  console.log('🔧 Fixing sequence email configuration...\n');

  // 1. Get the problematic email step
  const emailStep = await db.select().from(sequenceSteps).where(
    eq(sequenceSteps.id, '411f128f-fe5b-4cf7-8a9e-23b7fabaa46c')
  );

  if (emailStep.length === 0) {
    console.log('❌ Email step not found');
    return;
  }

  console.log('📧 Current email step config:', JSON.stringify(emailStep[0].config, null, 2));

  // 2. Get available email providers
  const providers = await db.select().from(userIntegrations).where(
    eq(userIntegrations.status, 'active')
  );

  if (providers.length === 0) {
    console.log('❌ No active email providers found');
    return;
  }

  console.log('🔌 Available email providers:', providers.map(p => `${p.provider} (${p.id})`));

  // 3. Use the first available provider
  const selectedProvider = providers[0];
  console.log(`✅ Using provider: ${selectedProvider.provider} (${selectedProvider.id})`);

  // 4. Create proper email configuration
  const newConfig = {
    emailConfig: {
      subject: 'Welcome to PlaneMail!',
      content: 'Thank you for subscribing to our newsletter. We\'re excited to have you on board!',
      fromName: 'PlaneMail Team',
      fromEmail: 'hello@planemail.co',
      sendingProviderId: selectedProvider.id
    }
  };

  console.log('🔧 New email step config:', JSON.stringify(newConfig, null, 2));

  // 5. Update the email step configuration
  await db.update(sequenceSteps)
    .set({
      config: newConfig,
      updatedAt: new Date()
    })
    .where(eq(sequenceSteps.id, '411f128f-fe5b-4cf7-8a9e-23b7fabaa46c'));

  console.log('✅ Email step configuration updated successfully!');

  // 6. Verify the update
  const updatedStep = await db.select().from(sequenceSteps).where(
    eq(sequenceSteps.id, '411f128f-fe5b-4cf7-8a9e-23b7fabaa46c')
  );

  console.log('🔍 Updated email step config:', JSON.stringify(updatedStep[0].config, null, 2));

  console.log('\n🎉 Email configuration fix complete!');
  console.log('📝 Next steps:');
  console.log('   1. Check that new sequence enrollments process successfully');
  console.log('   2. Consider re-enrolling the failed subscriber to test email delivery');
  console.log('   3. Update the sequences UI to show real enrollment statistics');
}

fixSequenceEmailConfig()
  .then(() => {
    console.log('✅ Fix completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Error:', error);
    process.exit(1);
  });
