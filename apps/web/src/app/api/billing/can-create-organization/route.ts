import { NextResponse } from 'next/server';
import { canUserCreateOrganization } from '@/lib/user-billing';

export async function GET() {
  try {
    const result = await canUserCreateOrganization();
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error checking organization creation permissions:', error);
    return NextResponse.json(
      { 
        allowed: false, 
        reason: 'Failed to check permissions', 
        needsUpgrade: true 
      },
      { status: 500 }
    );
  }
}
