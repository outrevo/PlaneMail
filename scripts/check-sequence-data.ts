import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { eq } from 'drizzle-orm';
import dotenv from 'dotenv';
import { pgTable, uuid, text, timestamp, integer, boolean, jsonb, varchar } from 'drizzle-orm/pg-core';

// Load environment variables
dotenv.config({ path: '.env.local' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL!,
});

const db = drizzle(pool);

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

const sequenceEnrollments = pgTable('sequence_enrollments', {
  id: uuid('id').primaryKey(),
  sequenceId: uuid('sequence_id').notNull(),
  subscriberId: uuid('subscriber_id').notNull(),
  status: varchar('status', { length: 50 }).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

const sequenceStepExecutions = pgTable('sequence_step_executions', {
  id: uuid('id').primaryKey(),
  enrollmentId: uuid('enrollment_id').notNull(),
  stepId: uuid('step_id').notNull(),
  status: varchar('status', { length: 50 }).notNull(),
  emailJobId: varchar('email_job_id', { length: 255 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
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

async function checkSequenceData() {
  console.log('🔍 Checking sequence data...\n');

  const targetSequenceId = '46ee2e5a-6ccd-44ed-a495-23c29f28f5fd';

  // 1. Check sequence steps
  console.log('📧 SEQUENCE STEPS:');
  const steps = await db.select().from(sequenceSteps).where(eq(sequenceSteps.sequenceId, targetSequenceId));
  console.log(`Found ${steps.length} steps for sequence ${targetSequenceId}`);
  
  steps.forEach((step, index) => {
    console.log(`\n  Step ${index + 1}:`);
    console.log(`    ID: ${step.id}`);
    console.log(`    Type: ${step.type}`);
    console.log(`    Name: ${step.name}`);
    console.log(`    Order: ${step.order}`);
    console.log(`    Config:`, JSON.stringify(step.config, null, 6));
    
    // Check if email config is valid
    if (step.type === 'email') {
      const config = step.config as any;
      const hasValidConfig = config?.emailConfig && 
                            config.emailConfig.subject && 
                            (config.emailConfig.content || config.emailConfig.htmlContent) &&
                            config.emailConfig.sendingProviderId;
      console.log(`    ✅ Valid email config: ${hasValidConfig ? 'YES' : 'NO'}`);
      
      if (config?.emailConfig?.sendingProviderId) {
        console.log(`    📧 Email provider: ${config.emailConfig.sendingProviderId}`);
      } else {
        console.log(`    ⚠️  No email provider configured`);
      }
    }
  });

  // 2. Check enrollments
  console.log('\n\n👥 SEQUENCE ENROLLMENTS:');
  const enrollments = await db.select().from(sequenceEnrollments).where(eq(sequenceEnrollments.sequenceId, targetSequenceId));
  console.log(`Found ${enrollments.length} enrollments for sequence ${targetSequenceId}`);
  
  enrollments.forEach((enrollment, index) => {
    console.log(`\n  Enrollment ${index + 1}:`);
    console.log(`    ID: ${enrollment.id}`);
    console.log(`    Subscriber: ${enrollment.subscriberId}`);
    console.log(`    Status: ${enrollment.status}`);
    console.log(`    Created: ${enrollment.createdAt}`);
  });

  // 3. Check step executions
  console.log('\n\n⚡ STEP EXECUTIONS:');
  const executions = await db.select().from(sequenceStepExecutions);
  const relevantExecutions = executions.filter(exec => 
    enrollments.some(enroll => enroll.id === exec.enrollmentId)
  );
  
  console.log(`Found ${relevantExecutions.length} step executions for this sequence`);
  
  relevantExecutions.forEach((execution, index) => {
    console.log(`\n  Execution ${index + 1}:`);
    console.log(`    ID: ${execution.id}`);
    console.log(`    Enrollment: ${execution.enrollmentId}`);
    console.log(`    Step: ${execution.stepId}`);
    console.log(`    Status: ${execution.status}`);
    console.log(`    Email Job ID: ${execution.emailJobId}`);
    console.log(`    Created: ${execution.createdAt}`);
  });

  // 4. Check email providers/integrations
  console.log('\n\n🔌 EMAIL PROVIDERS/INTEGRATIONS:');
  let emailIntegrations: any[] = [];
  try {
    emailIntegrations = await db.select().from(userIntegrations);
    console.log(`Found ${emailIntegrations.length} integrations`);
    
    emailIntegrations.forEach((integration, index) => {
      console.log(`\n  Integration ${index + 1}:`);
      console.log(`    ID: ${integration.id}`);
      console.log(`    Provider: ${integration.provider}`);
      console.log(`    Status: ${integration.status}`);
      console.log(`    Config keys:`, integration.config ? Object.keys(integration.config as any) : 'none');
    });
  } catch (error) {
    console.log('⚠️  Integrations table does not exist - this might be expected');
    console.log('   Email provider configuration might be stored elsewhere');
  }

  // 5. Statistics Summary
  console.log('\n\n📊 SUMMARY:');
  console.log(`Total steps: ${steps.length}`);
  console.log(`Email steps: ${steps.filter(s => s.type === 'email').length}`);
  console.log(`Valid email steps: ${steps.filter(s => {
    if (s.type !== 'email') return false;
    const config = s.config as any;
    return config?.emailConfig && 
           config.emailConfig.subject && 
           (config.emailConfig.content || config.emailConfig.htmlContent) &&
           config.emailConfig.sendingProviderId;
  }).length}`);
  console.log(`Total enrollments: ${enrollments.length}`);
  console.log(`Active enrollments: ${enrollments.filter(e => e.status === 'active').length}`);
  console.log(`Total executions: ${relevantExecutions.length}`);
  console.log(`Successful executions: ${relevantExecutions.filter(e => e.status === 'completed').length}`);
  console.log(`Failed executions: ${relevantExecutions.filter(e => e.status === 'failed').length}`);
  console.log(`Email providers configured: ${emailIntegrations.filter(i => i.status === 'active').length}`);

  // 6. Recommendations
  console.log('\n\n💡 RECOMMENDATIONS:');
  
  const emailStepsWithoutProvider = steps.filter(s => {
    if (s.type !== 'email') return false;
    const config = s.config as any;
    return !config?.emailConfig?.sendingProviderId || config.emailConfig.sendingProviderId === null;
  });
  
  if (emailStepsWithoutProvider.length > 0) {
    console.log(`❌ ${emailStepsWithoutProvider.length} email steps have no provider configured`);
    console.log('   → Edit your sequence and select an email provider for each email step');
  }
  
  if (emailIntegrations.filter(i => i.status === 'active').length === 0) {
    console.log('❌ No active email providers found');
    console.log('   → Go to /integrations and configure an email provider (Brevo, Mailgun, etc.)');
  }
  
  if (enrollments.length === 0) {
    console.log('❌ No enrollments found');
    console.log('   → Make sure your sequence is set to "active" status');
    console.log('   → Check that your trigger conditions are met (e.g., new subscribers)');
  }
  
  const failedExecutions = relevantExecutions.filter(e => e.status === 'failed');
  if (failedExecutions.length > 0) {
    console.log(`❌ ${failedExecutions.length} step executions failed`);
    console.log('   → Check the queue service logs for error details');
  }
}

checkSequenceData().catch((error) => {
  console.error('❌ Error checking sequence data:', error);
  process.exit(1);
}).finally(() => {
  pool.end();
});
