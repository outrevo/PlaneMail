import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, ArrowRight, Book, Code2, Rocket, Users, Mail, Globe, Settings, HelpCircle, FileText, Zap } from "lucide-react";
import { Logo } from "@/components/icons/Logo";
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'PlaneMail Documentation | Complete Guide to Email Marketing & Content Publishing',
  description: 'Comprehensive documentation for PlaneMail\'s email marketing platform. Learn to create posts with our Notion-style editor, send email campaigns, manage audiences, and integrate with email providers.',
  keywords: ['email marketing documentation', 'PlaneMail guide', 'email campaign tutorial', 'Notion editor', 'email automation', 'content publishing', 'subscriber management'],
  openGraph: {
    title: 'PlaneMail Documentation - Complete Email Marketing Guide',
    description: 'Master PlaneMail with our comprehensive documentation. From getting started to advanced email marketing strategies.',
    type: 'website',
    siteName: 'PlaneMail',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'PlaneMail Documentation - Complete Email Marketing Guide',
    description: 'Master PlaneMail with our comprehensive documentation. From getting started to advanced email marketing strategies.',
  },
};

export default function DocsPage() {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "name": "PlaneMail Documentation",
    "description": "Comprehensive documentation for PlaneMail's email marketing platform",
    "url": "https://planemail.in/docs",
    "mainEntity": {
      "@type": "SoftwareApplication",
      "name": "PlaneMail",
      "applicationCategory": "Email Marketing Software",
      "operatingSystem": "Web Browser",
      "description": "Email marketing platform with Notion-style editor for creating and sending campaigns",
      "offers": {
        "@type": "Offer",
        "price": "0",
        "priceCurrency": "USD",
        "description": "Free tier available"
      },
      "featureList": [
        "Notion-style editor",
        "Email campaign management",
        "Audience segmentation",
        "Web publishing",
        "Analytics and reporting",
        "API integration"
      ]
    },
    "breadcrumb": {
      "@type": "BreadcrumbList",
      "itemListElement": [
        {
          "@type": "ListItem",
          "position": 1,
          "name": "Home",
          "item": "https://planemail.in"
        },
        {
          "@type": "ListItem",
          "position": 2,
          "name": "Documentation",
          "item": "https://planemail.in/docs"
        }
      ]
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <Link href="/" className="flex items-center space-x-2">
              <Logo className="h-8 w-8" />
              <span className="text-xl font-bold">PlaneMail Docs</span>
            </Link>
            <Link href="/">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Home
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              PlaneMail Documentation: Complete Email Marketing Guide
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              Master email marketing with PlaneMail's comprehensive documentation. Learn to create engaging content with our Notion-style editor, 
              send targeted campaigns, manage subscribers, and integrate with leading email service providers like AWS SES, Brevo, and Mailgun.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/docs/getting-started">
                <Button size="lg" className="w-full sm:w-auto">
                  <Rocket className="h-5 w-5 mr-2" />
                  Get Started Guide
                </Button>
              </Link>
              <Link href="/docs/api">
                <Button variant="outline" size="lg" className="w-full sm:w-auto">
                  <Code2 className="h-5 w-5 mr-2" />
                  API Reference
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Documentation Grid */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          
          {/* Getting Started */}
          <Link href="/docs/getting-started">
            <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer border-2 hover:border-blue-200">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Rocket className="h-6 w-6 text-blue-600" />
                  <span>Getting Started</span>
                </CardTitle>
                <CardDescription>
                  Quick start guide to set up your PlaneMail account and create your first post.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="text-sm text-gray-600 space-y-2">
                  <li>• Account setup and onboarding</li>
                  <li>• Creating your first post</li>
                  <li>• Understanding the editor</li>
                  <li>• Publishing your content</li>
                </ul>
                <div className="mt-4 flex items-center text-blue-600 font-medium">
                  Start here <ArrowRight className="h-4 w-4 ml-1" />
                </div>
              </CardContent>
            </Card>
          </Link>

          {/* Post Creation */}
          <Link href="/docs/posts">
            <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer border-2 hover:border-green-200">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <FileText className="h-6 w-6 text-green-600" />
                  <span>Creating Posts</span>
                </CardTitle>
                <CardDescription>
                  Master the Notion-style editor and advanced content creation features.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="text-sm text-gray-600 space-y-2">
                  <li>• Notion-style editor features</li>
                  <li>• Slash commands and shortcuts</li>
                  <li>• Image uploads and media</li>
                  <li>• Templates and blocks</li>
                </ul>
                <div className="mt-4 flex items-center text-green-600 font-medium">
                  Learn more <ArrowRight className="h-4 w-4 ml-1" />
                </div>
              </CardContent>
            </Card>
          </Link>

          {/* Email Marketing */}
          <Link href="/docs/email-marketing">
            <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer border-2 hover:border-purple-200">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Mail className="h-6 w-6 text-purple-600" />
                  <span>Email Marketing</span>
                </CardTitle>
                <CardDescription>
                  Send engaging email campaigns and newsletters to your audience.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="text-sm text-gray-600 space-y-2">
                  <li>• Setting up email campaigns</li>
                  <li>• Audience segmentation</li>
                  <li>• Email delivery & analytics</li>
                  <li>• Best practices & compliance</li>
                </ul>
                <div className="mt-4 flex items-center text-purple-600 font-medium">
                  Explore <ArrowRight className="h-4 w-4 ml-1" />
                </div>
              </CardContent>
            </Card>
          </Link>

          {/* Web Publishing */}
          <Link href="/docs/web-publishing">
            <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer border-2 hover:border-orange-200">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Globe className="h-6 w-6 text-orange-600" />
                  <span>Web Publishing</span>
                </CardTitle>
                <CardDescription>
                  Publish your posts as web pages with SEO optimization.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="text-sm text-gray-600 space-y-2">
                  <li>• Publishing to web</li>
                  <li>• SEO optimization</li>
                  <li>• Custom domains</li>
                  <li>• Analytics & tracking</li>
                </ul>
                <div className="mt-4 flex items-center text-orange-600 font-medium">
                  Learn more <ArrowRight className="h-4 w-4 ml-1" />
                </div>
              </CardContent>
            </Card>
          </Link>

          {/* Audience Management */}
          <Link href="/docs/audience">
            <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer border-2 hover:border-pink-200">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Users className="h-6 w-6 text-pink-600" />
                  <span>Audience Management</span>
                </CardTitle>
                <CardDescription>
                  Build and manage your subscriber lists and segments.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="text-sm text-gray-600 space-y-2">
                  <li>• Import and manage contacts</li>
                  <li>• Creating segments</li>
                  <li>• Subscriber preferences</li>
                  <li>• List hygiene & compliance</li>
                </ul>
                <div className="mt-4 flex items-center text-pink-600 font-medium">
                  Manage <ArrowRight className="h-4 w-4 ml-1" />
                </div>
              </CardContent>
            </Card>
          </Link>

          {/* Integrations */}
          <Link href="/docs/integrations">
            <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer border-2 hover:border-indigo-200">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Settings className="h-6 w-6 text-indigo-600" />
                  <span>Integrations</span>
                </CardTitle>
                <CardDescription>
                  Connect PlaneMail with your favorite tools and services.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="text-sm text-gray-600 space-y-2">
                  <li>• Email service providers</li>
                  <li>• Analytics platforms</li>
                  <li>• CRM integrations</li>
                  <li>• Webhooks & automation</li>
                </ul>
                <div className="mt-4 flex items-center text-indigo-600 font-medium">
                  Connect <ArrowRight className="h-4 w-4 ml-1" />
                </div>
              </CardContent>
            </Card>
          </Link>

          {/* API Reference */}
          <Link href="/docs/api">
            <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer border-2 hover:border-gray-300">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Code2 className="h-6 w-6 text-gray-600" />
                  <span>API Reference</span>
                </CardTitle>
                <CardDescription>
                  Integrate PlaneMail programmatically with our REST API.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="text-sm text-gray-600 space-y-2">
                  <li>• Authentication</li>
                  <li>• Subscribers API</li>
                  <li>• Posts API</li>
                  <li>• Analytics API</li>
                </ul>
                <div className="mt-4 flex items-center text-gray-600 font-medium">
                  Develop <ArrowRight className="h-4 w-4 ml-1" />
                </div>
              </CardContent>
            </Card>
          </Link>

          {/* Troubleshooting */}
          <Link href="/docs/troubleshooting">
            <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer border-2 hover:border-yellow-200">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <HelpCircle className="h-6 w-6 text-yellow-600" />
                  <span>Troubleshooting</span>
                </CardTitle>
                <CardDescription>
                  Common issues and solutions to get you back on track.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="text-sm text-gray-600 space-y-2">
                  <li>• Common error messages</li>
                  <li>• Email delivery issues</li>
                  <li>• Account & billing problems</li>
                  <li>• Performance optimization</li>
                </ul>
                <div className="mt-4 flex items-center text-yellow-600 font-medium">
                  Get help <ArrowRight className="h-4 w-4 ml-1" />
                </div>
              </CardContent>
            </Card>
          </Link>

          {/* Best Practices */}
          <Link href="/docs/best-practices">
            <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer border-2 hover:border-teal-200">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Zap className="h-6 w-6 text-teal-600" />
                  <span>Best Practices</span>
                </CardTitle>
                <CardDescription>
                  Tips and strategies to maximize your email marketing success.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="text-sm text-gray-600 space-y-2">
                  <li>• Email design principles</li>
                  <li>• Content strategy</li>
                  <li>• Deliverability optimization</li>
                  <li>• Growth strategies</li>
                </ul>
                <div className="mt-4 flex items-center text-teal-600 font-medium">
                  Optimize <ArrowRight className="h-4 w-4 ml-1" />
                </div>
              </CardContent>
            </Card>
          </Link>

        </div>

        {/* Quick Links Section */}
        <section className="mt-16">
          <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">Quick Links</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Link href="/docs/getting-started/account-setup">
              <div className="p-4 bg-white rounded-lg border border-gray-200 hover:shadow-md transition-shadow">
                <h3 className="font-semibold text-gray-900 mb-2">Account Setup</h3>
                <p className="text-sm text-gray-600">Set up your PlaneMail account in minutes</p>
              </div>
            </Link>
            <Link href="/docs/posts/editor-shortcuts">
              <div className="p-4 bg-white rounded-lg border border-gray-200 hover:shadow-md transition-shadow">
                <h3 className="font-semibold text-gray-900 mb-2">Editor Shortcuts</h3>
                <p className="text-sm text-gray-600">Master keyboard shortcuts and slash commands</p>
              </div>
            </Link>
            <Link href="/docs/email-marketing/deliverability">
              <div className="p-4 bg-white rounded-lg border border-gray-200 hover:shadow-md transition-shadow">
                <h3 className="font-semibold text-gray-900 mb-2">Email Deliverability</h3>
                <p className="text-sm text-gray-600">Ensure your emails reach the inbox</p>
              </div>
            </Link>
            <Link href="/docs/api/authentication">
              <div className="p-4 bg-white rounded-lg border border-gray-200 hover:shadow-md transition-shadow">
                <h3 className="font-semibold text-gray-900 mb-2">API Authentication</h3>
                <p className="text-sm text-gray-600">Get started with the PlaneMail API</p>
              </div>
            </Link>
          </div>
        </section>

        {/* Support Section */}
        <section className="mt-16 text-center">
          <div className="bg-white rounded-lg border border-gray-200 p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Need More Help?</h2>
            <p className="text-gray-600 mb-6">
              Can't find what you're looking for? Our support team is here to help.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild>
                <Link href="mailto:support@planemail.in">
                  Contact Support
                </Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/contact">
                  Send Feedback
                </Link>
              </Button>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
