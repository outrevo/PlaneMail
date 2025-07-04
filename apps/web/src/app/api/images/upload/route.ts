import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { imagekitService } from '@/lib/imagekit';

export async function POST(request: NextRequest) {
  try {
    console.log('Image upload API called');
    
    // Check authentication
    const authResult = await auth();
    console.log('Auth result:', { userId: authResult?.userId, hasUserId: !!authResult?.userId });
    
    // In development, allow uploads without auth, but in production require auth
    const isDevelopment = process.env.NODE_ENV === 'development';
    
    if (!authResult?.userId && !isDevelopment) {
      console.log('No userId found and not in development, returning 401');
      return NextResponse.json(
        { success: false, error: 'Unauthorized - Please sign in to upload images' },
        { status: 401 }
      );
    }
    
    const userId = authResult?.userId || 'dev-user';
    console.log('Using userId:', userId);

    // Get form data
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const folder = formData.get('folder') as string || 'planemail/posts';
    const tags = formData.get('tags') as string || 'post-image';

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No file provided' },
        { status: 400 }
      );
    }

    // Validate file
    const validation = imagekitService.validateImageFile(file);
    if (!validation.valid) {
      return NextResponse.json(
        { success: false, error: validation.error },
        { status: 400 }
      );
    }

    // Upload to ImageKit
    const uploadResult = await imagekitService.uploadImage({
      file,
      folder: `${folder}/${userId}`, // Add user ID to folder path
      tags: [tags, userId, 'planemail'].filter(Boolean),
      useUniqueFileName: true,
    });

    if (!uploadResult.success) {
      console.log('ImageKit upload failed, falling back to base64:', uploadResult.error);
      
      // Fallback to base64 if ImageKit upload fails
      const buffer = await file.arrayBuffer();
      const base64 = Buffer.from(buffer).toString('base64');
      const dataUrl = `data:${file.type};base64,${base64}`;
      
      return NextResponse.json({
        success: true,
        data: {
          url: dataUrl,
          emailOptimizedUrl: dataUrl,
          thumbnailUrl: dataUrl,
        },
        fallback: true,
        message: 'ImageKit not configured, using base64 fallback',
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        url: uploadResult.url,
        emailOptimizedUrl: uploadResult.emailOptimizedUrl,
        thumbnailUrl: uploadResult.thumbnailUrl,
      },
    });

  } catch (error) {
    console.error('Image upload API error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Upload failed' 
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // Check authentication
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const fileId = searchParams.get('fileId');

    if (!fileId) {
      return NextResponse.json(
        { success: false, error: 'File ID is required' },
        { status: 400 }
      );
    }

    // Delete from ImageKit
    const deleted = await imagekitService.deleteImage(fileId);

    if (!deleted) {
      return NextResponse.json(
        { success: false, error: 'Failed to delete image' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Image delete API error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Delete failed' 
      },
      { status: 500 }
    );
  }
}
