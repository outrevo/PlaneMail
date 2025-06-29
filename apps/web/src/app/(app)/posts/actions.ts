'use server';

import { db } from '@/lib/drizzle';
import { posts, segments as dbSegments, userIntegrations, postSegments } from '@/db/schema';
import { auth } from '@clerk/nextjs/server';
import { eq, and, desc, inArray } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { 
    getBrevoIntegrationDetails, 
    getMailgunIntegrationDetails, 
    getAmazonSESIntegrationDetails,
    type BrevoIntegrationDetailsType, 
    type MailgunIntegrationDetailsType,
    type AmazonSESIntegrationDetailsType
} from '../integrations/actions';
import { queueClient } from '@/lib/queue-client';
import { EmailJobData } from '@planemail/shared'; 

// Post creation/update schema
const postSchema = z.object({
  title: z.string().min(1, { message: 'Title is required.' }).max(255),
  content: z.string().optional(),
  excerpt: z.string().optional(),
  slug: z.string().optional().refine((slug) => {
    if (!slug) return true; // Allow empty slug for drafts
    return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug);
  }, { 
    message: 'Slug must be lowercase letters, numbers, and hyphens only' 
  }),
  
  // Email settings
  emailSubject: z.string().max(255).optional(),
  fromName: z.string().max(255).optional(),
  fromEmail: z.string().email().optional(),
  
  // Web settings
  webEnabled: z.boolean().default(false),
  seoTitle: z.string().max(255).optional(),
  seoDescription: z.string().optional(),
  
  // Publishing
  status: z.enum(['draft', 'published', 'scheduled', 'sent']).default('draft'),
  segmentIds: z.array(z.string().uuid()).optional(),
  sendingProviderId: z.enum(['brevo', 'mailgun', 'amazon_ses']).optional(),
});

// Post email sending schema
const postEmailSchema = z.object({
  postId: z.string().uuid(),
  emailSubject: z.string().min(1, { message: 'Email subject is required.' }).max(255),
  fromName: z.string().min(1, { message: 'From Name is required.'}).max(255),
  fromEmail: z.string().email({ message: 'Valid From Email is required.'}),
  segmentIds: z.array(z.string().uuid()).optional(),
  sendingProviderId: z.enum(['brevo', 'mailgun', 'amazon_ses'], { required_error: 'Sending provider must be selected.'}),
});

export type PostPageDataType = {
  segments: Pick<typeof dbSegments.$inferSelect, 'id' | 'name'>[];
  brevoIntegration: BrevoIntegrationDetailsType;
  mailgunIntegration: MailgunIntegrationDetailsType;
  amazonSESIntegration: AmazonSESIntegrationDetailsType;
};

export type PostType = typeof posts.$inferSelect;

export type PostWithSegments = PostType & {
  segments: Pick<typeof dbSegments.$inferSelect, 'id' | 'name'>[];
};

export async function getPostPageData(): Promise<PostPageDataType> {
  const { userId } = await auth();
  if (!userId) {
    throw new Error('Not authenticated');
  }
  
  try {
    const userSegments = await db.select({ id: dbSegments.id, name: dbSegments.name })
      .from(dbSegments)
      .where(eq(dbSegments.userId, userId))
      .orderBy(desc(dbSegments.name));
      
    const allSubscribersSegment = { id: 'all', name: 'All Subscribers' };

    const [brevoDetails, mailgunDetails, amazonSESDetails] = await Promise.all([
        getBrevoIntegrationDetails(),
        getMailgunIntegrationDetails(),
        getAmazonSESIntegrationDetails() 
    ]);

    return { 
      segments: [allSubscribersSegment, ...userSegments],
      brevoIntegration: brevoDetails,
      mailgunIntegration: mailgunDetails,
      amazonSESIntegration: amazonSESDetails,
    };
  } catch (error) {
    console.error('Failed to fetch post page data:', error);
    return { 
      segments: [],
      brevoIntegration: { connected: false, apiKeySet: false, status: 'inactive', senders: [] },
      mailgunIntegration: { connected: false, apiKeySet: false, status: 'inactive', domain: null, region: null },
      amazonSESIntegration: { connected: false, accessKeyIdSet: false, secretAccessKeySet: false, region: null, status: 'inactive', verifiedIdentities: [] },
    };
  }
}

