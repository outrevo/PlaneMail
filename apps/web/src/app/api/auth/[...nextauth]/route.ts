
// This file is a placeholder for NextAuth.js routes.
// Given that Clerk is being used for authentication in this project,
// this file might be unnecessary or a remnant from a previous setup.
// If NextAuth.js is not intentionally being used alongside Clerk,
// this file can likely be removed.

import type { NextApiRequest, NextApiResponse } from 'next';

export async function GET(req: NextApiRequest, res: NextApiResponse) {
  // Placeholder: Respond with a message indicating this route is not actively used.
  res.status(404).json({ message: "This NextAuth.js API route is not configured for active use with the current Clerk authentication setup." });
}

// You can add POST or other handlers if NextAuth.js were being used.
// For example:
// export async function POST(req: NextApiRequest, res: NextApiResponse) {
//   res.status(404).json({ message: "This NextAuth.js API route is not configured for active use with the current Clerk authentication setup." });
// }

// If you are certain NextAuth.js is not needed, this file could be simplified further or deleted.
// For now, providing a valid, minimal API route structure to prevent build errors.
// IMPORTANT: The Next.js App Router uses a different convention for API routes.
// API handlers should be exported as named functions (GET, POST, etc.) directly.

export async function POST(request: Request) {
  return new Response(JSON.stringify({ message: "This NextAuth.js API route is not configured for active use with the current Clerk authentication setup." }), {
    status: 404,
    headers: {
      'Content-Type': 'application/json',
    },
  });
}
// Adding a default export that Next.js App Router might expect for a catch-all, though for API routes, named exports are standard.
// To be safe and ensure it doesn't try to render as a page if misinterpreted:
export default async function handler(request: Request) {
  if (request.method === 'GET') {
     return new Response(JSON.stringify({ message: "This NextAuth.js API route is not configured for active use with the current Clerk authentication setup." }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    });
  }
  if (request.method === 'POST') {
    return new Response(JSON.stringify({ message: "This NextAuth.js API route is not configured for active use with the current Clerk authentication setup." }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    });
  }
  // Default response for other methods
  return new Response(JSON.stringify({ message: `Method ${request.method} Not Allowed` }), {
    status: 405,
    headers: { 'Content-Type': 'application/json' },
  });
}
