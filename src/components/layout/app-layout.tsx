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
  FileText,
  Receipt,
  Users,
  LayoutGrid,
  Settings,
  Inbox,
  Package,
  RefreshCw,
  LogOut,
  Loader2,
  Zap,
  X,
  Wallet,
  Palette,
  Sparkles,
  ImageIcon,
  Wand2,
  ArrowLeft,
  BookOpen,
  PenLine,
} from 'lucide-react';
import React, { useEffect, useState, useCallback } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/ui/logo';
import { useAuth, useUser } from '@/firebase';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { NotificationCenter } from '@/components/notifications/NotificationCenter';

const navItems = [
  { href: '/', label: 'Inicio', icon: LayoutGrid, roles: ['Administrador', 'Administrativo', 'Editor', 'Visualizador', 'Creativo'] },
  { href: '/requests', label: 'Inbox (Briefings)', icon: Inbox, roles: ['Administrador', 'Administrativo', 'Creativo'] },
  { href: '/clients', label: 'Clientes', icon: Users, roles: ['Administrador', 'Administrativo', 'Creativo'] },
  { href: '/solicitudes', label: 'Propuestas', icon: FileText, roles: ['Administrador', 'Administrativo', 'Creativo'] },
  { href: '/invoicing', label: 'Facturación', icon: Receipt, roles: ['Administrador', 'Administrativo', 'Creativo'] },
  { href: '/invoicing/recurring', label: 'Cobro Recurrente', icon: RefreshCw, roles: ['Administrador', 'Administrativo', 'Creativo'] },
  { href: '/services', label: 'Servicios', icon: Package, roles: ['Administrador', 'Administrativo', 'Creativo'] },
  { href: '/finance', label: 'Gestión Financiera', icon: Wallet, roles: ['Administrador', 'Administrativo', 'Creativo'] },
];

const creativeNavItems = [
  { href: '/creative-suite', label: 'Creative Hub', icon: Sparkles, roles: ['Administrador', 'Administrativo', 'Creativo', 'Editor'] },
  { href: '/creative-suite/brand-books', label: 'Brand Books', icon: BookOpen, roles: ['Administrador', 'Administrativo', 'Creativo', 'Editor'] },
  { href: '/creative-suite/copywriting', label: 'Copywriting', icon: PenLine, roles: ['Administrador', 'Administrativo', 'Creativo', 'Editor'] },
  { href: '/creative-suite/content-studio', label: 'Content Studio', icon: Wand2, roles: ['Administrador', 'Administrativo', 'Creativo', 'Editor'] },
];

const settingsNav = { href: '/settings', label: 'Settings', icon: Settings };

const publicRoutes = [
  '/login', 
  '/register', 
  '/solicitud', // Public link for leads
];

