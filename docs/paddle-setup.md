# Paddle Integration Setup Guide

This guide will help you set up Paddle payment processing with 14-day free trials for PlaneMail.

## Prerequisites

1. A Paddle account (sandbox or production)
2. Paddle API key
3. Paddle client token (for frontend)

## Environment Variables

Add these variables to your `.env.local` file:

```bash
# Paddle Configuration
PADDLE_API_ENV=sandbox # or production
PADDLE_API_KEY=your_paddle_api_key_here

# Public Paddle Configuration (for client-side)
NEXT_PUBLIC_PADDLE_CLIENT_TOKEN=your_paddle_client_token_here
NEXT_PUBLIC_PADDLE_HOSTED_PRICE_ID=your_hosted_plan_price_id
NEXT_PUBLIC_PADDLE_PRO_PRICE_ID=your_pro_plan_price_id
NEXT_PUBLIC_PADDLE_ENTERPRISE_PRICE_ID=your_enterprise_plan_price_id

# Server-side Paddle Price IDs (for webhooks)
PADDLE_HOSTED_PRICE_ID=your_hosted_plan_price_id
PADDLE_PRO_PRICE_ID=your_pro_plan_price_id
PADDLE_ENTERPRISE_PRICE_ID=your_enterprise_plan_price_id

# Paddle Webhook Secret (optional but recommended)
PADDLE_WEBHOOK_SECRET=your_paddle_webhook_secret
```

## Setup Steps

### 1. Create Products and Prices

Run the setup script to automatically create products with 14-day trials:

```bash
npm run paddle:setup
```

This will create:
- **PlaneMail Hosted** ($19/month with 14-day trial)
- **PlaneMail Pro** ($99/month with 14-day trial)  
- **PlaneMail Enterprise** ($299/month with 14-day trial)

### 2. Update Environment Variables

After running the setup script, it will output the price IDs. Add them to your `.env.local` file.

### 3. Configure Webhooks

1. Go to your Paddle dashboard
2. Navigate to Developer Tools → Webhooks
3. Add a new webhook endpoint: `https://yourdomain.com/api/paddle/webhook`
4. Select these events:
   - `subscription.created`
   - `subscription.updated`
   - `subscription.canceled`
   - `subscription.paused`
   - `subscription.resumed`
   - `transaction.completed`

### 4. Test the Integration

1. Visit `/pricing` page
2. Click "Start 14-Day Free Trial" on any plan
3. Complete the checkout process
4. Verify webhook events are received

## Available Scripts

- `npm run paddle:setup` - Create products and prices with trials
- `npm run paddle:list` - List all products and prices
- `npm run paddle:list-products` - List products only

## Trial Configuration

- **Trial Period**: 14 days
- **Trial Start**: Immediately upon subscription creation
- **Trial End**: Automatic billing begins after 14 days
- **Cancellation**: Users can cancel during trial with no charge

## Pricing Plans

### Hosted Plan - $19/month
- 14-day free trial
- Up to 10,000 subscribers
- Managed hosting
- Your own email provider
- Premium templates
- Email support

### Pro Plan - $99/month
- 14-day free trial
- Unlimited subscribers
- Unlimited emails
- Priority support
- A/B testing
- Custom domains
- Team collaboration

### Enterprise Plan - Custom Pricing
- Contact sales for pricing
- White-label solution
- Custom integrations
- Dedicated support
- SLA guarantees

## Webhook Handling

The webhook endpoint at `/api/paddle/webhook` handles:

- **Subscription Creation**: Sets up user subscription and trial period
- **Subscription Updates**: Updates plan changes and billing cycles
- **Subscription Cancellation**: Handles plan cancellations
- **Transaction Completion**: Processes successful payments

## Database Schema

You'll need to add subscription fields to your user schema:

```sql
ALTER TABLE users ADD COLUMN subscription_id VARCHAR(255);
ALTER TABLE users ADD COLUMN subscription_status VARCHAR(50);
ALTER TABLE users ADD COLUMN plan_type VARCHAR(50);
ALTER TABLE users ADD COLUMN trial_ends_at TIMESTAMP;
ALTER TABLE users ADD COLUMN subscription_ends_at TIMESTAMP;
```

## Security Notes

- Always verify webhook signatures in production
- Keep your API keys secure and never expose them in client-side code
- Use HTTPS for all webhook endpoints
- Implement proper error handling and logging

## Troubleshooting

### Common Issues

1. **Price ID not found**: Ensure environment variables are set correctly
2. **Checkout fails**: Check Paddle client token and environment
3. **Webhooks not received**: Verify webhook URL and events configuration
4. **Trial not working**: Check trial period configuration in Paddle dashboard

### Debug Commands

```bash
# List all products and prices
npm run paddle:list

# Check environment variables
node -e "console.log(process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN)"
```

## Support

For Paddle-specific issues, check the [Paddle Documentation](https://docs.paddle.com/) or contact Paddle support.

For PlaneMail integration issues, check the webhook logs and ensure your database schema includes the necessary subscription fields.
