import express from 'express';
import cors from 'cors';
import { emailQueueManager } from './queue-manager';
import { EmailJobData, EmailJobResponse } from '@planemail/shared';

const app = express();
const PORT = process.env.QUEUE_PORT || 3002;

// Authentication configuration
const QUEUE_API_KEY = process.env.QUEUE_API_KEY;
const INTERNAL_API_KEY = process.env.INTERNAL_API_KEY;

if (!QUEUE_API_KEY || !INTERNAL_API_KEY) {
  throw new Error('QUEUE_API_KEY and INTERNAL_API_KEY environment variables are required');
}

// Authentication middleware
const authenticateRequest = (requiredLevel: 'public' | 'internal' | 'admin') => {
  return (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Missing or invalid authorization header'
      });
    }
    
    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    
    // Check authentication level
    let isAuthorized = false;
    
    switch (requiredLevel) {
      case 'public':
        // Public endpoints accessible with any valid API key
        isAuthorized = token === QUEUE_API_KEY || token === INTERNAL_API_KEY;
        break;
      case 'internal':
        // Internal endpoints only accessible with internal API key
        isAuthorized = token === INTERNAL_API_KEY;
        break;
      case 'admin':
        // Admin endpoints only accessible with internal API key
        isAuthorized = token === INTERNAL_API_KEY;
        break;
      default:
        isAuthorized = false;
    }
    
    if (!isAuthorized) {
      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions'
      });
    }
    
    next();
  };
};

// Rate limiting helper (basic implementation)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const rateLimit = (maxRequests: number, windowMs: number) => {
  return (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const key = req.ip || 'unknown';
    const now = Date.now();
    
    const clientData = rateLimitMap.get(key);
    
    if (!clientData || now > clientData.resetTime) {
      rateLimitMap.set(key, { count: 1, resetTime: now + windowMs });
      return next();
    }
    
    if (clientData.count >= maxRequests) {
      return res.status(429).json({
        success: false,
        message: 'Rate limit exceeded'
      });
    }
    
    clientData.count++;
    next();
  };
};

// Middleware
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || false,
  credentials: true
}));
app.use(express.json({ limit: '1mb' })); // Limit request size
app.use(rateLimit(100, 60000)); // 100 requests per minute per IP

// Security headers
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  next();
});

// Health check endpoint (no auth required but limited info)
app.get('/health', async (req, res) => {
  try {
    // Only provide basic health status without sensitive queue stats
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '1.0.0'
    });
  } catch (error) {
    res.status(500).json({
      status: 'unhealthy',
      error: 'Service unavailable'
    });
  }
});

// Add newsletter job (requires valid API key)
app.post('/api/queue/newsletter', authenticateRequest('public'), async (req, res) => {
  try {
    const jobData: EmailJobData = req.body;
    
    // Validate required fields
    if (!jobData.userId || !jobData.subject || !jobData.htmlContent) {
      return res.status(400).json({
        success: false,
        jobId: null,
        message: 'Missing required fields: userId, subject, htmlContent'
      });
    }
    
    const job = await emailQueueManager.addNewsletterEmail(jobData, { priority: 3 });
    
    const response: EmailJobResponse = {
      success: true,
      jobId: job.id!,
      message: 'Newsletter job added to queue'
    };
    
    res.json(response);
  } catch (error) {
    console.error('Error adding newsletter job:', error);
    res.status(500).json({
      success: false,
      jobId: null,
      message: error instanceof Error ? error.message : 'Failed to add job'
    });
  }
});

// Add transactional job (requires internal API key)
app.post('/api/queue/transactional', authenticateRequest('internal'), async (req, res) => {
  try {
    const jobData: EmailJobData = req.body;
    
    // Validate required fields
    if (!jobData.userId || !jobData.subject || !jobData.htmlContent || !jobData.recipients?.length) {
      return res.status(400).json({
        success: false,
        jobId: null,
        message: 'Missing required fields: userId, subject, htmlContent, recipients'
      });
    }
    
    const job = await emailQueueManager.addTransactionalEmail(jobData, { priority: 1 });
    
    const response: EmailJobResponse = {
      success: true,
      jobId: job.id!,
      message: 'Transactional job added to queue'
    };
    
    res.json(response);
  } catch (error) {
    console.error('Error adding transactional job:', error);
    res.status(500).json({
      success: false,
      jobId: null,
      message: error instanceof Error ? error.message : 'Failed to add job'
    });
  }
});

// Add bulk job (requires internal API key)
app.post('/api/queue/bulk', authenticateRequest('internal'), async (req, res) => {
  try {
    const jobData: EmailJobData = req.body;
    
    // Validate required fields
    if (!jobData.userId || !jobData.subject || !jobData.htmlContent) {
      return res.status(400).json({
        success: false,
        jobId: null,
        message: 'Missing required fields: userId, subject, htmlContent'
      });
    }
    
    const job = await emailQueueManager.addBulkEmail(jobData, { priority: 5 });
    
    const response: EmailJobResponse = {
      success: true,
      jobId: job.id!,
      message: 'Bulk job added to queue'
    };
    
    res.json(response);
  } catch (error) {
    console.error('Error adding bulk job:', error);
    res.status(500).json({
      success: false,
      jobId: null,
      message: error instanceof Error ? error.message : 'Failed to add job'
    });
  }
});

// Get job status (requires internal API key)
app.get('/api/queue/status/:jobId', authenticateRequest('internal'), async (req, res) => {
  try {
    const { jobId } = req.params;
    
    if (!jobId || typeof jobId !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Invalid job ID'
      });
    }
    
    const result = await emailQueueManager.getJob(jobId);
    
    if (!result) {
      return res.status(404).json({
        success: false,
        message: 'Job not found'
      });
    }
    
    const { job, queueName } = result;
    
    // Sanitize sensitive data from job data
    const sanitizedData = { ...job.data };
    if (sanitizedData.providerConfig) {
      // Only show which provider is configured, not the actual credentials
      sanitizedData.providerConfig = {
        [sanitizedData.sendingProviderId]: { configured: true }
      } as any;
    }
    // Remove sensitive recipient data in bulk jobs
    if (sanitizedData.recipients && sanitizedData.recipients.length > 10) {
      sanitizedData.recipients = [
        ...sanitizedData.recipients.slice(0, 5),
        { email: '...', name: `... and ${sanitizedData.recipients.length - 5} more` }
      ];
    }
    
    res.json({
      success: true,
      jobId,
      queueName,
      status: await job.getState(),
      progress: job.progress,
      data: sanitizedData,
      processedOn: job.processedOn,
      finishedOn: job.finishedOn,
      failedReason: job.failedReason,
      returnValue: job.returnvalue
    });
  } catch (error) {
    console.error('Error getting job status:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to get job status'
    });
  }
});

// Get queue statistics (requires internal API key)
app.get('/api/queue/stats', authenticateRequest('internal'), async (req, res) => {
  try {
    const stats = await emailQueueManager.getQueueStats();
    
    res.json({
      success: true,
      stats,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error getting queue stats:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to get queue stats'
    });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Queue service HTTP API listening on port ${PORT}`);
});

export { app };
