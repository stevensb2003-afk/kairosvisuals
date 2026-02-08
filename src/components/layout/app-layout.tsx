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
import { usePathname, useRouter } from 'next/navigation';
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
  LogOut,
} from 'lucide-react';
import React, { useEffect } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { useAuth, useUser } from '@/firebase';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

const navItems = [
  { href: '/', label: 'Home', icon: LayoutGrid },
  { href: '/kanban', label: 'Kanban', icon: Kanban },
  { href: '/calendar', label: 'Calendar', icon: Calendar },
  { href: '/quotations', label: 'Quotes', icon: FileText },
  { href: '/invoicing', label: 'Billing', icon: Receipt },
  { href: '/clients', label: 'Clients', icon: Users },
];

const settingsNav = { href: '/settings', label: 'Settings', icon: Settings };

const publicRoutes = ['/login', '/register'];

export function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isUserLoading } = useUser();
  const auth = useAuth();

  useEffect(() => {
    if (isUserLoading) return; // Wait until user state is determined

    const isPublicRoute = publicRoutes.includes(pathname);

    if (!user && !isPublicRoute) {
      router.push('/login');
    } else if (user && isPublicRoute) {
      router.push('/');
    }
  }, [user, isUserLoading, pathname, router]);

  const handleSignOut = async () => {
    if (auth) {
        await auth.signOut();
        router.push('/login');
    }
  };

  const getPageTitle = () => {
    if (pathname === '/') return 'Control Tower';
    if (pathname.startsWith('/settings')) return 'Settings';
    const currentNav = navItems.find(item => {
        if (item.href === '/') return false;
        return pathname.startsWith(item.href);
    });
    return currentNav ? currentNav.label : '';
  };

  const pageTitle = getPageTitle();
  
  // Don't render layout for public routes or while loading
  if (publicRoutes.includes(pathname) || isUserLoading) {
      return <main className="flex-1">{children}</main>;
  }


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
                  isActive={pathname.startsWith(settingsNav.href)}
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
             <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <div className="flex items-center gap-3 p-2 rounded-md cursor-pointer hover:bg-sidebar-accent">
                        <Avatar className="h-9 w-9">
                            <AvatarImage src={user?.photoURL || "https://picsum.photos/seed/user/40/40"} alt={user?.displayName || 'User'} />
                            <AvatarFallback>{user?.displayName?.split(' ').map(n => n[0]).join('') || 'U'}</AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col group-data-[collapsible=icon]:hidden overflow-hidden">
                            <span className="font-medium text-sm text-sidebar-foreground truncate">{user?.displayName || 'Usuario'}</span>
                            <span className="text-xs text-sidebar-foreground/70 truncate">{user?.email}</span>
                        </div>
                    </div>
                </DropdownMenuTrigger>
                <DropdownMenuContent side="right" align="end" className="w-56">
                    <DropdownMenuLabel>Mi Cuenta</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleSignOut}>
                        <LogOut className="mr-2 h-4 w-4" />
                        <span>Cerrar Sesión</span>
                    </DropdownMenuItem>
                </DropdownMenuContent>
             </DropdownMenu>
          </div>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        {pageTitle ? (
          <header className="sticky top-0 z-10 flex h-20 items-center gap-4 border-b bg-background/95 px-4 backdrop-blur-sm sm:px-6 md:px-8">
              <SidebarTrigger className="md:hidden" />
              <div className="flex-1">
                  <h1 className="text-2xl font-bold font-headline">
                      {pageTitle}
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
        ) : null}
        <main className="flex-1 p-4 sm:p-6 md:p-8">
            {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
