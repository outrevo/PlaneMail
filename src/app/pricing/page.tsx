
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { CheckCircle, Github, Slack, ArrowRight, Sparkles } from 'lucide-react';
import { Logo } from '@/components/icons/Logo';
import { PricingButton } from '@/components/pricing/PricingButton';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Pricing | PlaneMail - Open Source Newsletter Platform',
  description: 'Simple, transparent pricing for the open-source newsletter platform. 14-day free trial. Use your own email provider. No vendor lock-in.',
};

const pricingPlans = [
  {
    name: 'Hosted',
    price: '$19',
    frequency: '/month',
    description: 'We handle the infrastructure.',
    features: [
      'Managed hosting',
      'Your own email provider',
      'Up to 10,000 subscribers',
      'Automatic updates',
      'Premium templates',
      'Email support',
      'Advanced analytics',
      'API access',
    ],
    cta: 'Start 14-Day Free Trial',
    priceId: 'hosted',
    isPopular: true,
    hasTrial: true,
  },
  {
    name: 'Pro',
    price: '$99',
    frequency: '/month',
    description: 'Scale without limits.',
    features: [
      'Unlimited subscribers',
      'Unlimited emails',
      'Your own email provider',
      'Priority support',
      'Advanced analytics',
      'A/B testing',
      'Custom domains',
      'Team collaboration',
    ],
    cta: 'Start 14-Day Free Trial',
    priceId: 'pro',
    isPopular: false,
    hasTrial: true,
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    frequency: 'pricing',
    description: 'White-label & custom needs.',
    features: [
      'White-label solution',
      'Custom integrations',
      'Dedicated support',
      'SLA guarantees',
      'Custom development',
      'Training & onboarding',
      'Priority feature requests',
      'Multi-tenant support',
    ],
    cta: 'Contact Us',
    priceId: 'enterprise',
    isPopular: false,
    hasTrial: false,
  },
];

const openSourcePlan = {
  name: 'Open Source',
  price: 'Free',
  frequency: 'forever',
  description: 'Deploy yourself. Full control.',
  features: [
    'Self-hosted deployment',
    'Your own email provider',
    'Unlimited subscribers',
    'Unlimited emails',
    'Full source code access',
    'MIT license',
    'Community support',
    'No vendor lock-in',
  ],
  cta: 'Deploy Now',
  href: 'https://github.com/outrevo/PlaneMail',
  isPopular: false,
  external: true,
};

