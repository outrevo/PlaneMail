'use server';

import { db } from '@/lib/drizzle';
import { subscribers, segments, subscriberSegments, marketingSequences, sequenceEnrollments } from '@/db/schema';
import { auth } from '@clerk/nextjs/server';
import { eq, and, desc, inArray, like, or, sql } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { enrollSubscriberInSequences, bulkEnrollSubscribersInSequences } from '@/lib/subscriber-utils';

const subscriberSchema = z.object({
  email: z.string().email({ message: 'Invalid email address.' }),
  name: z.string().max(255).optional(),
  status: z.enum(['active', 'unsubscribed', 'pending', 'bounced']).default('active'),
  segmentIds: z.array(z.string().uuid()).optional().default([]),
});

export async function getSubscribers(searchTerm?: string, page = 1, limit = 50, statusFilter?: string) {
  const { userId } = await auth();
  if (!userId) throw new Error('Not authenticated');

  try {
    const offset = (page - 1) * limit;
    
    // Build where conditions
    const whereConditions = [eq(subscribers.userId, userId)];
    
    if (searchTerm) {
      whereConditions.push(
        or(
          subscribers.name ? like(subscribers.name, `%${searchTerm}%`) : undefined,
          like(subscribers.email, `%${searchTerm}%`)
        ) as any
      );
    }
    
    if (statusFilter && statusFilter !== 'all') {
      whereConditions.push(eq(subscribers.status, statusFilter as any));
    }

    const [userSubscribers, totalCount] = await Promise.all([
      db.query.subscribers.findMany({
        where: and(...whereConditions),
        orderBy: [desc(subscribers.dateAdded)],
        limit,
        offset,
        with: {
          subscriberSegments: {
            with: {
              segment: {
                columns: { id: true, name: true }
              }
            }
          }
        }
      }),
      db.select({ count: sql<number>`count(*)` }).from(subscribers).where(and(...whereConditions))
    ]);

    const subscribersWithSegments = userSubscribers.map(sub => ({
      ...sub,
      segments: sub.subscriberSegments.map(ss => ss.segment)
    }));

    return {
      subscribers: subscribersWithSegments,
      totalCount: totalCount[0]?.count || 0,
      totalPages: Math.ceil((totalCount[0]?.count || 0) / limit),
      currentPage: page,
      hasNextPage: page < Math.ceil((totalCount[0]?.count || 0) / limit),
      hasPrevPage: page > 1
    };

  } catch (error) {
    console.error('Failed to fetch subscribers:', error);
    return {
      subscribers: [],
      totalCount: 0,
      totalPages: 0,
      currentPage: 1,
      hasNextPage: false,
      hasPrevPage: false
    };
  }
}


export async function addSubscriber(formData: FormData) {
  const { userId } = await auth();
  if (!userId) return { success: false, message: 'Not authenticated', errors: null };

  const rawSegmentIds = formData.getAll('segmentIds[]'); 
  
  const validatedFields = subscriberSchema.safeParse({
    email: formData.get('email'),
    name: formData.get('name') || undefined,
    status: formData.get('status') || 'active',
    segmentIds: rawSegmentIds.filter(id => typeof id === 'string' && id.length > 0) as string[],
  });

  if (!validatedFields.success) {
    return { success: false, message: 'Validation failed.', errors: validatedFields.error.flatten().fieldErrors };
  }

  const { email, name, status, segmentIds } = validatedFields.data;

  try {
    const existing = await db.select().from(subscribers).where(and(eq(subscribers.userId, userId), eq(subscribers.email, email))).limit(1);
    if (existing.length > 0) {
      return { success: false, message: 'Subscriber with this email already exists for your account.', errors: { email: ['Email already exists.'] }};
    }

    const [newSubscriber] = await db.insert(subscribers).values({
      userId,
      email,
      name: name || null, // Ensure null if empty/undefined
      status,
      dateAdded: new Date(),
    }).returning();

    if (segmentIds && segmentIds.length > 0) {
      const segmentLinks = segmentIds.map(segmentId => ({ subscriberId: newSubscriber.id, segmentId }));
      await db.insert(subscriberSegments).values(segmentLinks).onConflictDoNothing();
    }

    // Automatic sequence enrollment for new subscribers
    await enrollSubscriberInSequences(newSubscriber.id, userId, segmentIds);

    revalidatePath('/subscribers');
    return { success: true, message: 'Subscriber added successfully.', subscriber: newSubscriber };
  } catch (error) {
    console.error('Failed to add subscriber:', error);
    return { success: false, message: 'Database error occurred.', errors: null };
  }
}