export async function createPost(formDataObj: FormData) {
  const { userId } = await auth();
  if (!userId) return { success: false, message: 'Not authenticated', errors: null };

  const segmentIdsString = formDataObj.get('segmentIds') as string;
  const segmentIds = segmentIdsString ? segmentIdsString.split(',').filter(id => id !== 'all') : [];

  const validatedFields = postSchema.safeParse({
    title: formDataObj.get('title'),
    content: formDataObj.get('content'),
    excerpt: formDataObj.get('excerpt'),
    slug: formDataObj.get('slug'),
    emailSubject: formDataObj.get('emailSubject'),
    fromName: formDataObj.get('fromName'),
    fromEmail: formDataObj.get('fromEmail'),
    webEnabled: formDataObj.get('webEnabled') === 'true',
    seoTitle: formDataObj.get('seoTitle'),
    seoDescription: formDataObj.get('seoDescription'),
    status: formDataObj.get('status') as 'draft' | 'published' | 'scheduled' | 'sent',
    segmentIds: segmentIds,
    sendingProviderId: formDataObj.get('sendingProviderId') as 'brevo' | 'mailgun' | 'amazon_ses',
  });

  if (!validatedFields.success) {
    return { 
      success: false, 
      message: 'Validation failed', 
      errors: validatedFields.error.flatten().fieldErrors 
    };
  }

  try {
    const { segmentIds: validatedSegmentIds, ...postData } = validatedFields.data;
    
    // Auto-generate slug if not provided for drafts
    if (!postData.slug && postData.title) {
      postData.slug = postData.title
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim();
    }

    // Check for slug uniqueness if slug is provided
    if (postData.slug) {
      const existingPost = await db.select({ id: posts.id })
        .from(posts)
        .where(and(
          eq(posts.userId, userId),
          eq(posts.slug, postData.slug)
        ))
        .limit(1);

      if (existingPost.length > 0) {
        return { 
          success: false, 
          message: 'A post with this slug already exists', 
          errors: { slug: ['Slug must be unique'] }
        };
      }
    }

    // Create the post
    const [newPost] = await db.insert(posts).values({
      ...postData,
      userId,
      slug: postData.slug || '', // Ensure slug is never undefined
    }).returning();

    // Add segment associations if any
    if (validatedSegmentIds && validatedSegmentIds.length > 0) {
      await db.insert(postSegments).values(
        validatedSegmentIds.map(segmentId => ({
          postId: newPost.id,
          segmentId,
        }))
      );
    }

    revalidatePath('/posts');
    return { 
      success: true, 
      message: 'Post created successfully',
      postId: newPost.id,
      errors: null 
    };
  } catch (error) {
    console.error('Failed to create post:', error);
    return { 
      success: false, 
      message: 'Failed to create post. Please try again.', 
      errors: null 
    };
  }
}

export async function updatePost(postId: string, formDataObj: FormData) {
  const { userId } = await auth();
  if (!userId) return { success: false, message: 'Not authenticated', errors: null };

  const segmentIdsString = formDataObj.get('segmentIds') as string;
  const segmentIds = segmentIdsString ? segmentIdsString.split(',').filter(id => id !== 'all') : [];

  const validatedFields = postSchema.safeParse({
    title: formDataObj.get('title'),
    content: formDataObj.get('content'),
    excerpt: formDataObj.get('excerpt'),
    slug: formDataObj.get('slug'),
    emailSubject: formDataObj.get('emailSubject'),
    fromName: formDataObj.get('fromName'),
    fromEmail: formDataObj.get('fromEmail'),
    webEnabled: formDataObj.get('webEnabled') === 'true',
    seoTitle: formDataObj.get('seoTitle'),
    seoDescription: formDataObj.get('seoDescription'),
    status: formDataObj.get('status') as 'draft' | 'published' | 'scheduled' | 'sent',
    segmentIds: segmentIds,
    sendingProviderId: formDataObj.get('sendingProviderId') as 'brevo' | 'mailgun' | 'amazon_ses',
  });

  if (!validatedFields.success) {
    return { 
      success: false, 
      message: 'Validation failed', 
      errors: validatedFields.error.flatten().fieldErrors 
    };
  }

  try {
    const { segmentIds: validatedSegmentIds, ...postData } = validatedFields.data;
    
    // Check if post exists and belongs to user
    const existingPost = await db.select({ id: posts.id, slug: posts.slug })
      .from(posts)
      .where(and(
        eq(posts.id, postId),
        eq(posts.userId, userId)
      ))
      .limit(1);

    if (existingPost.length === 0) {
      return { 
        success: false, 
        message: 'Post not found', 
        errors: null
      };
    }

    // Auto-generate slug if not provided for drafts
    if (!postData.slug && postData.title) {
      postData.slug = postData.title
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim();
    }

    // Check for slug uniqueness if slug changed
    if (postData.slug && postData.slug !== existingPost[0].slug) {
      const conflictingPost = await db.select({ id: posts.id })
        .from(posts)
        .where(and(
          eq(posts.userId, userId),
          eq(posts.slug, postData.slug)
        ))
        .limit(1);

      if (conflictingPost.length > 0) {
        return { 
          success: false, 
          message: 'A post with this slug already exists', 
          errors: { slug: ['Slug must be unique'] }
        };
      }
    }

    // Update the post
    await db.update(posts)
      .set({
        ...postData,
        slug: postData.slug || existingPost[0].slug, // Keep existing slug if not provided
        updatedAt: new Date(),
      })
      .where(and(
        eq(posts.id, postId),
        eq(posts.userId, userId)
      ));

    // Update segment associations
    // Remove existing associations
    await db.delete(postSegments)
      .where(eq(postSegments.postId, postId));

    // Add new associations if any
    if (validatedSegmentIds && validatedSegmentIds.length > 0) {
      await db.insert(postSegments).values(
        validatedSegmentIds.map(segmentId => ({
          postId,
          segmentId,
        }))
      );
    }

    revalidatePath('/posts');
    revalidatePath(`/posts/${postId}`);
    return { 
      success: true, 
      message: 'Post updated successfully',
      errors: null 
    };
  } catch (error) {
    console.error('Failed to update post:', error);
    return { 
      success: false, 
      message: 'Failed to update post. Please try again.', 
      errors: null 
    };
  }
}

