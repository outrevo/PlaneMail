import { validateWebEnv, validateWebEnvForBuild, type WebEnv } from '@planemail/shared';

// For Next.js, environment variables are automatically loaded from .env.local in the project root
// No need to manually load them as Next.js handles this automatically

// Determine if we're in a build context by checking for common build indicators
const isBuildTime = process.env.NODE_ENV !== 'production' && (
  process.env.NEXT_PHASE === 'phase-production-build' ||
  process.env.CI === 'true' ||
  process.argv.includes('build') ||
  process.argv.includes('next-build')
);

// Validate and export environment variables for the web app
// Use build-safe validation during build time, full validation at runtime
export const env: WebEnv = isBuildTime 
  ? validateWebEnvForBuild() as WebEnv
  : validateWebEnv();

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