export async function updateSubscriber(id: string, formData: FormData) {
  const { userId } = await auth();
  if (!userId) return { success: false, message: 'Not authenticated', errors: null };

  const existing = await db.query.subscribers.findFirst({ where: and(eq(subscribers.id, id), eq(subscribers.userId, userId))});
  if (!existing) return { success: false, message: 'Subscriber not found or unauthorized.' };

  const rawSegmentIds = formData.getAll('segmentIds[]');
  const validatedFields = subscriberSchema.safeParse({
    email: formData.get('email') || existing.email,
    name: formData.get('name') || existing.name,
    status: formData.get('status') || existing.status,
    segmentIds: rawSegmentIds.filter(id => typeof id === 'string' && id.length > 0) as string[],
  });
  
  if (!validatedFields.success) {
    return { success: false, message: 'Validation failed.', errors: validatedFields.error.flatten().fieldErrors };
  }
  const { email, name, status, segmentIds } = validatedFields.data;

  if (email !== existing.email) {
    const conflictingSubscriber = await db.select().from(subscribers)
      .where(and(eq(subscribers.userId, userId), eq(subscribers.email, email), eq(subscribers.id, id))) 
      .limit(1);
    if (conflictingSubscriber.length > 0 && conflictingSubscriber[0].id !== id) {
       return { success: false, message: 'Another subscriber with this email already exists.', errors: { email: ['Email already in use.'] }};
    }
  }

  try {
    const [updatedSubscriber] = await db.update(subscribers)
      .set({ email, name: name || null, status, updatedAt: new Date() })
      .where(and(eq(subscribers.id, id), eq(subscribers.userId, userId)))
      .returning();

    await db.delete(subscriberSegments).where(eq(subscriberSegments.subscriberId, id));
    if (segmentIds && segmentIds.length > 0) {
      const segmentLinks = segmentIds.map(segmentId => ({ subscriberId: id, segmentId }));
      await db.insert(subscriberSegments).values(segmentLinks).onConflictDoNothing();
    }
    
    revalidatePath('/subscribers');
    return { success: true, message: 'Subscriber updated successfully.', subscriber: updatedSubscriber };
  } catch (error) {
    console.error('Failed to update subscriber:', error);
    return { success: false, message: 'Database error occurred.', errors: null };
  }
}

export async function deleteSubscriber(id: string) {
  const { userId } = await auth();
  if (!userId) return { success: false, message: 'Not authenticated' };

  try {
    // Remove from segments first
    await db.delete(subscriberSegments).where(eq(subscriberSegments.subscriberId, id)); 
    
    // Remove from sequence enrollments (this will cascade to step executions)
    await db.delete(sequenceEnrollments).where(eq(sequenceEnrollments.subscriberId, id));
    
    // Finally delete the subscriber
    await db.delete(subscribers).where(and(eq(subscribers.id, id), eq(subscribers.userId, userId)));
    
    revalidatePath('/subscribers');
    return { success: true, message: 'Subscriber deleted successfully.' };
  } catch (error) {
    console.error('Failed to delete subscriber:', error);
    return { success: false, message: 'Failed to delete subscriber.' };
  }
}

export async function bulkDeleteSubscribers(subscriberIds: string[]) {
  const { userId } = await auth();
  if (!userId) return { success: false, message: 'Not authenticated' };

  if (!subscriberIds || subscriberIds.length === 0) {
    return { success: false, message: 'No subscribers selected for deletion.' };
  }

  try {
    // Delete segment associations first
    await db.delete(subscriberSegments).where(inArray(subscriberSegments.subscriberId, subscriberIds));
    
    // Remove from sequence enrollments (this will cascade to step executions)
    await db.delete(sequenceEnrollments).where(inArray(sequenceEnrollments.subscriberId, subscriberIds));
    
    // Delete subscribers (only those belonging to the user)
    const result = await db.delete(subscribers).where(
      and(
        inArray(subscribers.id, subscriberIds),
        eq(subscribers.userId, userId)
      )
    );

    revalidatePath('/subscribers');
    return { 
      success: true, 
      message: `Successfully deleted ${subscriberIds.length} subscriber(s).`,
      deletedCount: subscriberIds.length
    };
  } catch (error) {
    console.error('Failed to bulk delete subscribers:', error);
    return { success: false, message: 'Failed to delete subscribers.' };
  }
}

const segmentSchema = z.object({
  name: z.string().min(1, { message: 'Segment name is required.' }).max(255),
  description: z.string().optional(),
});

export async function getSegments() {
  const { userId } = await auth();
  if (!userId) throw new Error('Not authenticated');
  try {
    return await db.select().from(segments).where(eq(segments.userId, userId)).orderBy(desc(segments.createdAt));
  } catch (error) {
    console.error('Failed to fetch segments:', error);
    return [];
  }
}

