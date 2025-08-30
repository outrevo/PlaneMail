"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import React from "react";
import { useUser, UserButton } from "@clerk/nextjs";
import { useToast } from "@/hooks/use-toast";
import {
  LayoutDashboard,
  FileText,
  Users,
  Settings,
  Plug,
  Code2,
  CreditCard,
  Github,
  Mail,
} from "lucide-react";
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
} from "@/components/ui/sidebar";
import { Logo } from "@/components/icons/Logo";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { OrganizationSwitcher } from "@/components/organization/OrganizationSwitcher";
import { useUserInit } from "@/hooks/use-user-init";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/content", label: "Content", icon: FileText },
  { href: "/sequences", label: "Sequences", icon: Mail },
  { href: "/subscribers", label: "Subscribers", icon: Users },
  { href: "/integrations", label: "Integrations", icon: Plug },
  { href: "/billing", label: "Billing", icon: CreditCard },
  { href: "/docs/api", label: "API Docs", icon: Code2 },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { toast } = useToast();
  const { user, isLoaded } = useUser();
  
  // Initialize user in database when they first authenticate
  useUserInit();

  const getInitials = () => {
    if (!user) return "PM";
    const { firstName, lastName, primaryEmailAddress } = user;
    if (firstName && lastName) {
      return (firstName[0] + lastName[0]).toUpperCase();
    }
    if (firstName) {
      return firstName.substring(0, 2).toUpperCase();
    }
    if (primaryEmailAddress?.emailAddress) {
      const email = primaryEmailAddress.emailAddress;
      const parts = email.split("@")[0].split(/[._-]/);
      if (parts.length > 1 && parts[0] && parts[1]) {
        return (parts[0][0] + parts[1][0]).toUpperCase();
      }
      return email.substring(0, 2).toUpperCase();
    }
    return "PM";
  };

  const displayName =
    user?.firstName ||
    user?.primaryEmailAddress?.emailAddress?.split("@")[0] ||
    "User";
  const displayEmail = user?.primaryEmailAddress?.emailAddress;

  return (
    <div className="flex min-h-screen bg-card">
      <SidebarProvider defaultOpen>
        <Sidebar
          collapsible="icon"
          variant="sidebar"
          side="left"
          className="border-r border"
        >
          <SidebarHeader className="p-4 border-b border">
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
                    style={{ letterSpacing: "-0.01em" }}
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
                <p
                  className="text-xs text-muted-foreground mb-2 font-medium"
                  style={{ letterSpacing: "-0.01em" }}
                >
                  OPEN SOURCE
                </p>
                <a
                  href="https://github.com/outrevo/PlaneMail"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors duration-200"
                  style={{ letterSpacing: "-0.01em" }}
                >
                  <Github className="h-3 w-3" />
                  <span>View on GitHub</span>
                </a>
              </div>
            </div>
          </SidebarContent>

          <SidebarFooter className="p-4 border-t">
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <p
                  className="text-xs text-muted-foreground font-medium"
                  style={{ letterSpacing: "-0.01em" }}
                >
                  ORGANIZATION
                </p>
                <OrganizationSwitcher />
              </div>
            </div>
          </SidebarFooter>
        </Sidebar>

        <SidebarInset className="flex-1">
          <header className="sticky top-0 z-10 flex h-11 items-center justify-between border-b bg-background px-6">
            <div className="flex items-center gap-2 md:hidden">
              <SidebarTrigger />
            </div>
            <div className="flex items-center gap-2 md:hidden">
              <ThemeToggle />
              {isLoaded && user && <UserButton afterSignOutUrl="/" />}
            </div>
            <div className="hidden md:flex md:items-center md:gap-2 md:ml-auto">
              <ThemeToggle />
              {isLoaded && user && <UserButton afterSignOutUrl="/" />}
            </div>
          </header>
          <main>{children}</main>
        </SidebarInset>
      </SidebarProvider>
    </div>
  );
}
