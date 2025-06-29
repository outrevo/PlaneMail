
// This file is a placeholder for NextAuth.js routes.
// Given that Clerk is being used for authentication in this project,
// this file might be unnecessary or a remnant from a previous setup.
// If NextAuth.js is not intentionally being used alongside Clerk,
// this file can likely be removed.

import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  return NextResponse.json({ 
    message: "This NextAuth.js API route is not configured for active use with the current Clerk authentication setup." 
  }, { status: 404 });
}

export async function POST(request: NextRequest) {
  return NextResponse.json({ 
    message: "This NextAuth.js API route is not configured for active use with the current Clerk authentication setup." 
  }, { status: 404 });
}