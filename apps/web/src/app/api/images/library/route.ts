import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
// TODO: Uncomment when images table is migrated to database
// import { db } from '@/lib/db';
// import { images } from '@/lib/db/schema';
// import { eq, desc } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    console.log('Image library API called');
    
    // Check authentication
    const authResult = await auth();
    console.log('Auth result:', { userId: authResult?.userId, hasUserId: !!authResult?.userId });
    
    // In development, allow requests without auth, but in production require auth
    const isDevelopment = process.env.NODE_ENV === 'development';
    
    if (!authResult?.userId && !isDevelopment) {
      console.log('No userId found and not in development, returning 401');
      return NextResponse.json(
        { success: false, error: 'Unauthorized - Please sign in to view images' },
        { status: 401 }
      );
    }
    
    const userId = authResult?.userId || 'dev-user';
    console.log('Fetching images for userId:', userId);

    // TODO: Replace with actual database query when the images table is migrated
    // const userImages = await db
    //   .select()
    //   .from(images)
    //   .where(eq(images.userId, userId))
    //   .orderBy(desc(images.createdAt))
    //   .limit(50);
    
    // Mock data for development (replace with userImages when database is ready)
    const mockImages = [
      {
        id: '1',
        url: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop',
        emailOptimizedUrl: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&h=400&fit=crop&auto=format&q=80',
        thumbnailUrl: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=300&h=200&fit=crop&auto=format&q=80',
        filename: 'mountain-landscape.jpg',
        uploadedAt: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
        size: 256000
      },
      {
        id: '2',
        url: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=800&h=600&fit=crop',
        emailOptimizedUrl: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=600&h=400&fit=crop&auto=format&q=80',
        thumbnailUrl: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=300&h=200&fit=crop&auto=format&q=80',
        filename: 'forest-path.jpg',
        uploadedAt: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
        size: 342000
      },
      {
        id: '3',
        url: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop',
        emailOptimizedUrl: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&h=400&fit=crop&auto=format&q=80',
        thumbnailUrl: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=300&h=200&fit=crop&auto=format&q=80',
        filename: 'ocean-waves.jpg',
        uploadedAt: new Date(Date.now() - 259200000).toISOString(), // 3 days ago
        size: 189000
      },
      {
        id: '4',
        url: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800&h=600&fit=crop',
        emailOptimizedUrl: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=600&h=400&fit=crop&auto=format&q=80',
        thumbnailUrl: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=300&h=200&fit=crop&auto=format&q=80',
        filename: 'desert-landscape.jpg',
        uploadedAt: new Date(Date.now() - 345600000).toISOString(), // 4 days ago
        size: 278000
      },
      {
        id: '5',
        url: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop',
        emailOptimizedUrl: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&h=400&fit=crop&auto=format&q=80',
        thumbnailUrl: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=300&h=200&fit=crop&auto=format&q=80',
        filename: 'city-skyline.jpg',
        uploadedAt: new Date(Date.now() - 432000000).toISOString(), // 5 days ago
        size: 445000
      },
      {
        id: '6',
        url: 'https://images.unsplash.com/photo-1518837695005-2083093ee35b?w=800&h=600&fit=crop',
        emailOptimizedUrl: 'https://images.unsplash.com/photo-1518837695005-2083093ee35b?w=600&h=400&fit=crop&auto=format&q=80',
        thumbnailUrl: 'https://images.unsplash.com/photo-1518837695005-2083093ee35b?w=300&h=200&fit=crop&auto=format&q=80',
        filename: 'tropical-beach.jpg',
        uploadedAt: new Date(Date.now() - 518400000).toISOString(), // 6 days ago
        size: 312000
      }
    ];

    console.log(`Returning ${mockImages.length} mock images for user ${userId}`);

    return NextResponse.json({
      success: true,
      images: mockImages
    });

  } catch (error) {
    console.error('Error fetching images:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch images',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
