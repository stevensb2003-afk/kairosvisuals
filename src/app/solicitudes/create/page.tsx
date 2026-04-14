'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { 
  ArrowLeft, Plus, Trash2, Save, FileText, Loader2, Info, Search, UserPlus,
  Calendar as CalendarIcon, CalendarX, X, Printer, Download, Package, Layers, Share 
} from "lucide-react";
import { useFirestore, useUser } from '@/firebase';
import { collection, doc, getDoc, getDocs, setDoc, addDoc, updateDoc, query, where, runTransaction } from 'firebase/firestore';
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { formatCurrency } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { PhoneInput } from "@/components/ui/phone-input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { es } from "date-fns/locale/es";
import { PremiumDatePicker } from "@/components/ui/premium-date-picker";
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

import { ProductOrService, PredefinedPlan, PlanItem } from '@/lib/types';
import { CartaTemplate, POSTemplate } from '@/components/invoicing/DocumentTemplates';
import { getNextSequenceNumber } from '@/lib/billing_utils';
import { validateClientUniqueness } from '@/lib/client_utils';

interface QuoteItem {
  id: string;
  serviceId: string;
  description: string;
  serviceName?: string;
  quantity: number;
  unitPrice: number;
  discount: number; // Absolute discount amount for the line
  discountValue: number; // User input value
  discountType: 'percentage' | 'amount';
  ivaType: string;
  ivaRate: number;
  // Configuration
  overriddenQuantity?: number;
  selectedPackage?: string;
  selectedComplexityLevel?: number;
}

interface Client {
  id: string;
  name: string;
  firstName?: string;
  lastName?: string;
  contactEmail: string;
  phone?: string;
  company?: string;
  isArchived?: boolean;
  hasActivePlan?: boolean;
  activePlan?: any;
}

interface CompanySettings {
  companyName: string;
  companyAddress: string;
  companyEmail: string;
  companyPhone: string;
  applyIva: boolean;
  ivaTypes?: any[];
}

