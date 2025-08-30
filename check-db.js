const { drizzle } = require('drizzle-orm/node-postgres');
const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

async function checkDatabase() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });
  
  const db = drizzle(pool);
  
  try {
    // Check if marketing_sequences table exists
    const result = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'marketing_sequences'
    `);
    
    console.log('Marketing sequences table exists:', result.rows.length > 0);
    
    if (result.rows.length === 0) {
      console.log('Creating marketing_sequences table...');
      // Run the creation manually
      await pool.query(`
        CREATE TABLE IF NOT EXISTS "marketing_sequences" (
          "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
          "user_id" varchar(255) NOT NULL,
          "clerk_org_id" varchar(255),
          "name" varchar(255) NOT NULL,
          "description" text,
          "status" varchar(50) DEFAULT 'draft' NOT NULL,
          "trigger_type" varchar(50) NOT NULL,
          "trigger_config" jsonb NOT NULL,
          "settings" jsonb NOT NULL,
          "stats" jsonb DEFAULT '{"totalEntered":0,"totalCompleted":0,"totalExited":0,"currentActive":0,"conversionRate":0,"avgCompletionTime":0,"stepStats":[]}' NOT NULL,
          "created_at" timestamp DEFAULT now() NOT NULL,
          "updated_at" timestamp DEFAULT now()
        );
      `);
      console.log('Table created successfully');
    }
    
  } catch (error) {
    console.error('Database error:', error);
  } finally {
    await pool.end();
  }
}

checkDatabase();
