'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { ArrowLeft, Save, Plus, Trash2, Loader2, Package, Layers, Info } from "lucide-react";
import { useFirestore } from '@/firebase';
import { collection, doc, getDoc, getDocs, updateDoc, serverTimestamp } from 'firebase/firestore';
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { formatCurrency } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ProductOrService, PredefinedPlan, PlanItem } from '@/lib/types';

// We use a local interface for UI mapping
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
  
  // App Data
  const [services, setServices] = useState<ProductOrService[]>([]);
  
  // Plan State
  const [planName, setPlanName] = useState('');
  const [planDescription, setPlanDescription] = useState('');
  const [items, setItems] = useState<InternalPlanItem[]>([]);

  // Dialog States
  const [isPackageSelectorOpen, setIsPackageSelectorOpen] = useState(false);
  const [activeServiceForPackage, setActiveServiceForPackage] = useState<ProductOrService | null>(null);
  const [activeItemIdForPackage, setActiveItemIdForPackage] = useState<string | null>(null);

  // Initial Load
  useEffect(() => {
    async function loadData() {
      if (!firestore || !planId) return;
      try {
        // Load services
        const servicesSnap = await getDocs(collection(firestore, 'services'));
        const _services = servicesSnap.docs.map(d => ({ id: d.id, ...d.data() } as ProductOrService));
        setServices(_services);

        // Load specific plan
        const planSnap = await getDoc(doc(firestore, 'predefined_plans', planId));
        if (planSnap.exists()) {
          const planData = planSnap.data() as PredefinedPlan;
          setPlanName(planData.name);
          setPlanDescription(planData.description || '');
          setItems((planData.items || []).map(item => ({
            ...item,
            id: crypto.randomUUID()
          })));
        } else {
          toast({ title: "Error", description: "El plan solicitado no existe.", variant: "destructive" });
          router.push('/services');
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

  const addItem = () => {
    setItems([...items, {
      id: crypto.randomUUID(),
      serviceId: '',
      quantity: 1,
    }]);
  };

  const removeItem = (id: string) => {
    setItems(items.filter(i => i.id !== id));
  };

  const updateItem = (id: string, field: keyof InternalPlanItem, value: any) => {
    let newItems = [...items];
    const idx = newItems.findIndex(i => i.id === id);
    if (idx === -1) return;

    let updated = { ...newItems[idx], [field]: value };
    
    if (field === 'serviceId') {
      const selectedService = services.find(s => s.id === value);
      if (selectedService) {
         delete updated.overriddenQuantity;
         delete updated.selectedPackage;
         delete updated.selectedComplexityLevel;
         delete updated.overridePrice;
         delete updated.overrideDescription;
         
         if (selectedService.pricingModel === 'fixed') {
             updated.quantity = 1;
         } else if (selectedService.pricingModel === 'scalable') {
             updated.quantity = 1; 
             updated.overriddenQuantity = selectedService.includedUnits || 1;
         } else if (selectedService.pricingModel === 'package' && selectedService.packages && selectedService.packages.length > 0) {
            setActiveServiceForPackage(selectedService);
            setActiveItemIdForPackage(id);
            setIsPackageSelectorOpen(true);
         }

         if (selectedService.useComplexityMatrix && selectedService.complexityTiers && selectedService.complexityTiers.length > 0) {
           const firstTier = selectedService.complexityTiers[0];
           updated.selectedComplexityLevel = firstTier.level;
         }
      }
    }

    newItems[idx] = updated;
    setItems(newItems);
  };

  const getEffectiveUnitPrice = (item: InternalPlanItem) => {
    if (item.overridePrice !== undefined) return item.overridePrice;
    const service = services.find(s => s.id === item.serviceId);
    if (!service) return 0;

    let price = service.basePrice || 0;

    if (service.pricingModel === 'scalable' && item.overriddenQuantity !== undefined) {
      const extraUnits = Math.max(0, (item.overriddenQuantity || 0) - (service.includedUnits || 0));
      price += extraUnits * (service.unitPrice || 0);
    } else if (service.pricingModel === 'package' && item.selectedPackage) {
      const pkg = service.packages?.find(p => p.name === item.selectedPackage);
      if (pkg) price = pkg.price;
    }

    if (service.useComplexityMatrix && item.selectedComplexityLevel !== undefined) {
      const tier = service.complexityTiers?.find(t => t.level === item.selectedComplexityLevel);
      if (tier) price += (tier.surcharge || 0);
    }

    return price;
  };

  const subtotal = items.reduce((acc, item) => acc + (item.quantity * getEffectiveUnitPrice(item)), 0);

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
        name: planName,
        description: planDescription,
        items: cleanItems,
        updatedAt: serverTimestamp()
      });
      
      toast({ title: "¡Actualizado!", description: "Cambios guardados correctamente." });
      router.push('/services');
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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-full">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Editar Plan Predeterminado</h1>
            <p className="text-muted-foreground text-sm">Modifica la plantilla de servicios existente.</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={() => router.back()}>Cancelar</Button>
          <Button onClick={handleSave} disabled={isSaving} className="shadow-lg shadow-primary/20">
            {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
            Actualizar Plan
          </Button>
        </div>
      </div>

      <div className="space-y-6">
        {/* Top Row: General Info & Total */}
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
                  <Input 
                    id="planName" 
                    value={planName}
                    onChange={(e) => setPlanName(e.target.value)}
                    className="h-9 bg-muted/30 focus-visible:ring-primary border-border/50"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="planDesc" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Descripción (Opcional)</Label>
                  <Input 
                    id="planDesc" 
                    placeholder="Breve descripción..." 
                    value={planDescription}
                    onChange={(e) => setPlanDescription(e.target.value)}
                    className="h-9 bg-muted/30 focus-visible:ring-primary border-border/50"
                  />
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

        {/* Bottom Row: Service Selection (Full Width) */}
        <Card className="border-primary/10 shadow-sm overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between bg-primary/5 border-b border-primary/10 py-4">
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                <Package className="w-5 h-5 text-primary" />
                Servicios Incluidos
              </CardTitle>
            </div>
            <Button size="sm" onClick={addItem} className="h-9 gap-2 shadow-sm">
              <Plus className="w-4 h-4" />
              Añadir Servicio
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-muted/30">
                  <TableRow className="hover:bg-transparent border-b-primary/10">
                    <TableHead className="w-[30%] min-w-[200px] text-[10px] font-bold uppercase tracking-widest px-6">Servicio</TableHead>
                    <TableHead className="text-center w-24 text-[10px] font-bold uppercase tracking-widest px-6">Cant.</TableHead>
                    <TableHead className="text-right text-[10px] font-bold uppercase tracking-widest px-6">P. Unitario</TableHead>
                    <TableHead className="text-right text-[10px] font-bold uppercase tracking-widest px-6">Total</TableHead>
                    <TableHead className="w-12 px-6"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item) => {
                    const service = services.find(s => s.id === item.serviceId);
                    const unitPrice = getEffectiveUnitPrice(item);

                    return (
                      <React.Fragment key={item.id}>
                        <TableRow className={service && (service.pricingModel !== 'fixed' || service.useComplexityMatrix) ? 'border-b-0' : ''}>
                          <TableCell className="align-top py-4">
                            <Select value={item.serviceId} onValueChange={(val) => updateItem(item.id, 'serviceId', val)}>
                              <SelectTrigger className="h-10 bg-background/50 border-border/50">
                                <SelectValue placeholder="Seleccionar Servicio..." />
                              </SelectTrigger>
                              <SelectContent>
                                {services.map(s => (
                                  <SelectItem key={s.id} value={s.id}>
                                    <div className="flex items-center gap-2">
                                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: s.color || '#ccc' }} />
                                      {s.name}
                                    </div>
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell className="align-top py-4 text-center">
                            <Input 
                              type="number" 
                              min="0" 
                              value={item.quantity === 0 ? "" : item.quantity} 
                              onChange={(e) => updateItem(item.id, 'quantity', e.target.value === '' ? 0 : parseInt(e.target.value) || 0)}
                              placeholder="0"
                              className="h-10 text-center bg-background/50 border-border/50"
                              disabled={service?.pricingModel !== 'fixed' && service?.pricingModel !== undefined}
                            />
                          </TableCell>
                          <TableCell className="align-top py-4 text-right font-medium">
                            {formatCurrency(unitPrice)}
                          </TableCell>
                          <TableCell className="align-top py-4 text-right font-bold text-primary">
                            {formatCurrency(item.quantity * unitPrice)}
                          </TableCell>
                          <TableCell className="align-top py-4">
                            <Button variant="ghost" size="icon" onClick={() => removeItem(item.id)} className="text-destructive hover:bg-destructive/10">
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </TableCell>
                        </TableRow>

                        {service && (service.pricingModel === 'scalable' || service.pricingModel === 'package' || service.useComplexityMatrix) && (
                          <TableRow className="bg-primary/5 hover:bg-primary/10 transition-colors border-t border-primary/10">
                            <TableCell colSpan={5} className="py-4 px-6">
                              <div className="flex flex-col gap-4">
                                <div className="flex items-center gap-6 flex-wrap">
                                  {service.pricingModel === 'scalable' && (
                                     <div className="flex items-center gap-4 flex-1 min-w-[300px]">
                                       <div className="flex items-center gap-2 shrink-0">
                                          <Layers className="w-4 h-4 text-primary" />
                                          <Label className="text-[10px] font-bold uppercase tracking-widest text-primary/70">Unidades totales:</Label>
                                       </div>
                                       <div className="flex-1 max-w-[150px]">
                                          <Input 
                                            type="number" 
                                            min="0" 
                                            value={item.overriddenQuantity === 0 ? "" : (item.overriddenQuantity || 0)} 
                                            onChange={(e) => updateItem(item.id, 'overriddenQuantity', e.target.value === '' ? 0 : parseInt(e.target.value) || 0)}
                                            placeholder="0"
                                            className="h-8 bg-background border-primary/20"
                                          />
                                       </div>
                                       <div className="text-[10px] text-muted-foreground flex items-center gap-2 uppercase tracking-tight">
                                          <span className="bg-primary/10 text-primary px-2 py-0.5 rounded">Incluye {service.includedUnits} base</span>
                                          <span>Extra: {formatCurrency(service.unitPrice || 0)}/u</span>
                                       </div>
                                     </div>
                                  )}

                                  {service.pricingModel === 'package' && service.packages && (
                                     <div className="flex items-center gap-4 flex-1 min-w-[300px]">
                                       <div className="flex items-center gap-2 shrink-0">
                                          <Package className="w-4 h-4 text-primary" />
                                          <Label className="text-[10px] font-bold uppercase tracking-widest text-primary/70">Paquete:</Label>
                                       </div>
                                       <div className="flex-1 max-w-[200px]">
                                          <Select 
                                            value={item.selectedPackage || ''} 
                                            onValueChange={(val) => updateItem(item.id, 'selectedPackage', val)}
                                          >
                                            <SelectTrigger className="h-8 bg-background border-primary/20">
                                              <SelectValue placeholder="Elegir..." />
                                            </SelectTrigger>
                                            <SelectContent>
                                              {service.packages.map(p => (
                                                <SelectItem key={p.name} value={p.name}>{p.name} - {formatCurrency(p.price)}</SelectItem>
                                              ))}
                                            </SelectContent>
                                          </Select>
                                       </div>
                                     </div>
                                  )}

                                  {service.useComplexityMatrix && service.complexityTiers && (
                                     <div className="flex items-center gap-4 flex-1 min-w-[300px]">
                                       <div className="flex items-center gap-2 shrink-0">
                                          <Layers className="w-4 h-4 text-primary" />
                                          <Label className="text-[10px] font-bold uppercase tracking-widest text-primary/70">Complejidad:</Label>
                                       </div>
                                       <div className="flex-1 max-w-[200px]">
                                          <Select 
                                            value={item.selectedComplexityLevel?.toString() || ''} 
                                            onValueChange={(val) => updateItem(item.id, 'selectedComplexityLevel', parseInt(val) || 1)}
                                          >
                                            <SelectTrigger className="h-8 bg-background border-primary/20">
                                              <SelectValue placeholder="Elegir..." />
                                            </SelectTrigger>
                                            <SelectContent>
                                              {service.complexityTiers.map(t => (
                                                <SelectItem key={t.level} value={t.level.toString()}>Lvl {t.level}: {t.name} (+{formatCurrency(t.surcharge)})</SelectItem>
                                              ))}
                                            </SelectContent>
                                          </Select>
                                       </div>
                                     </div>
                                  )}
                                </div>
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
          </CardContent>
        </Card>

        {/* Package Selector Dialog (Duplicate from solicitudes for UX consistency) */}
        <Dialog open={isPackageSelectorOpen} onOpenChange={setIsPackageSelectorOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 font-bold text-xl">
                <Package className="w-5 h-5 text-primary" />
                Seleccionar Paquete de {activeServiceForPackage?.name}
              </DialogTitle>
            </DialogHeader>
            <div className="grid gap-3 py-4">
              {activeServiceForPackage?.packages?.map((pkg: any, idx: number) => (
                <Button 
                  key={idx} 
                  variant="outline" 
                  className="h-auto py-4 px-6 justify-between border-border/50 hover:border-primary hover:bg-primary/5 group"
                  onClick={() => {
                      if (activeItemIdForPackage) {
                        const newItems = [...items];
                        const index = newItems.findIndex(i => i.id === activeItemIdForPackage);
                        if (index !== -1) {
                           newItems[index] = { ...newItems[index], selectedPackage: pkg.name };
                           setItems(newItems);
                        }
                      }
                      setIsPackageSelectorOpen(false);
                  }}
                >
                  <div className="text-left font-bold">{pkg.name}</div>
                  <div className="text-right font-black">{formatCurrency(pkg.price)}</div>
                </Button>
              ))}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
