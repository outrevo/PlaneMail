# PlaneMail Zapier Integration

A comprehensive Zapier integration for PlaneMail that enables powerful email marketing automation workflows.

## Overview

This Zapier integration allows PlaneMail users to connect their email marketing with thousands of other apps, creating powerful automation workflows. It follows industry standards set by platforms like Mailchimp, ConvertKit, and other leading email marketing services.

## Features

### 🔄 **Triggers** (When something happens in PlaneMail)
- **New Subscriber** - When someone subscribes to your list
- **New Unsubscriber** - When someone unsubscribes  
- **Subscriber Tagged** - When a subscriber is added to a segment
- **Subscriber Untagged** - When a subscriber is removed from a segment
- **Post Published** - When a new post is published to the web
- **Post Sent** - When a post is sent via email to subscribers
- **New Segment** - When a new segment (tag) is created

### ⚡ **Actions** (What PlaneMail can do)
- **Add Subscriber** - Add new subscribers to your list
- **Update Subscriber** - Update subscriber information and segments
- **Create Segment** - Create new segments (tags)
- **Tag Subscriber** - Add subscribers to segments
- **Untag Subscriber** - Remove subscribers from segments

### 🔍 **Searches** (Find existing data)
- **Find Subscriber** - Search for subscribers by email
- **List Segments** - Get all available segments (used for dropdowns)

## Popular Use Cases

### Lead Generation & CRM Integration
- **Google Sheets → PlaneMail**: Add new sheet rows as subscribers
- **Facebook Lead Ads → PlaneMail**: Auto-add leads to your email list
- **HubSpot → PlaneMail**: Sync contacts between platforms
- **Typeform → PlaneMail**: Add form submissions as subscribers

### E-commerce & Customer Lifecycle
- **Stripe → PlaneMail**: Add new customers to email sequences
- **Shopify → PlaneMail**: Tag customers based on purchase behavior
- **WooCommerce → PlaneMail**: Segment customers by order value

### Content & Social Media
- **PlaneMail → Buffer**: Auto-share new posts on social media
- **PlaneMail → Slack**: Notify team when posts are published
- **Ghost → PlaneMail**: Cross-publish content between platforms

### Analytics & Reporting
- **PlaneMail → Google Analytics**: Track email campaign performance
- **PlaneMail → Airtable**: Log email metrics and subscriber data
- **PlaneMail → Google Sheets**: Export subscriber lists for analysis

## Authentication

The integration uses API Key authentication. Users need to:

1. Go to PlaneMail Dashboard → Settings → API Keys
2. Create a new API key with appropriate permissions
3. Copy the key and paste it into the Zapier connection form

API keys support:
- Rate limiting (1000 requests per 15 minutes)
- Scoped permissions 
- Expiration dates
- Usage tracking

## Webhook System

PlaneMail uses a robust webhook system for real-time triggers:

- **Reliable delivery** with retry logic
- **10-second timeout** for webhook endpoints
- **Event filtering** - only relevant webhooks are triggered
- **Payload verification** with timestamps and user IDs
- **Automatic cleanup** when Zaps are deleted

### Webhook Payload Example
```json
{
  "event": "subscriber.created",
  "data": {
    "subscriber": {
      "id": "sub_1234567890",
      "email": "john@example.com",
      "name": "John Doe",
      "status": "active",
      "dateAdded": "2025-01-15T10:30:00Z"
    }
  },
  "timestamp": "2025-01-15T10:30:00Z",
  "userId": "user_1234567890"
}
```

## API Endpoints

The integration uses the following PlaneMail API endpoints:

### Subscribers
- `GET /api/v1/subscribers` - List subscribers
- `POST /api/v1/subscribers` - Add new subscriber  
- `GET /api/v1/subscribers/{id}` - Get subscriber details
- `PATCH /api/v1/subscribers/{id}` - Update subscriber

