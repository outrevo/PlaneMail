
'use client';

import React, { useState, useEffect, useTransition } from 'react';
import { PageHeader } from '@/components/common/PageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { 
  getBrevoIntegrationDetails, 
  saveBrevoApiKey, 
  disconnectBrevo,
  getMailgunIntegrationDetails,
  saveMailgunCredentials,
  disconnectMailgun,
  getAmazonSESIntegrationDetails,
  saveAmazonSESCredentials,
  disconnectAmazonSES,
  listApiKeys,
  generateApiKey,
  revokeApiKey,
  type BrevoIntegrationDetailsType,
  type MailgunIntegrationDetailsType,
  type AmazonSESIntegrationDetailsType,
} from './actions';
import { Loader2, CheckCircle, XCircle, AlertTriangle, ExternalLink, KeyRound, PlusCircle, Copy, Trash2, Server } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { format } from 'date-fns';

type ApiKeyDisplay = {
  id: string;
  name: string;
  prefix: string;
  createdAt: Date;
  lastUsedAt?: Date | null;
};

const BrevoLogoSvg = () => (
  <span style={{ width: '90px', height: '28px', display: 'inline-block' }}>
    <svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" fill="#00924C" viewBox="0 0 90 28">
      <path d="M73.825 17.178c0-4.037 2.55-6.876 6.175-6.876 3.626 0 6.216 2.838 6.216 6.876 0 4.04-2.59 6.716-6.216 6.716-3.626 0-6.175-2.8-6.175-6.716Zm-3.785 0c0 5.957 4.144 10.155 9.96 10.155 5.816 0 10-4.198 10-10.155 0-5.957-4.144-10.314-10-10.314-5.857 0-9.96 4.279-9.96 10.314ZM50.717 7.104l7.81 19.989h3.665l7.81-19.99h-3.945l-5.658 15.433h-.08L54.662 7.104h-3.945Zm-15.18 9.354c.239-3.679 2.67-6.156 5.977-6.156 2.867 0 5.02 1.84 5.338 4.598h-6.614c-2.35 0-3.626.28-4.58 1.56h-.121v-.002Zm-3.784.6c0 5.957 4.183 10.274 9.96 10.274 3.904 0 7.33-1.999 8.803-5.158l-3.186-1.6c-1.115 2.079-3.267 3.318-5.618 3.318-2.83 0-5.379-2.159-5.379-4.238 0-1.078.718-1.56 1.753-1.56h12.63v-1.078c0-5.997-3.825-10.155-9.323-10.155-5.497 0-9.641 4.278-9.641 10.195M20.916 27.09h3.586V14.82c0-2.64 1.632-4.519 3.905-4.519.956 0 1.951.32 2.43.759.359-.96.917-1.918 1.753-2.878-.957-.799-2.59-1.32-4.184-1.32-4.382 0-7.49 3.278-7.49 7.956v12.274-.002ZM3.586 13.86V4.104h5.896c1.992 0 3.307 1.16 3.307 2.918 0 1.999-1.713 3.518-5.218 4.677-2.39.76-3.466 1.4-3.865 2.16l-.12.001Zm0 9.795v-4.077c0-1.8 1.514-3.558 3.626-4.238 1.873-.64 3.425-1.28 4.74-1.959 1.754 1.04 2.829 2.838 2.829 4.718 0 3.198-3.028 5.556-7.132 5.556H3.586ZM0 27.093h7.968c6.057 0 10.597-3.798 10.597-8.835 0-2.76-1.394-5.237-3.864-6.837 1.275-1.28 1.873-2.759 1.873-4.558 0-3.717-2.67-6.196-6.693-6.196H0v26.426Z"></path>
    </svg>
  </span>
);

