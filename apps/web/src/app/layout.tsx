
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
  title: 'PlaneMail - Email Marketing Reimagined',
  description: 'Craft and send powerful email newsletters with PlaneMail.',
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
