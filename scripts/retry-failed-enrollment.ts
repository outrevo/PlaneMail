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

// Define table schemas
const sequenceStepExecutions = pgTable('sequence_step_executions', {
  id: uuid('id').primaryKey(),
  enrollmentId: uuid('enrollment_id').notNull(),
  stepId: uuid('step_id').notNull(),
  status: varchar('status', { length: 50 }).notNull(),
  emailJobId: varchar('email_job_id', { length: 255 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

const sequenceEnrollments = pgTable('sequence_enrollments', {
  id: uuid('id').primaryKey(),
  sequenceId: uuid('sequence_id').notNull(),
  subscriberId: uuid('subscriber_id').notNull(),
  status: varchar('status', { length: 50 }).notNull(),
  currentStepId: uuid('current_step_id'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

async function retryFailedEnrollment() {
  console.log('🔄 Retrying failed enrollment...\n');

  const failedExecutionId = '68e5a042-d7a0-4908-ab2a-59687c0aafa2';
  const enrollmentId = 'fdb3ff5d-c6ea-4a05-9f56-f6885dd63963';
  const stepId = '411f128f-fe5b-4cf7-8a9e-23b7fabaa46c';

  // 1. Delete the failed execution
  console.log('🗑️  Deleting failed execution...');
  await db.delete(sequenceStepExecutions)
    .where(eq(sequenceStepExecutions.id, failedExecutionId));
  
  console.log('✅ Failed execution deleted');

  // 2. Reset the enrollment to retry the step
  console.log('🔄 Resetting enrollment to retry step...');
  await db.update(sequenceEnrollments)
    .set({
      currentStepId: stepId,
      status: 'active',
      updatedAt: new Date()
    })
    .where(eq(sequenceEnrollments.id, enrollmentId));

  console.log('✅ Enrollment reset to retry the email step');

  console.log('\n🎉 Retry setup complete!');
  console.log('📝 Next steps:');
  console.log('   1. The queue service should pick up this enrollment and process the email step');
  console.log('   2. Check your email inbox for the welcome message');
  console.log('   3. Monitor the sequence_step_executions table for the new execution record');
  
  console.log('\n💡 If emails still don\'t arrive, check:');
  console.log('   - Brevo API credentials are valid and have sending permissions');
  console.log('   - The sender email (hello@planemail.co) is verified in Brevo');
  console.log('   - Check spam/junk folder');
  console.log('   - Queue service logs for any API errors');
}

retryFailedEnrollment()
  .then(() => {
    console.log('✅ Retry completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Error:', error);
    process.exit(1);
  });