const MailgunLogoSvg = () => (
    <span style={{ width: 'auto', height: '28px', display: 'inline-flex', alignItems: 'center' }}>
    <svg xmlns="http://www.w3.org/2000/svg" height="100%" viewBox="0 0 128 34.7" fill="currentColor" >
      <path d="M41.2 11.1c-3.5 0-5.9 2.5-5.9 6.1s2.4 6.1 5.9 6.1 5.9-2.5 5.9-6.1-2.4-6.1-5.9-6.1zm0 9.9c-2.1 0-3.5-1.4-3.5-3.8s1.4-3.8 3.5-3.8 3.5 1.4 3.5 3.8-1.4 3.8-3.5 3.8zM50.5 11.1c-3.5 0-5.9 2.5-5.9 6.1s2.4 6.1 5.9 6.1 5.9-2.5 5.9-6.1-2.4-6.1-5.9-6.1zm0 9.9c-2.1 0-3.5-1.4-3.5-3.8s1.4-3.8 3.5-3.8 3.5 1.4 3.5 3.8-1.4 3.8-3.5 3.8zM60.2 11.3v9.6h2.4v-3.6h.1c.4 1.1 1.5 2.5 4.2 2.5 2.8 0 4.6-1.8 4.6-5.4v-5.5h-2.4v5.1c0 2.2-.9 3.3-2.6 3.3s-2.4-1.2-2.6-3v-5.4h-3.7zM84.2 11.1c-3.5 0-5.8 2.5-5.8 6.1s2.3 6.1 5.8 6.1c1.6 0 3-.6 3.9-1.6v1.4h2.3V11.3h-2.3v1.4c-.9-1-2.3-1.6-3.9-1.6zm-.2 9.9c-2.1 0-3.6-1.5-3.6-3.8s1.5-3.8 3.6-3.8c2.1 0 3.6 1.5 3.6 3.8s-1.5 3.8-3.6 3.8zM90.8 11.3v9.6h2.3V11.3h-2.3zM98.3 11.1c-1.6 0-2.8.5-3.6 1.4l-.1-.1V.2h-2.4v20.7h2.4v-9.7c0-2.6 1.3-4.1 3.6-4.1.6 0 1.2.1 1.6.3l.6-2c-.7-.3-1.4-.4-2.2-.4zM108.5 13.7c0-1.5-1.1-2.5-3.3-2.5-1.8 0-3.4 1.1-3.4 2.9v7.2h-2.3V11.3h2.3v1.1c.6-.8 1.6-1.3 2.9-1.3 2.9 0 3.8 1.5 3.8 3.9v6h2.3v-6.4zM0 34.7h128V0H0v34.7zM21.8 8.8c-1.3 0-2.4.6-3.1 1.3V3.1h-2V20.9h2v-6.9c.8-1.1 2-1.6 3.4-1.6 2.4 0 4.1 1.7 4.1 4.6v6.4h2V13.2c0-2.9-1.7-4.4-4.4-4.4z"></path>
    </svg>
    </span>
);

const AmazonSESLogoSvg = () => (
  <span style={{ width: 'auto', height: '28px', display: 'inline-flex', alignItems: 'center' }}>
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 60" width="100" height="32" fill="currentColor">
      <path d="M36.19,34.53a2.67,2.67,0,0,0-2.73-2.73H10.37a2.67,2.67,0,0,0-2.73,2.73V49.61a2.67,2.67,0,0,0,2.73,2.73H33.46a2.67,2.67,0,0,0,2.73-2.73Zm-2.73,15.35H10.1V34.26H33.46v15.62ZM54.52,47.39,40.68,34.15V49.88H38V31.8H40.2l14.3,13.69V31.8h2.73V49.88H54.52ZM83.69,49.88H63.81V31.8H83.69Zm-2.73-2.73V34.53H66.54V47.15ZM92.33,49.88H89.6V31.8h6.26a6.42,6.42,0,0,1,4.15,1.45,5.3,5.3,0,0,1,1.63,4.06,4.73,4.73,0,0,1-1.72,3.8,6.59,6.59,0,0,1-4.24,1.54H92.33Zm0-8.65h3.42a3.78,3.78,0,0,0,2.7-.92,2.62,2.62,0,0,0,1-2.1,2.51,2.51,0,0,0-1-2.06,3.86,3.86,0,0,0-2.7-.9h-3.42Z" />
      <path d="M50,7.67A17.33,17.33,0,1,0,67.33,25,17.34,17.34,0,0,0,50,7.67Zm0,32A14.67,14.67,0,1,1,64.67,25,14.68,14.68,0,0,1,50,39.67Z" />
      <path d="M50,0A25,25,0,1,0,75,25,25,25,0,0,0,50,0ZM13.57,25A22.24,22.24,0,0,1,25,13.57V25H13.57ZM25,10.9A22.31,22.31,0,0,1,47.64,6.62L25,29.26V10.9Zm0,36.43L47.64,43.38A22.31,22.31,0,0,1,25,39.1V47.33ZM27.73,25V13.57A22.24,22.24,0,0,1,39.16,25H27.73ZM27.73,27.73H39.16A22.24,22.24,0,0,1,27.73,39.16V27.73Zm22.2,19.63V27.73H61.43A22.24,22.24,0,0,1,49.93,39.16V47.36Zm0-36.43V25H61.43A22.24,22.24,0,0,1,49.93,13.57V10.93Zm2.3,14.07L29.26,6.62A22.31,22.31,0,0,1,52.23,10.9V25Zm0,2.3V39.1A22.31,22.31,0,0,1,29.26,43.38L52.23,27.27Z" />
    </svg>
  </span>
);

