
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
    <SidebarProvider defaultOpen>
      <Sidebar collapsible="icon" variant="sidebar" side="left">
        <SidebarHeader className="p-4">
          <Logo />
        </SidebarHeader>
        <SidebarContent>
          <SidebarMenu className="p-2">
            {navItems.map((item) => (
              <SidebarMenuItem key={item.href}>
                <SidebarMenuButton
                  asChild
                  isActive={pathname.startsWith(item.href)} 
                  tooltip={item.label}
                >
                  <Link href={item.href}>
                    <item.icon />
                    <span>{item.label}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarContent>
        <SidebarSeparator />
        <SidebarFooter className="p-2">
          {!isLoaded ? (
             <div className="flex items-center gap-2 p-2">
                <Skeleton className="h-8 w-8 rounded-full" />
                <div className="group-data-[collapsible=icon]:hidden flex flex-col items-start space-y-1">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-3 w-28" />
                </div>
            </div>
          ) : user ? (
            <div className="flex w-full items-center justify-start gap-2 p-1 group-data-[collapsible=icon]:p-0 group-data-[collapsible=icon]:justify-center">
               <UserButton 
                afterSignOutUrl="/"
                appearance={{
                  elements: {
                    userButtonAvatarBox: "h-8 w-8",
                    userButtonTrigger: "focus:shadow-none focus-visible:ring-0 focus-visible:ring-offset-0",
                  }
                }}
              />
              <div className="group-data-[collapsible=icon]:hidden flex flex-col items-start -ml-1">
                <span className="text-sm font-medium truncate max-w-[120px]">{displayName}</span>
                {displayEmail && <span className="text-xs text-muted-foreground truncate max-w-[150px]">{displayEmail}</span>}
              </div>
            </div>
          ) : null}
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <header className="sticky top-0 z-10 flex h-14 items-center justify-between border-b bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/60 md:justify-end">
          <div className="md:hidden">
            <SidebarTrigger />
          </div>
          <div className="hidden md:block">
            {isLoaded && user && <UserButton afterSignOutUrl="/" />}
          </div>
        </header>
        <main className="flex-1 p-4 md:p-6 lg:p-8">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
