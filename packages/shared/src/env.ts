import { z } from 'zod';

// Base environment schema that can be used across all packages
const baseEnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
});

// Web app specific environment schema
export const webEnvSchema = baseEnvSchema.extend({
  // App URLs
  NEXT_PUBLIC_APP_URL: z.string().url().optional(),
  NEXT_PUBLIC_BASE_URL: z.string().url().optional(),
  
  // Clerk Authentication
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: z.string().min(1),
  CLERK_SECRET_KEY: z.string().min(1),
  
  // Paddle Configuration
  PADDLE_API_ENV: z.enum(['sandbox', 'production']).default('sandbox'),
  PADDLE_API_KEY: z.string().optional(),
  NEXT_PUBLIC_PADDLE_CLIENT_TOKEN: z.string().optional(),
  NEXT_PUBLIC_PADDLE_HOSTED_PRICE_ID: z.string().optional(),
  NEXT_PUBLIC_PADDLE_PRO_PRICE_ID: z.string().optional(),
  NEXT_PUBLIC_PADDLE_ENTERPRISE_PRICE_ID: z.string().optional(),
  PADDLE_HOSTED_PRICE_ID: z.string().optional(),
  PADDLE_PRO_PRICE_ID: z.string().optional(),
  PADDLE_ENTERPRISE_PRICE_ID: z.string().optional(),
  PADDLE_WEBHOOK_SECRET: z.string().optional(),
  
  // ImageKit Configuration
  NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY: z.string().optional(),
  IMAGEKIT_PRIVATE_KEY: z.string().optional(),
  NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT: z.string().url().optional(),
  
  // Queue Service
  QUEUE_SERVICE_URL: z.string().url().default('http://localhost:3002'),
  QUEUE_API_KEY: z.string().optional(),
  INTERNAL_API_KEY: z.string().optional(),
  
  // SEO
  GOOGLE_SITE_VERIFICATION: z.string().optional(),
  
  // Security
  UNSUBSCRIBE_TOKEN_SECRET: z.string().default('fallback-secret-change-this'),
});

// Queue service specific environment schema
export const queueEnvSchema = baseEnvSchema.extend({
  // Redis Configuration
  REDIS_URL: z.string().default('redis://localhost:6379'),
  REDIS_HOST: z.string().optional(),
  REDIS_PORT: z.coerce.number().optional(),
  REDIS_PASSWORD: z.string().optional(),
  REDIS_DB: z.coerce.number().optional(),
  
  // Service Configuration
  PORT: z.coerce.number().default(3001),
  QUEUE_PORT: z.coerce.number().default(3002),
  
  // Logging
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).default('info'),
  
  // Worker Configuration
  NEWSLETTER_CONCURRENCY: z.coerce.number().default(2),
  TRANSACTIONAL_CONCURRENCY: z.coerce.number().default(5),
  BULK_CONCURRENCY: z.coerce.number().default(1),
  
  // Job Cleanup Settings
  CLEANUP_COMPLETED_AFTER_MS: z.coerce.number().default(86400000), // 24 hours
  CLEANUP_FAILED_AFTER_MS: z.coerce.number().default(604800000),   // 7 days
  
  // Health Check Settings
  HEALTH_CHECK_INTERVAL_MS: z.coerce.number().default(30000), // 30 seconds
  
  // API Keys
  QUEUE_API_KEY: z.string().min(1),
  INTERNAL_API_KEY: z.string().optional(),
  
  // CORS
  ALLOWED_ORIGINS: z.string().optional(),
  
  // App URLs for unsubscribe links
  APP_URL: z.string().url().optional(),
  NEXT_PUBLIC_APP_URL: z.string().url().optional(),
});

// Utility functions for environment validation
export function validateWebEnv(env: Record<string, string | undefined> = process.env) {
  try {
    return webEnvSchema.parse(env);
  } catch (error) {
    console.error('❌ Invalid web environment variables:', error);
    throw new Error('Invalid environment configuration');
  }
}

// Build-time safe validation that makes runtime-only variables optional
export function validateWebEnvForBuild(env: Record<string, string | undefined> = process.env) {
  // Create a completely build-safe schema by recreating it without required runtime vars
  const buildSafeBaseSchema = z.object({
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
    DATABASE_URL: z.string().optional(), // Optional during build
  });

  const buildSafeSchema = buildSafeBaseSchema.extend({
    // App URLs
    NEXT_PUBLIC_APP_URL: z.string().url().optional(),
    NEXT_PUBLIC_BASE_URL: z.string().url().optional(),
    
    // Clerk Authentication
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: z.string().optional(), // Optional during build
    CLERK_SECRET_KEY: z.string().optional(), // Optional during build
    
    // Paddle Configuration
    PADDLE_API_ENV: z.enum(['sandbox', 'production']).default('sandbox'),
    PADDLE_API_KEY: z.string().optional(),
    NEXT_PUBLIC_PADDLE_CLIENT_TOKEN: z.string().optional(),
    NEXT_PUBLIC_PADDLE_HOSTED_PRICE_ID: z.string().optional(),
    NEXT_PUBLIC_PADDLE_PRO_PRICE_ID: z.string().optional(),
    NEXT_PUBLIC_PADDLE_ENTERPRISE_PRICE_ID: z.string().optional(),
    PADDLE_HOSTED_PRICE_ID: z.string().optional(),
    PADDLE_PRO_PRICE_ID: z.string().optional(),
    PADDLE_ENTERPRISE_PRICE_ID: z.string().optional(),
    PADDLE_WEBHOOK_SECRET: z.string().optional(),
    
    // ImageKit Configuration
    NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY: z.string().optional(),
    IMAGEKIT_PRIVATE_KEY: z.string().optional(),
    NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT: z.string().url().optional(),
    
    // Queue Service
    QUEUE_SERVICE_URL: z.string().url().default('http://localhost:3002'),
    QUEUE_API_KEY: z.string().optional(),
    INTERNAL_API_KEY: z.string().optional(),
    
    // SEO
    GOOGLE_SITE_VERIFICATION: z.string().optional(),
    
    // Security
    UNSUBSCRIBE_TOKEN_SECRET: z.string().default('fallback-secret-change-this'),
  });

  try {
    return buildSafeSchema.parse(env);
  } catch (error) {
    console.error('❌ Invalid web environment variables during build:', error);
    throw new Error('Invalid environment configuration during build');
  }
}

export function validateQueueEnv(env: Record<string, string | undefined> = process.env) {
  try {
    return queueEnvSchema.parse(env);
  } catch (error) {
    console.error('❌ Invalid queue service environment variables:', error);
    throw new Error('Invalid environment configuration');
  }
}

// Export types for TypeScript
export type WebEnv = z.infer<typeof webEnvSchema>;
export type QueueEnv = z.infer<typeof queueEnvSchema>;
export type BaseEnv = z.infer<typeof baseEnvSchema>;
