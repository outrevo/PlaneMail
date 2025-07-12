import { useState } from 'react';
import { useUser, useOrganization } from '@clerk/nextjs';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Crown, Check, Zap, Users, Globe, Key, BarChart } from 'lucide-react';

interface UpgradeButtonProps {
  feature?: string;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg';
  className?: string;
  children?: React.ReactNode;
}

export function UpgradeButton({ 
  feature, 
  variant = 'default', 
  size = 'default', 
  className = '',
  children 
}: UpgradeButtonProps) {
  const { user } = useUser();
  const { organization } = useOrganization();
  const [isLoading, setIsLoading] = useState(false);

  const handleUpgrade = async (planId: string) => {
    setIsLoading(true);
    try {
      // Here you would integrate with Paddle
      console.log(`Upgrading to ${planId} for ${organization ? 'organization' : 'personal'}`);
      
      // Mock upgrade process
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Redirect to Paddle checkout or handle success
      alert('Upgrade initiated! In a real app, this would redirect to Paddle checkout.');
      
    } catch (error) {
      console.error('Upgrade failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getFeatureMessage = () => {
    switch (feature) {
      case 'organizations':
        return 'Organizations are only available on paid plans. Upgrade to create teams and collaborate.';
      case 'custom_domains':
        return 'Custom domains require a Pro plan or higher.';
      case 'api_access':
        return 'API access is available on Pro and Business plans.';
      case 'advanced_analytics':
        return 'Advanced analytics are available on paid plans.';
      default:
        return 'This feature requires a paid plan. Upgrade to unlock more capabilities.';
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant={variant} size={size} className={className}>
          {children || (
            <>
              <Crown className="h-4 w-4 mr-2" />
              Upgrade
            </>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Crown className="h-6 w-6" />
            <span>Upgrade Your Plan</span>
          </DialogTitle>
          <DialogDescription>
            {getFeatureMessage()}
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
          {/* Pro Plan */}
          <Card className="border-2 border-blue-200 relative">
            <Badge className="absolute -top-2 left-1/2 transform -translate-x-1/2">
              Most Popular
            </Badge>
            <CardHeader className="pt-8">
              <CardTitle className="flex items-center justify-between">
                <span>Pro Plan</span>
                <div className="text-right">
                  <div className="text-2xl font-bold">$19</div>
                  <div className="text-sm text-muted-foreground">/month</div>
                </div>
              </CardTitle>
              <CardDescription>
                Perfect for professionals and growing teams
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center space-x-2 text-sm">
                  <Users className="h-4 w-4 text-blue-500" />
                  <span><strong>Organizations & Teams</strong></span>
                  <Badge variant="secondary" className="text-xs">New!</Badge>
                </div>
                <div className="flex items-center space-x-2 text-sm">
                  <Check className="h-4 w-4 text-green-500" />
                  <span>10,000 subscribers</span>
                </div>
                <div className="flex items-center space-x-2 text-sm">
                  <Check className="h-4 w-4 text-green-500" />
                  <span>100 posts per month</span>
                </div>
                <div className="flex items-center space-x-2 text-sm">
                  <Globe className="h-4 w-4 text-blue-500" />
                  <span>Custom domains (3)</span>
                </div>
                <div className="flex items-center space-x-2 text-sm">
                  <Key className="h-4 w-4 text-blue-500" />
                  <span>API access</span>
                </div>
                <div className="flex items-center space-x-2 text-sm">
                  <BarChart className="h-4 w-4 text-blue-500" />
                  <span>Advanced analytics</span>
                </div>
                <div className="flex items-center space-x-2 text-sm">
                  <Check className="h-4 w-4 text-green-500" />
                  <span>Priority support</span>
                </div>
              </div>
              
              <Button 
                className="w-full" 
                onClick={() => handleUpgrade('pro')}
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Zap className="h-4 w-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Crown className="h-4 w-4 mr-2" />
                    Upgrade to Pro
                  </>
                )}
              </Button>
              
              <p className="text-xs text-center text-muted-foreground">
                14-day free trial • Cancel anytime
              </p>
            </CardContent>
          </Card>

          {/* Business Plan */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Business Plan</span>
                <div className="text-right">
                  <div className="text-2xl font-bold">$99</div>
                  <div className="text-sm text-muted-foreground">/month</div>
                </div>
              </CardTitle>
              <CardDescription>
                For teams that need unlimited everything
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center space-x-2 text-sm">
                  <Crown className="h-4 w-4 text-yellow-500" />
                  <span><strong>Unlimited everything</strong></span>
                </div>
                <div className="flex items-center space-x-2 text-sm">
                  <Users className="h-4 w-4 text-blue-500" />
                  <span>Unlimited team members</span>
                </div>
                <div className="flex items-center space-x-2 text-sm">
                  <Check className="h-4 w-4 text-green-500" />
                  <span>Advanced team permissions</span>
                </div>
                <div className="flex items-center space-x-2 text-sm">
                  <Check className="h-4 w-4 text-green-500" />
                  <span>SSO integration</span>
                </div>
                <div className="flex items-center space-x-2 text-sm">
                  <Check className="h-4 w-4 text-green-500" />
                  <span>Dedicated support</span>
                </div>
                <div className="flex items-center space-x-2 text-sm">
                  <Check className="h-4 w-4 text-green-500" />
                  <span>SLA guarantees</span>
                </div>
                <div className="flex items-center space-x-2 text-sm">
                  <Check className="h-4 w-4 text-green-500" />
                  <span>White-label options</span>
                </div>
              </div>
              
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => handleUpgrade('business')}
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Zap className="h-4 w-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Crown className="h-4 w-4 mr-2" />
                    Upgrade to Business
                  </>
                )}
              </Button>
              
              <p className="text-xs text-center text-muted-foreground">
                14-day free trial • Cancel anytime
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <Crown className="h-4 w-4" />
            <span>
              <strong>
                {organization ? `Upgrading ${organization.name}` : 'Upgrading personal account'}
              </strong>
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            This will upgrade your {organization ? 'organization' : 'personal account'} to the selected plan.
            {organization && ' All team members will have access to the upgraded features.'}
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
