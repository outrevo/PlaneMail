import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, ArrowRight, Mail, Users, BarChart3, Settings, Send, Clock, Target, Shield } from "lucide-react";
import { Logo } from "@/components/icons/Logo";
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Email Marketing Guide | PlaneMail Campaign Management & Optimization',
  description: 'Complete guide to email marketing with PlaneMail. Learn campaign creation, audience segmentation, deliverability optimization, analytics, and best practices for higher engagement.',
  keywords: ['email marketing', 'email campaigns', 'audience segmentation', 'email deliverability', 'email analytics', 'newsletter marketing', 'email automation', 'subscriber management'],
  openGraph: {
    title: 'Email Marketing Guide - PlaneMail Campaign Management & Optimization',
    description: 'Master email marketing with PlaneMail. Create campaigns, segment audiences, optimize deliverability, and track performance.',
    type: 'article',
    siteName: 'PlaneMail',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Email Marketing Guide - PlaneMail Campaign Management & Optimization',
    description: 'Master email marketing with PlaneMail. Create campaigns, segment audiences, optimize deliverability, and track performance.',
  },
};

export default function EmailMarketingPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <Link href="/docs" className="flex items-center space-x-2">
              <Logo className="h-8 w-8" />
              <span className="text-xl font-bold">PlaneMail Docs</span>
            </Link>
            <Link href="/docs">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Docs
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Email Marketing: Complete Campaign Management Guide</h1>
          <p className="text-gray-600 mb-8">
            Master email marketing with PlaneMail's comprehensive guide. Learn to create high-converting campaigns, segment your audience effectively, 
            optimize deliverability, track performance metrics, and implement best practices that drive engagement and results.
          </p>

          {/* Campaign Creation */}
          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Creating Email Campaigns</h2>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Mail className="h-5 w-5 text-blue-600" />
                  <span>From Post to Email</span>
                </CardTitle>
                <CardDescription>
                  Transform your posts into engaging email campaigns with PlaneMail's streamlined workflow.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">Campaign Setup Process</h3>
                  <ol className="list-decimal list-inside space-y-2 text-gray-700">
                    <li><strong>Create Your Post</strong> - Write your content using our rich editor</li>
                    <li><strong>Choose Email Settings</strong> - Configure subject line, sender info, and timing</li>
                    <li><strong>Select Audience</strong> - Pick segments or send to all subscribers</li>
                    <li><strong>Preview & Test</strong> - Review how your email will look across devices</li>
                    <li><strong>Send or Schedule</strong> - Launch immediately or schedule for optimal timing</li>
                  </ol>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Email Configuration Options</h3>
                  <ul className="list-disc list-inside space-y-1 text-gray-700">
                    <li><strong>Subject Line</strong> - Compelling headlines that drive opens</li>
                    <li><strong>From Name</strong> - Personal or brand name for sender identity</li>
                    <li><strong>From Email</strong> - Verified sender email address</li>
                    <li><strong>Reply-to Email</strong> - Where responses should be directed</li>
                    <li><strong>Preheader Text</strong> - Preview text shown in email clients</li>
                  </ul>
                </div>
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-blue-900 mb-2">📧 Subject Line Tips</h4>
                  <ul className="text-blue-800 text-sm space-y-1">
                    <li>• Keep it under 50 characters for mobile optimization</li>
                    <li>• Create urgency or curiosity without being clickbait</li>
                    <li>• Personalize when possible (Hi [Name], etc.)</li>
                    <li>• A/B test different approaches to find what works</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* Audience Segmentation */}
          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Audience Segmentation</h2>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Users className="h-5 w-5 text-green-600" />
                  <span>Targeting the Right People</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">Segmentation Strategies</h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Demographics</h4>
                      <ul className="text-sm text-gray-700 space-y-1">
                        <li>• Age and location</li>
                        <li>• Industry and job role</li>
                        <li>• Company size</li>
                        <li>• Experience level</li>
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Behavior</h4>
                      <ul className="text-sm text-gray-700 space-y-1">
                        <li>• Email engagement history</li>
                        <li>• Website activity</li>
                        <li>• Purchase history</li>
                        <li>• Content preferences</li>
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Interests</h4>
                      <ul className="text-sm text-gray-700 space-y-1">
                        <li>• Topic preferences</li>
                        <li>• Product interests</li>
                        <li>• Event attendance</li>
                        <li>• Survey responses</li>
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Lifecycle Stage</h4>
                      <ul className="text-sm text-gray-700 space-y-1">
                        <li>• New subscribers</li>
                        <li>• Active customers</li>
                        <li>• Inactive users</li>
                        <li>• VIP customers</li>
                      </ul>
                    </div>
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Creating Segments in PlaneMail</h3>
                  <ol className="list-decimal list-inside space-y-2 text-gray-700">
                    <li>Go to Audience → Segments</li>
                    <li>Click "Create New Segment"</li>
                    <li>Define your criteria and filters</li>
                    <li>Preview the segment size</li>
                    <li>Save and name your segment</li>
                  </ol>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-green-900 mb-2">🎯 Segmentation Best Practices</h4>
                  <ul className="text-green-800 text-sm space-y-1">
                    <li>• Start with broad segments, then refine over time</li>
                    <li>• Ensure segments are large enough to be statistically significant</li>
                    <li>• Regularly review and update segment criteria</li>
                    <li>• Test different messaging for each segment</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* Email Deliverability */}
          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Email Deliverability</h2>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Shield className="h-5 w-5 text-purple-600" />
                  <span>Reaching the Inbox</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">Key Factors for Deliverability</h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Sender Reputation</h4>
                      <ul className="text-sm text-gray-700 space-y-1">
                        <li>• Consistent sending patterns</li>
                        <li>• Low bounce and complaint rates</li>
                        <li>• Proper authentication (SPF, DKIM, DMARC)</li>
                        <li>• Clean subscriber lists</li>
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Content Quality</h4>
                      <ul className="text-sm text-gray-700 space-y-1">
                        <li>• Avoid spam trigger words</li>
                        <li>• Balance text and images</li>
                        <li>• Include plain text version</li>
                        <li>• Relevant, valuable content</li>
                      </ul>
                    </div>
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Email Authentication Setup</h3>
                  <p className="text-gray-700 mb-3">
                    Work with your email service provider to configure these authentication protocols:
                  </p>
                  <ul className="list-disc list-inside space-y-1 text-gray-700">
                    <li><strong>SPF (Sender Policy Framework)</strong> - Verifies sending servers</li>
                    <li><strong>DKIM (DomainKeys Identified Mail)</strong> - Digital signature verification</li>
                    <li><strong>DMARC (Domain-based Message Authentication)</strong> - Policy enforcement</li>
                  </ul>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-purple-900 mb-2">🛡️ Deliverability Checklist</h4>
                  <ul className="text-purple-800 text-sm space-y-1">
                    <li>• Use a reputable email service provider</li>
                    <li>• Implement proper authentication protocols</li>
                    <li>• Maintain clean subscriber lists</li>
                    <li>• Monitor bounce and complaint rates</li>
                    <li>• Send consistent, valuable content</li>
                    <li>• Avoid spam trigger words and tactics</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* Scheduling and Automation */}
          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Scheduling and Timing</h2>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Clock className="h-5 w-5 text-orange-600" />
                  <span>Optimal Send Times</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">Best Practice Send Times</h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Days of the Week</h4>
                      <ul className="text-sm text-gray-700 space-y-1">
                        <li>• <strong>Tuesday-Thursday</strong> - Generally highest engagement</li>
                        <li>• <strong>Monday</strong> - Good for B2B audiences</li>
                        <li>• <strong>Weekend</strong> - Can work for B2C and lifestyle content</li>
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Times of Day</h4>
                      <ul className="text-sm text-gray-700 space-y-1">
                        <li>• <strong>10 AM - 12 PM</strong> - Morning productivity window</li>
                        <li>• <strong>2 PM - 4 PM</strong> - Post-lunch engagement</li>
                        <li>• <strong>8 PM - 10 PM</strong> - Evening leisure time</li>
                      </ul>
                    </div>
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Timezone Considerations</h3>
                  <ul className="list-disc list-inside space-y-1 text-gray-700">
                    <li>Send based on your audience's timezone, not yours</li>
                    <li>Consider using timezone-based scheduling for global audiences</li>
                    <li>Test different times to find what works for your specific audience</li>
                    <li>Monitor engagement patterns over time</li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Scheduling in PlaneMail</h3>
                  <ol className="list-decimal list-inside space-y-2 text-gray-700">
                    <li>Complete your post and email configuration</li>
                    <li>In the Review step, choose "Schedule" instead of "Send Now"</li>
                    <li>Select your preferred date and time</li>
                    <li>Confirm timezone settings</li>
                    <li>Review and confirm the scheduled send</li>
                  </ol>
                </div>
                <div className="bg-orange-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-orange-900 mb-2">⏰ Timing Tips</h4>
                  <ul className="text-orange-800 text-sm space-y-1">
                    <li>• Test different send times to find your audience's preferences</li>
                    <li>• Consider your content type (newsletters vs. promotions)</li>
                    <li>• Avoid major holidays and industry-specific busy periods</li>
                    <li>• Be consistent with your sending schedule</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* Analytics and Performance */}
          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Analytics and Performance</h2>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <BarChart3 className="h-5 w-5 text-teal-600" />
                  <span>Measuring Success</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">Key Email Metrics</h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Engagement Metrics</h4>
                      <ul className="text-sm text-gray-700 space-y-1">
                        <li>• <strong>Open Rate</strong> - % of recipients who opened</li>
                        <li>• <strong>Click Rate</strong> - % who clicked links</li>
                        <li>• <strong>Click-to-Open Rate</strong> - Clicks as % of opens</li>
                        <li>• <strong>Unsubscribe Rate</strong> - % who opted out</li>
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Delivery Metrics</h4>
                      <ul className="text-sm text-gray-700 space-y-1">
                        <li>• <strong>Delivery Rate</strong> - % successfully delivered</li>
                        <li>• <strong>Bounce Rate</strong> - % that couldn't be delivered</li>
                        <li>• <strong>Spam Complaint Rate</strong> - % marked as spam</li>
                        <li>• <strong>List Growth Rate</strong> - New subscribers over time</li>
                      </ul>
                    </div>
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Benchmark Performance</h3>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-medium text-gray-900 mb-2">Industry Averages</h4>
                    <div className="grid md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <strong>Open Rate</strong>
                        <p className="text-gray-700">20-25% (varies by industry)</p>
                      </div>
                      <div>
                        <strong>Click Rate</strong>
                        <p className="text-gray-700">2-5% (varies by industry)</p>
                      </div>
                      <div>
                        <strong>Unsubscribe Rate</strong>
                        <p className="text-gray-700">Below 1% is ideal</p>
                      </div>
                    </div>
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Using Analytics for Improvement</h3>
                  <ul className="list-disc list-inside space-y-1 text-gray-700">
                    <li>Identify your best-performing content and replicate it</li>
                    <li>Test different subject lines and send times</li>
                    <li>Segment underperforming audiences for targeted improvement</li>
                    <li>Monitor trends over time, not just individual campaigns</li>
                    <li>Use A/B testing to validate changes</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* Email Service Providers */}
          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Email Service Providers</h2>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Settings className="h-5 w-5 text-indigo-600" />
                  <span>Choosing Your ESP</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-3">Supported Providers</h3>
                  <div className="grid md:grid-cols-3 gap-4">
                    <div className="border border-gray-200 rounded-lg p-4">
                      <h4 className="font-semibold text-gray-900 mb-2">AWS SES</h4>
                      <ul className="text-sm text-gray-700 space-y-1">
                        <li>• $0.10 per 1,000 emails</li>
                        <li>• High volume capacity</li>
                        <li>• Requires technical setup</li>
                        <li>• Best for developers</li>
                      </ul>
                    </div>
                    <div className="border border-gray-200 rounded-lg p-4">
                      <h4 className="font-semibold text-gray-900 mb-2">Brevo</h4>
                      <ul className="text-sm text-gray-700 space-y-1">
                        <li>• 300 emails/day free</li>
                        <li>• Marketing automation</li>
                        <li>• Easy setup</li>
                        <li>• Great for beginners</li>
                      </ul>
                    </div>
                    <div className="border border-gray-200 rounded-lg p-4">
                      <h4 className="font-semibold text-gray-900 mb-2">Mailgun</h4>
                      <ul className="text-sm text-gray-700 space-y-1">
                        <li>• Developer-friendly</li>
                        <li>• Powerful APIs</li>
                        <li>• Good deliverability</li>
                        <li>• Flexible pricing</li>
                      </ul>
                    </div>
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Setup Instructions</h3>
                  <p className="text-gray-700 mb-3">
                    Each provider has specific setup requirements. Visit our integration guides for detailed instructions:
                  </p>
                  <div className="space-y-2">
                    <Link href="/docs/integrations/aws-ses" className="block text-blue-600 hover:underline">
                      → AWS SES Integration Guide
                    </Link>
                    <Link href="/docs/integrations/brevo" className="block text-blue-600 hover:underline">
                      → Brevo Integration Guide
                    </Link>
                    <Link href="/docs/integrations/mailgun" className="block text-blue-600 hover:underline">
                      → Mailgun Integration Guide
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* Next Steps */}
          <section className="text-center bg-gray-50 p-8 rounded-lg">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Ready to Launch Your Email Campaigns?</h2>
            <p className="text-gray-600 mb-6">
              Start sending engaging emails that your audience will love to receive.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild>
                <Link href="/posts">
                  Create Your First Campaign
                </Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/docs/audience">
                  Learn Audience Management
                </Link>
              </Button>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
