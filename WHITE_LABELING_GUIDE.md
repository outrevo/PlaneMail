# White-Labeling Implementation Guide

This guide explains how the white-labeling feature works in PlaneMail, allowing users to use their own custom domains for their newsletter pages.

## Overview

The white-labeling feature allows users to:
- Add custom domains (e.g., `newsletter.yourdomain.com`)
- Serve their newsletter content on their own domain
- Maintain their brand identity with custom CSS, headers, and footers
- Automatically provision SSL certificates for custom domains

## Architecture

### 1. Database Schema

#### Custom Domains Table
```sql
CREATE TABLE custom_domains (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR(255) NOT NULL REFERENCES app_users(clerk_user_id),
  domain VARCHAR(255) NOT NULL UNIQUE,
  status VARCHAR(50) NOT NULL DEFAULT 'pending', -- pending, verified, active, failed
  verification_token VARCHAR(100),
  verified_at TIMESTAMP,
  ssl_status VARCHAR(50) DEFAULT 'pending', -- pending, issued, renewed, failed
  ssl_issued_at TIMESTAMP,
  ssl_expires_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### Site Settings Table
The existing `public_site_settings` table stores customization options per user:
- Site name, description, logo
- Custom CSS/JS
- Header/footer content
- Brand colors

### 2. Caddy Integration

#### Automatic SSL
- Caddy automatically provisions SSL certificates for verified domains
- Certificates are stored in PostgreSQL via the `caddy_certificates` table
- On-demand TLS is enabled for custom domains

#### Domain Configuration
The `caddy-domain-manager.sh` script helps manage domains:
```bash
# Update Caddy configuration with verified domains
./scripts/caddy-domain-manager.sh update

# Verify DNS configuration for a domain
./scripts/caddy-domain-manager.sh verify newsletter.example.com

# Test SSL certificate
./scripts/caddy-domain-manager.sh test-ssl newsletter.example.com

# Check status of all domains
./scripts/caddy-domain-manager.sh status
```

### 3. Next.js Middleware

#### Custom Domain Detection
The middleware in `src/middleware.ts` handles custom domains:
- Detects custom domains via the `x-custom-domain` header set by Caddy
- Validates domain ownership against the database
- Sets appropriate headers for the application

#### Request Flow
1. User visits `newsletter.example.com/p/my-post`
2. Caddy sets `x-custom-domain: newsletter.example.com` header
3. Middleware validates the domain and finds the associated user
4. Request is processed with user-specific context

### 4. Application Logic

#### Domain-Aware Pages
Public pages (`/p/[slug]`, `/archive`) check for custom domain headers:
- Use domain-specific user context
- Apply custom site settings
- Filter content to the domain owner

#### API Routes
Public API routes respect custom domain context:
- Newsletter signup associates with the correct user
- Analytics track views for the domain owner

## Setup Process

### For Users (via UI)

1. **Add Domain**: Users enter their custom domain in Settings > Site > Domains
2. **DNS Configuration**: Users create a CNAME record:
   ```
   newsletter.example.com CNAME planemail.app
   ```
3. **Verification**: Click "Verify" to check DNS configuration
4. **Activation**: Domain becomes active after verification

### For Administrators

1. **Database Migration**: Run the custom domains migration:
   ```bash
   psql -f drizzle/manual-migrations/custom_domains.sql
   ```

2. **Caddy Configuration**: Ensure Caddy is configured for on-demand TLS:
   ```caddyfile
   {
     on_demand_tls {
       ask http://app:3000/api/caddy/domain-auth
     }
   }
   ```

3. **Environment Variables**: Set required variables:
   ```env
   CADDY_ON_DEMAND=true
   POSTGRES_HOST=db
   POSTGRES_PORT=5432
   POSTGRES_DB=planemail
   POSTGRES_USER=planemail
   POSTGRES_PASSWORD=your_password
   ```

## Security Considerations

### Domain Verification
- DNS verification ensures domain ownership
- Verification tokens prevent unauthorized domain claims
- Only verified domains are added to Caddy configuration

### SSL Certificate Management
- Certificates are automatically renewed by Caddy
- Failed renewals are logged and monitored
- Rate limiting prevents certificate abuse

### Access Control
- Custom domains only serve public content
- Admin routes remain on the main domain
- User isolation is maintained through database queries

## Monitoring and Maintenance

### Health Checks
The `ssl-monitor.sh` script monitors:
- SSL certificate expiration
- Domain accessibility
- Certificate renewal failures

### Logs
Important logs to monitor:
- Caddy access logs for custom domains
- Certificate issuance/renewal logs
- Application logs for custom domain requests

### Troubleshooting

#### Common Issues

1. **Domain Not Working**
   - Check DNS configuration with `dig CNAME newsletter.example.com`
   - Verify domain status in database
   - Check Caddy logs for errors

2. **SSL Certificate Issues**
   - Check certificate status in database
   - Verify domain is publicly accessible
   - Check Caddy certificate logs

3. **Content Not Loading**
   - Verify user has published posts
   - Check middleware headers are set correctly
   - Ensure database queries include user filter

#### Debug Commands
```bash
# Check domain DNS
dig CNAME newsletter.example.com

# Test domain accessibility
curl -I https://newsletter.example.com

# Check Caddy configuration
docker exec caddy caddy list-certificates

# View application logs
docker logs planemail-app

# Check database domain status
psql -c "SELECT * FROM custom_domains WHERE domain = 'newsletter.example.com';"
```

## Future Enhancements

### Planned Features
- Automatic DNS verification via API
- Custom domain analytics dashboard
- Subdomain support (auto-creation)
- CDN integration for better performance
- White-label admin interface

### API Improvements
- Webhook notifications for domain events
- Bulk domain management API
- Domain transfer between users
- Advanced SSL configuration options

## API Reference

### Custom Domain Management

#### Get Domains
```typescript
GET /api/domains
Authorization: Bearer <token>

Response: CustomDomainType[]
```

#### Add Domain
```typescript
POST /api/domains
Authorization: Bearer <token>
Body: { domain: string }

Response: { success: boolean, message: string, verificationToken?: string }
```

#### Verify Domain
```typescript
POST /api/domains/:id/verify
Authorization: Bearer <token>

Response: { success: boolean, message: string }
```

#### Remove Domain
```typescript
DELETE /api/domains/:id
Authorization: Bearer <token>

Response: { success: boolean, message: string }
```

### Domain Authentication (for Caddy)

#### Domain Auth Check
```typescript
GET /api/caddy/domain-auth?domain=newsletter.example.com

Response: 200 OK (allowed) | 403 Forbidden (not allowed)
```

This endpoint is called by Caddy to verify if a domain should receive an SSL certificate.

---

This implementation provides a complete white-labeling solution that scales with your user base while maintaining security and performance standards.
