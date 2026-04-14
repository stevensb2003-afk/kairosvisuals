'use client';

import React, { useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { formatDistanceToNow, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { useNotifications } from '@/hooks/useNotifications';
import type { AppNotification, NotificationType, NotificationPriority } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import {
  Bell, BellDot, CheckCheck, CreditCard, CheckCircle,
  AlertTriangle, ClipboardList, Send, BarChart2, Info,
  ChevronRight, Loader2, BellOff, Trash2, Archive, X
} from 'lucide-react';

// ── Helpers de icono y color por tipo ────────────────────────────────────────

const TYPE_META: Record<NotificationType, {
  icon: React.ReactNode;
  color: string;
  bg: string;
}> = {
  payment_reported: {
    icon: <CreditCard className="w-4 h-4" />,
    color: 'text-violet-500',
    bg: 'bg-violet-500/10',
  },
  payment_confirmed: {
    icon: <CheckCircle className="w-4 h-4" />,
    color: 'text-emerald-500',
    bg: 'bg-emerald-500/10',
  },
  payment_overdue: {
    icon: <AlertTriangle className="w-4 h-4" />,
    color: 'text-red-500',
    bg: 'bg-red-500/10',
  },
  task_done: {
    icon: <CheckCircle className="w-4 h-4" />,
    color: 'text-emerald-500',
    bg: 'bg-emerald-500/10',
  },
  task_critical: {
    icon: <AlertTriangle className="w-4 h-4" />,
    color: 'text-orange-500',
    bg: 'bg-orange-500/10',
  },
  task_assigned: {
    icon: <ClipboardList className="w-4 h-4" />,
    color: 'text-blue-500',
    bg: 'bg-blue-500/10',
  },
  invoice_sent: {
    icon: <Send className="w-4 h-4" />,
    color: 'text-sky-500',
    bg: 'bg-sky-500/10',
  },
  plan_limit_reached: {
    icon: <BarChart2 className="w-4 h-4" />,
    color: 'text-amber-500',
    bg: 'bg-amber-500/10',
  },
  system: {
    icon: <Info className="w-4 h-4" />,
    color: 'text-muted-foreground',
    bg: 'bg-muted',
  },
  general: {
    icon: <Info className="w-4 h-4" />,
    color: 'text-muted-foreground',
    bg: 'bg-muted',
  },
};

const PRIORITY_DOT: Record<NotificationPriority, string> = {
  low:      'bg-slate-400',
  medium:   'bg-blue-500',
  high:     'bg-amber-500',
  critical: 'bg-red-500',
};

// ── NotificationItem ──────────────────────────────────────────────────────────

interface NotificationItemProps {
  notification: AppNotification;
  onRead: (id: string) => void;
  onArchive: (id: string) => void;
  onClick: (n: AppNotification) => void;
}

function NotificationItem({ notification: n, onRead, onArchive, onClick }: NotificationItemProps) {
  const meta = TYPE_META[n.type] || TYPE_META.system;
  const timeAgo = (() => {
    try {
      return formatDistanceToNow(parseISO(n.createdAt), { addSuffix: true, locale: es });
    } catch {
      return '';
    }
  })();

  return (
    <div className="group relative overflow-hidden transition-all duration-200">
      <button
        className={cn(
          'w-full flex items-start gap-3 px-4 py-4 text-left transition-all',
          'hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring',
          !n.read && 'bg-primary/[0.03]'
        )}
        onClick={() => onClick(n)}
      >
        {/* Ícono de tipo */}
        <div className={cn('flex-shrink-0 mt-0.5 w-9 h-9 rounded-xl shadow-sm flex items-center justify-center transition-transform group-hover:scale-110', meta.bg, meta.color)}>
          {meta.icon}
        </div>

        {/* Contenido */}
        <div className="flex-1 min-w-0 pr-6">
          <div className="flex items-center justify-between gap-2">
            <p className={cn('text-[13px] font-bold leading-tight truncate tracking-tight', !n.read ? 'text-foreground' : 'text-muted-foreground')}>
              {n.title}
            </p>
            {/* Priority dot + unread indicator */}
            <div className="flex items-center gap-1.5 flex-shrink-0">
              <div className={cn('w-1.5 h-1.5 rounded-full', PRIORITY_DOT[n.priority])} title={`Priority: ${n.priority}`} />
              {!n.read && <div className="w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_8px_rgba(var(--primary),0.6)] animate-pulse" />}
            </div>
          </div>
          <p className="text-xs text-muted-foreground/90 mt-1 line-clamp-2 leading-relaxed font-medium">
            {n.message}
          </p>
          <p className="text-[10px] text-muted-foreground/50 mt-1.5 font-semibold uppercase tracking-wider tabular-nums">{timeAgo}</p>
        </div>
      </button>

      {/* Botones de acción lateral (Hover) */}
      <div className="absolute right-2 top-1/2 -translate-y-1/2 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-all duration-200 translate-x-2 group-hover:translate-x-0">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 rounded-full bg-background/80 backdrop-blur-sm border shadow-sm hover:text-destructive hover:bg-destructive/10"
          onClick={(e) => {
            e.stopPropagation();
            onArchive(n.id);
          }}
          title="Archivar"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </Button>
      </div>
    </div>
  );
}

// ── NotificationCenter ────────────────────────────────────────────────────────

export function NotificationCenter() {
  const { notifications, unreadCount, isLoading, markRead, markAllRead, archive, archiveAll } = useNotifications();
  const [open, setOpen] = React.useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Cerrar al hacer clic fuera
  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  // Cerrar con Escape
  useEffect(() => {
    if (!open) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [open]);

  const handleNotificationClick = async (n: AppNotification) => {
    if (!n.read) await markRead(n.id);
    if (n.actionUrl) {
      router.push(n.actionUrl);
      setOpen(false);
    }
  };

  const unread = notifications.filter(n => !n.read);
  const read   = notifications.filter(n => n.read);

  return (
    <div className="relative" ref={panelRef}>
      {/* Botón campana */}
      <button
        id="notification-bell-btn"
        aria-label={`Notificaciones${unreadCount > 0 ? ` (${unreadCount} sin leer)` : ''}`}
        aria-expanded={open}
        onClick={() => setOpen(v => !v)}
        className={cn(
          'relative flex items-center justify-center w-10 h-10 rounded-xl transition-all duration-300',
          'hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
          open ? 'bg-muted shadow-inner scale-95' : 'bg-transparent',
        )}
      >
        {unreadCount > 0
          ? <BellDot className="w-5 h-5 text-primary drop-shadow-[0_0_10px_rgba(var(--primary),0.3)] animate-[wiggle_1s_ease-in-out_infinite]" />
          : <Bell className="w-5 h-5 text-muted-foreground/70" />}

        {/* Badge contador */}
        {unreadCount > 0 && (
          <span className={cn(
            'absolute -top-1 -right-1 min-w-[18px] h-[18px] rounded-full border-2 border-background',
            'flex items-center justify-center text-[9px] font-black text-white px-1 shadow-lg',
            unreadCount > 0 && 'bg-destructive animate-in zoom-in-50 duration-300',
          )}>
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Panel de notificaciones */}
      {open && (
        <div
          className={cn(
            'absolute right-0 top-14 z-50 w-[400px] rounded-2xl border border-border/40',
            'bg-background/80 backdrop-blur-2xl shadow-[0_20px_50px_rgba(0,0,0,0.2)]',
            'animate-in slide-in-from-top-4 fade-in-0 duration-300 ease-out fill-mode-forwards',
          )}
          role="dialog"
          aria-label="Panel de Notificaciones"
        >
          {/* Header del panel */}
          <div className="flex flex-col gap-1 px-5 py-4 border-b border-border/40">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="bg-primary/10 p-1.5 rounded-lg">
                  <Bell className="w-4 h-4 text-primary" />
                </div>
                <h2 className="font-bold text-base tracking-tight">Notificaciones</h2>
                {unreadCount > 0 && (
                  <Badge variant="secondary" className="bg-primary/10 text-primary border-none text-[10px] h-5 font-black uppercase tracking-wider">
                    {unreadCount} nuevas
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-1">
                 {notifications.length > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-[11px] h-8 px-2.5 font-bold text-muted-foreground hover:text-destructive hover:bg-destructive/5 transition-colors"
                      onClick={archiveAll}
                      title="Archivar todas"
                    >
                      <Archive className="w-3.5 h-3.5 mr-1.5" />
                      Limpiar
                    </Button>
                 )}
                 <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 rounded-full text-muted-foreground/50 hover:text-foreground"
                    onClick={() => setOpen(false)}
                 >
                    <X className="w-4 h-4" />
                 </Button>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between px-5 py-2 bg-muted/20 border-b border-border/20">
             <span className="text-[10px] font-black text-muted-foreground/60 uppercase tracking-[0.1em]">Bandeja de Entrada</span>
             {unreadCount > 0 && (
                <button 
                  className="text-[10px] font-black text-primary uppercase tracking-[0.1em] hover:underline"
                  onClick={markAllRead}
                >
                  Marcar leídas
                </button>
             )}
          </div>

          {/* Lista de notificaciones */}
          <ScrollArea className="max-h-[500px]">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-20 gap-3">
                <Loader2 className="w-6 h-6 animate-spin text-primary/50" />
                <p className="text-xs font-bold text-muted-foreground/50 uppercase tracking-widest">Sincronizando...</p>
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 gap-4 text-center px-8">
                <div className="w-16 h-16 bg-muted/30 rounded-full flex items-center justify-center relative scale-110">
                   <BellOff className="w-8 h-8 text-muted-foreground/20" />
                   <div className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500/20 rounded-full flex items-center justify-center">
                      <CheckCircle className="w-3 h-3 text-emerald-500/50" />
                   </div>
                </div>
                <div>
                  <h3 className="font-bold text-sm text-foreground">Estás al día</h3>
                  <p className="text-xs text-muted-foreground mt-1 font-medium leading-relaxed">
                    No tienes notificaciones pendientes.<br/>¡Todo fluye perfectamente!
                  </p>
                </div>
              </div>
            ) : (
              <div className="divide-y divide-border/20">
                {notifications.map(n => (
                  <NotificationItem
                    key={n.id}
                    notification={n}
                    onRead={markRead}
                    onArchive={archive}
                    onClick={handleNotificationClick}
                  />
                ))}
              </div>
            )}
          </ScrollArea>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="border-t border-border/40 px-5 py-4 bg-muted/5 rounded-b-2xl">
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-bold text-muted-foreground/40 uppercase tracking-widest">
                  Centro de Control Kairos
                </p>
                <div className="flex items-center gap-1.5 opacity-40">
                   <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                   <span className="text-[10px] font-bold text-muted-foreground uppercase">Live</span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
