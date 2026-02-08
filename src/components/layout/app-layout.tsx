'use client';
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarTrigger,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarInset,
} from '@/components/ui/sidebar';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Calendar,
  FileText,
  Receipt,
  Users,
  LayoutGrid,
  Settings,
  Infinity,
  Kanban,
  RefreshCw,
  Plus,
} from 'lucide-react';
import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';

const navItems = [
  { href: '/', label: 'Home', icon: LayoutGrid },
  { href: '/kanban', label: 'Kanban', icon: Kanban },
  { href: '/calendar', label: 'Calendar', icon: Calendar },
  { href: '/quotations', label: 'Quotes', icon: FileText },
  { href: '/invoicing', label: 'Billing', icon: Receipt },
  { href: '/clients', label: 'Clients', icon: Users },
];

const settingsNav = { href: '/settings', label: 'Settings', icon: Settings };

export function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const getPageTitle = () => {
    if (pathname === '/') return 'Control Tower';
    if (pathname.startsWith(settingsNav.href)) {
      return settingsNav.label;
    }
    const currentNav = navItems.find(item => {
        if (item.href === '/') return false;
        return pathname.startsWith(item.href);
    });
    return currentNav ? currentNav.label : 'Kairos Visuals';
  };

  return (
    <SidebarProvider>
      <Sidebar collapsible="icon">
        <SidebarHeader>
          <Link href="/" className="flex items-start gap-1 p-2 flex-col" aria-label="Kairos Visuals Home">
            <div className="flex items-center gap-2">
              <Infinity className="w-7 h-7 text-sidebar-foreground" />
              <span className="text-lg font-headline font-bold text-sidebar-foreground group-data-[collapsible=icon]:hidden">Kairos Visuals</span>
            </div>
            <span className="text-xs text-sidebar-foreground/70 group-data-[collapsible=icon]:hidden pl-[36px]">INTERNAL OS V2.4</span>
          </Link>
        </SidebarHeader>
        <SidebarContent>
          <SidebarMenu>
            {navItems.map((item) => (
              <SidebarMenuItem key={item.href}>
                <Link href={item.href} passHref>
                  <SidebarMenuButton
                    isActive={pathname === item.href}
                    tooltip={item.label}
                  >
                    <item.icon />
                    <span>{item.label}</span>
                  </SidebarMenuButton>
                </Link>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarContent>
        <SidebarFooter>
           <SidebarMenu>
            <SidebarMenuItem>
              <Link href={settingsNav.href} passHref>
                <SidebarMenuButton
                  isActive={pathname === settingsNav.href}
                  tooltip={settingsNav.label}
                >
                  <settingsNav.icon />
                  <span>{settingsNav.label}</span>
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
          </SidebarMenu>
          <Separator className="my-1 bg-sidebar-border/50" />
          <div className="p-2">
            <div className="flex items-center gap-3 p-2">
                <Avatar className="h-9 w-9">
                    <AvatarImage src="https://picsum.photos/seed/alex/40/40" alt="Alex Chen" />
                    <AvatarFallback>AC</AvatarFallback>
                </Avatar>
                <div className="flex flex-col group-data-[collapsible=icon]:hidden">
                    <span className="font-medium text-sm text-sidebar-foreground">Alex Chen</span>
                    <span className="text-xs text-sidebar-foreground/70">Head of Post-Prod</span>
                </div>
            </div>
          </div>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <header className="sticky top-0 z-10 flex h-20 items-center gap-4 border-b bg-background/95 px-4 backdrop-blur-sm sm:px-6 md:px-8">
            <SidebarTrigger className="md:hidden" />
            <div className="flex-1">
                <h1 className="text-2xl font-bold font-headline">
                    {getPageTitle()}
                </h1>
                {pathname === '/' && <p className="text-sm text-muted-foreground">Overview of current production metrics and critical paths.</p>}
            </div>
            {pathname === '/' && (
                <div className="hidden md:flex items-center gap-2">
                    <Button variant="outline"><RefreshCw className="mr-2"/> Refresh Data</Button>
                    <Button><Plus className="mr-2"/> New Project</Button>
                </div>
            )}
        </header>
        <main className="flex-1 p-4 sm:p-6 md:p-8">
            {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
