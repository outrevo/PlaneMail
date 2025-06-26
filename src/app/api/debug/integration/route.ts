// Debug endpoint to test integration status
// Add this temporarily to help debug

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getBrevoIntegrationDetails, getNewsletterPageData } from '@/app/(app)/newsletters/actions';

export async function GET() {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Test direct integration fetch
    const brevoDetails = await getBrevoIntegrationDetails();
    
    // Test newsletter page data fetch
    const newsletterData = await getNewsletterPageData();

    return NextResponse.json({
      success: true,
      debug: {
        userId: userId,
        timestamp: new Date().toISOString(),
        directBrevoFetch: brevoDetails,
        newsletterPageData: {
          brevoIntegration: newsletterData.brevoIntegration,
          templatesCount: newsletterData.templates.length,
          segmentsCount: newsletterData.segments.length,
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