const AWS_REGIONS = [
  { value: 'us-east-1', label: 'US East (N. Virginia) (us-east-1)' },
  { value: 'us-east-2', label: 'US East (Ohio) (us-east-2)' },
  { value: 'us-west-1', label: 'US West (N. California) (us-west-1)' },
  { value: 'us-west-2', label: 'US West (Oregon) (us-west-2)' },
  { value: 'af-south-1', label: 'Africa (Cape Town) (af-south-1)' },
  { value: 'ap-east-1', label: 'Asia Pacific (Hong Kong) (ap-east-1)' },
  { value: 'ap-south-1', label: 'Asia Pacific (Mumbai) (ap-south-1)' },
  { value: 'ap-northeast-3', label: 'Asia Pacific (Osaka) (ap-northeast-3)' },
  { value: 'ap-northeast-2', label: 'Asia Pacific (Seoul) (ap-northeast-2)' },
  { value: 'ap-southeast-1', label: 'Asia Pacific (Singapore) (ap-southeast-1)' },
  { value: 'ap-southeast-2', label: 'Asia Pacific (Sydney) (ap-southeast-2)' },
  { value: 'ap-northeast-1', label: 'Asia Pacific (Tokyo) (ap-northeast-1)' },
  { value: 'ca-central-1', label: 'Canada (Central) (ca-central-1)' },
  { value: 'eu-central-1', label: 'Europe (Frankfurt) (eu-central-1)' },
  { value: 'eu-west-1', label: 'Europe (Ireland) (eu-west-1)' },
  { value: 'eu-west-2', label: 'Europe (London) (eu-west-2)' },
  { value: 'eu-south-1', label: 'Europe (Milan) (eu-south-1)' },
  { value: 'eu-west-3', label: 'Europe (Paris) (eu-west-3)' },
  { value: 'eu-north-1', label: 'Europe (Stockholm) (eu-north-1)' },
  { value: 'me-south-1', label: 'Middle East (Bahrain) (me-south-1)' },
  { value: 'sa-east-1', label: 'South America (São Paulo) (sa-east-1)' },
];


