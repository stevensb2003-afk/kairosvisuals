'use client';

import React, { useState, useRef, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ArrowRight, RefreshCw, User, Mail, Phone, Building2 } from 'lucide-react';
import { formatCurrency, cn } from '@/lib/utils';
import { format, parseISO } from 'date-fns';
import { STATUS_CONFIG } from '../_utils/status';

interface InvoiceListTableProps {
  invoices: any[];
  clientMap: Record<string, any>;
}

export function InvoiceListTable({ invoices, clientMap }: InvoiceListTableProps) {
  const router = useRouter();
  const [openClientCard, setOpenClientCard] = useState<string | null>(null);
  const clientCardRef = useRef<HTMLDivElement | null>(null);
  const [cardPosition, setCardPosition] = useState<{ top: number; left: number } | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => { setIsMounted(true); }, []);

  useEffect(() => {
    if (!openClientCard) return;
    const handleOutsideClick = (e: MouseEvent) => {
      if (clientCardRef.current && !clientCardRef.current.contains(e.target as Node)) {
        setOpenClientCard(null);
        setCardPosition(null);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [openClientCard]);

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader className="bg-secondary/30">
          <TableRow className="hover:bg-transparent border-b-border/50">
            <TableHead className="w-[160px] font-bold text-xs uppercase tracking-wider pl-4"># Factura</TableHead>
            <TableHead className="w-[110px] font-bold text-xs uppercase tracking-wider">Emisión</TableHead>
            <TableHead className="font-bold text-xs uppercase tracking-wider">Cliente</TableHead>
            <TableHead className="w-[140px] text-right font-bold text-xs uppercase tracking-wider">Total</TableHead>
            <TableHead className="w-[130px] text-right font-bold text-xs uppercase tracking-wider">Por Cobrar</TableHead>
            <TableHead className="w-[160px] text-center font-bold text-xs uppercase tracking-wider">Estado</TableHead>
            <TableHead className="w-[120px] text-right font-bold text-xs uppercase tracking-wider pr-4">Acción</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {invoices.map((inv) => {
            const cfg = STATUS_CONFIG[inv.status] || STATUS_CONFIG.draft;
            const client = clientMap[inv.clientId];
            const balanceDue = Math.max(0, (inv.totalAmount || 0) - (inv.amountPaid || 0));

            return (
              <TableRow key={inv.id} className="group hover:bg-secondary/20 transition-colors border-b-border/30">
                <TableCell className="pl-4 align-middle">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-primary text-xs font-mono">{inv.invoiceNumber || '—'}</span>
                    {inv.isPlanInvoice && (
                      <Badge variant="secondary" className="px-1 py-0 text-[9px] uppercase bg-amber-500/10 text-amber-600 border-amber-500/20">
                        <RefreshCw className="w-2.5 h-2.5 mr-0.5" />Ciclo
                      </Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell className="align-middle text-muted-foreground text-sm whitespace-nowrap">
                  {inv.createdAt ? format(parseISO(inv.createdAt), 'dd/MM/yyyy') : '—'}
                </TableCell>
                <TableCell className="align-middle">
                  <button
                    className="flex flex-col items-start text-left group/client"
                    onClick={(e) => {
                      if (openClientCard === inv.id) {
                        setOpenClientCard(null); setCardPosition(null);
                      } else {
                        const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                        setCardPosition({ top: rect.bottom + window.scrollY + 8, left: rect.left + window.scrollX });
                        setOpenClientCard(inv.id);
                      }
                    }}
                  >
                    <span className={cn(
                      'font-bold text-sm leading-none mb-0.5 transition-colors',
                      openClientCard === inv.id ? 'text-primary' : 'text-foreground group-hover/client:text-primary'
                    )}>
                      {client?.clientName || 'Cliente desconocido'}
                    </span>
                    {client?.company && (
                      <span className="text-[11px] text-slate-400">{client.company}</span>
                    )}
                  </button>

                  {openClientCard === inv.id && cardPosition && isMounted && ReactDOM.createPortal(
                    <div
                      ref={clientCardRef}
                      style={{ position: 'absolute', top: cardPosition.top, left: cardPosition.left }}
                      className="z-[9999] w-72 rounded-2xl overflow-hidden border border-white/10 shadow-2xl bg-slate-950/95 backdrop-blur-md animate-in fade-in-0 zoom-in-95 slide-in-from-top-2 duration-150"
                    >
                      <div className="flex items-center gap-3 px-4 py-3 border-b border-white/5 bg-slate-900/80">
                        <div className="w-9 h-9 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center shrink-0">
                          <User className="w-4 h-4 text-primary" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-sm text-white truncate">{client?.clientName || 'Cliente'}</p>
                          {client?.company && <p className="text-[11px] text-muted-foreground truncate">{client.company}</p>}
                        </div>
                      </div>
                      <div className="px-4 py-3 space-y-2.5">
                        <div className="flex items-center gap-2.5">
                          <Mail className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                          <span className="text-xs text-slate-300 truncate">{client?.email || client?.contactEmail || 'Sin correo'}</span>
                        </div>
                        <div className="flex items-center gap-2.5">
                          <Phone className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                          <span className="text-xs text-slate-300">{client?.clientPhone || client?.phone || 'Sin teléfono'}</span>
                        </div>
                        {client?.company && (
                          <div className="flex items-center gap-2.5">
                            <Building2 className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                            <span className="text-xs text-slate-300 truncate">{client.company}</span>
                          </div>
                        )}
                      </div>
                      <div className="px-4 pb-4">
                        <button
                          className="w-full text-xs font-bold text-primary border border-primary/30 rounded-xl py-2 hover:bg-primary/10 transition-colors"
                          onClick={(e) => { e.stopPropagation(); setOpenClientCard(null); router.push(`/clients/${inv.clientId}`); }}
                        >
                          Ver Perfil Completo →
                        </button>
                      </div>
                    </div>,
                    document.body
                  )}
                </TableCell>
                <TableCell className="text-right align-middle font-bold tabular-nums">
                  {formatCurrency(inv.totalAmount || 0)}
                </TableCell>
                <TableCell className="text-right align-middle">
                  <span className={cn('font-medium tabular-nums text-sm', balanceDue > 0 && inv.status !== 'cancelled' ? 'text-amber-500' : 'text-muted-foreground')}>
                    {formatCurrency(balanceDue)}
                  </span>
                </TableCell>
                <TableCell className="text-center align-middle">
                  <Badge variant="outline" className={cn('gap-1 text-[10px] font-bold uppercase tracking-wider', cfg.color)}>
                    {cfg.icon}
                    {cfg.label}
                  </Badge>
                </TableCell>
                <TableCell className="text-right align-middle pr-4">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 gap-1.5 text-xs font-semibold text-primary hover:bg-primary/10"
                    onClick={() => router.push(`/invoicing/${inv.id}?clientId=${inv.clientId}`)}
                  >
                    Ver
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Button>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
