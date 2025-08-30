# Schema and Environment Consolidation

This document outlines the consolidation of database schemas and environment variable management across the PlaneMail monorepo.

## 🎯 Problem Solved

Before consolidation, we had:
- **Multiple schema duplications**: 3 different schema files with similar content
- **Scattered environment variables**: `process.env` used directly throughout the codebase
- **Import inconsistencies**: Different files importing from different schema locations
- **No validation**: Environment variables used without proper type checking

## 🏗️ New Architecture

### Single Source of Truth for Database Schema

```
packages/shared/src/database.ts  ← Single source of truth
├── apps/web/src/db/schema.ts   ← Re-exports from shared
└── drizzle.config.ts           ← Points to shared schema
```

### Centralized Environment Management

```
packages/shared/src/env.ts      ← Environment schemas with validation
├── apps/web/src/lib/env.ts     ← Web app environment
└── packages/queue-service/src/env.ts ← Queue service environment
```

## 📁 File Structure

### Core Files

1. **`packages/shared/src/database.ts`**
   - Contains all Drizzle table definitions
   - All table relations
   - Single source of truth for database schema

2. **`packages/shared/src/env.ts`**
   - Zod schemas for environment validation
   - Separate schemas for web app and queue service
   - Type-safe environment variables

3. **`packages/shared/src/index.ts`**
   - Exports all shared modules
   - Clean import paths for consuming packages

### Application-Specific Files

4. **`apps/web/src/lib/env.ts`**
   - Validates web app environment variables
   - Provides helper functions for accessing env vars
   - Type-safe exports

5. **`packages/queue-service/src/env.ts`**
   - Validates queue service environment variables
   - Specific to queue service needs

## 🔧 Usage Examples

### Importing Database Schema

```typescript
// ✅ Recommended: Import from shared package
import { appUsers, posts, subscribers } from '@planemail/shared';

// ✅ Also works: Via web app schema (re-exports from shared)
import { appUsers, posts, subscribers } from '@/db/schema';
```

### Using Environment Variables

```typescript
// ❌ Before: Direct process.env usage
const dbUrl = process.env.DATABASE_URL;

// ✅ After: Type-safe, validated environment
import { env } from '@/lib/env';
const dbUrl = env.DATABASE_URL; // Type-safe and validated
```

### Environment Validation

```typescript
// Web app validation
import { validateWebEnv } from '@planemail/shared';
const env = validateWebEnv(); // Throws if invalid

// Queue service validation  
import { validateQueueEnv } from '@planemail/shared';
const env = validateQueueEnv(); // Throws if invalid
```

## 🛠️ Key Environment Variables

### Web App (`webEnvSchema`)
- `DATABASE_URL` - PostgreSQL connection string
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` - Clerk authentication
- `CLERK_SECRET_KEY` - Clerk server key
- `PADDLE_API_KEY` - Payment processing
- `IMAGEKIT_*` - Image management
- `QUEUE_SERVICE_URL` - Queue service endpoint

### Queue Service (`queueEnvSchema`)
- `DATABASE_URL` - PostgreSQL connection string
- `REDIS_URL` - Redis connection for job queues
- `QUEUE_API_KEY` - API authentication
- `*_CONCURRENCY` - Worker configuration
- `CLEANUP_*_AFTER_MS` - Job cleanup settings

## 🔄 Migration Guide

### For Existing Code

1. **Update imports:**
   ```typescript
   // Change this:
   import { posts } from '@/db/schema';
   
   // To this:
   import { posts } from '@planemail/shared';
   ```

2. **Replace process.env usage:**
   ```typescript
   // Change this:
   const apiKey = process.env.QUEUE_API_KEY;
   
   // To this:
   import { env } from './env';
   const apiKey = env.QUEUE_API_KEY;
   ```

3. **Update database imports:**
   ```typescript
   // Change this:
   import * as schema from '@/db/schema';
   
   // To this:
   import * as schema from '@planemail/shared';
   ```

## ✅ Benefits

1. **Single Source of Truth**: One place to manage database schema
2. **Type Safety**: Environment variables are validated and typed
3. **Better DX**: Clear error messages for missing/invalid env vars
4. **Consistency**: All packages use the same schema and env validation
5. **Maintainability**: Easier to update schema across all packages
6. **Production Safety**: Environment validation prevents runtime errors

## 🚀 Development Workflow

1. **Schema Changes**: Edit only `packages/shared/src/database.ts`
2. **Environment Changes**: Update schemas in `packages/shared/src/env.ts`
3. **Migrations**: Run from root with `npm run db:generate` and `npm run db:migrate`
4. **Type Checking**: `npm run typecheck` validates everything

## 📝 Environment Files

Create these files in your project root:

- `.env.local` - Local development environment
- `.env.example` - Template with all required variables
- `.env.production` - Production environment (not in repo)

## 🔍 Validation Examples

The environment validation will catch issues early:

```typescript
// Missing required variable
DATABASE_URL=undefined // ❌ Throws validation error

// Invalid URL format
NEXT_PUBLIC_APP_URL=not-a-url // ❌ Throws validation error

// Wrong enum value
PADDLE_API_ENV=invalid // ❌ Must be 'sandbox' or 'production'
```

## 🧪 Testing

Environment validation can be tested:

```typescript
import { validateWebEnv } from '@planemail/shared';

// Test with mock environment
const mockEnv = { DATABASE_URL: 'postgres://test' };
expect(() => validateWebEnv(mockEnv)).toThrow();
```

This consolidation provides a robust foundation for managing schemas and environment variables across your entire PlaneMail monorepo.
