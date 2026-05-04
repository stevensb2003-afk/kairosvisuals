'use client';

import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Loader2, Package, Plus, Trash2 } from 'lucide-react';
import { ServiceFormData } from '../_hooks/useServicesData';
import { formatCurrency } from '@/lib/utils';

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  editingId: string | null;
  formData: ServiceFormData;
  setFormData: React.Dispatch<React.SetStateAction<ServiceFormData>>;
  newPackage: { name: string; units: number; price: number };
  setNewPackage: React.Dispatch<React.SetStateAction<{ name: string; units: number; price: number }>>;
  ivaTypes: any[];
  isSubmitting: boolean;
  onSubmit: () => Promise<void>;
}

export function ServiceFormDialog({
  open, onOpenChange, editingId, formData, setFormData,
  newPackage, setNewPackage, ivaTypes, isSubmitting, onSubmit,
}: Props) {
  const set = (key: keyof ServiceFormData, value: any) =>
    setFormData(p => ({ ...p, [key]: value }));

  const handleAddPackage = () => {
    if (!newPackage.name.trim() || newPackage.units <= 0) return;
    set('packages', [...formData.packages, { ...newPackage }]);
    setNewPackage({ name: '', units: 1, price: 0 });
  };

  const handleRemovePackage = (i: number) =>
    set('packages', formData.packages.filter((_, idx) => idx !== i));

  const handleSurcharge = (i: number, val: string) => {
    const tiers = [...formData.complexityTiers];
    tiers[i] = { ...tiers[i], surcharge: val === '' ? 0 : parseFloat(val) || 0 };
    set('complexityTiers', tiers);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] flex flex-col max-h-[92dvh] p-0">
        <form onSubmit={handleSubmit} className="flex flex-col h-full overflow-hidden">
          <DialogHeader className="px-5 pt-5 pb-2">
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <Package className="w-4 h-4 text-primary" />
              </div>
              {editingId ? 'Editar Servicio' : 'Nuevo Servicio'}
            </DialogTitle>
            <DialogDescription className="text-xs">
              Configura los detalles del servicio, modelo de cobro y variantes.
            </DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="general" className="flex-1 flex flex-col overflow-hidden">
            <div className="px-5 border-b">
              <TabsList className="bg-transparent h-11 w-full justify-start gap-2 p-0">
                {['general', 'pricing', 'matrix'].map(tab => (
                  <TabsTrigger
                    key={tab}
                    value={tab}
                    className="text-xs data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none shadow-none h-11"
                  >
                    {tab === 'general' ? 'General' : tab === 'pricing' ? 'Precios' : 'Complejidad'}
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-4">
              {/* ── Tab: General ──────────────────────────────────────────── */}
              <TabsContent value="general" className="mt-0 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      Nombre *
                    </Label>
                    <Input
                      value={formData.name}
                      onChange={e => set('name', e.target.value)}
                      required
                      placeholder="Ej. Sesión de Fotografía"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      Color
                    </Label>
                    <div className="flex gap-2">
                      <Input
                        type="color" value={formData.color}
                        onChange={e => set('color', e.target.value)}
                        className="w-10 h-10 p-1 shrink-0"
                      />
                      <Input
                        value={formData.color}
                        onChange={e => set('color', e.target.value)}
                        className="flex-1"
                      />
                    </div>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Descripción
                  </Label>
                  <Textarea
                    value={formData.description}
                    onChange={e => set('description', e.target.value)}
                    rows={3}
                    placeholder="Breve descripción del servicio..."
                  />
                </div>
              </TabsContent>

              {/* ── Tab: Precios ──────────────────────────────────────────── */}
              <TabsContent value="pricing" className="mt-0 space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-sm font-bold">Tipo de Unidad</Label>
                    <Select value={formData.unitType} onValueChange={v => set('unitType', v)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="unit">Unidad / Pieza</SelectItem>
                        <SelectItem value="session">Sesión / Día</SelectItem>
                        <SelectItem value="package">Paquete Completo</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-sm font-bold">Modelo de Cobro</Label>
                    <Select value={formData.pricingModel} onValueChange={v => set('pricingModel', v)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="fixed">Precio Fijo</SelectItem>
                        <SelectItem value="scalable">Escalable (con extras)</SelectItem>
                        <SelectItem value="package">Basado en Paquetes</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-sm font-bold">IVA Predeterminado</Label>
                  <Select
                    value={formData.ivaType}
                    onValueChange={val => {
                      const found = ivaTypes.find(t => t.id === val);
                      setFormData(p => ({ ...p, ivaType: val, ivaRate: found?.rate || 0 }));
                    }}
                  >
                    <SelectTrigger><SelectValue placeholder="Sin impuesto (0%)" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Sin impuesto (0%)</SelectItem>
                      {ivaTypes.map(iva => (
                        <SelectItem key={iva.id} value={iva.id}>{iva.name} ({iva.rate}%)</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Separator />

                {/* Fixed */}
                {formData.pricingModel === 'fixed' && (
                  <div className="space-y-1.5 animate-in fade-in slide-in-from-top-2">
                    <Label className="text-sm font-bold">Precio Base (₡)</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground">₡</span>
                      <Input
                        type="number" min="0" step="0.01" className="pl-7"
                        value={formData.basePrice === 0 ? '' : formData.basePrice}
                        onChange={e => set('basePrice', e.target.value === '' ? 0 : parseFloat(e.target.value) || 0)}
                        placeholder="0"
                      />
                    </div>
                  </div>
                )}

                {/* Scalable */}
                {formData.pricingModel === 'scalable' && (
                  <div className="space-y-3 animate-in fade-in slide-in-from-top-2">
                    <Label className="text-sm font-bold">Configuración Escalable</Label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label className="text-xs text-muted-foreground">Unidades Incluidas</Label>
                        <Input
                          type="number" min="0"
                          value={formData.includedUnits === 0 ? '' : formData.includedUnits}
                          onChange={e => set('includedUnits', e.target.value === '' ? 0 : parseInt(e.target.value) || 0)}
                          placeholder="0"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs text-muted-foreground">Precio por esas unidades (₡)</Label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">₡</span>
                          <Input
                            type="number" min="0" step="0.01" className="pl-7"
                            value={formData.basePrice === 0 ? '' : formData.basePrice}
                            onChange={e => set('basePrice', e.target.value === '' ? 0 : parseFloat(e.target.value) || 0)}
                            placeholder="0"
                          />
                        </div>
                      </div>
                      <div className="space-y-1.5 sm:col-span-2">
                        <Label className="text-xs text-muted-foreground">Precio por unidad EXTRA (₡)</Label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">₡</span>
                          <Input
                            type="number" min="0" step="0.01" className="pl-7"
                            value={formData.unitPrice === 0 ? '' : formData.unitPrice}
                            onChange={e => set('unitPrice', e.target.value === '' ? 0 : parseFloat(e.target.value) || 0)}
                            placeholder="0"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Package */}
                {formData.pricingModel === 'package' && (
                  <div className="space-y-3 animate-in fade-in slide-in-from-top-2">
                    <Label className="text-sm font-bold">Opciones de Paquete</Label>
                    {/* Input row */}
                    <div className="grid grid-cols-3 gap-2 p-3 bg-muted/30 rounded-lg border border-dashed">
                      <div className="space-y-1">
                        <Label className="text-[10px] uppercase font-bold text-muted-foreground block text-center">Nombre</Label>
                        <Input value={newPackage.name} onChange={e => setNewPackage(p => ({ ...p, name: e.target.value }))} placeholder="Ej. 70 fotos" className="h-8 text-xs" />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[10px] uppercase font-bold text-muted-foreground block text-center">Unidades</Label>
                        <Input type="number" value={newPackage.units === 0 ? '' : newPackage.units} onChange={e => setNewPackage(p => ({ ...p, units: parseInt(e.target.value) || 0 }))} placeholder="0" className="h-8 text-xs" />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[10px] uppercase font-bold text-muted-foreground block text-center">Precio ₡</Label>
                        <div className="flex gap-1">
                          <Input type="number" value={newPackage.price === 0 ? '' : newPackage.price} onChange={e => setNewPackage(p => ({ ...p, price: parseFloat(e.target.value) || 0 }))} placeholder="0" className="h-8 text-xs flex-1" />
                          <Button type="button" size="sm" className="h-8 px-2" onClick={handleAddPackage}>
                            <Plus className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                    {/* Package list */}
                    <div className="space-y-2">
                      {formData.packages.map((pkg, i) => (
                        <div key={i} className="flex items-center justify-between p-2.5 border rounded-lg bg-card">
                          <div className="flex items-center gap-3">
                            <span className="font-semibold text-sm">{pkg.name}</span>
                            <Badge variant="secondary" className="text-xs">{pkg.units} und.</Badge>
                            <span className="font-bold text-primary text-sm">{formatCurrency(pkg.price)}</span>
                          </div>
                          <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleRemovePackage(i)}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </TabsContent>

              {/* ── Tab: Complejidad ──────────────────────────────────────── */}
              <TabsContent value="matrix" className="mt-0 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-sm font-bold">Matriz de Complejidad</Label>
                    <p className="text-xs text-muted-foreground mt-0.5">Recargos según nivel de dificultad.</p>
                  </div>
                  <Switch
                    checked={formData.useComplexityMatrix}
                    onCheckedChange={v => set('useComplexityMatrix', v)}
                  />
                </div>
                {formData.useComplexityMatrix && (
                  <div className="grid gap-3 animate-in fade-in slide-in-from-top-2">
                    {formData.complexityTiers.map((tier, i) => (
                      <div key={i} className="flex items-center gap-3 p-3 border rounded-xl bg-card">
                        <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary shrink-0">
                          {i + 1}
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold text-sm">{tier.name}</p>
                        </div>
                        <div className="w-32">
                          <div className="relative">
                            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">₡</span>
                            <Input
                              type="number"
                              value={tier.surcharge === 0 ? '' : tier.surcharge}
                              onChange={e => handleSurcharge(i, e.target.value)}
                              placeholder="0"
                              className="pl-6 h-8 text-sm"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>
            </div>
          </Tabs>

          <DialogFooter className="px-5 py-4 border-t bg-muted/30">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting || !formData.name} className="min-w-[120px]">
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editingId ? 'Guardar Cambios' : 'Crear Servicio'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
