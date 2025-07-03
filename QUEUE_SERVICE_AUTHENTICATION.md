# Queue Service Authentication

The Queue Service API is secured with Bearer token authentication to protect against unauthorized access when deployed.

## Authentication Levels

The API uses a tiered authentication system:

### 1. Public Level (`QUEUE_API_KEY`)
- **Endpoints**: `/api/queue/newsletter`
- **Purpose**: For adding newsletter jobs from the web app
- **Access**: Basic email sending functionality

### 2. Internal Level (`INTERNAL_API_KEY`)
- **Endpoints**: 
  - `/api/queue/transactional`
  - `/api/queue/bulk`
  - `/api/queue/status/:jobId`
  - `/api/queue/stats`
- **Purpose**: For transactional emails, bulk operations, and queue monitoring
- **Access**: Full API functionality

### 3. Unauthenticated
- **Endpoints**: `/health`
- **Purpose**: Basic health check for load balancers/monitoring

## Required Environment Variables

Both the queue service and web app need these environment variables:

```bash
# Queue Service API Authentication
QUEUE_API_KEY="your_public_api_key_here"
INTERNAL_API_KEY="your_internal_api_key_here"

# Queue Service URL
QUEUE_SERVICE_URL="http://localhost:3002"  # or your deployed URL
```

## Security Features

1. **Bearer Token Authentication**: All API endpoints require `Authorization: Bearer <token>`
2. **Rate Limiting**: 100 requests per minute per IP address
3. **Security Headers**: 
   - `X-Content-Type-Options: nosniff`
   - `X-Frame-Options: DENY`
   - `X-XSS-Protection: 1; mode=block`
4. **Request Size Limiting**: 1MB maximum request body
5. **CORS Configuration**: Only allows configured origins
6. **Data Sanitization**: Sensitive credentials are stripped from job status responses

## Usage Examples

### Adding a Newsletter Job (Web App)
```bash
curl -X POST http://localhost:3002/api/queue/newsletter \
  -H "Authorization: Bearer ${QUEUE_API_KEY}" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user123",
    "subject": "Newsletter Title",
    "htmlContent": "<html>...</html>",
    "recipients": [...],
    "sendingProviderId": "brevo",
    "providerConfig": {...}
  }'
```

### Getting Job Status (Internal)
```bash
curl -X GET http://localhost:3002/api/queue/status/job123 \
  -H "Authorization: Bearer ${INTERNAL_API_KEY}"
```

### Health Check (No Auth)
```bash
curl -X GET http://localhost:3002/health
```

## Deployment Notes

1. **Generate Strong API Keys**: Use cryptographically secure random strings
2. **Use Environment Variables**: Never commit API keys to version control
3. **Configure CORS**: Set `ALLOWED_ORIGINS` environment variable for production
4. **Use HTTPS**: Always use HTTPS in production
5. **Monitor Rate Limits**: Adjust rate limiting based on your usage patterns

## Error Responses

- **401 Unauthorized**: Missing or invalid `Authorization` header
- **403 Forbidden**: Valid token but insufficient permissions
- **429 Too Many Requests**: Rate limit exceeded
- **400 Bad Request**: Invalid request data
- **500 Internal Server Error**: Server error

## Web App Integration

The web app automatically uses the configured API keys from environment variables. The `QueueServiceClient` class handles authentication automatically:

```typescript
// Web app automatically uses QUEUE_API_KEY or INTERNAL_API_KEY
const result = await queueClient.addNewsletterJob(jobData);
```

The web app will use `QUEUE_API_KEY` for public endpoints and `INTERNAL_API_KEY` for internal endpoints.

## Test Results

✅ **Authentication Test Results:**
- Health check (no auth): ✅ Working
- Newsletter endpoint without auth: ✅ Correctly rejected (401 Unauthorized)
- Newsletter endpoint with wrong auth: ✅ Correctly rejected (403 Forbidden)
- Newsletter endpoint with correct auth: ✅ Working
- Stats endpoint with public key: ✅ Correctly rejected (403 Forbidden)
- Stats endpoint with internal key: ✅ Working

## Implementation Summary

The Queue Service is now **fully secured** with the following features:

1. **Required Environment Variables**: Service won't start without `QUEUE_API_KEY` and `INTERNAL_API_KEY`
2. **Bearer Token Authentication**: All API endpoints require proper authorization headers
3. **Tiered Access Control**: Different endpoints require different permission levels
4. **Rate Limiting**: 100 requests per minute per IP address
5. **Security Headers**: Protection against common web vulnerabilities
6. **Data Sanitization**: Sensitive credentials are stripped from responses
7. **Request Validation**: All endpoints validate required fields
8. **CORS Configuration**: Configurable allowed origins for production

The web app (`QueueServiceClient`) automatically handles authentication using the configured API keys.

---

# Queue Service Authentication
