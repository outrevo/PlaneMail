
import { PageHeader } from '@/components/common/PageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, AlertTriangle, Clock, Users, Mail, MousePointerClick } from 'lucide-react';
import Link from 'next/link';
import { getNewsletterWithAnalytics, type NewsletterAnalyticsData } from './actions';
import { Separator } from '@/components/ui/separator';
import { format } from 'date-fns';
import NewsletterCharts from './charts'; // Import the new client component

const StatCard = ({ title, value, icon: Icon, unit = '', description }: { title: string, value: string | number, icon: React.ElementType, unit?: string, description?: string }) => (
  <Card className="border border-gray-200 rounded-2xl shadow-sm">
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium text-gray-600" style={{letterSpacing: '-0.01em'}}>{title}</CardTitle>
      <Icon className="h-5 w-5 text-gray-400" />
    </CardHeader>
    <CardContent>
      <div className="text-3xl font-bold text-black" style={{letterSpacing: '-0.02em'}}>{value}{unit}</div>
      {description && <p className="text-xs text-gray-600 pt-1">{description}</p>}
    </CardContent>
  </Card>
);

export default async function NewsletterAnalyticsPage({ params }: { params: { id: string } }) {
  const newsletterId = params.id;
  const newsletterData: NewsletterAnalyticsData | null = await getNewsletterWithAnalytics(newsletterId);

  if (!newsletterData) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center">
        <AlertTriangle className="w-16 h-16 text-destructive mb-4" />
        <h1 className="text-2xl font-bold text-black" style={{letterSpacing: '-0.02em'}}>Newsletter Not Found</h1>
        <p className="text-gray-600">
          The analytics for this newsletter could not be loaded, or you may not have permission to view it.
        </p>
        <Button asChild className="border-gray-200 hover:bg-gray-50 text-black font-medium rounded-lg transition-colors duration-200 mt-6" style={{letterSpacing: '-0.01em'}}>
          <Link href="/newsletters">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Newsletters
          </Link>
        </Button>
      </div>
    );
  }

  const formattedSentAt = newsletterData.sentAt ? format(new Date(newsletterData.sentAt), 'PPP p') : 'Not Sent';
  const formattedFirstOpenedAt = newsletterData.firstOpenedAt ? format(new Date(newsletterData.firstOpenedAt), 'PPP p') : 'N/A';
  const formattedLastOpenedAt = newsletterData.lastOpenedAt ? format(new Date(newsletterData.lastOpenedAt), 'PPP p') : 'N/A';

  const performanceStats = [
    { title: 'Recipients', value: newsletterData.recipientCount || 0, icon: Users, description: `Newsletter sent to ${newsletterData.recipientCount || 0} subscribers.` },
    { title: 'Unique Opens', value: newsletterData.uniqueOpens || 0, icon: Mail, unit: '', description: `${newsletterData.openRate?.toFixed(2) || '0.00'}% open rate` },
    { title: 'Unique Clicks', value: newsletterData.uniqueClicks || 0, icon: MousePointerClick, unit: '', description: `${newsletterData.clickToOpenRate?.toFixed(2) || '0.00'}% click-to-open rate` },
    { title: 'Bounces', value: newsletterData.totalBounces || 0, icon: AlertTriangle, unit: '', description: `${newsletterData.bounceRate?.toFixed(2) || '0.00'}% bounce rate (est.)` },
  ];
  
  const engagementData = [
    { name: 'Opened', value: newsletterData.uniqueOpens || 0, fill: "hsl(var(--chart-1))" },
    { name: 'Clicked', value: newsletterData.uniqueClicks || 0, fill: "hsl(var(--chart-2))"  },
    { name: 'Not Opened', value: Math.max(0, (newsletterData.recipientCount || 0) - (newsletterData.uniqueOpens || 0)), fill: "hsl(var(--muted))" },
  ];
  const hasRecipientData = (newsletterData.recipientCount || 0) > 0;

  return (
    <div className="space-y-8">
      <PageHeader
        title={`Analytics: ${newsletterData.subject}`}
        description={`Sent on ${formattedSentAt} via ${newsletterData.sendingProviderId || 'N/A'}`}
        actions={
          <Button asChild className="border-gray-200 hover:bg-gray-50 text-black font-medium rounded-lg transition-colors duration-200" style={{letterSpacing: '-0.01em'}}>
            <Link href="/newsletters"><ArrowLeft className="mr-2 h-4 w-4" /> Back to Newsletters</Link>
          </Button>
        }
      />

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {performanceStats.map(stat => <StatCard key={stat.title} {...stat} />)}
      </div>
      
      <NewsletterCharts engagementData={engagementData} hasRecipientData={hasRecipientData} />
      
      <Card className="border border-gray-200 rounded-2xl shadow-sm">
        <CardHeader>
            <CardTitle className="flex items-center gap-2 text-black font-semibold" style={{letterSpacing: '-0.01em'}}><Clock className="h-5 w-5" />Key Timestamps</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
                <p className="text-gray-600">Sent At</p>
                <p className="font-medium text-black" style={{letterSpacing: '-0.01em'}}>{formattedSentAt}</p>
            </div>
            <div>
                <p className="text-gray-600">First Opened</p>
                <p className="font-medium text-black" style={{letterSpacing: '-0.01em'}}>{formattedFirstOpenedAt}</p>
            </div>
            <div>
                <p className="text-gray-600">Last Opened</p>
                <p className="font-medium text-black" style={{letterSpacing: '-0.01em'}}>{formattedLastOpenedAt}</p>
            </div>
        </CardContent>
      </Card>
      
      <Separator />
      <div className="text-center text-muted-foreground text-xs">
        <p>Note: Full analytics including open/click tracking and time-series data are under development.</p>
        <p>Data retention for detailed time-series events will be for 1 month post-campaign send.</p>
      </div>
    </div>
  );
}