export default function PricingPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground font-mono">
      <header className="container mx-auto flex h-20 items-center justify-between px-4 py-4 relative z-10 border-b border-neutral-200">
        <Logo />
        <nav className="flex items-center gap-6">
          <Link
            href="/"
            className="text-sm hover:text-primary transition-colors"
          >
            Home
          </Link>
          <Link
            href="/docs"
            className="text-sm hover:text-primary transition-colors"
          >
            Docs
          </Link>
          <Link
            href="https://github.com/outrevo/PlaneMail"
            target="_blank"
            className="text-sm hover:text-primary transition-colors flex items-center gap-1"
          >
            <Github className="h-4 w-4" />
            <span>GitHub</span>
          </Link>
        </nav>
      </header>

      <main className="flex-1">
        {/* Header Section */}
        <section className="container mx-auto px-4 py-24">
          <div className="max-w-4xl mx-auto text-center">
            <div className="flex items-center justify-center gap-2 mb-8">
              <div className="bg-green-100 text-green-800 px-3 py-1 text-xs font-medium rounded-full flex items-center gap-1">
                <Sparkles className="h-3 w-3" />
                14-Day Free Trial
              </div>
              <div className="h-4 w-px bg-neutral-300"></div>
              <div className="bg-neutral-100 text-neutral-800 px-3 py-1 text-xs font-medium rounded-full">
                No Hidden Fees
              </div>
            </div>

            <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
              Choose your path
            </h1>

            <p className="text-xl text-neutral-600 mb-12 max-w-2xl mx-auto">
              Start with a 14-day free trial. Open source and self-hosted, or let us handle the infrastructure.
              Either way, you bring your own email provider.
            </p>
          </div>
        </section>

        {/* Pricing Cards */}
        <section className="container mx-auto px-4 pb-12">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {pricingPlans.map((plan) => (
                <div
                  key={plan.name}
                  className={`relative border rounded-lg p-8 ${
                    plan.isPopular
                      ? 'border-black bg-neutral-50'
                      : 'border-neutral-200 bg-white'
                  }`}
                >
                  {/* Popular Badge - positioned on the left */}
                  {plan.isPopular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-black text-white px-3 py-1 text-xs font-medium rounded-full">
                      Most Popular
                    </div>
                  )}
                  
                  {/* Trial Badge - positioned on the right, and moved down if popular */}
                  {plan.hasTrial && (
                    <div className={`absolute ${plan.isPopular ? 'top-8' : '-top-3'} right-4 bg-green-600 text-white px-3 py-1 text-xs font-medium rounded-full flex items-center gap-1`}>
                      <Sparkles className="h-3 w-3" />
                      14-Day Free Trial
                    </div>
                  )}

                  <div className="mb-8">
                    <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                    <div className="mb-4">
                      <span className="text-4xl font-bold">{plan.price}</span>
                      <span className="text-neutral-500 ml-2">{plan.frequency}</span>
                    </div>
                    <p className="text-neutral-600">{plan.description}</p>
                  </div>

                  <ul className="space-y-3 mb-8">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-start gap-3">
                        <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <PricingButton plan={plan} />
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Trial Benefits Section */}
        <section className="container mx-auto px-4 py-16 bg-gradient-to-r from-green-50 to-blue-50">
          <div className="max-w-4xl mx-auto text-center">
            <div className="flex items-center justify-center gap-2 mb-6">
              <Sparkles className="h-6 w-6 text-green-600" />
              <h2 className="text-3xl font-bold">14-Day Free Trial</h2>
            </div>
            
            <p className="text-xl text-neutral-600 mb-8">
              Experience PlaneMail risk-free. No credit card required during the trial period. Start building your newsletter today.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white border border-neutral-200 rounded-lg p-6">
                <CheckCircle className="h-8 w-8 text-green-600 mb-4 mx-auto" />
                <h3 className="font-bold mb-2">Full Access</h3>
                <p className="text-sm text-neutral-600">
                  Access all premium features during your 14-day trial
                </p>
              </div>
              
              <div className="bg-white border border-neutral-200 rounded-lg p-6">
                <CheckCircle className="h-8 w-8 text-green-600 mb-4 mx-auto" />
                <h3 className="font-bold mb-2">No Credit Card</h3>
                <p className="text-sm text-neutral-600">
                  Trial starts immediately without payment information
                </p>
              </div>
              
              <div className="bg-white border border-neutral-200 rounded-lg p-6">
                <CheckCircle className="h-8 w-8 text-green-600 mb-4 mx-auto" />
                <h3 className="font-bold mb-2">Cancel Anytime</h3>
                <p className="text-sm text-neutral-600">
                  Cancel before day 14 with zero charges or commitments
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Open Source Section */}
        <section className="container mx-auto px-4 pb-24">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4">
                Or go fully open source
              </h2>
              <p className="text-neutral-600">
                Deploy and manage PlaneMail yourself with complete control.
              </p>
            </div>
            
            <div className="max-w-2xl mx-auto">
              <div className="border border-neutral-200 rounded-lg p-8 bg-white">
                <div className="text-center mb-8">
                  <h3 className="text-2xl font-bold mb-2">{openSourcePlan.name}</h3>
                  <div className="mb-4">
                    <span className="text-4xl font-bold">{openSourcePlan.price}</span>
                    <span className="text-neutral-500 ml-2">{openSourcePlan.frequency}</span>
                  </div>
                  <p className="text-neutral-600">{openSourcePlan.description}</p>
                </div>

                <ul className="space-y-3 mb-8">
                  {openSourcePlan.features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>

                <Button
                  className="w-full border border-black/20 hover:border-black/40 bg-white text-black"
                  variant="outline"
                  asChild
                >
                  <a
                    href={openSourcePlan.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center"
                  >
                    <span>{openSourcePlan.cta}</span>
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </a>
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* BYOE Section */}
        <section className="border-t border-neutral-200 bg-neutral-50">
          <div className="container mx-auto px-4 py-24">
            <div className="max-w-4xl mx-auto text-center">
              <h2 className="text-3xl md:text-4xl font-bold mb-6">
                Bring Your Own Email Provider
              </h2>
              <p className="text-xl text-neutral-600 mb-12 max-w-2xl mx-auto">
                Connect with any email service provider. No markup on sending costs.
                Full control over your email infrastructure.
              </p>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
                {['AWS SES', 'Mailgun', 'SendGrid', 'Postmark'].map((provider) => (
                  <div
                    key={provider}
                    className="bg-white border border-neutral-200 rounded-lg p-4 text-center"
                  >
                    <div className="font-mono text-sm font-medium">{provider}</div>
                  </div>
                ))}
              </div>

              <div className="bg-white border border-neutral-200 rounded-lg p-8 text-left max-w-2xl mx-auto">
                <h3 className="font-bold mb-4">Why BYOE matters:</h3>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start gap-3">
                    <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>No vendor lock-in or email markup</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>Direct relationship with your ESP</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>Better deliverability control</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>Transparent, predictable costs</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Community Section */}
        <section className="container mx-auto px-4 py-24">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              Join the Community
            </h2>
            <p className="text-xl text-neutral-600 mb-12">
              Get help, share feedback, and stay updated on the latest developments.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button className="bg-[#4A154B] hover:bg-[#4A154B]/90 text-white">
                <a 
                  href="https://join.slack.com/t/planemail/shared_invite/zt-37xn9nvet-PmOvbhYaUwsrJUf6mP7uEw"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center"
                >
                  <Slack className="mr-2 h-4 w-4" />
                  <span>Join Slack</span>
                </a>
              </Button>

              <Button variant="outline" className="border-black/20 hover:border-black/40">
                <a
                  href="https://github.com/outrevo/PlaneMail"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center"
                >
                  <Github className="mr-2 h-4 w-4" />
                  <span>GitHub</span>
                </a>
              </Button>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="border-t border-neutral-200 bg-neutral-50">
          <div className="container mx-auto px-4 py-24">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
                Frequently Asked Questions
              </h2>

              <div className="space-y-8">
                <div>
                  <h3 className="font-bold mb-2">What's the difference between open source and hosted?</h3>
                  <p className="text-neutral-600">
                    Open source means you deploy and manage PlaneMail yourself. Hosted means we handle the infrastructure, updates, and maintenance for you.
                  </p>
                </div>

                <div>
                  <h3 className="font-bold mb-2">Do I need to bring my own email provider?</h3>
                  <p className="text-neutral-600">
                    Yes, with both options. This gives you better deliverability, transparent costs, and no vendor lock-in. We integrate with all major email service providers.
                  </p>
                </div>

                <div>
                  <h3 className="font-bold mb-2">Can I migrate from other newsletter platforms?</h3>
                  <p className="text-neutral-600">
                    Absolutely. We provide migration tools and guides to help you move your subscribers and content from other platforms.
                  </p>
                </div>

                <div>
                  <h3 className="font-bold mb-2">Is the hosted version available now?</h3>
                  <p className="text-neutral-600">
                    We're currently building the hosted version. Join our waitlist to be notified when it's ready.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-neutral-200 bg-white">
        <div className="container mx-auto px-4 py-12">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <Logo />
            <div className="mt-4 md:mt-0 text-sm text-neutral-500">
              © {new Date().getFullYear()} PlaneMail. Open source newsletter platform.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
