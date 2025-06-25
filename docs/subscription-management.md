# Subscription Management with Paddle

This document explains how the subscription system works with the `user_subscriptions` table and Paddle integration.

## Database Schema

### user_subscriptions Table

```sql
CREATE TABLE user_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR(255) NOT NULL REFERENCES app_users(clerk_user_id) ON DELETE CASCADE UNIQUE,
  paddle_subscription_id TEXT UNIQUE,
  paddle_plan_id TEXT,
  status VARCHAR(50) NOT NULL,
  current_period_start TIMESTAMP,
  current_period_end TIMESTAMP,
  cancel_at_period_end BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);
```

### Relationship with app_users

- Each user can have **one subscription** (enforced by UNIQUE constraint on `user_id`)
- Subscription is linked via `clerk_user_id` from the `app_users` table
- Cascade delete: if user is deleted, their subscription is also deleted

## Subscription Status Values

- `trialing` - User is in 14-day free trial
- `active` - Paid subscription is active
- `paused` - Subscription is temporarily paused
- `canceled` - Subscription has been canceled
- `past_due` - Payment failed, subscription past due

## Paddle Integration Flow

### 1. Trial Signup Process

```typescript
// User clicks "Start 14-Day Free Trial"
await openPaddleCheckout({
  priceId: PADDLE_PRICE_IDS.hosted,
  customer: {
    email: user.emailAddresses[0].emailAddress,
    name: user.fullName,
  },
  customData: {
    user_email: user.emailAddresses[0].emailAddress,
    user_id: user.id, // Clerk user ID
    plan_name: 'Hosted',
    has_trial: true,
  },
});
```

### 2. Webhook Processing

When Paddle sends webhooks, the system:

1. **subscription.created**: Creates or updates `user_subscriptions` record
2. **subscription.updated**: Updates plan, status, billing periods
3. **subscription.canceled**: Marks subscription as canceled
4. **subscription.paused/resumed**: Updates status accordingly

### 3. Database Operations

```typescript
// Create subscription
await db.insert(userSubscriptions).values({
  userId: clerkUserId,
  paddleSubscriptionId: subscription.id,
  paddlePlanId: priceId,
  status: 'trialing',
  currentPeriodStart: new Date(),
  currentPeriodEnd: trialEndsAt,
  cancelAtPeriodEnd: false,
});

// Update subscription
await db.update(userSubscriptions).set({
  status: 'active',
  currentPeriodEnd: new Date(subscription.next_billed_at),
  updatedAt: new Date(),
}).where(eq(userSubscriptions.paddleSubscriptionId, subscription.id));
```

## Helper Functions

### checkSubscriptionAccess(clerkUserId)

Returns detailed subscription access information:

```typescript
{
  hasAccess: boolean,      // Can user access paid features?
  plan: 'free' | 'hosted' | 'pro' | 'enterprise',
  status: string,          // Current subscription status
  trialEndsAt: Date | null,
  isTrialing: boolean,
  subscription: object     // Full subscription data
}
```

### getUserSubscription(clerkUserId)

Returns the full subscription record with user relationship.

### cancelSubscription(clerkUserId)

Marks subscription for cancellation at period end.

## React Integration

### useSubscription Hook

```typescript
import { useSubscription } from '@/hooks/use-subscription';

function MyComponent() {
  const { 
    subscriptionStatus, 
    isLoading, 
    hasAccess, 
    plan, 
    isTrialing,
    trialEndsAt 
  } = useSubscription();

  if (isLoading) return <div>Loading...</div>;
  
  if (!hasAccess) {
    return <UpgradePrompt />;
  }

  return <PaidFeature />;
}
```

### Server Actions

```typescript
import { getUserSubscriptionStatus } from '@/app/actions/subscription';

// In server component or API route
const result = await getUserSubscriptionStatus(user.id);
if (result.success) {
  const { hasAccess, plan, isTrialing } = result.data;
  // Use subscription data
}
```

## Plan Types and Features

### Free (No Subscription)
- Basic features only
- Limited functionality

### Hosted ($19/month)
- Up to 10,000 subscribers
- Managed hosting
- Premium templates
- Email support

### Pro ($99/month)
- Unlimited subscribers
- Advanced analytics
- A/B testing
- Priority support

### Enterprise (Custom)
- White-label solution
- Custom integrations
- Dedicated support

## Trial Period

- **Duration**: 14 days from subscription creation
- **Access**: Full features of chosen plan
- **Billing**: No charge during trial
- **Cancellation**: Can cancel anytime during trial with no charge
- **Conversion**: Automatically converts to paid after trial unless canceled

## Common Patterns

### Protecting Paid Features

```typescript
// In server component
import { checkSubscriptionAccess } from '@/app/api/paddle/webhook/actions';

export default async function PaidFeature({ userId }: { userId: string }) {
  const access = await checkSubscriptionAccess(userId);
  
  if (!access.hasAccess) {
    return <UpgradePrompt currentPlan={access.plan} />;
  }

  return <FeatureContent />;
}
```

### Checking Feature Limits

```typescript
function checkSubscriberLimit(plan: string, currentCount: number): boolean {
  switch (plan) {
    case 'hosted':
      return currentCount < 10000;
    case 'pro':
    case 'enterprise':
      return true; // Unlimited
    default:
      return currentCount < 100; // Free tier limit
  }
}
```

### Trial Expiration Handling

```typescript
function TrialExpirationBanner({ trialEndsAt }: { trialEndsAt: Date }) {
  const daysLeft = Math.ceil((trialEndsAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  
  if (daysLeft <= 0) {
    return <div className="alert">Your trial has expired. Please upgrade to continue.</div>;
  }
  
  return (
    <div className="alert">
      Your trial expires in {daysLeft} days. 
      <Button onClick={() => window.location.href = '/pricing'}>
        Upgrade Now
      </Button>
    </div>
  );
}
```

## Error Handling

### Webhook Failures

- Failed webhooks are logged with error details
- Manual reconciliation may be needed for failed webhook processing
- Check logs for subscription mismatches

### Database Consistency

- Unique constraints prevent duplicate subscriptions
- Foreign key constraints ensure data integrity
- Transactions ensure atomic operations

### Common Issues

1. **User not found**: Webhook received but user doesn't exist in database
2. **Subscription mismatch**: Paddle subscription doesn't match database record
3. **Plan ID mismatch**: Environment variables not matching Paddle dashboard

## Monitoring and Analytics

### Key Metrics to Track

- Trial conversion rate
- Churn rate by plan
- Revenue by plan type
- Trial duration usage

### Database Queries

```sql
-- Active subscriptions by plan
SELECT paddle_plan_id, COUNT(*) 
FROM user_subscriptions 
WHERE status IN ('active', 'trialing') 
GROUP BY paddle_plan_id;

-- Trial conversion rate
SELECT 
  COUNT(CASE WHEN status = 'active' THEN 1 END) as converted,
  COUNT(CASE WHEN status = 'canceled' THEN 1 END) as churned,
  COUNT(*) as total_trials
FROM user_subscriptions 
WHERE created_at >= NOW() - INTERVAL '30 days';
```

## Testing

### Local Testing

1. Use Paddle sandbox environment
2. Test webhooks with ngrok or similar
3. Verify database updates after each webhook

### Production Deployment

1. Update environment variables for production Paddle
2. Configure production webhook URLs
3. Monitor webhook delivery and processing