export function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isCreativeSuite = pathname.startsWith('/creative-suite');
  const router = useRouter();
  const { user, userData, isUserLoading } = useUser();
  const auth = useAuth();

  const isPublicRoute = publicRoutes.includes(pathname);

  // --- Billing Dismissal Logic (Hooks at top level) ---
  const [isBillingDismissed, setIsBillingDismissed] = useState(true);

  const handleDismissBilling = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const today = new Date();
    const day = today.getDate();
    const season = day >= 13 && day <= 15 ? '15' : '30';
    const month = today.getMonth() + 1;
    const key = `billing-dismissed-${today.getFullYear()}-${month}-${season}`;
    localStorage.setItem(key, 'true');
    setIsBillingDismissed(true);
  }, []);

  useEffect(() => {
    const today = new Date();
    const day = today.getDate();
    const isSeason15 = day >= 13 && day <= 15;
    const isSeason30 = day >= 28 && day <= 30;
    
    if (isSeason15 || isSeason30) {
      const season = isSeason15 ? '15' : '30';
      const month = today.getMonth() + 1;
      const key = `billing-dismissed-${today.getFullYear()}-${month}-${season}`;
      const dismissed = localStorage.getItem(key);
      setIsBillingDismissed(!!dismissed);
    } else {
      setIsBillingDismissed(false);
    }
  }, []);

  // --- Auth / Routing Logic ---
  useEffect(() => {
    if (isUserLoading) return;

    if (!user && !isPublicRoute) {
      router.push('/login');
    } else if (user && publicRoutes.includes(pathname)) {
      if (userData === null) {
          if (pathname !== '/register') {
              router.push('/register');
          }
      } else {
        router.push('/');
      }
    }
  }, [user, userData, isUserLoading, pathname, router, isPublicRoute]);

  const handleSignOut = async () => {
    if (auth) {
        await auth.signOut();
        router.push('/login');
    }
  };

  const getPageTitle = () => {
    if (pathname === '/') return 'TORRE DE CONTROL';
    if (pathname.startsWith('/settings')) return 'Settings';
    if (isCreativeSuite) {
      const currentCreativeNav = creativeNavItems.find(item => {
        if (item.href === '/creative-suite') return pathname === '/creative-suite';
        return pathname.startsWith(item.href);
      });
      return currentCreativeNav ? currentCreativeNav.label : 'Suite Creativa';
    }
    const currentNav = navItems.find(item => {
        if (item.href === '/') return false;
        return pathname.startsWith(item.href);
    });
    return currentNav ? currentNav.label : '';
  };

  const pageTitle = getPageTitle();
  
  // --- Early Returns (AFTER all hooks) ---
  if (isPublicRoute) {
      return <main className="flex-1">{children}</main>;
  }

  if (isUserLoading || !userData) {
      return (
          <div className="flex bg-background h-screen w-full flex-col items-center justify-center gap-4">
              <Loader2 className="h-8 w-8 animate-spin text-primary opacity-50" />
              <p className="text-sm text-muted-foreground animate-pulse font-medium">Cargando...</p>
          </div>
      );
  }

  const today = new Date();
  const day = today.getDate();
  const isNearBilling = (day >= 13 && day <= 15) || (day >= 28 && day <= 30);
  const billingSeason = (day >= 13 && day <= 15) ? 'del 15' : 'del 30';

  return (
    <SidebarProvider>
      <Sidebar collapsible="icon">
        <SidebarHeader>
          {isCreativeSuite ? (
            <div className="flex items-start gap-1 p-2 flex-col">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-md bg-primary/20 flex items-center justify-center flex-shrink-0">
                  <Palette className="w-4 h-4 text-primary" />
                </div>
                <span className="text-lg font-headline font-bold text-sidebar-foreground group-data-[collapsible=icon]:hidden">Suite Creativa</span>
              </div>
              <span className="text-xs text-primary/80 group-data-[collapsible=icon]:hidden pl-[36px] font-medium uppercase tracking-wider">Creative OS</span>
            </div>
          ) : (
            <Link href="/" className="flex items-start gap-1 p-2 flex-col" aria-label="Kairos Visuals Home">
              <div className="flex items-center gap-2">
                <Logo className="w-7 h-7 text-sidebar-foreground" />
                <span className="text-lg font-headline font-bold text-sidebar-foreground group-data-[collapsible=icon]:hidden">Kairos Visuals</span>
              </div>
              <span className="text-xs text-sidebar-foreground/70 group-data-[collapsible=icon]:hidden pl-[36px]">INTERNAL OS V2.4</span>
            </Link>
          )}
        </SidebarHeader>
        <SidebarContent>
          {isCreativeSuite ? (
            <SidebarMenu>
              {creativeNavItems
                .filter(item => !item.roles || item.roles.includes(userData?.role))
                .map((item) => (
                <SidebarMenuItem key={item.href}>
                  <Link href={item.href} passHref>
                    <SidebarMenuButton
                      isActive={item.href === '/creative-suite' ? pathname === '/creative-suite' : pathname.startsWith(item.href)}
                      tooltip={item.label}
                    >
                      <item.icon />
                      <span>{item.label}</span>
                    </SidebarMenuButton>
                  </Link>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          ) : (
            <SidebarMenu>
              {navItems
                .filter(item => !item.roles || item.roles.includes(userData?.role))
                .map((item) => (
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
          )}
        </SidebarContent>
        <SidebarFooter>
          {isCreativeSuite ? (
            <SidebarMenu>
              <SidebarMenuItem className="px-2 pb-2">
                <Link href="/" passHref>
                  <SidebarMenuButton
                    className="border border-sidebar-border hover:bg-sidebar-accent h-12 transition-all font-semibold text-sidebar-foreground/80"
                    tooltip="Volver a Suite Administrativa"
                  >
                    <ArrowLeft className="w-5 h-5" />
                    <span>Suite Administrativa</span>
                  </SidebarMenuButton>
                </Link>
              </SidebarMenuItem>
            </SidebarMenu>
          ) : (
            <>
              <SidebarMenu>
                <SidebarMenuItem className="px-2 pb-2">
                  <Link href="/creative-suite" passHref>
                    <SidebarMenuButton
                      isActive={pathname.startsWith('/creative-suite')}
                      className="bg-primary text-primary-foreground hover:bg-primary/90 h-12 shadow-md transition-all font-bold"
                      tooltip="Suite creativa"
                    >
                      <Palette className="w-5 h-5" />
                      <span>Suite creativa</span>
                    </SidebarMenuButton>
                  </Link>
                </SidebarMenuItem>
              </SidebarMenu>
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
            </>
          )}
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
      <SidebarInset className="h-screen overflow-hidden flex flex-col">
        {pageTitle ? (
          <header className="sticky top-0 z-50 flex h-20 shrink-0 items-center gap-4 border-b bg-background/95 px-4 backdrop-blur-sm sm:px-6 md:px-8">
              <SidebarTrigger className="md:hidden" />
              <div className="flex-1">
                  <h1 className="text-2xl font-bold font-headline">
                      {pageTitle}
                  </h1>
                  {isNearBilling && !isBillingDismissed && (
                    <div className="hidden lg:flex items-center gap-1">
                      <Link 
                        href="/invoicing/recurring" 
                        className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 px-3 py-1 rounded-full text-[10px] font-black uppercase text-amber-600 hover:bg-amber-500/20 transition-all cursor-pointer"
                      >
                        <Zap className="w-3 h-3" /> Tienes facturas de planes {billingSeason} listas para enviar
                      </Link>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-6 w-6 rounded-full hover:bg-amber-100 text-amber-600" 
                        onClick={handleDismissBilling}
                        title="Descartar aviso"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  )}
                  {pathname === '/' && <p className="text-sm text-muted-foreground">Visión general de las métricas de producción y rutas críticas actuales.</p>}
              </div>
              {/* Notification Center — visible en todas las páginas internas */}
              <NotificationCenter />
          </header>
        ) : null}
        <main className={`flex-1 min-h-0 overflow-hidden ${isCreativeSuite ? '' : 'p-4 sm:p-6 md:p-8 overflow-y-auto'}`}>
            {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
