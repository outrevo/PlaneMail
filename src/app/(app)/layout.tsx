
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import React from 'react';
import { useUser, UserButton } from '@clerk/nextjs';
import { useToast } from '@/hooks/use-toast';
import {
  LayoutDashboard,
  FileText,
  Mail,
  Users,
  Settings,
  Plug, 
  Code2,
  CreditCard,
  Github,
} from 'lucide-react';
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarInset,
  SidebarTrigger,
  SidebarFooter,
  SidebarSeparator,
} from '@/components/ui/sidebar';
import { Logo } from '@/components/icons/Logo';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/templates', label: 'Templates', icon: FileText },
  { href: '/newsletters', label: 'Newsletters', icon: Mail },
  { href: '/subscribers', label: 'Subscribers', icon: Users },
  { href: '/integrations', label: 'Integrations', icon: Plug },
  { href: '/billing', label: 'Billing', icon: CreditCard },
  { href: '/docs/api', label: 'API Docs', icon: Code2 },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { toast } = useToast();
  const { user, isLoaded } = useUser();

  const getInitials = () => {
    if (!user) return 'PM';
    const { firstName, lastName, primaryEmailAddress } = user;
    if (firstName && lastName) {
      return (firstName[0] + lastName[0]).toUpperCase();
    }
    if (firstName) {
      return firstName.substring(0, 2).toUpperCase();
    }
    if (primaryEmailAddress?.emailAddress) {
      const email = primaryEmailAddress.emailAddress;
      const parts = email.split('@')[0].split(/[._-]/);
      if (parts.length > 1 && parts[0] && parts[1]) {
        return (parts[0][0] + parts[1][0]).toUpperCase();
      }
      return email.substring(0, 2).toUpperCase();
    }
    return 'PM'; 
  };
  
  const displayName = user?.firstName || user?.primaryEmailAddress?.emailAddress?.split('@')[0] || 'User';
  const displayEmail = user?.primaryEmailAddress?.emailAddress;

  return (
    <div className="flex min-h-screen bg-background font-mono">
      <SidebarProvider defaultOpen>
        <Sidebar collapsible="icon" variant="sidebar" side="left" className="border-r border-neutral-200">
          <SidebarHeader className="p-6 border-b border-neutral-200">
            <Logo />
          </SidebarHeader>
          <SidebarContent className="p-2">
            <SidebarMenu className="space-y-1">
              {navItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname.startsWith(item.href)} 
                    tooltip={item.label}
                    className="font-mono hover:bg-neutral-100 data-[active=true]:bg-black data-[active=true]:text-white rounded-md"
                  >
                    <Link href={item.href}>
                      <item.icon className="h-4 w-4" />
                      <span className="text-sm">{item.label}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
            
            {/* Open Source section at bottom */}
            <div className="mt-auto pt-6">
              <SidebarSeparator className="mb-4" />
              <div className="px-3 py-2">
                <p className="text-xs text-neutral-500 mb-2 font-mono">OPEN SOURCE</p>
                <a
                  href="https://github.com/outrevo/PlaneMail"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-xs text-neutral-600 hover:text-black transition-colors"
                >
                  <Github className="h-3 w-3" />
                  <span>View on GitHub</span>
                </a>
              </div>
            </div>
          </SidebarContent>
          
          <SidebarFooter className="p-4 border-t border-neutral-200">
            {!isLoaded ? (
               <div className="flex items-center gap-3">
                  <Skeleton className="h-8 w-8 rounded-full" />
                  <div className="group-data-[collapsible=icon]:hidden flex flex-col space-y-1">
                      <Skeleton className="h-3 w-20" />
                      <Skeleton className="h-2 w-28" />
                  </div>
              </div>
            ) : user ? (
              <div className="flex w-full items-center gap-3 group-data-[collapsible=icon]:justify-center">
                 <UserButton 
                  afterSignOutUrl="/"
                  appearance={{
                    elements: {
                      userButtonAvatarBox: "h-8 w-8",
                      userButtonTrigger: "focus:shadow-none focus-visible:ring-0 focus-visible:ring-offset-0",
                    }
                  }}
                />
                <div className="group-data-[collapsible=icon]:hidden flex flex-col">
                  <span className="text-sm font-medium text-neutral-900 truncate max-w-[120px]">{displayName}</span>
                  {displayEmail && <span className="text-xs text-neutral-500 truncate max-w-[150px]">{displayEmail}</span>}
                </div>
              </div>
            ) : null}
          </SidebarFooter>
        </Sidebar>
        
        <SidebarInset className="flex-1">
          <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b border-neutral-200 bg-white/95 px-6 backdrop-blur supports-[backdrop-filter]:bg-white/80 md:justify-end">
            <div className="md:hidden">
              <SidebarTrigger />
            </div>
            <div className="hidden md:block">
              {isLoaded && user && <UserButton afterSignOutUrl="/" />}
            </div>
          </header>
          <main className="flex-1 p-6 bg-neutral-50/50">{children}</main>
        </SidebarInset>
      </SidebarProvider>
    </div>
  );
}
