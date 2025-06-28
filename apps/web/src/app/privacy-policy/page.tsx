import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { Logo } from "@/components/icons/Logo";
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy | PlaneMail Data Protection & Privacy Practices',
  description: 'PlaneMail Privacy Policy by Devsquirrel Technologies. Learn how we collect, use, and protect your data. GDPR compliant with AWS Frankfurt hosting.',
  keywords: ['privacy policy', 'data protection', 'GDPR compliance', 'email marketing privacy', 'user data security'],
  openGraph: {
    title: 'Privacy Policy - PlaneMail Data Protection & Privacy Practices',
    description: 'Understand how PlaneMail protects your privacy and handles your data. Transparent policies for email marketing platform users.',
    type: 'website',
    siteName: 'PlaneMail',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <Link href="/" className="flex items-center space-x-2">
              <Logo className="h-8 w-8" />
              <span className="text-xl font-bold">PlaneMail</span>
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

      {/* Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Privacy Policy</h1>
          <p className="text-gray-600 mb-8">Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>

          <div className="prose max-w-none">
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. Introduction</h2>
              <p className="text-gray-700 mb-4">
                This Privacy Policy describes how Devsquirrel Technologies Private Limited ("we," "our," or "us") collects, uses, and protects your information when you use PlaneMail ("the Service"), our email marketing and content publishing platform.
              </p>
              <p className="text-gray-700 mb-4">
                By using our Service, you agree to the collection and use of information in accordance with this policy.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. Information We Collect</h2>
              
              <h3 className="text-xl font-medium text-gray-900 mb-3">2.1 Personal Information</h3>
              <p className="text-gray-700 mb-4">When you create an account or use our Service, we may collect:</p>
              <ul className="list-disc pl-6 text-gray-700 mb-4">
                <li>Name and email address</li>
                <li>Profile information</li>
                <li>Payment and billing information</li>
                <li>Contact preferences</li>
              </ul>

              <h3 className="text-xl font-medium text-gray-900 mb-3">2.2 Content and Communications</h3>
              <ul className="list-disc pl-6 text-gray-700 mb-4">
                <li>Posts, newsletters, and email content you create</li>
                <li>Audience segments and contact lists</li>
                <li>Images and media files uploaded to the platform</li>
                <li>Email templates and drafts</li>
                <li>Analytics and performance data</li>
              </ul>

              <h3 className="text-xl font-medium text-gray-900 mb-3">2.3 Technical Information</h3>
              <ul className="list-disc pl-6 text-gray-700 mb-4">
                <li>IP addresses and device information</li>
                <li>Browser type and version</li>
                <li>Operating system</li>
                <li>Usage patterns and interaction data</li>
                <li>API usage and integration data</li>
              </ul>

              <h3 className="text-xl font-medium text-gray-900 mb-3">2.4 Third-Party Integration Data</h3>
              <ul className="list-disc pl-6 text-gray-700 mb-4">
                <li>Email service provider credentials (encrypted)</li>
                <li>Authentication tokens for connected services</li>
                <li>Data from integrated platforms (with your consent)</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">3. How We Use Your Information</h2>
              <p className="text-gray-700 mb-4">We use your information to:</p>
              <ul className="list-disc pl-6 text-gray-700 mb-4">
                <li>Provide and maintain the PlaneMail service</li>
                <li>Process and deliver your email campaigns</li>
                <li>Enable post creation, editing, and publishing</li>
                <li>Manage your audience segments and contact lists</li>
                <li>Provide analytics and performance insights</li>
                <li>Process payments and billing</li>
                <li>Send service-related notifications</li>
                <li>Provide customer support</li>
                <li>Improve our services and develop new features</li>
                <li>Ensure platform security and prevent abuse</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. Data Storage and Security</h2>
              
              <h3 className="text-xl font-medium text-gray-900 mb-3">4.1 Data Location</h3>
              <p className="text-gray-700 mb-4">
                Your data is primarily stored on secure servers in the AWS Frankfurt region (eu-central-1). We may also use other AWS regions for backup and disaster recovery purposes.
              </p>

              <h3 className="text-xl font-medium text-gray-900 mb-3">4.2 Security Measures</h3>
              <ul className="list-disc pl-6 text-gray-700 mb-4">
                <li>Encryption in transit and at rest</li>
                <li>Regular security audits and monitoring</li>
                <li>Access controls and authentication</li>
                <li>Secure API key management</li>
                <li>Regular backups and disaster recovery procedures</li>
              </ul>

              <h3 className="text-xl font-medium text-gray-900 mb-3">4.3 Data Retention</h3>
              <p className="text-gray-700 mb-4">
                We retain your data for as long as your account is active or as needed to provide you services. You may request deletion of your data at any time, subject to legal and contractual obligations.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">5. Data Sharing and Disclosure</h2>
              
              <h3 className="text-xl font-medium text-gray-900 mb-3">5.1 We Do Not Sell Your Data</h3>
              <p className="text-gray-700 mb-4">
                We do not sell, trade, or otherwise transfer your personal information to third parties for commercial purposes.
              </p>

              <h3 className="text-xl font-medium text-gray-900 mb-3">5.2 Service Providers</h3>
              <p className="text-gray-700 mb-4">We may share your information with trusted service providers who assist us in:</p>
              <ul className="list-disc pl-6 text-gray-700 mb-4">
                <li>Email delivery services (AWS SES, Brevo, Mailgun)</li>
                <li>Payment processing (Paddle)</li>
                <li>Authentication services (Clerk)</li>
                <li>Cloud infrastructure (AWS)</li>
                <li>Analytics and monitoring tools</li>
              </ul>

              <h3 className="text-xl font-medium text-gray-900 mb-3">5.3 Legal Requirements</h3>
              <p className="text-gray-700 mb-4">
                We may disclose your information if required by law, regulation, or legal process, or to protect our rights, property, or safety.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">6. Your Rights and Choices</h2>
              
              <h3 className="text-xl font-medium text-gray-900 mb-3">6.1 Access and Control</h3>
              <ul className="list-disc pl-6 text-gray-700 mb-4">
                <li>Access and update your account information</li>
                <li>Export your content and data</li>
                <li>Delete posts, campaigns, and content</li>
                <li>Manage audience segments and contact lists</li>
                <li>Control notification preferences</li>
              </ul>

              <h3 className="text-xl font-medium text-gray-900 mb-3">6.2 Data Subject Rights (GDPR)</h3>
              <p className="text-gray-700 mb-4">If you are in the European Union, you have the right to:</p>
              <ul className="list-disc pl-6 text-gray-700 mb-4">
                <li>Request access to your personal data</li>
                <li>Request correction of inaccurate data</li>
                <li>Request deletion of your data</li>
                <li>Request restriction of processing</li>
                <li>Data portability</li>
                <li>Object to processing</li>
                <li>Withdraw consent</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">7. Cookies and Tracking</h2>
              <p className="text-gray-700 mb-4">
                We use cookies and similar technologies to enhance your experience, analyze usage, and provide personalized content. You can control cookie preferences through your browser settings.
              </p>
              
              <h3 className="text-xl font-medium text-gray-900 mb-3">Types of Cookies We Use:</h3>
              <ul className="list-disc pl-6 text-gray-700 mb-4">
                <li>Essential cookies for platform functionality</li>
                <li>Analytics cookies to understand usage patterns</li>
                <li>Preference cookies to remember your settings</li>
                <li>Authentication cookies for secure login</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">8. International Data Transfers</h2>
              <p className="text-gray-700 mb-4">
                Your data may be transferred to and processed in countries other than your own. We ensure appropriate safeguards are in place for such transfers, including standard contractual clauses and adequacy decisions.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">9. Children's Privacy</h2>
              <p className="text-gray-700 mb-4">
                Our Service is not intended for children under 13 years of age. We do not knowingly collect personal information from children under 13. If you are a parent or guardian and believe your child has provided us with personal information, please contact us.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">10. Changes to This Privacy Policy</h2>
              <p className="text-gray-700 mb-4">
                We may update this Privacy Policy from time to time. We will notify you of any material changes by posting the new Privacy Policy on this page and updating the "Last updated" date.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">11. Contact Information</h2>
              <p className="text-gray-700 mb-4">
                If you have any questions about this Privacy Policy or our data practices, please contact us:
              </p>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-gray-700"><strong>Devsquirrel Technologies Private Limited</strong></p>
                <p className="text-gray-700">Email: privacy@planemail.in</p>
                <p className="text-gray-700">Data Protection Officer: dpo@planemail.in</p>
              </div>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}
