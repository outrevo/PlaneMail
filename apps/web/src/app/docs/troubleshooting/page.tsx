import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft, HelpCircle } from "lucide-react";
import { Logo } from "@/components/icons/Logo";
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Troubleshooting Guide | PlaneMail Help & Support',
  description: 'Get help with PlaneMail issues. Find solutions for email delivery problems, account issues, editor bugs, and performance optimization tips.',
  keywords: ['PlaneMail troubleshooting', 'email delivery issues', 'technical support', 'bug fixes', 'account problems', 'performance optimization'],
  openGraph: {
    title: 'Troubleshooting Guide - PlaneMail Help & Support',
    description: 'Find solutions to common PlaneMail issues. Get help with email delivery, account problems, and technical support.',
    type: 'article',
    siteName: 'PlaneMail',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function TroubleshootingPage() {
  return (
    <div className="min-h-screen bg-gray-50">
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

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          <div className="text-center">
            <HelpCircle className="h-16 w-16 text-yellow-600 mx-auto mb-4" />
            <h1 className="text-3xl font-bold text-gray-900 mb-4">PlaneMail Troubleshooting Guide</h1>
            <p className="text-gray-600 mb-8">
              Find solutions to common PlaneMail issues including email delivery problems, account setup challenges, 
              editor functionality, and performance optimization. Our comprehensive troubleshooting guide helps you 
              resolve issues quickly and get back to creating amazing email campaigns.
            </p>
            <Button asChild>
              <Link href="/docs">
                Return to Documentation
              </Link>
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
