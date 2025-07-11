import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, CreditCard, ExternalLink, ShieldCheck, Zap, ArrowRight, Github, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { getSubscriptionStatus, type SubscriptionStatus } from './actions';
import { Separator } from '@/components/ui/separator';

export default async function BillingPage() {
  const subscriptionData: SubscriptionStatus | null = await getSubscriptionStatus();

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight text-foreground" style={{letterSpacing: '-0.02em'}}>Billing</h1>
        <p className="text-muted-foreground" style={{letterSpacing: '-0.01em'}}>
          Manage your subscription and payment details. Open source, transparent pricing.
        </p>
      </div>

      {subscriptionData ? (
        /* Active Subscription */
        <div className="border border rounded-2xl bg-card shadow-sm">
          <div className="p-6 border-b border">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-foreground" style={{letterSpacing: '-0.01em'}}>Current Plan</h2>
                <p className="text-muted-foreground text-sm mt-1" style={{letterSpacing: '-0.01em'}}>
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
                <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium" style={{letterSpacing: '-0.01em'}}>Plan</p>
                <p className="text-lg font-bold text-foreground" style={{letterSpacing: '-0.01em'}}>{subscriptionData.planName}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium" style={{letterSpacing: '-0.01em'}}>Status</p>
                <p className="text-lg font-medium text-foreground" style={{letterSpacing: '-0.01em'}}>
                  {subscriptionData.status === 'trialing' ? 'Trial Active' : 
                   subscriptionData.status === 'active' ? 'Active' : 'Inactive'}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium" style={{letterSpacing: '-0.01em'}}>
                  {subscriptionData.status === 'trialing' ? 'Trial Ends' : 'Next Billing'}
                </p>
                <p className="text-lg font-medium text-foreground" style={{letterSpacing: '-0.01em'}}>
                  {subscriptionData.renewsAt || subscriptionData.currentPeriodEnd || 'N/A'}
                </p>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3">
              <Button 
                asChild 
                variant="outline" 
                className=" font-medium rounded-lg transition-colors duration-200"
                style={{letterSpacing: '-0.01em'}}
              >
                <a href={subscriptionData.manageBillingUrl || '#'} target="_blank" rel="noopener noreferrer">
                  Manage Billing
                  <ExternalLink className="ml-2 h-4 w-4" />
                </a>
              </Button>
              
              {subscriptionData.canUpgrade && (
                <Button asChild className=" font-medium rounded-lg transition-colors duration-200" style={{letterSpacing: '-0.01em'}}>
                  <Link href="/pricing">
                    Upgrade Plan
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              )}
            </div>
            
            {subscriptionData.status === 'trialing' && (
              <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-xl">
                <div className="flex items-start gap-3">
                  <Sparkles className="h-5 w-5 text-green-600 mt-0.5" />
                  <div>
                    <h3 className="font-medium text-green-900" style={{letterSpacing: '-0.01em'}}>Trial Active</h3>
                    <p className="text-sm text-green-700 mt-1" style={{letterSpacing: '-0.01em'}}>
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
        <div className="border border rounded-2xl bg-card shadow-sm">
          <div className="p-6 border-b border">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              <div>
                <h2 className="text-xl font-bold text-foreground" style={{letterSpacing: '-0.01em'}}>No Active Subscription</h2>
                <p className="text-muted-foreground text-sm mt-1" style={{letterSpacing: '-0.01em'}}>
                  Start your PlaneMail journey with a 14-day free trial
                </p>
              </div>
            </div>
          </div>
          
          <div className="p-6">
            <div className="space-y-4">
              <p className="text-muted-foreground" style={{letterSpacing: '-0.01em'}}>
                Choose a plan to unlock PlaneMail's full potential. All plans include a 14-day free trial 
                with no credit card required upfront.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-3">
                <Button asChild className=" font-medium rounded-lg transition-colors duration-200" style={{letterSpacing: '-0.01em'}}>
                  <Link href="/pricing">
                    Start Free Trial
                    <Sparkles className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                
                <Button asChild variant="outline" className=" font-medium rounded-lg transition-colors duration-200" style={{letterSpacing: '-0.01em'}}>
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
      
      {/* Organization Features Status */}
      {subscriptionData && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <ShieldCheck className="h-5 w-5" />
              <span>Organization Features</span>
            </CardTitle>
            <CardDescription>
              Collaboration and team features available with your plan
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Create Organizations</p>
                  <p className="text-sm text-muted-foreground">
                    {subscriptionData.canCreateOrganizations 
                      ? 'You can create an organization to collaborate with your team' 
                      : 'Upgrade to create organizations and invite team members'
                    }
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  {subscriptionData.canCreateOrganizations ? (
                    <div className="flex items-center space-x-2 text-green-600">
                      <ShieldCheck className="h-4 w-4" />
                      <span className="text-sm font-medium">Available</span>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-2 text-yellow-600">
                      <AlertTriangle className="h-4 w-4" />
                      <span className="text-sm font-medium">Upgrade Required</span>
                    </div>
                  )}
                </div>
              </div>
              
              {!subscriptionData.canCreateOrganizations && (
                <div className="pt-4 border-t">
                  <p className="text-sm text-muted-foreground mb-3">
                    Organization features include:
                  </p>
                  <ul className="text-sm text-muted-foreground space-y-1 mb-4">
                    <li>• Team collaboration and member management</li>
                    <li>• Shared newsletters and subscriber lists</li>
                    <li>• Role-based permissions</li>
                    <li>• Organization-level analytics</li>
                  </ul>
                  <Button size="sm">
                    <ArrowRight className="h-4 w-4 mr-2" />
                    View Plans
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Open Source Info */}
      <div className="border border rounded-2xl bg-muted/50 shadow-sm">
        <div className="p-6">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0">
              <Github className="h-6 w-6 text-foreground" />
            </div>
            <div className="space-y-2">
              <h3 className="font-bold text-foreground" style={{letterSpacing: '-0.01em'}}>Open Source Alternative</h3>
              <p className="text-sm text-muted-foreground" style={{letterSpacing: '-0.01em'}}>
                PlaneMail is fully open source under the MIT license. Self-host for free with unlimited 
                subscribers and complete control over your data.
              </p>
              <div className="flex flex-col sm:flex-row gap-2 mt-3">
                <Button asChild variant="outline" size="sm" className="border hover:bg-gray-100 text-foreground font-medium rounded-lg transition-colors duration-200" style={{letterSpacing: '-0.01em'}}>
                  <a href="https://github.com/outrevo/PlaneMail" target="_blank" rel="noopener noreferrer">
                    View Source Code
                    <ExternalLink className="ml-2 h-3 w-3" />
                  </a>
                </Button>
                <Button asChild variant="outline" size="sm" className="border hover:bg-gray-100 text-foreground font-medium rounded-lg transition-colors duration-200" style={{letterSpacing: '-0.01em'}}>
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
      <div className="border border-blue-200 rounded-2xl bg-blue-50 shadow-sm">
        <div className="p-6">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0">
              <ShieldCheck className="h-6 w-6 text-blue-600" />
            </div>
            <div className="space-y-2">
              <h3 className="font-bold text-blue-900" style={{letterSpacing: '-0.01em'}}>Secure Payments</h3>
              <p className="text-sm text-blue-700" style={{letterSpacing: '-0.01em'}}>
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