export async function getUserPosts(): Promise<PostWithSegments[]> {
  const { userId } = await auth();
  if (!userId) {
    throw new Error('Not authenticated');
  }

  try {
    const userPosts = await db.select({
      id: posts.id,
      userId: posts.userId,
      title: posts.title,
      content: posts.content,
      excerpt: posts.excerpt,
      slug: posts.slug,
      status: posts.status,
      publishedAt: posts.publishedAt,
      emailSubject: posts.emailSubject,
      fromName: posts.fromName,
      fromEmail: posts.fromEmail,
      sentAt: posts.sentAt,
      recipientCount: posts.recipientCount,
      sendingProviderId: posts.sendingProviderId,
      providerMessageId: posts.providerMessageId,
      webEnabled: posts.webEnabled,
      webPublishedAt: posts.webPublishedAt,
      seoTitle: posts.seoTitle,
      seoDescription: posts.seoDescription,
      totalOpens: posts.totalOpens,
      uniqueOpens: posts.uniqueOpens,
      totalClicks: posts.totalClicks,
      uniqueClicks: posts.uniqueClicks,
      totalBounces: posts.totalBounces,
      webViews: posts.webViews,
      firstOpenedAt: posts.firstOpenedAt,
      lastOpenedAt: posts.lastOpenedAt,
      createdAt: posts.createdAt,
      updatedAt: posts.updatedAt,
    })
    .from(posts)
    .where(eq(posts.userId, userId))
    .orderBy(desc(posts.createdAt));

    // Get segments for each post
    const postsWithSegments: PostWithSegments[] = [];
    
    for (const post of userPosts) {
      const postSegmentData = await db.select({
        segmentId: postSegments.segmentId,
        segmentName: dbSegments.name,
      })
      .from(postSegments)
      .innerJoin(dbSegments, eq(postSegments.segmentId, dbSegments.id))
      .where(eq(postSegments.postId, post.id));

      postsWithSegments.push({
        ...post,
        segments: postSegmentData.map(ps => ({
          id: ps.segmentId,
          name: ps.segmentName,
        })),
      });
    }

    return postsWithSegments;
  } catch (error) {
    console.error('Failed to fetch user posts:', error);
    return [];
  }
}

export async function getPostById(postId: string): Promise<PostWithSegments | null> {
  const { userId } = await auth();
  if (!userId) {
    throw new Error('Not authenticated');
  }

  try {
    const [post] = await db.select()
      .from(posts)
      .where(and(
        eq(posts.id, postId),
        eq(posts.userId, userId)
      ))
      .limit(1);

    if (!post) {
      return null;
    }

    // Get segments for the post
    const postSegmentData = await db.select({
      segmentId: postSegments.segmentId,
      segmentName: dbSegments.name,
    })
    .from(postSegments)
    .innerJoin(dbSegments, eq(postSegments.segmentId, dbSegments.id))
    .where(eq(postSegments.postId, post.id));

    return {
      ...post,
      segments: postSegmentData.map(ps => ({
        id: ps.segmentId,
        name: ps.segmentName,
      })),
    };
  } catch (error) {
    console.error('Failed to fetch post:', error);
    return null;
  }
}

