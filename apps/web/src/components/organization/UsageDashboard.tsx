"use client";

import { useEffect, useState } from 'react';
import { useOrganization, useUser } from '@clerk/nextjs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Users, 
  FileText, 
  Globe, 
  UserPlus, 
  Settings, 
  Key, 
  Webhook, 
  Image,
  Mail,
  Crown,
  Zap
} from 'lucide-react';

interface UsageData {
  plan: {
    name: string;
    allowOrganizations: boolean;
    allowAdvancedAnalytics: boolean;
    allowCustomDomains: boolean;
    allowApiAccess: boolean;
  };
  limits: {
    maxSubscribers: number;
    maxPostsPerMonth: number;
    maxCustomDomains: number;
    maxTeamMembers: number;
    maxIntegrations: number;
    maxApiKeys: number;
    maxWebhooks: number;
    maxImageUploads: number;
    maxEmailsPerMonth: number;
  };
  usage: {
    currentSubscribers: number;
    currentPostsThisMonth: number;
    currentCustomDomains: number;
    currentTeamMembers: number;
    currentIntegrations: number;
    currentApiKeys: number;
    currentWebhooks: number;
    currentImageUploadsThisMonth: number;
    currentEmailsThisMonth: number;
  };
}

export function UsageDashboard() {
  const { user } = useUser();
  const { organization } = useOrganization();
  const [usageData, setUsageData] = useState<UsageData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUsageData = async () => {
      try {
        const response = await fetch('/api/billing/usage');
        const data = await response.json();
        setUsageData(data);
      } catch (error) {
        console.error('Error fetching usage data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUsageData();
  }, [organization]);

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(6)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="pb-2">
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              <div className="h-3 bg-gray-200 rounded w-3/4"></div>
            </CardHeader>
            <CardContent>
              <div className="h-2 bg-gray-200 rounded mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-1/3"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!usageData) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-center text-muted-foreground">
            Unable to load usage data. Please try again later.
          </p>
        </CardContent>
      </Card>
    );
  }

  const formatNumber = (num: number) => {
    if (num === -1) return '∞';
    return num.toLocaleString();
  };

  const getUsagePercentage = (current: number, max: number) => {
    if (max === -1) return 0; // Unlimited
    return Math.min((current / max) * 100, 100);
  };

  const getUsageColor = (percentage: number) => {
    if (percentage >= 90) return 'bg-red-500';
    if (percentage >= 75) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const UsageCard = ({ 
    icon: Icon, 
    title, 
    description, 
    current, 
    max, 
    feature 
  }: { 
    icon: any; 
    title: string; 
    description: string; 
    current: number; 
    max: number; 
    feature?: keyof UsageData['plan'];
  }) => {
    const percentage = getUsagePercentage(current, max);
    const isFeatureEnabled = feature ? usageData.plan[feature] : true;
    
    return (
      <Card className={!isFeatureEnabled ? 'opacity-50' : ''}>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Icon className="h-4 w-4" />
              <CardTitle className="text-sm">{title}</CardTitle>
            </div>
            {!isFeatureEnabled && (
              <Badge variant="outline" className="text-xs">
                <Crown className="h-3 w-3 mr-1" />
                Pro
              </Badge>
            )}
          </div>
          <CardDescription className="text-xs">{description}</CardDescription>
        </CardHeader>
        <CardContent>
          {isFeatureEnabled ? (
            <>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">
                  {formatNumber(current)} / {formatNumber(max)}
                </span>
                <span className="text-xs text-muted-foreground">
                  {max === -1 ? 'Unlimited' : `${Math.round(percentage)}%`}
                </span>
              </div>
              <Progress 
                value={percentage} 
                className={`h-2 ${getUsageColor(percentage)}`}
              />
            </>
          ) : (
            <div className="text-center py-2">
              <Button variant="outline" size="sm" className="text-xs">
                <Zap className="h-3 w-3 mr-1" />
                Upgrade to Pro
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      {/* Current Plan */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center space-x-2">
                <Crown className="h-5 w-5" />
                <span>Current Plan</span>
              </CardTitle>
              <CardDescription>
                {organization ? `${organization.name} organization` : 'Personal account'}
              </CardDescription>
            </div>
            <Badge variant="default" className="text-sm">
              {usageData.plan.name}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              {usageData.plan.name === 'Personal' 
                ? 'Free forever' 
                : `${usageData.plan.name} plan features`}
            </span>
            <Button variant="outline" size="sm">
              {usageData.plan.name === 'Personal' ? 'Upgrade' : 'Manage Billing'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Usage Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <UsageCard
          icon={Users}
          title="Subscribers"
          description="Total active subscribers"
          current={usageData.usage.currentSubscribers}
          max={usageData.limits.maxSubscribers}
        />
        
        <UsageCard
          icon={FileText}
          title="Posts This Month"
          description="Posts created this month"
          current={usageData.usage.currentPostsThisMonth}
          max={usageData.limits.maxPostsPerMonth}
        />
        
        <UsageCard
          icon={Globe}
          title="Custom Domains"
          description="Active custom domains"
          current={usageData.usage.currentCustomDomains}
          max={usageData.limits.maxCustomDomains}
          feature="allowCustomDomains"
        />
        
        <UsageCard
          icon={UserPlus}
          title="Team Members"
          description="Active team members"
          current={usageData.usage.currentTeamMembers}
          max={usageData.limits.maxTeamMembers}
        />
        
        <UsageCard
          icon={Settings}
          title="Integrations"
          description="Connected integrations"
          current={usageData.usage.currentIntegrations}
          max={usageData.limits.maxIntegrations}
        />
        
        <UsageCard
          icon={Key}
          title="API Keys"
          description="Active API keys"
          current={usageData.usage.currentApiKeys}
          max={usageData.limits.maxApiKeys}
          feature="allowApiAccess"
        />
        
        <UsageCard
          icon={Webhook}
          title="Webhooks"
          description="Active webhooks"
          current={usageData.usage.currentWebhooks}
          max={usageData.limits.maxWebhooks}
          feature="allowApiAccess"
        />
        
        <UsageCard
          icon={Image}
          title="Images This Month"
          description="Images uploaded this month"
          current={usageData.usage.currentImageUploadsThisMonth}
          max={usageData.limits.maxImageUploads}
        />
        
        <UsageCard
          icon={Mail}
          title="Emails This Month"
          description="Emails sent this month"
          current={usageData.usage.currentEmailsThisMonth}
          max={usageData.limits.maxEmailsPerMonth}
        />
      </div>

      {/* Organization Features */}
      {!organization && usageData.plan.name === 'Personal' && (
        <Card className="border-2 border-dashed border-yellow-200 bg-yellow-50">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-yellow-800">
              <Crown className="h-5 w-5" />
              <span>Unlock Organization Features</span>
            </CardTitle>
            <CardDescription className="text-yellow-700">
              Upgrade to Pro to create organizations, collaborate with teams, and access advanced features.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="flex items-center space-x-2 text-sm text-yellow-700">
                <Users className="h-4 w-4" />
                <span>Team Collaboration</span>
              </div>
              <div className="flex items-center space-x-2 text-sm text-yellow-700">
                <Globe className="h-4 w-4" />
                <span>Custom Domains</span>
              </div>
              <div className="flex items-center space-x-2 text-sm text-yellow-700">
                <Key className="h-4 w-4" />
                <span>API Access</span>
              </div>
              <div className="flex items-center space-x-2 text-sm text-yellow-700">
                <Zap className="h-4 w-4" />
                <span>Advanced Analytics</span>
              </div>
            </div>
            <Button className="w-full">
              <Crown className="h-4 w-4 mr-2" />
              Upgrade to Pro - $19/month
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
