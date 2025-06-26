# PlaneMail Email Queue System

This document describes the Bull queue implementation for handling email sending efficiently at scale in PlaneMail.

## Overview

The email queue system provides:
- **Scalable email delivery** - Handle thousands of emails without blocking the main application
- **Retry mechanisms** - Automatic retry for failed emails with exponential backoff
- **Priority queues** - Different queues for transactional, newsletter, and bulk emails
- **Monitoring & Management** - Real-time dashboard and API for queue management
- **Provider support** - Works with Brevo, Mailgun, and Amazon SES

## Architecture

### Queue Types

1. **Transactional Queue** - High priority, immediate emails (confirmations, etc.)
   - Concurrency: 5 workers
   - Retry attempts: 5
   - Priority: 1 (highest)

2. **Newsletter Queue** - Regular newsletter campaigns
   - Concurrency: 2 workers
   - Retry attempts: 3
   - Priority: 3 (medium)

3. **Bulk Queue** - Large email campaigns
   - Concurrency: 1 worker
   - Retry attempts: 2
   - Priority: 5 (lowest)
   - Rate limiting: 1 second delay between emails

### Components

- **Redis** - Queue storage and job management
- **Bull** - Queue processing library
- **Email Processors** - Provider-specific email sending logic
- **Workers** - Background processes that execute email jobs
- **Queue Manager** - Utilities for queue management and monitoring

## Setup

### 1. Redis Configuration

Install and configure Redis:

```bash
# macOS (using Homebrew)
brew install redis
brew services start redis

# Or use Docker
docker run -d -p 6379:6379 redis:alpine
```

### 2. Environment Variables

Copy the queue environment template:

```bash
cp .env.example.queue .env.local
```

Configure Redis connection in `.env.local`:

```bash
# For local Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0

# OR for hosted Redis (Railway, Heroku, etc.)
REDIS_URL=redis://user:password@host:port

# Auto-start workers in production
AUTO_START_WORKERS=true
```

### 3. Start Queue Workers

In development, run workers separately:

```bash
# Start the queue workers
npm run queue:start

# Or with auto-restart in development
npm run queue:dev
```

In production, workers can auto-start when `AUTO_START_WORKERS=true`.

## Usage

### Sending Emails via Queue

The newsletter actions have been updated to use the queue system automatically:

```typescript
// Newsletter sending now uses queues
const result = await createNewsletter(formData);
// Returns: { success: true, jobId: "job_123", queuePosition: 5 }
```

### Direct Email Service Usage

For custom email sending:

```typescript
import { emailService } from '@/lib/email-service';

// Send test email
const result = await emailService.sendTestEmail(userId, {
  subject: 'Test Email',
  fromName: 'Sender Name',
  fromEmail: 'sender@example.com',
  htmlContent: '<h1>Hello World</h1>',
  sendingProviderId: 'brevo',
  testEmail: 'test@example.com',
});

// Send newsletter
const result = await emailService.sendNewsletter(userId, {
  subject: 'Newsletter',
  fromName: 'Newsletter Team',
  fromEmail: 'newsletter@example.com',
  htmlContent: '<h1>Newsletter Content</h1>',
  recipients: [
    { email: 'user1@example.com', name: 'User 1' },
    { email: 'user2@example.com', name: 'User 2' },
  ],
  sendingProviderId: 'mailgun',
});
```

## Monitoring

### Queue Dashboard

Access the queue monitoring dashboard:

- **Bull Board UI**: `http://localhost:3000/admin/queues`
- **React Dashboard**: Built into the app at `/dashboard/queues`

### API Endpoints

- `GET /api/queue/stats` - Get queue statistics
- `GET /api/queue/health` - Check queue health status
- `GET /api/queue/jobs/[jobId]` - Get job status
- `POST /api/queue/jobs/[jobId]` - Cancel/retry/remove jobs

### Queue Management

```typescript
import { QueueManager } from '@/lib/queue-manager';

// Get queue statistics
const stats = await QueueManager.getStats();

// Check health status
const health = await QueueManager.getHealthStatus();

// Pause/resume queues
await QueueManager.pauseAllQueues();
await QueueManager.resumeAllQueues();

// Clean old jobs
await QueueManager.cleanOldJobs();

// Job management
await QueueManager.cancelJob('job_123');
await QueueManager.retryJob('job_456');
```

## Error Handling

### Retry Logic

Jobs automatically retry with exponential backoff:

- **Transactional**: 5 attempts, 2-second initial delay
- **Newsletter**: 3 attempts, 2-second initial delay  
- **Bulk**: 2 attempts, 2-second initial delay

### Failed Job Handling

Failed jobs are:
1. Stored for analysis
2. Available for manual retry
3. Can be removed or requeued
4. Monitored via dashboard

### Database Status Updates

Newsletter status is automatically updated:
- `queued` - Job added to queue
- `processing` - Job is being processed
- `sent` - Job completed successfully
- `failed` - Job failed after all retries
- `partially_sent` - Some recipients failed

## Performance Considerations

### Rate Limits

Each provider has built-in rate limiting:

- **Brevo**: 50 emails per batch, 500ms delay
- **Mailgun**: 100 emails per batch, 100ms delay
- **Amazon SES**: 14 emails per batch, 1000ms delay

### Scaling

To handle higher volumes:

1. **Increase worker concurrency** in `email-workers.ts`
2. **Add more Redis instances** with clustering
3. **Use separate worker processes** on different servers
4. **Implement database connection pooling**

### Memory Usage

- Jobs are automatically cleaned after completion
- Failed jobs are retained for 7 days
- Completed jobs are retained for 24 hours

## Troubleshooting

### Common Issues

1. **Redis Connection Failed**
   ```bash
   # Check Redis is running
   redis-cli ping
   # Should return: PONG
   ```

2. **Workers Not Processing**
   ```bash
   # Check worker status
   curl http://localhost:3000/api/queue/health
   ```

3. **High Memory Usage**
   ```bash
   # Clean old jobs
   curl -X POST http://localhost:3000/api/queue/stats \
     -H "Content-Type: application/json" \
     -d '{"action":"clean"}'
   ```

### Logs

Workers log to console with structured information:
- Job start/completion
- Processing time
- Error details
- Queue statistics

### Development Tips

1. **Use separate Redis database** for development
2. **Monitor job progress** in Bull Board
3. **Test with small batches** first
4. **Check provider logs** for delivery issues

## Production Deployment

### Process Management

Use a process manager like PM2:

```bash
# Install PM2
npm install -g pm2

# Start workers
pm2 start npm --name "email-workers" -- run queue:start

# Monitor
pm2 logs email-workers
pm2 monit
```

### Health Checks

Set up monitoring for:
- Queue worker processes
- Redis connectivity
- Failed job rates
- Processing delays

### Backup Strategy

- Redis snapshots for job persistence
- Database backups for newsletter tracking
- Provider webhook configurations

## Migration Guide

### From Direct Sending

The migration is backward compatible:
1. Existing newsletter functionality works unchanged
2. Jobs are queued instead of sent immediately
3. Status updates happen asynchronously
4. Monitoring provides better visibility

### Testing Migration

1. Start with test emails
2. Monitor queue dashboard
3. Verify provider delivery
4. Check database status updates
5. Scale to production volumes

This implementation provides a robust, scalable foundation for email delivery in PlaneMail while maintaining the existing API surface.
