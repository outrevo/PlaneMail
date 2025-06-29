import { LRUCache } from 'lru-cache';
import { NextRequest } from 'next/server';
import { db } from '@/lib/drizzle';
import { apiKeys } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import * as bcrypt from 'bcryptjs';

// In-memory cache for API key lookups with 1 hour TTL
const apiKeyCache = new LRUCache<string, { userId: string; expiresAt: Date | null }>({
  max: 10000, // Cache up to 10k API keys
  ttl: 1000 * 60 * 60, // 1 hour TTL
});

// Rate limiting cache (key -> { count, resetTime })
const rateLimitCache = new LRUCache<string, { count: number; resetTime: number }>({
  max: 50000, // Track rate limits for 50k API keys
  ttl: 1000 * 60 * 15, // 15 minute windows
});

interface AuthResult {
  userId: string | null;
  error?: string;
  rateLimited?: boolean;
}

/**
 * Optimized API key authentication for millions of users
 * 
 * Performance optimizations:
 * 1. Prefix-based lookup to reduce database queries
 * 2. In-memory caching to avoid repeated database hits
 * 3. Rate limiting to prevent abuse
 * 4. Early validation to fail fast on invalid formats
 * 5. Efficient bcrypt comparisons
 */
export async function authenticateApiKey(req: NextRequest): Promise<AuthResult> {
  const authHeader = req.headers.get('Authorization');
  
  // Early validation - fail fast for invalid headers
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { userId: null, error: 'Missing or invalid Authorization header' };
  }

  const providedKey = authHeader.substring(7).trim();
  
  // Validate API key format (should be prefix_randompart, e.g., "pk_live_abc123...")
  if (!providedKey.includes('_') || providedKey.length < 20) {
    return { userId: null, error: 'Invalid API key format' };
  }

  const keyPrefix = providedKey.split('_')[0] + '_' + providedKey.split('_')[1];
  
  // Check cache first for performance
  const cached = apiKeyCache.get(providedKey);
  if (cached) {
    // Check if cached key is expired
    if (cached.expiresAt && cached.expiresAt < new Date()) {
      apiKeyCache.delete(providedKey);
      return { userId: null, error: 'API key has expired' };
    }
    
    // Check rate limiting
    const rateLimitResult = checkRateLimit(providedKey);
    if (rateLimitResult.rateLimited) {
      return { userId: null, rateLimited: true, error: 'Rate limit exceeded' };
    }
    
    return { userId: cached.userId };
  }

  try {
    // Optimized database query - use prefix to filter candidates
    // This reduces the number of records we need to check significantly
    const candidateKeys = await db
      .select({
        id: apiKeys.id,
        userId: apiKeys.userId,
        hashedKey: apiKeys.hashedKey,
        expiresAt: apiKeys.expiresAt,
        prefix: apiKeys.prefix
      })
      .from(apiKeys)
      .where(eq(apiKeys.prefix, keyPrefix))
      .limit(10); // Limit to prevent abuse scenarios

    // No candidates found with this prefix
    if (candidateKeys.length === 0) {
      return { userId: null, error: 'Invalid API key' };
    }

    // Check each candidate key with the same prefix
    for (const keyRecord of candidateKeys) {
      // Check expiration before expensive bcrypt operation
      if (keyRecord.expiresAt && keyRecord.expiresAt < new Date()) {
        continue; // Skip expired keys
      }

      // Perform bcrypt comparison
      const isMatch = await bcrypt.compare(providedKey, keyRecord.hashedKey);
      if (isMatch) {
        // Cache the valid key for future requests
        apiKeyCache.set(providedKey, {
          userId: keyRecord.userId,
          expiresAt: keyRecord.expiresAt
        });

        // Check rate limiting
        const rateLimitResult = checkRateLimit(providedKey);
        if (rateLimitResult.rateLimited) {
          return { userId: null, rateLimited: true, error: 'Rate limit exceeded' };
        }

        // Optionally update lastUsedAt in background (don't block the request)
        updateLastUsedAt(keyRecord.id).catch(err => 
          console.error('Failed to update lastUsedAt:', err)
        );

        return { userId: keyRecord.userId };
      }
    }

    return { userId: null, error: 'Invalid API key' };

  } catch (error) {
    console.error('API key authentication error:', error);
    return { userId: null, error: 'Authentication service temporarily unavailable' };
  }
}

/**
 * Check rate limiting for API key
 * Default: 1000 requests per 15 minutes per API key
 */
function checkRateLimit(apiKey: string, limit: number = 1000): { rateLimited: boolean; remaining: number } {
  const now = Date.now();
  const windowMs = 15 * 60 * 1000; // 15 minutes
  
  let rateLimitData = rateLimitCache.get(apiKey);
  
  if (!rateLimitData || now > rateLimitData.resetTime) {
    // New window or expired window
    rateLimitData = {
      count: 1,
      resetTime: now + windowMs
    };
    rateLimitCache.set(apiKey, rateLimitData);
    return { rateLimited: false, remaining: limit - 1 };
  }
  
  if (rateLimitData.count >= limit) {
    return { rateLimited: true, remaining: 0 };
  }
  
  // Increment counter
  rateLimitData.count++;
  rateLimitCache.set(apiKey, rateLimitData);
  
  return { rateLimited: false, remaining: limit - rateLimitData.count };
}

/**
 * Update lastUsedAt timestamp in background (non-blocking)
 */
async function updateLastUsedAt(keyId: string): Promise<void> {
  try {
    await db
      .update(apiKeys)
      .set({ lastUsedAt: new Date() })
      .where(eq(apiKeys.id, keyId));
  } catch (error) {
    // Log but don't throw - this shouldn't block the API response
    console.error('Failed to update API key lastUsedAt:', error);
  }
}

/**
 * Clear cache entry (useful for key revocation)
 */
export function invalidateApiKeyCache(apiKey: string): void {
  apiKeyCache.delete(apiKey);
  rateLimitCache.delete(apiKey);
}

/**
 * Get cache statistics for monitoring
 */
export function getApiKeyCacheStats() {
  return {
    apiKeyCache: {
      size: apiKeyCache.size,
      calculatedSize: apiKeyCache.calculatedSize,
    },
    rateLimitCache: {
      size: rateLimitCache.size,
      calculatedSize: rateLimitCache.calculatedSize,
    }
  };
}