### Segments
- `GET /api/v1/segments` - List segments
- `POST /api/v1/segments` - Create new segment

### Webhooks
- `GET /api/v1/webhooks` - List webhooks
- `POST /api/v1/webhooks` - Create webhook
- `DELETE /api/v1/webhooks` - Delete webhook

### Posts (read-only for triggers)
- `GET /api/v1/posts` - List posts

## Installation & Development

### Prerequisites
- Node.js v18+
- Zapier CLI (`npm install -g zapier-platform-cli`)
- PlaneMail API key

### Setup
```bash
# Clone and install
cd zapier-integration
npm install

# Login to Zapier
zapier login

# Test authentication
zapier test --debug

# Push to Zapier (private app)
zapier push
```

### Testing
```bash
# Test all triggers and actions
zapier test

# Test specific trigger
zapier test --grep "newSubscriber"

# Test with debug output
zapier test --debug
```

## Error Handling

The integration includes comprehensive error handling:

- **Rate Limiting**: Returns 429 status with retry headers
- **Authentication**: Clear error messages for invalid API keys
- **Validation**: Detailed field validation with helpful messages
- **Network Issues**: Graceful timeout and retry handling
- **Data Conflicts**: Clear messaging for duplicate entries

## Performance & Scalability

- **Efficient API Usage**: Minimal API calls with intelligent caching
- **Bulk Operations**: Support for batch operations where possible
- **Rate Limit Compliance**: Built-in rate limiting respect
- **Optimized Payloads**: Only essential data in webhook payloads
- **Background Processing**: Non-blocking webhook delivery

## Security

- **API Key Rotation**: Support for seamless key rotation
- **Webhook Verification**: Timestamp and signature verification
- **Data Minimization**: Only necessary data in API responses
- **HTTPS Only**: All API communications over HTTPS
- **Input Sanitization**: All user inputs are validated and sanitized

## Support & Documentation

### For Users
- Complete setup guides in PlaneMail dashboard
- Video tutorials for common workflows
- Template gallery with pre-built Zaps
- Email support for integration issues

### For Developers
- Comprehensive API documentation
- Webhook testing tools
- Postman collection
- Code examples in multiple languages

## Comparison with Competitors

| Feature | PlaneMail | Mailchimp | ConvertKit | Beehiiv |
|---------|-----------|-----------|------------|---------|
| Real-time webhooks | ✅ | ✅ | ✅ | ❌ |
| Segment management | ✅ | ✅ | ✅ | Limited |
| Post triggers | ✅ | ❌ | ❌ | ❌ |
| API rate limiting | ✅ | ✅ | ✅ | ✅ |
| Bulk operations | ✅ | ✅ | Limited | ❌ |
| Custom fields | ✅ | ✅ | ✅ | Limited |

## Roadmap

### Phase 2 Features
- **Advanced Triggers**
  - Link click tracking
  - Email open tracking  
  - Campaign performance metrics
  - Subscriber engagement scoring

- **Enhanced Actions**
  - Bulk subscriber operations
  - Custom field management
  - Advanced segmentation rules
  - A/B test management

- **Analytics Integration**
  - Revenue tracking
  - Conversion attribution
  - Engagement analytics
  - Deliverability metrics

### Phase 3 Features
- **AI-Powered Actions**
  - Smart segmentation
  - Send time optimization
  - Content recommendations
  - Spam score checking

- **Advanced Workflows**
  - Multi-step sequences
  - Conditional logic
  - Time delays
  - Goal tracking

## Contributing

This integration is maintained by the PlaneMail team. For feature requests or bug reports:

1. Contact support@planemail.in
2. Use the feedback form in the PlaneMail dashboard
3. Join our community Discord for real-time help

## License

This Zapier integration is proprietary software owned by PlaneMail. It's provided free to PlaneMail users as part of their subscription.

---

**Ready to automate your email marketing?** 

Get started with PlaneMail's Zapier integration today and connect your email marketing to thousands of apps!