export async function sendPostAsEmail(formDataObj: FormData) {
  const { userId } = await auth();
  if (!userId) return { success: false, message: 'Not authenticated', errors: null };

  const segmentIdsString = formDataObj.get('segmentIds') as string;
  const segmentIds = segmentIdsString ? segmentIdsString.split(',').filter(id => id !== 'all') : [];

  const validatedFields = postEmailSchema.safeParse({
    postId: formDataObj.get('postId'),
    emailSubject: formDataObj.get('emailSubject'),
    fromName: formDataObj.get('fromName'),
    fromEmail: formDataObj.get('fromEmail'),
    segmentIds: segmentIds,
    sendingProviderId: formDataObj.get('sendingProviderId') as 'brevo' | 'mailgun' | 'amazon_ses',
  });

  if (!validatedFields.success) {
    return { 
      success: false, 
      message: 'Validation failed', 
      errors: validatedFields.error.flatten().fieldErrors 
    };
  }

  const { postId, emailSubject, fromName, fromEmail, segmentIds: validatedSegmentIds, sendingProviderId } = validatedFields.data;

  try {
    // Get the post
    const post = await getPostById(postId);
    if (!post) {
      return { 
        success: false, 
        message: 'Post not found', 
        errors: null 
      };
    }

    // Update post with email details
    await db.update(posts)
      .set({
        emailSubject,
        fromName,
        fromEmail,
        sendingProviderId,
        status: 'sent',
        sentAt: new Date(),
        updatedAt: new Date(),
      })
      .where(and(
        eq(posts.id, postId),
        eq(posts.userId, userId)
      ));

    // Update segment associations for email
    if (validatedSegmentIds && validatedSegmentIds.length > 0) {
      // Remove existing associations
      await db.delete(postSegments)
        .where(eq(postSegments.postId, postId));

      // Add new associations
      await db.insert(postSegments).values(
        validatedSegmentIds.map(segmentId => ({
          postId,
          segmentId,
        }))
      );
    }

    // For now, we'll use the existing newsletter job structure
    // TODO: Update queue service to handle posts directly
    const emailJobData: EmailJobData = {
      id: postId,
      userId,
      newsletterId: postId, // Using postId for backwards compatibility with queue
      subject: emailSubject,
      fromName,
      fromEmail,
      htmlContent: post.content || '',
      sendingProviderId,
      recipients: [], // Will be populated by the queue service based on segments
      providerConfig: {}, // Will be populated by the queue service
      priority: 1,
      attempts: 0,
      createdAt: new Date(),
    };

    const jobResult = await queueClient.addNewsletterJob(emailJobData);
    
    if (!jobResult.success) {
      return { 
        success: false, 
        message: jobResult.message || 'Failed to queue email job', 
        errors: null 
      };
    }

    revalidatePath('/posts');
    revalidatePath(`/posts/${postId}`);
    return { 
      success: true, 
      message: 'Post email queued successfully', 
      errors: null 
    };
  } catch (error) {
    console.error('Failed to send post as email:', error);
    return { 
      success: false, 
      message: 'Failed to send email. Please try again.', 
      errors: null 
    };
  }
}

