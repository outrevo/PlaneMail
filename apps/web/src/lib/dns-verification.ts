import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export interface DNSVerificationResult {
  success: boolean;
  cname?: string;
  error?: string;
}

export async function verifyDNSRecord(domain: string, expectedTarget: string = 'planemail.app'): Promise<DNSVerificationResult> {
  try {
    // Use dig command to check CNAME record
    const { stdout, stderr } = await execAsync(`dig +short CNAME ${domain}`);
    
    if (stderr) {
      console.error('DNS verification error:', stderr);
      return { success: false, error: 'DNS lookup failed' };
    }

    const cname = stdout.trim().replace(/\.$/, ''); // Remove trailing dot
    
    if (!cname) {
      return { success: false, error: 'No CNAME record found' };
    }

    if (cname !== expectedTarget) {
      return { 
        success: false, 
        error: `CNAME points to ${cname}, expected ${expectedTarget}`,
        cname 
      };
    }

    return { success: true, cname };
  } catch (error) {
    console.error('DNS verification error:', error);
    return { 
      success: false, 
      error: 'Failed to verify DNS record' 
    };
  }
}

export async function checkDomainAccessibility(domain: string): Promise<boolean> {
  try {
    // Check if domain is accessible via HTTP/HTTPS
    const { stdout, stderr } = await execAsync(`curl -s -o /dev/null -w "%{http_code}" --max-time 10 https://${domain}/health || echo "000"`);
    
    const statusCode = parseInt(stdout.trim());
    return statusCode >= 200 && statusCode < 400;
  } catch (error) {
    console.error('Domain accessibility check failed:', error);
    return false;
  }
}
