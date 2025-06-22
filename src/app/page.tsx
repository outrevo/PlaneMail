"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, ExternalLink, AlertCircle, CheckCircle, Github, Slack } from "lucide-react";
import { Logo } from "@/components/icons/Logo";
import { useActionState } from "react"; // Updated import
import { useFormStatus } from "react-dom";
import { useState, useEffect } from "react";
import { joinWaitlist, getWaitlistCount } from "./actions";

// Form submit button with loading state
function SubmitButton() {
  const { pending } = useFormStatus();
  
  return (
    <button 
      type="submit"
      className="h-10 whitespace-nowrap px-4 py-2 bg-white text-black rounded font-medium disabled:opacity-70 disabled:cursor-not-allowed"
      disabled={pending}
    >
      {pending ? 'Joining...' : 'Join Waitlist'}
    </button>
  );
}

export default function LandingPage() {
  // Get actual waitlist count
  const [waitlistCount, setWaitlistCount] = useState(0);
  const [isLoadingCount, setIsLoadingCount] = useState(true);
  
  useEffect(() => {
    async function fetchWaitlistCount() {
      try {
        const data = await getWaitlistCount();
        setWaitlistCount(data.count || 0);
      } catch (error) {
        console.error("Failed to fetch waitlist count", error);
      } finally {
        setIsLoadingCount(false);
      }
    }
    
    fetchWaitlistCount();
  }, []);
  
  // Calculate remaining spots
  const remainingSpots = Math.max(0, 100 - waitlistCount);
  
  // For the waitlist form - updated to useActionState
  const initialState = { message: "", success: false, remainingSpots };
  const [state, formAction] = useActionState(joinWaitlist, initialState);
  const [showFormMessage, setShowFormMessage] = useState(false);
  
  // Show form message when state changes and hide after 5 seconds if it's a success
  useEffect(() => {
    if (state && state.message) {
      setShowFormMessage(true);
      
      if (state.success) {
        // Update waitlist count locally after successful submission
        setWaitlistCount(prev => prev + 1);
        
        const timer = setTimeout(() => {
          setShowFormMessage(false);
        }, 5000);
        
        return () => clearTimeout(timer);
      }
    }
  }, [state]);

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground font-mono">
      <header className="container mx-auto flex h-20 items-center justify-between px-4 py-4 relative z-10 border-b border-neutral-200">
        <Logo />
        <nav className="flex items-center gap-6">
          <Link
            href="/docs"
            className="text-sm hover:text-primary transition-colors"
          >
            Docs
          </Link>
          <Link
            href="#features"
            className="text-sm hover:text-primary transition-colors"
          >
            Features
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
        {/* Hero Section */}
        <section className="container mx-auto px-4 py-24 md:py-32">
          <div className="max-w-3xl">
            <div className="flex items-center gap-2 mb-8">
              <div className="bg-neutral-100 text-neutral-800 px-3 py-1 text-xs font-medium rounded-full">
                Open Source
              </div>
              <div className="h-4 w-px bg-neutral-300"></div>
              <div className="text-neutral-500 text-xs">MIT License</div>
            </div>

            <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
              The open-source
              <br />newsletter platform
            </h1>

            <p className="text-xl text-neutral-600 mb-8 max-w-2xl">
              Use your own email provider. No vendor lock-in. Full control over
              your data.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 mb-12">
              <Button className="bg-[#4A154B] hover:bg-[#4A154B]/90 text-white rounded px-6 py-2.5 h-auto">
                <a 
                  href="https://join.slack.com/t/planemail/shared_invite/zt-37xn9nvet-PmOvbhYaUwsrJUf6mP7uEw"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center"
                >
                  <Slack className="mr-2 h-4 w-4" />
                  <span>Join community now</span>
                  <ArrowRight className="ml-2 h-4 w-4" />
                </a>
              </Button>

              <Button
                variant="outline"
                className="border-black/10 hover:border-black/30 rounded px-6 py-2.5 h-auto"
              >
                <Link
                  href="https://github.com/outrevo/PlaneMail"
                  target="_blank"
                  className="flex items-center"
                >
                  <Github className="mr-2 h-4 w-4" />
                  <span>Star on GitHub</span>
                </Link>
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-12 text-sm">
              <div>
                <h3 className="font-semibold mb-1">BYOP (Bring Your Own Provider)</h3>
                <p className="text-neutral-600">
                  Connect AWS SES, SendGrid, Brevo, or any SMTP provider. No more
                  paying per-subscriber fees.
                </p>
              </div>
              <div>
                <h3 className="font-semibold mb-1">Full Ownership</h3>
                <p className="text-neutral-600">
                  Your data belongs to you. Self-host or use our cloud offering.
                </p>
              </div>
              <div>
                <h3 className="font-semibold mb-1">Developer First</h3>
                <p className="text-neutral-600">
                  API-first architecture with complete documentation and examples.
                </p>
              </div>
              <div>
                <h3 className="font-semibold mb-1">Modern Stack</h3>
                <p className="text-neutral-600">
                  Built with Next.js, TypeScript, and the latest web standards.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Why PlaneMail Section */}
        <section className="bg-neutral-100 py-24">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl">
              <h2 className="text-3xl font-bold mb-12">Why PlaneMail?</h2>

              <div className="space-y-16">
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <div className="bg-black text-white w-8 h-8 rounded-full flex items-center justify-center font-medium">
                      1
                    </div>
                    <h3 className="text-xl font-semibold">Cost Efficiency</h3>
                  </div>
                  <p className="text-neutral-600 pl-10">
                    Traditional newsletter tools charge per subscriber, making
                    costs unpredictable. With PlaneMail, use your own email
                    provider and pay only for what you send.
                    <span className="block mt-2 text-sm font-medium">
                      Save up to 90% on email costs.
                    </span>
                  </p>
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <div className="bg-black text-white w-8 h-8 rounded-full flex items-center justify-center font-medium">
                      2
                    </div>
                    <h3 className="text-xl font-semibold">
                      Open Source & Transparent
                    </h3>
                  </div>
                  <p className="text-neutral-600 pl-10">
                    No black boxes or proprietary lock-in. PlaneMail is 100%{" "}
                    open-source, allowing full customization and extension. Our
                    business model is built on transparency, not data lock-in.
                    <span className="block mt-2 text-sm font-medium">
                      Inspect the code. Contribute. Make it yours.
                    </span>
                  </p>
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <div className="bg-black text-white w-8 h-8 rounded-full flex items-center justify-center font-medium">
                      3
                    </div>
                    <h3 className="text-xl font-semibold">
                      Designed for Developers
                    </h3>
                  </div>
                  <p className="text-neutral-600 pl-10">
                    PlaneMail provides a simple API and CLI tools that integrate
                    with your existing workflow. Deploy alongside your application
                    or as a standalone service.
                    <span className="block mt-2 text-sm font-medium">
                      Modern API. Clean documentation. Developer experience first.
                    </span>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Founding Users Section with updated form */}
      <section className="bg-black text-white py-24">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl">
            <h2 className="text-3xl font-bold mb-6">
              Join the Founding Users Program
            </h2>
            <p className="text-neutral-400 mb-8">
              We're looking for the first 100 users to help shape the future of
              PlaneMail. Get exclusive benefits and direct input on our roadmap.
            </p>

            <div className="border border-white/10 rounded-lg p-8 mb-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div className="flex gap-3">
                  <div className="w-5 h-5 rounded-full bg-primary flex-shrink-0 mt-0.5"></div>
                  <div>
                    <h3 className="font-medium mb-1">Free Premium Features</h3>
                    <p className="text-neutral-400 text-sm">
                      Lifetime access to premium features at no cost.
                    </p>
                  </div>
                </div>
                
                <div className="flex gap-3">
                  <div className="w-5 h-5 rounded-full bg-primary flex-shrink-0 mt-0.5"></div>
                  <div>
                    <h3 className="font-medium mb-1">Priority Support</h3>
                    <p className="text-neutral-400 text-sm">
                      Direct line to our engineering team.
                    </p>
                  </div>
                </div>
                
                <div className="flex gap-3">
                  <div className="w-5 h-5 rounded-full bg-primary flex-shrink-0 mt-0.5"></div>
                  <div>
                    <h3 className="font-medium mb-1">Shape the Roadmap</h3>
                    <p className="text-neutral-400 text-sm">
                      Vote on features and influence development priorities.
                    </p>
                  </div>
                </div>
                
                <div className="flex gap-3">
                  <div className="w-5 h-5 rounded-full bg-primary flex-shrink-0 mt-0.5"></div>
                  <div>
                    <h3 className="font-medium mb-1">Recognition</h3>
                    <p className="text-neutral-400 text-sm">
                      Your name in our GitHub repository as a founding user.
                    </p>
                  </div>
                </div>
              </div>

              <form action={formAction} className="flex flex-col sm:flex-row gap-3">
                <input
                  type="email"
                  name="email"
                  placeholder="Your email address"
                  className="flex h-10 w-full rounded bg-white/10 border border-white/20 px-3 py-2 text-sm text-white"
                  required
                  aria-label="Email address"
                />
                <SubmitButton />
              </form>
              
              {/* Form feedback message */}
              {showFormMessage && (
                <div className={`mt-3 flex items-start gap-2 text-sm ${state.success ? 'text-green-400' : 'text-red-400'}`}>
                  {state.success ? (
                    <CheckCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  ) : (
                    <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  )}
                  <p>{state.message}</p>
                </div>
              )}
              
              <div className="mt-4 space-y-3">
                <p className="text-xs text-neutral-500">
                  {isLoadingCount ? (
                    "Loading waitlist count..."
                  ) : (
                    <>
                      <span className="font-medium text-white">{waitlistCount}</span> users joined, <span className="font-medium text-white">{remainingSpots}</span> spots remaining
                    </>
                  )}
                </p>
                
                {/* Slack invitation button */}
                <a 
                  href="https://join.slack.com/t/planemail/shared_invite/zt-37xn9nvet-PmOvbhYaUwsrJUf6mP7uEw"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-[#4A154B] text-white rounded hover:bg-opacity-90 transition-colors mt-2"
                >
                  <Slack className="h-4 w-4" />
                  <span>Join our Slack community</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>
      </main>

      <footer className="border-t border-neutral-200 py-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-8 md:mb-0">
              <Logo />
              <p className="text-sm text-neutral-500 mt-2">
                The open-source newsletter platform.
              </p>
            </div>

            <div className="flex gap-8">
              <div>
                <h3 className="text-sm font-medium mb-4">Product</h3>
                <ul className="space-y-2">
                  <li>
                    <Link
                      href="#features"
                      className="text-sm text-neutral-500 hover:text-primary"
                    >
                      Features
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/docs"
                      className="text-sm text-neutral-500 hover:text-primary"
                    >
                      Documentation
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/pricing"
                      className="text-sm text-neutral-500 hover:text-primary"
                    >
                      Pricing
                    </Link>
                  </li>
                </ul>
              </div>

              <div>
                <h3 className="text-sm font-medium mb-4">Community</h3>
                <ul className="space-y-2">
                  <li>
                    <Link
                      href="https://github.com/outrevo/PlaneMail"
                      className="text-sm text-neutral-500 hover:text-primary flex items-center gap-1"
                      target="_blank"
                    >
                      GitHub
                      <ExternalLink className="h-3 w-3" />
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="https://twitter.com/outrevo"
                      className="text-sm text-neutral-500 hover:text-primary flex items-center gap-1"
                      target="_blank"
                    >
                      Twitter
                      <ExternalLink className="h-3 w-3" />
                    </Link>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          <div className="border-t border-neutral-200 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center">
            <p className="text-xs text-neutral-500">
              &copy; {new Date().getFullYear()} PlaneMail. MIT License.
            </p>

            <div className="flex gap-4 mt-4 md:mt-0">
              <Link
                href="/privacy"
                className="text-xs text-neutral-500 hover:text-primary"
              >
                Privacy Policy
              </Link>
              <Link
                href="/terms"
                className="text-xs text-neutral-500 hover:text-primary"
              >
                Terms of Service
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
