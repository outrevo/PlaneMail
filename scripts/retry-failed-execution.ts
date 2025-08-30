import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { eq, and } from 'drizzle-orm';
import dotenv from 'dotenv';
import { pgTable, uuid, text, timestamp, integer, boolean, jsonb, varchar } from 'drizzle-orm/pg-core';

// Load environment variables
dotenv.config({ path: '.env.local' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const db = drizzle(pool);

// Define table schemas for the script
const sequenceEnrollments = pgTable('sequence_enrollments', {
  id: uuid('id').primaryKey(),
  sequenceId: uuid('sequence_id'),
  subscriberId: uuid('subscriber_id'),
  status: text('status'),
  currentStepId: uuid('current_step_id'),
  createdAt: timestamp('created_at'),
  updatedAt: timestamp('updated_at'),
});

const sequenceStepExecutions = pgTable('sequence_step_executions', {
  id: uuid('id').primaryKey(),
  enrollmentId: uuid('enrollment_id'),
  stepId: uuid('step_id'),
  status: text('status'),
  emailJobId: uuid('email_job_id'),
  executedAt: timestamp('executed_at'),
  scheduledAt: timestamp('scheduled_at'),
  createdAt: timestamp('created_at'),
  updatedAt: timestamp('updated_at'),
});

async function retryFailedExecution() {
  console.log('🔄 Retrying failed sequence execution...\n');

  const enrollmentId = 'fdb3ff5d-c6ea-4a05-9f56-f6885dd63963';
  const stepId = '411f128f-fe5b-4cf7-8a9e-23b7fabaa46c';

  // 1. Delete the failed execution record
  const deleteResult = await db.delete(sequenceStepExecutions)
    .where(
      and(
        eq(sequenceStepExecutions.enrollmentId, enrollmentId),
        eq(sequenceStepExecutions.stepId, stepId),
        eq(sequenceStepExecutions.status, 'failed')
      )
    );

  console.log('🗑️  Deleted failed execution record');

  // 2. Reset the enrollment's current step
  await db.update(sequenceEnrollments)
    .set({
      currentStepId: stepId,
      status: 'active',
      updatedAt: new Date()
    })
    .where(eq(sequenceEnrollments.id, enrollmentId));

  console.log('✅ Reset enrollment to retry from the email step');

  console.log('\n🎯 Next steps:');
  console.log('   1. The sequence processor should pick up this enrollment again');
  console.log('   2. Since the email step now has proper configuration, it should succeed');
  console.log('   3. You should receive the welcome email shortly');
  console.log('   4. Check the queue service logs to monitor the retry');

  // 3. Show current state
  const enrollment = await db.select().from(sequenceEnrollments).where(eq(sequenceEnrollments.id, enrollmentId));
  console.log('\n📊 Updated enrollment status:', enrollment[0]);
}

retryFailedExecution()
  .then(() => {
    console.log('\n✅ Retry setup completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Error:', error);
    process.exit(1);
  });
