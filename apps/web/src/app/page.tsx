"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, ExternalLink, AlertCircle, CheckCircle, Github, Slack, Link2, Target, Zap, Rocket, Gift, Users, Vote, Award, DollarSign, Unlock, Code } from "lucide-react";
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
    <div className="min-h-screen bg-white relative">
      {/* Apple-style Header */}
      <header className="relative z-50 bg-white sticky top-0 border-b border-gray-200">
        <div className="container mx-auto flex h-11 items-center justify-between px-6 max-w-6xl">
          <div>
            <Logo />
          </div>
          <nav className="hidden md:flex items-center gap-8">
            <Link
              href="/pricing"
              className="text-sm text-gray-800 hover:text-black transition-colors duration-200" 
              style={{letterSpacing: '-0.01em'}}
            >
              Pricing
            </Link>
            <Link
              href="/docs"
              className="text-sm text-gray-800 hover:text-black transition-colors duration-200"
              style={{letterSpacing: '-0.01em'}}
            >
              Documentation
            </Link>
            <Link
              href="https://github.com/outrevo/PlaneMail"
              target="_blank"
              className="text-sm text-gray-800 hover:text-black transition-colors duration-200 flex items-center gap-1"
              style={{letterSpacing: '-0.01em'}}
            >
              <Github className="h-4 w-4" />
              <span>GitHub</span>
            </Link>
          </nav>
        </div>
      </header>

      <main className="relative">
        {/* Hero Section */}
        <section className="container mx-auto px-6 py-24 md:py-32">
          <div className="max-w-4xl mx-auto text-center">
            {/* Trust Indicators */}
            <div className="flex items-center justify-center gap-4 mb-12">
              <div className="px-3 py-1 bg-gray-100 text-xs font-medium rounded-full text-gray-600">
                Open Source
              </div>
              <div className="px-3 py-1 bg-gray-100 text-xs font-medium rounded-full text-gray-600">
                MIT License
              </div>
              <div className="px-3 py-1 bg-gray-100 text-xs font-medium rounded-full text-gray-600">
                Self-Hosted
              </div>
            </div>

            <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight text-black" style={{letterSpacing: '-0.05em'}}>
              Email infrastructure<br />built for developers
            </h1>

            <p className="text-lg md:text-xl text-gray-600 mb-8 max-w-2xl mx-auto leading-relaxed" style={{letterSpacing: '-0.01em'}}>
              Use your own email provider. No vendor lock-in.<br />
              Complete control over your data and costs.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 justify-center mb-16">
              <a 
                href="https://join.slack.com/t/planemail/shared_invite/zt-37xn9nvet-PmOvbhYaUwsrJUf6mP7uEw"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center px-6 py-2 bg-black text-white text-sm font-medium rounded-full hover:bg-gray-900 transition-colors duration-200"
                style={{letterSpacing: '-0.01em'}}
              >
                <Slack className="mr-2 h-4 w-4" />
                <span>Join Community</span>
              </a>

              <Link
                href="https://github.com/outrevo/PlaneMail"
                target="_blank"
                className="inline-flex items-center justify-center px-6 py-2 bg-white text-black text-sm font-medium rounded-full border border-gray-200 hover:bg-gray-50 transition-colors duration-200"
                style={{letterSpacing: '-0.01em'}}
              >
                <Github className="mr-2 h-4 w-4" />
                <span>Star on GitHub</span>
                <ExternalLink className="ml-2 h-3 w-3" />
              </Link>
            </div>

            {/* Feature Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-3xl mx-auto">
              <div className="bg-white p-6 rounded-2xl border border-gray-200 hover:shadow-sm transition-shadow duration-300">
                <div className="w-10 h-10 bg-black rounded-xl flex items-center justify-center mb-4">
                  <Link2 className="h-5 w-5 text-white" />
                </div>
                <h3 className="text-lg font-semibold mb-2 text-black" style={{letterSpacing: '-0.01em'}}>
                  BYOP (Bring Your Own Provider)
                </h3>
                <p className="text-sm text-gray-600 leading-relaxed">
                  Connect AWS SES, SendGrid, Brevo, or any SMTP provider. No more paying per-subscriber fees.
                </p>
              </div>
              
              <div className="bg-white p-6 rounded-2xl border border-gray-200 hover:shadow-sm transition-shadow duration-300">
                <div className="w-10 h-10 bg-black rounded-xl flex items-center justify-center mb-4">
                  <Target className="h-5 w-5 text-white" />
                </div>
                <h3 className="text-lg font-semibold mb-2 text-black" style={{letterSpacing: '-0.01em'}}>
                  Full Ownership
                </h3>
                <p className="text-sm text-gray-600 leading-relaxed">
                  Your data belongs to you. Self-host or use our cloud offering with complete control.
                </p>
              </div>
              
              <div className="bg-white p-6 rounded-2xl border border-gray-200 hover:shadow-sm transition-shadow duration-300">
                <div className="w-10 h-10 bg-black rounded-xl flex items-center justify-center mb-4">
                  <Zap className="h-5 w-5 text-white" />
                </div>
                <h3 className="text-lg font-semibold mb-2 text-black" style={{letterSpacing: '-0.01em'}}>
                  Developer First
                </h3>
                <p className="text-sm text-gray-600 leading-relaxed">
                  API-first architecture with complete documentation and examples for seamless integration.
                </p>
              </div>
              
              <div className="bg-white p-6 rounded-2xl border border-gray-200 hover:shadow-sm transition-shadow duration-300">
                <div className="w-10 h-10 bg-black rounded-xl flex items-center justify-center mb-4">
                  <Rocket className="h-5 w-5 text-white" />
                </div>
                <h3 className="text-lg font-semibold mb-2 text-black" style={{letterSpacing: '-0.01em'}}>
                  Modern Stack
                </h3>
                <p className="text-sm text-gray-600 leading-relaxed">
                  Built with Next.js, TypeScript, and the latest web standards for maximum performance.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Why PlaneMail Section */}
        <section className="py-20 bg-gray-50">
          <div className="container mx-auto px-6 max-w-5xl">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold mb-4 text-black" style={{letterSpacing: '-0.04em'}}>
                Why choose PlaneMail?
              </h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto" style={{letterSpacing: '-0.01em'}}>
                Break free from expensive email platforms that lock in your data and charge per subscriber.
              </p>
            </div>

            <div className="space-y-6">
              <div className="bg-white p-8 rounded-2xl border border-gray-200 shadow-sm">
                <div className="flex items-start gap-6">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-black rounded-2xl flex items-center justify-center">
                      <DollarSign className="h-6 w-6 text-white" />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold mb-3 text-black" style={{letterSpacing: '-0.02em'}}>
                      90% Cost Reduction
                    </h3>
                    <p className="text-gray-600 leading-relaxed mb-3">
                      Traditional newsletter tools charge per subscriber, making costs unpredictable. 
                      With PlaneMail, use your own email provider and pay only for what you send.
                    </p>
                    <div className="inline-block px-3 py-1 bg-gray-100 rounded-full">
                      <span className="text-xs font-medium text-gray-700">Save thousands monthly</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white p-8 rounded-2xl border border-gray-200 shadow-sm">
                <div className="flex items-start gap-6">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-black rounded-2xl flex items-center justify-center">
                      <Unlock className="h-6 w-6 text-white" />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold mb-3 text-black" style={{letterSpacing: '-0.02em'}}>
                      Open Source & Transparent
                    </h3>
                    <p className="text-gray-600 leading-relaxed mb-3">
                      No black boxes or proprietary lock-in. PlaneMail is 100% open-source, 
                      allowing full customization and extension with complete transparency.
                    </p>
                    <div className="inline-block px-3 py-1 bg-gray-100 rounded-full">
                      <span className="text-xs font-medium text-gray-700">MIT Licensed</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white p-8 rounded-2xl border border-gray-200 shadow-sm">
                <div className="flex items-start gap-6">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-black rounded-2xl flex items-center justify-center">
                      <Code className="h-6 w-6 text-white" />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold mb-3 text-black" style={{letterSpacing: '-0.02em'}}>
                      Developer Experience First
                    </h3>
                    <p className="text-gray-600 leading-relaxed mb-3">
                      PlaneMail provides a simple API and CLI tools that integrate with your existing workflow. 
                      Deploy alongside your application or as a standalone service.
                    </p>
                    <div className="inline-block px-3 py-1 bg-gray-100 rounded-full">
                      <span className="text-xs font-medium text-gray-700">API-First</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Founding Users Section */}
        <section className="py-20 bg-gray-50">
          <div className="container mx-auto px-6 max-w-4xl">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold mb-4 text-black" style={{letterSpacing: '-0.04em'}}>
                Join the founding users
              </h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto" style={{letterSpacing: '-0.01em'}}>
                Be among the first 100 users to shape PlaneMail's future.
              </p>
            </div>

            <div className="bg-white p-8 rounded-2xl border border-gray-200 shadow-sm">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div className="flex gap-3">
                  <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center flex-shrink-0">
                    <Gift className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1 text-black">Free premium features</h3>
                    <p className="text-sm text-gray-600">
                      Lifetime access to premium features
                    </p>
                  </div>
                </div>
                
                <div className="flex gap-3">
                  <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center flex-shrink-0">
                    <Zap className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1 text-black">Priority support</h3>
                    <p className="text-sm text-gray-600">
                      Direct line to our engineering team
                    </p>
                  </div>
                </div>
                
                <div className="flex gap-3">
                  <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center flex-shrink-0">
                    <Vote className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1 text-black">Shape the roadmap</h3>
                    <p className="text-sm text-gray-600">
                      Vote on features and development priorities
                    </p>
                  </div>
                </div>
                
                <div className="flex gap-3">
                  <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center flex-shrink-0">
                    <Award className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1 text-black">Recognition</h3>
                    <p className="text-sm text-gray-600">
                      Listed as a founding user in our repository
                    </p>
                  </div>
                </div>
              </div>

              <form action={formAction} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
                <input
                  type="email"
                  name="email"
                  placeholder="Your email address"
                  className="flex-1 h-10 px-3 bg-gray-50 border border-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent text-sm"
                  required
                  aria-label="Email address"
                  style={{letterSpacing: '-0.01em'}}
                />
                <button 
                  type="submit"
                  className="h-10 px-4 bg-black text-white text-sm font-medium rounded-full hover:bg-gray-900 transition-colors duration-200 whitespace-nowrap"
                  disabled={false}
                  style={{letterSpacing: '-0.01em'}}
                >
                  Join waitlist
                </button>
              </form>
            
              {/* Form feedback message */}
              {showFormMessage && (
                <div className={`mt-3 flex items-start gap-2 text-sm ${state.success ? 'text-green-600' : 'text-red-600'}`}>
                  {state.success ? (
                    <CheckCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  ) : (
                    <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  )}
                  <p>{state.message}</p>
                </div>
              )}
              
              <div className="mt-4 text-center">
                <p className="text-xs text-gray-500">
                  {isLoadingCount ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="inline-block w-2 h-2 bg-gray-400 rounded-full animate-pulse"></span>
                      Loading waitlist count...
                    </span>
                  ) : (
                    <>
                      <span className="font-medium text-black">{waitlistCount}</span> users joined, <span className="font-medium text-black">{remainingSpots}</span> spots remaining
                    </>
                  )}
                </p>
                
                {/* Slack invitation button */}
                <a 
                  href="https://join.slack.com/t/planemail/shared_invite/zt-37xn9nvet-PmOvbhYaUwsrJUf6mP7uEw"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 mt-3 bg-gray-100 text-black text-sm rounded-full hover:bg-gray-200 transition-colors duration-200"
                  style={{letterSpacing: '-0.01em'}}
                >
                  <Slack className="h-4 w-4" />
                  <span>Join our Slack community</span>
                </a>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-gray-200 py-12 bg-white">
        <div className="container mx-auto px-6 max-w-6xl">
          <div className="flex flex-col md:flex-row justify-between items-start">
            <div className="mb-8 md:mb-0">
              <Logo />
              <p className="text-sm text-gray-600 mt-2">
                The open-source newsletter platform.
              </p>
            </div>

            <div className="flex gap-16">
              <div>
                <h3 className="text-sm font-semibold mb-3 text-black">Product</h3>
                <ul className="space-y-2">
                  <li>
                    <Link
                      href="#features"
                      className="text-sm text-gray-600 hover:text-black transition-colors duration-200"
                    >
                      Features
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/docs"
                      className="text-sm text-gray-600 hover:text-black transition-colors duration-200"
                    >
                      Documentation
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/pricing"
                      className="text-sm text-gray-600 hover:text-black transition-colors duration-200"
                    >
                      Pricing
                    </Link>
                  </li>
                </ul>
              </div>

              <div>
                <h3 className="text-sm font-semibold mb-3 text-black">Community</h3>
                <ul className="space-y-2">
                  <li>
                    <Link
                      href="https://github.com/outrevo/PlaneMail"
                      className="text-sm text-gray-600 hover:text-black transition-colors duration-200 flex items-center gap-1"
                      target="_blank"
                    >
                      GitHub
                      <ExternalLink className="h-3 w-3" />
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="https://twitter.com/outrevo"
                      className="text-sm text-gray-600 hover:text-black transition-colors duration-200 flex items-center gap-1"
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

          <div className="border-t border-gray-200 mt-8 pt-6 flex flex-col md:flex-row justify-between items-center">
            <p className="text-xs text-gray-500">
              Copyright © {new Date().getFullYear()} PlaneMail. All rights reserved.
            </p>

            <div className="flex gap-6 mt-4 md:mt-0">
              <Link
                href="/privacy"
                className="text-xs text-gray-500 hover:text-black transition-colors duration-200"
              >
                Privacy Policy
              </Link>
              <Link
                href="/terms"
                className="text-xs text-gray-500 hover:text-black transition-colors duration-200"
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
