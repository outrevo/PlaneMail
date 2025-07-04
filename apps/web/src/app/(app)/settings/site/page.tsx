'use client';

import React, { useState, useEffect } from 'react';
import { PageHeader } from '@/components/common/PageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Save, Eye, Palette, Code, BarChart3, Globe, Check, X, AlertCircle } from 'lucide-react';
import { getSiteSettings, updateSiteSettings, type SiteSettingsType } from './actions';
import { getCustomDomains, addCustomDomain, verifyCustomDomain, removeCustomDomain, type CustomDomainType } from './domains-actions';

export default function SiteSettingsPage() {
  const { toast } = useToast();
  const [settings, setSettings] = useState<SiteSettingsType | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [customDomains, setCustomDomains] = useState<CustomDomainType[]>([]);
  const [newDomain, setNewDomain] = useState('');
  const [isAddingDomain, setIsAddingDomain] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [settingsResult, domainsResult] = await Promise.all([
          getSiteSettings(),
          getCustomDomains()
        ]);
        setSettings(settingsResult);
        setCustomDomains(domainsResult);
      } catch (error) {
        console.error('Failed to load data:', error);
        toast({
          title: 'Error',
          description: 'Failed to load site settings.',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [toast]);

  const handleSave = async () => {
    if (!settings) return;

    setIsSaving(true);
    try {
      const result = await updateSiteSettings(settings);
      if (result.success) {
        toast({
          title: 'Success',
          description: 'Site settings updated successfully.',
        });
      } else {
        toast({
          title: 'Error',
          description: result.message || 'Failed to update settings.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Failed to save settings:', error);
      toast({
        title: 'Error',
        description: 'Failed to update settings.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddDomain = async () => {
    if (!newDomain.trim()) return;

    setIsAddingDomain(true);
    try {
      const result = await addCustomDomain(newDomain.trim());
      if (result.success) {
        toast({
          title: 'Success',
          description: 'Domain added successfully. Please configure DNS.',
        });
        setNewDomain('');
        // Reload domains
        const domainsResult = await getCustomDomains();
        setCustomDomains(domainsResult);
      } else {
        toast({
          title: 'Error',
          description: result.message || 'Failed to add domain.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Failed to add domain:', error);
      toast({
        title: 'Error',
        description: 'Failed to add domain.',
        variant: 'destructive',
      });
    } finally {
      setIsAddingDomain(false);
    }
  };

  const handleVerifyDomain = async (domainId: string) => {
    try {
      const result = await verifyCustomDomain(domainId);
      if (result.success) {
        toast({
          title: 'Success',
          description: 'Domain verified successfully.',
        });
        // Reload domains
        const domainsResult = await getCustomDomains();
        setCustomDomains(domainsResult);
      } else {
        toast({
          title: 'Error',
          description: result.message || 'Failed to verify domain.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Failed to verify domain:', error);
      toast({
        title: 'Error',
        description: 'Failed to verify domain.',
        variant: 'destructive',
      });
    }
  };

  const handleRemoveDomain = async (domainId: string) => {
    try {
      const result = await removeCustomDomain(domainId);
      if (result.success) {
        toast({
          title: 'Success',
          description: 'Domain removed successfully.',
        });
        // Reload domains
        const domainsResult = await getCustomDomains();
        setCustomDomains(domainsResult);
      } else {
        toast({
          title: 'Error',
          description: result.message || 'Failed to remove domain.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Failed to remove domain:', error);
      toast({
        title: 'Error',
        description: 'Failed to remove domain.',
        variant: 'destructive',
      });
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="container mx-auto py-6">
        <div className="text-center">
          <h2 className="text-lg font-semibold mb-2">Failed to load settings</h2>
          <Button onClick={() => window.location.reload()}>Retry</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <PageHeader 
          title="Site Settings" 
          description="Customize your public site appearance and functionality"
        />
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <a href="/posts" target="_blank">
              <Eye className="h-4 w-4 mr-2" />
              Preview Site
            </a>
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Save Changes
          </Button>
        </div>
      </div>

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="branding">Branding</TabsTrigger>
          <TabsTrigger value="layout">Layout</TabsTrigger>
          <TabsTrigger value="domains">Domains</TabsTrigger>
          <TabsTrigger value="advanced">Advanced</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        {/* General Settings */}
        <TabsContent value="general" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Site Information</CardTitle>
              <CardDescription>
                Basic information about your public site
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="siteName">Site Name</Label>
                <Input
                  id="siteName"
                  value={settings.siteName}
                  onChange={(e) => setSettings({ ...settings, siteName: e.target.value })}
                  placeholder="Your site name"
                />
              </div>

              <div>
                <Label htmlFor="siteDescription">Site Description</Label>
                <Textarea
                  id="siteDescription"
                  value={settings.siteDescription}
                  onChange={(e) => setSettings({ ...settings, siteDescription: e.target.value })}
                  placeholder="A brief description of your site"
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="baseUrl">Site URL</Label>
                <Input
                  id="baseUrl"
                  value={settings.baseUrl}
                  onChange={(e) => setSettings({ ...settings, baseUrl: e.target.value })}
                  placeholder="https://yoursite.com"
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="enableNewsletterSignup"
                  checked={settings.enableNewsletterSignup}
                  onCheckedChange={(checked) => 
                    setSettings({ ...settings, enableNewsletterSignup: checked })
                  }
                />
                <Label htmlFor="enableNewsletterSignup">
                  Enable newsletter signup on posts
                </Label>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Branding Settings */}
        <TabsContent value="branding" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="h-5 w-5" />
                Visual Branding
              </CardTitle>
              <CardDescription>
                Customize the visual appearance of your site
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="logoUrl">Logo URL</Label>
                <Input
                  id="logoUrl"
                  value={settings.logoUrl || ''}
                  onChange={(e) => setSettings({ ...settings, logoUrl: e.target.value || null })}
                  placeholder="https://example.com/logo.png"
                />
              </div>

              <div>
                <Label htmlFor="favicon">Favicon URL</Label>
                <Input
                  id="favicon"
                  value={settings.favicon || ''}
                  onChange={(e) => setSettings({ ...settings, favicon: e.target.value || null })}
                  placeholder="https://example.com/favicon.ico"
                />
              </div>

              <div>
                <Label htmlFor="primaryColor">Primary Color</Label>
                <div className="flex gap-2">
                  <Input
                    id="primaryColor"
                    type="color"
                    value={settings.primaryColor}
                    onChange={(e) => setSettings({ ...settings, primaryColor: e.target.value })}
                    className="w-20"
                  />
                  <Input
                    value={settings.primaryColor}
                    onChange={(e) => setSettings({ ...settings, primaryColor: e.target.value })}
                    placeholder="#1e40af"
                    className="flex-1"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Layout Settings */}
        <TabsContent value="layout" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Header Settings</CardTitle>
              <CardDescription>
                Customize your site header
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="headerEnabled"
                  checked={settings.headerEnabled}
                  onCheckedChange={(checked) => 
                    setSettings({ ...settings, headerEnabled: checked })
                  }
                />
                <Label htmlFor="headerEnabled">Enable header</Label>
              </div>

              {settings.headerEnabled && (
                <div>
                  <Label htmlFor="headerContent">Custom Header HTML (optional)</Label>
                  <Textarea
                    id="headerContent"
                    value={settings.headerContent || ''}
                    onChange={(e) => setSettings({ ...settings, headerContent: e.target.value || null })}
                    placeholder="Leave empty to use default header, or add custom HTML"
                    rows={6}
                    className="font-mono text-sm"
                  />
                  <p className="text-sm text-muted-foreground mt-1">
                    Leave empty to use the default header with your site name and navigation.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Footer Settings</CardTitle>
              <CardDescription>
                Customize your site footer
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="footerEnabled"
                  checked={settings.footerEnabled}
                  onCheckedChange={(checked) => 
                    setSettings({ ...settings, footerEnabled: checked })
                  }
                />
                <Label htmlFor="footerEnabled">Enable footer</Label>
              </div>

              {settings.footerEnabled && (
                <div>
                  <Label htmlFor="footerContent">Custom Footer HTML (optional)</Label>
                  <Textarea
                    id="footerContent"
                    value={settings.footerContent || ''}
                    onChange={(e) => setSettings({ ...settings, footerContent: e.target.value || null })}
                    placeholder="Leave empty to use default footer, or add custom HTML"
                    rows={6}
                    className="font-mono text-sm"
                  />
                  <p className="text-sm text-muted-foreground mt-1">
                    Leave empty to use the default footer with links and site info.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Domains Settings */}
        <TabsContent value="domains" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Code className="h-5 w-5" />
                Custom Domains
              </CardTitle>
              <CardDescription>
                Use your own domain for your public newsletter pages (e.g., newsletter.yourdomain.com)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-medium text-blue-900 mb-2">How it works</h4>
                <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
                  <li>Add your custom domain below</li>
                  <li>Create a CNAME record pointing to your PlaneMail domain</li>
                  <li>We'll automatically verify your domain and issue SSL certificates</li>
                  <li>Your newsletter pages will be available at your custom domain</li>
                </ol>
              </div>

              <div>
                <Label htmlFor="customDomain">Custom Domain</Label>
                <div className="flex gap-2 mt-1">
                  <Input
                    id="customDomain"
                    placeholder="newsletter.yourdomain.com"
                    className="flex-1"
                    value={newDomain}
                    onChange={(e) => setNewDomain(e.target.value)}
                  />
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={handleAddDomain}
                    disabled={isAddingDomain}
                  >
                    {isAddingDomain ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      'Add Domain'
                    )}
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  Enter the subdomain you want to use (e.g., newsletter.yourdomain.com)
                </p>
              </div>

              <div>
                <h4 className="font-medium mb-3">Your Domains</h4>
                <div className="border rounded-lg divide-y">
                  {customDomains.length === 0 ? (
                    <div className="p-4 text-center text-muted-foreground">
                      No custom domains configured yet
                    </div>
                  ) : (
                    customDomains.map((domain) => (
                      <div key={domain.id} className="p-4 flex items-center justify-between">
                        <div>
                          <div className="text-sm font-medium">{domain.domain}</div>
                          <div className="text-xs text-muted-foreground flex items-center gap-1">
                            {domain.status === 'verified' || domain.status === 'active' ? (
                              <>
                                <Check className="h-3 w-3 text-green-500" />
                                Verified
                              </>
                            ) : domain.status === 'failed' ? (
                              <>
                                <X className="h-3 w-3 text-red-500" />
                                Failed
                              </>
                            ) : (
                              <>
                                <AlertCircle className="h-3 w-3 text-yellow-500" />
                                {domain.status === 'pending' ? 'Pending' : domain.status}
                              </>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {domain.status === 'pending' && (
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => handleVerifyDomain(domain.id)}
                            >
                              Verify
                            </Button>
                          )}
                          <Button 
                            variant="destructive" 
                            size="sm" 
                            onClick={() => handleRemoveDomain(domain.id)}
                          >
                            Remove
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="bg-muted/50 border border rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-2">DNS Configuration</h4>
                <p className="text-sm text-muted-foreground mb-3">
                  Add this CNAME record to your DNS provider:
                </p>
                <div className="bg-card border rounded p-3 font-mono text-sm">
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <span className="text-muted-foreground">Name:</span><br />
                      <code>newsletter</code>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Type:</span><br />
                      <code>CNAME</code>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Value:</span><br />
                      <code>planemail.app</code>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Advanced Settings */}
        <TabsContent value="advanced" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Code className="h-5 w-5" />
                Custom Code
              </CardTitle>
              <CardDescription>
                Add custom CSS and JavaScript to your site
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="customCss">Custom CSS</Label>
                <Textarea
                  id="customCss"
                  value={settings.customCss || ''}
                  onChange={(e) => setSettings({ ...settings, customCss: e.target.value || null })}
                  placeholder="/* Add your custom CSS here */"
                  rows={8}
                  className="font-mono text-sm"
                />
              </div>

              <div>
                <Label htmlFor="customJs">Custom JavaScript</Label>
                <Textarea
                  id="customJs"
                  value={settings.customJs || ''}
                  onChange={(e) => setSettings({ ...settings, customJs: e.target.value || null })}
                  placeholder="// Add your custom JavaScript here"
                  rows={8}
                  className="font-mono text-sm"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics Settings */}
        <TabsContent value="analytics" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Analytics & Tracking
              </CardTitle>
              <CardDescription>
                Add analytics and tracking codes to your site
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="analyticsCode">Analytics Code</Label>
                <Textarea
                  id="analyticsCode"
                  value={settings.analyticsCode || ''}
                  onChange={(e) => setSettings({ ...settings, analyticsCode: e.target.value || null })}
                  placeholder="<!-- Google Analytics, Plausible, or other analytics code -->"
                  rows={8}
                  className="font-mono text-sm"
                />
                <p className="text-sm text-muted-foreground mt-1">
                  Add your Google Analytics, Plausible, or other analytics tracking code here.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
