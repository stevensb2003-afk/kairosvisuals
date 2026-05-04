'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, Layers, Package } from 'lucide-react';
import { formatCurrency, cn } from '@/lib/utils';
import type { QuoteItem, CompanySettings } from '@/app/solicitudes/_hooks/useQuoteBuilder';
import type { ProductOrService } from '@/lib/types';

interface QuoteItemsTableProps {
  items: QuoteItem[];
  itemCalculations: any[];
  services: ProductOrService[];
  companySettings: CompanySettings;
  isReadOnly: boolean;
  subtotal: number;
  totalDiscounts: number;
  globalDiscountType: 'percentage' | 'amount';
  globalDiscountValue: number;
  globalDiscountAmount: number;
  ivaAmount: number;
  totalAmount: number;
  onAddItem: () => void;
  onRemoveItem: (id: string) => void;
  onUpdateItem: (id: string, field: keyof QuoteItem, value: any) => void;
  onOpenPlanLoader: () => void;
  onGlobalDiscountTypeToggle: () => void;
  onGlobalDiscountValueChange: (val: number) => void;
}

export function QuoteItemsTable({
  items, itemCalculations, services, companySettings, isReadOnly,
  subtotal, totalDiscounts, globalDiscountType, globalDiscountValue, globalDiscountAmount,
  ivaAmount, totalAmount,
  onAddItem, onRemoveItem, onUpdateItem, onOpenPlanLoader,
  onGlobalDiscountTypeToggle, onGlobalDiscountValueChange,
}: QuoteItemsTableProps) {
  return (
    <Card className="mb-4 sm:mb-6">
      <CardHeader className="flex flex-row items-start justify-between gap-3 pb-3">
        <div className="flex-1 min-w-0">
          <CardTitle className="text-sm sm:text-base">Ítems y Servicios</CardTitle>
          <CardDescription className="text-xs mt-0.5 hidden sm:block">
            Extrae precios del catálogo o crea ítems personalizados.
          </CardDescription>
        </div>
        {!isReadOnly && (
          <div className="flex gap-2 shrink-0">
            <Button
              id="btn-load-plan"
              onClick={onOpenPlanLoader}
              size="sm"
              variant="outline"
              className="h-8 text-xs gap-1.5 border-primary/20 text-primary hover:bg-primary/5"
            >
              <Layers className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Cargar Plan</span>
            </Button>
            <Button
              id="btn-add-item"
              onClick={onAddItem}
              size="sm"
              variant="secondary"
              className="h-8 text-xs gap-1.5"
            >
              <Plus className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Agregar Fila</span>
              <span className="sm:hidden">Add</span>
            </Button>
          </div>
        )}
      </CardHeader>

      <CardContent>
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 border-2 border-dashed rounded-xl text-center gap-3">
            <Package className="h-10 w-10 text-muted-foreground/30" />
            <p className="text-sm text-muted-foreground">
              {isReadOnly ? 'Esta propuesta no tiene ítems.' : 'Agrega servicios o carga un plan predefinido.'}
            </p>
            {!isReadOnly && (
              <Button variant="outline" size="sm" onClick={onAddItem} className="gap-1.5 text-xs">
                <Plus className="h-3.5 w-3.5" /> Agregar primer ítem
              </Button>
            )}
          </div>
        ) : (
          <>
            {/* Desktop table (md+) */}
            <div className="hidden md:block rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[240px] text-xs">Servicio</TableHead>
                    <TableHead className="min-w-[180px] text-xs">Descripción</TableHead>
                    <TableHead className="w-[70px] text-right text-xs">Cant.</TableHead>
                    <TableHead className="w-[110px] text-right text-xs">Precio</TableHead>
                    <TableHead className="w-[100px] text-right text-xs">IVA</TableHead>
                    <TableHead className="w-[160px] text-right text-xs">Descuento</TableHead>
                    <TableHead className="w-[110px] text-right text-xs">Total</TableHead>
                    <TableHead className="w-[40px]" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {itemCalculations.map(item => {
                    const service = services.find(s => s.id === item.serviceId);
                    const hasConfig = service && (
                      service.pricingModel === 'scalable' ||
                      service.pricingModel === 'package' ||
                      service.useComplexityMatrix
                    );
                    return (
                      <React.Fragment key={item.id}>
                        <TableRow className={hasConfig ? 'border-b-0' : ''}>
                          <TableCell className="align-top py-2">
                            <Select
                              value={item.serviceId}
                              onValueChange={val => onUpdateItem(item.id, 'serviceId', val)}
                              disabled={isReadOnly}
                            >
                              <SelectTrigger className="h-8 text-xs">
                                <SelectValue placeholder="Seleccionar..." />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="custom">Personalizado</SelectItem>
                                {services.map(s => (
                                  <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell className="align-top py-2">
                            <Input
                              value={item.description}
                              onChange={e => onUpdateItem(item.id, 'description', e.target.value)}
                              placeholder="Detalle..."
                              className="h-8 text-xs"
                              disabled={isReadOnly}
                            />
                          </TableCell>
                          <TableCell className="align-top py-2">
                            <Input
                              type="number"
                              min="1"
                              value={item.quantity}
                              onChange={e => onUpdateItem(item.id, 'quantity', parseFloat(e.target.value) || 0)}
                              className="text-right h-8 text-xs"
                              disabled={isReadOnly || (item.serviceId !== 'custom' && service?.pricingModel !== 'fixed')}
                            />
                          </TableCell>
                          <TableCell className="align-top py-2">
                            <Input
                              type="number"
                              min="0"
                              value={item.unitPrice}
                              onChange={e => onUpdateItem(item.id, 'unitPrice', parseFloat(e.target.value) || 0)}
                              className="text-right h-8 text-xs"
                              disabled={isReadOnly || (item.serviceId !== 'custom' && service?.pricingModel !== 'fixed')}
                            />
                          </TableCell>
                          <TableCell className="align-top py-2">
                            <Select
                              value={item.ivaType || 'none'}
                              onValueChange={val => onUpdateItem(item.id, 'ivaType', val)}
                              disabled={isReadOnly}
                            >
                              <SelectTrigger className="h-8 px-2 text-xs">
                                <SelectValue placeholder="IVA" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="none">0%</SelectItem>
                                {companySettings?.ivaTypes?.filter((t: any) => t.isActive).map((t: any) => (
                                  <SelectItem key={t.id} value={t.id}>{t.rate}%</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell className="align-top py-2">
                            <div className="flex gap-1">
                              <Input
                                type="number"
                                min="0"
                                value={item.discountValue || 0}
                                onChange={e => onUpdateItem(item.id, 'discountValue', parseFloat(e.target.value) || 0)}
                                className="text-right h-8 text-xs flex-1"
                                disabled={isReadOnly}
                              />
                              <Button
                                variant="outline"
                                size="icon"
                                className="h-8 w-8 shrink-0 text-xs"
                                onClick={() => onUpdateItem(item.id, 'discountType', item.discountType === 'percentage' ? 'amount' : 'percentage')}
                                disabled={isReadOnly}
                              >
                                {item.discountType === 'percentage' ? '%' : '₡'}
                              </Button>
                            </div>
                          </TableCell>
                          <TableCell className="text-right font-semibold text-sm align-middle">
                            {formatCurrency(item.total)}
                          </TableCell>
                          <TableCell className="align-top py-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive hover:bg-destructive/10"
                              onClick={() => onRemoveItem(item.id)}
                              disabled={isReadOnly}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </TableCell>
                        </TableRow>

                        {/* Config sub-row */}
                        {hasConfig && (
                          <TableRow className="bg-primary/5 border-t border-primary/10">
                            <TableCell colSpan={8} className="py-2 px-4">
                              <div className="flex flex-wrap gap-4 items-center">
                                {service.pricingModel === 'scalable' && (
                                  <div className="flex items-center gap-2">
                                    <Layers className="h-3.5 w-3.5 text-primary" />
                                    <Label className="text-[10px] font-bold text-primary/70 uppercase tracking-wider">
                                      Unidades:
                                    </Label>
                                    <Input
                                      type="number"
                                      min="1"
                                      value={item.overriddenQuantity || 1}
                                      onChange={e => onUpdateItem(item.id, 'overriddenQuantity', parseInt(e.target.value) || 1)}
                                      className="h-7 w-20 bg-background/50 text-xs"
                                      disabled={isReadOnly}
                                    />
                                    <span className="text-xs text-muted-foreground">
                                      Base: {service.includedUnits} · Extra: +{formatCurrency(service.unitPrice || 0)}/u
                                    </span>
                                  </div>
                                )}

                                {service.pricingModel === 'package' && (service.packages || []).length > 0 && (
                                  <div className="flex items-center gap-2">
                                    <Package className="h-3.5 w-3.5 text-primary" />
                                    <Label className="text-[10px] font-bold text-primary/70 uppercase tracking-wider">
                                      Paquete:
                                    </Label>
                                    <Select
                                      value={item.selectedPackage || ''}
                                      onValueChange={val => onUpdateItem(item.id, 'selectedPackage', val)}
                                      disabled={isReadOnly}
                                    >
                                      <SelectTrigger className="h-7 w-40 text-xs bg-background/50">
                                        <SelectValue placeholder="Elegir..." />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {service.packages!.map(p => (
                                          <SelectItem key={p.name} value={p.name}>
                                            {p.name} — {formatCurrency(p.price)}
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  </div>
                                )}

                                {service.useComplexityMatrix && (service.complexityTiers || []).length > 0 && (
                                  <div className="flex items-center gap-2">
                                    <Layers className="h-3.5 w-3.5 text-primary" />
                                    <Label className="text-[10px] font-bold text-primary/70 uppercase tracking-wider">
                                      Complejidad:
                                    </Label>
                                    <Select
                                      value={item.selectedComplexityLevel?.toString() || ''}
                                      onValueChange={val => onUpdateItem(item.id, 'selectedComplexityLevel', parseInt(val) || 1)}
                                      disabled={isReadOnly}
                                    >
                                      <SelectTrigger className="h-7 w-44 text-xs bg-background/50">
                                        <SelectValue placeholder="Nivel..." />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {service.complexityTiers!.map(t => (
                                          <SelectItem key={t.level} value={t.level.toString()}>
                                            Lvl {t.level}: {t.name} (+{formatCurrency(t.surcharge)})
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  </div>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        )}
                      </React.Fragment>
                    );
                  })}
                </TableBody>
              </Table>
            </div>

            {/* Mobile card list (< md) */}
            <div className="md:hidden space-y-3">
              {itemCalculations.map(item => {
                const service = services.find(s => s.id === item.serviceId);
                return (
                  <div key={item.id} className="rounded-lg border border-border p-3 space-y-3 bg-card">
                    {/* Service + delete */}
                    <div className="flex items-start gap-2">
                      <div className="flex-1">
                        <Select
                          value={item.serviceId}
                          onValueChange={val => onUpdateItem(item.id, 'serviceId', val)}
                          disabled={isReadOnly}
                        >
                          <SelectTrigger className="h-8 text-xs">
                            <SelectValue placeholder="Seleccionar servicio..." />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="custom">Personalizado</SelectItem>
                            {services.map(s => (
                              <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      {!isReadOnly && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 shrink-0 text-destructive"
                          onClick={() => onRemoveItem(item.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>

                    {/* Description */}
                    <Input
                      value={item.description}
                      onChange={e => onUpdateItem(item.id, 'description', e.target.value)}
                      placeholder="Descripción del servicio..."
                      className="h-8 text-xs"
                      disabled={isReadOnly}
                    />

                    {/* Qty + Price row */}
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <Label className="text-[10px] text-muted-foreground">Cantidad</Label>
                        <Input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={e => onUpdateItem(item.id, 'quantity', parseFloat(e.target.value) || 0)}
                          className="h-8 text-xs text-right"
                          disabled={isReadOnly || (item.serviceId !== 'custom' && service?.pricingModel !== 'fixed')}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[10px] text-muted-foreground">Precio</Label>
                        <Input
                          type="number"
                          min="0"
                          value={item.unitPrice}
                          onChange={e => onUpdateItem(item.id, 'unitPrice', parseFloat(e.target.value) || 0)}
                          className="h-8 text-xs text-right"
                          disabled={isReadOnly || (item.serviceId !== 'custom' && service?.pricingModel !== 'fixed')}
                        />
                      </div>
                    </div>

                    {/* IVA + Discount */}
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <Label className="text-[10px] text-muted-foreground">IVA</Label>
                        <Select
                          value={item.ivaType || 'none'}
                          onValueChange={val => onUpdateItem(item.id, 'ivaType', val)}
                          disabled={isReadOnly}
                        >
                          <SelectTrigger className="h-8 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">0%</SelectItem>
                            {companySettings?.ivaTypes?.filter((t: any) => t.isActive).map((t: any) => (
                              <SelectItem key={t.id} value={t.id}>{t.rate}%</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[10px] text-muted-foreground">Descuento</Label>
                        <div className="flex gap-1">
                          <Input
                            type="number"
                            min="0"
                            value={item.discountValue || 0}
                            onChange={e => onUpdateItem(item.id, 'discountValue', parseFloat(e.target.value) || 0)}
                            className="h-8 text-xs text-right flex-1"
                            disabled={isReadOnly}
                          />
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8 shrink-0 text-xs"
                            onClick={() => onUpdateItem(item.id, 'discountType', item.discountType === 'percentage' ? 'amount' : 'percentage')}
                            disabled={isReadOnly}
                          >
                            {item.discountType === 'percentage' ? '%' : '₡'}
                          </Button>
                        </div>
                      </div>
                    </div>

                    {/* Total line */}
                    <div className="flex justify-between items-center pt-1 border-t border-border/50">
                      <span className="text-xs text-muted-foreground">Total línea</span>
                      <span className="font-bold text-sm">{formatCurrency(item.total)}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Totals panel — right-aligned on lg, full-width on mobile */}
            <div className="mt-6 flex justify-end">
              <div className="w-full max-w-xs space-y-2.5 rounded-xl border border-border bg-muted/20 p-4">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="font-medium">{formatCurrency(subtotal)}</span>
                </div>

                {totalDiscounts > 0 && (
                  <div className="flex justify-between text-sm text-destructive">
                    <span>Desc. en líneas</span>
                    <span>- {formatCurrency(totalDiscounts)}</span>
                  </div>
                )}

                {/* Global discount toggle input */}
                <div className="flex items-center justify-between gap-2 text-sm">
                  <div className="flex items-center gap-1.5">
                    <span className="text-muted-foreground">Desc. Global</span>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-6 w-6 text-xs"
                      onClick={onGlobalDiscountTypeToggle}
                      disabled={isReadOnly}
                    >
                      {globalDiscountType === 'percentage' ? '%' : '₡'}
                    </Button>
                  </div>
                  <Input
                    id="input-global-discount"
                    type="number"
                    min="0"
                    value={globalDiscountValue}
                    onChange={e => onGlobalDiscountValueChange(parseFloat(e.target.value) || 0)}
                    className="h-7 w-24 text-right text-xs"
                    disabled={isReadOnly}
                  />
                </div>

                {globalDiscountAmount > 0 && (
                  <div className="flex justify-between text-sm text-destructive">
                    <span>Ahorro global</span>
                    <span>- {formatCurrency(globalDiscountAmount)}</span>
                  </div>
                )}

                {ivaAmount > 0 && (
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>IVA</span>
                    <span>{formatCurrency(ivaAmount)}</span>
                  </div>
                )}

                <Separator />

                <div className="flex justify-between text-base font-bold text-primary">
                  <span>Total Propuesta</span>
                  <span>{formatCurrency(totalAmount)}</span>
                </div>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
