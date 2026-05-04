import React from 'react';
import { InvoiceItemCard } from './InvoiceItemCard';
import { Layers, Zap, Plus, Trash2, Settings, Info } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from "@/components/ui/textarea";
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn, formatCurrency } from '@/lib/utils';
import { InvoiceLineItem } from '../../_hooks/useInvoiceForm';

interface InvoiceItemsTableProps {
  items: any[];
  services: any[];
  settings: any;
  updateItem: (id: string, field: keyof InvoiceLineItem, value: any) => void;
  removeItem: (id: string) => void;
  addItem: () => void;
  onOpenPlanLoader: () => void;
}

export function InvoiceItemsTable({
  items,
  services,
  settings,
  updateItem,
  removeItem,
  addItem,
  onOpenPlanLoader
}: InvoiceItemsTableProps) {
  return (
    <Card className="border-border/40 shadow-sm overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
          <Layers className="w-4 h-4" /> Ítems de la Factura
        </CardTitle>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onOpenPlanLoader}
            className="h-8 border-primary/20 hover:border-primary/50 text-primary"
          >
            <Zap className="w-3.5 h-3.5 mr-1.5 fill-current" /> Cargar Plan
          </Button>
          <Button variant="outline" size="sm" onClick={addItem} className="h-8">
            <Plus className="w-4 h-4 mr-1.5" /> Agregar Ítem
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {/* ── Mobile: card stack ── */}
        <div className="block sm:hidden divide-y divide-border/30">
          {items.map((item, idx) => (
            <InvoiceItemCard
              key={item.id}
              item={item}
              index={idx}
              services={services}
              settings={settings}
              updateItem={updateItem}
              removeItem={removeItem}
            />
          ))}
          <div className="p-4">
            <Button variant="outline" className="w-full h-11 gap-2 text-primary border-dashed border-primary/30" onClick={addItem}>
              <Plus className="w-4 h-4" /> Agregar Ítem
            </Button>
          </div>
        </div>

        {/* ── Desktop: table ── */}
        <div className="hidden sm:block">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead className="w-[20%]">Servicio</TableHead>
              <TableHead className="w-[25%]">Descripción</TableHead>
              <TableHead className="text-center w-20">Cant.</TableHead>
              <TableHead className="text-right w-28">Precio Unit.</TableHead>
              <TableHead className="text-right w-36">Descuento</TableHead>
              <TableHead className="text-right w-28">IVA</TableHead>
              <TableHead className="text-right w-28">Total</TableHead>
              <TableHead className="w-10"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item) => {
              const svc = services?.find(s => s.id === item.serviceId);
              const isManual = !item.serviceId;
              const canEditPrice = isManual;
              const canEditQuantity = isManual || svc?.pricingModel === 'scalable';

              return (
                <React.Fragment key={item.id}>
                  <TableRow className="group hover:bg-muted/30 border-b-0">
                    <TableCell className="py-3 px-2 align-top">
                      <Select
                        value={item.serviceId || 'manual'}
                        onValueChange={(val) => updateItem(item.id, 'serviceId', val)}
                      >
                        <SelectTrigger className="h-8 text-[11px] bg-background">
                          <SelectValue placeholder="Servicio de catálogo..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="manual">Manual / Libre</SelectItem>
                          <Separator className="my-1" />
                          <ScrollArea className="h-48">
                            {services?.map(s => (
                              <SelectItem key={s.id} value={s.id} className="text-xs">
                                <div className="flex items-center gap-2">
                                  <Badge className="w-1.5 h-1.5 p-0 rounded-full" style={{ backgroundColor: s.color || '#ccc' }} />
                                  {s.name}
                                </div>
                              </SelectItem>
                            ))}
                          </ScrollArea>
                        </SelectContent>
                      </Select>
                    </TableCell>

                    <TableCell className="py-3 px-2 align-top">
                      <Textarea
                        value={item.description}
                        onChange={(e) => updateItem(item.id, 'description', e.target.value)}
                        placeholder="Descripción detallada del servicio..."
                        className="min-h-[32px] h-8 py-1.5 resize-y text-xs border-dashed focus-visible:border-solid"
                      />
                    </TableCell>

                    <TableCell className="py-3 px-1 align-top">
                      <Input
                        type="number"
                        value={item.quantity === 0 ? "" : item.quantity}
                        disabled={!canEditQuantity && !isManual}
                        onChange={(e) => updateItem(item.id, 'quantity', e.target.value === '' ? 0 : parseFloat(e.target.value) || 0)}
                        placeholder="0"
                        className="h-8 text-xs text-center font-medium"
                      />
                    </TableCell>

                    <TableCell className="py-3 px-1">
                      <div className="relative group/price">
                        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] font-bold text-muted-foreground opacity-50">₡</span>
                        <Input
                          type="number"
                          value={item.unitPrice === 0 ? "" : item.unitPrice}
                          disabled={!canEditPrice}
                          onChange={(e) => updateItem(item.id, 'unitPrice', e.target.value === '' ? 0 : parseFloat(e.target.value) || 0)}
                          placeholder="0"
                          className={cn(
                            "h-8 text-xs pl-6 text-right tabular-nums",
                            !canEditPrice && "bg-muted/20 font-bold border-none"
                          )}
                        />
                      </div>
                    </TableCell>
                    <TableCell className="py-3 px-1">
                      <div className="flex items-center gap-1">
                        <div className="relative flex-1">
                          {item.discountType === 'amount' && (
                            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] font-bold text-muted-foreground opacity-50">₡</span>
                          )}
                          <Input
                            type="number"
                            value={item.discountValue === 0 ? "" : item.discountValue}
                            onChange={(e) => updateItem(item.id, 'discountValue', e.target.value === '' ? 0 : parseFloat(e.target.value) || 0)}
                            placeholder="0"
                            className={cn(
                              "h-8 text-[11px] text-right text-red-500 font-medium bg-red-50/20",
                              item.discountType === 'amount' ? "pl-6" : "pr-6"
                            )}
                          />
                          {item.discountType === 'percentage' && (
                            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-red-500 font-bold">%</span>
                          )}
                        </div>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8 shrink-0 hover:bg-red-50 hover:text-red-500 border-dashed"
                          onClick={() => updateItem(item.id, 'discountType', item.discountType === 'amount' ? 'percentage' : 'amount')}
                        >
                          {item.discountType === 'amount' ? '₡' : '%'}
                        </Button>
                      </div>
                    </TableCell>

                    <TableCell className="py-3 px-1">
                      <Select
                        value={item.ivaType || 'none'}
                        onValueChange={(val) => updateItem(item.id, 'ivaType', val)}
                      >
                        <SelectTrigger className="h-8 text-[10px] bg-background border-dashed">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none" className="text-[10px]">Exento</SelectItem>
                          {settings?.ivaTypes?.filter((t: any) => t.isActive).map((iva: any) => (
                            <SelectItem key={iva.id} value={iva.id} className="text-[10px]">
                              {iva.name} ({iva.rate}%)
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>

                    <TableCell className="py-3 text-right">
                      <p className="text-xs font-black tabular-nums">{formatCurrency(item.total)}</p>
                    </TableCell>

                    <TableCell className="py-3">
                      <Button variant="ghost" size="icon" onClick={() => removeItem(item.id)} className="h-7 w-7 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity">
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </TableCell>
                  </TableRow>

                  {!isManual && (svc?.useComplexityMatrix || svc?.pricingModel === 'scalable') && (
                    <TableRow className="bg-primary/[0.02] border-b border-border/10">
                      <TableCell colSpan={7} className="py-1 px-4">
                        <div className="flex flex-wrap items-center gap-4 py-1.5 animate-in slide-in-from-left-2 duration-300">
                          <div className="flex items-center gap-2">
                            <Settings className="w-3 h-3 text-primary/60" />
                            <span className="text-[10px] font-bold uppercase tracking-widest text-primary/60">Configuración:</span>
                          </div>

                          {svc.useComplexityMatrix && (
                            <div className="flex items-center gap-1.5">
                              <span className="text-[10px] text-muted-foreground whitespace-nowrap">Complejidad:</span>
                              <Select
                                value={String(item.selectedComplexityLevel)}
                                onValueChange={(val) => updateItem(item.id, 'selectedComplexityLevel', parseInt(val))}
                              >
                                <SelectTrigger className="h-6 text-[10px] w-32 bg-background border-primary/20 hover:border-primary">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {svc.complexityTiers?.map((t: any) => (
                                    <SelectItem key={t.level} value={String(t.level)} className="text-[10px]">
                                      {t.name} (+{formatCurrency(t.surcharge)})
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          )}

                          {svc.pricingModel === 'scalable' && (
                            <div className="flex items-center gap-1.5">
                              <span className="text-[10px] text-muted-foreground whitespace-nowrap">Unidades Totales:</span>
                              <Input
                                type="number"
                                value={item.overriddenQuantity === 0 ? "" : (item.overriddenQuantity || svc.includedUnits || 0)}
                                onChange={(e) => updateItem(item.id, 'overriddenQuantity', e.target.value === '' ? 0 : parseInt(e.target.value) || 0)}
                                placeholder="0"
                                className="h-6 w-16 text-[10px] text-center border-primary/20 hover:border-primary"
                              />
                              <span className="text-[10px] text-muted-foreground italic">
                                ({svc.includedUnits} incl. + {Math.max(0, (item.overriddenQuantity || 0) - (svc.includedUnits || 0))} extra)
                              </span>
                            </div>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                  <TableRow className="h-0 border-none p-0">
                    <TableCell colSpan={6} className="h-px border-b border-border/10 p-0" />
                  </TableRow>
                </React.Fragment>
              );
            })}
          </TableBody>
        </Table>
        </div>
      </CardContent>
      <CardFooter className="bg-muted/20 py-3 border-t flex justify-between">
        <p className="text-[10px] text-muted-foreground italic flex items-center gap-1">
          <Info className="w-3 h-3" /> Tip: Los cambios en la configuración actualizan el precio base automáticamente.
        </p>
        <Button variant="ghost" size="sm" onClick={addItem} className="h-8 text-primary">
          <Plus className="w-3.5 h-3.5 mr-1" /> Nuevo Ítem
        </Button>
      </CardFooter>
    </Card>
  );
}
