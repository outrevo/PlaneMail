import crypto from 'crypto';

/**
 * Generate secure unsubscribe token for a subscriber
 */
export function generateUnsubscribeToken(subscriberId: string, email: string): string {
  const secret = process.env.UNSUBSCRIBE_TOKEN_SECRET || 'fallback-secret-change-this';
  const timestamp = Math.floor(Date.now() / 1000);
  const data = `${subscriberId}:${email.toLowerCase()}:${timestamp}`;
  const signature = crypto.createHmac('sha256', secret).update(data).digest('hex');
  
  // Create token with timestamp for expiration checking
  const token = Buffer.from(`${timestamp}:${signature}`).toString('base64url');
  return token;
}

/**
 * Verify unsubscribe token and check expiration
 */
export function verifyUnsubscribeToken(
  token: string, 
  subscriberId: string, 
  email: string,
  maxAge: number = 90 * 24 * 60 * 60 // 90 days default
): boolean {
  try {
    const secret = process.env.UNSUBSCRIBE_TOKEN_SECRET || 'fallback-secret-change-this';
    const decoded = Buffer.from(token, 'base64url').toString();
    const [timestampStr, signature] = decoded.split(':');
    
    if (!timestampStr || !signature) return false;
    
    const timestamp = parseInt(timestampStr);
    if (isNaN(timestamp)) return false;
    
    // Check expiration
    const now = Math.floor(Date.now() / 1000);
    if (now - timestamp > maxAge) return false;
    
    // Verify signature
    const data = `${subscriberId}:${email.toLowerCase()}:${timestamp}`;
    const expectedSignature = crypto.createHmac('sha256', secret).update(data).digest('hex');
    
    return crypto.timingSafeEqual(
      Buffer.from(signature, 'hex'),
      Buffer.from(expectedSignature, 'hex')
    );
  } catch (error) {
    console.error('Token verification error:', error);
    return false;
  }
}

/**
 * Generate complete unsubscribe URL for a subscriber
 */
export function generateUnsubscribeUrl(subscriberId: string, email: string): string {
  const token = generateUnsubscribeToken(subscriberId, email);
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  
  const params = new URLSearchParams({
    email,
    id: subscriberId
  });
  
  return `${baseUrl}/api/public/unsubscribe/${token}?${params.toString()}`;
}

/**
 * Generate sender address string from user data
 */
export function formatSenderAddress(userAddress: {
  senderAddressLine1?: string | null;
  senderAddressLine2?: string | null;
  senderCity?: string | null;
  senderState?: string | null;
  senderPostalCode?: string | null;
  senderCountry?: string | null;
}): string {
  const parts = [
    userAddress.senderAddressLine1,
    userAddress.senderAddressLine2,
    userAddress.senderCity,
    userAddress.senderState,
    userAddress.senderPostalCode,
    userAddress.senderCountry
  ].filter(part => part && part.trim());

  if (parts.length === 0) {
    return "Please update your sender address in profile settings for compliance";
  }

  return parts.join(', ');
}
