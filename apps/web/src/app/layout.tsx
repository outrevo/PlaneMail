
import type {Metadata} from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { ClerkProvider } from '@clerk/nextjs';
import { Inter } from 'next/font/google';

// import '@usewaypoint/email-builder/dist/index.css'; 
// ^ Commented out: CSS path 'dist/index.css' is likely for newer versions.
// For @usewaypoint/email-builder@0.0.8, the CSS might be different or not needed.
// This may need to be revisited if styling issues occur after successful package installation.

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL || 'https://planemail.in'),
  title: {
    default: 'PlaneMail - Email Marketing Reimagined with Notion-Style Editor',
    template: '%s | PlaneMail'
  },
  description: 'Transform your email marketing with PlaneMail\'s Notion-style editor. Create engaging posts, send targeted campaigns, and publish to web. Integrate with AWS SES, Brevo, and Mailgun.',
  keywords: ['email marketing', 'newsletter platform', 'Notion editor', 'email campaigns', 'content publishing', 'subscriber management', 'email automation'],
  authors: [{ name: 'Devsquirrel Technologies Private Limited' }],
  creator: 'Devsquirrel Technologies',
  publisher: 'Devsquirrel Technologies',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: '/',
    siteName: 'PlaneMail',
    title: 'PlaneMail - Email Marketing Reimagined with Notion-Style Editor',
    description: 'Transform your email marketing with PlaneMail\'s Notion-style editor. Create engaging posts, send targeted campaigns, and publish to web.',
    images: [
      {
        url: '/images/og-image.png',
        width: 1200,
        height: 630,
        alt: 'PlaneMail - Email Marketing Platform',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'PlaneMail - Email Marketing Reimagined',
    description: 'Transform your email marketing with PlaneMail\'s Notion-style editor. Create engaging posts, send targeted campaigns, and publish to web.',
    images: ['/images/twitter-image.png'],
    creator: '@planemail',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: process.env.GOOGLE_SITE_VERIFICATION,
  },
  alternates: {
    canonical: '/',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en" suppressHydrationWarning className={inter.variable}>
        <head>
        </head>
        <body className={`${inter.className} antialiased bg-background text-foreground`}>
          {children}
          <Toaster />
        </body>
      </html>
    </ClerkProvider>
  );
}
