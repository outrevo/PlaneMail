import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Users } from "lucide-react";
import { Logo } from "@/components/icons/Logo";
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Audience Management | PlaneMail Subscriber & Segmentation Guide',
  description: 'Master PlaneMail audience management. Learn to import contacts, create segments, manage preferences, and maintain healthy subscriber lists for better engagement.',
  keywords: ['audience management', 'subscriber segmentation', 'contact import', 'email lists', 'subscriber preferences', 'list hygiene'],
  openGraph: {
    title: 'Audience Management - PlaneMail Subscriber & Segmentation Guide',
    description: 'Build and manage engaged subscriber lists with PlaneMail. Learn segmentation, import strategies, and list maintenance.',
    type: 'article',
    siteName: 'PlaneMail',
  },
};

export default function AudiencePage() {
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
            <Users className="h-16 w-16 text-pink-600 mx-auto mb-4" />
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Audience Management</h1>
            <p className="text-gray-600 mb-8">
              Documentation for audience management features is coming soon. This section will cover importing contacts, creating segments, managing subscriber preferences, and list hygiene.
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
