
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import React from 'react';
import { useUser, UserButton } from '@clerk/nextjs';
import { useToast } from '@/hooks/use-toast';
import {
  LayoutDashboard,
  FileText,
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
  { href: '/posts', label: 'Posts', icon: FileText },
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
    <div className="flex min-h-screen bg-white">
      <SidebarProvider defaultOpen>
        <Sidebar collapsible="icon" variant="sidebar" side="left" className="border-r border-gray-200">
          <SidebarHeader className="p-4 border-b border-gray-200">
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
                    className="hover:bg-gray-100 data-[active=true]:bg-black data-[active=true]:text-white rounded-lg transition-colors duration-200"
                    style={{letterSpacing: '-0.01em'}}
                  >
                    <Link href={item.href}>
                      <item.icon className="h-4 w-4" />
                      <span className="text-sm font-medium">{item.label}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
            
            {/* Open Source section at bottom */}
            <div className="mt-auto pt-6">
              <SidebarSeparator className="mb-4" />
              <div className="px-3 py-2">
                <p className="text-xs text-gray-500 mb-2 font-medium" style={{letterSpacing: '-0.01em'}}>OPEN SOURCE</p>
                <a
                  href="https://github.com/outrevo/PlaneMail"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-xs text-gray-600 hover:text-black transition-colors duration-200"
                  style={{letterSpacing: '-0.01em'}}
                >
                  <Github className="h-3 w-3" />
                  <span>View on GitHub</span>
                </a>
              </div>
            </div>
          </SidebarContent>
          
          <SidebarFooter className="p-4 border-t border-gray-200">
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
                  <span className="text-sm font-medium text-black truncate max-w-[120px]" style={{letterSpacing: '-0.01em'}}>{displayName}</span>
                  {displayEmail && <span className="text-xs text-gray-500 truncate max-w-[150px]">{displayEmail}</span>}
                </div>
              </div>
            ) : null}
          </SidebarFooter>
        </Sidebar>
        
        <SidebarInset className="flex-1">
          <header className="sticky top-0 z-10 flex h-11 items-center justify-between border-b border-gray-200 bg-white px-6 md:justify-end">
            <div className="md:hidden">
              <SidebarTrigger />
            </div>
            <div className="hidden md:block">
              {isLoaded && user && <UserButton afterSignOutUrl="/" />}
            </div>
          </header>
          <main className="flex-1 p-6 bg-gray-50">{children}</main>
        </SidebarInset>
      </SidebarProvider>
    </div>
  );
}
