import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { formatCurrency } from '@/lib/utils';

interface InvoiceSummaryProps {
  totalBeforeGlobalDiscount: number;
  totalDiscounts: number;
  globalDiscountType: 'percentage' | 'amount';
  globalDiscountValue: number;
  setGlobalDiscountType: (type: 'percentage' | 'amount') => void;
  setGlobalDiscountValue: (value: number) => void;
  ivaAmount: number;
  totalAmount: number;
  subtotalAmount: number;
}

export function InvoiceSummary({
  totalBeforeGlobalDiscount,
  totalDiscounts,
  globalDiscountType,
  globalDiscountValue,
  setGlobalDiscountType,
  setGlobalDiscountValue,
  ivaAmount,
  totalAmount,
  subtotalAmount
}: InvoiceSummaryProps) {
  return (
    <Card className="border-border/40 shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Resumen de Totales</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Subtotal Base:</span>
            <span className="font-medium tabular-nums">{formatCurrency(totalBeforeGlobalDiscount)}</span>
          </div>

          {totalDiscounts > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Descuentos por Ítem:</span>
              <span className="font-medium text-red-500 tabular-nums">-{formatCurrency(totalDiscounts)}</span>
            </div>
          )}

          <div className="flex justify-between text-sm items-center">
            <div className="flex items-center gap-1.5">
              <span className="text-muted-foreground">Descuento Global:</span>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={() => setGlobalDiscountType(globalDiscountType === 'percentage' ? 'amount' : 'percentage')}
              >
                {globalDiscountType === 'percentage' ? '%' : '₡'}
              </Button>
              <div className="flex items-center gap-1 bg-muted rounded-md px-1 py-0.5">
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={globalDiscountValue}
                  onChange={(e) => setGlobalDiscountValue(parseFloat(e.target.value) || 0)}
                  className="h-6 w-16 p-1 text-xs border-none bg-transparent text-right font-bold focus-visible:ring-0"
                />
              </div>
            </div>
            <span className="font-medium text-red-500 tabular-nums">
              -{formatCurrency(globalDiscountType === 'percentage' ? (totalBeforeGlobalDiscount * globalDiscountValue / 100) : globalDiscountValue)}
            </span>
          </div>

          <div className="pt-2 border-t border-dashed">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground font-medium">Subtotal Gravable:</span>
              <span className="font-bold tabular-nums">{formatCurrency(subtotalAmount)}</span>
            </div>
            <div className="flex justify-between text-sm mt-1">
              <span className="text-muted-foreground">IVA (Calculado):</span>
              <span className="font-medium tabular-nums">{formatCurrency(ivaAmount)}</span>
            </div>
          </div>
        </div>

        <div className="pt-3 border-t-2 border-primary/20">
          <div className="flex justify-between items-end">
            <div className="space-y-0.5">
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Total a Cobrar</p>
              <p className="text-3xl font-black text-primary tracking-tighter tabular-nums">
                {formatCurrency(totalAmount)}
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
