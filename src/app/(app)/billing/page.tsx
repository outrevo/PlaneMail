
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, CreditCard, ExternalLink, ShieldCheck, Zap, ArrowRight, Github, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { getSubscriptionStatus, type SubscriptionStatus } from './actions';
import { Separator } from '@/components/ui/separator';

export default async function BillingPage() {
  const subscriptionData: SubscriptionStatus | null = await getSubscriptionStatus();

  return (
    <div className="max-w-4xl mx-auto space-y-8 font-mono">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Billing</h1>
        <p className="text-neutral-600">
          Manage your subscription and payment details. Open source, transparent pricing.
        </p>
      </div>

      {subscriptionData ? (
        /* Active Subscription */
        <div className="border border-neutral-200 rounded-lg bg-white">
          <div className="p-6 border-b border-neutral-200">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold">Current Plan</h2>
                <p className="text-neutral-600 text-sm mt-1">
                  Your active subscription details
                </p>
              </div>
              <div className="flex items-center gap-2">
                {subscriptionData.status === 'trialing' && (
                  <div className="bg-green-100 text-green-800 px-3 py-1 text-xs font-medium rounded-full flex items-center gap-1">
                    <Sparkles className="h-3 w-3" />
                    Free Trial
                  </div>
                )}
                <div className={`px-3 py-1 text-xs font-medium rounded-full ${
                  subscriptionData.status === 'active' || subscriptionData.status === 'trialing' 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  {subscriptionData.status.charAt(0).toUpperCase() + subscriptionData.status.slice(1)}
                </div>
              </div>
            </div>
          </div>
          
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <div className="space-y-1">
                <p className="text-xs text-neutral-500 uppercase tracking-wide">Plan</p>
                <p className="text-lg font-bold">{subscriptionData.planName}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-neutral-500 uppercase tracking-wide">Status</p>
                <p className="text-lg font-medium">
                  {subscriptionData.status === 'trialing' ? 'Trial Active' : 
                   subscriptionData.status === 'active' ? 'Active' : 'Inactive'}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-neutral-500 uppercase tracking-wide">
                  {subscriptionData.status === 'trialing' ? 'Trial Ends' : 'Next Billing'}
                </p>
                <p className="text-lg font-medium">
                  {subscriptionData.renewsAt || subscriptionData.currentPeriodEnd || 'N/A'}
                </p>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3">
              <Button 
                asChild 
                variant="outline" 
                className="border-black/20 hover:border-black/40 font-mono"
              >
                <a href={subscriptionData.manageBillingUrl || '#'} target="_blank" rel="noopener noreferrer">
                  Manage Billing
                  <ExternalLink className="ml-2 h-4 w-4" />
                </a>
              </Button>
              
              {subscriptionData.canUpgrade && (
                <Button asChild className="bg-black hover:bg-black/90 text-white font-mono">
                  <Link href="/pricing">
                    Upgrade Plan
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              )}
            </div>
            
            {subscriptionData.status === 'trialing' && (
              <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-start gap-3">
                  <Sparkles className="h-5 w-5 text-green-600 mt-0.5" />
                  <div>
                    <h3 className="font-medium text-green-900">Trial Active</h3>
                    <p className="text-sm text-green-700 mt-1">
                      You're currently in your free trial period. No charges will occur until your trial ends.
                      You can cancel anytime during the trial with no fees.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
                /* No Subscription */
        <div className="border border-neutral-200 rounded-lg bg-white">
          <div className="p-6 border-b border-neutral-200">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              <div>
                <h2 className="text-xl font-bold">No Active Subscription</h2>
                <p className="text-neutral-600 text-sm mt-1">
                  Start your PlaneMail journey with a 14-day free trial
                </p>
              </div>
            </div>
          </div>
          
          <div className="p-6">
            <div className="space-y-4">
              <p className="text-neutral-600">
                Choose a plan to unlock PlaneMail's full potential. All plans include a 14-day free trial 
                with no credit card required upfront.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-3">
                <Button asChild className="bg-black hover:bg-black/90 text-white font-mono">
                  <Link href="/pricing">
                    Start Free Trial
                    <Sparkles className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                
                <Button asChild variant="outline" className="border-black/20 hover:border-black/40 font-mono">
                  <a href="https://github.com/outrevo/PlaneMail" target="_blank" rel="noopener noreferrer">
                    <Github className="mr-2 h-4 w-4" />
                    Self-Host (Free)
                  </a>
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Open Source Info */}
      <div className="border border-neutral-200 rounded-lg bg-neutral-50">
        <div className="p-6">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0">
              <Github className="h-6 w-6" />
            </div>
            <div className="space-y-2">
              <h3 className="font-bold">Open Source Alternative</h3>
              <p className="text-sm text-neutral-600">
                PlaneMail is fully open source under the MIT license. Self-host for free with unlimited 
                subscribers and complete control over your data.
              </p>
              <div className="flex flex-col sm:flex-row gap-2 mt-3">
                <Button asChild variant="outline" size="sm" className="border-black/20 hover:border-black/40 font-mono">
                  <a href="https://github.com/outrevo/PlaneMail" target="_blank" rel="noopener noreferrer">
                    View Source Code
                    <ExternalLink className="ml-2 h-3 w-3" />
                  </a>
                </Button>
                <Button asChild variant="outline" size="sm" className="border-black/20 hover:border-black/40 font-mono">
                  <Link href="/docs">
                    Deployment Guide
                    <ArrowRight className="ml-2 h-3 w-3" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Security Info */}
      <div className="border border-blue-200 rounded-lg bg-blue-50">
        <div className="p-6">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0">
              <ShieldCheck className="h-6 w-6 text-blue-600" />
            </div>
            <div className="space-y-2">
              <h3 className="font-bold text-blue-900">Secure Payments</h3>
              <p className="text-sm text-blue-700">
                All payments are securely processed by{' '}
                <a 
                  href="https://paddle.com" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="font-medium underline hover:text-blue-800"
                >
                  Paddle.com
                </a>
                , our merchant of record. PlaneMail never stores your payment information.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
