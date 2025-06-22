
import { PageHeader } from '@/components/common/PageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, CreditCard, DollarSign, ExternalLink, ShieldCheck, Zap } from 'lucide-react';
import Link from 'next/link';
import { getSubscriptionStatus, type SubscriptionStatus } from './actions';
import { Separator } from '@/components/ui/separator';

export default async function BillingPage() {
  const subscriptionData: SubscriptionStatus | null = await getSubscriptionStatus();

  return (
    <div className="space-y-8">
      <PageHeader
        title="Billing & Subscription"
        description="Manage your PlaneMail plan and payment details."
      />

      {subscriptionData ? (
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <CreditCard className="h-5 w-5 text-primary" />
              Current Subscription
            </CardTitle>
            <CardDescription>
              Your active plan details. Changes made here may affect your access to features.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 border rounded-md bg-muted/30">
              <div>
                <p className="text-sm text-muted-foreground">Current Plan</p>
                <p className="text-lg font-semibold text-foreground">{subscriptionData.planName}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Status</p>
                <p className={`text-lg font-semibold ${subscriptionData.status === 'active' || subscriptionData.status === 'trialing' ? 'text-green-600' : 'text-red-600'}`}>
                  {subscriptionData.status.charAt(0).toUpperCase() + subscriptionData.status.slice(1)}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Renews / Ends On</p>
                <p className="text-lg font-semibold text-foreground">
                  {subscriptionData.renewsAt || subscriptionData.currentPeriodEnd || 'N/A'}
                </p>
              </div>
            </div>
            
            <Separator className="my-6" />

            <div className="space-y-3">
                <h3 className="text-md font-semibold text-foreground">Manage Your Subscription</h3>
                <p className="text-sm text-muted-foreground">
                    Use the Paddle Customer Portal to update your payment method, view invoices, or cancel your subscription.
                </p>
                <Button asChild variant="outline" className="w-full sm:w-auto">
                    <a href={subscriptionData.manageBillingUrl || '#'} target="_blank" rel="noopener noreferrer">
                        Manage Billing via Paddle <ExternalLink className="ml-2 h-4 w-4" />
                    </a>
                </Button>
            </div>

            {subscriptionData.canUpgrade && (
                 <div className="pt-4">
                    <Separator className="my-6" />
                    <h3 className="text-md font-semibold text-foreground">Upgrade Your Plan</h3>
                    <p className="text-sm text-muted-foreground mb-3">
                        Unlock more features and increase your limits by upgrading your plan.
                    </p>
                    <Button asChild className="w-full sm:w-auto bg-accent hover:bg-accent/90 text-accent-foreground">
                        <Link href="/pricing">
                            View Pricing & Upgrade <Zap className="ml-2 h-4 w-4" />
                        </Link>
                    </Button>
                </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-destructive"/> Error Loading Subscription
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              We couldn't load your subscription details at the moment. Please try again later or contact support.
            </p>
          </CardContent>
        </Card>
      )}
      
      <Card className="border-blue-500/30 bg-blue-500/5">
        <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-700 dark:text-blue-400">
                <ShieldCheck className="h-5 w-5"/> Secure Billing
            </CardTitle>
        </CardHeader>
        <CardContent>
            <p className="text-sm text-blue-600 dark:text-blue-300">
                Your payment information is securely managed by <a href="https://paddle.com" target="_blank" rel="noopener noreferrer" className="font-semibold underline hover:text-blue-700 dark:hover:text-blue-200">Paddle.com</a>, our merchant of record. PlaneMail does not store your credit card details.
            </p>
        </CardContent>
      </Card>
    </div>
  );
}
