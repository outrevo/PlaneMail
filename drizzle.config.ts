
import type { Config } from 'drizzle-kit';
import { validateWebEnv } from '@planemail/shared';

// Load and validate environment variables
const env = validateWebEnv();

export default {
  schema: './packages/shared/src/database.ts',
  out: './drizzle/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: env.DATABASE_URL,
  },
  verbose: true,
  strict: true,
} satisfies Config;
