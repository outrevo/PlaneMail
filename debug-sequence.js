import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from '@planemail/shared';
import { eq } from 'drizzle-orm';
import { config } from 'dotenv';

// Load environment variables
config({ path: '/Volumes/PortableSSD/Projects/PlaneMail/.env.local' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const db = drizzle(pool, { schema });

async function checkSequenceData() {
  try {
    const sequenceId = '46ee2e5a-6ccd-44ed-a495-23c29f28f5fd';
    
    console.log('🔍 Checking sequence:', sequenceId);
    
    // Check sequence exists
    const sequences = await db
      .select()
      .from(schema.marketingSequences)
      .where(eq(schema.marketingSequences.id, sequenceId));
    
    console.log('📊 Found sequences:', sequences.length);
    if (sequences.length > 0) {
      console.log('📋 Sequence data:', {
        id: sequences[0].id,
        name: sequences[0].name,
        status: sequences[0].status,
        triggerConfig: sequences[0].triggerConfig
      });
    }
    
    // Check steps
    const steps = await db
      .select()
      .from(schema.sequenceSteps)
      .where(eq(schema.sequenceSteps.sequenceId, sequenceId));
    
    console.log('📊 Found steps:', steps.length);
    steps.forEach((step, index) => {
      console.log(`Step ${index + 1}:`, {
        id: step.id,
        name: step.name,
        type: step.type,
        order: step.order,
        isActive: step.isActive
      });
    });
    
    // Check enrollments
    const enrollments = await db
      .select()
      .from(schema.sequenceEnrollments)
      .where(eq(schema.sequenceEnrollments.sequenceId, sequenceId));
    
    console.log('📊 Found enrollments:', enrollments.length);
    enrollments.forEach((enrollment, index) => {
      console.log(`Enrollment ${index + 1}:`, {
        id: enrollment.id,
        subscriberId: enrollment.subscriberId,
        status: enrollment.status,
        enrolledAt: enrollment.enrolledAt
      });
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await pool.end();
  }
}

checkSequenceData();
