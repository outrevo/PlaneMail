
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { CheckCircle, MinusCircle, Rocket, Zap, Star, Send } from 'lucide-react'; // Added Send for PlaneMail Logo
import { PageHeader } from '@/components/common/PageHeader';
import type { Metadata } from 'next';
import { Logo } from '@/components/icons/Logo';

export const metadata: Metadata = {
  title: 'Pricing Plans | PlaneMail - Affordable Email Marketing',
  description: 'Choose the perfect PlaneMail plan for your needs. From our free tier for beginners to pro plans for businesses, start sending powerful emails today.',
};

const pricingTiers = [
  {
    id: 'launchpad',
    name: 'LaunchPad',
    price: '$0',
    frequency: '/ month',
    description: 'Perfect for individuals and hobbyists getting started or testing PlaneMail.',
    Icon: Rocket,
    features: [
      { text: 'Up to 500 Subscribers', included: true },
      { text: 'Up to 2,000 Emails/month (via your provider)', included: true },
      { text: 'Drag & Drop Editor', included: true },
      { text: 'Basic Templates', included: true },
      { text: 'Audience Management', included: true },
      { text: 'Basic Analytics (Sent, Placeholder Opens/Clicks)', included: true },
      { text: '1 Sending Integration', included: true },
      { text: '1 API Key (Rate-limited)', included: true },
      { text: 'PlaneMail Branding on Emails (Optional)', included: true },
      { text: 'Community Support', included: true },
      { text: 'Advanced Analytics', included: false },
      { text: 'AI Content Assistant', included: false },
    ],
    cta: 'Get Started Free',
    href: '/sign-up?plan=launchpad',
    isFeatured: false,
  },
  {
    id: 'ascent',
    name: 'Ascent',
    price: '$19',
    frequency: '/ month',
    description: 'Ideal for growing businesses and content creators needing more power.',
    Icon: Zap,
    features: [
      { text: 'Up to 5,000 Subscribers', included: true },
      { text: 'Up to 50,000 Emails/month (via your provider)', included: true },
      { text: 'No PlaneMail Branding', included: true },
      { text: 'Access to Premium Templates', included: true },
      { text: 'Advanced Segmentation', included: true },
      { text: 'AI Content Assistant (Basic)', included: true },
      { text: 'Up to 5 API Keys', included: true },
      { text: 'Email Support', included: true },
      { text: 'Advanced Analytics (Overall stats, time-series soon)', included: true },
      { text: 'All LaunchPad Plan Features', included: true },
    ],
    cta: 'Choose Ascent',
    href: '/sign-up?plan=ascent',
    isFeatured: true,
  },
  {
    id: 'zenith',
    name: 'Zenith',
    price: '$49',
    frequency: '/ month',
    description: 'For agencies, power users, and businesses with large or unlimited needs.',
    Icon: Star,
    features: [
      { text: 'Unlimited Subscribers', included: true },
      { text: 'Unlimited Emails/month (via your provider, subject to their FUP)', included: true },
      { text: 'Advanced Analytics (Full, time-series when available)', included: true },
      { text: 'AI Content Assistant (Generous)', included: true },
      { text: 'Unlimited API Keys', included: true },
      { text: 'Access to All Current & Future Integrations', included: true },
      { text: 'Priority Email & Chat Support', included: true },
      { text: 'A/B Testing (Future)', included: true },
      { text: 'Team Members (Future)', included: true },
      { text: 'All Ascent Plan Features', included: true },
    ],
    cta: 'Go Zenith',
    href: '/sign-up?plan=zenith',
    isFeatured: false,
  },
];

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="container mx-auto flex h-20 items-center justify-between px-4 py-4 sticky top-0 z-50 bg-background/80 backdrop-blur-md">
         <Logo />
        <nav className="flex items-center gap-2">
          <Button variant="ghost" asChild className="text-foreground hover:bg-foreground/5"><Link href="/#features">Features</Link></Button>
          <Button variant="ghost" asChild className="text-foreground hover:bg-foreground/5"><Link href="/sign-in">Sign In</Link></Button>
          <Button asChild className="bg-primary text-primary-foreground hover:bg-primary/90"><Link href="/sign-up">Get Started</Link></Button>
        </nav>
      </header>

      <main className="container mx-auto px-4 py-16 sm:py-24">
        <PageHeader
          title="Simple, Powerful Pricing"
          description="Choose the plan that scales with you. Your provider handles email sending costs."
        />

        <div className="mt-12 grid grid-cols-1 gap-8 md:grid-cols-3 lg:gap-12">
          {pricingTiers.map((tier) => (
            <Card key={tier.name} className={`flex flex-col rounded-xl shadow-lg hover:shadow-2xl transition-shadow duration-300 ${tier.isFeatured ? 'border-2 border-primary ring-2 ring-primary/50 relative' : 'border-border'}`}>
              {tier.isFeatured && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-4 py-1 text-xs font-semibold text-primary-foreground">
                  Most Popular
                </div>
              )}
              <CardHeader className="p-6 text-center">
                <tier.Icon className={`mx-auto mb-4 h-12 w-12 ${tier.isFeatured ? 'text-primary' : 'text-accent'}`} />
                <CardTitle className="font-headline text-3xl font-bold">{tier.name}</CardTitle>
                <div className="mt-2">
                  <span className="text-4xl font-extrabold text-foreground">{tier.price}</span>
                  <span className="text-lg text-muted-foreground">{tier.frequency}</span>
                </div>
                <CardDescription className="mt-3 text-sm min-h-[40px]">{tier.description}</CardDescription>
              </CardHeader>
              <CardContent className="flex-grow p-6 space-y-3">
                <ul className="space-y-2.5 text-sm">
                  {tier.features.map((feature, index) => (
                    <li key={index} className="flex items-start">
                      {feature.included ? (
                        <CheckCircle className="mr-2 mt-0.5 h-5 w-5 flex-shrink-0 text-green-500" />
                      ) : (
                        <MinusCircle className="mr-2 mt-0.5 h-5 w-5 flex-shrink-0 text-muted-foreground/70" />
                      )}
                      <span className={!feature.included ? 'text-muted-foreground/70' : ''}>{feature.text}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter className="p-6 mt-auto">
                <Button
                  asChild
                  className={`w-full font-semibold text-lg py-3 ${tier.isFeatured ? 'bg-primary text-primary-foreground hover:bg-primary/90' : 'bg-accent text-accent-foreground hover:bg-accent/90'}`}
                >
                  <Link href={tier.href}>{tier.cta}</Link>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>

        <div className="mt-16 text-center">
          <h3 className="text-2xl font-semibold text-foreground">Need Custom Solutions?</h3>
          <p className="mt-2 text-muted-foreground">
            Contact us for enterprise-level requirements, dedicated support, or white-labeling options.
          </p>
          <Button variant="outline" className="mt-6">Contact Sales</Button>
        </div>
      </main>

      <footer className="border-t border-border bg-background/50 mt-20">
        <div className="container mx-auto flex flex-col items-center justify-between px-4 py-8 sm:flex-row">
          <Logo />
          <p className="mt-4 text-sm text-muted-foreground sm:mt-0">
            &copy; {new Date().getFullYear()} PlaneMail. Precision Engineered Communication.
          </p>
        </div>
      </footer>
    </div>
  );
}
