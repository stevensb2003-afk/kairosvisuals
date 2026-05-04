import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from "@/components/ui/table";
import { 
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { 
  MoreHorizontal, Edit, Trash2, FileText, CheckCircle2, ArrowRight, Check, Receipt, Loader2
} from "lucide-react";
import { formatCurrency, cn } from '@/lib/utils';
import { Quotation } from '@/lib/types';
import { ClientQuickInfoCard } from './ClientQuickInfoCard';

interface QuotationsTableProps {
  quotations: Quotation[];
  isAccepting: string | null;
  onPreview: (q: Quotation) => void;
  onDelete: (q: Quotation) => void;
  onPublish: (q: Quotation) => void;
  onAccept: (q: Quotation) => void;
}

export function QuotationsTable({ 
  quotations, 
  isAccepting, 
  onPreview, 
  onDelete, 
  onPublish, 
  onAccept 
}: QuotationsTableProps) {
  const router = useRouter();
  const [openClientCard, setOpenClientCard] = useState<string | null>(null);
  const clientCardRef = useRef<HTMLDivElement>(null);
  const [cardPosition, setCardPosition] = useState<{ top: number; left: number } | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!openClientCard) return;
    const handleOutsideClick = (e: MouseEvent) => {
      if (clientCardRef.current && !clientCardRef.current.contains(e.target as Node)) {
        setOpenClientCard(null);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [openClientCard]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'draft':
        return <Badge variant="secondary" className="bg-slate-100 text-slate-700 border-slate-200 uppercase text-[10px] font-bold">Borrador</Badge>;
      case 'published':
        return <Badge variant="outline" className="text-blue-600 border-blue-200 bg-blue-50 uppercase text-[10px] font-bold tracking-wider">Enviada</Badge>;
      case 'accepted':
        return <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50 uppercase text-[10px] font-bold tracking-wider">Aceptada</Badge>;
      case 'rejected':
        return <Badge variant="destructive" className="uppercase text-[10px] font-bold tracking-wider">Rechazada</Badge>;
      case 'superseded':
        return <Badge variant="outline" className="text-amber-600 border-amber-200 bg-amber-50 uppercase text-[10px] font-bold tracking-wider">Superada</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div>
      {/* ── Mobile Card View (< sm) ── */}
      <div className="block sm:hidden divide-y divide-border/30">
        {quotations.map((q) => (
          <div key={q.id} className="p-4 space-y-3 hover:bg-primary/[0.02] transition-colors">
            {/* Row 1: Number + Status + Date */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-bold text-primary text-xs tracking-wider">
                  #{q.quotationNumber ? String(q.quotationNumber).padStart(4, '0') : '—'}
                </span>
                {getStatusBadge(q.status)}
              </div>
              <span className="text-xs text-muted-foreground">
                {new Date(q.createdAt).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: '2-digit' })}
              </span>
            </div>

            {/* Row 2: Client + Title */}
            <div>
              <p className="font-bold text-sm text-foreground">{q.clientName || 'Cliente sin nombre'}</p>
              {(q as any).clientCompany && (
                <p className="text-xs text-muted-foreground">{(q as any).clientCompany}</p>
              )}
              <p className="text-sm text-muted-foreground/80 mt-0.5 truncate">
                {q.title || 'Propuesta sin título'}
                {q.version > 1 && <span className="ml-1.5 text-[10px] text-muted-foreground/50">v{q.version}</span>}
              </p>
            </div>

            {/* Row 3: Amount + Expiry */}
            <div className="flex items-center justify-between">
              <span className="text-xl font-black text-primary">{formatCurrency(q.totalAmount)}</span>
              {q.validUntil && (
                <span className="text-xs text-muted-foreground">
                  Vence: {new Date(q.validUntil).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })}
                </span>
              )}
            </div>

            {/* Row 4: Actions */}
            <div className="flex gap-2 pt-1 border-t border-border/30">
              <Button
                variant="outline"
                size="sm"
                className="flex-1 rounded-xl h-10 gap-1.5 text-xs font-semibold border-border/50"
                onClick={() => onPreview(q)}
              >
                <FileText className="w-3.5 h-3.5" /> Ver PDF
              </Button>

              {q.status !== 'accepted' && (
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 rounded-xl h-10 gap-1.5 text-xs font-semibold border-border/50 hover:text-primary hover:border-primary/50"
                  onClick={() => router.push(`/solicitudes/create?quotationId=${q.id}&clientId=${q.clientId}`)}
                >
                  <Edit className="w-3.5 h-3.5" /> Editar
                </Button>
              )}

              {q.status === 'draft' && (
                <Button
                  size="sm"
                  className="flex-1 rounded-xl h-10 gap-1.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white"
                  onClick={() => onPublish(q)}
                >
                  <Check className="w-3.5 h-3.5" /> Publicar
                </Button>
              )}

              {q.status === 'published' && (
                <Button
                  size="sm"
                  className="flex-1 rounded-xl h-10 gap-1.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white"
                  onClick={() => onAccept(q)}
                  disabled={isAccepting === q.id}
                >
                  {isAccepting === q.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                  Facturar
                </Button>
              )}

              {q.status === 'accepted' && (
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 rounded-xl h-10 gap-1.5 text-xs font-semibold border-border/50"
                  onClick={() => router.push('/invoicing')}
                >
                  <Receipt className="w-3.5 h-3.5" /> Facturas
                </Button>
              )}

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl shrink-0">
                    <MoreHorizontal className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48 p-2 rounded-xl border-border/50">
                  <DropdownMenuItem className="cursor-pointer rounded-lg gap-2 font-medium" onClick={() => onPreview(q)}>
                    <FileText className="w-4 h-4 text-muted-foreground" /> Ver Detalles
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="text-destructive focus:text-destructive cursor-pointer rounded-lg gap-2 font-medium"
                    onClick={() => onDelete(q)}
                  >
                    <Trash2 className="w-4 h-4" /> Eliminar
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        ))}
      </div>

      {/* ── Desktop Table View (≥ sm) ── */}
      <div className="hidden sm:block overflow-x-auto">
        <Table>
          <TableHeader className="bg-muted/30">
            <TableRow className="hover:bg-transparent border-b-border/50">
              <TableHead className="w-[80px] font-bold text-xs uppercase tracking-wider pl-6"># Cotiz.</TableHead>
              <TableHead className="w-[100px] font-bold text-xs uppercase tracking-wider">Fecha</TableHead>
              <TableHead className="w-[100px] font-bold text-xs uppercase tracking-wider">Vence</TableHead>
              <TableHead className="w-[220px] font-bold text-xs uppercase tracking-wider">Cliente</TableHead>
              <TableHead className="min-w-[200px] font-bold text-xs uppercase tracking-wider">Título de Propuesta</TableHead>
              <TableHead className="w-[120px] text-right font-bold text-xs uppercase tracking-wider pr-4">Total</TableHead>
              <TableHead className="w-[120px] text-center font-bold text-xs uppercase tracking-wider">Estado</TableHead>
              <TableHead className="w-[140px] text-right font-bold text-xs uppercase tracking-wider pr-6">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {quotations.map((q) => (
              <TableRow key={q.id} className="group hover:bg-primary/[0.01] border-b-border/40 transition-colors">
                <TableCell className="pl-6 whitespace-nowrap min-w-[80px]">
                  <span className="font-bold text-primary text-xs">
                    {q.quotationNumber ? String(q.quotationNumber).padStart(4, '0') : '—'}
                  </span>
                </TableCell>
                <TableCell className="font-medium text-muted-foreground whitespace-nowrap">
                  {new Date(q.createdAt).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })}
                </TableCell>
                <TableCell className="font-medium text-muted-foreground whitespace-nowrap">
                  {q.validUntil ? new Date(q.validUntil).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' }) : 'N/A'}
                </TableCell>
                <TableCell>
                  <div className="relative">
                    <button
                      className="flex flex-col items-start text-left group/client w-full"
                      onClick={(e) => {
                        if (openClientCard === q.id) {
                          setOpenClientCard(null);
                          setCardPosition(null);
                        } else {
                          const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                          setCardPosition({ top: rect.bottom + window.scrollY + 8, left: rect.left + window.scrollX });
                          setOpenClientCard(q.id || null);
                        }
                      }}
                    >
                      <span className={cn(
                        "font-bold leading-none mb-1 transition-colors",
                        openClientCard === q.id ? "text-primary" : "text-foreground group-hover/client:text-primary"
                      )}>
                        {q.clientName || 'Cliente sin nombre'}
                      </span>
                      {(q as any).clientCompany && (
                        <span className="text-[11px] font-medium text-slate-400 mb-0.5">{(q as any).clientCompany}</span>
                      )}
                      <span className="text-[11px] text-muted-foreground">{q.clientEmail}</span>
                    </button>
                  </div>

                  {isMounted && openClientCard === q.id && cardPosition && (
                    <ClientQuickInfoCard 
                      quotation={q} 
                      position={cardPosition} 
                      onClose={() => setOpenClientCard(null)} 
                      cardRef={clientCardRef} 
                    />
                  )}
                </TableCell>
                <TableCell className="font-semibold text-slate-700">
                  <div className="flex items-center gap-2">
                    <span>{q.title || 'Propuesta sin título'}</span>
                    {q.version > 1 && <Badge variant="outline" className="text-[10px] py-0 h-4 bg-muted/50 border-muted-foreground/20">v{q.version}</Badge>}
                  </div>
                </TableCell>
                <TableCell className="font-black text-primary text-right pr-4">
                  {formatCurrency(q.totalAmount)}
                </TableCell>
                <TableCell className="text-center">
                  {getStatusBadge(q.status)}
                </TableCell>
                <TableCell className="text-right pr-4">
                  <div className="flex justify-end gap-1 transition-all">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className={cn("h-9 w-9 rounded-full", q.status === 'accepted' ? "opacity-50 cursor-not-allowed" : "hover:text-primary hover:bg-primary/10")}
                      onClick={() => q.status !== 'accepted' && router.push(`/solicitudes/create?quotationId=${q.id}&clientId=${q.clientId}`)}
                      disabled={q.status === 'accepted'}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-56 p-2 rounded-xl border-border/50">
                        <DropdownMenuItem className="cursor-pointer rounded-lg gap-2 font-medium" onClick={() => onPreview(q)}>
                          <FileText className="w-4 h-4 text-muted-foreground" /> Ver Detalles
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive focus:text-destructive cursor-pointer rounded-lg gap-2 font-medium" onClick={() => onDelete(q)}>
                          <Trash2 className="w-4 h-4" /> Eliminar Propuesta
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                    {q.status === 'draft' && (
                      <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full transition-all shadow-sm text-emerald-600 hover:bg-emerald-50 bg-emerald-50/30 border border-emerald-100 hover:scale-110" onClick={() => onPublish(q)}>
                        <Check className="w-4 h-4" />
                      </Button>
                    )}
                    {q.status === 'published' && (
                      <Button variant="default" size="sm" className="h-9 rounded-full transition-all shadow-md bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs" onClick={() => onAccept(q)} disabled={isAccepting === q.id}>
                        {isAccepting === q.id ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <CheckCircle2 className="w-4 h-4 mr-1" />}
                        Facturar
                      </Button>
                    )}
                    {q.status === 'accepted' && (
                      <Button variant="ghost" size="sm" className="h-9 rounded-full transition-all text-muted-foreground hover:text-primary hover:bg-primary/10 text-xs font-semibold" onClick={() => router.push('/invoicing')}>
                        <Receipt className="w-4 h-4 mr-1" /> Facturas
                      </Button>
                    )}
                    {['superseded', 'rejected'].includes(q.status) && (
                      <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full transition-all shadow-sm text-primary hover:bg-primary/10" onClick={() => router.push(`/solicitudes/create?quotationId=${q.id}&clientId=${q.clientId}`)}>
                        <ArrowRight className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
