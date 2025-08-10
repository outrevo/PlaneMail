import crypto from 'crypto';

/**
 * Generate secure unsubscribe token for a subscriber
 */
export function generateUnsubscribeToken(subscriberId: string, email: string): string {
  const secret = process.env.UNSUBSCRIBE_TOKEN_SECRET || 'fallback-secret-change-this';
  const timestamp = Math.floor(Date.now() / 1000);
  const data = `${subscriberId}:${email.toLowerCase()}:${timestamp}`;
  const signature = crypto.createHmac('sha256', secret).update(data).digest('hex');
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
  maxAge: number = 90 * 24 * 60 * 60
): boolean {
  try {
    const secret = process.env.UNSUBSCRIBE_TOKEN_SECRET || 'fallback-secret-change-this';
    const decoded = Buffer.from(token, 'base64url').toString();
    const [timestampStr, signature] = decoded.split(':');
    if (!timestampStr || !signature) return false;
    const timestamp = parseInt(timestampStr);
    if (isNaN(timestamp)) return false;
    const now = Math.floor(Date.now() / 1000);
    if (now - timestamp > maxAge) return false;
    const data = `${subscriberId}:${email.toLowerCase()}:${timestamp}`;
    const expectedSignature = crypto.createHmac('sha256', secret).update(data).digest('hex');
    return crypto.timingSafeEqual(
      Buffer.from(signature, 'hex'),
      Buffer.from(expectedSignature, 'hex')
    );
  } catch {
    return false;
  }
}

/**
 * Generate complete unsubscribe URL for a subscriber
 */
export function generateUnsubscribeUrl(
  subscriberId: string,
  email: string,
  baseUrl: string = process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
): string {
  const token = generateUnsubscribeToken(subscriberId, email);
  const params = new URLSearchParams({ email, id: subscriberId });
  return `${baseUrl}/api/public/unsubscribe/${token}?${params.toString()}`;
}

/**
 * Generate secure confirmation token for double opt-in (timestamp + signature)
 */
export function generateConfirmationToken(subscriberId: string, email: string): string {
  const secret = process.env.CONFIRMATION_TOKEN_SECRET || process.env.UNSUBSCRIBE_TOKEN_SECRET || 'fallback-secret-change-this';
  const timestamp = Math.floor(Date.now() / 1000);
  const data = `${subscriberId}:${email.toLowerCase()}:${timestamp}`;
  const signature = crypto.createHmac('sha256', secret).update(data).digest('hex');
  return Buffer.from(`${timestamp}:${signature}`).toString('base64url');
}

/**
 * Verify confirmation token with expiration (default 7 days)
 */
export function verifyConfirmationToken(
  token: string,
  subscriberId: string,
  email: string,
  maxAge: number = 7 * 24 * 60 * 60
): boolean {
  try {
    const secret = process.env.CONFIRMATION_TOKEN_SECRET || process.env.UNSUBSCRIBE_TOKEN_SECRET || 'fallback-secret-change-this';
    const decoded = Buffer.from(token, 'base64url').toString();
    const [timestampStr, signature] = decoded.split(':');
    if (!timestampStr || !signature) return false;
    const timestamp = parseInt(timestampStr);
    if (isNaN(timestamp)) return false;
    const now = Math.floor(Date.now() / 1000);
    if (now - timestamp > maxAge) return false;
    const data = `${subscriberId}:${email.toLowerCase()}:${timestamp}`;
    const expectedSignature = crypto.createHmac('sha256', secret).update(data).digest('hex');
    return crypto.timingSafeEqual(Buffer.from(signature, 'hex'), Buffer.from(expectedSignature, 'hex'));
  } catch {
    return false;
  }
}
