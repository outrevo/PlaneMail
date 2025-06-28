import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { Logo } from "@/components/icons/Logo";
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Terms of Service | PlaneMail Usage Terms & Conditions',
  description: 'PlaneMail Terms of Service by Devsquirrel Technologies. Understand usage terms, acceptable use policy, and legal agreements for our email marketing platform.',
  keywords: ['terms of service', 'usage terms', 'legal agreement', 'email marketing terms', 'service conditions'],
  openGraph: {
    title: 'Terms of Service - PlaneMail Usage Terms & Conditions',
    description: 'Review PlaneMail\'s terms of service and usage policies. Legal framework for email marketing platform users.',
    type: 'website',
    siteName: 'PlaneMail',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function TermsOfServicePage() {
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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Terms of Service</h1>
          <p className="text-gray-600 mb-8">Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>

          <div className="prose max-w-none">
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. Agreement to Terms</h2>
              <p className="text-gray-700 mb-4">
                These Terms of Service ("Terms") constitute a legally binding agreement between you and Devsquirrel Technologies Private Limited ("Company," "we," "our," or "us") regarding your use of the PlaneMail platform and related services ("Service").
              </p>
              <p className="text-gray-700 mb-4">
                By accessing or using our Service, you agree to be bound by these Terms. If you do not agree to these Terms, you may not access or use the Service.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. Description of Service</h2>
              <p className="text-gray-700 mb-4">
                PlaneMail is an email marketing and content publishing platform that allows users to:
              </p>
              <ul className="list-disc pl-6 text-gray-700 mb-4">
                <li>Create and edit posts using our Notion-style editor</li>
                <li>Manage audience segments and contact lists</li>
                <li>Send email campaigns and newsletters</li>
                <li>Publish content to web platforms</li>
                <li>Track analytics and performance metrics</li>
                <li>Integrate with third-party email service providers</li>
                <li>Use advanced features like slash commands, image uploads, and templates</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">3. User Accounts and Registration</h2>
              
              <h3 className="text-xl font-medium text-gray-900 mb-3">3.1 Account Creation</h3>
              <p className="text-gray-700 mb-4">
                To use our Service, you must create an account by providing accurate and complete information. You are responsible for maintaining the confidentiality of your account credentials.
              </p>

              <h3 className="text-xl font-medium text-gray-900 mb-3">3.2 Account Responsibility</h3>
              <ul className="list-disc pl-6 text-gray-700 mb-4">
                <li>You are responsible for all activities under your account</li>
                <li>You must notify us immediately of any unauthorized use</li>
                <li>You must maintain accurate account information</li>
                <li>One person or entity may not maintain multiple accounts</li>
              </ul>

              <h3 className="text-xl font-medium text-gray-900 mb-3">3.3 Eligibility</h3>
              <p className="text-gray-700 mb-4">
                You must be at least 18 years old and have the legal capacity to enter into agreements. By using the Service, you represent that you meet these requirements.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. Acceptable Use Policy</h2>
              
              <h3 className="text-xl font-medium text-gray-900 mb-3">4.1 Permitted Uses</h3>
              <p className="text-gray-700 mb-4">You may use our Service for legitimate business and personal communication purposes, including:</p>
              <ul className="list-disc pl-6 text-gray-700 mb-4">
                <li>Creating and sending newsletters and marketing emails</li>
                <li>Publishing blog posts and content</li>
                <li>Managing customer communications</li>
                <li>Building and maintaining audience relationships</li>
              </ul>

              <h3 className="text-xl font-medium text-gray-900 mb-3">4.2 Prohibited Uses</h3>
              <p className="text-gray-700 mb-4">You may not use our Service to:</p>
              <ul className="list-disc pl-6 text-gray-700 mb-4">
                <li>Send spam, unsolicited emails, or bulk communications without consent</li>
                <li>Distribute malicious content, viruses, or harmful code</li>
                <li>Violate any applicable laws or regulations</li>
                <li>Infringe on intellectual property rights</li>
                <li>Harass, threaten, or abuse others</li>
                <li>Distribute false, misleading, or deceptive content</li>
                <li>Engage in phishing or fraudulent activities</li>
                <li>Scrape or harvest data without permission</li>
                <li>Attempt to gain unauthorized access to our systems</li>
                <li>Interfere with the Service's functionality</li>
              </ul>

              <h3 className="text-xl font-medium text-gray-900 mb-3">4.3 Content Standards</h3>
              <p className="text-gray-700 mb-4">All content must comply with:</p>
              <ul className="list-disc pl-6 text-gray-700 mb-4">
                <li>CAN-SPAM Act and similar anti-spam regulations</li>
                <li>GDPR and other privacy laws</li>
                <li>Applicable industry standards and best practices</li>
                <li>Our community guidelines and content policies</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">5. Subscription Plans and Billing</h2>
              
              <h3 className="text-xl font-medium text-gray-900 mb-3">5.1 Subscription Plans</h3>
              <p className="text-gray-700 mb-4">
                We offer various subscription plans with different features and limits. Plan details, pricing, and features are available on our website.
              </p>

              <h3 className="text-xl font-medium text-gray-900 mb-3">5.2 Payment Terms</h3>
              <ul className="list-disc pl-6 text-gray-700 mb-4">
                <li>Subscription fees are billed in advance on a recurring basis</li>
                <li>All fees are non-refundable unless otherwise stated</li>
                <li>You authorize us to charge your payment method automatically</li>
                <li>You are responsible for maintaining valid payment information</li>
              </ul>

              <h3 className="text-xl font-medium text-gray-900 mb-3">5.3 Plan Changes and Cancellation</h3>
              <ul className="list-disc pl-6 text-gray-700 mb-4">
                <li>You may upgrade, downgrade, or cancel your subscription at any time</li>
                <li>Changes take effect at the next billing cycle</li>
                <li>Cancellation stops future billing but does not provide refunds</li>
                <li>We may suspend or terminate accounts for non-payment</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">6. Intellectual Property Rights</h2>
              
              <h3 className="text-xl font-medium text-gray-900 mb-3">6.1 Our Rights</h3>
              <p className="text-gray-700 mb-4">
                The Service, including its software, features, and content, is owned by us and protected by intellectual property laws. We grant you a limited, non-exclusive license to use the Service.
              </p>

              <h3 className="text-xl font-medium text-gray-900 mb-3">6.2 Your Content</h3>
              <ul className="list-disc pl-6 text-gray-700 mb-4">
                <li>You retain ownership of content you create and upload</li>
                <li>You grant us a license to host, store, and process your content</li>
                <li>You are responsible for ensuring you have rights to your content</li>
                <li>You must not infringe on others' intellectual property rights</li>
              </ul>

              <h3 className="text-xl font-medium text-gray-900 mb-3">6.3 Feedback and Suggestions</h3>
              <p className="text-gray-700 mb-4">
                Any feedback, suggestions, or ideas you provide to us may be used without compensation or attribution.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">7. Privacy and Data Protection</h2>
              <p className="text-gray-700 mb-4">
                Your privacy is important to us. Our Privacy Policy explains how we collect, use, and protect your information. By using our Service, you agree to our Privacy Policy.
              </p>
              
              <h3 className="text-xl font-medium text-gray-900 mb-3">7.1 Data Processing</h3>
              <ul className="list-disc pl-6 text-gray-700 mb-4">
                <li>We process data to provide and improve our Service</li>
                <li>You are responsible for complying with applicable privacy laws</li>
                <li>You must obtain necessary consents for email communications</li>
                <li>We provide tools to help you comply with privacy regulations</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">8. Third-Party Integrations</h2>
              <p className="text-gray-700 mb-4">
                Our Service integrates with third-party providers (AWS SES, Brevo, Mailgun, etc.). Your use of these integrations is subject to their respective terms and policies.
              </p>
              
              <h3 className="text-xl font-medium text-gray-900 mb-3">8.1 Integration Responsibility</h3>
              <ul className="list-disc pl-6 text-gray-700 mb-4">
                <li>You are responsible for managing your third-party accounts</li>
                <li>We are not liable for third-party service interruptions</li>
                <li>You must comply with third-party terms and policies</li>
                <li>Integration availability may change without notice</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">9. Service Availability and Support</h2>
              
              <h3 className="text-xl font-medium text-gray-900 mb-3">9.1 Service Level</h3>
              <p className="text-gray-700 mb-4">
                We strive to provide reliable service but do not guarantee 100% uptime. We may perform maintenance, updates, or modifications that temporarily affect service availability.
              </p>

              <h3 className="text-xl font-medium text-gray-900 mb-3">9.2 Support</h3>
              <ul className="list-disc pl-6 text-gray-700 mb-4">
                <li>Support is provided based on your subscription plan</li>
                <li>We provide documentation, guides, and help resources</li>
                <li>Response times vary by plan and issue complexity</li>
                <li>We may prioritize support based on subscription level</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">10. Limitation of Liability</h2>
              <p className="text-gray-700 mb-4">
                TO THE MAXIMUM EXTENT PERMITTED BY LAW, WE SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING BUT NOT LIMITED TO LOSS OF PROFITS, DATA, OR BUSINESS OPPORTUNITIES.
              </p>
              <p className="text-gray-700 mb-4">
                OUR TOTAL LIABILITY SHALL NOT EXCEED THE AMOUNT YOU PAID FOR THE SERVICE IN THE TWELVE MONTHS PRECEDING THE CLAIM.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">11. Indemnification</h2>
              <p className="text-gray-700 mb-4">
                You agree to indemnify and hold us harmless from any claims, damages, or expenses arising from your use of the Service, violation of these Terms, or infringement of any rights.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">12. Termination</h2>
              
              <h3 className="text-xl font-medium text-gray-900 mb-3">12.1 Termination by You</h3>
              <p className="text-gray-700 mb-4">
                You may terminate your account at any time through your account settings or by contacting us.
              </p>

              <h3 className="text-xl font-medium text-gray-900 mb-3">12.2 Termination by Us</h3>
              <p className="text-gray-700 mb-4">
                We may suspend or terminate your account for violations of these Terms, non-payment, or other legitimate reasons.
              </p>

              <h3 className="text-xl font-medium text-gray-900 mb-3">12.3 Effect of Termination</h3>
              <ul className="list-disc pl-6 text-gray-700 mb-4">
                <li>Access to the Service will be discontinued</li>
                <li>Your data may be deleted after a reasonable period</li>
                <li>Outstanding fees remain due</li>
                <li>Certain provisions of these Terms survive termination</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">13. Governing Law and Disputes</h2>
              <p className="text-gray-700 mb-4">
                These Terms are governed by the laws of India. Any disputes shall be resolved through binding arbitration in accordance with Indian arbitration laws.
              </p>
              
              <h3 className="text-xl font-medium text-gray-900 mb-3">13.1 Dispute Resolution</h3>
              <ul className="list-disc pl-6 text-gray-700 mb-4">
                <li>We encourage resolving disputes through direct communication</li>
                <li>Formal disputes shall be subject to arbitration</li>
                <li>Class action lawsuits are not permitted</li>
                <li>Injunctive relief may be sought in court when appropriate</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">14. Changes to Terms</h2>
              <p className="text-gray-700 mb-4">
                We may modify these Terms at any time. Material changes will be communicated through email or service notifications. Continued use after changes constitutes acceptance of the new Terms.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">15. Miscellaneous</h2>
              
              <h3 className="text-xl font-medium text-gray-900 mb-3">15.1 Entire Agreement</h3>
              <p className="text-gray-700 mb-4">
                These Terms, together with our Privacy Policy, constitute the entire agreement between you and us.
              </p>

              <h3 className="text-xl font-medium text-gray-900 mb-3">15.2 Severability</h3>
              <p className="text-gray-700 mb-4">
                If any provision of these Terms is found invalid, the remaining provisions shall remain in effect.
              </p>

              <h3 className="text-xl font-medium text-gray-900 mb-3">15.3 Assignment</h3>
              <p className="text-gray-700 mb-4">
                You may not assign these Terms without our consent. We may assign our rights and obligations at any time.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">16. Contact Information</h2>
              <p className="text-gray-700 mb-4">
                If you have questions about these Terms, please contact us:
              </p>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-gray-700"><strong>Devsquirrel Technologies Private Limited</strong></p>
                <p className="text-gray-700">Email: legal@planemail.in</p>
                <p className="text-gray-700">Support: support@planemail.in</p>
              </div>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}