export async function createSegment(formData: FormData) {
  const { userId } = await auth();
  if (!userId) return { success: false, message: 'Not authenticated', errors: null };

  const validatedFields = segmentSchema.safeParse({
    name: formData.get('name'),
    description: formData.get('description'),
  });

  if (!validatedFields.success) {
    return { success: false, message: 'Validation failed.', errors: validatedFields.error.flatten().fieldErrors };
  }
  const { name, description } = validatedFields.data;

  try {
    const [newSegment] = await db.insert(segments).values({ userId, name, description: description || null }).returning();
    revalidatePath('/subscribers'); 
    return { success: true, message: 'Segment created.', segment: newSegment };
  } catch (error) {
    console.error('Failed to create segment:', error);
    return { success: false, message: 'Database error.', errors: null };
  }
}

export type SubscriberImportData = {
  email: string;
  name?: string | null;
  status?: 'active' | 'unsubscribed' | 'pending' | 'bounced';
};

export type ImportSubscribersResult = {
  success: boolean;
  message: string;
  addedCount: number;
  updatedCount: number;
  failedCount: number;
  errors?: { rowIndex: number, email?: string, error: string }[];
};

const VALID_STATUSES_ARRAY = ['active', 'unsubscribed', 'pending', 'bounced'];

export async function bulkAddSubscribers(
  subscribersToImport: SubscriberImportData[],
  rawSegmentIdsToApply?: string[] | null
): Promise<ImportSubscribersResult> {
  const { userId } = await auth();
  if (!userId) {
    return { success: false, message: 'Not authenticated', addedCount: 0, updatedCount: 0, failedCount: subscribersToImport?.length || 0 };
  }

  if (!subscribersToImport || subscribersToImport.length === 0) {
    return { success: true, message: 'No subscribers to import.', addedCount: 0, updatedCount: 0, failedCount: 0 };
  }

  // Validate chunk size - reject overly large chunks
  if (subscribersToImport.length > 500) {
    return { 
      success: false, 
      message: `Chunk too large (${subscribersToImport.length} subscribers). Please use smaller chunks (max 500).`,
      addedCount: 0, 
      updatedCount: 0, 
      failedCount: subscribersToImport.length 
    };
  }
  
  const segmentIdsToApply = rawSegmentIdsToApply || [];
  const failedImports: ImportSubscribersResult['errors'] = [];

  const validSubscribersForDb = subscribersToImport
    .map((sub, index) => {
      if (!sub || typeof sub !== 'object') {
        failedImports.push({ rowIndex: index, error: 'Invalid data format for row (not an object).' });
        return null;
      }
      const emailValidation = z.string().email({ message: 'Invalid email format.' }).safeParse(sub.email);
      if (!emailValidation.success) {
        failedImports.push({ rowIndex: index, email: sub.email, error: emailValidation.error.flatten().formErrors.join(', ') || 'Invalid email format.' });
        return null;
      }

      const normalizedStatus = sub.status?.toLowerCase() || '';
      const finalStatus = VALID_STATUSES_ARRAY.includes(normalizedStatus) ? normalizedStatus : 'active';
      
      return {
        email: emailValidation.data.toLowerCase(),
        name: sub.name || null,
        status: finalStatus as typeof subscribers.$inferInsert.status,
        userId,
        dateAdded: new Date(),
        updatedAt: new Date(),
      };
    })
    .filter(Boolean) as (Omit<typeof subscribers.$inferInsert, 'id' | 'createdAt'>)[];


  if (validSubscribersForDb.length === 0) {
    return { 
      success: false, 
      message: 'No valid subscribers to import after validation.', 
      addedCount: 0, 
      updatedCount: 0, 
      failedCount: failedImports.length, 
      errors: failedImports.length > 0 ? failedImports : undefined,
    };
  }
  
  let addedCount = 0;
  let updatedCount = 0;

  try {
    // Determine which emails in the batch already exist for this user
    const emailsInBatch = validSubscribersForDb.map(sub => sub.email);
    const existingDbSubscribers = await db.select({ email: subscribers.email })
       .from(subscribers)
       .where(and(eq(subscribers.userId, userId), inArray(subscribers.email, emailsInBatch)));
    const existingEmailsSet = new Set(existingDbSubscribers.map(s => s.email));

    const result = await db.insert(subscribers)
      .values(validSubscribersForDb)
      .onConflictDoUpdate({
        target: [subscribers.userId, subscribers.email],
        set: {
          name: sql`excluded.name`,
          status: sql`excluded.status`,
          updatedAt: sql`excluded.updated_at`,
        },
      })
      .returning({ id: subscribers.id, email: subscribers.email }); // No longer returning xmax

    const processedSubscriberIds: string[] = [];
    result.forEach(row => {
       if (existingEmailsSet.has(row.email)) { 
           updatedCount++;
       } else {
           addedCount++;
       }
       processedSubscriberIds.push(row.id);
    });
    
    if (segmentIdsToApply && segmentIdsToApply.length > 0 && processedSubscriberIds.length > 0) {
      const segmentLinks = processedSubscriberIds.flatMap(subscriberId =>
        segmentIdsToApply.map(segmentId => ({ subscriberId, segmentId }))
      );
      if (segmentLinks.length > 0) {
        await db.insert(subscriberSegments).values(segmentLinks).onConflictDoNothing();
      }
    }

    // Automatic sequence enrollment for newly added subscribers
    if (addedCount > 0) {
      const newlyAddedSubscriberData = result
        .filter(row => !existingEmailsSet.has(row.email))
        .map(row => ({
          subscriberId: row.id,
          segmentIds: segmentIdsToApply || []
        }));
      
      // Use optimized bulk enrollment
      if (newlyAddedSubscriberData.length > 0) {
        await bulkEnrollSubscribersInSequences(newlyAddedSubscriberData, userId);
      }
    }

    revalidatePath('/subscribers');
    return {
      success: true,
      message: `Import complete. Added: ${addedCount}, Updated: ${updatedCount}, Failed: ${failedImports.length}.`,
      addedCount,
      updatedCount,
      failedCount: failedImports.length,
      errors: failedImports.length > 0 ? failedImports : undefined,
    };

  } catch (error: unknown) {
    console.error('Failed to bulk add subscribers:', error);
    let errorMessage = 'Unknown database error';
    
    if (error instanceof Error) {
      errorMessage = error.message;
      // Check for specific database errors
      if (error.message.includes('timeout')) {
        errorMessage = 'Database operation timed out. Try importing smaller batches.';
      } else if (error.message.includes('connection')) {
        errorMessage = 'Database connection error. Please try again.';
      } else if (error.message.includes('constraint')) {
        errorMessage = 'Data constraint violation. Check for duplicate emails or invalid data.';
      }
    } else if (typeof error === 'string') {
      errorMessage = error;
    }
    
    const finalErrorMessage = errorMessage.startsWith('Database error: ') ? errorMessage : `Database error: ${errorMessage}`;
    
    failedImports.push({rowIndex: -1, error: finalErrorMessage}); // Use -1 for general DB error
    return { 
      success: false, 
      message: finalErrorMessage, 
      addedCount, 
      updatedCount, 
      failedCount: subscribersToImport.length,
      errors: failedImports
    };
  }
}

