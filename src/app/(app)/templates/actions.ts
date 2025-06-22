'use server';

import { db } from '@/lib/drizzle';
import { templates } from '@/db/schema';
import { auth } from '@clerk/nextjs/server';
import { eq, and, desc } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

// Removed import of EditorDocument as it's not directly exported by @usewaypoint/email-builder@0.0.8
// The type will be implicitly any for newTemplateInitialContentObjectForV008, or we can define a basic local type.

// Helper to check if a string is valid JSON
const isJSON = (str: string) => {
  try {
    JSON.parse(str);
    return true;
  } catch (e) {
    return false;
  }
};

const templateSchema = z.object({
  name: z.string().min(1, { message: 'Template name is required.' }).max(255),
  content: z.string().refine(isJSON, { message: 'Content must be a valid JSON string.' }),
  category: z.string().optional(),
  previewImageUrl: z.string().url().optional().or(z.literal('')),
});

// Define a local default document structure compatible with @usewaypoint/email-builder@0.0.8 Reader expectations.
// This structure defines a basic email layout with a single text block.
const newTemplateInitialContentObjectForV008: object = {
  root: {
    type: 'EmailLayout', // This type needs to be valid for the v0.0.8 Reader
    data: {
      backdropColor: '#F5F5F5',
      canvasColor: '#FFFFFF',
      textColor: '#262626',
      fontFamily: 'MODERN_SANS', // Ensure this is a valid font key for v0.0.8
      childrenIds: ['block-initial-text'],
    },
  },
  'block-initial-text': {
    type: 'Text', // This type needs to be valid for the v0.0.8 Reader
    data: {
      style: {
        padding: { top: 16, bottom: 16, left: 24, right: 24 },
        fontWeight: 'normal',
      },
      props: {
        text: 'Start building your email here!',
      },
    },
  },
};


export async function getTemplates() {
  const { userId } = await auth();
  if (!userId) {
    throw new Error('Not authenticated');
  }
  try {
    const userTemplates = await db.select().from(templates).where(eq(templates.userId, userId)).orderBy(desc(templates.updatedAt));
    return userTemplates;
  } catch (error) {
    console.error('Failed to fetch templates:', error);
    return [];
  }
}

export async function getTemplateById(id: string) {
  const { userId } = await auth();
  if (!userId) {
    throw new Error('Not authenticated');
  }
  try {
    const template = await db.select().from(templates).where(and(eq(templates.id, id), eq(templates.userId, userId))).limit(1);
    return template[0] || null;
  } catch (error) {
    console.error(`Failed to fetch template ${id}:`, error);
    return null;
  }
}

export async function createTemplate(formData: FormData) {
  const { userId } = await auth();
  if (!userId) {
    return { success: false, message: 'Not authenticated', errors: null };
  }

  // Handle preview image upload
  let previewImageUrl = '';
  const previewImageFile = formData.get('previewImage') as File;
  
  if (previewImageFile && previewImageFile.size > 0) {
    try {
      // Upload to your preferred storage (e.g., S3, Cloudinary, etc.)
      // For now, we'll create a placeholder URL
      const fileName = `template-preview-${Date.now()}.jpg`;
      // TODO: Implement actual file upload to your storage service
      previewImageUrl = `https://your-storage.com/previews/${fileName}`;
    } catch (error) {
      console.error('Failed to upload preview image:', error);
      // Fall back to placeholder
      previewImageUrl = `https://placehold.co/600x400.png?text=${encodeURIComponent(formData.get('name') as string)}`;
    }
  } else {
    previewImageUrl = `https://placehold.co/600x400.png?text=${encodeURIComponent(formData.get('name') as string)}`;
  }

  const validatedFields = templateSchema.safeParse({
    name: formData.get('name'),
    content: formData.get('content'), 
    category: formData.get('category') || 'Uncategorized',
    previewImageUrl: previewImageUrl,
  });

  if (!validatedFields.success) {
    return {
      success: false,
      message: 'Validation failed.',
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }

  const { name, content, category } = validatedFields.data;

  try {
    const [newTemplate] = await db.insert(templates).values({
      userId,
      name,
      content,
      category,
      previewImageUrl,
    }).returning();

    return { success: true, template: newTemplate };
  } catch (error) {
    console.error('Database error:', error);
    return { success: false, message: 'Failed to save template.', errors: null };
  }
}

export async function updateTemplate(id: string, formData: FormData) {
  const { userId } = await auth();
  if (!userId) {
     return { success: false, message: 'Not authenticated', errors: null };
  }

  const existingTemplate = await getTemplateById(id);
  if (!existingTemplate || existingTemplate.userId !== userId) {
    return { success: false, message: 'Template not found or unauthorized', errors: null };
  }
  
  const validatedFields = templateSchema.safeParse({
    name: formData.get('name'),
    content: formData.get('content'), // JSON string
    category: formData.get('category'),
    previewImageUrl: formData.get('previewImageUrl'),
  });

  if (!validatedFields.success) {
    return {
      success: false,
      message: 'Validation failed.',
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }
  
  const updateData: Partial<typeof templates.$inferInsert> = {};
  if (validatedFields.data.name !== undefined) updateData.name = validatedFields.data.name;
  if (validatedFields.data.content !== undefined) updateData.content = validatedFields.data.content;
  if (validatedFields.data.category !== undefined) updateData.category = validatedFields.data.category;
  if (validatedFields.data.previewImageUrl !== undefined) updateData.previewImageUrl = validatedFields.data.previewImageUrl;
    
  updateData.updatedAt = new Date();

  try {
    const [updatedTemplateResult] = await db.update(templates)
      .set(updateData)
      .where(and(eq(templates.id, id), eq(templates.userId, userId)))
      .returning();
    
    revalidatePath('/templates');
    revalidatePath(`/templates/editor/${id}`);
    return { success: true, message: 'Template updated successfully', template: updatedTemplateResult };
  } catch (error) {
    console.error(`Failed to update template ${id}:`, error);
    return { success: false, message: 'Failed to update template.', errors: null };
  }
}

export async function deleteTemplate(id: string) {
  const { userId } = await auth();
  if (!userId) {
    return { success: false, message: 'Not authenticated' };
  }
  try {
    await db.delete(templates).where(and(eq(templates.id, id), eq(templates.userId, userId)));
    revalidatePath('/templates');
    return { success: true, message: 'Template deleted successfully' };
  } catch (error) {
    console.error(`Failed to delete template ${id}:`, error);
    return { success: false, message: 'Failed to delete template.' };
  }
}
