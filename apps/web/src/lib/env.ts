import { validateWebEnv, validateWebEnvForBuild, type WebEnv } from '@planemail/shared';

// For Next.js, environment variables are automatically loaded from .env.local in the project root
// No need to manually load them as Next.js handles this automatically

// Determine if we're in a build context
const isBuildTime = (
  // Next.js build phase
  process.env.NEXT_PHASE === 'phase-production-build' ||
  // CI environment
  process.env.CI === 'true' ||
  // Vercel build
  process.env.VERCEL === '1' ||
  // Command line arguments indicating build
  process.argv.some(arg => arg.includes('build')) ||
  // No DATABASE_URL during build (common scenario)
  (!process.env.DATABASE_URL && process.env.NODE_ENV !== 'development')
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
