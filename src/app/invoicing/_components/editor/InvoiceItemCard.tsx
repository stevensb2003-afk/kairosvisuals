'use client';

import React from 'react';
import { Trash2, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { cn, formatCurrency } from '@/lib/utils';
import { InvoiceLineItem } from '../../_hooks/useInvoiceForm';

interface InvoiceItemCardProps {
  item: any;
  index: number;
  services: any[];
  settings: any;
  updateItem: (id: string, field: keyof InvoiceLineItem, value: any) => void;
  removeItem: (id: string) => void;
}

export function InvoiceItemCard({ item, index, services, settings, updateItem, removeItem }: InvoiceItemCardProps) {
  const svc = services?.find((s: any) => s.id === item.serviceId);
  const isManual = !item.serviceId || item.serviceId === 'manual';
  const canEditPrice = isManual;

  return (
    <div className="p-4 space-y-3 border-b border-border/30 last:border-0 animate-in fade-in-0 slide-in-from-top-1 duration-200">
      {/* Header: Service selector + Delete */}
      <div className="flex items-start gap-2">
        <div className="flex-1 min-w-0">
          <Select
            value={item.serviceId || 'manual'}
            onValueChange={(val) => updateItem(item.id, 'serviceId', val === 'manual' ? '' : val)}
          >
            <SelectTrigger className="h-10 text-xs bg-background w-full">
              <SelectValue placeholder="Servicio de catálogo..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="manual">Manual / Libre</SelectItem>
              <Separator className="my-1" />
              <ScrollArea className="h-44">
                {services?.map((s: any) => (
                  <SelectItem key={s.id} value={s.id} className="text-xs">
                    <div className="flex items-center gap-2">
                      <Badge className="w-1.5 h-1.5 p-0 rounded-full shrink-0" style={{ backgroundColor: s.color || '#ccc' }} />
                      {s.name}
                    </div>
                  </SelectItem>
                ))}
              </ScrollArea>
            </SelectContent>
          </Select>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-10 w-10 text-muted-foreground hover:text-destructive hover:bg-destructive/10 shrink-0"
          onClick={() => removeItem(item.id)}
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>

      {/* Description */}
      <Textarea
        value={item.description}
        onChange={(e) => updateItem(item.id, 'description', e.target.value)}
        placeholder="Descripción del servicio..."
        className="min-h-[60px] resize-y text-sm"
      />

      {/* Qty + Price */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Cantidad</p>
          <Input
            type="number"
            inputMode="decimal"
            value={item.quantity === 0 ? '' : item.quantity}
            onChange={(e) => updateItem(item.id, 'quantity', e.target.value === '' ? 0 : parseFloat(e.target.value) || 0)}
            placeholder="0"
            className="h-12 text-center font-bold text-lg"
          />
        </div>
        <div className="space-y-1.5">
          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Precio Unit.</p>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground pointer-events-none">₡</span>
            <Input
              type="number"
              inputMode="decimal"
              value={item.unitPrice === 0 ? '' : item.unitPrice}
              disabled={!canEditPrice}
              onChange={(e) => updateItem(item.id, 'unitPrice', e.target.value === '' ? 0 : parseFloat(e.target.value) || 0)}
              placeholder="0"
              className={cn('h-12 pl-7 text-right font-bold text-lg tabular-nums', !canEditPrice && 'bg-muted/20 border-none opacity-70')}
            />
          </div>
        </div>
      </div>

      {/* Discount + IVA */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Descuento</p>
          <div className="flex gap-1.5">
            <div className="relative flex-1">
              {item.discountType === 'amount' && (
                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground">₡</span>
              )}
              <Input
                type="number"
                inputMode="decimal"
                value={item.discountValue === 0 ? '' : item.discountValue}
                onChange={(e) => updateItem(item.id, 'discountValue', e.target.value === '' ? 0 : parseFloat(e.target.value) || 0)}
                placeholder="0"
                className={cn('h-10 text-right text-sm text-red-500 font-medium', item.discountType === 'amount' ? 'pl-6' : 'pr-5')}
              />
              {item.discountType === 'percentage' && (
                <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-red-500">%</span>
              )}
            </div>
            <Button
              variant="outline"
              size="icon"
              className="h-10 w-10 shrink-0 text-xs font-bold border-dashed hover:bg-red-50 hover:text-red-500"
              onClick={() => updateItem(item.id, 'discountType', item.discountType === 'amount' ? 'percentage' : 'amount')}
            >
              {item.discountType === 'amount' ? '₡' : '%'}
            </Button>
          </div>
        </div>
        <div className="space-y-1.5">
          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">IVA</p>
          <Select value={item.ivaType || 'none'} onValueChange={(val) => updateItem(item.id, 'ivaType', val)}>
            <SelectTrigger className="h-10 text-xs bg-background">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none" className="text-xs">Exento</SelectItem>
              {settings?.ivaTypes?.filter((t: any) => t.isActive).map((iva: any) => (
                <SelectItem key={iva.id} value={iva.id} className="text-xs">
                  {iva.name} ({iva.rate}%)
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Advanced config (complexity / scalable) */}
      {!isManual && (svc?.useComplexityMatrix || svc?.pricingModel === 'scalable') && (
        <div className="bg-primary/[0.04] border border-primary/10 rounded-xl p-3 space-y-3">
          <div className="flex items-center gap-1.5">
            <Settings className="w-3 h-3 text-primary/60" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-primary/60">Configuración</span>
          </div>
          {svc.useComplexityMatrix && (
            <div className="space-y-1.5">
              <p className="text-xs text-muted-foreground">Complejidad</p>
              <Select
                value={String(item.selectedComplexityLevel)}
                onValueChange={(val) => updateItem(item.id, 'selectedComplexityLevel', parseInt(val))}
              >
                <SelectTrigger className="h-9 text-xs w-full bg-background border-primary/20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {svc.complexityTiers?.map((t: any) => (
                    <SelectItem key={t.level} value={String(t.level)} className="text-xs">
                      {t.name} (+{formatCurrency(t.surcharge)})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          {svc.pricingModel === 'scalable' && (
            <div className="space-y-1.5">
              <p className="text-xs text-muted-foreground">Unidades Totales</p>
              <Input
                type="number"
                inputMode="numeric"
                value={item.overriddenQuantity === 0 ? '' : (item.overriddenQuantity || svc.includedUnits || 0)}
                onChange={(e) => updateItem(item.id, 'overriddenQuantity', e.target.value === '' ? 0 : parseInt(e.target.value) || 0)}
                className="h-9 text-xs text-center border-primary/20"
              />
              <p className="text-[10px] text-muted-foreground">
                {svc.includedUnits} incl. + {Math.max(0, (item.overriddenQuantity || 0) - (svc.includedUnits || 0))} extra
              </p>
            </div>
          )}
        </div>
      )}

      {/* Item total */}
      <div className="flex items-center justify-between pt-1 border-t border-border/30">
        <span className="text-xs text-muted-foreground">Ítem #{index + 1}</span>
        <div className="text-right">
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground leading-none mb-0.5">Total</p>
          <p className="text-xl font-black text-primary tabular-nums">{formatCurrency(item.total || 0)}</p>
        </div>
      </div>
    </div>
  );
}
