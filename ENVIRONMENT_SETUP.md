# Environment Configuration Guide

This guide covers setting up environment variables for the PlaneMail Turborepo microservices architecture.

## Overview

The PlaneMail system consists of three main components:
- **Web App** (`apps/web`) - Next.js application
- **Queue Service** (`packages/queue-service`) - Standalone email processing service
- **Redis** - Queue storage and job management

## Environment Files

### 1. Root Level (`.env.local`)

Create a `.env.local` file in the root directory for shared configuration:

```env
# Database (shared by web app and migrations)
DATABASE_URL=postgresql://username:password@localhost:5432/planemail

# Redis (shared by web app and queue service)
REDIS_URL=redis://localhost:6379

# Development settings
NODE_ENV=development
```

### 2. Web App (`apps/web/.env.local`)

Create a `.env.local` file in `apps/web/` for web app specific configuration:

```env
# Authentication (Clerk)
CLERK_SECRET_KEY=sk_test_...
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...

# Queue Service
NEXT_PUBLIC_QUEUE_SERVICE_URL=http://localhost:3001

# Paddle (for billing)
PADDLE_API_KEY=your_paddle_api_key
PADDLE_WEBHOOK_SECRET=your_webhook_secret
NEXT_PUBLIC_PADDLE_ENVIRONMENT=sandbox

# Other integrations
BREVO_API_KEY=your_brevo_api_key
MAILGUN_API_KEY=your_mailgun_api_key
MAILGUN_DOMAIN=your_mailgun_domain

# AWS SES
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key
AWS_REGION=us-east-1
```

### 3. Queue Service (`packages/queue-service/.env`)

Create a `.env` file in `packages/queue-service/` for queue service specific configuration:

```env
# Service configuration
NODE_ENV=development
PORT=3001

# Redis connection
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

# Job cleanup settings
CLEANUP_COMPLETED_AFTER_MS=86400000  # 24 hours
CLEANUP_FAILED_AFTER_MS=604800000    # 7 days

# Logging
LOG_LEVEL=info

# Health check settings
HEALTH_CHECK_INTERVAL_MS=30000       # 30 seconds
```

## Setup Instructions

### 1. Clone and Install

```bash
git clone https://github.com/outrevo/PlaneMail.git
cd PlaneMail
npm install
```

### 2. Create Environment Files

```bash
# Root level
cp .env.example .env.local
# Edit .env.local with your database and Redis URLs

# Web app
cp apps/web/.env.example apps/web/.env.local
# Edit apps/web/.env.local with your API keys

# Queue service
cp packages/queue-service/.env.example packages/queue-service/.env
# Edit packages/queue-service/.env with your queue settings
```

### 3. Start Dependencies

```bash
# Start Redis
brew services start redis

# Or with Docker
docker run -d -p 6379:6379 redis:7-alpine

# Start PostgreSQL (if not already running)
# Configure your DATABASE_URL accordingly
```

### 4. Run Database Migrations

```bash
npm run db:migrate
```

### 5. Start All Services

```bash
# Development mode (starts all services)
npm run dev

# Or start services individually
npm run dev -w nextn              # Web app only
npm run dev -w @planemail/queue-service  # Queue service only
```

## Environment Variables Reference

### Required Variables

| Variable | Location | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Root | PostgreSQL connection string |
| `REDIS_URL` | Root/Queue | Redis connection string |
| `CLERK_SECRET_KEY` | Web App | Clerk authentication secret |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Web App | Clerk public key |

### Optional Variables

| Variable | Location | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_QUEUE_SERVICE_URL` | Web App | Queue service endpoint (default: http://localhost:3001) |
| `LOG_LEVEL` | Queue Service | Logging level (default: info) |
| `PORT` | Queue Service | Service port (default: 3001) |

### Email Provider Variables

Configure at least one email provider in the web app:

**Brevo:**
- `BREVO_API_KEY`

**Mailgun:**
- `MAILGUN_API_KEY`
- `MAILGUN_DOMAIN`

**Amazon SES:**
- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`
- `AWS_REGION`

## Production Configuration

### Docker Compose

For production deployment, use the provided `docker-compose.yml`:

```bash
# Create production environment file
cp .env.example .env.production

# Start with Docker Compose
docker-compose up -d
```

### Environment Variables for Production

```env
# Production settings
NODE_ENV=production
LOG_LEVEL=warn

# External Redis
REDIS_URL=redis://your-redis-host:6379

# Production database
DATABASE_URL=postgresql://user:pass@your-db-host:5432/planemail

# Production Clerk keys
CLERK_SECRET_KEY=sk_live_...
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_...

# Production Paddle
PADDLE_API_KEY=your_live_paddle_key
NEXT_PUBLIC_PADDLE_ENVIRONMENT=production
```

## Verification

### Check Environment Setup

```bash
# Verify Redis connection
redis-cli ping

# Verify database connection
npm run db:migrate

# Check queue service health
curl http://localhost:3001/health

# Check web app
curl http://localhost:3000/api/health
```

### Troubleshooting

**Common Issues:**

1. **Redis Connection Failed**
   - Ensure Redis is running: `brew services start redis`
   - Check REDIS_URL format: `redis://localhost:6379`

2. **Database Connection Failed**
   - Verify PostgreSQL is running
   - Check DATABASE_URL format and credentials

3. **Queue Service Not Starting**
   - Check PORT conflicts (default 3001)
   - Verify Redis connection
   - Check logs for specific errors

4. **Web App Build Failed**
   - Ensure all required environment variables are set
   - Check Clerk configuration
   - Verify queue service is accessible

## Security Notes

- Never commit `.env*` files to version control
- Use different API keys for development and production
- Rotate secrets regularly
- Use environment-specific Clerk instances
- Enable Redis authentication in production
- Use SSL/TLS for database connections in production
