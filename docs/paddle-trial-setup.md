# Paddle Free Trial Configuration Guide

This guide explains how to configure Paddle for true 14-day free trials that don't require a credit card upfront.

## Prerequisites

1. Paddle account (sandbox for testing, production for live)
2. Paddle API key configured in your environment
3. Products and prices created using our setup script

# Paddle Free Trial Configuration Guide

This guide explains how to configure Paddle for true 14-day free trials and the current status of our implementation.

## Current Status ✅

✅ **Fixed Issues:**
- Overlapping badges on pricing cards (positioned correctly now)
- Paddle price creation with 14-day trials
- Updated environment variables with new price IDs
- Improved checkout UX settings

⚠️ **Known Limitation:**
- Paddle currently requires payment method during trial signup
- This is a Paddle platform limitation, not our implementation issue

## Step 1: Understand Paddle Trial Behavior

### How Paddle Trials Work:
1. **Trial Period**: Customer gets 14 days of access
2. **Payment Collection**: Paddle collects payment method during signup
3. **Billing**: No charge during trial, billing starts after trial ends
4. **Cancellation**: Customer can cancel during trial with no charge

### Important Note:
Unlike some other payment processors, Paddle's standard trial implementation requires a payment method upfront. This is by design for their risk management and to reduce trial abuse.

## Step 2: Current Implementation

Our setup script creates prices with proper trial configuration:

```typescript
trial_period: {
  interval: 'day',
  frequency: 14,
}
```

The checkout is optimized for trial-friendly UX:

```typescript
settings: {
  displayMode: 'overlay',
  variant: 'one-page',
  showAddDiscounts: true,
  showAddTaxId: false,
}
```

## Step 3: Test the Current Implementation

### Expected Behavior:
1. **During Trial**: Customer can use all features for 14 days
2. **Payment Required**: Credit card is required at signup (Paddle standard)
3. **No Charge**: No billing occurs during the 14-day trial period
4. **Post-Trial**: Billing begins automatically after trial ends
5. **Cancellation**: Cancel anytime during trial with no charge

### Testing Steps:
1. Run the setup script: `npm run paddle:setup`
2. Verify updated price IDs in `.env.local`
3. Start dev server: `npm run dev`
4. Navigate to `/pricing` and test checkout flow
5. Use Paddle test card numbers for testing

### Test Card Numbers (Sandbox):
- **Visa**: `4000 0000 0000 0002`
- **Mastercard**: `5555 5555 5555 4444`
- **Expiry**: Any future date
- **CVC**: Any 3 digits

## Step 4: Alternatives for No-Card Trials

If you need true no-credit-card trials, consider these approaches:

### Option A: Application-Level Trials
- Implement trial logic in your app instead of Paddle
- Create "trial" subscription status in your database
- Collect payment after trial expires
- More complex but gives full control

### Option B: Free Plan + Upgrade
- Offer a permanent free tier
- Allow users to upgrade to paid plans
- Simpler implementation, no trial complexity

### Option C: Freemium Model
- Limited features for free users
- Unlock full features with subscription
- Common in SaaS applications

## Step 5: Production Configuration

### Before Going Live:
1. Switch `PADDLE_API_ENV` from "sandbox" to "production"
2. Use production API keys and client tokens
3. Re-run setup script: `npm run paddle:setup`
4. Update environment variables with production price IDs
5. Test with real payment methods

### Environment Variables:
```env
# Paddle Configuration
PADDLE_API_ENV=production  # or sandbox
PADDLE_API_KEY=your_production_api_key
NEXT_PUBLIC_PADDLE_CLIENT_TOKEN=your_production_client_token
PADDLE_WEBHOOK_SECRET=your_production_webhook_secret

# Generated Price IDs (from setup script)
NEXT_PUBLIC_PADDLE_HOSTED_PRICE_ID=pri_xxx
NEXT_PUBLIC_PADDLE_PRO_PRICE_ID=pri_xxx  
NEXT_PUBLIC_PADDLE_ENTERPRISE_PRICE_ID=pri_xxx
```

## Step 6: Monitor and Optimize

### Key Metrics to Track:
- Trial signup rate
- Trial to paid conversion rate
- Trial cancellation rate
- Time to first value during trial

### Optimization Tips:
1. **Onboarding**: Guide users to key features quickly
2. **Email Sequence**: Send helpful trial emails
3. **Progress Tracking**: Show trial progress in UI
4. **Value Delivery**: Ensure users see value within trial period

## Troubleshooting

### Issue: Credit Card Required During Trial
**Status**: This is expected Paddle behavior
**Solution**: Educate users that no charge occurs during trial

### Issue: Trial Not Starting
**Solution**: Check that trial period is configured on prices

### Issue: Webhooks Not Working  
**Solution**: Check webhook URL is accessible and secret matches

### Issue: Subscription Not Created
**Solution**: Check webhook handler updates database correctly

## Testing Checklist

Current Implementation:
- [x] Trial subscription created (with payment method)
- [x] Customer can access app features during trial
- [x] No billing during trial period
- [x] Billing starts after trial ends
- [x] Cancellation during trial prevents charges
- [x] Webhook events processed correctly
- [x] Database records created/updated
- [x] UI badges positioned correctly
- [x] Trial messaging accurate

Future Enhancements:
- [ ] Consider application-level trial system
- [ ] Add trial progress indicators
- [ ] Implement trial reminder emails
- [ ] Add trial conversion optimization

## Support

For Paddle-specific issues, check:
- [Paddle Documentation](https://developer.paddle.com/)
- [Paddle Support](https://paddle.com/support/)

For PlaneMail integration issues:
- Check the console for errors
- Review webhook logs in Paddle dashboard
- Verify environment variables are set correctly
