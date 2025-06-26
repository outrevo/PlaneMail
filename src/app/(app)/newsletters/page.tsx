
'use client';

import React, { useState, useEffect, useTransition } from 'react';
import { PageHeader } from '@/components/common/PageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PlusCircle, Send, FileText, Users, Eye, BarChart2 as AnalyticsIcon, Loader2, AlertTriangle, Server, Mail } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getNewsletterPageData, createNewsletter, getSentNewsletters, type NewsletterPageDataType } from './actions';
import type { templates as TemplateType, segments as SegmentType, newsletters } from '@/db/schema';
import Link from 'next/link';
import { type VerifiedBrevoSender } from '../integrations/actions';

type NewsletterSchemaType = typeof newsletters.$inferSelect;

type SentNewsletterDisplay = Pick<NewsletterSchemaType, 'id' | 'subject' | 'status' | 'totalOpens' | 'uniqueOpens' | 'totalClicks' | 'uniqueClicks'> & {
  sentDate: string;
  recipients: number;
  sendingProvider: string | null;
};

export default function NewslettersPage() {
  const { toast } = useToast();
  const [subject, setSubject] = useState('');
  const [fromName, setFromName] = useState(''); 
  const [fromEmail, setFromEmail] = useState(''); 
  const [selectedTemplate, setSelectedTemplate] = useState<string | undefined>(undefined);
  const [selectedSegment, setSelectedSegment] = useState<string | undefined>('all'); 
  const [content, setContent] = useState('');
  
  const [pageData, setPageData] = useState<NewsletterPageDataType | null>(null);
  const [sentNewsletters, setSentNewsletters] = useState<SentNewsletterDisplay[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [activeTab, setActiveTab] = useState('create');

  const [selectedSendingProvider, setSelectedSendingProvider] = useState<string | undefined>(undefined);

  useEffect(() => {
    setIsLoading(true);
    startTransition(async () => {
      try {
        if (activeTab === 'create') {
          const data = await getNewsletterPageData();
          setPageData(data);
          
          let defaultProvider: string | undefined = undefined;
          let defaultFromName = 'Your Name';
          let defaultFromEmail = 'your-email@example.com';

          if (data.brevoIntegration.connected && data.brevoIntegration.apiKeySet) {
            defaultProvider = 'brevo';
            if (data.brevoIntegration.senders && data.brevoIntegration.senders.length > 0) {
              const firstSender = data.brevoIntegration.senders[0];
              defaultFromEmail = firstSender.email;
              defaultFromName = firstSender.name || 'Your Company';
            }
          } else if (data.mailgunIntegration.connected && data.mailgunIntegration.apiKeySet && data.mailgunIntegration.domain) {
            defaultProvider = 'mailgun';
            defaultFromName = 'Your Company';
            defaultFromEmail = `sender@${data.mailgunIntegration.domain}`;
          } else if (data.amazonSESIntegration.connected && data.amazonSESIntegration.accessKeyIdSet) {
            defaultProvider = 'amazon_ses';
            defaultFromName = 'Your Company';
            // For SES, user must provide a verified email, so placeholder is generic
            defaultFromEmail = 'verified-sender@example.com'; 
          }
          
          setFromName(defaultFromName);
          setFromEmail(defaultFromEmail);
          setSelectedSendingProvider(defaultProvider);

        } else if (activeTab === 'sent') {
          const data = await getSentNewsletters();
          setSentNewsletters(data as SentNewsletterDisplay[]);
        }
      } catch (error) {
        toast({ title: 'Error', description: 'Failed to load data.', variant: 'destructive' });
      } finally {
        setIsLoading(false);
      }
    });
  }, [activeTab, toast]);


  const handleSendNewsletter = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!subject || !selectedSegment || !fromEmail || !fromName || !selectedSendingProvider) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields (Subject, From Name, From Email, Recipient Segment, Send Via).",
        variant: "destructive",
      });
      return;
    }
    
    setIsSending(true);
    const formDataObj = new FormData();
    formDataObj.append('subject', subject);
    formDataObj.append('fromName', fromName);
    formDataObj.append('fromEmail', fromEmail);
    if (selectedTemplate && selectedTemplate !== 'none') formDataObj.append('templateId', selectedTemplate);
    if (selectedSegment) formDataObj.append('segmentId', selectedSegment);
    if (!selectedTemplate || selectedTemplate === 'none') formDataObj.append('content', content);
    formDataObj.append('sendingProviderId', selectedSendingProvider);


    startTransition(async () => {
      const result = await createNewsletter(formDataObj);
      if (result.success) {
        toast({ title: 'Success', description: result.message });
        setSubject(''); 
        if (activeTab === 'sent') {
            const data = await getSentNewsletters();
            setSentNewsletters(data as SentNewsletterDisplay[]);
        }
      } else {
        let errorDescription = result.message || 'Failed to send newsletter.';
        if (result.errors) {
            const fieldErrors = Object.values(result.errors).flat().join(' ');
            if (fieldErrors) errorDescription += ` Details: ${fieldErrors}`;
        }
        toast({ title: 'Error Sending Newsletter', description: errorDescription, variant: 'destructive' });
      }
      setIsSending(false);
    });
  };
  
  const availableProviders = [];
  if (pageData?.brevoIntegration?.connected && pageData?.brevoIntegration?.apiKeySet) {
    availableProviders.push({ value: 'brevo', label: 'Brevo' });
  }
  if (pageData?.mailgunIntegration?.connected && pageData?.mailgunIntegration?.apiKeySet) {
    availableProviders.push({ value: 'mailgun', label: 'Mailgun' });
  }
  if (pageData?.amazonSESIntegration?.connected && pageData?.amazonSESIntegration?.accessKeyIdSet) {
    availableProviders.push({ value: 'amazon_ses', label: 'Amazon SES' });
  }
  
  const currentBrevoSenders = (selectedSendingProvider === 'brevo' && pageData?.brevoIntegration?.senders) || [];
  const mailgunDomain = (selectedSendingProvider === 'mailgun' && pageData?.mailgunIntegration?.domain);
  // For SES, verified identities can be shown if fetched, but for now, we just guide the user.
  const sesVerifiedIdentities = (selectedSendingProvider === 'amazon_ses' && pageData?.amazonSESIntegration?.verifiedIdentities) || [];


  return (
    <Tabs defaultValue="create" value={activeTab} onValueChange={setActiveTab} className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
        <PageHeader
            title="Newsletters"
            description="Create, send, and manage your email campaigns."
        />
        <TabsList className="mt-4 sm:mt-0 bg-gray-100 border border-gray-200 rounded-lg">
            <TabsTrigger value="create" className="text-sm font-medium rounded-md transition-colors duration-200" style={{letterSpacing: '-0.01em'}}>
              <PlusCircle className="mr-2 h-4 w-4"/>Create New
            </TabsTrigger>
            <TabsTrigger value="sent" className="text-sm font-medium rounded-md transition-colors duration-200" style={{letterSpacing: '-0.01em'}}>
              <Send className="mr-2 h-4 w-4"/>Sent Newsletters
            </TabsTrigger>
        </TabsList>
      </div>

      <TabsContent value="create">
        <Card className="border border-gray-200 rounded-2xl shadow-sm">
          <form onSubmit={handleSendNewsletter}>
            <CardHeader>
              <CardTitle className="text-xl font-semibold text-black" style={{letterSpacing: '-0.01em'}}>Compose New Newsletter</CardTitle>
              <CardDescription className="text-gray-600">Fill in the details below to create your newsletter. Currently, all sends are test sends to your 'From Email'.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {isLoading && activeTab === 'create' ? (
                <div className="flex items-center justify-center p-12">
                  <Loader2 className="h-8 w-8 animate-spin text-black" /> 
                  <span className="ml-2 text-gray-600">Loading data...</span>
                </div>
              ) : availableProviders.length === 0 ? (
                <>
                  {/* Debug information for development */}
                  {process.env.NODE_ENV === 'development' && pageData && (
                    <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-xl">
                      <h3 className="font-bold text-blue-800 mb-2">🔍 Debug Information</h3>
                      <div className="text-xs text-blue-700 space-y-1">
                        <p><strong>Brevo:</strong> connected={String(pageData.brevoIntegration?.connected)}, apiKeySet={String(pageData.brevoIntegration?.apiKeySet)}, status={pageData.brevoIntegration?.status}</p>
                        <p><strong>Mailgun:</strong> connected={String(pageData.mailgunIntegration?.connected)}, apiKeySet={String(pageData.mailgunIntegration?.apiKeySet)}, status={pageData.mailgunIntegration?.status}</p>
                        <p><strong>Amazon SES:</strong> connected={String(pageData.amazonSESIntegration?.connected)}, accessKeyIdSet={String(pageData.amazonSESIntegration?.accessKeyIdSet)}, status={pageData.amazonSESIntegration?.status}</p>
                        <p><strong>Available Providers Count:</strong> {availableProviders.length}</p>
                      </div>
                    </div>
                  )}
                  
                  <div className="p-4 border border-yellow-300 bg-yellow-50 rounded-xl text-yellow-700">
                    <div className="flex items-center">
                      <AlertTriangle className="h-5 w-5 mr-2" />
                      <h3 className="font-semibold" style={{letterSpacing: '-0.01em'}}>Email Provider Required</h3>
                    </div>
                    <p className="text-sm mt-1">
                      To send newsletters, please connect and configure an email provider (Brevo, Mailgun, or Amazon SES) in the{' '}
                      <Button variant="link" asChild className="p-0 h-auto text-sm text-yellow-800 font-medium hover:text-yellow-900"><Link href="/integrations">Integrations page</Link></Button>.
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="subject" className="text-sm font-medium text-black" style={{letterSpacing: '-0.01em'}}>Subject Line</Label>
                      <Input 
                        id="subject" 
                        placeholder="E.g., Our Exciting Weekly Update!" 
                        value={subject} 
                        onChange={(e) => setSubject(e.target.value)} 
                        required 
                        className="border-gray-200 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="template" className="text-sm font-medium text-black" style={{letterSpacing: '-0.01em'}}>Select Template (Optional)</Label>
                      <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
                        <SelectTrigger id="template" className="border-gray-200 rounded-lg">
                          <SelectValue placeholder="Choose a template" />
                        </SelectTrigger>
                        <SelectContent className="border border-gray-200 rounded-lg bg-white shadow-sm">
                          {pageData?.templates.map((template) => (
                            <SelectItem key={template.id} value={template.id} className="text-sm">
                              {template.name}
                            </SelectItem>
                          ))}
                          <SelectItem value="none" className="text-sm">No Template (Use Content Below)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                     <div className="space-y-2">
                        <Label htmlFor="sendingProvider" className="text-sm font-medium text-black" style={{letterSpacing: '-0.01em'}}>Send Via</Label>
                        <Select value={selectedSendingProvider} onValueChange={setSelectedSendingProvider} required>
                            <SelectTrigger id="sendingProvider" className="border-gray-200 rounded-lg">
                                <SelectValue placeholder="Select email provider" />
                            </SelectTrigger>
                            <SelectContent className="border border-gray-200 rounded-lg bg-white shadow-sm">
                                {availableProviders.map(provider => (
                                    <SelectItem key={provider.value} value={provider.value} className="text-sm">
                                        {provider.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="segment" className="text-sm font-medium text-black" style={{letterSpacing: '-0.01em'}}>Recipient Segment (Test Target)</Label>
                        <Select value={selectedSegment} onValueChange={setSelectedSegment} required>
                            <SelectTrigger id="segment" className="border-gray-200 rounded-lg">
                            <SelectValue placeholder="Select recipients (sends to 'From Email')" />
                            </SelectTrigger>
                            <SelectContent className="border border-gray-200 rounded-lg bg-white shadow-sm">
                            {pageData?.segments.map((segment) => (
                                <SelectItem key={segment.id} value={segment.id} className="text-sm">
                                {segment.name}
                                </SelectItem>
                            ))}
                            </SelectContent>
                        </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="fromName" className="text-sm font-medium text-black" style={{letterSpacing: '-0.01em'}}>From Name</Label>
                      <Input 
                        id="fromName" 
                        placeholder="Your Company Name" 
                        value={fromName} 
                        onChange={(e) => setFromName(e.target.value)} 
                        required 
                        className="border-gray-200 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                      />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="fromEmail" className="text-sm font-medium text-black" style={{letterSpacing: '-0.01em'}}>From Email</Label>
                        {selectedSendingProvider === 'brevo' && currentBrevoSenders.length > 0 ? (
                            <Select 
                                value={fromEmail} 
                                onValueChange={(value) => {
                                    setFromEmail(value);
                                    const selected = currentBrevoSenders.find(s => s.email === value);
                                    if (selected?.name) setFromName(selected.name);
                                }}
                                required
                            >
                                <SelectTrigger id="fromEmailBrevo" className="border-gray-200 rounded-lg">
                                    <SelectValue placeholder="Select verified Brevo sender" />
                                </SelectTrigger>
                                <SelectContent className="border border-gray-200 rounded-lg bg-white shadow-sm">
                                    {currentBrevoSenders.map((sender) => (
                                        <SelectItem key={sender.email} value={sender.email} className="text-sm">
                                            {sender.name ? `${sender.name} <${sender.email}>` : sender.email}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        ) : (
                            <Input 
                                id="fromEmailInput" 
                                type="email" 
                                placeholder={
                                    selectedSendingProvider === 'mailgun' ? `sender@${mailgunDomain || 'your-mailgun-domain.com'}` :
                                    selectedSendingProvider === 'amazon_ses' ? 'verified-sender@example.com' :
                                    'your-email@example.com'
                                }
                                value={fromEmail} 
                                onChange={(e) => setFromEmail(e.target.value)} 
                                required 
                                className="border-gray-200 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                            />
                        )}
                        {selectedSendingProvider === 'brevo' && currentBrevoSenders.length === 0 && pageData?.brevoIntegration.connected && (
                             <p className="text-xs text-gray-500">No verified senders found for Brevo. Please add/verify in Brevo and refresh on the <Link href="/integrations" className="underline text-black font-medium">Integrations</Link> page.</p>
                        )}
                        {selectedSendingProvider === 'mailgun' && mailgunDomain && (
                            <p className="text-xs text-gray-500">Ensure this email address uses your verified Mailgun domain: <span className="font-semibold text-black">{mailgunDomain}</span>.</p>
                        )}
                        {selectedSendingProvider === 'amazon_ses' && (
                             <p className="text-xs text-gray-500">Ensure this email address is verified in AWS SES for the selected region.
                                {sesVerifiedIdentities.length > 0 && ` (Found: ${sesVerifiedIdentities.slice(0,2).join(', ')}${sesVerifiedIdentities.length > 2 ? '...' : ''})`}
                             </p>
                        )}
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="content" className="text-sm font-medium text-black" style={{letterSpacing: '-0.01em'}}>Email Content (if "No Template" selected)</Label>
                    {selectedTemplate && selectedTemplate !== 'none' ? (
                      <div className="p-6 border border-gray-200 rounded-xl min-h-[150px] bg-gray-50 flex items-center justify-center text-gray-600">
                        <FileText className="h-8 w-8 mr-2"/> Template "{pageData?.templates.find(t => t.id === selectedTemplate)?.name}" selected.
                      </div>
                    ) : (
                      <Textarea 
                        id="content" 
                        placeholder="Type your email content here (plain text or paste TipTap JSON)..." 
                        rows={8} 
                        value={content} 
                        onChange={(e) => setContent(e.target.value)} 
                        className="border-gray-200 rounded-xl focus:ring-2 focus:ring-black focus:border-transparent"
                      />
                    )}
                  </div>
                </>
              )}
            </CardContent>
            <CardFooter className="flex justify-end gap-3 border-t border-gray-200 pt-6">
              <Button 
                type="button" 
                variant="outline" 
                disabled={isSending || availableProviders.length === 0}
                className="border-gray-200 hover:bg-gray-50 text-black font-medium rounded-lg transition-colors duration-200"
                style={{letterSpacing: '-0.01em'}}
              >
                <Eye className="mr-2 h-4 w-4" /> Preview (Soon)
              </Button>
              <Button 
                type="submit" 
                variant="default" 
                disabled={isSending || isLoading || availableProviders.length === 0} 
                className="bg-black hover:bg-gray-900 text-white font-medium rounded-lg transition-colors duration-200"
                style={{letterSpacing: '-0.01em'}}
              >
                {isSending && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                <Send className="mr-2 h-4 w-4" /> {isSending ? 'Sending...' : 'Send Test Newsletter'}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </TabsContent>

      <TabsContent value="sent">
        <Card className="border border-gray-200 rounded-2xl shadow-sm">
          <CardHeader>
            <CardTitle className="text-xl font-semibold text-black" style={{letterSpacing: '-0.01em'}}>Sent Newsletters</CardTitle>
            <CardDescription className="text-gray-600">Review your past campaigns.</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading && activeTab === 'sent' ? (
               <div className="flex items-center justify-center p-12">
                  <Loader2 className="h-8 w-8 animate-spin text-black" /> 
                  <span className="ml-2 text-gray-600">Loading newsletters...</span>
               </div>
            ) : sentNewsletters.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-b border-gray-200">
                      <TableHead className="text-black font-medium" style={{letterSpacing: '-0.01em'}}>Subject</TableHead>
                      <TableHead className="text-black font-medium" style={{letterSpacing: '-0.01em'}}>Sent Date</TableHead>
                      <TableHead className="text-right text-black font-medium" style={{letterSpacing: '-0.01em'}}>Recipients</TableHead>
                      <TableHead className="text-right text-black font-medium" style={{letterSpacing: '-0.01em'}}>Opens</TableHead>
                      <TableHead className="text-right text-black font-medium" style={{letterSpacing: '-0.01em'}}>Clicks</TableHead>
                      <TableHead className="text-right text-black font-medium" style={{letterSpacing: '-0.01em'}}>Provider</TableHead>
                      <TableHead className="text-right text-black font-medium" style={{letterSpacing: '-0.01em'}}>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sentNewsletters.map((nl) => (
                      <TableRow key={nl.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors duration-200">
                        <TableCell className="font-medium max-w-[250px] truncate text-black" title={nl.subject} style={{letterSpacing: '-0.01em'}}>{nl.subject}</TableCell>
                        <TableCell className="text-gray-600">{nl.sentDate}</TableCell>
                        <TableCell className="text-right text-gray-600">{nl.recipients}</TableCell>
                        <TableCell className="text-right text-gray-600">{nl.uniqueOpens || 0}</TableCell>
                        <TableCell className="text-right text-gray-600">{nl.uniqueClicks || 0}</TableCell>
                        <TableCell className="text-right capitalize text-gray-600">
                          {nl.sendingProvider === 'amazon_ses' ? 'Amazon SES' : nl.sendingProvider || 'N/A'}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button variant="ghost" size="icon" asChild title="View Analytics Report" className="h-8 w-8 hover:bg-gray-100 rounded-lg transition-colors duration-200">
                              <Link href={`/newsletters/${nl.id}/analytics`}>
                                <AnalyticsIcon className="h-4 w-4 text-gray-600" />
                              </Link>
                            </Button>
                            <Button variant="ghost" size="icon" title="View Email (Soon)" disabled className="h-8 w-8 hover:bg-gray-100 rounded-lg transition-colors duration-200">
                              <Mail className="h-4 w-4 text-gray-400" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-12">
                <Send className="mx-auto h-12 w-12 text-gray-400" />
                <p className="mt-4 text-gray-600">You haven't sent any newsletters yet.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}
