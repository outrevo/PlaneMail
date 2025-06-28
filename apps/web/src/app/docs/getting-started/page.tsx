import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, ArrowRight, Check, User, Mail, FileText, Send, Globe, Settings } from "lucide-react";
import { Logo } from "@/components/icons/Logo";
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Getting Started with PlaneMail | Email Marketing Setup Guide',
  description: 'Quick start guide for PlaneMail. Learn to set up your account, create your first post with our Notion-style editor, configure email delivery, and send your first campaign in minutes.',
  keywords: ['PlaneMail setup', 'email marketing tutorial', 'getting started guide', 'account setup', 'first email campaign', 'Notion editor tutorial'],
  openGraph: {
    title: 'Getting Started with PlaneMail - Email Marketing Setup Guide',
    description: 'Step-by-step guide to get started with PlaneMail email marketing platform. Create posts, send campaigns, and grow your audience.',
    type: 'article',
    siteName: 'PlaneMail',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Getting Started with PlaneMail - Email Marketing Setup Guide',
    description: 'Step-by-step guide to get started with PlaneMail email marketing platform. Create posts, send campaigns, and grow your audience.',
  },
};

export default function GettingStartedPage() {
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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Getting Started with PlaneMail: Complete Setup Guide</h1>
          <p className="text-gray-600 mb-8">
            Welcome to PlaneMail! This comprehensive guide will help you set up your email marketing account, create engaging content with our Notion-style editor, 
            and send your first campaign in just a few minutes. Perfect for beginners and experienced marketers alike.
          </p>

          {/* Progress Steps */}
          <div className="mb-12">
            <h2 className="text-2xl font-semibold text-gray-900 mb-6">Quick Start Checklist</h2>
            <div className="space-y-4">
              {[
                { icon: User, title: "Create your account", description: "Sign up and verify your email address" },
                { icon: Settings, title: "Configure your workspace", description: "Set up your profile and preferences" },
                { icon: FileText, title: "Create your first post", description: "Use our Notion-style editor to craft content" },
                { icon: Mail, title: "Set up email delivery", description: "Connect an email service provider" },
                { icon: Send, title: "Send your first campaign", description: "Publish to email or web" },
                { icon: Globe, title: "Explore advanced features", description: "Discover integrations and automation" },
              ].map((step, index) => (
                <div key={index} className="flex items-start space-x-4 p-4 rounded-lg border border-gray-200 bg-gray-50">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <step.icon className="w-4 h-4 text-blue-600" />
                    </div>
                  </div>
                  <div className="flex-grow">
                    <h3 className="font-semibold text-gray-900">{step.title}</h3>
                    <p className="text-sm text-gray-600">{step.description}</p>
                  </div>
                  <div className="flex-shrink-0">
                    <Check className="w-5 h-5 text-green-600" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Step 1: Account Setup */}
          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Step 1: Create Your Account</h2>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <User className="h-5 w-5 text-blue-600" />
                  <span>Account Registration</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">Sign Up Process</h3>
                  <ol className="list-decimal list-inside space-y-2 text-gray-700">
                    <li>Visit the <Link href="/sign-up" className="text-blue-600 hover:underline">PlaneMail sign-up page</Link></li>
                    <li>Enter your email address and create a secure password</li>
                    <li>Verify your email address by clicking the link sent to your inbox</li>
                    <li>Complete your profile with your name and business information</li>
                  </ol>
                </div>
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-blue-900 mb-2">💡 Pro Tip</h4>
                  <p className="text-blue-800 text-sm">
                    Use a business email address for better deliverability when sending campaigns to your audience.
                  </p>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* Step 2: Workspace Configuration */}
          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Step 2: Configure Your Workspace</h2>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Settings className="h-5 w-5 text-green-600" />
                  <span>Workspace Setup</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">Initial Configuration</h3>
                  <ul className="list-disc list-inside space-y-2 text-gray-700">
                    <li>Set your default sender name and email address</li>
                    <li>Choose your timezone for scheduling</li>
                    <li>Configure your brand colors and logo (optional)</li>
                    <li>Set up your workspace preferences</li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Dashboard Overview</h3>
                  <p className="text-gray-700 mb-2">Once logged in, you'll see your dashboard with:</p>
                  <ul className="list-disc list-inside space-y-1 text-gray-700">
                    <li>Recent posts and campaigns</li>
                    <li>Performance analytics</li>
                    <li>Quick action buttons</li>
                    <li>Navigation to all features</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* Step 3: Create First Post */}
          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Step 3: Create Your First Post</h2>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <FileText className="h-5 w-5 text-purple-600" />
                  <span>Content Creation</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">Using the Notion-Style Editor</h3>
                  <ol className="list-decimal list-inside space-y-2 text-gray-700">
                    <li>Click "Create New Post" from your dashboard</li>
                    <li>Enter a compelling title for your content</li>
                    <li>Write a brief excerpt or summary</li>
                    <li>Use the rich editor to create your content:
                      <ul className="list-disc list-inside ml-6 mt-2 space-y-1">
                        <li>Type "/" to access slash commands</li>
                        <li>Add headings, lists, images, and more</li>
                        <li>Use block indicators for easy navigation</li>
                        <li>Upload images by dragging and dropping</li>
                      </ul>
                    </li>
                    <li>Save as draft or proceed to publishing options</li>
                  </ol>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-purple-900 mb-2">🎨 Editor Features</h4>
                  <p className="text-purple-800 text-sm">
                    Our editor supports rich formatting, slash commands for quick actions, image uploads, 
                    and real-time auto-save to ensure you never lose your work.
                  </p>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* Step 4: Email Setup */}
          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Step 4: Set Up Email Delivery</h2>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Mail className="h-5 w-5 text-orange-600" />
                  <span>Email Service Integration</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">Supported Email Providers</h3>
                  <p className="text-gray-700 mb-3">
                    PlaneMail integrates with popular email service providers:
                  </p>
                  <ul className="list-disc list-inside space-y-1 text-gray-700">
                    <li><strong>AWS SES</strong> - Cost-effective for high volume</li>
                    <li><strong>Brevo (Sendinblue)</strong> - Feature-rich with marketing tools</li>
                    <li><strong>Mailgun</strong> - Developer-friendly with powerful APIs</li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Quick Setup</h3>
                  <ol className="list-decimal list-inside space-y-2 text-gray-700">
                    <li>Go to Settings → Integrations</li>
                    <li>Choose your preferred email provider</li>
                    <li>Enter your API credentials</li>
                    <li>Test the connection</li>
                    <li>You're ready to send emails!</li>
                  </ol>
                </div>
                <div className="bg-orange-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-orange-900 mb-2">⚡ Quick Start</h4>
                  <p className="text-orange-800 text-sm">
                    Don't have an email provider? Start with Brevo's free tier which includes 300 emails per day.
                  </p>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* Step 5: Publishing */}
          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Step 5: Publish Your Content</h2>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Send className="h-5 w-5 text-teal-600" />
                  <span>Publishing Options</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">Dual Publishing Channels</h3>
                  <p className="text-gray-700 mb-3">
                    PlaneMail allows you to publish content in multiple ways:
                  </p>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="p-4 border border-gray-200 rounded-lg">
                      <h4 className="font-semibold text-gray-900 mb-2">📧 Email Campaigns</h4>
                      <ul className="text-sm text-gray-700 space-y-1">
                        <li>• Send to your subscriber list</li>
                        <li>• Target specific segments</li>
                        <li>• Schedule for optimal timing</li>
                        <li>• Track opens and clicks</li>
                      </ul>
                    </div>
                    <div className="p-4 border border-gray-200 rounded-lg">
                      <h4 className="font-semibold text-gray-900 mb-2">🌐 Web Publishing</h4>
                      <ul className="text-sm text-gray-700 space-y-1">
                        <li>• Publish as web pages</li>
                        <li>• SEO-optimized content</li>
                        <li>• Custom URLs and domains</li>
                        <li>• Social media sharing</li>
                      </ul>
                    </div>
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Publishing Workflow</h3>
                  <ol className="list-decimal list-inside space-y-2 text-gray-700">
                    <li>Complete your post content</li>
                    <li>Choose your audience (for email)</li>
                    <li>Configure email settings (subject, sender)</li>
                    <li>Set up web publishing options (SEO, URL)</li>
                    <li>Review and publish or schedule</li>
                  </ol>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* Next Steps */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">What's Next?</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <Link href="/docs/posts">
                <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer">
                  <CardHeader>
                    <CardTitle>Master the Editor</CardTitle>
                    <CardDescription>
                      Learn advanced editor features, shortcuts, and content creation tips.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center text-blue-600 font-medium">
                      Explore editor features <ArrowRight className="h-4 w-4 ml-1" />
                    </div>
                  </CardContent>
                </Card>
              </Link>

              <Link href="/docs/audience">
                <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer">
                  <CardHeader>
                    <CardTitle>Build Your Audience</CardTitle>
                    <CardDescription>
                      Import contacts, create segments, and grow your subscriber base.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center text-green-600 font-medium">
                      Manage your audience <ArrowRight className="h-4 w-4 ml-1" />
                    </div>
                  </CardContent>
                </Card>
              </Link>

              <Link href="/docs/integrations">
                <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer">
                  <CardHeader>
                    <CardTitle>Connect Tools</CardTitle>
                    <CardDescription>
                      Integrate with your existing tools and automate your workflow.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center text-purple-600 font-medium">
                      Setup integrations <ArrowRight className="h-4 w-4 ml-1" />
                    </div>
                  </CardContent>
                </Card>
              </Link>

              <Link href="/docs/best-practices">
                <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer">
                  <CardHeader>
                    <CardTitle>Best Practices</CardTitle>
                    <CardDescription>
                      Learn proven strategies to maximize your email marketing success.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center text-orange-600 font-medium">
                      Optimize campaigns <ArrowRight className="h-4 w-4 ml-1" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </div>
          </section>

          {/* Support */}
          <section className="text-center bg-gray-50 p-8 rounded-lg">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Need Help Getting Started?</h2>
            <p className="text-gray-600 mb-6">
              Our support team is here to help you succeed with PlaneMail.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild>
                <Link href="mailto:support@planemail.in">
                  Contact Support
                </Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/docs">
                  Browse All Docs
                </Link>
              </Button>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
