import { validateQueueEnv, type QueueEnv } from '@planemail/shared';
import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables from the root .env.local file ONLY
const envPath = resolve(__dirname, '../../../.env.local');
console.log(`🔧 Loading queue service environment from: ${envPath}`);
config({ path: envPath });

// Validate and export environment variables for the queue service
export const env: QueueEnv = validateQueueEnv();

console.log(`✅ Queue service loaded DATABASE_URL: ${env.DATABASE_URL ? 'SET' : 'NOT SET'}`);
console.log(`✅ Queue service loaded REDIS_URL: ${env.REDIS_URL}`);

// Helper function to get a validated environment variable
export function getEnvVar(key: keyof QueueEnv): string | number | undefined {
  return env[key];
}

// Helper function to get a required environment variable
export function getRequiredEnvVar(key: keyof QueueEnv): string | number {
  const value = env[key];
  if (value === undefined || value === null) {
    throw new Error(`Required environment variable ${key} is not set`);
  }
  return value;
}