export async function publishPostToWeb(postId: string) {
  const { userId } = await auth();
  if (!userId) return { success: false, message: 'Not authenticated' };

  try {
    // Check if post exists and belongs to user
    const existingPost = await db.select({ id: posts.id, webEnabled: posts.webEnabled })
      .from(posts)
      .where(and(
        eq(posts.id, postId),
        eq(posts.userId, userId)
      ))
      .limit(1);

    if (existingPost.length === 0) {
      return { 
        success: false, 
        message: 'Post not found'
      };
    }

    await db.update(posts)
      .set({
        webEnabled: true,
        webPublishedAt: new Date(),
        status: 'published',
        publishedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(and(
        eq(posts.id, postId),
        eq(posts.userId, userId)
      ));

    revalidatePath('/posts');
    revalidatePath(`/posts/${postId}`);
    return { 
      success: true, 
      message: 'Post published to web successfully'
    };
  } catch (error) {
    console.error('Failed to publish post to web:', error);
    return { 
      success: false, 
      message: 'Failed to publish post. Please try again.'
    };
  }
}

export async function deletePost(postId: string) {
  const { userId } = await auth();
  if (!userId) return { success: false, message: 'Not authenticated' };

  try {
    // Check if post exists and belongs to user
    const existingPost = await db.select({ id: posts.id })
      .from(posts)
      .where(and(
        eq(posts.id, postId),
        eq(posts.userId, userId)
      ))
      .limit(1);

    if (existingPost.length === 0) {
      return { 
        success: false, 
        message: 'Post not found'
      };
    }

    // Delete segment associations first (due to foreign key constraints)
    await db.delete(postSegments)
      .where(eq(postSegments.postId, postId));

    // Delete the post
    await db.delete(posts)
      .where(and(
        eq(posts.id, postId),
        eq(posts.userId, userId)
      ));

    revalidatePath('/posts');
    return { 
      success: true, 
      message: 'Post deleted successfully'
    };
  } catch (error) {
    console.error('Failed to delete post:', error);
    return { 
      success: false, 
      message: 'Failed to delete post. Please try again.'
    };
  }
}

// Auto-save draft function for seamless editing
export async function autoSaveDraft(postId: string | null, formDataObj: FormData) {
  const { userId } = await auth();
  if (!userId) return { success: false, message: 'Not authenticated', postId: null };

  try {
    // Minimal validation for auto-save
    const title = formDataObj.get('title') as string;
    const content = formDataObj.get('content') as string;
    
    if (!title?.trim()) {
      return { success: false, message: 'Title is required', postId: null };
    }

    if (postId) {
      // Update existing draft
      await db.update(posts)
        .set({
          title,
          content: content || '',
          excerpt: formDataObj.get('excerpt') as string || '',
          updatedAt: new Date(),
        })
        .where(and(
          eq(posts.id, postId),
          eq(posts.userId, userId)
        ));
      
      return { success: true, message: 'Draft saved', postId };
    } else {
      // Create new draft
      const slug = title
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim();

      const [newPost] = await db.insert(posts).values({
        title,
        slug: slug || `draft-${Date.now()}`,
        content: content || '',
        excerpt: formDataObj.get('excerpt') as string || '',
        status: 'draft',
        userId,
      }).returning();

      return { success: true, message: 'Draft created', postId: newPost.id };
    }
  } catch (error) {
    console.error('Auto-save failed:', error);
    return { success: false, message: 'Auto-save failed', postId: null };
  }
}

// Get available email providers for the current user
export async function getAvailableEmailProviders(): Promise<{
  providers: Array<{
    id: 'brevo' | 'mailgun' | 'amazon_ses';
    name: string;
    connected: boolean;
    status: string;
    senders?: Array<{ email: string; name?: string }>;
    domain?: string;
    verifiedIdentities?: string[];
  }>;
}> {
  const { userId } = await auth();
  if (!userId) {
    return { providers: [] };
  }

  try {
    const [brevoDetails, mailgunDetails, amazonSESDetails] = await Promise.all([
      getBrevoIntegrationDetails(),
      getMailgunIntegrationDetails(),
      getAmazonSESIntegrationDetails()
    ]);

    const providers = [
      {
        id: 'brevo' as const,
        name: 'Brevo',
        connected: brevoDetails.connected,
        status: brevoDetails.status || 'inactive',
        senders: brevoDetails.senders?.map(sender => ({
          email: sender.email,
          name: sender.name
        })) || [],
      },
      {
        id: 'mailgun' as const,
        name: 'Mailgun',
        connected: mailgunDetails.connected,
        status: mailgunDetails.status || 'inactive',
        domain: mailgunDetails.domain || undefined,
        senders: mailgunDetails.domain ? [{ email: `noreply@${mailgunDetails.domain}` }] : [],
      },
      {
        id: 'amazon_ses' as const,
        name: 'Amazon SES',
        connected: amazonSESDetails.connected,
        status: amazonSESDetails.status || 'inactive',
        verifiedIdentities: amazonSESDetails.verifiedIdentities || [],
        senders: amazonSESDetails.verifiedIdentities?.map(email => ({ email })) || [],
      },
    ].filter(provider => provider.connected);

    return { providers };
  } catch (error) {
    console.error('Failed to get email providers:', error);
    return { providers: [] };
  }
}