export async function getSubscribersBySegments(segmentIds?: string[]) {
  const { userId } = await auth();
  if (!userId) throw new Error('Not authenticated');

  try {
    if (!segmentIds || segmentIds.length === 0) {
      // If no segments specified, get all active subscribers
      const allSubscribers = await db.query.subscribers.findMany({
        where: and(
          eq(subscribers.userId, userId),
          eq(subscribers.status, 'active')
        ),
        columns: {
          id: true,
          email: true,
          name: true,
        }
      });

      return allSubscribers.map(sub => ({
        email: sub.email,
        name: sub.name || sub.email.split('@')[0], // Fallback to email prefix if no name
        metadata: { subscriberId: sub.id },
      }));
    }

    // Get subscribers that belong to specified segments
    const subscribersInSegments = await db
      .select({
        id: subscribers.id,
        email: subscribers.email,
        name: subscribers.name,
      })
      .from(subscribers)
      .innerJoin(subscriberSegments, eq(subscribers.id, subscriberSegments.subscriberId))
      .where(and(
        eq(subscribers.userId, userId),
        eq(subscribers.status, 'active'),
        inArray(subscriberSegments.segmentId, segmentIds)
      ))
      .groupBy(subscribers.id, subscribers.email, subscribers.name); // Remove duplicates

    return subscribersInSegments.map(sub => ({
      email: sub.email,
      name: sub.name || sub.email.split('@')[0], // Fallback to email prefix if no name
      metadata: { subscriberId: sub.id },
    }));

  } catch (error) {
    console.error('Failed to fetch subscribers by segments:', error);
    throw new Error('Failed to fetch subscribers');
  }
}

export async function getAllSubscriberIds(searchTerm?: string, statusFilter?: string) {
  const { userId } = await auth();
  if (!userId) throw new Error('Not authenticated');

  try {
    // Build where conditions (same as pagination query)
    const whereConditions = [eq(subscribers.userId, userId)];
    
    if (searchTerm) {
      whereConditions.push(
        or(
          subscribers.name ? like(subscribers.name, `%${searchTerm}%`) : undefined,
          like(subscribers.email, `%${searchTerm}%`)
        ) as any
      );
    }
    
    if (statusFilter && statusFilter !== 'all') {
      whereConditions.push(eq(subscribers.status, statusFilter as any));
    }

    const allSubscriberIds = await db.select({ id: subscribers.id })
      .from(subscribers)
      .where(and(...whereConditions));

    return allSubscriberIds.map(sub => sub.id);
  } catch (error) {
    console.error('Failed to fetch all subscriber IDs:', error);
    return [];
  }
}
