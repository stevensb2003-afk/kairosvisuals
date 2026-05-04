'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useFirestore, useUser } from '@/firebase';
import {
  collection,
  doc,
  addDoc,
  getDoc,
  updateDoc
} from 'firebase/firestore';
import {
  ArrowLeft,
  Save,
  Eye,
  CheckCircle,
  Loader2,
  Briefcase
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { ClientSelect } from '@/components/clients/client-select';
import { getNextSequenceNumber } from '@/lib/billing_utils';

// Hooks
import { useInvoicingData } from '../_hooks/useInvoicingData';
import { useInvoiceForm } from '../_hooks/useInvoiceForm';
import { useInvoiceCalculations } from '../_hooks/useInvoiceCalculations';

// Components
import { InvoiceItemsTable } from '../_components/editor/InvoiceItemsTable';
import { InvoiceSummary } from '../_components/editor/InvoiceSummary';
import { InvoicePreviewModal } from '../_components/editor/InvoicePreviewModal';
import { PackageSelector } from '../_components/editor/PackageSelector';
import { PlanLoader } from '../_components/editor/PlanLoader';
import { StickyInvoiceBar } from '../_components/editor/StickyInvoiceBar';


export default function CreateInvoicePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const firestore = useFirestore();
  const { isUserLoading } = useUser();

  // 1. Data Fetching
  const { 
    services, 
    predefinedPlans, 
    settings, 
    clientMap, 
    isLoading: isDataLoading 
  } = useInvoicingData();

  // 2. Local UI State
  const [selectedClientId, setSelectedClientId] = useState<string>(searchParams.get('clientId') || '');
  const invoiceId = searchParams.get('invoiceId');
  const isEditing = searchParams.get('edit') === 'true' && !!invoiceId;
  const [initialInvoiceData, setInitialInvoiceData] = useState<any>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [notes, setNotes] = useState('');

  // 3. Discount State
  const [globalDiscountType, setGlobalDiscountType] = useState<'percentage' | 'amount'>('percentage');
  const [globalDiscountValue, setGlobalDiscountValue] = useState<number>(0);

  // 4. Form State & Handlers
  const { 
    items, 
    setItems, 
    addItem, 
    removeItem, 
    updateItem, 
    setPackageForItem, 
    loadPlan 
  } = useInvoiceForm({ services, settings });

  // 5. Calculations
  const calculations = useInvoiceCalculations({
    items,
    globalDiscountType,
    globalDiscountValue
  });

  const {
    itemCalculations,
    totalBeforeGlobalDiscount,
    globalDiscountAmount,
    subtotalAmount,
    ivaAmount,
    totalAmount,
    totalDiscounts
  } = calculations;

  // 6. Modal States
  const [isPackageSelectorOpen, setIsPackageSelectorOpen] = useState(false);
  const [currentPackageService, setCurrentPackageService] = useState<any>(null);
  const [activeItemId, setActiveItemId] = useState<string | null>(null);
  const [isPlanLoaderOpen, setIsPlanLoaderOpen] = useState(false);

  // 7. Effects
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
  }, [firestore, isEditing, selectedClientId, invoiceId, setItems]);

  // Handlers
  const handleLoadPlan = (planId: string) => {
    const result = loadPlan(planId, predefinedPlans || [], services || []);
    if (result) {
      setIsPlanLoaderOpen(false);
      toast({
        title: "Plan Cargado",
        description: `Se han añadido ${result.count} ítems de ${result.name}.`
      });
    }
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

         // Payment due dates logic
         const firstDueDay = 15; // Fallback default
         const secondDueDay = 30; // Fallback default
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

  const clientData = clientMap.get(selectedClientId);

  if (isUserLoading || isDataLoading) return <div className="p-20 text-center"><Loader2 className="w-8 h-8 animate-spin mx-auto" /></div>;


  return (
    <div className="container mx-auto max-w-7xl py-6 space-y-6 pb-32 sm:pb-6">
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
        <div className="hidden sm:flex items-center gap-2">
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
                    <p className="text-sm font-bold text-primary">{clientData.name}</p>
                    <p className="text-xs text-muted-foreground">{clientData.email} • {clientData.phone}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <InvoiceItemsTable
            items={itemCalculations}
            services={services || []}
            settings={settings}
            updateItem={(id, field, value) => {
              // Intercept service selection for packages
              if (field === 'serviceId' && value !== 'manual') {
                const svc = services?.find(s => s.id === value);
                if (svc?.pricingModel === 'package') {
                  setActiveItemId(id);
                  setCurrentPackageService(svc);
                  setIsPackageSelectorOpen(true);
                  return;
                }
              }
              updateItem(id, field, value);
            }}
            removeItem={removeItem}
            addItem={addItem}
            onOpenPlanLoader={() => setIsPlanLoaderOpen(true)}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
            <Card className="border-border/40 shadow-sm">
              <CardHeader>
                <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                  <Save className="w-4 h-4" /> Notas de la Factura
                </CardTitle>
              </CardHeader>
              <CardContent>
                <textarea
                  placeholder="Notas adicionales que aparecerán en el PDF..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full min-h-[100px] p-3 rounded-md border border-input bg-background text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                />
              </CardContent>
            </Card>

            <InvoiceSummary
              totalBeforeGlobalDiscount={totalBeforeGlobalDiscount}
              totalDiscounts={totalDiscounts}
              globalDiscountType={globalDiscountType}
              globalDiscountValue={globalDiscountValue}
              subtotalAmount={subtotalAmount}
              ivaAmount={ivaAmount}
              totalAmount={totalAmount}
              setGlobalDiscountType={(type: 'percentage' | 'amount') => setGlobalDiscountType(type)}
              setGlobalDiscountValue={(val: number) => setGlobalDiscountValue(val)}
            />
          </div>
        </div>
      </div>

      <InvoicePreviewModal
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        items={items}
        globalDiscountAmount={globalDiscountAmount}
        globalDiscountValue={globalDiscountValue}
        globalDiscountType={globalDiscountType}
        totalAmount={totalAmount}
        subtotalAmount={subtotalAmount}
        ivaAmount={ivaAmount}
        clientData={clientData}
        settings={settings}
        isSaving={isSaving}
        selectedClientId={selectedClientId}
        handleCreateInvoice={handleCreateInvoice}
      />

      <PackageSelector
        isOpen={isPackageSelectorOpen}
        onOpenChange={setIsPackageSelectorOpen}
        service={currentPackageService}
        activeItemId={activeItemId}
        onSelectPackage={setPackageForItem}
      />

      <PlanLoader
        isOpen={isPlanLoaderOpen}
        onClose={() => setIsPlanLoaderOpen(false)}
        plans={predefinedPlans || []}
        onSelect={handleLoadPlan}
      />

      {/* Mobile sticky bar */}
      <StickyInvoiceBar
        totalAmount={totalAmount}
        isSaving={isSaving}
        canSave={!!selectedClientId}
        isEditing={isEditing}
        onSaveDraft={() => handleCreateInvoice('draft')}
        onConfirm={() => handleCreateInvoice('sent')}
      />
    </div>
  );
}

