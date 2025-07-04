import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const publicKey = process.env.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY;
  const privateKey = process.env.IMAGEKIT_PRIVATE_KEY;
  const urlEndpoint = process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT;

  return NextResponse.json({
    configured: {
      publicKey: !!publicKey,
      privateKey: !!privateKey,
      urlEndpoint: !!urlEndpoint,
    },
    values: {
      publicKey: publicKey ? `${publicKey.substring(0, 10)}...` : 'Not set',
      urlEndpoint: urlEndpoint || 'Not set',
    }
  });
}
