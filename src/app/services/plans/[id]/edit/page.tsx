'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ArrowLeft, Save, Plus, Trash2, Loader2, Package, Layers, Info } from "lucide-react";
import { useFirestore } from '@/firebase';
import { collection, doc, getDoc, getDocs, updateDoc, serverTimestamp } from 'firebase/firestore';
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { formatCurrency } from '@/lib/utils';
import { ProductOrService, PredefinedPlan, PlanItem } from '@/lib/types';

interface InternalPlanItem extends PlanItem {
  id: string;
}

export default function EditPlanPage() {
  const router = useRouter();
  const params = useParams();
  const planId = params.id as string;
  const firestore = useFirestore();
  const { toast } = useToast();

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [services, setServices] = useState<ProductOrService[]>([]);
  const [planName, setPlanName] = useState('');
  const [planDescription, setPlanDescription] = useState('');
  const [items, setItems] = useState<InternalPlanItem[]>([]);

  const [isPackageSelectorOpen, setIsPackageSelectorOpen] = useState(false);
  const [activeServiceForPackage, setActiveServiceForPackage] = useState<ProductOrService | null>(null);
  const [activeItemIdForPackage, setActiveItemIdForPackage] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      if (!firestore || !planId) return;
      try {
        const servicesSnap = await getDocs(collection(firestore, 'services'));
        const _services = servicesSnap.docs.map(d => ({ id: d.id, ...d.data() } as ProductOrService));
        setServices(_services);

        const planSnap = await getDoc(doc(firestore, 'predefined_plans', planId));
        if (planSnap.exists()) {
          const planData = planSnap.data() as PredefinedPlan;
          setPlanName(planData.name);
          setPlanDescription(planData.description || '');
          setItems((planData.items || []).map(item => ({ ...item, id: crypto.randomUUID() })));
        } else {
          toast({ title: "Error", description: "El plan solicitado no existe.", variant: "destructive" });
          router.push('/services?tab=plans');
        }
      } catch (e) {
        console.error("Error loading plan:", e);
        toast({ title: "Error", description: "No se pudieron cargar los datos.", variant: "destructive" });
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, [firestore, planId, router, toast]);

  const addItem = () => setItems([...items, { id: crypto.randomUUID(), serviceId: '', quantity: 1 }]);
  const removeItem = (id: string) => setItems(items.filter(i => i.id !== id));

  const updateItem = (id: string, field: keyof InternalPlanItem, value: any) => {
    let newItems = [...items];
    const idx = newItems.findIndex(i => i.id === id);
    if (idx === -1) return;
    let updated = { ...newItems[idx], [field]: value };

    if (field === 'serviceId') {
      const svc = services.find(s => s.id === value);
      if (svc) {
        delete updated.overriddenQuantity;
        delete updated.selectedPackage;
        delete updated.selectedComplexityLevel;
        delete updated.overridePrice;
        delete updated.overrideDescription;
        if (svc.pricingModel === 'fixed') updated.quantity = 1;
        else if (svc.pricingModel === 'scalable') { updated.quantity = 1; updated.overriddenQuantity = svc.includedUnits || 1; }
        else if (svc.pricingModel === 'package' && svc.packages && svc.packages.length > 0) {
          setActiveServiceForPackage(svc);
          setActiveItemIdForPackage(id);
          setIsPackageSelectorOpen(true);
        }
        if (svc.useComplexityMatrix && svc.complexityTiers && svc.complexityTiers.length > 0)
          updated.selectedComplexityLevel = svc.complexityTiers[0].level;
      }
    }
    newItems[idx] = updated;
    setItems(newItems);
  };

  const getEffectiveUnitPrice = (item: InternalPlanItem) => {
    if (item.overridePrice !== undefined) return item.overridePrice;
    const svc = services.find(s => s.id === item.serviceId);
    if (!svc) return 0;
    let price = svc.basePrice || 0;
    if (svc.pricingModel === 'scalable' && item.overriddenQuantity !== undefined) {
      price += Math.max(0, (item.overriddenQuantity || 0) - (svc.includedUnits || 0)) * (svc.unitPrice || 0);
    } else if (svc.pricingModel === 'package' && item.selectedPackage) {
      const pkg = svc.packages?.find(p => p.name === item.selectedPackage);
      if (pkg) price = pkg.price;
    }
    if (svc.useComplexityMatrix && item.selectedComplexityLevel !== undefined) {
      const tier = svc.complexityTiers?.find(t => t.level === item.selectedComplexityLevel);
      if (tier) price += tier.surcharge || 0;
    }
    return price;
  };

  const subtotal = items.reduce((acc, item) => acc + item.quantity * getEffectiveUnitPrice(item), 0);

  const handleSave = async () => {
    if (!firestore || !planId) return;
    if (!planName.trim()) {
      toast({ title: "Dato Requerido", description: "El nombre del plan es obligatorio.", variant: "destructive" });
      return;
    }
    if (items.length === 0) {
      toast({ title: "Plan Vacío", description: "Agrega al menos un servicio al plan.", variant: "destructive" });
      return;
    }
    setIsSaving(true);
    try {
      const cleanItems = items.map(({ id, ...rest }) => rest);
      await updateDoc(doc(firestore, 'predefined_plans', planId), {
        name: planName, description: planDescription, items: cleanItems, updatedAt: serverTimestamp()
      });
      toast({ title: "¡Actualizado!", description: "Cambios guardados correctamente." });
      router.push('/services?tab=plans');
    } catch (e) {
      console.error("Error updating plan:", e);
      toast({ title: "Error", description: "No se pudo actualizar el plan.", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
        <p className="text-muted-foreground animate-pulse">Cargando detalles del plan...</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-20 animate-in fade-in duration-500">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => router.push('/services?tab=plans')} className="rounded-full shrink-0">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-xl sm:text-3xl font-bold tracking-tight">Editar Plan Predeterminado</h1>
            <p className="text-muted-foreground text-xs sm:text-sm">Modifica la plantilla de servicios existente.</p>
          </div>
        </div>
        <div className="flex items-center gap-2 ml-11 sm:ml-0">
          <Button variant="outline" size="sm" onClick={() => router.push('/services?tab=plans')}>Cancelar</Button>
          <Button size="sm" onClick={handleSave} disabled={isSaving} className="shadow-lg shadow-primary/20 gap-2">
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Actualizar Plan
          </Button>
        </div>
      </div>

      <div className="space-y-6">
        {/* ── General Info + Total ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="border-primary/10 shadow-sm overflow-hidden h-full">
            <CardHeader className="bg-primary/5 border-b border-primary/10 py-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Info className="w-4 h-4 text-primary" />
                Información General
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="planName" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Nombre del Plan *</Label>
                  <Input id="planName" value={planName} onChange={e => setPlanName(e.target.value)} className="h-9 bg-muted/30 focus-visible:ring-primary border-border/50" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="planDesc" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Descripción (Opcional)</Label>
                  <Input id="planDesc" placeholder="Breve descripción..." value={planDescription} onChange={e => setPlanDescription(e.target.value)} className="h-9 bg-muted/30 focus-visible:ring-primary border-border/50" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-primary/10 bg-gradient-to-br from-primary/10 to-transparent shadow-sm flex flex-col justify-center">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-4 text-primary">
                  <div className="w-12 h-12 rounded-2xl bg-primary/20 flex items-center justify-center shadow-inner">
                    <Layers className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-tighter opacity-70">Total Estimado del Plan</p>
                    <p className="text-4xl font-black tracking-tight">{formatCurrency(subtotal)}</p>
                  </div>
                </div>
                <div className="hidden sm:block text-right max-w-[200px]">
                  <p className="text-[10px] text-muted-foreground leading-relaxed italic">
                    * Precio base sin impuestos. Se recalcula al aplicarse en una cotización.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ── Services Card ── */}
        <Card className="border-primary/10 shadow-sm overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between bg-primary/5 border-b border-primary/10 py-4">
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                <Package className="w-5 h-5 text-primary" />
                Servicios Incluidos
              </CardTitle>
              <CardDescription>Configura los servicios que componen esta plantilla.</CardDescription>
            </div>
            <Button size="sm" onClick={addItem} className="h-9 gap-2 shadow-sm">
              <Plus className="w-4 h-4" />
              Añadir Servicio
            </Button>
          </CardHeader>
          <CardContent className="p-4 sm:p-0">
            {items.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                <Package className="w-10 h-10 mb-3 opacity-20" />
                <p className="text-sm">Agrega el primer servicio para comenzar.</p>
                <Button variant="link" onClick={addItem} className="mt-1 text-primary">Añadir ahora</Button>
              </div>
            ) : (
              <>
                {/* ── Desktop Table (sm+) ── */}
                <div className="hidden sm:block overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b bg-muted/30 text-left">
                        <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground w-[38%]">Servicio</th>
                        <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground text-center w-20">Cant.</th>
                        <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground text-right">P. Unitario</th>
                        <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground text-right">Total</th>
                        <th className="w-10" />
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {items.map((item) => {
                        const service = services.find(s => s.id === item.serviceId);
                        const unitPrice = getEffectiveUnitPrice(item);
                        const hasConfig = service && (service.pricingModel === 'scalable' || service.pricingModel === 'package' || service.useComplexityMatrix);
                        return (
                          <React.Fragment key={item.id}>
                            <tr className={hasConfig ? 'border-b-0' : ''}>
                              <td className="px-4 py-3 align-top">
                                <Select value={item.serviceId} onValueChange={val => updateItem(item.id, 'serviceId', val)}>
                                  <SelectTrigger className="h-9 bg-background/50 border-border/50 text-sm">
                                    <SelectValue placeholder="Seleccionar..." />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {services.map(s => (
                                      <SelectItem key={s.id} value={s.id}>
                                        <div className="flex items-center gap-2">
                                          <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: s.color || '#ccc' }} />
                                          <span className="text-sm">{s.name}</span>
                                        </div>
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </td>
                              <td className="px-4 py-3 align-top">
                                <Input type="number" min="0"
                                  value={item.quantity === 0 ? '' : item.quantity}
                                  onChange={e => updateItem(item.id, 'quantity', e.target.value === '' ? 0 : parseInt(e.target.value) || 0)}
                                  className="h-9 text-center w-16 mx-auto"
                                  disabled={service?.pricingModel !== 'fixed' && service?.pricingModel !== undefined}
                                />
                              </td>
                              <td className="px-4 py-3 align-top text-right text-sm font-medium">{formatCurrency(unitPrice)}</td>
                              <td className="px-4 py-3 align-top text-right text-sm font-bold text-primary">{formatCurrency(item.quantity * unitPrice)}</td>
                              <td className="px-2 py-3 align-top">
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => removeItem(item.id)}>
                                  <Trash2 className="w-3.5 h-3.5" />
                                </Button>
                              </td>
                            </tr>
                            {hasConfig && (
                              <tr className="bg-primary/5 border-t border-primary/10">
                                <td colSpan={5} className="px-4 py-3">
                                  <ConfigRow item={item} service={service} updateItem={updateItem} formatCurrency={formatCurrency} />
                                </td>
                              </tr>
                            )}
                          </React.Fragment>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* ── Mobile Cards (<sm) ── */}
                <div className="flex flex-col gap-3 sm:hidden">
                  {items.map((item) => {
                    const service = services.find(s => s.id === item.serviceId);
                    const unitPrice = getEffectiveUnitPrice(item);
                    const hasConfig = service && (service.pricingModel === 'scalable' || service.pricingModel === 'package' || service.useComplexityMatrix);
                    return (
                      <div key={item.id} className="rounded-xl border bg-card shadow-sm overflow-hidden">
                        {/* Selector + delete */}
                        <div className="flex items-start gap-2 p-3">
                          <div className="flex-1 min-w-0">
                            <Select value={item.serviceId} onValueChange={val => updateItem(item.id, 'serviceId', val)}>
                              <SelectTrigger className="h-10 bg-background/50 border-border/50 w-full text-sm font-medium">
                                <div className="flex items-center gap-2 min-w-0">
                                  {service && <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: service.color || '#ccc' }} />}
                                  <SelectValue placeholder="Seleccionar servicio..." />
                                </div>
                              </SelectTrigger>
                              <SelectContent>
                                {services.map(s => (
                                  <SelectItem key={s.id} value={s.id}>
                                    <div className="flex items-center gap-2">
                                      <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: s.color || '#ccc' }} />
                                      {s.name}
                                    </div>
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <Button variant="ghost" size="icon" className="h-10 w-10 text-destructive shrink-0" onClick={() => removeItem(item.id)}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>

                        {/* Config (package / scalable / complexity) */}
                        {hasConfig && (
                          <div className="px-3 pb-2">
                            <ConfigRow item={item} service={service} updateItem={updateItem} formatCurrency={formatCurrency} />
                          </div>
                        )}

                        {/* Footer: qty + price */}
                        <div className="flex items-center justify-between gap-3 px-3 py-2.5 bg-muted/30 border-t">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Cant.</span>
                            <Input type="number" min="0"
                              value={item.quantity === 0 ? '' : item.quantity}
                              onChange={e => updateItem(item.id, 'quantity', e.target.value === '' ? 0 : parseInt(e.target.value) || 0)}
                              className="h-8 w-16 text-center text-sm"
                              disabled={service?.pricingModel !== 'fixed' && service?.pricingModel !== undefined}
                            />
                          </div>
                          <div className="text-right">
                            <p className="text-[10px] text-muted-foreground">{formatCurrency(unitPrice)} c/u</p>
                            <p className="font-black text-primary text-base">{formatCurrency(item.quantity * unitPrice)}</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* ── Package Selector Dialog ── */}
        <Dialog open={isPackageSelectorOpen} onOpenChange={setIsPackageSelectorOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 font-bold text-xl">
                <Package className="w-5 h-5 text-primary" />
                Seleccionar Paquete de {activeServiceForPackage?.name}
              </DialogTitle>
              <DialogDescription>Elige una de las opciones predefinidas para este servicio.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-3 py-4">
              {activeServiceForPackage?.packages?.map((pkg, idx) => (
                <Button
                  key={idx}
                  variant="outline"
                  className="h-auto py-4 px-6 justify-between border-border/50 hover:border-primary hover:bg-primary/5 group transition-all"
                  onClick={() => {
                    if (activeItemIdForPackage) {
                      const newItems = [...items];
                      const index = newItems.findIndex(i => i.id === activeItemIdForPackage);
                      if (index !== -1) newItems[index] = { ...newItems[index], selectedPackage: pkg.name, overrideDescription: pkg.name };
                      setItems(newItems);
                    }
                    setIsPackageSelectorOpen(false);
                  }}
                >
                  <div className="text-left">
                    <p className="font-bold group-hover:text-primary transition-colors">{pkg.name}</p>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-widest">{pkg.units} unidades incluidas</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-black">{formatCurrency(pkg.price)}</p>
                  </div>
                </Button>
              ))}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

// ── ConfigRow: renders scalable / package / complexity config ──────────────
function ConfigRow({ item, service, updateItem, formatCurrency: fc }: {
  item: InternalPlanItem;
  service: ProductOrService;
  updateItem: (id: string, field: keyof InternalPlanItem, value: any) => void;
  formatCurrency: (n: number) => string;
}) {
  return (
    <div className="flex flex-col gap-2">
      {service.pricingModel === 'scalable' && (
        <div className="flex flex-wrap items-center gap-2">
          <Layers className="w-3.5 h-3.5 text-primary shrink-0" />
          <Label className="text-[10px] font-bold uppercase tracking-widest text-primary/70 shrink-0">Unidades:</Label>
          <Input type="number" min="0"
            value={item.overriddenQuantity === 0 ? '' : (item.overriddenQuantity || 0)}
            onChange={e => updateItem(item.id, 'overriddenQuantity', e.target.value === '' ? 0 : parseInt(e.target.value) || 0)}
            className="h-8 w-20 bg-background border-primary/20 text-sm"
          />
          <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded">Base: {service.includedUnits}</span>
          <span className="text-[10px] text-muted-foreground">Extra: {fc(service.unitPrice || 0)}/u</span>
        </div>
      )}
      {service.pricingModel === 'package' && service.packages && service.packages.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <Package className="w-3.5 h-3.5 text-primary shrink-0" />
          <Label className="text-[10px] font-bold uppercase tracking-widest text-primary/70 shrink-0">Paquete:</Label>
          <Select value={item.selectedPackage || ''} onValueChange={val => updateItem(item.id, 'selectedPackage', val)}>
            <SelectTrigger className="h-8 bg-background border-primary/20 min-w-[180px] flex-1 max-w-xs text-xs">
              <SelectValue placeholder="Elegir paquete..." />
            </SelectTrigger>
            <SelectContent>
              {service.packages.map(p => (
                <SelectItem key={p.name} value={p.name}>
                  <span>{p.name}</span>
                  <span className="ml-3 font-bold text-primary">{fc(p.price)}</span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
      {service.useComplexityMatrix && service.complexityTiers && service.complexityTiers.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <Layers className="w-3.5 h-3.5 text-primary shrink-0" />
          <Label className="text-[10px] font-bold uppercase tracking-widest text-primary/70 shrink-0">Complejidad:</Label>
          <Select
            value={item.selectedComplexityLevel?.toString() || ''}
            onValueChange={val => updateItem(item.id, 'selectedComplexityLevel', parseInt(val) || 1)}
          >
            <SelectTrigger className="h-8 bg-background border-primary/20 min-w-[180px] flex-1 max-w-xs text-xs">
              <SelectValue placeholder="Nivel..." />
            </SelectTrigger>
            <SelectContent>
              {service.complexityTiers.map(t => (
                <SelectItem key={t.level} value={t.level.toString()}>
                  {t.name} — <span className="text-primary font-bold">+{fc(t.surcharge)}</span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
    </div>
  );
}