export default function IntegrationsPage() {
  const { toast } = useToast();
  const [brevoDetails, setBrevoDetails] = useState<BrevoIntegrationDetailsType | null>(null);
  const [brevoApiKeyInput, setBrevoApiKeyInput] = useState('');
  
  const [mailgunDetails, setMailgunDetails] = useState<MailgunIntegrationDetailsType | null>(null);
  const [mailgunApiKeyInput, setMailgunApiKeyInput] = useState('');
  const [mailgunDomainInput, setMailgunDomainInput] = useState('');
  const [mailgunRegion, setMailgunRegion] = useState<'us' | 'eu'>('us');

  const [sesDetails, setSesDetails] = useState<AmazonSESIntegrationDetailsType | null>(null);
  const [sesAccessKeyIdInput, setSesAccessKeyIdInput] = useState('');
  const [sesSecretAccessKeyInput, setSesSecretAccessKeyInput] = useState('');
  const [sesRegionInput, setSesRegionInput] = useState(AWS_REGIONS[0].value); // Default to first region

  const [userApiKeys, setUserApiKeys] = useState<ApiKeyDisplay[]>([]);
  const [newApiKeyName, setNewApiKeyName] = useState('');
  const [showNewApiKeyDialog, setShowNewApiKeyDialog] = useState(false);
  const [generatedApiKey, setGeneratedApiKey] = useState<string | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [isBrevoSaving, setIsBrevoSaving] = useState(false);
  const [isBrevoDisconnecting, setIsBrevoDisconnecting] = useState(false);
  const [isMailgunSaving, setIsMailgunSaving] = useState(false);
  const [isMailgunDisconnecting, setIsMailgunDisconnecting] = useState(false);
  const [isSesSaving, setIsSesSaving] = useState(false);
  const [isSesDisconnecting, setIsSesDisconnecting] = useState(false);
  const [isApiKeyGenerating, setIsApiKeyGenerating] = useState(false);

  const [isPending, startTransition] = useTransition();

  const fetchDetails = async () => {
    setIsLoading(true);
    try {
      const [brevoData, mailgunData, sesData, apiKeysData] = await Promise.all([
        getBrevoIntegrationDetails(),
        getMailgunIntegrationDetails(),
        getAmazonSESIntegrationDetails(),
        listApiKeys()
      ]);
      setBrevoDetails(brevoData);

      setMailgunDetails(mailgunData);
      if (mailgunData?.domain) setMailgunDomainInput(mailgunData.domain);
      if (mailgunData?.region) setMailgunRegion(mailgunData.region);

      setSesDetails(sesData);
      if (sesData?.region) setSesRegionInput(sesData.region);
      // AccessKeyId and Secret are not pre-filled for security. MaskedAccessKeyId is for display only.

      setUserApiKeys(apiKeysData as ApiKeyDisplay[]);
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to load integration details.', variant: 'destructive' });
      setBrevoDetails({ connected: false, apiKeySet: false, status: 'inactive', senders: [] });
      setMailgunDetails({ connected: false, apiKeySet: false, domain: null, region: 'us', status: 'inactive' });
      setSesDetails({ connected: false, accessKeyIdSet: false, secretAccessKeySet: false, region: null, status: 'inactive', verifiedIdentities: [] });
      setUserApiKeys([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDetails();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSaveBrevoApiKey = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!brevoApiKeyInput.trim()) {
      toast({ title: 'API Key Required', description: 'Please enter your Brevo API key.', variant: 'destructive' });
      return;
    }
    setIsBrevoSaving(true);
    startTransition(async () => {
      const result = await saveBrevoApiKey(brevoApiKeyInput);
      if (result.success) {
        toast({ title: 'Success', description: result.message });
        setBrevoApiKeyInput('');
        fetchDetails(); 
      } else {
        toast({ title: 'Error', description: result.message || 'Failed to save API key.', variant: 'destructive' });
      }
      setIsBrevoSaving(false);
    });
  };

  const handleDisconnectBrevo = async () => {
    setIsBrevoDisconnecting(true);
    startTransition(async () => {
      const result = await disconnectBrevo();
      if (result.success) {
        toast({ title: 'Success', description: 'Brevo integration disconnected.' });
        fetchDetails(); 
      } else {
        toast({ title: 'Error', description: result.message || 'Failed to disconnect.', variant: 'destructive' });
      }
      setIsBrevoDisconnecting(false);
    });
  };

  const handleSaveMailgunCredentials = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!mailgunApiKeyInput.trim() || !mailgunDomainInput.trim()) {
      toast({ title: 'Fields Required', description: 'Please enter Mailgun API Key and Domain.', variant: 'destructive' });
      return;
    }
    setIsMailgunSaving(true);
    startTransition(async () => {
      const result = await saveMailgunCredentials(mailgunApiKeyInput, mailgunDomainInput, mailgunRegion);
      if (result.success) {
        toast({ title: 'Success', description: result.message });
        // setMailgunApiKeyInput(''); // Keep input to show it's saved, or clear if preferred
        fetchDetails();
      } else {
        toast({ title: 'Error', description: result.message || 'Failed to save Mailgun credentials.', variant: 'destructive' });
      }
      setIsMailgunSaving(false);
    });
  };

  const handleDisconnectMailgun = async () => {
    setIsMailgunDisconnecting(true);
    startTransition(async () => {
      const result = await disconnectMailgun();
      if (result.success) {
        toast({ title: 'Success', description: 'Mailgun integration disconnected.' });
        setMailgunApiKeyInput('');
        setMailgunDomainInput('');
        setMailgunRegion('us');
        fetchDetails();
      } else {
        toast({ title: 'Error', description: result.message || 'Failed to disconnect Mailgun.', variant: 'destructive' });
      }
      setIsMailgunDisconnecting(false);
    });
  };
  
  const handleSaveAmazonSESCredentials = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!sesAccessKeyIdInput.trim() || !sesSecretAccessKeyInput.trim() || !sesRegionInput) {
        toast({ title: 'Fields Required', description: 'Please enter AWS Access Key ID, Secret Access Key, and Region.', variant: 'destructive'});
        return;
    }
    setIsSesSaving(true);
    startTransition(async () => {
        const result = await saveAmazonSESCredentials(sesAccessKeyIdInput, sesSecretAccessKeyInput, sesRegionInput);
        if (result.success) {
            toast({ title: 'Success', description: result.message });
            setSesAccessKeyIdInput(''); // Clear sensitive inputs after save
            setSesSecretAccessKeyInput('');
            fetchDetails();
        } else {
            toast({ title: 'Error saving AWS SES Credentials', description: result.message || 'An unknown error occurred.', variant: 'destructive' });
        }
        setIsSesSaving(false);
    });
  };

  const handleDisconnectAmazonSES = async () => {
    setIsSesDisconnecting(true);
    startTransition(async () => {
        const result = await disconnectAmazonSES();
        if (result.success) {
            toast({ title: 'Success', description: result.message });
            setSesAccessKeyIdInput('');
            setSesSecretAccessKeyInput('');
            // setSesRegionInput(AWS_REGIONS[0].value); // Reset to default or keep last
            fetchDetails();
        } else {
            toast({ title: 'Error disconnecting AWS SES', description: result.message || 'An unknown error occurred.', variant: 'destructive' });
        }
        setIsSesDisconnecting(false);
    });
  };


  const handleGenerateApiKey = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!newApiKeyName.trim()) {
      toast({ title: 'Name Required', description: 'Please enter a name for your API key.', variant: 'destructive' });
      return;
    }
    setIsApiKeyGenerating(true);
    setGeneratedApiKey(null);
    startTransition(async () => {
      const result = await generateApiKey(newApiKeyName);
      if (result.success && result.apiKey) {
        toast({ title: 'API Key Generated', description: 'Copy your new API key. It will not be shown again.'});
        setGeneratedApiKey(result.apiKey);
        fetchDetails(); 
      } else {
        toast({ title: 'Error', description: result.message || 'Failed to generate API key.', variant: 'destructive' });
      }
      setIsApiKeyGenerating(false);
    });
  };

  const handleRevokeApiKey = async (apiKeyId: string) => {
    startTransition(async () => {
      const result = await revokeApiKey(apiKeyId);
      if (result.success) {
        toast({ title: 'Success', description: result.message });
        fetchDetails();
      } else {
        toast({ title: 'Error', description: result.message || 'Failed to revoke API key.', variant: 'destructive' });
      }
    });
  };
  
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      toast({ title: "Copied!", description: "API Key copied to clipboard." });
    }).catch(err => {
      toast({ title: "Copy Failed", description: "Could not copy text.", variant: "destructive" });
    });
  };

  const getStatusIndicator = (details: { connected: boolean; status?: string; apiKeySet?: boolean; accessKeyIdSet?: boolean; } | null) => {
    if (!details) return null;
    const isConnected = details.connected && (details.apiKeySet !== undefined ? details.apiKeySet : details.accessKeyIdSet !== undefined ? details.accessKeyIdSet : false);
    if (isConnected) {
      return <CheckCircle className="h-5 w-5 text-green-500" />;
    }
    if (details.status === 'error' || ((details.apiKeySet || details.accessKeyIdSet) && details.status !== 'active')) {
       return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
    }
    return <XCircle className="h-5 w-5 text-red-500" />;
  };
  
  const getStatusText = (details: { connected: boolean; status?: string; connectedAt?: Date | null; apiKeySet?: boolean; accessKeyIdSet?: boolean; } | null, providerName: string) => {
    if (!details) return "Loading...";
    const isConfigured = details.apiKeySet !== undefined ? details.apiKeySet : details.accessKeyIdSet !== undefined ? details.accessKeyIdSet : false;
    
    if (details.status === 'active' && isConfigured) {
      return `Connected. ${details.connectedAt ? `Last update: ${new Date(details.connectedAt).toLocaleDateString()}` : ''}`;
    }
    if (isConfigured && details.status !== 'active') {
      return `${providerName} configured, but connection inactive or in error. Status: ${details.status}`;
    }
    return "Not Connected";
  };


  return (
    <div className="space-y-8">
      <PageHeader
        title="Integrations & API"
        description="Connect your tools, services, and manage API access for PlaneMail."
      />

      {isLoading ? (
        <div className="flex items-center justify-center p-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2">Loading integrations...</span>
        </div>
      ) : (
        <>
        {/* Brevo Integration Card */}
        <Card className="shadow-lg">
          <CardHeader className="flex flex-col sm:flex-row items-start justify-between">
            <div className="flex items-center gap-3 mb-2 sm:mb-0">
              <BrevoLogoSvg />
              <div>
                <CardTitle className="text-xl">
                  Brevo (Email Provider)
                </CardTitle>
                <CardDescription>Connect your Brevo account to send emails.</CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground self-start sm:self-center pt-2 sm:pt-0">
              {getStatusIndicator(brevoDetails)}
              <span>{getStatusText(brevoDetails, 'Brevo')}</span>
            </div>
          </CardHeader>
          <form onSubmit={handleSaveBrevoApiKey}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="brevoApiKey">Brevo API Key (v3)</Label>
                <Input
                  id="brevoApiKey"
                  type="password"
                  placeholder="Paste your Brevo API key here"
                  value={brevoApiKeyInput}
                  onChange={(e) => setBrevoApiKeyInput(e.target.value)}
                  disabled={isBrevoSaving || isBrevoDisconnecting || isPending}
                />
                <p className="text-xs text-muted-foreground">
                  Find your API key in Brevo: SMTP & API &gt; API Keys.
                  <a 
                    href="https://app.brevo.com/settings/keys/api" 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="ml-1 text-primary hover:underline"
                  >
                    Go to Brevo <ExternalLink className="inline h-3 w-3" />
                  </a>
                </p>
              </div>
               {brevoDetails?.apiKeySet && brevoDetails?.maskedApiKey && (
                 <p className="text-sm text-muted-foreground">
                    An API key is currently saved: <span className="font-mono">{brevoDetails.maskedApiKey}</span>. 
                    Enter a new key above to update it.
                 </p>
               )}
            </CardContent>
            <CardFooter className="flex justify-between border-t pt-6">
              <div>
                {brevoDetails?.apiKeySet && (
                  <Button
                    type="button"
                    variant="destructive"
                    onClick={handleDisconnectBrevo}
                    disabled={isBrevoSaving || isBrevoDisconnecting || isPending}
                  >
                    {isBrevoDisconnecting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Disconnect Brevo
                  </Button>
                )}
              </div>
              <Button type="submit" variant="default" disabled={isBrevoSaving || isBrevoDisconnecting || isPending || !brevoApiKeyInput.trim()} className="bg-accent hover:bg-accent/90 text-accent-foreground">
                {isBrevoSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {brevoDetails?.apiKeySet ? 'Update API Key' : 'Connect Brevo'}
              </Button>
            </CardFooter>
          </form>
        </Card>

        {/* Mailgun Integration Card */}
        <Card className="shadow-lg">
          <CardHeader className="flex flex-col sm:flex-row items-start justify-between">
            <div className="flex items-center gap-3 mb-2 sm:mb-0">
              <MailgunLogoSvg />
               <div>
                <CardTitle className="text-xl">
                  Mailgun (Email Provider)
                </CardTitle>
                <CardDescription>Connect your Mailgun account to send emails.</CardDescription>
              </div>
            </div>
             <div className="flex items-center gap-2 text-sm text-muted-foreground self-start sm:self-center pt-2 sm:pt-0">
              {getStatusIndicator(mailgunDetails)}
              <span>{getStatusText(mailgunDetails, 'Mailgun')}</span>
            </div>
          </CardHeader>
          <form onSubmit={handleSaveMailgunCredentials}>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="mailgunApiKey">Mailgun API Key</Label>
                  <Input
                    id="mailgunApiKey"
                    type="password"
                    placeholder="key-yourprivateapikey"
                    value={mailgunApiKeyInput}
                    onChange={(e) => setMailgunApiKeyInput(e.target.value)}
                    disabled={isMailgunSaving || isMailgunDisconnecting || isPending}
                  />
                   {mailgunDetails?.apiKeySet && mailgunDetails?.maskedApiKey && (
                    <p className="text-xs text-muted-foreground">
                        Saved key: <span className="font-mono">{mailgunDetails.maskedApiKey}</span>. Enter new to update.
                    </p>
                   )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="mailgunDomain">Sending Domain</Label>
                  <Input
                    id="mailgunDomain"
                    type="text"
                    placeholder="mg.yourdomain.com"
                    value={mailgunDomainInput}
                    onChange={(e) => setMailgunDomainInput(e.target.value)}
                    disabled={isMailgunSaving || isMailgunDisconnecting || isPending}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="mailgunRegion">Mailgun API Region</Label>
                <Select 
                  value={mailgunRegion} 
                  onValueChange={(value: 'us' | 'eu') => setMailgunRegion(value)}
                  disabled={isMailgunSaving || isMailgunDisconnecting || isPending}
                >
                  <SelectTrigger id="mailgunRegion">
                    <SelectValue placeholder="Select region" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="us">US (api.mailgun.net)</SelectItem>
                    <SelectItem value="eu">EU (api.eu.mailgun.net)</SelectItem>
                  </SelectContent>
                </Select>
                 <p className="text-xs text-muted-foreground">
                  Find your API key and domain in Mailgun settings.
                  <a 
                    href="https://app.mailgun.com/app/sending/domains" 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="ml-1 text-primary hover:underline"
                  >
                    Go to Mailgun <ExternalLink className="inline h-3 w-3" />
                  </a>
                </p>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between border-t pt-6">
              <div>
                {mailgunDetails?.apiKeySet && (
                  <Button
                    type="button"
                    variant="destructive"
                    onClick={handleDisconnectMailgun}
                    disabled={isMailgunSaving || isMailgunDisconnecting || isPending}
                  >
                    {isMailgunDisconnecting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Disconnect Mailgun
                  </Button>
                )}
              </div>
              <Button 
                type="submit" 
                variant="default" 
                disabled={isMailgunSaving || isMailgunDisconnecting || isPending || !mailgunApiKeyInput.trim() || !mailgunDomainInput.trim()} 
                className="bg-accent hover:bg-accent/90 text-accent-foreground"
              >
                {isMailgunSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {mailgunDetails?.apiKeySet ? 'Update Mailgun' : 'Connect Mailgun'}
              </Button>
            </CardFooter>
          </form>
        </Card>

        {/* Amazon SES Integration Card */}
        <Card className="shadow-lg">
          <CardHeader className="flex flex-col sm:flex-row items-start justify-between">
            <div className="flex items-center gap-3 mb-2 sm:mb-0">
              <AmazonSESLogoSvg />
              <div>
                <CardTitle className="text-xl">Amazon SES (Email Provider)</CardTitle>
                <CardDescription>Connect your AWS SES account to send emails.</CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground self-start sm:self-center pt-2 sm:pt-0">
              {getStatusIndicator(sesDetails)}
              <span>{getStatusText(sesDetails, 'Amazon SES')}</span>
            </div>
          </CardHeader>
          <form onSubmit={handleSaveAmazonSESCredentials}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="sesAccessKeyId">AWS Access Key ID</Label>
                <Input
                  id="sesAccessKeyId"
                  type="text"
                  placeholder="AKIAIOSFODNN7EXAMPLE"
                  value={sesAccessKeyIdInput}
                  onChange={(e) => setSesAccessKeyIdInput(e.target.value)}
                  disabled={isSesSaving || isSesDisconnecting || isPending}
                />
                {sesDetails?.accessKeyIdSet && sesDetails?.maskedAccessKeyId && (
                    <p className="text-xs text-muted-foreground">
                        Saved Access Key ID: <span className="font-mono">{sesDetails.maskedAccessKeyId}</span>. Enter new to update.
                    </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="sesSecretAccessKey">AWS Secret Access Key</Label>
                <Input
                  id="sesSecretAccessKey"
                  type="password"
                  placeholder="wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY"
                  value={sesSecretAccessKeyInput}
                  onChange={(e) => setSesSecretAccessKeyInput(e.target.value)}
                  disabled={isSesSaving || isSesDisconnecting || isPending}
                />
                 {sesDetails?.secretAccessKeySet && ( // We don't show masked secret, just indicate it's set
                    <p className="text-xs text-muted-foreground">
                        A Secret Access Key is currently saved. Enter a new key to update it.
                    </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="sesRegion">AWS Region</Label>
                <Select
                  value={sesRegionInput}
                  onValueChange={setSesRegionInput}
                  disabled={isSesSaving || isSesDisconnecting || isPending}
                >
                  <SelectTrigger id="sesRegion">
                    <SelectValue placeholder="Select AWS Region" />
                  </SelectTrigger>
                  <SelectContent>
                    {AWS_REGIONS.map(region => (
                      <SelectItem key={region.value} value={region.value}>{region.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Ensure this is the region where your SES is configured and identities are verified.
                  <a 
                    href="https://docs.aws.amazon.com/ses/latest/dg/regions.html" 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="ml-1 text-primary hover:underline"
                  >
                    AWS Regions <ExternalLink className="inline h-3 w-3" />
                  </a>
                </p>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between border-t pt-6">
              <div>
                {sesDetails?.connected && (
                  <Button
                    type="button"
                    variant="destructive"
                    onClick={handleDisconnectAmazonSES}
                    disabled={isSesSaving || isSesDisconnecting || isPending}
                  >
                    {isSesDisconnecting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Disconnect SES
                  </Button>
                )}
              </div>
              <Button
                type="submit"
                variant="default"
                disabled={isSesSaving || isSesDisconnecting || isPending || !sesAccessKeyIdInput.trim() || !sesSecretAccessKeyInput.trim() || !sesRegionInput.trim()}
                className="bg-accent hover:bg-accent/90 text-accent-foreground"
              >
                {isSesSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {sesDetails?.connected ? 'Update SES Credentials' : 'Connect Amazon SES'}
              </Button>
            </CardFooter>
          </form>
        </Card>

        {/* API Keys Management Card */}
        <Card className="shadow-lg">
            <CardHeader>
                <div className="flex justify-between items-center">
                    <div>
                        <CardTitle className="text-xl flex items-center gap-2">
                            <KeyRound className="h-5 w-5"/> API Keys
                        </CardTitle>
                        <CardDescription>Manage API keys for programmatic access to PlaneMail.</CardDescription>
                    </div>
                    <Dialog open={showNewApiKeyDialog} onOpenChange={(open) => {
                        setShowNewApiKeyDialog(open);
                        if (!open) { 
                           setNewApiKeyName('');
                           setGeneratedApiKey(null);
                        }
                    }}>
                        <DialogTrigger asChild>
                            <Button variant="default" className="bg-accent hover:bg-accent/90 text-accent-foreground">
                                <PlusCircle className="mr-2 h-4 w-4" /> Generate New Key
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-md">
                            <form onSubmit={handleGenerateApiKey}>
                                <DialogHeader>
                                    <DialogTitle>Generate New API Key</DialogTitle>
                                    <DialogDescription>
                                        Give your API key a descriptive name.
                                    </DialogDescription>
                                </DialogHeader>
                                <div className="py-4 space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="apiKeyName">Key Name</Label>
                                        <Input 
                                            id="apiKeyName" 
                                            value={newApiKeyName}
                                            onChange={(e) => setNewApiKeyName(e.target.value)}
                                            placeholder="E.g., My Integration Script"
                                            disabled={isApiKeyGenerating || !!generatedApiKey}
                                        />
                                    </div>
                                    {generatedApiKey && (
                                        <div className="space-y-2">
                                            <Label>Your New API Key</Label>
                                            <Alert variant="default" className="bg-green-50 border-green-300">
                                                <AlertTriangle className="h-4 w-4 text-green-600" />
                                                <AlertTitle className="text-green-700">Copy this key now!</AlertTitle>
                                                <AlertDescription className="text-green-600 text-xs">
                                                    You will not be able to see it again. Store it securely.
                                                </AlertDescription>
                                            </Alert>
                                            <div className="flex items-center gap-2 p-2 border rounded-md bg-muted">
                                                <Input type="text" readOnly value={generatedApiKey} className="font-mono text-xs flex-grow" />
                                                <Button type="button" size="icon" variant="ghost" onClick={() => copyToClipboard(generatedApiKey)}>
                                                    <Copy className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                                <DialogFooter>
                                     {generatedApiKey ? (
                                        <Button type="button" onClick={() => {
                                            setGeneratedApiKey(null); 
                                            setNewApiKeyName(''); 
                                            setShowNewApiKeyDialog(false);
                                        }}>Close</Button>
                                     ) : (
                                        <>
                                        <Button type="button" variant="outline" onClick={() => setShowNewApiKeyDialog(false)} disabled={isApiKeyGenerating}>Cancel</Button>
                                        <Button type="submit" disabled={isApiKeyGenerating || !newApiKeyName.trim()} className="bg-accent hover:bg-accent/90 text-accent-foreground">
                                            {isApiKeyGenerating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                            Generate Key
                                        </Button>
                                        </>
                                     )}
                                </DialogFooter>
                            </form>
                        </DialogContent>
                    </Dialog>
                </div>
            </CardHeader>
            <CardContent>
                {userApiKeys.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-4 text-center">No API keys generated yet.</p>
                ) : (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Name</TableHead>
                                <TableHead>Prefix</TableHead>
                                <TableHead>Created At</TableHead>
                                <TableHead>Last Used</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {userApiKeys.map((key) => (
                                <TableRow key={key.id}>
                                    <TableCell className="font-medium">{key.name}</TableCell>
                                    <TableCell className="font-mono text-xs">{key.prefix}...</TableCell>
                                    <TableCell>{format(new Date(key.createdAt), 'PPpp')}</TableCell>
                                    <TableCell>{key.lastUsedAt ? format(new Date(key.lastUsedAt), 'PPp') : 'Never'}</TableCell>
                                    <TableCell className="text-right">
                                        <AlertDialog>
                                            <AlertDialogTrigger asChild>
                                                <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive/80" title="Revoke Key">
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </AlertDialogTrigger>
                                            <AlertDialogContent>
                                                <AlertDialogHeader>
                                                    <AlertDialogTitle>Revoke API Key "{key.name}"?</AlertDialogTitle>
                                                    <AlertDialogDescription>
                                                        This action cannot be undone. Any applications using this key will no longer be able to access the API.
                                                    </AlertDialogDescription>
                                                </AlertDialogHeader>
                                                <AlertDialogFooter>
                                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                    <AlertDialogAction onClick={() => handleRevokeApiKey(key.id)} variant="destructive">
                                                        Revoke Key
                                                    </AlertDialogAction>
                                                </AlertDialogFooter>
                                            </AlertDialogContent>
                                        </AlertDialog>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                )}
            </CardContent>
        </Card>
        </>
      )}
    </div>
  );
}
