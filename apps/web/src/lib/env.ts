import { validateWebEnv, type WebEnv } from '@planemail/shared';

// For Next.js, environment variables are automatically loaded from .env.local in the project root
// No need to manually load them as Next.js handles this automatically

// Validate and export environment variables for the web app
export const env: WebEnv = validateWebEnv();

// Helper function to get a validated environment variable
export function getEnvVar(key: keyof WebEnv): string | undefined {
  return env[key] as string | undefined;
}

// Helper function to get a required environment variable
export function getRequiredEnvVar(key: keyof WebEnv): string {
  const value = env[key] as string | undefined;
  if (!value) {
    throw new Error(`Required environment variable ${key} is not set`);
  }
  return value;
}
