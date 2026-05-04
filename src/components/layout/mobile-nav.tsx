'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutGrid, Inbox, Users, Receipt, Palette } from 'lucide-react';
import { cn } from '@/lib/utils';

const mobileNavItems = [
  { href: '/', label: 'Inicio', icon: LayoutGrid },
  { href: '/requests', label: 'Briefings', icon: Inbox },
  { href: '/clients', label: 'Clientes', icon: Users },
  { href: '/invoicing', label: 'Facturas', icon: Receipt },
  { href: '/creative-suite', label: 'Creativa', icon: Palette },
];

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 md:hidden"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="border-t border-border/60 bg-background/95 backdrop-blur-xl shadow-2xl">
        <div className="flex items-stretch">
          {mobileNavItems.map((item) => {
            const isActive =
              item.href === '/'
                ? pathname === '/'
                : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex flex-1 flex-col items-center justify-center gap-1 py-2.5 px-1 transition-colors duration-150 relative',
                  isActive
                    ? 'text-primary'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                {isActive && (
                  <span className="absolute top-0 left-1/2 -translate-x-1/2 h-0.5 w-8 rounded-full bg-primary" />
                )}
                <item.icon
                  className={cn(
                    'w-5 h-5 transition-transform duration-150',
                    isActive && 'scale-110'
                  )}
                  strokeWidth={isActive ? 2.5 : 2}
                />
                <span
                  className={cn(
                    'text-[10px] font-semibold tracking-wide leading-none',
                    isActive && 'font-bold'
                  )}
                >
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
