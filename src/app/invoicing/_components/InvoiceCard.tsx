'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowRight, RefreshCw } from 'lucide-react';
import { formatCurrency, cn } from '@/lib/utils';
import { format, parseISO } from 'date-fns';
import { STATUS_CONFIG } from '../_utils/status';

interface InvoiceCardProps {
  inv: any;
  client: any;
}

export function InvoiceCard({ inv, client }: InvoiceCardProps) {
  const router = useRouter();
  const cfg = STATUS_CONFIG[inv.status] || STATUS_CONFIG.draft;
  const balanceDue = Math.max(0, (inv.totalAmount || 0) - (inv.amountPaid || 0));

  return (
    <div className="p-4 space-y-3 hover:bg-primary/[0.02] active:bg-primary/[0.04] transition-colors">
      {/* Row 1: # + Status + Date */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className="font-bold text-primary text-xs font-mono tracking-wider shrink-0">
            {inv.invoiceNumber || '—'}
          </span>
          {inv.isPlanInvoice && (
            <Badge variant="secondary" className="px-1.5 py-0 text-[9px] uppercase bg-amber-500/10 text-amber-600 border-amber-500/20 shrink-0">
              <RefreshCw className="w-2.5 h-2.5 mr-0.5" />Ciclo
            </Badge>
          )}
          <Badge variant="outline" className={cn('gap-1 text-[10px] font-bold uppercase tracking-wider shrink-0', cfg.color)}>
            {cfg.icon}
            {cfg.label}
          </Badge>
        </div>
        <span className="text-xs text-muted-foreground shrink-0">
          {inv.createdAt ? format(parseISO(inv.createdAt), 'dd/MM/yy') : '—'}
        </span>
      </div>

      {/* Row 2: Client */}
      <div>
        <p className="font-bold text-sm text-foreground leading-snug">
          {client?.clientName || 'Cliente desconocido'}
        </p>
        {client?.company && (
          <p className="text-xs text-muted-foreground mt-0.5">{client.company}</p>
        )}
      </div>

      {/* Row 3: Amount + Balance */}
      <div className="flex items-end justify-between">
        <span className="text-2xl font-black text-primary tracking-tight tabular-nums">
          {formatCurrency(inv.totalAmount || 0)}
        </span>
        {balanceDue > 0 && inv.status !== 'cancelled' && (
          <div className="text-right">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider leading-none mb-0.5">Por cobrar</p>
            <p className="text-sm font-bold text-amber-500 tabular-nums">{formatCurrency(balanceDue)}</p>
          </div>
        )}
        {inv.status === 'paid' && (
          <p className="text-xs font-bold text-emerald-500 flex items-center gap-1">
            ✓ Saldado
          </p>
        )}
      </div>

      {/* Row 4: CTA */}
      <div className="pt-2 border-t border-border/30">
        <Button
          variant="ghost"
          size="sm"
          className="w-full h-9 gap-1.5 text-xs font-semibold text-primary hover:bg-primary/10 rounded-xl"
          onClick={() => router.push(`/invoicing/${inv.id}?clientId=${inv.clientId}`)}
        >
          Ver / Modificar
          <ArrowRight className="w-3.5 h-3.5" />
        </Button>
      </div>
    </div>
  );
}
