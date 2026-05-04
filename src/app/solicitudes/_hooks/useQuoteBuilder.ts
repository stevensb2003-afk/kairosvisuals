import { useState, useEffect, useMemo } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useFirestore, useUser } from '@/firebase';
import { collection, doc, getDoc, getDocs, setDoc, addDoc, updateDoc } from 'firebase/firestore';
import { useToast } from "@/hooks/use-toast";
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

import { ProductOrService, PredefinedPlan } from '@/lib/types';
import { getNextSequenceNumber } from '@/lib/billing_utils';
import { validateClientUniqueness } from '@/lib/client_utils';

export interface QuoteItem {
  id: string;
  serviceId: string;
  description: string;
  serviceName?: string;
  quantity: number;
  unitPrice: number;
  discount: number; 
  discountValue: number; 
  discountType: 'percentage' | 'amount';
  ivaType: string;
  ivaRate: number;
  overriddenQuantity?: number;
  selectedPackage?: string;
  selectedComplexityLevel?: number;
}

export interface Client {
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

export interface CompanySettings {
  companyName: string;
  companyAddress: string;
  companyEmail: string;
  companyPhone: string;
  applyIva: boolean;
  ivaTypes?: any[];
}

export function useQuoteBuilder() {
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
  const [globalDiscountType, setGlobalDiscountType] = useState<'percentage' | 'amount'>('percentage');
  const [globalDiscountValue, setGlobalDiscountValue] = useState<number>(0);

  useEffect(() => {
    async function loadInitialData() {
      if (!firestore) return;
      try {
        const settingsSnap = await getDoc(doc(firestore, 'settings', 'general'));
        if (settingsSnap.exists()) {
          setCompanySettings(settingsSnap.data() as CompanySettings);
        }

        const servicesSnap = await getDocs(collection(firestore, 'services'));
        setServices(servicesSnap.docs.map(d => ({ id: d.id, ...d.data() } as ProductOrService)));

        const leadsSnap = await getDocs(collection(firestore, 'requests'));
        const pendingClientIds = new Set(
          leadsSnap.docs.filter(d => d.data().status === 'pending').map(d => d.data().clientId)
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
              hasActivePlan: !!data.activePlan && data.activePlan.status === 'active',
              activePlan: data.activePlan
            } as Client;
          })
          .filter(c => !pendingClientIds.has(c.id) && !c.isArchived);

        setAllClients(officialClients);

        const plansSnap = await getDocs(collection(firestore, 'predefined_plans'));
        setPredefinedPlans(plansSnap.docs.map(d => ({ id: d.id, ...d.data() } as PredefinedPlan)));
      } catch (e) {
        console.error("Error loading initial data:", e);
      }
    }
    loadInitialData();
  }, [firestore]);

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

    if (field === 'serviceId') {
      if (value !== 'custom') {
        const selectedService = services.find(s => s.id === value);
        if (selectedService) {
          updated.serviceName = selectedService.name;
          updated.description = selectedService.description || selectedService.name;
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
          }

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

    const dayOfMonth = now.getDate();
    const thresholdDate = new Date(currentYear, currentMonth, dayOfMonth >= 16 ? 16 : 1);
    thresholdDate.setHours(0, 0, 0, 0);

    for (let i = 0; i < 4; i++) {
      [1, 16].forEach(day => {
        const date = new Date(currentYear, currentMonth, day);
        if (date.setHours(0, 0, 0, 0) >= thresholdDate.getTime()) {
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
        taxRate: 0,
        ivaAmount: ivaAmount,
      };

      if (!quotationId || (currentStatus !== 'draft')) {
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
      } else if (currentStatus === 'draft' && quotationId) {
        if (action === 'publish' && parentId) {
          await updateDoc(doc(firestore, 'clients', selectedClientId, 'quotations', parentId), { status: 'superseded' });
        }

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

  const generatePdfBlob = async (type: 'carta' | 'pos') => {
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
    const fileName = `Cotizacion_${qNum}.pdf`;

    return { pdfBlob, fileName };
  };

  const exportAndShareQuotation = async (type: 'carta' | 'pos') => {
    setIsExporting(true);
    try {
      const { pdfBlob, fileName } = await generatePdfBlob(type);

      if (navigator.share && navigator.canShare) {
        const file = new File([pdfBlob], fileName, { type: 'application/pdf' });
        if (navigator.canShare({ files: [file] })) {
          await navigator.share({
            title: `Cotizacion ${fileName}`,
            text: `Adjunto envío la cotización`,
            files: [file]
          });
          toast({ title: 'Cotización compartida' });
          return;
        }
      }
      
      toast({ title: 'Compartir no soportado', description: 'Tu navegador no soporta compartir archivos directamente. Por favor descarga el PDF.', variant: 'destructive' });

    } catch (err) {
      console.error(err);
      toast({ title: 'Error al compartir', variant: 'destructive' });
    } finally {
      setIsExporting(false);
    }
  };

  const downloadQuotation = async (type: 'carta' | 'pos') => {
    setIsExporting(true);
    try {
      const { pdfBlob, fileName } = await generatePdfBlob(type);

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
      toast({ title: 'Error al descargar', variant: 'destructive' });
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

  return {
    state: {
      isLoading, isSaving, showPreview, currentVersion, currentStatus, parentId, isExporting, quotationNumber,
      selectedClientId, allClients, clientSearch, isNewClientOpen, newClient, isFormValid,
      clientData, companySettings, services, predefinedPlans,
      isPlanLoaderOpen, isPackageSelectorOpen, activeServiceForPackage, activeItemIdForPackage,
      items, details, contractType, isPlanUpdate, globalDiscountType, globalDiscountValue,
      itemCalculations, subtotal, totalDiscounts, globalDiscountAmount, totalAmount, ivaAmount, subtotalAmount
    },
    setters: {
      setShowPreview, setSelectedClientId, setClientSearch, setIsNewClientOpen, setNewClient,
      setIsPlanLoaderOpen, setIsPackageSelectorOpen, setActiveServiceForPackage, setActiveItemIdForPackage,
      setItems, setDetails, setContractType, setIsPlanUpdate, setGlobalDiscountType, setGlobalDiscountValue
    },
    actions: {
      addItem, loadPlanIntoQuote, removeItem, updateItem, getStartDateOptions, handleAction,
      exportAndShareQuotation, downloadQuotation, handleCreateClient
    }
  };
}
