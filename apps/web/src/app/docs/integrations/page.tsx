"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Settings } from "lucide-react";
import { Logo } from "@/components/icons/Logo";

export default function IntegrationsPage() {
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
            <Settings className="h-16 w-16 text-indigo-600 mx-auto mb-4" />
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Integrations</h1>
            <p className="text-gray-600 mb-8">
              Documentation for integrations is coming soon. This section will cover connecting email service providers (AWS SES, Brevo, Mailgun), analytics platforms, CRM integrations, and webhooks.
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
