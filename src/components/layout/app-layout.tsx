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
  BarChart2,
  List,
  LayoutGrid,
  Settings,
  CreditCard,
  Infinity,
  Kanban,
} from 'lucide-react';
import React from 'react';

const navItems = [
  { href: '/', label: 'Home', icon: LayoutGrid },
  { href: '/calendar', label: 'Calendario', icon: Calendar },
  { href: '/quotations', label: 'Cotizaciones', icon: FileText },
  { href: '/invoicing', label: 'Facturador', icon: Receipt },
  { href: '/clients', label: 'Clientes', icon: Users },
  { href: '/reports', label: 'Reportes', icon: BarChart2 },
  { href: '/backlog', label: 'Backlog', icon: List },
  { href: '/kanban', label: 'Kanban', icon: Kanban },
  { href: '/expenses', label: 'Gastos y Créditos', icon: CreditCard },
];

const settingsNav = { href: '/settings', label: 'Configuraciones', icon: Settings };

export function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const getPageTitle = () => {
    if (pathname === settingsNav.href) {
      return settingsNav.label;
    }
    const currentNav = navItems.find(item => item.href === pathname);
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
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <header className="sticky top-0 z-10 flex h-14 items-center gap-4 border-b bg-background/80 px-4 backdrop-blur-sm sm:h-16 sm:px-6 md:px-8">
            <SidebarTrigger className="md:hidden" />
            <h1 className="text-lg font-semibold md:text-xl font-headline">
              {getPageTitle()}
            </h1>
        </header>
        <main className="flex-1 p-4 sm:p-6 md:p-8">
            {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
