'use client';

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useFirestore, useCollection, useUser } from '@/firebase';
import {
  collection,
  doc,
  addDoc,
  onSnapshot,
  query,
  where,
  setDoc,
  getDoc,
  updateDoc
} from 'firebase/firestore';
import {
  Receipt,
  Plus,
  Trash2,
  ArrowLeft,
  Save,
  Eye,
  Package,
  Layers,
  CheckCircle,
  Loader2,
  AlertCircle,
  Info,
  Briefcase,
  Settings,
  Search,
  Zap
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from '@/hooks/use-toast';
import { cn, formatCurrency } from '@/lib/utils';
import type { Invoice, InvoiceLineItem, ProductOrService, PredefinedPlan } from '@/lib/types';
import { ClientSelect } from '@/components/clients/client-select';
import { CartaTemplate, POSTemplate } from '@/components/invoicing/DocumentTemplates';
import { getNextSequenceNumber } from '@/lib/billing_utils';

export default function CreateInvoicePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const firestore = useFirestore();
  const { user, isUserLoading } = useUser();

  const [selectedClientId, setSelectedClientId] = useState<string>(searchParams.get('clientId') || '');
  const invoiceId = searchParams.get('invoiceId');
  const isEditing = searchParams.get('edit') === 'true' && !!invoiceId;
  const [initialInvoiceData, setInitialInvoiceData] = useState<any>(null);

  const [items, setItems] = useState<InvoiceLineItem[]>([
    {
      id: crypto.randomUUID(),
      description: '',
      quantity: 1,
      unitPrice: 0,
      discount: 0,
      discountValue: 0,
      discountType: 'amount',
      ivaType: 'none',
      ivaRate: 0,
      total: 0,
      paymentCategory: 'extra'
    }
  ]);
  const [globalDiscountType, setGlobalDiscountType] = useState<'percentage' | 'amount'>('percentage');
  const [globalDiscountValue, setGlobalDiscountValue] = useState<number>(0);
  const [notes, setNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  // States for Package Selection
  const [isPackageSelectorOpen, setIsPackageSelectorOpen] = useState(false);
  const [currentPackageService, setCurrentPackageService] = useState<any>(null);
  const [activeItemId, setActiveItemId] = useState<string | null>(null);

  // States for Plan Loader
  const [isPlanLoaderOpen, setIsPlanLoaderOpen] = useState(false);
  const [isPlanLoaderLoading, setIsPlanLoaderLoading] = useState(false);

  // Load Services Catalog
  const servicesQuery = useMemo(() =>
    firestore ? collection(firestore, 'services') : null,
    [firestore]);
  const { data: services } = useCollection<ProductOrService>(servicesQuery);

  // Load Predefined Plans
  const plansQuery = useMemo(() =>
    firestore ? collection(firestore, 'predefined_plans') : null,
    [firestore]);
  const { data: predefinedPlans } = useCollection<PredefinedPlan>(plansQuery);

  // Load Settings (IVA)
  const [settings, setSettings] = useState<any>(null);
  useEffect(() => {
    if (!firestore) return;
    return onSnapshot(doc(firestore, 'settings', 'general'), (snap) => {
      if (snap.exists()) setSettings(snap.data());
    });
  }, [firestore]);

  // Load Selected Client Data for Preview
  const [clientData, setClientData] = useState<any>(null);
  useEffect(() => {
    if (!firestore || !selectedClientId) {
      setClientData(null);
      return;
    }

    const fetchClient = async () => {
      // Prioritize fetching from 'clients' collection (new standard)
      // and fallback to 'users' for legacy data if needed.
      const clientSnap = await getDoc(doc(firestore, 'clients', selectedClientId));

      if (clientSnap.exists()) {
        const cData = clientSnap.data();
        setClientData({
          ...cData,
          clientName: cData.clientName || `${cData.firstName || ''} ${cData.lastName || ''}`.trim() || cData.company || selectedClientId,
          contactEmail: cData.clientEmail || cData.email,
          contactPhone: cData.clientPhone || cData.phone
        });
      } else {
        // Legacy fallback to 'users'
        const userSnap = await getDoc(doc(firestore, 'users', selectedClientId));
        if (userSnap.exists()) {
          const uData = userSnap.data();
          const fullName = `${uData.firstName || ''} ${uData.lastName || ''}`.trim();
          setClientData({
            ...uData,
            clientName: fullName || uData.company || selectedClientId,
            contactEmail: uData.email,
            contactPhone: uData.phone
          });
        } else {
          setClientData(null);
        }
      }
    };

    fetchClient();
  }, [firestore, selectedClientId]);

  // Load Existing Invoice for Editing
  useEffect(() => {
    if (!firestore || !isEditing || !selectedClientId || !invoiceId) return;
    
    const fetchInvoice = async () => {
      try {
         const snap = await getDoc(doc(firestore, 'clients', selectedClientId, 'invoices', invoiceId));
         if (snap.exists()) {
            const data = snap.data();
            setInitialInvoiceData(data);
            if (data.items?.length > 0) setItems(data.items);
            if (data.notes) setNotes(data.notes);
            if (data.globalDiscountType) setGlobalDiscountType(data.globalDiscountType);
            if (data.globalDiscountValue !== undefined) setGlobalDiscountValue(data.globalDiscountValue);
         }
      } catch (err) {
         console.error(err);
         toast({ title: 'Error', description: 'No se pudo cargar la factura a editar.', variant: 'destructive' });
      }
    };
    fetchInvoice();
  }, [firestore, isEditing, selectedClientId, invoiceId]);

  // Calculations (Standardized with Quotation logic)
  const itemCalculations = useMemo(() => {
    return items.map(item => {
      const lineTotalBeforeDiscount = (item.quantity || 0) * (item.unitPrice || 0);
      let discAmt = 0;
      if (item.discountType === 'percentage') {
        discAmt = lineTotalBeforeDiscount * ((item.discountValue || 0) / 100);
      } else {
        discAmt = item.discountValue || 0;
      }

      const lineFinal = Math.max(0, lineTotalBeforeDiscount - discAmt);
      const rate = (item.ivaRate || 0) / 100;
      const base = lineFinal / (1 + rate);
      const tax = lineFinal - base;

      return {
        ...item,
        discount: discAmt,
        total: lineFinal,
        subtotal: base,
        tax: tax
      };
    });
  }, [items]);

  // sum of the line totals (already including their line-item discounts)
  const totalBeforeGlobalDiscount = useMemo(() =>
    itemCalculations.reduce((acc, item) => acc + item.total, 0),
    [itemCalculations]);

  const globalDiscountAmount = useMemo(() => {
    if (globalDiscountType === 'percentage') {
      return totalBeforeGlobalDiscount * (globalDiscountValue / 100);
    }
    return Math.min(globalDiscountValue, totalBeforeGlobalDiscount);
  }, [totalBeforeGlobalDiscount, globalDiscountType, globalDiscountValue]);

  // The actual final price the customer pays
  const totalAmount = Math.max(0, totalBeforeGlobalDiscount - globalDiscountAmount);

  // Factor to scale down components (tax and base) proportionally based on global discount
  const discountFactor = totalBeforeGlobalDiscount > 0 ? (totalBeforeGlobalDiscount - globalDiscountAmount) / totalBeforeGlobalDiscount : 0;

  const ivaAmount = useMemo(() =>
    itemCalculations.reduce((acc, item) => acc + item.tax, 0) * discountFactor,
    [itemCalculations, discountFactor]);

  // Total base amount after all discounts
  const subtotalAmount = totalAmount - ivaAmount;
  const totalDiscounts = useMemo(() => itemCalculations.reduce((acc, item) => acc + item.discount, 0), [itemCalculations]);

  // Handlers
  const addItem = () => {
    setItems([...items, {
      id: crypto.randomUUID(),
      description: '',
      quantity: 1,
      unitPrice: 0,
      discount: 0,
      discountValue: 0,
      discountType: 'amount',
      ivaType: 'none',
      ivaRate: 0,
      total: 0,
      paymentCategory: 'extra'
    }]);
  };

  const loadPlanIntoInvoice = (planId: string) => {
    if (!predefinedPlans) return;
    const plan = predefinedPlans.find(p => p.id === planId);
    if (!plan) return;

    const newItems: InvoiceLineItem[] = plan.items.map(pItem => {
      const service = services?.find(s => s.id === pItem.serviceId);
      const basePrice = pItem.overridePrice || service?.basePrice || 0;

      return {
        id: crypto.randomUUID(),
        serviceId: pItem.serviceId,
        serviceName: service?.name || '',
        description: pItem.overrideDescription || service?.description || '',
        quantity: pItem.quantity,
        unitPrice: basePrice,
        discount: 0,
        discountValue: 0,
        discountType: 'amount',
        ivaType: service?.ivaType || 'none',
        ivaRate: service?.ivaRate || 0,
        total: pItem.quantity * basePrice,
        paymentCategory: 'extra'
      };
    });

    let currentItems = [...items];
    if (currentItems.length === 1 && currentItems[0].description === '' && currentItems[0].unitPrice === 0) {
      currentItems = [];
    }

    setItems([...currentItems, ...newItems]);
    setIsPlanLoaderOpen(false);
    toast({
      title: "Plan Cargado",
      description: `Se han añadido ${newItems.length} ítems de ${plan.name}.`
    });
  };

  const removeItem = (id: string) => {
    if (items.length === 1) {
      setItems([{
        id: crypto.randomUUID(),
        description: '',
        quantity: 1,
        unitPrice: 0,
        discount: 0,
        discountValue: 0,
        discountType: 'amount',
        ivaType: 'none',
        ivaRate: 0,
        total: 0,
        paymentCategory: 'extra'
      }]);
      return;
    }
    setItems(items.filter(i => i.id !== id));
  };

  const updateItem = (id: string, field: keyof InvoiceLineItem, value: any) => {
    const newItems = [...items];
    const index = newItems.findIndex(i => i.id === id);
    if (index === -1) return;

    let updated = { ...newItems[index], [field]: value };

    if (field === 'serviceId') {
      if (value !== 'manual') {
        const selectedService = services?.find(s => s.id === value);
        if (selectedService) {
          if (selectedService.pricingModel === 'package' && selectedService.packages && selectedService.packages.length > 0) {
            setActiveItemId(id);
            setCurrentPackageService(selectedService);
            setIsPackageSelectorOpen(true);
            return;
          }

          updated.serviceName = selectedService.name || '';
          updated.description = selectedService.description || '';
          delete updated.overriddenQuantity;
          delete updated.selectedComplexityLevel;
          delete updated.selectedPackage;

          let basePrice = selectedService.basePrice || 0;

          if (selectedService.pricingModel === 'fixed') {
            updated.quantity = 1;
          } else if (selectedService.pricingModel === 'scalable') {
            updated.quantity = 1;
            updated.overriddenQuantity = selectedService.includedUnits || 1;
          }

          if (selectedService.useComplexityMatrix && selectedService.complexityTiers?.length) {
            const firstTier = selectedService.complexityTiers[0];
            updated.selectedComplexityLevel = firstTier.level;
            basePrice += firstTier.surcharge || 0;
          }

          updated.unitPrice = basePrice;
          updated.ivaType = selectedService.ivaType || 'none';
          updated.ivaRate = selectedService.ivaRate || 0;
        }
      } else {
        updated.serviceId = undefined;
        updated.serviceName = undefined;
        updated.unitPrice = 0;
        updated.quantity = 1;
        updated.discount = 0;
        delete updated.overriddenQuantity;
        delete updated.selectedComplexityLevel;
      }
    }

    if (field === 'selectedComplexityLevel' && updated.serviceId) {
      const svc = services?.find(s => s.id === updated.serviceId);
      if (svc && svc.useComplexityMatrix) {
        const tier = svc.complexityTiers?.find(t => t.level === value);
        let base = svc.basePrice || 0;
        if (svc.pricingModel === 'scalable') {
          const extra = Math.max(0, (updated.overriddenQuantity || 0) - (svc.includedUnits || 0));
          base += extra * (svc.unitPrice || 0);
        }
        updated.unitPrice = base + (tier?.surcharge || 0);
      }
    }

    if (field === 'overriddenQuantity' && updated.serviceId) {
      const svc = services?.find(s => s.id === updated.serviceId);
      if (svc && svc.pricingModel === 'scalable') {
        const extra = Math.max(0, (value || 0) - (svc.includedUnits || 0));
        let price = (svc.basePrice || 0) + (extra * (svc.unitPrice || 0));
        if (svc.useComplexityMatrix && updated.selectedComplexityLevel !== undefined) {
          const tier = svc.complexityTiers?.find(t => t.level === updated.selectedComplexityLevel);
          price += (tier?.surcharge || 0);
        }
        updated.unitPrice = price;
      }
    }

    if (field === 'ivaType') {
      const selected = settings?.ivaTypes?.find((t: any) => t.id === value);
      updated.ivaType = value;
      updated.ivaRate = selected?.rate || 0;
    }

    const qty = updated.quantity || 0;
    const up = updated.unitPrice || 0;
    const dv = updated.discountValue || 0;
    const dt = updated.discountType || 'amount';

    let absDisc = 0;
    if (dt === 'percentage') {
      absDisc = (qty * up) * (dv / 100);
    } else {
      absDisc = dv;
    }

    updated.discount = absDisc;
    updated.total = (qty * up) - absDisc;
    newItems[index] = updated;
    setItems(newItems);
  };

  const handleCreateInvoice = async (status: 'draft' | 'sent' = 'sent') => {
    if (!firestore || !selectedClientId) {
      toast({ title: 'Error', description: 'Por favor selecciona un cliente.', variant: 'destructive' });
      return;
    }

    const validItems = items.filter(i => i.description.trim() !== '' && i.unitPrice >= 0 && i.quantity > 0);
    if (validItems.length === 0) {
      toast({ title: 'Error', description: 'Por favor añade al menos un ítem válido.', variant: 'destructive' });
      return;
    }

    setIsSaving(true);
    try {
      const now = new Date();
      
      if (isEditing && invoiceId) {
         const invoiceData = {
           subtotalAmount,
           totalItemDiscounts: totalDiscounts,
           globalDiscountType,
           globalDiscountValue,
           totalDiscount: globalDiscountAmount,
           taxAmount: ivaAmount,
           totalAmount,
           items: itemCalculations,
           applyIva: itemCalculations.some(i => (i.ivaRate ?? 0) > 0),
           ivaAmount: ivaAmount,
           notes,
           status: status,
           updatedAt: now.toISOString(),
         };
         await updateDoc(doc(firestore, 'clients', selectedClientId, 'invoices', invoiceId), invoiceData);
         toast({ title: 'Factura Actualizada', description: `La factura fue actualizada correctamente.` });
      } else {
         const invoiceNumber = await getNextSequenceNumber(firestore, 'invoice');

         const firstDueDay = clientData?.paymentSchedule?.firstPaymentDay || 15;
         const secondDueDay = clientData?.paymentSchedule?.secondPaymentDay || 30;
         const firstDueDate = new Date(now.getFullYear(), now.getMonth(), firstDueDay);
         const secondDueDate = new Date(now.getFullYear(), now.getMonth(), secondDueDay);

         const invoiceData = {
           clientId: selectedClientId,
           invoiceNumber,
           subtotalAmount,
           totalItemDiscounts: totalDiscounts,
           globalDiscountType,
           globalDiscountValue,
           totalDiscount: globalDiscountAmount,
           taxAmount: ivaAmount,
           totalAmount,
           amountPaid: 0,
           issueDate: now.toISOString(),
           firstPaymentDueDate: firstDueDate.toISOString(),
           status: status,
           items: itemCalculations,
           applyIva: itemCalculations.some(i => (i.ivaRate ?? 0) > 0),
           taxRate: 0,
           ivaAmount: ivaAmount,
           notes,
           createdAt: now.toISOString(),
           updatedAt: now.toISOString(),
         };

         await addDoc(collection(firestore, 'clients', selectedClientId, 'invoices'), invoiceData);

         toast({
           title: status === 'draft' ? 'Borrador Guardado' : 'Factura Creada',
           description: status === 'draft' 
             ? `Borrador de factura ${invoiceNumber} guardado correctamente.` 
             : `Factura ${invoiceNumber} generada y emitida correctamente.`
         });
      }

      router.push('/invoicing');
    } catch (err) {
      console.error(err);
      toast({ title: 'Error', description: 'No se pudo guardar la factura.', variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  if (isUserLoading) return <div className="p-20 text-center"><Loader2 className="w-8 h-8 animate-spin mx-auto" /></div>;

  return (
    <div className="container mx-auto max-w-7xl py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold font-headline">{isEditing ? `Editar Factura ${initialInvoiceData?.invoiceNumber || ''}` : 'Generar Nueva Factura'}</h1>
            <p className="text-muted-foreground text-sm">{isEditing ? 'Modifica los detalles de la factura.' : 'Crea una factura de venta directa para un cliente.'}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setIsPreviewOpen(!isPreviewOpen)}>
            <Eye className="w-4 h-4 mr-2" />
            {isPreviewOpen ? 'Editar' : 'Previsualizar'}
          </Button>
          <Button onClick={() => handleCreateInvoice('draft')} disabled={isSaving || !selectedClientId} variant="secondary">
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
            Guardar Borrador
          </Button>
          <Button onClick={() => handleCreateInvoice('sent')} disabled={isSaving || !selectedClientId} className="bg-primary hover:bg-primary/90">
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <CheckCircle className="w-4 h-4 mr-2" />}
            {isEditing ? 'Guardar Cambios' : 'Emitir Factura'}
          </Button>
        </div>
      </div>

      <div className={cn("max-w-7xl mx-auto space-y-6", isPreviewOpen && "hidden")}>
        <div className="space-y-6">
          <Card className="border-border/40 shadow-sm">
            <CardHeader>
              <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                <Briefcase className="w-4 h-4" /> Información del Cliente
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Seleccionar Cliente</Label>
                  <ClientSelect
                    value={selectedClientId}
                    onChange={setSelectedClientId}
                    placeholder="Busca o agrega un cliente..."
                  />
                </div>
                {clientData && (
                  <div className="flex flex-col gap-1 p-3 rounded-lg bg-primary/5 border border-primary/10">
                    <p className="text-sm font-bold text-primary">{clientData.clientName}</p>
                    <p className="text-xs text-muted-foreground">{clientData.contactEmail} • {clientData.contactPhone}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/40 shadow-sm overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                <Layers className="w-4 h-4" /> Ítems de la Factura
              </CardTitle>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsPlanLoaderOpen(true)}
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
                  {itemCalculations.map((item) => {
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
                                        {svc.complexityTiers?.map(t => (
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
            <Card className="border-border/40 shadow-sm">
              <CardHeader>
                <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                <Info className="w-4 h-4" /> Notas de la Factura
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder="Notas adicionales que aparecerán en el PDF..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="min-h-[100px] resize-none"
              />
            </CardContent>
          </Card>

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
                        value={globalDiscountValue === 0 ? "" : globalDiscountValue}
                        onChange={(e) => setGlobalDiscountValue(e.target.value === '' ? 0 : parseFloat(e.target.value) || 0)}
                        placeholder="0"
                        className="h-5 w-16 text-[10px] p-0 text-center border-none bg-transparent focus-visible:ring-0"
                      />
                    </div>
                  </div>
                  <span className="font-medium text-red-500 tabular-nums">-{formatCurrency(globalDiscountAmount)}</span>
                </div>

                {ivaAmount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Total IVA:</span>
                    <span className="font-medium tabular-nums">{formatCurrency(ivaAmount)}</span>
                  </div>
                )}
              </div>

              <Separator />

              <div className="flex justify-between items-center py-2">
                <span className="text-sm font-black uppercase">Total Factura</span>
                <span className="text-2xl font-black text-primary tabular-nums">{formatCurrency(totalAmount)}</span>
              </div>

              <div className="pt-4 space-y-2">
                <Button onClick={() => handleCreateInvoice('sent')} disabled={isSaving || !selectedClientId} className="w-full bg-primary hover:bg-primary/90 shadow-md">
                  {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <CheckCircle className="w-4 h-4 mr-2" />}
                  {isEditing ? 'Confirmar Cambios' : 'Confirmar y Emitir'}
                </Button>
                <Button onClick={() => handleCreateInvoice('draft')} variant="secondary" disabled={isSaving || !selectedClientId} className="w-full text-foreground border shadow-sm bg-background hover:bg-muted">
                  {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                  Guardar como Borrador
                </Button>
                <p className="text-[9px] text-center text-muted-foreground pt-1 italic">Al emitir, la factura será visible inmediatamente en el portal del cliente. Como borrador, es privada para el equipo.</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>

    {/* PDF Modal Preview (Full layout) */}
      {isPreviewOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 md:p-10 animate-in fade-in duration-300">
          <div className="bg-white rounded-2xl w-full max-w-4xl max-h-full overflow-y-auto relative shadow-2xl overflow-x-hidden">
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-4 top-4 z-10 bg-slate-100 hover:bg-slate-200"
              onClick={() => setIsPreviewOpen(false)}
            >
              <Trash2 className="w-5 h-5" />
            </Button>
            <div className="p-4 md:p-10 overflow-x-auto">
              <CartaTemplate
                invoice={{
                  invoiceNumber: 'KV-PREVIEW',
                  issueDate: new Date().toISOString(),
                  items: items.filter(i => i.description),
                  totalDiscount: globalDiscountAmount,
                  globalDiscountValue,
                  globalDiscountType,
                  taxRate: 0,
                  ivaType: 'Items',
                  totalAmount: totalAmount,
                  subtotalAmount: subtotalAmount,
                  taxAmount: ivaAmount
                }}
                client={clientData || { clientName: 'Nombre del Cliente' }}
                settings={settings}
              />
              <div className="mt-10 pt-10 border-t border-dashed">
                <h4 className="text-center text-sm font-bold uppercase text-muted-foreground mb-4 italic">- Previsualización Formato POS -</h4>
                <div className="flex justify-center">
                  <div className="border shadow-lg p-2 bg-slate-50 scale-90 origin-top">
                    <POSTemplate
                      invoice={{
                        invoiceNumber: 'KV-PREVIEW',
                        issueDate: new Date().toISOString(),
                        items: items.filter(i => i.description).map(i => ({
                          ...i,
                          total: (i.quantity * i.unitPrice) - i.discount
                        })),
                        totalDiscount: globalDiscountAmount,
                        globalDiscountType,
                        globalDiscountValue,
                        taxAmount: ivaAmount,
                        totalAmount: totalAmount,
                        subtotalAmount: subtotalAmount,
                        status: 'draft',
                      } as any}
                      client={clientData || { clientName: 'Nombre del Cliente' }}
                      settings={settings}
                    />
                  </div>
                </div>
              </div>
            </div>
            <div className="p-6 bg-slate-50 border-t flex justify-center flex-wrap gap-4">
              <Button variant="outline" onClick={() => setIsPreviewOpen(false)}>Cerrar Previsualización</Button>
              <Button onClick={() => handleCreateInvoice('draft')} disabled={isSaving || !selectedClientId} variant="secondary" className="border shadow-sm bg-background hover:bg-muted text-foreground">
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                Guardar Borrador
              </Button>
              <Button onClick={() => handleCreateInvoice('sent')} disabled={isSaving || !selectedClientId}>
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <CheckCircle className="w-4 h-4 mr-2" />}
                Emitir Factura Ahora
              </Button>
            </div>

            {/* Hidden containers for printing/export */}
            <div style={{ position: 'absolute', top: '-9999px', left: '-9999px', opacity: 0, zIndex: -1 }} id="print-area-pos">
              <POSTemplate
                invoice={{
                  invoiceNumber: 'KV-BORRADOR',
                  issueDate: new Date().toISOString(),
                  items: items.filter(i => i.description).map(i => ({
                    ...i,
                    total: (i.quantity * i.unitPrice) - i.discount
                  })),
                  totalDiscount: globalDiscountAmount,
                  globalDiscountType,
                  globalDiscountValue,
                  taxAmount: ivaAmount,
                  totalAmount: totalAmount,
                  subtotalAmount: subtotalAmount,
                  status: 'draft',
                } as any}
                client={clientData || { clientName: 'Nombre del Cliente' }}
                settings={settings}
              />
            </div>
          </div>
        </div>
      )}
      {/* Package Selector Dialog */}
      <Dialog open={isPackageSelectorOpen} onOpenChange={setIsPackageSelectorOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Package className="w-5 h-5 text-primary" />
              Seleccionar Paquete de {currentPackageService?.name}
            </DialogTitle>
            <DialogDescription>
              Elige una de las opciones predefinidas para este servicio.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 py-4">
            {currentPackageService?.packages?.map((pkg: any, idx: number) => (
              <Button
                key={idx}
                variant="outline"
                className="justify-between h-auto py-3 px-4 hover:border-primary hover:bg-primary/5 group"
                onClick={() => {
                  if (activeItemId && currentPackageService) {
                    const newItems = [...items];
                    const index = newItems.findIndex(i => i.id === activeItemId);
                    if (index !== -1) {
                      let finalPrice = pkg.price;
                      const currentItem = newItems[index];

                      // Apply complexity surcharge if already selected
                      if (currentPackageService.useComplexityMatrix && currentItem.selectedComplexityLevel !== undefined) {
                        const tier = currentPackageService.complexityTiers?.find((t: any) => t.level === currentItem.selectedComplexityLevel);
                        if (tier) finalPrice += (tier.surcharge || 0);
                      }

                      newItems[index] = {
                        ...currentItem,
                        serviceId: currentPackageService.id,
                        description: `${currentPackageService.name} - ${pkg.name}`,
                        unitPrice: finalPrice,
                        quantity: 1,
                        total: finalPrice,
                        selectedPackage: pkg.name
                      };
                      setItems(newItems);
                    }
                  }
                  setIsPackageSelectorOpen(false);
                  setCurrentPackageService(null);
                  setActiveItemId(null);
                }}
              >
                <div className="flex flex-col items-start gap-1 text-left">
                  <span className="font-bold group-hover:text-primary transition-colors">{pkg.name}</span>
                  <span className="text-[10px] text-muted-foreground">{pkg.units} {currentPackageService.unitType || 'unidades'} incluidas</span>
                </div>
                <span className="font-bold text-primary">{formatCurrency(pkg.price)}</span>
              </Button>
            ))}
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsPackageSelectorOpen(false)}>Cancelar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Plan Loader Dialog */}
      <PlanLoaderDialog
        isOpen={isPlanLoaderOpen}
        onClose={() => setIsPlanLoaderOpen(false)}
        plans={predefinedPlans || undefined}
        onSelect={loadPlanIntoInvoice}
      />
    </div>
  );
}

// Sub-component: Plan Loader Dialog
function PlanLoaderDialog({
  isOpen,
  onClose,
  plans,
  onSelect
}: {
  isOpen: boolean;
  onClose: () => void;
  plans: PredefinedPlan[] | undefined;
  onSelect: (id: string) => void;
}) {
  const [search, setSearch] = useState('');

  const filteredPlans = useMemo(() => {
    if (!plans) return [];
    return plans.filter(p =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.description.toLowerCase().includes(search.toLowerCase())
    );
  }, [plans, search]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-primary fill-current" />
            Cargar Plan Predeterminado
          </DialogTitle>
          <DialogDescription>
            Selecciona un plan para añadir automáticamente todos sus servicios a la factura actual.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar planes por nombre o descripción..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>

          <ScrollArea className="h-[350px] pr-4">
            <div className="grid grid-cols-1 gap-3">
              {filteredPlans.length > 0 ? (
                filteredPlans.map((plan) => (
                  <Button
                    key={plan.id}
                    variant="outline"
                    className="flex flex-col items-start h-auto p-4 gap-2 hover:border-primary hover:bg-primary/5 transition-all text-left group"
                    onClick={() => onSelect(plan.id)}
                  >
                    <div className="flex justify-between items-start w-full">
                      <span className="font-bold text-base group-hover:text-primary">{plan.name}</span>
                      <Badge variant="secondary" className="bg-primary/10 text-primary border-none">
                        {plan.items.length} ítems
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2">{plan.description}</p>
                    <div className="flex gap-2 mt-1">
                      {plan.items.slice(0, 3).map((item, idx) => (
                        <Badge key={idx} variant="outline" className="text-[9px] font-normal py-0 px-1.5 opacity-70">
                          {item.quantity}x de catálogo
                        </Badge>
                      ))}
                      {plan.items.length > 3 && (
                        <span className="text-[9px] text-muted-foreground">+{plan.items.length - 3} más</span>
                      )}
                    </div>
                  </Button>
                ))
              ) : (
                <div className="text-center py-12 border-2 border-dashed rounded-xl">
                  <Package className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">No se encontraron planes que coincidan.</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>Cancelar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
