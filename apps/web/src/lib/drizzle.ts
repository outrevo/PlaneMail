
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from '@planemail/shared';
import { env } from './env';

// Allow build to pass without throwing error
if (!env.DATABASE_URL && env.NODE_ENV !== 'production') {
  console.warn('DATABASE_URL environment variable is not set');
}

// Create a dummy connection for build time
const databaseUrl = env.DATABASE_URL || 'postgres://dummy:dummy@localhost:5432/dummy';

// Rely on the DATABASE_URL to contain SSL configuration (e.g., ?sslmode=require for Neon)
// NeonDB connection strings typically include all necessary SSL parameters.
const pool = new Pool({
  connectionString: databaseUrl,
});

export const db = drizzle(pool, { schema });
