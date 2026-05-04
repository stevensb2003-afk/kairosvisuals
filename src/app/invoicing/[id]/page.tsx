'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useFirestore } from '@/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import {
  ArrowLeft, FileText, Send, XCircle, Share, Download,
  Loader2, ChevronDown, ChevronUp, Eye, CreditCard
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CartaTemplate, POSTemplate } from '@/components/invoicing/DocumentTemplates';
import { toast } from '@/hooks/use-toast';
import { formatCurrency, cn } from '@/lib/utils';
import { STATUS_CONFIG } from '../_utils/status';
import { InvoicePaymentsPanel } from '../_components/InvoicePaymentsPanel';
import { InvoiceItemsList } from '../_components/InvoiceItemsList';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export default function InvoiceDetailPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const firestore = useFirestore();

  const invoiceId = params.id as string;
  const clientId = searchParams.get('clientId');

  const [invoice, setInvoice] = useState<any>(null);
  const [client, setClient] = useState<any>(null);
  const [settings, setSettings] = useState<any>({
    companyName: 'Kairos Visuals',
    contactEmail: 'info@kairosvisuals.com',
    bankingInfo: { bank: '', iban: '' },
    sinpeMovil: '',
  });

  const [loading, setLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isPdfExpanded, setIsPdfExpanded] = useState(false);
  const [previewHeight, setPreviewHeight] = useState(1131);
  const [containerWidth, setContainerWidth] = useState(0);
  const previewRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const obsPreview = new ResizeObserver((entries) => {
      for (let entry of entries) setPreviewHeight(entry.contentRect.height);
    });
    const obsContainer = new ResizeObserver((entries) => {
      for (let entry of entries) setContainerWidth(entry.contentRect.width);
    });

    if (previewRef.current) obsPreview.observe(previewRef.current);
    if (containerRef.current) obsContainer.observe(containerRef.current);

    return () => {
      obsPreview.disconnect();
      obsContainer.disconnect();
    };
  }, [isPdfExpanded, invoice]);

  // ── Data Fetching ────────────────────────────────────────────────────────
  useEffect(() => {
    async function loadData() {
      if (!firestore || !invoiceId || !clientId) return;
      try {
        const invSnap = await getDoc(doc(firestore, 'clients', clientId, 'invoices', invoiceId));
        if (invSnap.exists()) {
          setInvoice({ id: invSnap.id, ...invSnap.data() });
        } else {
          toast({ title: 'Factura no encontrada', variant: 'destructive' });
          router.push('/invoicing');
          return;
        }
        const cliSnap = await getDoc(doc(firestore, 'clients', clientId));
        if (cliSnap.exists()) setClient({ id: cliSnap.id, ...cliSnap.data() });

        const setSnap = await getDoc(doc(firestore, 'settings', 'general'));
        if (setSnap.exists()) setSettings(setSnap.data());
      } catch (err) {
        console.error(err);
        toast({ title: 'Error cargando datos', variant: 'destructive' });
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [firestore, invoiceId, clientId, router]);

  // ── PDF Export ───────────────────────────────────────────────────────────
  const exportAndShare = async (type: 'carta' | 'pos', action: 'share' | 'download' = 'download') => {
    setIsExporting(true);
    try {
      const element = document.getElementById(`print-area-${type}`);
      if (!element) throw new Error('Template not found');

      const canvas = await html2canvas(element, { scale: 2, useCORS: true });
      const imgData = canvas.toDataURL('image/png');
      const isCarta = type === 'carta';
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: isCarta ? 'a4' : [80, (canvas.height * 80) / canvas.width],
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, (canvas.height * pdfWidth) / canvas.width);
      const pdfBlob = pdf.output('blob');
      const fileName = `Factura_${invoice.invoiceNumber}.pdf`;

      if (action === 'share' && navigator.share && navigator.canShare) {
        const file = new File([pdfBlob], fileName, { type: 'application/pdf' });
        if (navigator.canShare({ files: [file] })) {
          await navigator.share({ title: `Factura ${invoice.invoiceNumber}`, files: [file] });
          return;
        }
      }
      const url = URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      link.href = url; link.download = fileName;
      document.body.appendChild(link); link.click();
      document.body.removeChild(link); URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      toast({ title: 'Error al exportar', variant: 'destructive' });
    } finally {
      setIsExporting(false);
    }
  };

  // ── Invoice Updates ──────────────────────────────────────────────────────
  const updateInvoiceState = async (updates: any, successMsg: string) => {
    if (!firestore || !invoice) return;
    setIsProcessing(true);
    try {
      await updateDoc(doc(firestore, 'clients', clientId!, 'invoices', invoice.id), {
        ...updates,
        updatedAt: new Date().toISOString(),
      });
      setInvoice((prev: any) => ({ ...prev, ...updates }));
      toast({ title: successMsg });
    } catch {
      toast({ title: 'Error al actualizar', variant: 'destructive' });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleMarkSent = () => updateInvoiceState({ status: 'sent' }, 'Factura marcada como Enviada');
  const handleCancelInvoice = () => updateInvoiceState({ status: 'cancelled' }, 'Factura Cancelada');

  // ── Payment Handlers (passed to panel) ──────────────────────────────────
  const handleAddPayment = (entry: any, newStatus: string, newTotalPaid: number) => {
    const upcomingPayments = [...(invoice.payments || []), entry];
    updateInvoiceState({ payments: upcomingPayments, amountPaid: newTotalPaid, status: newStatus }, 'Pago registrado');
  };

  const handleDeletePayment = async (paymentId: string) => {
    if (!confirm('¿Eliminar este registro de pago?')) return;
    const upcomingPayments = invoice.payments.filter((p: any) => p.id !== paymentId);
    const newTotalPaid = upcomingPayments.reduce((s: number, p: any) => s + p.amount, 0);
    const newStatus = newTotalPaid >= invoice.totalAmount ? 'paid' : newTotalPaid > 0 ? 'partially_paid' : 'sent';
    updateInvoiceState({ payments: upcomingPayments, amountPaid: newTotalPaid, status: newStatus }, 'Abono eliminado');
  };

  // ── Derived ──────────────────────────────────────────────────────────────
  const totalPayments = useMemo(() =>
    (invoice?.payments || []).reduce((s: number, p: any) => s + p.amount, 0),
  [invoice?.payments]);

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    );
  }
  if (!invoice) return <div>Factura no encontrada</div>;

  const statusCfg = STATUS_CONFIG[invoice.status] || STATUS_CONFIG.draft;
  const hasPayments = totalPayments > 0;
  const dynamicScale = containerWidth > 0 ? containerWidth / 800 : 1;

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-28 sm:pb-8">

      {/* ── Header ────────────────────────────────────────────────────── */}
      <div className="space-y-3">
        {/* Back button */}
        <Button
          variant="ghost"
          size="sm"
          className="-ml-2 text-muted-foreground hover:text-foreground gap-1.5 h-8"
          onClick={() => router.push('/invoicing')}
        >
          <ArrowLeft className="w-4 h-4" /> Facturador
        </Button>

        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-xl sm:text-3xl font-bold font-headline leading-tight">
                Factura #{invoice.invoiceNumber}
              </h1>
              <Badge variant="outline" className={cn('text-xs gap-1.5 py-1 px-2.5 border-2 shrink-0', statusCfg.color)}>
                {statusCfg.icon}
                {statusCfg.label}
              </Badge>
            </div>
            <p className="text-muted-foreground mt-1 text-xs sm:text-sm">
              {client?.clientName || 'Cliente'} · Emitida el{' '}
              {invoice.createdAt ? format(parseISO(invoice.createdAt), 'dd MMM yyyy', { locale: es }) : '—'}
            </p>
          </div>

          {/* Desktop export actions only — mobile uses sticky bottom bar */}
          <div className="hidden sm:flex items-center gap-2 shrink-0">
            <Button variant="outline" size="sm" onClick={() => exportAndShare('pos', 'download')} disabled={isExporting}>
              {isExporting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Download className="w-4 h-4 mr-2" />}
              POS
            </Button>
            <Button variant="outline" size="sm" onClick={() => exportAndShare('carta', 'download')} disabled={isExporting}>
              {isExporting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Download className="w-4 h-4 mr-2" />}
              PDF Carta
            </Button>
            <Button variant="outline" size="sm" onClick={() => exportAndShare('carta', 'share')} disabled={isExporting}>
              {isExporting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Share className="w-4 h-4 mr-2" />}
              Compartir
            </Button>
          </div>
        </div>
      </div>

      {/* ── Main Grid ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

        {/* Left: PDF Preview (collapsible) */}
        <div className="xl:col-span-2 space-y-4">
          <Card className="border-border/40 shadow-sm bg-card/40 overflow-hidden">
            {/* Preview header — always visible */}
            <div className="border-b border-border/40 bg-primary/5">
              <div className="px-4 py-3 flex items-center justify-between">
                <button
                  className="flex items-center gap-2 hover:opacity-80 transition-opacity"
                  onClick={() => setIsPdfExpanded(v => !v)}
                >
                  <Eye className="w-4 h-4 text-primary" />
                  <p className="text-sm font-bold text-primary">Previsualización PDF</p>
                  {isPdfExpanded
                    ? <ChevronUp className="w-4 h-4 text-primary ml-1" />
                    : <ChevronDown className="w-4 h-4 text-primary ml-1" />
                  }
                </button>
                
                {/* Immediate actions (visible even when collapsed for speed) */}
                <div className="flex gap-1.5">
                  <Button size="icon" variant="ghost" className="h-8 w-8 text-primary hover:bg-primary/10" title="Descargar" onClick={() => exportAndShare('carta', 'download')} disabled={isExporting}>
                    <Download className="w-4 h-4" />
                  </Button>
                  <Button size="icon" variant="ghost" className="h-8 w-8 text-primary hover:bg-primary/10" title="Compartir" onClick={() => exportAndShare('carta', 'share')} disabled={isExporting}>
                    <Share className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              
              {/* Desktop quick actions inside header bar */}
              {isPdfExpanded && (
                <div className="px-4 pb-3 flex flex-wrap gap-2 animate-in fade-in duration-300">
                  <Button size="sm" variant="outline" className="bg-background/50 h-8 text-xs gap-1.5" onClick={() => exportAndShare('carta', 'download')} disabled={isExporting}>
                    <FileText className="w-3.5 h-3.5" /> PDF Completo
                  </Button>
                  <Button size="sm" variant="outline" className="bg-background/50 h-8 text-xs gap-1.5" onClick={() => exportAndShare('pos', 'download')} disabled={isExporting}>
                    <CreditCard className="w-3.5 h-3.5" /> Voucher POS
                  </Button>
                </div>
              )}
            </div>

            {/* Collapsible content */}
            <div className={cn(
              'transition-all duration-300 ease-in-out grid',
              isPdfExpanded ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
            )}>
              <div className="overflow-hidden">
                <div className="bg-zinc-100/50 flex justify-center">
                  {/* Scaling Wrapper that compensates for the transform height gap */}
                  <div className="p-2 sm:p-4 w-full flex justify-center" ref={containerRef}>
                    <div className="relative" style={{ 
                      width: '800px', 
                      transform: `scale(${dynamicScale})`, 
                      transformOrigin: 'top center',
                      height: `${previewHeight * dynamicScale}px`
                    } as React.CSSProperties}>
                      {/* We use inline styles or a container that helps the browser understand the height */}
                      <div 
                          ref={previewRef}
                          className="w-[800px] bg-white shadow-2xl rounded-sm pointer-events-none"
                      >
                        <CartaTemplate invoice={invoice} client={client} settings={settings} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Collapsed summary */}
            {!isPdfExpanded && (
              <div className="px-4 py-3 flex items-center justify-between border-t border-border/10">
                <div className="flex items-center gap-3">
                  <FileText className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    {invoice.items?.length || 0} ítem(s) · Total:{' '}
                    <span className="font-bold text-primary">{formatCurrency(invoice.totalAmount)}</span>
                  </span>
                </div>
                <Button size="sm" variant="ghost" className="gap-1.5 h-8 text-xs text-primary" onClick={() => setIsPdfExpanded(true)}>
                  <Eye className="w-3.5 h-3.5" /> Abrir Preview
                </Button>
              </div>
            )}
          </Card>

          {/* Items list — extracted component with accordion for long descriptions */}
          <InvoiceItemsList items={invoice.items} totalAmount={invoice.totalAmount} />
        </div>

        {/* Right: Actions + Payments */}
        <div className="space-y-4">
          {/* Quick actions */}
          <Card className="border-border/40 shadow-sm">
            <CardHeader className="pb-3 border-b border-border/20">
              <CardTitle className="text-sm uppercase text-muted-foreground flex items-center gap-2">
                ⚡ Acciones Rápidas
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-3">
              {invoice.status === 'draft' && (
                <Button className="w-full gap-2 bg-blue-600 hover:bg-blue-700 h-11" onClick={handleMarkSent} disabled={isProcessing}>
                  <Send className="w-4 h-4" /> Finalizar y Enviar
                </Button>
              )}
              {invoice.status !== 'cancelled' && !hasPayments && (
                <>
                  <Button
                    variant="outline"
                    className="w-full gap-2 text-primary border-primary/20 hover:bg-primary/10 h-11"
                    onClick={() => router.push(`/invoicing/create?clientId=${clientId}&invoiceId=${invoiceId}&edit=true`)}
                  >
                    <FileText className="w-4 h-4" /> Editar Factura
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full gap-2 text-destructive border-destructive/20 hover:bg-destructive/10 h-11"
                    onClick={handleCancelInvoice}
                    disabled={isProcessing}
                  >
                    <XCircle className="w-4 h-4" /> Cancelar / Anular
                  </Button>
                </>
              )}
              {invoice.status !== 'cancelled' && hasPayments && (
                <div className="space-y-2">
                  <Button variant="outline" className="w-full gap-2 text-destructive/40 border-destructive/10 cursor-not-allowed h-11" disabled>
                    <XCircle className="w-4 h-4" /> Cancelar / Anular
                  </Button>
                  <p className="text-[10px] text-muted-foreground text-center">Elimina los abonos primero para poder anular.</p>
                </div>
              )}
              {invoice.status === 'cancelled' && (
                <div className="p-3 bg-destructive/10 text-destructive text-sm rounded-xl border border-destructive/20 text-center font-semibold">
                  Esta factura ha sido anulada.
                </div>
              )}
            </CardContent>
          </Card>

          {/* Payments panel */}
          <InvoicePaymentsPanel
            invoice={invoice}
            isProcessing={isProcessing}
            onAddPayment={handleAddPayment}
            onDeletePayment={handleDeletePayment}
          />
        </div>
      </div>

      {/* Hidden POS template */}
      <div style={{ position: 'fixed', top: '-9999px', left: '-9999px', zIndex: -1, opacity: 0, pointerEvents: 'none' }}>
        <div id="print-area-pos">
          <POSTemplate invoice={invoice} client={client} settings={settings} />
        </div>
      </div>

      {/* ── Sticky Bottom Action Bar (mobile only) ───────────────────────── */}
      <div className="fixed bottom-0 left-0 right-0 z-50 sm:hidden">
        <div className="bg-background/80 backdrop-blur-lg border-t border-border/40 px-4 pt-3 pb-[calc(env(safe-area-inset-bottom)+12px)] flex items-center gap-2">
          {/* PDF Carta — primary */}
          <Button
            className="flex-1 h-11 gap-2 text-sm font-semibold rounded-xl"
            onClick={() => exportAndShare('carta', 'download')}
            disabled={isExporting}
          >
            {isExporting
              ? <Loader2 className="w-4 h-4 animate-spin" />
              : <Download className="w-4 h-4" />
            }
            PDF Carta
          </Button>

          {/* Voucher POS */}
          <Button
            variant="outline"
            size="icon"
            className="h-11 w-11 shrink-0 rounded-xl border-border/40"
            onClick={() => exportAndShare('pos', 'download')}
            disabled={isExporting}
            title="Voucher POS"
          >
            <CreditCard className="w-4 h-4" />
          </Button>

          {/* Share */}
          <Button
            variant="outline"
            size="icon"
            className="h-11 w-11 shrink-0 rounded-xl border-border/40"
            onClick={() => exportAndShare('carta', 'share')}
            disabled={isExporting}
            title="Compartir"
          >
            <Share className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
