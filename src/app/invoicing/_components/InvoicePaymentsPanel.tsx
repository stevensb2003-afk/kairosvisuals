'use client';

import React, { useState } from 'react';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { Plus, CreditCard, Trash2, Loader2, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { PremiumDatePicker } from '@/components/ui/premium-date-picker';
import { formatCurrency, cn } from '@/lib/utils';

interface InvoicePaymentsPanelProps {
  invoice: any;
  isProcessing: boolean;
  onAddPayment: (entry: any, newStatus: string, newTotalPaid: number) => void;
  onDeletePayment: (paymentId: string) => void;
}

export function InvoicePaymentsPanel({
  invoice,
  isProcessing,
  onAddPayment,
  onDeletePayment,
}: InvoicePaymentsPanelProps) {
  const [isAddingPayment, setIsAddingPayment] = useState(false);
  const [isFullPayment, setIsFullPayment] = useState(false);
  const [newPayment, setNewPayment] = useState({
    amount: '',
    date: new Date(),
    method: 'bank_transfer',
    reference: '',
  });

  const totalPayments = (invoice.payments || []).reduce((s: number, p: any) => s + p.amount, 0);
  const actualBalance = Math.max(0, invoice.totalAmount - totalPayments);
  const paidPercentage = invoice.totalAmount > 0 ? (totalPayments / invoice.totalAmount) * 100 : 0;

  const handleSubmit = () => {
    const payAmount = Number(newPayment.amount);
    if (!newPayment.amount || isNaN(payAmount) || payAmount <= 0) return;

    const newTotalPaid = totalPayments + payAmount;
    let newStatus = invoice.status;
    if (newTotalPaid >= invoice.totalAmount) newStatus = 'paid';
    else if (newTotalPaid > 0) newStatus = 'partially_paid';

    const entry = {
      id: crypto.randomUUID(),
      amount: payAmount,
      date: newPayment.date.toISOString(),
      method: newPayment.method,
      reference: newPayment.reference,
    };

    onAddPayment(entry, newStatus, newTotalPaid);
    setIsAddingPayment(false);
    setIsFullPayment(false);
    setNewPayment({ amount: '', date: new Date(), method: 'bank_transfer', reference: '' });
  };

  return (
    <Card className="border-primary/20 shadow-sm border-t-[4px]">
      <CardHeader className="pb-4">
        <CardTitle className="text-xl flex items-center justify-between">
          <span>Centro de Finanzas</span>
          <DollarSign className="w-5 h-5 text-emerald-500" />
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Mini stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 rounded-xl bg-secondary/30 border border-border/40 text-center">
            <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-tight mb-1">Total</p>
            <p className="text-lg font-black text-primary tabular-nums">{formatCurrency(invoice.totalAmount)}</p>
          </div>
          <div className={cn('p-3 rounded-xl border text-center', actualBalance === 0 ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-amber-500/10 border-amber-500/20')}>
            <p className={cn('text-[10px] uppercase font-bold tracking-tight mb-1', actualBalance === 0 ? 'text-emerald-700' : 'text-amber-700')}>Pendiente</p>
            <p className={cn('text-lg font-black tabular-nums', actualBalance === 0 ? 'text-emerald-600' : 'text-amber-600')}>{formatCurrency(actualBalance)}</p>
          </div>
        </div>

        {/* Progress */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs font-bold text-muted-foreground px-1">
            <span>Progreso de cobro</span>
            <span>{Math.round(paidPercentage)}%</span>
          </div>
          <Progress value={paidPercentage} className="h-2.5" />
        </div>

        <Separator />

        {/* Payment history */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-primary" /> Historial de Pagos
            </h3>
            {actualBalance > 0 && invoice.status !== 'cancelled' && (
              <Button size="sm" variant="outline" className="h-8 text-xs bg-primary/5 border-primary/20 text-primary" onClick={() => setIsAddingPayment(v => !v)}>
                <Plus className="w-3 h-3 mr-1" /> Abonar
              </Button>
            )}
          </div>

          {/* Add payment form */}
          {isAddingPayment && (
            <div className="p-4 rounded-xl bg-primary/5 border border-primary/20 space-y-4 animate-in fade-in slide-in-from-top-4 duration-200">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-bold text-primary/70">Monto del Abono</Label>
                  <div className="flex items-center gap-1.5">
                    <Checkbox
                      id="full-pay"
                      checked={isFullPayment}
                      onCheckedChange={(c) => {
                        setIsFullPayment(c as boolean);
                        if (c) setNewPayment(p => ({ ...p, amount: actualBalance.toString() }));
                      }}
                    />
                    <label htmlFor="full-pay" className="text-[10px] font-medium cursor-pointer">Saldo total</label>
                  </div>
                </div>
                <Input
                  type="number"
                  inputMode="decimal"
                  placeholder={actualBalance.toString()}
                  value={newPayment.amount}
                  onChange={e => { setNewPayment(p => ({ ...p, amount: e.target.value })); setIsFullPayment(false); }}
                  className="h-12 font-bold tabular-nums text-lg"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-primary/70">Método</Label>
                  <Select value={newPayment.method} onValueChange={val => setNewPayment(p => ({ ...p, method: val }))}>
                    <SelectTrigger className="h-10"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="bank_transfer">Transferencia</SelectItem>
                      <SelectItem value="sinpe_movil">SINPE Móvil</SelectItem>
                      <SelectItem value="cash">Efectivo</SelectItem>
                      <SelectItem value="other">Otro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-primary/70">Fecha</Label>
                  <PremiumDatePicker date={newPayment.date} onSelect={d => d && setNewPayment(p => ({ ...p, date: d }))} />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-primary/70">Referencia (Opcional)</Label>
                <Input placeholder="# comprobante..." value={newPayment.reference} onChange={e => setNewPayment(p => ({ ...p, reference: e.target.value }))} />
              </div>

              <div className="flex gap-2">
                <Button className="flex-1 h-11" onClick={handleSubmit} disabled={isProcessing}>
                  {isProcessing && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                  Registrar Abono
                </Button>
                <Button variant="ghost" className="h-11" onClick={() => setIsAddingPayment(false)}>Cancelar</Button>
              </div>
            </div>
          )}

          {/* History list */}
          <div className="space-y-2 max-h-[280px] overflow-y-auto">
            {!(invoice.payments?.length) && !isAddingPayment && (
              <div className="py-8 text-center border border-dashed rounded-xl bg-background/50">
                <p className="text-xs text-muted-foreground">Sin abonos registrados.</p>
              </div>
            )}
            {invoice.payments?.slice().sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime()).map((p: any, i: number) => (
              <div key={p.id} className="p-3 rounded-xl border border-border/50 bg-background flex items-center justify-between gap-2 group hover:border-primary/20 transition-colors">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="w-6 h-6 rounded-full bg-emerald-500/10 text-emerald-600 font-black text-[10px] flex items-center justify-center shrink-0">
                    {(invoice.payments.length) - i}
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-bold tabular-nums">{formatCurrency(p.amount)}</p>
                    <p className="text-[10px] text-muted-foreground truncate">
                      {format(parseISO(p.date), 'dd MMM yyyy', { locale: es })}
                      {p.reference && ` · ${p.reference}`}
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-destructive opacity-0 group-hover:opacity-100 hover:bg-destructive/10 shrink-0 transition-opacity"
                  onClick={() => onDeletePayment(p.id)}
                  disabled={isProcessing}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
