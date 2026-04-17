'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useFirestore } from '@/firebase';
import { doc, getDoc, updateDoc, arrayUnion } from 'firebase/firestore';
import {
  ArrowLeft, FileText, Send, XCircle, Share, Download,
  CheckCircle, Loader2, Calendar, CreditCard, Plus, Trash2,
  DollarSign, Eye, Clock, ShieldCheck, AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { CartaTemplate, POSTemplate } from '@/components/invoicing/DocumentTemplates';
import { toast } from '@/hooks/use-toast';
import { formatCurrency, cn } from '@/lib/utils';
// Removed STATUS_CONFIG import from constants, using local one
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { PremiumDatePicker } from '@/components/ui/premium-date-picker';
import { Label } from '@/components/ui/label';
import { v4 as uuidv4 } from 'uuid';

const LOCAL_STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  draft:                { label: 'Borrador',        color: 'bg-slate-500/10 text-slate-500 border-slate-500/20',   icon: <FileText className="w-3.5 h-3.5" /> },
  sent:                 { label: 'Enviada',          color: 'bg-blue-500/10 text-blue-600 border-blue-500/20',      icon: <Send className="w-3.5 h-3.5" /> },
  partially_paid:       { label: 'Parcialmente Pagada', color: 'bg-amber-500/10 text-amber-600 border-amber-500/20', icon: <Clock className="w-3.5 h-3.5" /> },
  pending_verification: { label: 'Verificando Pago', color: 'bg-violet-500/10 text-violet-600 border-violet-500/20', icon: <ShieldCheck className="w-3.5 h-3.5" /> },
  paid:                 { label: 'Pagada',           color: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20', icon: <CheckCircle className="w-3.5 h-3.5" /> },
  overdue:              { label: 'Vencida',          color: 'bg-red-500/10 text-red-600 border-red-500/20',         icon: <AlertCircle className="w-3.5 h-3.5" /> },
  cancelled:            { label: 'Cancelada',        color: 'bg-muted text-muted-foreground border-border',         icon: <XCircle className="w-3.5 h-3.5" /> },
};
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
    sinpeMovil: ''
  });
  
  const [loading, setLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Nuevo pago state
  const [isAddingPayment, setIsAddingPayment] = useState(false);
  const [isFullPayment, setIsFullPayment] = useState(false);
  const [newPayment, setNewPayment] = useState({
    amount: '',
    date: new Date(),
    method: 'bank_transfer',
    reference: ''
  });

  // Default config object if missing
  const activeStatusConfig = invoice ? LOCAL_STATUS_CONFIG[invoice.status] || LOCAL_STATUS_CONFIG.draft : LOCAL_STATUS_CONFIG.draft;

  // 1. Fetch Data
  useEffect(() => {
    async function loadData() {
      if (!firestore || !invoiceId || !clientId) return;
      try {
        const invRef = doc(firestore, 'clients', clientId, 'invoices', invoiceId);
        const invSnap = await getDoc(invRef);
        
        if (invSnap.exists()) {
          const invData = invSnap.data();
          setInvoice({ id: invSnap.id, ...invData });
        } else {
          toast({ title: 'Factura no encontrada', variant: 'destructive' });
          router.push('/invoicing');
          return;
        }

        const cliRef = doc(firestore, 'clients', clientId);
        const cliSnap = await getDoc(cliRef);
        if (cliSnap.exists()) setClient({ id: cliSnap.id, ...cliSnap.data() });

        const setRef = doc(firestore, 'settings', 'general');
        const setSnap = await getDoc(setRef);
        if (setSnap.exists()) setSettings(setSnap.data());

      } catch (err) {
        console.error('Error loading invoice data:', err);
        toast({ title: 'Error cargando datos', variant: 'destructive' });
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [firestore, invoiceId, clientId, router]);

  // 2. Export functions
  const exportAndShare = async (type: 'carta' | 'pos', action: 'share' | 'download' = 'share') => {
    setIsExporting(true);
    try {
      const element = document.getElementById(`print-area-${type}`);
      if (!element) throw new Error("Plantilla no encontrada");
      
      const canvas = await html2canvas(element, { scale: 2, useCORS: true });
      const imgData = canvas.toDataURL('image/png');
      
      const isCarta = type === 'carta';
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: isCarta ? 'a4' : [80, (canvas.height * 80) / canvas.width]
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      const pdfBlob = pdf.output('blob');
      const fileName = `Factura_${invoice.invoiceNumber}.pdf`;

      if (action === 'share' && navigator.share && navigator.canShare) {
        const file = new File([pdfBlob], fileName, { type: 'application/pdf' });
        if (navigator.canShare({ files: [file] })) {
          await navigator.share({
            title: `Factura ${invoice.invoiceNumber}`,
            text: `Adjunto envío la factura ${invoice.invoiceNumber}`,
            files: [file]
          });
          setIsExporting(false);
          return;
        }
      }

      // Fallback for share, or if action is 'download'
      const url = URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

    } catch (err) {
      console.error(err);
      toast({ title: 'Error al exportar', variant: 'destructive' });
    } finally {
      setIsExporting(false);
    }
  };

  // 3. State change functions
  const updateInvoiceState = async (updates: any, successMsg: string) => {
    if (!firestore || !invoice) return;
    setIsProcessing(true);
    try {
      const ref = doc(firestore, 'clients', clientId!, 'invoices', invoice.id);
      await updateDoc(ref, {
        ...updates,
        updatedAt: new Date().toISOString()
      });
      setInvoice({ ...invoice, ...updates });
      toast({ title: successMsg });
    } catch (err) {
      toast({ title: 'Error al actualizar', variant: 'destructive' });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleMarkSent = () => updateInvoiceState({ status: 'sent' }, 'Factura marcada como Enviada');
  const handleCancelInvoice = () => updateInvoiceState({ status: 'cancelled' }, 'Factura Cancelada');

  // 4. Payments Logic
  const handleAddPayment = async () => {
    if (!newPayment.amount || isNaN(Number(newPayment.amount)) || Number(newPayment.amount) <= 0) {
      toast({ title: 'Ingrese un monto válido', variant: 'destructive' });
      return;
    }

    const payAmount = Number(newPayment.amount);
    const totalPayments = (invoice.payments || []).reduce((sum: number, p: any) => sum + p.amount, 0);
    const newTotalPaid = totalPayments + payAmount;
    
    // Status Logic
    let newStatus = invoice.status;
    if (newTotalPaid >= invoice.totalAmount) {
      newStatus = 'paid';
    } else if (newTotalPaid > 0) {
      newStatus = 'partially_paid';
    }

    const paymentEntry = {
      id: uuidv4(),
      amount: payAmount,
      date: newPayment.date.toISOString(),
      method: newPayment.method,
      reference: newPayment.reference
    };

    const upcomingPayments = [...(invoice.payments || []), paymentEntry];

    // Optimistic update
    updateInvoiceState({
      payments: upcomingPayments,
      amountPaid: newTotalPaid,
      status: newStatus
    }, 'Pago registrado exitosamente');

    setIsAddingPayment(false);
    setIsFullPayment(false);
    setNewPayment({ amount: '', date: new Date(), method: 'bank_transfer', reference: '' });
  };

  const handleDeletePayment = async (paymentId: string) => {
    if (!confirm('¿Estás seguro de eliminar este registro de pago?')) return;
    
    const upcomingPayments = invoice.payments.filter((p: any) => p.id !== paymentId);
    const newTotalPaid = upcomingPayments.reduce((sum: number, p: any) => sum + p.amount, 0);

    // Status logic reverse
    let newStatus = invoice.status;
    if (newTotalPaid >= invoice.totalAmount) {
      newStatus = 'paid';
    } else if (newTotalPaid > 0) {
      newStatus = 'partially_paid';
    } else {
      newStatus = 'sent'; // defaults back to sent
    }

    updateInvoiceState({
        payments: upcomingPayments,
        amountPaid: newTotalPaid,
        status: newStatus
    }, 'Abono eliminado. Saldos actualizados.');
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center pt-20">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    );
  }

  if (!invoice) return <div>Factura no encontrada</div>;

  const totalPayments = (invoice.payments || []).reduce((sum: number, p: any) => sum + p.amount, 0);
  const actualBalance = Math.max(0, invoice.totalAmount - totalPayments);
  const paidPercentage = invoice.totalAmount > 0 ? (totalPayments / invoice.totalAmount) * 100 : 0;

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-20">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <Button variant="ghost" className="mb-2 -ml-3 text-muted-foreground" onClick={() => router.push('/invoicing')}>
            <ArrowLeft className="w-4 h-4 mr-2" /> Volver al Facturador
          </Button>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold font-headline flex items-center gap-3">
              Factura #{invoice.invoiceNumber}
            </h1>
            <Badge variant="outline" className={cn("text-xs gap-1.5 py-1 px-3 border-2 h-7", activeStatusConfig.color)}>
              {activeStatusConfig.icon}
              {activeStatusConfig.label}
            </Badge>
          </div>
          <p className="text-muted-foreground mt-1">
            Emitida el {invoice.createdAt ? format(parseISO(invoice.createdAt), 'dd MMMM yyyy', { locale: es }) : '—'}
          </p>
        </div>
        
        <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => exportAndShare('pos', 'download')} disabled={isExporting}>
              {isExporting ? <Loader2 className="w-4 h-4 animate-spin mr-2"/> : <Download className="w-4 h-4 mr-2"/>}
              POS Voucher
            </Button>
            <Button variant="outline" onClick={() => exportAndShare('carta', 'download')} disabled={isExporting}>
              {isExporting ? <Loader2 className="w-4 h-4 animate-spin mr-2"/> : <Download className="w-4 h-4 mr-2"/>}
              Descargar PDF
            </Button>
            <Button className="bg-primary/10 text-primary hover:bg-primary/20" onClick={() => exportAndShare('carta', 'share')} disabled={isExporting}>
              {isExporting ? <Loader2 className="w-4 h-4 animate-spin mr-2"/> : <Share className="w-4 h-4 mr-2"/>}
              Compartir PDF
            </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        
        {/* PANEL IZQUIERDO: PREVISUALIZACION */}
        <div className="xl:col-span-2 space-y-6">
           <Card className="border-border/40 shadow-sm bg-card/40 overflow-hidden">
             <div className="bg-primary/5 p-4 border-b border-border/40 flex items-center justify-between">
                <p className="text-sm font-bold text-primary flex items-center gap-2">
                    <Eye className="w-4 h-4" /> Previsualización en Vivo (Carta)
                </p>
             </div>
             <div className="p-4 sm:p-8 bg-zinc-100 overflow-x-auto flex justify-center">
                {/* Visual rendering of the invoice document. It has a specific width (800px) typical for A4 scaled. */}
                <div className="transform scale-[0.6] sm:scale-75 md:scale-95 lg:scale-100 origin-top bg-white shadow-2xl rounded-sm">
                   {/* Render template visibly instead of hidden */}
                   <div id="print-area-carta" className="w-[800px] pointer-events-none">
                      <CartaTemplate invoice={invoice} client={client} settings={settings} />
                   </div>
                </div>
             </div>
           </Card>

           {/* Hidden container for POS export only */}
           <div style={{ position: 'absolute', top: '-9999px', left: '-9999px', opacity: 0, zIndex: -1 }}>
             <POSTemplate invoice={invoice} client={client} settings={settings} />
           </div>
        </div>

        {/* PANEL DERECHO: CONTROL SIDEBAR */}
        <div className="space-y-6">

          {/* ESTADO GLOBAL */}
          <Card className="border-border/40 shadow-sm">
            <CardHeader className="pb-3 border-b border-border/20">
              <CardTitle className="text-sm uppercase text-muted-foreground flex items-center gap-2">
                 ⚡ Acciones Rápidas
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-3">
              {invoice.status === 'draft' && (
                <Button className="w-full gap-2 bg-blue-600 hover:bg-blue-700" onClick={handleMarkSent} disabled={isProcessing}>
                  <Send className="w-4 h-4" /> Finalizar y Enviar Factura
                </Button>
              )}
              {invoice.status !== 'cancelled' && totalPayments === 0 && (
                <>
                  <Button 
                    variant="outline" 
                    className="w-full gap-2 text-primary border-primary/20 hover:bg-primary/10" 
                    onClick={() => router.push(`/invoicing/create?clientId=${clientId}&invoiceId=${invoiceId}&edit=true`)}
                  >
                    <FileText className="w-4 h-4" /> Editar Factura
                  </Button>
                  <Button variant="outline" className="w-full gap-2 text-destructive border-destructive/20 hover:bg-destructive/10" onClick={handleCancelInvoice} disabled={isProcessing}>
                    <XCircle className="w-4 h-4" /> Cancelar/Anular Factura
                  </Button>
                </>
              )}
              {invoice.status !== 'cancelled' && totalPayments > 0 && (
                <div className="space-y-1">
                  <Button variant="outline" className="w-full gap-2 text-destructive/50 border-destructive/10 cursor-not-allowed" disabled>
                    <XCircle className="w-4 h-4" /> Cancelar/Anular Factura
                  </Button>
                  <p className="text-[10px] text-muted-foreground text-center font-medium">Debes eliminar los abonos antes de anular o editar.</p>
                </div>
              )}
              {invoice.status === 'cancelled' && (
                 <div className="p-3 bg-destructive/10 text-destructive text-sm rounded-lg border border-destructive/20 text-center font-semibold">
                    Esta factura ha sido anulada.
                 </div>
              )}
            </CardContent>
          </Card>

          {/* PANEL DE PAGOS INTELIGENTES */}
          <Card className="border-primary/20 shadow-sm border-t-[4px]">
            <CardHeader className="pb-4">
              <CardTitle className="text-xl flex items-center justify-between">
                <span>Centro de Finanzas</span>
                <DollarSign className="w-5 h-5 text-emerald-500" />
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              
              <div className="grid grid-cols-2 gap-3">
                 <div className="p-3 rounded-xl bg-secondary/30 border border-border/40 text-center">
                    <p className="text-xs text-muted-foreground uppercase font-bold tracking-tighter mb-1">Monto Total</p>
                    <p className="text-lg font-black text-primary">{formatCurrency(invoice.totalAmount)}</p>
                 </div>
                 <div className={cn("p-3 rounded-xl border text-center", actualBalance === 0 ? "bg-emerald-500/10 border-emerald-500/20" : "bg-amber-500/10 border-amber-500/20")}>
                    <p className={cn("text-xs uppercase font-bold tracking-tighter mb-1", actualBalance === 0 ? "text-emerald-700" : "text-amber-700")}>Saldo Pendiente</p>
                    <p className={cn("text-lg font-black", actualBalance === 0 ? "text-emerald-600" : "text-amber-600")}>{formatCurrency(actualBalance)}</p>
                 </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-bold text-muted-foreground px-1">
                  <span>Progreso de Cobro</span>
                  <span>{Math.round(paidPercentage)}%</span>
                </div>
                <Progress value={paidPercentage} className={cn("h-3", paidPercentage === 100 ? "bg-emerald-500" : "")} />
              </div>

              <Separator className="bg-border/50" />

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                   <h3 className="text-sm font-bold flex items-center gap-2">
                     <CreditCard className="w-4 h-4 text-primary" /> Historial de Pagos
                   </h3>
                   {actualBalance > 0 && invoice.status !== 'cancelled' && (
                       <Button size="sm" variant="outline" className="h-7 text-xs bg-primary/5 border-primary/20 text-primary" onClick={() => setIsAddingPayment(!isAddingPayment)}>
                          <Plus className="w-3 h-3 mr-1" /> Abonar
                       </Button>
                   )}
                </div>

                {isAddingPayment && (
                  <div className="p-4 rounded-xl bg-primary/5 border border-primary/20 space-y-4 animate-in fade-in slide-in-from-top-4">
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <Label className="text-xs font-bold text-primary/70">Monto del Abono</Label>
                        <div className="flex items-center space-x-1.5">
                          <Checkbox 
                            id="full-payment" 
                            checked={isFullPayment}
                            onCheckedChange={(checked) => {
                              setIsFullPayment(checked as boolean);
                              if (checked) {
                                setNewPayment(prev => ({...prev, amount: actualBalance.toString()}));
                              }
                            }}
                          />
                          <label htmlFor="full-payment" className="text-[10px] font-medium leading-none cursor-pointer">
                            Abonar saldo total
                          </label>
                        </div>
                      </div>
                      <Input 
                        type="number" 
                        placeholder={actualBalance.toString()} 
                        value={newPayment.amount} 
                        onChange={e => {
                           setNewPayment({...newPayment, amount: e.target.value});
                           if (isFullPayment) setIsFullPayment(false);
                        }}
                        className="font-bold tabular-nums"
                      />
                    </div>
                    
                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold text-primary/70">Método de Pago</Label>
                      <Select value={newPayment.method} onValueChange={val => setNewPayment({...newPayment, method: val})}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="bank_transfer">Transferencia Bancaria</SelectItem>
                          <SelectItem value="sinpe_movil">SINPE Móvil</SelectItem>
                          <SelectItem value="cash">Efectivo</SelectItem>
                          <SelectItem value="other">Otro / Tarjeta</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold text-primary/70">Fecha del Pago</Label>
                      <PremiumDatePicker 
                        date={newPayment.date} 
                        onSelect={(date) => date && setNewPayment({...newPayment, date})} 
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold text-primary/70">Referencia (Opcional)</Label>
                      <Input 
                        placeholder="# de comprobante..." 
                        value={newPayment.reference} 
                        onChange={e => setNewPayment({...newPayment, reference: e.target.value})}
                      />
                    </div>

                    <div className="flex gap-2 pt-2">
                        <Button className="flex-1" onClick={handleAddPayment} disabled={isProcessing}>
                            Registrar Abono
                        </Button>
                        <Button variant="ghost" onClick={() => setIsAddingPayment(false)} className="text-muted-foreground">
                            Cancelar
                        </Button>
                    </div>
                  </div>
                )}

                <div className="space-y-2 max-h-[300px] overflow-y-auto px-1 py-1 custom-scrollbar">
                   {!(invoice.payments?.length) && !isAddingPayment && (
                     <div className="py-6 text-center border border-dashed rounded-xl bg-background">
                       <p className="text-xs text-muted-foreground">Aún no hay abonos registrados.</p>
                     </div>
                   )}
                   
                   {invoice.payments?.sort((a:any, b:any) => new Date(b.date).getTime() - new Date(a.date).getTime()).map((payment: any, index: number) => (
                     <div key={payment.id} className="p-3 rounded-lg border border-border/50 bg-background flex flex-col gap-2 relative group hover:border-primary/20 transition-all">
                       <div className="flex items-center justify-between w-full">
                          <div className="flex items-center gap-2">
                            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-emerald-500/10 text-emerald-600 font-bold text-[10px]">
                              {invoice.payments.length - index}
                            </span>
                            <div>
                               <p className="text-sm font-bold">{formatCurrency(payment.amount)}</p>
                               <p className="text-[10px] text-muted-foreground capitalize flex items-center gap-1">
                                  {format(parseISO(payment.date), 'dd MMM yyyy', { locale: es })}
                                  {payment.reference && <span className="text-primary truncate max-w-[100px]">· Ref: {payment.reference}</span>}
                               </p>
                            </div>
                          </div>
                          
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-7 w-7 text-destructive opacity-0 group-hover:opacity-100 hover:bg-destructive/10"
                            onClick={() => handleDeletePayment(payment.id)}
                            disabled={isProcessing}
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                       </div>
                     </div>
                   ))}
                </div>

              </div>

            </CardContent>
          </Card>

        </div>
      </div>
    </div>
  );
}
