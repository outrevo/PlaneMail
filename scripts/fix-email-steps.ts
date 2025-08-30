import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { eq } from 'drizzle-orm';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL!,
});

const db = drizzle(pool);

// Define the sequence steps table directly here to avoid import issues
import { pgTable, uuid, text, timestamp, integer, boolean, jsonb } from 'drizzle-orm/pg-core';

const sequenceSteps = pgTable('sequence_steps', {
  id: uuid('id').primaryKey(),
  sequenceId: uuid('sequence_id').notNull(),
  name: text('name').notNull(),
  type: text('type').notNull(),
  order: integer('order').notNull(),
  config: jsonb('config').default({}),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

async function fixEmailSteps() {
  console.log('🔍 Checking email steps configuration...');
  
  // Get all email steps
  const emailSteps = await db.select().from(sequenceSteps).where(eq(sequenceSteps.type, 'email'));
  console.log(`Found ${emailSteps.length} email steps`);
  
  let updatedCount = 0;
  
  for (const step of emailSteps) {
    console.log(`\nStep ID: ${step.id}`);
    console.log(`Current config:`, JSON.stringify(step.config, null, 2));
    
    const config = step.config as any;
    
    // Check if it needs fixing (has subject/content directly in config instead of emailConfig)
    if (config && !config.emailConfig && (config.subject || config.content)) {
      console.log(`❌ Step ${step.id} has invalid email config structure - fixing...`);
      
      const newConfig = {
        emailConfig: {
          subject: config.subject || 'Email Step',
          htmlContent: config.content || '<p>Default email content</p>',
          fromName: 'PlaneMail',
          fromEmail: 'noreply@planemail.io',
          sendingProviderId: null,
          templateId: config.templateId || null,
        }
      };
      
      await db.update(sequenceSteps)
        .set({ 
          config: newConfig, 
          updatedAt: new Date()
        })
        .where(eq(sequenceSteps.id, step.id));
      
      console.log(`✅ Updated step ${step.id} with proper emailConfig structure`);
      updatedCount++;
    } else if (config?.emailConfig) {
      console.log(`✅ Step ${step.id} already has proper emailConfig structure`);
    } else {
      console.log(`⚠️ Step ${step.id} has no email configuration - adding default...`);
      
      const newConfig = {
        emailConfig: {
          subject: 'Default Email Subject',
          htmlContent: '<p>Default email content</p>',
          fromName: 'PlaneMail',
          fromEmail: 'noreply@planemail.io',
          sendingProviderId: null,
          templateId: null,
        }
      };
      
      await db.update(sequenceSteps)
        .set({ 
          config: newConfig, 
          updatedAt: new Date()
        })
        .where(eq(sequenceSteps.id, step.id));
      
      console.log(`✅ Added default emailConfig to step ${step.id}`);
      updatedCount++;
    }
  }
  
  console.log(`\n🎉 Fixed ${updatedCount} email steps out of ${emailSteps.length} total`);
  
  // Verify the fixes
  console.log('\n🔍 Verifying fixes...');
  const verifySteps = await db.select().from(sequenceSteps).where(eq(sequenceSteps.type, 'email'));
  
  for (const step of verifySteps) {
    const config = step.config as any;
    const hasValidConfig = config?.emailConfig && 
                          config.emailConfig.subject && 
                          config.emailConfig.htmlContent;
    
    console.log(`Step ${step.id}: ${hasValidConfig ? '✅ Valid' : '❌ Invalid'} emailConfig`);
  }
}

fixEmailSteps().catch((error) => {
  console.error('❌ Error fixing email steps:', error);
  process.exit(1);
});