export default function CreateQuotationPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const firestore = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();

  const leadId = searchParams.get('leadId');
  const clientId = searchParams.get('clientId');
  const quotationId = searchParams.get('quotationId');

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [currentVersion, setCurrentVersion] = useState(1);
  const [currentStatus, setCurrentStatus] = useState<string>('draft');
  const [parentId, setParentId] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [quotationNumber, setQuotationNumber] = useState<string | null>(null);

  // Client Selection Logic
  const [selectedClientId, setSelectedClientId] = useState<string | null>(clientId);
  const [allClients, setAllClients] = useState<Client[]>([]);
  const [clientSearch, setClientSearch] = useState('');
  const [isNewClientOpen, setIsNewClientOpen] = useState(false);
  const [newClient, setNewClient] = useState({ firstName: '', lastName: '', email: '', phone: '', company: '' });

  const isFormValid = useMemo(() => {
    return !!newClient.firstName.trim() && !!newClient.lastName.trim() && !!newClient.phone?.trim();
  }, [newClient]);

  // Loaded Data
  const [clientData, setClientData] = useState<Client | null>(null);
  const [companySettings, setCompanySettings] = useState<CompanySettings>({
    companyName: '',
    companyAddress: '',
    companyEmail: '',
    companyPhone: '',
    applyIva: false,
    ivaTypes: []
  });
  const [services, setServices] = useState<ProductOrService[]>([]);
  const [predefinedPlans, setPredefinedPlans] = useState<PredefinedPlan[]>([]);

  // Dialog States
  const [isPlanLoaderOpen, setIsPlanLoaderOpen] = useState(false);
  const [isPackageSelectorOpen, setIsPackageSelectorOpen] = useState(false);
  const [activeServiceForPackage, setActiveServiceForPackage] = useState<ProductOrService | null>(null);
  const [activeItemIdForPackage, setActiveItemIdForPackage] = useState<string | null>(null);

  // Quote State
  const [items, setItems] = useState<QuoteItem[]>([]);
  const [details, setDetails] = useState({
    title: 'Propuesta de Servicios',
    validityDays: 5,
    notes: 'Válida por los próximos 5 días hábiles. De no ser aceptada, se procederá a una re-cotización con posible ajuste de precios.',
    startDate: ''
  });
  const [contractType, setContractType] = useState<'one_time' | 'recurring'>('one_time');
  const [isPlanUpdate, setIsPlanUpdate] = useState<boolean>(false);

  // 1. Initial Load: Basic app data (Settings, Task Types, Client List)
  useEffect(() => {
    async function loadInitialData() {
      if (!firestore) return;

      try {
        // Fetch Settings
        const settingsSnap = await getDoc(doc(firestore, 'settings', 'general'));
        if (settingsSnap.exists()) {
          setCompanySettings(settingsSnap.data() as CompanySettings);
        }

        // Fetch Services
        const servicesSnap = await getDocs(collection(firestore, 'services'));
        const _services = servicesSnap.docs.map(d => ({ id: d.id, ...d.data() } as ProductOrService));
        setServices(_services);

        // Fetch official clients for selection from 'clients' collection
        const leadsSnap = await getDocs(collection(firestore, 'requests'));
        const pendingClientIds = new Set(
          leadsSnap.docs
            .filter(d => d.data().status === 'pending')
            .map(d => d.data().clientId)
        );

        const clientsSnap = await getDocs(collection(firestore, 'clients'));
        const officialClients = clientsSnap.docs
          .map(d => {
            const data = d.data();
            return {
              id: d.id,
              name: data.clientName || data.name || 'Sin Nombre',
              firstName: data.firstName || '',
              lastName: data.lastName || '',
              contactEmail: data.clientEmail || data.email || '',
              phone: data.clientPhone || data.phone || '',
              company: data.company || '',
              isArchived: data.isArchived || false,
              hasActivePlan: !!data.activePlan && data.activePlan.status === 'active'
            } as Client;
          })
          .filter(c => !pendingClientIds.has(c.id) && !c.isArchived);

        setAllClients(officialClients);

        // Fetch Predefined Plans
        const plansSnap = await getDocs(collection(firestore, 'predefined_plans'));
        const _plans = plansSnap.docs.map(d => ({ id: d.id, ...d.data() } as PredefinedPlan));
        setPredefinedPlans(_plans);
      } catch (e) {
        console.error("Error loading initial data:", e);
      }
    }
    loadInitialData();
  }, [firestore]);

  // 2. Contextual Load: Selected client details or existing quotation
  useEffect(() => {
    async function loadContextData() {
      if (!firestore) return;

      try {
        if (!selectedClientId) {
          setIsLoading(false);
          return;
        }

        setIsLoading(true);
        let clientInfo: Client | null = null;

        // Try 'clients' collection first (Legacy/Specific)
        const clientSnap = await getDoc(doc(firestore, 'clients', selectedClientId));
        if (clientSnap.exists()) {
          const d = clientSnap.data();
          clientInfo = {
            id: selectedClientId,
            name: d.clientName || d.name || 'Sin Nombre',
            firstName: d.firstName || '',
            lastName: d.lastName || '',
            contactEmail: d.clientEmail || d.email || '',
            phone: d.clientPhone || d.phone || '',
            company: d.company || '',
            hasActivePlan: !!d.activePlan && d.activePlan.status === 'active',
            activePlan: d.activePlan
          };
        } else {
          // Try 'users' collection
          const userSnap = await getDoc(doc(firestore, 'users', selectedClientId));
          if (userSnap.exists()) {
            const u = userSnap.data();
            clientInfo = {
              id: selectedClientId,
              name: `${u.firstName || ''} ${u.lastName || ''}`.trim() || u.company || 'Sin Nombre',
              contactEmail: u.email,
              phone: u.phone,
              company: u.company
            };
          }
        }

        // Backup plan: check requests if leadId exists
        if (!clientInfo?.name && leadId) {
          const leadSnap = await getDoc(doc(firestore, 'requests', leadId));
          if (leadSnap.exists()) {
            const leadData = leadSnap.data();
            clientInfo = {
              id: selectedClientId,
              name: clientInfo?.name || leadData.clientName,
              contactEmail: clientInfo?.contactEmail || leadData.clientEmail,
              phone: clientInfo?.phone || leadData.clientPhone,
              company: clientInfo?.company
            };
          }
        }

        if (clientInfo) setClientData(clientInfo);

        // Load existing quotation data if editing or versioning
        if (quotationId) {
          const qSnap = await getDoc(doc(firestore, 'clients', selectedClientId, 'quotations', quotationId));
          if (qSnap.exists()) {
            const qData = qSnap.data();
            setItems(qData.items || []);
            setDetails({
              title: qData.title || 'Propuesta de Servicios',
              validityDays: qData.validityDays || 5,
              notes: qData.notes || '',
              startDate: qData.startDate || ''
            });
            setContractType(qData.contractType || 'one_time');
            setIsPlanUpdate(qData.isPlanUpdate || false);
            setCurrentVersion(qData.version || 1);
            setCurrentStatus(qData.status || 'draft');
            setParentId(qData.parentId || null);
            setQuotationNumber(qData.quotationNumber || null);
          }
        }
      } catch (e) {
        console.error("Error loading context data:", e);
        toast({ title: "Error", description: "No se pudieron cargar los datos del cliente.", variant: "destructive" });
      } finally {
        setIsLoading(false);
      }
    }
    loadContextData();
  }, [firestore, selectedClientId, quotationId, leadId, toast]);

  // Auto-load existing plan items when selecting "Update Plan"
  useEffect(() => {
    if (isPlanUpdate && items.length === 0 && clientData?.hasActivePlan && clientData.activePlan?.services) {
       const planItems = clientData.activePlan.services;
       
       const newItems: QuoteItem[] = planItems.map((pItem: any) => {
         const svc = services.find((s: any) => s.id === pItem.serviceId);
         return {
           id: crypto.randomUUID(),
           serviceId: pItem.serviceId || 'custom',
           description: pItem.description || svc?.name || 'Servicio del plan actual',
           serviceName: svc?.name || '',
           quantity: pItem.quantity || 1,
           unitPrice: pItem.unitPrice || 0,
           discount: pItem.discount || 0,
           discountValue: pItem.discountValue || 0,
           discountType: pItem.discountType || 'amount',
           ivaType: svc?.ivaType || 'none',
           ivaRate: svc?.ivaRate || 0,
         };
       });
       setItems(newItems);
       toast({ title: "Plan Actual Cargado", description: "Se han recuperado los ítems del plan existente para que los actualices." });
    }
  }, [isPlanUpdate, clientData, services, items.length, toast]);

  const addItem = () => {
    setItems([...items, {
      id: crypto.randomUUID(),
      serviceId: 'custom',
      description: '',
      serviceName: '',
      quantity: 1,
      unitPrice: 0,
      discount: 0,
      discountValue: 0,
      discountType: 'amount',
      ivaType: 'none',
      ivaRate: 0,
    }]);
  };

  const loadPlanIntoQuote = (planId: string) => {
    const plan = predefinedPlans.find(p => p.id === planId);
    if (!plan) return;

    const newItems: QuoteItem[] = plan.items.map(pItem => {
      const service = services.find(s => s.id === pItem.serviceId);

      // Calculate effective unit price if not overridden
      let effectiveUnitPrice = pItem.overridePrice;
      if (effectiveUnitPrice === undefined && service) {
        effectiveUnitPrice = service.basePrice || 0;

        if (service.pricingModel === 'scalable' && pItem.overriddenQuantity !== undefined) {
          const extraUnits = Math.max(0, (pItem.overriddenQuantity || 0) - (service.includedUnits || 0));
          effectiveUnitPrice += extraUnits * (service.unitPrice || 0);
        } else if (service.pricingModel === 'package' && pItem.selectedPackage) {
          const pkg = service.packages?.find(p => p.name === pItem.selectedPackage);
          if (pkg) effectiveUnitPrice = pkg.price;
        }

        if (service.useComplexityMatrix && pItem.selectedComplexityLevel !== undefined) {
          const tier = service.complexityTiers?.find(t => t.level === pItem.selectedComplexityLevel);
          if (tier) effectiveUnitPrice += (tier.surcharge || 0);
        }
      }

      return {
        id: crypto.randomUUID(),
        serviceId: pItem.serviceId,
        serviceName: service?.name || '',
        description: pItem.overrideDescription || service?.description || service?.name || 'Servicio',
        quantity: pItem.quantity,
        unitPrice: effectiveUnitPrice || 0,
        discount: 0,
        discountValue: 0,
        discountType: 'amount',
        ivaType: service?.ivaType || 'none',
        ivaRate: service?.ivaRate || 0,
        // Inherit config
        overriddenQuantity: pItem.overriddenQuantity,
        selectedPackage: pItem.selectedPackage,
        selectedComplexityLevel: pItem.selectedComplexityLevel,
      };
    });

    setItems([...items, ...newItems]);
    setIsPlanLoaderOpen(false);
    toast({ title: "Plan Cargado", description: `Se han añadido ${newItems.length} ítems de ${plan.name}.` });
  };

  const removeItem = (id: string) => {
    setItems(items.filter(i => i.id !== id));
  };

  const updateItem = (id: string, field: keyof QuoteItem, value: any) => {
    let newItems = [...items];
    const idx = newItems.findIndex(i => i.id === id);
    if (idx === -1) return;

    let updated = { ...newItems[idx], [field]: value };

    // Auto-fill and configure based on service change
    if (field === 'serviceId') {
      if (value !== 'custom') {
        const selectedService = services.find(s => s.id === value);
        if (selectedService) {
          updated.serviceName = selectedService.name;
          updated.description = selectedService.description || selectedService.name;
          // Reset config fields on service change
          delete updated.overriddenQuantity;
          delete updated.selectedPackage;
          delete updated.selectedComplexityLevel;

          let baseServicePrice = selectedService.basePrice || 0;

          if (selectedService.pricingModel === 'fixed') {
            updated.quantity = 1;
          } else if (selectedService.pricingModel === 'scalable') {
            updated.quantity = 1;
            updated.overriddenQuantity = selectedService.includedUnits || 1;
            baseServicePrice = selectedService.basePrice || 0;
          } else if (selectedService.pricingModel === 'package' && selectedService.packages && selectedService.packages.length > 0) {
            setActiveServiceForPackage(selectedService);
            setActiveItemIdForPackage(id);
            setIsPackageSelectorOpen(true);
            // We don't return here because we still want to update the basic fields
          }

          // Apply complexity default if active
          if (selectedService.useComplexityMatrix && selectedService.complexityTiers && selectedService.complexityTiers.length > 0) {
            const firstTier = selectedService.complexityTiers[0];
            updated.selectedComplexityLevel = firstTier.level;
            baseServicePrice += firstTier.surcharge || 0;
          }

          updated.unitPrice = baseServicePrice;
          updated.ivaType = selectedService.ivaType || 'none';
          updated.ivaRate = selectedService.ivaRate || 0;
        }
      } else {
        updated.serviceName = '';
        updated.unitPrice = 0;
        updated.quantity = 1;
        updated.ivaType = 'none';
        updated.ivaRate = 0;
      }
    }

    const selectedService = services.find(s => s.id === updated.serviceId);

    // Recalculate if scalable fields change
    if (field === 'overriddenQuantity' && selectedService && selectedService.pricingModel === 'scalable') {
      const extraUnits = Math.max(0, (updated.overriddenQuantity || 0) - (selectedService.includedUnits || 0));
      const extraCost = extraUnits * (selectedService.unitPrice || 0);
      let finalPrice = (selectedService.basePrice || 0) + extraCost;

      if (selectedService.useComplexityMatrix && updated.selectedComplexityLevel !== undefined) {
        const tier = selectedService.complexityTiers?.find(t => t.level === updated.selectedComplexityLevel);
        if (tier) finalPrice += (tier.surcharge || 0);
      }
      updated.unitPrice = finalPrice;
    }

    if (field === 'ivaType') {
      const selectedIva = companySettings.ivaTypes?.find((t: any) => t.id === value);
      updated.ivaType = value;
      updated.ivaRate = selectedIva?.rate || 0;
    }

    // Calculation logic for individual items
    const qty = updated.quantity || 0;
    const price = updated.unitPrice || 0;
    const discVal = updated.discountValue || 0;
    const discType = updated.discountType || 'amount';

    let absDisc = 0;
    if (discType === 'percentage') {
      absDisc = (qty * price) * (discVal / 100);
    } else {
      absDisc = discVal;
    }

    updated.discount = absDisc;

    newItems[idx] = updated;
    setItems(newItems);
  };

  // 3. Calculation Memo (Simplified but precise)
  const itemCalculations = useMemo(() => {
    return items.map(item => {
      const lineTotalBeforeDiscount = (item.quantity || 0) * (item.unitPrice || 0);
      const lineFinal = Math.max(0, lineTotalBeforeDiscount - (item.discount || 0));
      const rate = (item.ivaRate || 0) / 100;
      const base = lineFinal / (1 + rate);
      const tax = lineFinal - base;

      return {
        ...item,
        total: lineFinal,
        subtotal: base,
        tax
      };
    });
  }, [items]);

  const subtotal = useMemo(() => itemCalculations.reduce((acc, item) => acc + item.total, 0), [itemCalculations]);
  const [globalDiscountType, setGlobalDiscountType] = useState<'percentage' | 'amount'>('percentage');
  const [globalDiscountValue, setGlobalDiscountValue] = useState<number>(0);

  const totalDiscounts = useMemo(() => items.reduce((acc, item) => acc + (item.discount || 0), 0), [items]);

  const globalDiscountAmount = useMemo(() => {
    if (globalDiscountType === 'percentage') {
      return subtotal * (globalDiscountValue / 100);
    }
    return Math.min(globalDiscountValue, subtotal);
  }, [subtotal, globalDiscountType, globalDiscountValue]);

  const totalAmount = Math.max(0, subtotal - globalDiscountAmount);

  const discountFactor = subtotal > 0 ? (subtotal - globalDiscountAmount) / subtotal : 0;

  const ivaAmount = useMemo(() =>
    itemCalculations.reduce((acc, item) => acc + item.tax, 0) * discountFactor,
    [itemCalculations, discountFactor]);

  const subtotalAmount = totalAmount - ivaAmount;

  const getStartDateOptions = (): { label: string; value: string }[] => {
    const options: { label: string; value: string }[] = [];
    const now = new Date();
    let currentMonth = now.getMonth();
    let currentYear = now.getFullYear();

    // Generate options for the next 4 months
    for (let i = 0; i < 4; i++) {
      [1, 16].forEach(day => {
        const date = new Date(currentYear, currentMonth, day);
        // Only include future dates (or today)
        if (date.setHours(0, 0, 0, 0) >= new Date().setHours(0, 0, 0, 0)) {
          options.push({
            label: `${day} de ${date.toLocaleString('es-ES', { month: 'long', year: 'numeric' })}`,
            value: date.toISOString().split('T')[0]
          });
        }
      });

      currentMonth++;
      if (currentMonth > 11) {
        currentMonth = 0;
        currentYear++;
      }
    }
    return options.sort((a, b) => a.value.localeCompare(b.value));
  };

  const handleAction = async (action: 'save' | 'publish') => {
    if (!firestore || !selectedClientId) return;

    if (items.length === 0) {
      toast({ title: "Atención", description: "La propuesta debe tener al menos 1 ítem.", variant: "destructive" });
      return;
    }

    if (contractType === 'recurring' && !details.startDate) {
      toast({
        title: "Dato Obligatorio",
        description: "Para contratos recurrentes, debes seleccionar una fecha de inicio del ciclo.",
        variant: "destructive"
      });
      return;
    }

    if (contractType === 'recurring' && clientData?.hasActivePlan && !isPlanUpdate) {
      toast({
        title: "Actuación Prevista",
        description: "El cliente ya tiene un plan activo. Si deseas crear una propuesta recurrente, debes marcarla como una actualización.",
        variant: "destructive"
      });
      return;
    }

    setIsSaving(true);
    try {
      const quotationsRef = collection(firestore, 'clients', selectedClientId, 'quotations');
      const actionStatus = action === 'publish' ? 'published' : 'draft';

      const commonData = {
        clientId: selectedClientId,
        clientName: clientData?.name || 'Sin Nombre',
        clientEmail: clientData?.contactEmail || '',
        leadId,
        title: details.title,
        validityDays: details.validityDays,
        notes: details.notes,
        status: actionStatus,
        contractType,
        isPlanUpdate: contractType === 'recurring' && isPlanUpdate,
        startDate: details.startDate,
        items: itemCalculations,
        totalAmount,
        subtotalAmount,
        totalItemDiscounts: totalDiscounts,
        globalDiscountType,
        globalDiscountValue,
        totalDiscount: globalDiscountAmount,
        taxAmount: ivaAmount,
        applyIva: itemCalculations.some(i => (i.ivaRate ?? 0) > 0),
        taxRate: 0, // Legacy
        ivaAmount: ivaAmount, // For legacy compatibility if needed
      };

      // Brand new quote or Existing Published/Superseded (creating new version)
      if (!quotationId || (currentStatus !== 'draft')) {
        // Generate sequential sequential quotation number
        const nextNumber = await getNextSequenceNumber(firestore, 'quotation');

        const newDocData = {
          ...commonData,
          quotationNumber: nextNumber,
          version: !quotationId ? 1 : currentVersion + 1,
          parentId: quotationId || null,
          createdAt: new Date().toISOString(),
        };

        if (!quotationId) {
          await addDoc(quotationsRef, newDocData);
        } else {
          await updateDoc(doc(firestore, 'clients', selectedClientId, 'quotations', quotationId), { status: 'superseded' });
          await addDoc(quotationsRef, newDocData);
        }
      }
      // Existing Draft
      else if (currentStatus === 'draft' && quotationId) {
        if (action === 'publish' && parentId) {
          await updateDoc(doc(firestore, 'clients', selectedClientId, 'quotations', parentId), { status: 'superseded' });
        }
        
        // Ensure even drafts keep their quotationNumber if they already have one
        // If it's a draft without a number (legacy or first save), we could assign one now
        // But usually we assign it on first save.
        
        const draftDoc = await getDoc(doc(firestore, 'clients', selectedClientId, 'quotations', quotationId));
        let qNumber = draftDoc.data()?.quotationNumber;
        
        if (!qNumber) {
          qNumber = await getNextSequenceNumber(firestore, 'quotation');
        }

        await updateDoc(doc(firestore, 'clients', selectedClientId, 'quotations', quotationId), {
          ...commonData,
          quotationNumber: qNumber,
          updatedAt: new Date().toISOString(),
        });
      }

      toast({ title: "¡Éxito!", description: action === 'publish' ? "Propuesta publicada correctamente." : "Borrador guardado." });
      setShowPreview(false);
      router.push('/solicitudes');

    } catch (e) {
      console.error("Error saving quote:", e);
      toast({ title: "Error", description: "No se pudo guardar la propuesta.", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const exportAndShareQuotation = async (type: 'carta' | 'pos') => {
    setIsExporting(true);
    try {
      const element = document.getElementById(type === 'carta' ? 'print-area-carta-quotation' : 'print-area-pos-quotation');
      if (!element) throw new Error("Plantilla no encontrada");

      const canvas = await html2canvas(element, { scale: 2, useCORS: true });
      const imgData = canvas.toDataURL('image/png');

      const isCarta = type === 'carta';
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: isCarta ? 'a4' : [80, (canvas.height * 80) / canvas.width]
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      const pdfBlob = pdf.output('blob');
      const qNum = quotationNumber || 'Borrador';
      const fileName = `Cotización_${qNum}.pdf`;

      if (navigator.share && navigator.canShare) {
        const file = new File([pdfBlob], fileName, { type: 'application/pdf' });
        if (navigator.canShare({ files: [file] })) {
          await navigator.share({
            title: `Cotización ${qNum}`,
            text: `Adjunto envío la cotización`,
            files: [file]
          });
          toast({ title: 'Cotización compartida' });
          setIsExporting(false);
          return;
        }
      }

      // Fallback
      const url = URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast({ title: 'Cotización descargada' });

    } catch (err) {
      console.error(err);
      toast({ title: 'Error al exportar', variant: 'destructive' });
    } finally {
      setIsExporting(false);
    }
  };

  const handleCreateClient = async () => {
    if (!firestore) return;
    if (!isFormValid) {
      toast({ title: "Datos incompletos", description: "Nombre, apellidos y teléfono son obligatorios.", variant: "destructive" });
      return;
    }

    // Email validation if provided
    if (newClient.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(newClient.email)) {
        toast({ title: "Email inválido", description: "Por favor introduce un correo válido o déjalo vacío.", variant: "destructive" });
        return;
      }
    }

    setIsSaving(true);
    try {
      const { isUnique, conflictField } = await validateClientUniqueness(firestore, newClient.email, newClient.phone);
      if (!isUnique) {
        toast({
          title: "Cliente duplicado",
          description: `Ya existe un cliente con este ${conflictField === 'email' ? 'correo electrónico' : 'número de teléfono'}. Por favor búscalo y selecciónalo de la lista.`,
          variant: "destructive"
        });
        setIsSaving(false);
        return;
      }

      const id = `cli_${Date.now()}`;
      const now = new Date().toISOString();
      const unifiedName = `${newClient.firstName} ${newClient.lastName}`.trim();

      // Standardized client record - Matches CRM exactly
      const clientRecord = {
        id,
        firstName: newClient.firstName,
        lastName: newClient.lastName,
        clientName: unifiedName,
        clientEmail: newClient.email || '',
        clientPhone: newClient.phone,
        company: newClient.company || null,
        isArchived: false,
        portalAccessActive: false,
        source: 'quick_add',
        onboardingType: 'direct',
        createdAt: now,
        updatedAt: now,
      };

      await setDoc(doc(firestore, 'clients', id), clientRecord);

      const clientInfo = {
        id,
        name: unifiedName,
        firstName: newClient.firstName,
        lastName: newClient.lastName,
        contactEmail: newClient.email || '',
        phone: newClient.phone,
        company: newClient.company || ''
      };

      setAllClients(prev => [...prev, clientInfo]);
      setClientData(clientInfo);
      setSelectedClientId(id);
      setIsNewClientOpen(false);
      setNewClient({ firstName: '', lastName: '', email: '', phone: '', company: '' });
      toast({ title: "¡Listo!", description: "Cliente registrado y listo para la propuesta." });
    } catch (e) {
      console.error("Error creating client:", e);
      toast({ title: "Error", description: "No se pudo registrar el cliente.", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <div className="flex h-64 items-center justify-center"><Loader2 className="w-8 h-8 animate-spin" /></div>;
  }

  const filteredClients = allClients.filter(c =>
    c.name.toLowerCase().includes(clientSearch.toLowerCase()) ||
    c.company?.toLowerCase().includes(clientSearch.toLowerCase()) ||
    c.contactEmail.toLowerCase().includes(clientSearch.toLowerCase())
  );

  if (!selectedClientId) {
    return (
      <div className="space-y-6 max-w-5xl mx-auto">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.push('/solicitudes')}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold font-headline">Nueva Propuesta</h1>
            <p className="text-muted-foreground">Selecciona o registra un cliente para comenzar.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          <Card className="md:col-span-5">
            <CardHeader>
              <CardTitle>Seleccionar Cliente</CardTitle>
              <CardDescription>Busca entre tus clientes fijos.</CardDescription>
              <div className="relative mt-2">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Nombre, empresa o email..."
                  className="pl-9"
                  value={clientSearch}
                  onChange={(e) => setClientSearch(e.target.value)}
                />
              </div>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px] pr-4">
                <div className="space-y-2">
                  {filteredClients.length === 0 ? (
                    <div className="text-center py-12 px-4 border-2 border-dashed rounded-xl bg-muted/20">
                      <UserPlus className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                      <p className="text-muted-foreground font-medium mb-4">No se encontraron clientes.</p>
                      <Button variant="outline" size="sm" onClick={() => setIsNewClientOpen(true)} className="gap-2">
                        <Plus className="w-4 h-4" /> Crear Cliente Nuevo
                      </Button>
                    </div>
                  ) : (
                    filteredClients.map(c => (
                      <div
                        key={c.id}
                        onClick={() => setSelectedClientId(c.id)}
                        className="flex items-center justify-between p-4 border rounded-lg hover:border-primary hover:bg-primary/5 cursor-pointer transition-all group"
                      >
                        <div>
                          <p className="font-bold group-hover:text-primary transition-colors">{c.name}</p>
                          <p className="text-sm text-muted-foreground">{c.company || 'Personal'}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs font-medium text-muted-foreground">{c.contactEmail}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          <Card className="md:col-span-7 bg-primary/5 border-primary/20 shadow-xl shadow-primary/5">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-primary">
                <UserPlus className="w-5 h-5" />
                ¿Nuevo Cliente?
              </CardTitle>
              <CardDescription>Regístralo al instante para esta propuesta comercial.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70">Nombre <span className="text-destructive">*</span></Label>
                  <Input
                    id="sq-first-name"
                    name="sq-first-name"
                    autoComplete="off"
                    value={newClient.firstName}
                    onChange={e => setNewClient({ ...newClient, firstName: e.target.value })}
                    placeholder="Ej. Juan"
                    className="bg-card/50"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70">Apellidos <span className="text-destructive">*</span></Label>
                  <Input
                    id="sq-last-name"
                    name="sq-last-name"
                    autoComplete="off"
                    value={newClient.lastName}
                    onChange={e => setNewClient({ ...newClient, lastName: e.target.value })}
                    placeholder="Ej. Pérez"
                    className="bg-card/50"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70">Empresa (Opcional)</Label>
                <Input
                  id="sq-company"
                  name="sq-company"
                  autoComplete="off"
                  value={newClient.company}
                  onChange={e => setNewClient({ ...newClient, company: e.target.value })}
                  placeholder="Ej. Acme Corp"
                  className="bg-card/50"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70">Email (Opcional)</Label>
                <Input
                  id="sq-email"
                  name="sq-email"
                  autoComplete="off"
                  value={newClient.email}
                  onChange={e => setNewClient({ ...newClient, email: e.target.value })}
                  placeholder="email@ejemplo.com"
                  className="bg-card/50"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70">Teléfono <span className="text-destructive">*</span></Label>
                <PhoneInput
                  defaultCountry="CR"
                  placeholder="Introducir número"
                  value={newClient.phone}
                  onChange={val => setNewClient({ ...newClient, phone: val })}
                />
              </div>

              <Button
                onClick={handleCreateClient}
                className="w-full h-11 bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all font-bold"
                disabled={isSaving || !isFormValid}
              >
                {isSaving ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Plus className="w-5 h-5 mr-2" />}
                Registrar y Continuar
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Reusable Dialog for New Client creation */}
        <Dialog open={isNewClientOpen} onOpenChange={setIsNewClientOpen}>
          <DialogContent className="sm:max-w-[450px]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-primary" />
                Registrar Nuevo Cliente
              </DialogTitle>
              <DialogDescription>
                Ingresa los datos del cliente para asociarlo a esta propuesta.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70">Nombre <span className="text-destructive">*</span></Label>
                  <Input
                    value={newClient.firstName}
                    onChange={e => setNewClient({ ...newClient, firstName: e.target.value })}
                    placeholder="Ej. Juan"
                    className="bg-card/50"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70">Apellidos <span className="text-destructive">*</span></Label>
                  <Input
                    value={newClient.lastName}
                    onChange={e => setNewClient({ ...newClient, lastName: e.target.value })}
                    placeholder="Ej. Pérez"
                    className="bg-card/50"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70">Empresa (Opcional)</Label>
                <Input
                  value={newClient.company}
                  onChange={e => setNewClient({ ...newClient, company: e.target.value })}
                  placeholder="Ej. Acme Corp"
                  className="bg-card/50"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70">Email (Opcional)</Label>
                <Input
                  value={newClient.email}
                  onChange={e => setNewClient({ ...newClient, email: e.target.value })}
                  placeholder="email@ejemplo.com"
                  className="bg-card/50"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70">Teléfono <span className="text-destructive">*</span></Label>
                <PhoneInput
                  defaultCountry="CR"
                  placeholder="Introducir número"
                  value={newClient.phone}
                  onChange={val => setNewClient({ ...newClient, phone: val })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsNewClientOpen(false)}>Cancelar</Button>
              <Button
                onClick={handleCreateClient}
                className="gap-2"
                disabled={isSaving || !isFormValid}
              >
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Crear Cliente
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-20">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.push('/solicitudes')}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold font-headline">Constructor de Propuesta</h1>
          <p className="text-muted-foreground">Genera una propuesta formal con los detalles de la empresa.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Company Details */}
        <Card className="bg-primary/5 border-primary/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm uppercase tracking-widest text-primary font-bold">Datos del Emisor</CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-1">
            <p className="font-semibold text-lg">{companySettings?.companyName || 'Empresa No Definida'}</p>
            <p>{companySettings?.companyAddress || 'Configura la dirección en ajustes.'}</p>
            <p>{companySettings?.companyEmail}</p>
            <p>{companySettings?.companyPhone}</p>
          </CardContent>
        </Card>

        {/* Client Details */}
        <Card>
          <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm uppercase tracking-widest text-muted-foreground font-bold">Cobrar a (Cliente)</CardTitle>
            {!clientId && (
              <Button variant="ghost" size="sm" onClick={() => setSelectedClientId(null)} className="h-7 text-xs">Cambiar</Button>
            )}
          </CardHeader>
          <CardContent className="text-sm space-y-1">
            <p className="font-semibold text-lg">{clientData?.name || 'Cliente Desconocido'}</p>
            <p>{clientData?.contactEmail}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Detalles del Documento</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Título de la Propuesta</Label>
              <Input value={details.title} onChange={e => setDetails({ ...details, title: e.target.value })} placeholder="Ej. Paquete de Redes Sociales" />
            </div>
            <div className="space-y-2">
              <Label>Días de Validez</Label>
              <Input type="number" value={details.validityDays} onChange={e => setDetails({ ...details, validityDays: parseInt(e.target.value) || 0 })} />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between mb-2">
                <Label className="text-sm">Tipo de Contrato</Label>
              </div>
              <Tabs
                value={contractType}
                onValueChange={(val: any) => setContractType(val)}
                className="w-full"
              >
                <TabsList className="grid w-full grid-cols-2 h-10">
                  <TabsTrigger value="one_time" className="text-xs flex items-center gap-2">
                    <Package className="w-3 h-3" />
                    Pago Único
                  </TabsTrigger>
                  <TabsTrigger value="recurring" className="text-xs flex items-center gap-2">
                    <Layers className="w-3 h-3" />
                    Plan Mensual
                  </TabsTrigger>
                </TabsList>
              </Tabs>
              {contractType === 'recurring' && clientData?.hasActivePlan && (
                <div className="mt-4 p-3 border rounded-md bg-amber-500/10 border-amber-500/20 text-amber-500 text-sm">
                  <p className="font-bold flex items-center gap-2 mb-2">
                    <Info className="w-4 h-4" /> Este cliente ya tiene un plan activo.
                  </p>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input 
                      type="checkbox" 
                      className="w-4 h-4 rounded border-amber-500/50 bg-transparent text-amber-500 focus:ring-amber-500"
                      checked={isPlanUpdate}
                      onChange={(e) => setIsPlanUpdate(e.target.checked)}
                    />
                    <span>Marcar como actualización de plan existente</span>
                  </label>
                  <p className="text-[10px] mt-1 pl-6 opacity-80">
                    Las actualizaciones prevendrán el cobro del 50% de onboarding. El nuevo monto se aplicará automáticamente en los ciclos recurrentes preestablecidos.
                  </p>
                </div>
              )}
              <p className="text-[10px] text-muted-foreground mt-2 px-1">
                {contractType === 'recurring'
                  ? "🔄 Los servicios se reinician cada mes. Habilita acceso completo al portal."
                  : "✨ Pago por única vez. Los servicios solo aparecerán en el dashboard este mes."}
              </p>
            </div>
            <div className="space-y-2">
              <Label className={contractType === 'recurring' ? "text-primary font-bold" : ""}>
                {contractType === 'recurring' ? 'Fecha de Inicio del Ciclo' : 'Fecha del Servicio'} {contractType === 'recurring' && "*"}
              </Label>
              
              {contractType === 'recurring' ? (
                <>
                  <Select
                    value={details.startDate}
                    onValueChange={(val) => setDetails({ ...details, startDate: val })}
                  >
                    <SelectTrigger className={contractType === 'recurring' && !details.startDate ? "border-destructive ring-1 ring-destructive/20 bg-destructive/5" : ""}>
                      <SelectValue placeholder="Seleccionar inicio..." />
                    </SelectTrigger>
                    <SelectContent>
                      {getStartDateOptions().map(opt => (
                        <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-[10px] text-muted-foreground mt-1">
                    Solo se permiten los días 1 o 16 para alineación de ciclos.
                  </p>
                </>
              ) : (
                <div className="flex gap-2">
                  <PremiumDatePicker
                    date={details.startDate ? new Date(details.startDate) : undefined}
                    onSelect={(date) => setDetails({ ...details, startDate: date ? date.toISOString().split('T')[0] : '' })}
                    placeholder="Sin fecha definida"
                  />
                </div>
              )}
            </div>
          </div>
          <div className="space-y-2">
            <Label>Términos y Notas Visibles</Label>
            <Textarea value={details.notes} onChange={e => setDetails({ ...details, notes: e.target.value })} placeholder="Ej. Condiciones de pago, alcances del proyecto..." className="h-20" />
            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1"><Info className="w-3 h-3" /> Este mensaje aparecerá al pie del PDF.</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Ítems y Servicios</CardTitle>
            <CardDescription>Extrae los precios de tus servicios o crea ítems customizados.</CardDescription>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => setIsPlanLoaderOpen(true)} size="sm" variant="outline" className="border-primary/20 hover:bg-primary/5 text-primary">
              <Layers className="w-4 h-4 mr-2" /> Cargar Plan
            </Button>
            <Button onClick={addItem} size="sm" variant="secondary"><Plus className="w-4 h-4 mr-2" /> Agregar Fila</Button>
          </div>
        </CardHeader>
        <CardContent>
          {items.length === 0 ? (
            <div className="text-center p-8 border-2 border-dashed rounded-lg">
              <p className="text-muted-foreground">No hay servicios agregados. Haz clic en "Agregar Fila".</p>
            </div>
          ) : (
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[280px]">Servicio (Catálogo)</TableHead>
                    <TableHead className="min-w-[200px]">Descripción / Concepto</TableHead>
                    <TableHead className="w-[80px] text-right">Cant.</TableHead>
                    <TableHead className="w-[120px] text-right">Precio</TableHead>
                    <TableHead className="w-[110px] text-right">I.V.A.</TableHead>
                    <TableHead className="w-[180px] text-right">Descuento</TableHead>
                    <TableHead className="w-[120px] text-right">Total</TableHead>
                    <TableHead className="w-[40px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {itemCalculations.map((item) => {
                    const service = services.find(s => s.id === item.serviceId);
                    return (
                      <React.Fragment key={item.id}>
                        {/* Main Row */}
                        <TableRow className={service && service.pricingModel !== 'fixed' ? 'border-b-0' : ''}>
                          <TableCell className="align-top">
                            <Select value={item.serviceId} onValueChange={(val) => updateItem(item.id, 'serviceId', val)}>
                              <SelectTrigger className="h-9">
                                <SelectValue placeholder="Seleccionar" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="custom">Personalizado</SelectItem>
                                {services.map(s => (
                                  <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell className="align-top">
                            <Input
                              value={item.description}
                              onChange={(e) => updateItem(item.id, 'description', e.target.value)}
                              placeholder="Detalle extra..."
                              className="h-9"
                            />
                          </TableCell>
                          <TableCell className="align-top">
                            <Input
                              type="number"
                              min="1"
                              value={item.quantity}
                              onChange={(e) => updateItem(item.id, 'quantity', parseFloat(e.target.value) || 0)}
                              className="text-right h-9"
                              disabled={item.serviceId !== 'custom' && service?.pricingModel !== 'fixed'}
                            />
                          </TableCell>
                          <TableCell className="align-top">
                            <Input
                              type="number"
                              min="0"
                              value={item.unitPrice}
                              onChange={(e) => updateItem(item.id, 'unitPrice', parseFloat(e.target.value) || 0)}
                              className="text-right h-9"
                              disabled={item.serviceId !== 'custom' && service?.pricingModel !== 'fixed'}
                            />
                          </TableCell>
                          <TableCell className="align-top">
                            <Select
                              value={item.ivaType || 'none'}
                              onValueChange={(val) => updateItem(item.id, 'ivaType', val)}
                            >
                              <SelectTrigger className="h-9 px-2">
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
                          <TableCell className="align-top">
                            <div className="flex gap-1">
                              <Input
                                type="number"
                                min="0"
                                value={item.discountValue || 0}
                                onChange={(e) => updateItem(item.id, 'discountValue', parseFloat(e.target.value) || 0)}
                                className="text-right h-9 flex-1"
                              />
                              <Button
                                variant="outline"
                                size="icon"
                                className="h-9 w-9 shrink-0"
                                onClick={() => updateItem(item.id, 'discountType', item.discountType === 'percentage' ? 'amount' : 'percentage')}
                              >
                                {item.discountType === 'percentage' ? '%' : '₡'}
                              </Button>
                            </div>
                          </TableCell>
                          <TableCell className="text-right font-medium align-middle">
                            {formatCurrency(item.total)}
                          </TableCell>
                          <TableCell className="align-top">
                            <Button variant="ghost" size="icon" onClick={() => removeItem(item.id)} className="text-destructive">
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </TableCell>
                        </TableRow>

                        {/* Configuration Row (Scalable / Package / Complexity) */}
                        {service && (service.pricingModel === 'scalable' || service.pricingModel === 'package' || service.useComplexityMatrix) && (
                          <TableRow className="bg-primary/5 hover:bg-primary/10 transition-colors border-t border-primary/10 group">
                            <TableCell colSpan={7} className="py-3 px-4">
                              <div className="flex flex-col gap-4">
                                <div className="flex items-center gap-6 flex-wrap">
                                  {/* Scalable */}
                                  {service.pricingModel === 'scalable' && (
                                    <div className="flex items-center gap-4 flex-1 min-w-[300px]">
                                      <div className="flex items-center gap-2 shrink-0">
                                        <Layers className="w-4 h-4 text-primary" />
                                        <Label className="text-[10px] font-bold uppercase tracking-widest text-primary/70">Unidades totales calculadas:</Label>
                                      </div>
                                      <div className="flex-1 max-w-[200px]">
                                        <Input
                                          type="number"
                                          min="1"
                                          value={item.overriddenQuantity || 1}
                                          onChange={(e) => updateItem(item.id, 'overriddenQuantity', parseInt(e.target.value) || 1)}
                                          className="h-8 bg-background/50 border-primary/20"
                                        />
                                      </div>
                                      <div className="text-xs text-muted-foreground flex items-center gap-2">
                                        <span>Incluye {service.includedUnits} {service.unitType}s base.</span>
                                        <span>Extras: +{formatCurrency(service.unitPrice || 0)}/u.</span>
                                      </div>
                                    </div>
                                  )}

                                  {/* Package Selection */}
                                  {service.pricingModel === 'package' && service.packages && service.packages.length > 0 && (
                                    <div className="flex items-center gap-4 flex-1 min-w-[300px]">
                                      <div className="flex items-center gap-2 shrink-0">
                                        <Package className="w-4 h-4 text-primary" />
                                        <Label className="text-[10px] font-bold uppercase tracking-widest text-primary/70">Paquete Seleccionado:</Label>
                                      </div>
                                      <div className="flex-1 max-w-[200px]">
                                        <Select
                                          value={item.selectedPackage || ''}
                                          onValueChange={(val) => updateItem(item.id, 'selectedPackage', val)}
                                        >
                                          <SelectTrigger className="h-8 bg-background/50 border-primary/20">
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

                                  {/* Complexity Matrix */}
                                  {service.useComplexityMatrix && service.complexityTiers && service.complexityTiers.length > 0 && (
                                    <div className="flex items-center gap-4 flex-1 min-w-[300px]">
                                      <div className="flex items-center gap-2 shrink-0">
                                        <Layers className="w-4 h-4 text-primary" />
                                        <Label className="text-[10px] font-bold uppercase tracking-widest text-primary/70">Nivel de Complejidad:</Label>
                                      </div>
                                      <div className="flex-1 max-w-[200px]">
                                        <Select
                                          value={item.selectedComplexityLevel?.toString() || ''}
                                          onValueChange={(val) => updateItem(item.id, 'selectedComplexityLevel', parseInt(val) || 1)}
                                        >
                                          <SelectTrigger className="h-8 bg-background/50 border-primary/20">
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
          )}

          {items.length > 0 && (
            <div className="flex justify-end mt-6">
              <div className="w-full max-w-sm space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal Base</span>
                  <span>{formatCurrency(subtotal)}</span>
                </div>

                {totalDiscounts > 0 && (
                  <div className="flex justify-between text-sm text-destructive">
                    <span>Descuentos en Líneas</span>
                    <span>- {formatCurrency(totalDiscounts)}</span>
                  </div>
                )}

                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">Descuento Global</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => setGlobalDiscountType(globalDiscountType === 'percentage' ? 'amount' : 'percentage')}
                    >
                      {globalDiscountType === 'percentage' ? '%' : '₡'}
                    </Button>
                  </div>
                  <div className="w-32">
                    <Input
                      type="number"
                      min="0"
                      value={globalDiscountValue}
                      onChange={(e) => setGlobalDiscountValue(parseFloat(e.target.value) || 0)}
                      className="text-right h-8"
                    />
                  </div>
                </div>

                {ivaAmount > 0 && (
                  <div className="flex justify-between text-sm text-muted-foreground pt-2">
                    <span>I.V.A. Total</span>
                    <span>{formatCurrency(ivaAmount)}</span>
                  </div>
                )}
                <Separator />
                <div className="flex justify-between text-lg font-bold text-primary">
                  <span>Total de Propuesta</span>
                  <span>{formatCurrency(totalAmount)}</span>
                </div>
              </div>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-end border-t p-6 bg-card/50">
          <Button size="lg" variant="outline" onClick={() => setShowPreview(true)} disabled={items.length === 0} className="mr-2">
            <FileText className="w-4 h-4 mr-2" />
            Vista Previa
          </Button>
          <Button size="lg" variant="outline" onClick={() => handleAction('save')} disabled={isSaving || items.length === 0} className="mr-2 border-primary/20 hover:bg-primary/5">
            {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
            Guardar Borrador
          </Button>
          <Button size="lg" onClick={() => handleAction('publish')} disabled={isSaving || items.length === 0}>
            {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
            Publicar Cotización
          </Button>
        </CardFooter>
      </Card>

      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-[850px] max-h-[95vh] p-0 overflow-hidden rounded-2xl border-none shadow-2xl bg-slate-950 select-none">
          <div className="flex flex-col h-full bg-slate-950 text-white selection:bg-primary/30">
            <div className="flex justify-between items-center p-4 bg-slate-900 border-b border-white/10 sticky top-0 z-50 backdrop-blur-md">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center border border-primary/40 shadow-inner">
                  <FileText className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <DialogTitle className="font-bold text-lg leading-tight text-white tracking-tight">
                    Vista Previa: {details.title}
                  </DialogTitle>
                  <DialogDescription className="text-xs text-muted-foreground font-medium">
                    {clientData?.name || 'Cliente'} • {formatCurrency(totalAmount)}
                  </DialogDescription>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button 
                  variant="outline" 
                  size="icon" 
                  className="bg-white/5 border-white/10 hover:bg-white/10 text-white rounded-full h-9 w-9" 
                  onClick={() => exportAndShareQuotation('carta')} 
                  disabled={isExporting}
                  title="Exportar Carta"
                >
                  {isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Share className="w-4 h-4" />}
                </Button>
                <Button 
                  variant="outline" 
                  size="icon" 
                  className="bg-white/5 border-white/10 hover:bg-white/10 text-white rounded-full h-9 w-9" 
                  onClick={() => exportAndShareQuotation('pos')} 
                  disabled={isExporting}
                  title="Exportar POS"
                >
                  <Printer className="w-4 h-4" />
                </Button>
                <Button size="sm" onClick={() => handleAction('publish')} disabled={isSaving}>
                  Publicar
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="text-white/40 hover:text-white hover:bg-white/10 rounded-full h-8 w-8" 
                  onClick={() => setShowPreview(false)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <div className="flex-1 overflow-auto bg-slate-900/50 p-8 border-y border-white/5 shadow-inner scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent flex justify-center">
              <div id="print-area-carta-quotation">
                <CartaTemplate 
                  invoice={{
                    title: details.title,
                    issueDate: new Date().toISOString(),
                    items: itemCalculations,
                    totalAmount,
                    subtotalAmount,
                    totalDiscount: globalDiscountAmount,
                    globalDiscountType,
                    globalDiscountValue,
                    taxAmount: ivaAmount,
                    notes: details.notes,
                    validityDays: details.validityDays,
                    invoiceNumber: quotationId || 'Borrador'
                  }}
                  client={clientData}
                  settings={companySettings}
                />
              </div>
            </div>

            {/* Hidden POS for export */}
            <div style={{ position: 'absolute', top: '-9999px', left: '-9999px', opacity: 0 }} id="print-area-pos-quotation">
              <POSTemplate 
                invoice={{
                  invoiceNumber: quotationId || 'Borrador',
                  issueDate: new Date().toISOString(),
                  items: itemCalculations.map(i => ({
                    description: i.description || 'Servicio',
                    quantity: i.quantity,
                    unitPrice: i.unitPrice,
                    total: i.total,
                    ivaRate: i.ivaRate,
                    tax: i.tax
                  })),
                  totalDiscount: globalDiscountAmount,
                  globalDiscountType,
                  globalDiscountValue,
                  taxAmount: ivaAmount,
                  totalAmount: totalAmount,
                  subtotalAmount: subtotalAmount,
                  applyIva: itemCalculations.some(i => (i.ivaRate ?? 0) > 0),
                  status: 'draft',
                } as any}
                client={clientData}
                settings={companySettings}
              />
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Package Selector Dialog */}
      <Dialog open={isPackageSelectorOpen} onOpenChange={setIsPackageSelectorOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Package className="w-5 h-5 text-primary" />
              Seleccionar Paquete de {activeServiceForPackage?.name}
            </DialogTitle>
            <DialogDescription>
              Elige una de las opciones predefinidas para este servicio.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 py-4">
            {activeServiceForPackage?.packages?.map((pkg: any, idx: number) => (
              <Button
                key={idx}
                variant="outline"
                className="justify-between h-auto py-3 px-4 hover:border-primary hover:bg-primary/5 group"
                onClick={() => {
                  if (activeItemIdForPackage && activeServiceForPackage) {
                    const newItems = [...items];
                    const index = newItems.findIndex(i => i.id === activeItemIdForPackage);
                    if (index !== -1) {
                      let finalPrice = pkg.price;
                      const currentItem = newItems[index];

                      // Apply complexity surcharge if already selected
                      if (activeServiceForPackage.useComplexityMatrix && currentItem.selectedComplexityLevel !== undefined) {
                        const tier = activeServiceForPackage.complexityTiers?.find(t => t.level === currentItem.selectedComplexityLevel);
                        if (tier) finalPrice += (tier.surcharge || 0);
                      }

                      newItems[index] = {
                        ...currentItem,
                        serviceId: activeServiceForPackage.id,
                        serviceName: activeServiceForPackage.name,
                        description: `${activeServiceForPackage.name} - ${pkg.name}`,
                        unitPrice: finalPrice,
                        quantity: 1,
                        selectedPackage: pkg.name
                      };
                      setItems(newItems);
                    }
                  }
                  setIsPackageSelectorOpen(false);
                  setActiveServiceForPackage(null);
                  setActiveItemIdForPackage(null);
                }}
              >
                <div className="flex flex-col items-start gap-1 text-left">
                  <span className="font-bold group-hover:text-primary transition-colors">{pkg.name}</span>
                  <span className="text-[10px] text-muted-foreground">{pkg.units} {activeServiceForPackage.unitType || 'unidades'} incluidas</span>
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
      <Dialog open={isPlanLoaderOpen} onOpenChange={setIsPlanLoaderOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 font-headline text-2xl">
              <Layers className="w-6 h-6 text-primary" />
              Catálogo de Planes Predeterminados
            </DialogTitle>
            <DialogDescription>
              Selecciona un plan para cargar todos sus servicios automáticamente en esta propuesta.
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="h-[500px] mt-4 pr-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {predefinedPlans.map(plan => (
                <Card key={plan.id} className="group hover:border-primary transition-all cursor-pointer overflow-hidden flex flex-col" onClick={() => loadPlanIntoQuote(plan.id)}>
                  <CardHeader className="bg-primary/5 group-hover:bg-primary/10 transition-colors">
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-lg">{plan.name}</CardTitle>
                      <Badge variant="outline" className="bg-background">{plan.items.length} ítems</Badge>
                    </div>
                    <CardDescription className="line-clamp-2">{plan.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="py-4 flex-1">
                    <div className="space-y-2">
                      {plan.items.slice(0, 3).map((it, idx) => {
                        const svc = services.find(s => s.id === it.serviceId);
                        return (
                          <div key={idx} className="flex justify-between items-center text-xs">
                            <span className="text-muted-foreground truncate max-w-[150px]">{it.overrideDescription || svc?.name || 'Servicio'}</span>
                            <span className="font-medium">x{it.quantity}</span>
                          </div>
                        );
                      })}
                      {plan.items.length > 3 && (
                        <p className="text-[10px] text-center text-muted-foreground pt-1">+ {plan.items.length - 3} servicios más</p>
                      )}
                    </div>
                  </CardContent>
                  <CardFooter className="bg-muted/50 p-3 flex justify-between items-center text-sm font-bold">
                    <span className="text-primary group-hover:underline">Cargar este plan</span>
                    <span>{formatCurrency(plan.items.reduce((acc, it) => {
                      const svc = services.find(s => s.id === it.serviceId);
                      return acc + (it.quantity * (it.overridePrice || svc?.basePrice || 0));
                    }, 0))}</span>
                  </CardFooter>
                </Card>
              ))}
              {predefinedPlans.length === 0 && (
                <div className="col-span-2 text-center py-20 text-muted-foreground">
                  <Layers className="w-12 h-12 mx-auto mb-4 opacity-20" />
                  <p>No hay planes predeterminados creados.</p>
                </div>
              )}
            </div>
          </ScrollArea>

          <DialogFooter className="mt-4">
            <Button variant="ghost" onClick={() => setIsPlanLoaderOpen(false)}>Cerrar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}
