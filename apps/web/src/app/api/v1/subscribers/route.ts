
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/drizzle';
import { apiKeys, subscribers, segments as segmentsTable } from '@/db/schema';
import { eq, and, inArray } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { addSubscriberFromApi } from '@/app/(app)/integrations/actions'; // Re-use validated logic

const addSubscriberApiSchema = z.object({
  email: z.string().email({ message: "Invalid email address." }),
  name: z.string().max(255).optional(),
  status: z.enum(['active', 'unsubscribed', 'pending', 'bounced']).optional().default('active'),
  segmentNames: z.array(z.string().min(1)).optional().default([]),
});

async function authenticateRequest(req: NextRequest): Promise<string | null> {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  const providedKey = authHeader.substring(7); // Remove "Bearer "

  // Fetch all API keys. In a very high-traffic system, you might optimize this,
  // but for typical use, this is acceptable.
  // A more optimized approach if keys are very numerous might involve a prefix lookup first,
  // then only comparing against keys with that prefix. But bcrypt comparison is fast.
  const allKeys = await db.select().from(apiKeys).execute();
  
  for (const keyRecord of allKeys) {
    const match = await bcrypt.compare(providedKey, keyRecord.hashedKey);
    if (match) {
      // Optionally, update lastUsedAt, but be mindful of write frequency
      // await db.update(apiKeys).set({ lastUsedAt: new Date() }).where(eq(apiKeys.id, keyRecord.id));
      return keyRecord.userId; // Return the userId associated with the valid key
    }
  }
  return null; // No matching key found
}

export async function POST(req: NextRequest) {
  try {
    const authenticatedUserId = await authenticateRequest(req);
    if (!authenticatedUserId) {
      return NextResponse.json({ error: 'Unauthorized: Invalid or missing API key.' }, { status: 401 });
    }

    let rawBody;
    try {
        rawBody = await req.json();
    } catch (e) {
        return NextResponse.json({ error: 'Invalid JSON payload.' }, { status: 400 });
    }
    
    const validationResult = addSubscriberApiSchema.safeParse(rawBody);
    if (!validationResult.success) {
      return NextResponse.json({ error: 'Validation failed.', details: validationResult.error.flatten().fieldErrors }, { status: 400 });
    }

    const { email, name, status, segmentNames } = validationResult.data;

    // Call the refined server action logic for adding subscriber
    const result = await addSubscriberFromApi(authenticatedUserId, { email, name, status, segmentNames });

    if (result.success && result.subscriberId) {
      return NextResponse.json({ message: result.message, subscriberId: result.subscriberId }, { status: result.statusCode });
    } else {
      return NextResponse.json({ error: result.message, details: result.errors }, { status: result.statusCode });
    }

  } catch (error: any) {
    console.error('API Error (/api/v1/subscribers):', error);
    return NextResponse.json({ error: 'An unexpected internal server error occurred.' }, { status: 500 });
  }
}
