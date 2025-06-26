# PlaneMail Deployment Guide

This guide covers deploying the PlaneMail microservices architecture with the separated queue service.

## Architecture Overview

- **Web App** (`apps/web`): Next.js application running on port 3000/3002
- **Queue Service** (`packages/queue-service`): Standalone BullMQ service on port 3001
- **Redis**: Queue storage and management
- **Shared Package** (`packages/shared`): Common types and utilities

## Development Setup

### Prerequisites

- Node.js 18+
- Redis server
- npm or yarn

### Quick Start

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Start Redis:**
   ```bash
   # macOS with Homebrew
   brew services start redis
   
   # Or with Docker
   docker run -d -p 6379:6379 redis:7-alpine
   ```

3. **Start all services:**
   ```bash
   npm run dev
   ```

   This starts:
   - Web app on http://localhost:3000
   - Queue service on http://localhost:3001

### Individual Service Commands

```bash
# Start only the web app
npm run dev -w nextn

# Start only the queue service  
npm run dev -w @planemail/queue-service

# Build all packages
npm run build

# Build specific packages
npm run build -w @planemail/shared -w @planemail/queue-service
```

## Production Deployment

### Option 1: Docker Compose (Recommended)

1. **Create environment file:**
   ```bash
   cp .env.example .env
   # Edit .env with your production values
   ```

2. **Deploy with Docker Compose:**
   ```bash
   docker-compose up -d
   ```

3. **Services will be available at:**
   - Web app: http://localhost:3002
   - Queue service: http://localhost:3001
   - Redis: http://localhost:6379

### Option 2: Manual Deployment

#### Deploy Queue Service

1. **Build the service:**
   ```bash
   npm run build -w @planemail/shared -w @planemail/queue-service
   ```

2. **Set environment variables:**
   ```bash
   export NODE_ENV=production
   export PORT=3001
   export REDIS_URL=redis://your-redis-host:6379
   ```

3. **Start the service:**
   ```bash
   npm run start -w @planemail/queue-service
   ```

#### Deploy Web App

1. **Build the app:**
   ```bash
   npm run build -w nextn
   ```

2. **Set environment variables:**
   ```bash
   export NEXT_PUBLIC_QUEUE_SERVICE_URL=http://your-queue-service:3001
   export DATABASE_URL=your_database_url
   # Add other required environment variables
   ```

3. **Start the app:**
   ```bash
   npm run start -w nextn
   ```

### Option 3: Cloud Deployment

#### Vercel (Web App)

1. **Deploy web app to Vercel:**
   ```bash
   cd apps/web
   vercel --prod
   ```

2. **Configure environment variables in Vercel dashboard:**
   - `NEXT_PUBLIC_QUEUE_SERVICE_URL`
   - `DATABASE_URL`
   - Other required variables

#### Railway/Render (Queue Service)

1. **Create new service**
2. **Set build command:** `npm run build -w @planemail/shared -w @planemail/queue-service`
3. **Set start command:** `npm run start -w @planemail/queue-service`
4. **Configure environment variables**

## Environment Configuration

### Queue Service (.env)

```env
# Service configuration
NODE_ENV=production
PORT=3001

# Redis configuration
REDIS_URL=redis://localhost:6379
# OR individual settings:
# REDIS_HOST=localhost
# REDIS_PORT=6379
# REDIS_PASSWORD=
# REDIS_DB=0

# Worker configuration
NEWSLETTER_CONCURRENCY=2
TRANSACTIONAL_CONCURRENCY=5
BULK_CONCURRENCY=1

# Job cleanup
CLEANUP_COMPLETED_AFTER_MS=86400000  # 24 hours
CLEANUP_FAILED_AFTER_MS=604800000    # 7 days

# Logging
LOG_LEVEL=info
```

### Web App (.env.local)

```env
# Queue service
NEXT_PUBLIC_QUEUE_SERVICE_URL=http://localhost:3001

# Database
DATABASE_URL=your_database_url

# Authentication
CLERK_SECRET_KEY=your_clerk_secret_key
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key

# Other services...
```

## Monitoring and Health Checks

### Queue Service Endpoints

- **Health Check:** `GET /health`
- **Queue Stats:** `GET /api/queue/stats`
- **Job Status:** `GET /api/queue/status/:jobId`

### Example Health Check Response

```json
{
  "status": "healthy",
  "queues": {
    "newsletter": {
      "waiting": 0,
      "active": 0,
      "completed": 5,
      "failed": 0,
      "delayed": 0
    },
    "transactional": {
      "waiting": 2,
      "active": 1,
      "completed": 10,
      "failed": 0,
      "delayed": 0
    },
    "bulk": {
      "waiting": 0,
      "active": 0,
      "completed": 0,
      "failed": 0,
      "delayed": 0
    }
  },
  "timestamp": "2025-06-27T10:30:00.000Z"
}
```

## Scaling Considerations

### Horizontal Scaling

- **Queue Service:** Can run multiple instances with same Redis
- **Web App:** Standard Next.js scaling practices
- **Redis:** Use Redis Cluster for high availability

### Performance Tuning

1. **Adjust worker concurrency based on provider limits:**
   ```env
   NEWSLETTER_CONCURRENCY=5      # For high-volume newsletters
   TRANSACTIONAL_CONCURRENCY=10  # For quick delivery
   BULK_CONCURRENCY=3           # For large imports
   ```

2. **Configure batch sizes in code:**
   ```typescript
   // In processors.ts
   protected getBatchSize(): number {
     return process.env.NODE_ENV === 'production' ? 100 : 10;
   }
   ```

## Troubleshooting

### Common Issues

1. **Queue service not connecting to Redis:**
   - Check `REDIS_URL` environment variable
   - Verify Redis is running and accessible
   - Check network connectivity

2. **Web app can't reach queue service:**
   - Verify `NEXT_PUBLIC_QUEUE_SERVICE_URL` 
   - Check queue service health endpoint
   - Ensure proper networking in Docker/cloud

3. **Jobs stuck in queue:**
   - Check worker logs for errors
   - Verify email provider credentials
   - Check rate limiting settings

### Debug Commands

```bash
# Check Redis connection
redis-cli ping

# View queue service logs
docker-compose logs queue-service

# Check running processes
ps aux | grep node

# Test queue service health
curl http://localhost:3001/health
```

## Migration from Monolithic Architecture

If migrating from the old embedded queue system:

1. **Update newsletter actions** to use `queueClient` instead of direct email service
2. **Remove old queue files:** `email-queue.ts`, `email-workers.ts`, `queue-manager.ts`
3. **Update imports** to use `@planemail/shared` types
4. **Deploy queue service** separately from web app
5. **Update environment variables** to point to queue service

## Security Considerations

- **API Keys:** Store email provider credentials securely in database
- **Network:** Use internal networking between services in production
- **Redis:** Enable authentication in production Redis instances
- **CORS:** Configure appropriate CORS settings for queue service
- **Rate Limiting:** Implement rate limiting on queue service endpoints

## Backup and Recovery

- **Redis Persistence:** Enable RDB or AOF persistence
- **Queue State:** Regular snapshots of queue statistics
- **Failed Jobs:** Implement retry logic and dead letter queues
- **Monitoring:** Set up alerts for queue health and job failures
