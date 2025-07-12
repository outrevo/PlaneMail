"use client";

import { useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import { 
  Crown, 
  Check, 
  AlertTriangle, 
  Users, 
  Mail, 
  Zap, 
  Shield,
  Globe,
  Building
} from 'lucide-react';
import { openPaddleCheckout, PADDLE_PRICE_IDS } from '@/lib/paddle';

interface UpgradeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  feature?: string;
  reason?: string;
}

export function UpgradeDialog({ open, onOpenChange, feature, reason }: UpgradeDialogProps) {
  const [selectedPlan, setSelectedPlan] = useState<'ascent' | 'zenith'>('ascent');
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useUser();

  const plans = [
    {
      id: 'free',
      name: 'Free',
      price: 'Free',
      description: 'Perfect for getting started',
      current: true,
      features: [
        '100 subscribers',
        '4 posts per month',
        'Basic email templates',
        'Personal account only',
        'Community support',
      ],
      limitations: [
        'No organizations',
        'No custom domain',
        'No API access',
        'No team collaboration',
        'Basic analytics only',
      ]
    },
    {
      id: 'ascent',
      name: 'Ascent',
      price: '$29',
      description: 'For growing newsletters with teams',
      popular: true,
      features: [
        '10,000 subscribers',
        'Unlimited posts',
        '1 Organization included',
        'Custom domains',
        '5 team members',
        'API access',
        'Advanced analytics',
        'Priority support',
      ]
    },
    {
      id: 'zenith',
      name: 'Zenith',
      price: '$99',
      description: 'For serious publishers',
      features: [
        '100,000 subscribers',
        'Unlimited everything',
        '1 Organization included',
        'Multiple custom domains',
        'Unlimited team members',
        'Advanced integrations',
        'White-label options',
        'Dedicated support',
      ]
    }
  ];

  const handleUpgrade = async (planId: 'ascent' | 'zenith') => {
    if (!user) {
      console.error('User not found');
      return;
    }

    // Map plan IDs to Paddle price IDs
    const priceIdMap = {
      ascent: PADDLE_PRICE_IDS.hosted, // $29 plan maps to hosted
      zenith: PADDLE_PRICE_IDS.pro,    // $99 plan maps to pro
    };

    const priceId = priceIdMap[planId];
    if (!priceId) {
      console.error(`Price ID not found for plan: ${planId}`);
      alert('This plan is not available yet. Please try again later.');
      return;
    }

    setIsLoading(true);
    
    try {
      await openPaddleCheckout({
        priceId,
        customer: {
          email: user.emailAddresses[0]?.emailAddress || '',
          name: user.fullName || user.firstName || 'User',
        },
        customData: {
          user_email: user.emailAddresses[0]?.emailAddress || '',
          user_id: user.id, // This is the critical part - passes Clerk user ID
          plan_name: planId === 'ascent' ? 'Ascent' : 'Zenith',
          has_trial: true,
          source: 'upgrade_dialog',
        },
      });
      
      // Close dialog after successful checkout initiation
      onOpenChange(false);
    } catch (error) {
      console.error('Checkout error:', error);
      alert('Failed to open checkout. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Crown className="h-5 w-5 text-yellow-500" />
            <span>Upgrade Your Plan</span>
          </DialogTitle>
          <DialogDescription>
            {reason ? reason : 'Choose a plan that fits your needs'}
          </DialogDescription>
        </DialogHeader>

        {feature && reason && (
          <Alert className="border-yellow-200 bg-yellow-50">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>Feature Limit Reached:</strong> {reason}
            </AlertDescription>
          </Alert>
        )}

        <div className="grid md:grid-cols-3 gap-6">
          {plans.map((plan) => (
            <Card 
              key={plan.id} 
              className={`relative ${plan.popular ? 'border-primary shadow-lg' : ''} ${plan.current ? 'border-green-200 bg-green-50' : ''}`}
            >
              {plan.popular && (
                <Badge className="absolute -top-2 left-1/2 transform -translate-x-1/2 bg-primary">
                  Most Popular
                </Badge>
              )}
              {plan.current && (
                <Badge className="absolute -top-2 left-1/2 transform -translate-x-1/2 bg-green-500">
                  Current Plan
                </Badge>
              )}
              
              <CardHeader className="text-center">
                <CardTitle className="text-xl">{plan.name}</CardTitle>
                <div className="text-3xl font-bold">
                  {plan.price}
                  {plan.price !== 'Free' && <span className="text-sm font-normal text-muted-foreground">/month</span>}
                </div>
                <CardDescription>{plan.description}</CardDescription>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <ul className="space-y-2">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-center space-x-2">
                      <Check className="h-4 w-4 text-green-500" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>

                {plan.limitations && (
                  <>
                    <div className="border-t pt-4">
                      <p className="text-sm text-muted-foreground mb-2">Limitations:</p>
                      <ul className="space-y-1">
                        {plan.limitations.map((limitation, index) => (
                          <li key={index} className="text-xs text-muted-foreground">
                            • {limitation}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </>
                )}

                <Button 
                  className="w-full" 
                  variant={plan.current ? "outline" : plan.popular ? "default" : "outline"}
                  disabled={plan.current || isLoading}
                  onClick={() => {
                    if (!plan.current && (plan.id === 'ascent' || plan.id === 'zenith')) {
                      setSelectedPlan(plan.id as 'ascent' | 'zenith');
                      handleUpgrade(plan.id as 'ascent' | 'zenith');
                    }
                  }}
                >
                  {plan.current ? 'Current Plan' : isLoading ? 'Loading...' : 'Upgrade'}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="text-center text-sm text-muted-foreground">
          <p>All plans include SSL certificates, email support, and regular updates.</p>
          <p>You can cancel or change your plan anytime.</p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
