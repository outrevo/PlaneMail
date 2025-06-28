// Debug endpoint to test integration status
// Add this temporarily to help debug

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getBrevoIntegrationDetails } from '@/app/(app)/integrations/actions';
import { getPostPageData } from '@/app/(app)/posts/actions';

export async function GET() {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Test direct integration fetch
    const brevoDetails = await getBrevoIntegrationDetails();
    
    // Test post page data fetch
    const postData = await getPostPageData();

    return NextResponse.json({
      success: true,
      debug: {
        userId: userId,
        timestamp: new Date().toISOString(),
        directBrevoFetch: brevoDetails,
        postPageData: {
          brevoIntegration: postData.brevoIntegration,
          segmentsCount: postData.segments.length,
        }
      }
    });

  } catch (error) {
    console.error('Debug endpoint error:', error);
    return NextResponse.json({ 
      error: 'Debug failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
