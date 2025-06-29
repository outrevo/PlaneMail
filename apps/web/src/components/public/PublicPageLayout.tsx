'use client';

import React from 'react';
import Link from 'next/link';
import { PublicSiteSettings } from '@/app/p/[slug]/actions';

interface PublicPageLayoutProps {
  children: React.ReactNode;
  siteSettings: PublicSiteSettings;
}

export function PublicPageLayout({ children, siteSettings }: PublicPageLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col" style={{ '--primary-color': siteSettings.primaryColor } as React.CSSProperties}>
      {/* Custom CSS */}
      {siteSettings.customCss && (
        <style dangerouslySetInnerHTML={{ __html: siteSettings.customCss }} />
      )}

      {/* Header */}
      {siteSettings.headerEnabled && (
        <header className="bg-background border-b">
          <div className="max-w-6xl mx-auto px-4 py-4">
            {siteSettings.headerContent ? (
              <div dangerouslySetInnerHTML={{ __html: siteSettings.headerContent }} />
            ) : (
              <DefaultHeader siteSettings={siteSettings} />
            )}
          </div>
        </header>
      )}

      {/* Main Content */}
      <main className="flex-1">
        {children}
      </main>

      {/* Footer */}
      {siteSettings.footerEnabled && (
        <footer className="bg-muted/30 border-t mt-auto">
          <div className="max-w-6xl mx-auto px-4 py-8">
            {siteSettings.footerContent ? (
              <div dangerouslySetInnerHTML={{ __html: siteSettings.footerContent }} />
            ) : (
              <DefaultFooter siteSettings={siteSettings} />
            )}
          </div>
        </footer>
      )}

      {/* Custom JavaScript */}
      {siteSettings.customJs && (
        <script dangerouslySetInnerHTML={{ __html: siteSettings.customJs }} />
      )}

      {/* Analytics */}
      {siteSettings.analyticsCode && (
        <script dangerouslySetInnerHTML={{ __html: siteSettings.analyticsCode }} />
      )}
    </div>
  );
}

function DefaultHeader({ siteSettings }: { siteSettings: PublicSiteSettings }) {
  return (
    <div className="flex items-center justify-between">
      <Link href="/" className="flex items-center gap-3">
        {siteSettings.logoUrl ? (
          <img 
            src={siteSettings.logoUrl} 
            alt={siteSettings.siteName}
            className="h-8 w-auto"
          />
        ) : (
          <div className="h-8 w-8 rounded bg-primary flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-sm">
              {siteSettings.siteName.charAt(0)}
            </span>
          </div>
        )}
        <span className="font-semibold text-lg">{siteSettings.siteName}</span>
      </Link>

      <nav className="flex items-center gap-6">
        <Link href="/" className="text-sm font-medium hover:text-primary transition-colors">
          Home
        </Link>
        <Link href="/archive" className="text-sm font-medium hover:text-primary transition-colors">
          Archive
        </Link>
        <Link href="/about" className="text-sm font-medium hover:text-primary transition-colors">
          About
        </Link>
      </nav>
    </div>
  );
}

function DefaultFooter({ siteSettings }: { siteSettings: PublicSiteSettings }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
      <div>
        <h3 className="font-semibold mb-3">{siteSettings.siteName}</h3>
        <p className="text-sm text-muted-foreground mb-4">
          {siteSettings.siteDescription}
        </p>
      </div>

      <div>
        <h4 className="font-medium mb-3">Quick Links</h4>
        <ul className="space-y-2 text-sm">
          <li>
            <Link href="/" className="text-muted-foreground hover:text-foreground transition-colors">
              Home
            </Link>
          </li>
          <li>
            <Link href="/archive" className="text-muted-foreground hover:text-foreground transition-colors">
              Archive
            </Link>
          </li>
          <li>
            <Link href="/about" className="text-muted-foreground hover:text-foreground transition-colors">
              About
            </Link>
          </li>
        </ul>
      </div>

      <div>
        <h4 className="font-medium mb-3">Connect</h4>
        <div className="flex items-center gap-4">
          {/* Social media links would go here */}
          <p className="text-sm text-muted-foreground">
            Powered by <span className="font-medium">PlaneMail</span>
          </p>
        </div>
      </div>
    </div>
  );
}
