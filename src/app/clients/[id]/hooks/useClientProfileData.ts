import { useEffect, useState, useMemo } from "react";
import { useFirestore, useUser, useDoc } from "@/firebase";
import { collection, query, where, getDocs, doc, getDoc, updateDoc, orderBy } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { Quotation } from '@/lib/types';
import { acceptQuotationClient, processInvoicePayment, generateMonth1Part2, cancelPlanRequest } from '@/lib/billing_utils';
import { INDUSTRIES, EXPECTATIONS, MAIN_GOALS, MOTIVATIONS } from "@/lib/constants";
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export function useClientProfileData(id: string) {
  const { toast } = useToast();
  const firestore = useFirestore();
  const { user } = useUser();

  // Load dynamic briefing configuration
  const configRef = useMemo(() =>
    firestore ? doc(firestore, 'settings', 'briefing') : null,
  [firestore]);

  const { data: config } = useDoc<any>(configRef);

  const industries = config?.industries || INDUSTRIES;
  const expectations = config?.expectations || EXPECTATIONS;
  const mainGoals = config?.mainGoals || MAIN_GOALS;
  const motivations = config?.motivations || MOTIVATIONS;
  const contactSources = config?.contactSources || [
    "Instagram", "TikTok", "Facebook", "LinkedIn", "Referido por un amigo",
    "Google / Búsqueda", "Publicidad Pagada", "Otro"
  ];

  const [isLoading, setIsLoading] = useState(true);
  const [selectedLead, setSelectedLead] = useState<any>(null);
  const [leadOnboarding, setLeadOnboarding] = useState<any>(null);
  const [leadUser, setLeadUser] = useState<any>(null);
  const [leadQuotations, setLeadQuotations] = useState<any[]>([]);
  const [leadInvoices, setLeadInvoices] = useState<any[]>([]);
  const [activeQuotation, setActiveQuotation] = useState<any>(null);
  const [activePlans, setActivePlans] = useState<any[]>([]);
  const [activeProjects, setActiveProjects] = useState<any[]>([]);
  const [clientData, setClientData] = useState<any>(null);

  const [copiedField, setCopiedField] = useState<string | null>(null);

  const [isEditingSocials, setIsEditingSocials] = useState(false);
  const [editableSocials, setEditableSocials] = useState<any[]>([]);

  const PLATFORMS = ["Instagram", "Facebook", "TikTok", "LinkedIn", "YouTube", "X (Twitter)", "Threads", "Pinterest", "Website", "Otro"];
  const [isCancelPlanOpen, setIsCancelPlanOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const [companySettings, setCompanySettings] = useState<any>(null);
  const [previewQuotation, setPreviewQuotation] = useState<Quotation | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [isServicesDetailOpen, setIsServicesDetailOpen] = useState(false);

  const [docsSearchTerm, setDocsSearchTerm] = useState("");

  const filteredQuotations = useMemo(() => {
    if (!docsSearchTerm) return leadQuotations;
    const term = docsSearchTerm.toLowerCase();
    return leadQuotations.filter(q =>
      q.title?.toLowerCase().includes(term) ||
      (q.quotationNumber && `COT-${q.quotationNumber}`.toLowerCase().includes(term)) ||
      q.grandTotal?.toString().includes(term)
    );
  }, [leadQuotations, docsSearchTerm]);

  const filteredInvoices = useMemo(() => {
    if (!docsSearchTerm) return leadInvoices;
    const term = docsSearchTerm.toLowerCase();
    return leadInvoices.filter(inv =>
      inv.title?.toLowerCase().includes(term) ||
      (inv.invoiceNumber && `INV-${inv.invoiceNumber}`.toLowerCase().includes(term)) ||
      inv.id?.toLowerCase().includes(term) ||
      inv.totalAmount?.toString().includes(term)
    );
  }, [leadInvoices, docsSearchTerm]);

  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editableProfile, setEditableProfile] = useState({
    clientName: "",
    company: "",
    clientEmail: "",
    clientPhone: "",
    industry: ""
  });

  const [isBriefingDialogOpen, setIsBriefingDialogOpen] = useState(false);
  const [briefingStep, setBriefingStep] = useState(1);
  const [briefingData, setBriefingData] = useState({
    industry: "",
    aboutBusiness: "",
    expectations: [] as string[],
    mainGoals: [] as string[],
    motivation: "",
    hasSocials: true,
    socials: [] as { platform: string, handle: string }[],
    contactSource: "",
    contactPreference: "whatsapp",
    clientEmail: "",
    clientPhone: ""
  });

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isPreviewOpen && !isEditingProfile && !isBriefingDialogOpen && !isServicesDetailOpen && !isCancelPlanOpen && isMounted) {
      const timer = setTimeout(() => {
        if (typeof document !== 'undefined') {
          if (document.body.style.pointerEvents === 'none') {
            document.body.style.pointerEvents = '';
            document.body.style.overflow = '';
          }
        }
      }, 400);
      return () => clearTimeout(timer);
    }
  }, [isPreviewOpen, isEditingProfile, isBriefingDialogOpen, isServicesDetailOpen, isCancelPlanOpen, isMounted]);

  useEffect(() => {
    if (!firestore || !id) return;

    const fetchClientData = async () => {
      setIsLoading(true);
      try {
        const cliRef = doc(firestore, 'clients', id);
        const cliSnap = await getDoc(cliRef);
        let leadData: any = null;
        let foundInClients = false;

        if (cliSnap.exists()) {
          const d = cliSnap.data();
          leadData = {
            id: id,
            clientId: id,
            ...d,
            clientName: d.clientName || `${d.firstName || ''} ${d.lastName || ''}`.trim() || d.name || id,
            clientEmail: d.clientEmail || d.email,
            clientPhone: d.clientPhone || d.phone,
            company: d.company || d.businessName
          };
          foundInClients = true;
        }

        const reqRef = doc(firestore, 'requests', id);
        const reqSnap = await getDoc(reqRef);

        if (reqSnap.exists()) {
          const rd = reqSnap.data();
          if (!foundInClients) {
            leadData = { id: reqSnap.id, clientId: reqSnap.id, ...rd };
            leadData.clientName = leadData.clientName || (leadData.firstName ? `${leadData.firstName} ${leadData.lastName || ''}` : (leadData.name || leadData.id));
            leadData.clientEmail = leadData.clientEmail || leadData.email;
            leadData.clientPhone = leadData.clientPhone || leadData.phone;
          } else {
            leadData = { ...rd, ...leadData };
          }
        } else if (!foundInClients) {
          const qCli = query(collection(firestore, 'clients'), where('clientId', '==', id));
          const qCliSnap = await getDocs(qCli);
          if (!qCliSnap.empty) {
            const d = qCliSnap.docs[0];
            const dd = d.data();
            leadData = {
              id: d.id,
              clientId: d.id,
              ...dd,
              clientName: dd.clientName || `${dd.firstName || ''} ${dd.lastName || ''}`.trim() || dd.name || d.id,
              clientEmail: dd.clientEmail || dd.email,
              clientPhone: dd.clientPhone || dd.phone
            };
          } else {
            throw new Error("No se encontró el registro del cliente.");
          }
        }

        setSelectedLead(leadData);

        const fetchMetadata = async () => {
          try {
            const clientDocSnap = await getDoc(doc(firestore, 'clients', leadData.clientId));
            if (clientDocSnap.exists()) {
              setClientData(clientDocSnap.data());
            }

            try {
              const userSnap = await getDocs(query(collection(firestore, 'users'), where('id', '==', leadData.clientId)));
              if (!userSnap.empty) {
                setLeadUser(userSnap.docs[0].data());
              } else {
                const directSnap = await getDocs(query(collection(firestore, 'users'), where('uid', '==', leadData.clientId)));
                if (!directSnap.empty) {
                  setLeadUser(directSnap.docs[0].data());
                }
              }
            } catch (e) { }

            try {
              const settingsSnap = await getDoc(doc(firestore, 'settings', 'general'));
              if (settingsSnap.exists()) {
                setCompanySettings(settingsSnap.data());
              }
            } catch (e) {
              console.error("Error fetching settings:", e);
            }

            if (leadData.industry || leadData.aboutBusiness || leadData.mainGoals || leadData.firstName) {
              setLeadOnboarding({
                sector: leadData.industry,
                businessDetails: leadData.aboutBusiness,
                expectations: leadData.expectations,
                mainGoal: leadData.mainGoals,
                motivation: leadData.motivation,
                socials: leadData.socials,
                contactSource: leadData.contactSource,
                preference: leadData.contactPreference || leadData.preference,
                isMigrated: true
              });
            }

            try {
              const qQuotes = query(collection(firestore, 'clients', leadData.clientId, 'quotations'), orderBy('createdAt', 'desc'));
              const quotesSnap = await getDocs(qQuotes);
              const quotes = quotesSnap.docs.map(d => ({ id: d.id, ...d.data() }));
              setLeadQuotations(quotes);

              const acceptedQuotations = quotes.filter((q: any) => q.status === 'accepted');
              const recurringPlans = acceptedQuotations.filter((q: any) => q.contractType === 'recurring');
              const oneTimeProjects = acceptedQuotations.filter((q: any) => q.contractType !== 'recurring');

              setActivePlans(recurringPlans);
              setActiveProjects(oneTimeProjects);

              const active = recurringPlans[0] || acceptedQuotations[0];
              if (active) setActiveQuotation(active);
            } catch (e) {
              console.warn("Could not fetch quotations", e);
            }

            try {
              const qInvoices = query(collection(firestore, 'clients', leadData.clientId, 'invoices'), orderBy('createdAt', 'desc'));
              const invoicesSnap = await getDocs(qInvoices);
              setLeadInvoices(invoicesSnap.docs.map(d => ({ id: d.id, ...d.data() })));
            } catch (e) {
              console.warn("Could not fetch invoices", e);
            }
          } catch (me) {
            console.error("Error in metadata fetching", me);
          }
        };

        fetchMetadata();

      } catch (error: any) {
        console.error("Error fetching lead details", error);
        toast({ variant: "destructive", title: "Error", description: error.message || "Error al cargar la ficha." });
      } finally {
        setIsLoading(false);
      }
    };

    fetchClientData();
  }, [firestore, id]);

  const handleStartEditSocials = () => {
    setEditableSocials(leadOnboarding?.socials || []);
    setIsEditingSocials(true);
  };

  const handleCancelEditSocials = () => {
    setIsEditingSocials(false);
    setEditableSocials([]);
  };

  const handleAddSocialRow = () => {
    setEditableSocials([...editableSocials, { platform: "Instagram", handle: "", url: "" }]);
  };

  const handleRemoveSocialRow = (index: number) => {
    const newSocials = [...editableSocials];
    newSocials.splice(index, 1);
    setEditableSocials(newSocials);
  };

  const handleUpdateSocialField = (index: number, field: string, value: string) => {
    const newSocials = [...editableSocials];
    newSocials[index] = { ...newSocials[index], [field]: value };
    setEditableSocials(newSocials);
  };

  const handleSaveSocials = async () => {
    if (!firestore || !id) return;
    setIsProcessing(true);
    try {
      const cleanSocials = editableSocials.filter(s => s.platform && s.handle);
      const clientRef = doc(firestore, 'clients', id);
      await updateDoc(clientRef, { socials: cleanSocials });

      try {
        const requestRef = doc(firestore, 'requests', id);
        const reqSnap = await getDoc(requestRef);
        if (reqSnap.exists()) {
          await updateDoc(requestRef, { socials: cleanSocials });
        }
      } catch (e) {
        console.warn("Could not update requests doc", e);
      }

      setLeadOnboarding((prev: any) => ({ ...prev, socials: cleanSocials }));
      setIsEditingSocials(false);

      toast({
        title: "Redes sociales actualizadas",
        description: "La información de presencia digital se ha guardado correctamente.",
      });
    } catch (error: any) {
      console.error("Error saving socials:", error);
      toast({
        title: "Error al guardar",
        description: "No se pudieron actualizar las redes sociales.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    toast({
      title: "Copiado al portapapeles",
      description: `${field} ha sido copiado correctamente.`,
    });
    setTimeout(() => setCopiedField(null), 2000);
  };

  const markAsContacted = async () => {
    if (!firestore || !selectedLead) return;
    try {
      await updateDoc(doc(firestore, 'requests', selectedLead.id), {
        status: 'contacted',
        updatedAt: new Date().toISOString()
      });
      toast({ title: "Solicitud movida a 'En Gestión'" });
      setSelectedLead({ ...selectedLead, status: 'contacted' });
    } catch (error) {
      toast({ variant: "destructive", title: "Error" });
    }
  };

  const handleGenerateMonth1Part2 = async () => {
    if (!firestore || !id) return;
    setIsProcessing(true);
    try {
      await generateMonth1Part2(firestore, id, selectedLead?.clientName || 'Cliente');
      toast({ title: "Parte 2 generada", description: "La segunda factura de inicio se ha creado." });
      window.location.reload();
    } catch (error: any) {
      toast({ variant: "destructive", title: "Error", description: error.message });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCancelPlan = async () => {
    if (!firestore || !id) return;
    setIsProcessing(true);
    try {
      const { isLate } = await cancelPlanRequest(firestore, id, selectedLead?.clientName || 'Cliente');
      toast({
        title: "Plan cancelado",
        description: isLate ? "Cancelado con recargo por cancelación tardía." : "Cancelado exitosamente a tiempo."
      });
      window.location.reload();
    } catch (error: any) {
      toast({ variant: "destructive", title: "Error", description: error.message });
    } finally {
      setIsProcessing(false);
      setIsCancelPlanOpen(false);
    }
  };

  const handleProcessInvoicePayment = async (inv: any) => {
    if (!firestore || !id) return;
    setIsProcessing(true);
    try {
      await processInvoicePayment(firestore, id, inv, selectedLead?.clientName || 'Cliente');
      toast({ title: "Pago Procesado", description: "La factura ha sido marcada como pagada." });
      window.location.reload();
    } catch (error: any) {
      toast({ variant: "destructive", title: "Error", description: error.message });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAcceptQuotation = async (q: any) => {
    if (!firestore || !id) return;
    setIsProcessing(true);
    try {
      await acceptQuotationClient(firestore, q, selectedLead, q.isPlanUpdate || false);
      toast({ title: "Propuesta Aceptada", description: "Se ha generado el plan y la factura inicial." });
      window.location.reload();
    } catch (error: any) {
      toast({ variant: "destructive", title: "Error", description: error.message });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleArchiveClient = async () => {
    if (!firestore || !id) return;
    setIsProcessing(true);
    try {
      await updateDoc(doc(firestore, 'clients', id), {
        isArchived: true,
        updatedAt: new Date().toISOString()
      });
      setClientData((prev: any) => ({ ...prev, isArchived: true }));
      setSelectedLead((prev: any) => ({ ...prev, isArchived: true }));
      toast({ title: "Cliente archivado correctamente" });
    } catch (error) {
      console.error("Error archiving client:", error);
      toast({ variant: "destructive", title: "Error al archivar cliente" });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleUnarchiveClient = async () => {
    if (!firestore || !id) return;
    setIsProcessing(true);
    try {
      await updateDoc(doc(firestore, 'clients', id), {
        isArchived: false,
        updatedAt: new Date().toISOString()
      });
      setClientData((prev: any) => ({ ...prev, isArchived: false }));
      setSelectedLead((prev: any) => ({ ...prev, isArchived: false }));
      toast({ title: "Cliente restaurado correctamente" });
    } catch (error) {
      console.error("Error unarchiving client:", error);
      toast({ variant: "destructive", title: "Error al restaurar cliente" });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleOpenEditProfile = () => {
    setEditableProfile({
      clientName: selectedLead.clientName || "",
      company: selectedLead.company || "",
      clientEmail: selectedLead.clientEmail || "",
      clientPhone: selectedLead.clientPhone || "",
      industry: leadOnboarding?.sector || selectedLead.industry || ""
    });
    setIsEditingProfile(true);
  };

  const handleSaveProfile = async () => {
    if (!firestore || !id) return;
    setIsProcessing(true);
    try {
      const clientRef = doc(firestore, 'clients', id);
      await updateDoc(clientRef, {
        clientName: editableProfile.clientName,
        company: editableProfile.company,
        clientEmail: editableProfile.clientEmail,
        clientPhone: editableProfile.clientPhone,
        industry: editableProfile.industry,
        updatedAt: new Date().toISOString()
      });

      setSelectedLead((prev: any) => ({
        ...prev,
        clientName: editableProfile.clientName,
        company: editableProfile.company,
        clientEmail: editableProfile.clientEmail,
        clientPhone: editableProfile.clientPhone
      }));

      if (leadOnboarding) {
        setLeadOnboarding((prev: any) => ({ ...prev, sector: editableProfile.industry }));
      }

      setIsEditingProfile(false);
      toast({ title: "Perfil actualizado", description: "Los datos básicos se han guardado correctamente." });
    } catch (error: any) {
      console.error("Error saving profile:", error);
      toast({ variant: "destructive", title: "Error al guardar", description: error.message });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleOpenBriefing = () => {
    setBriefingData({
      industry: leadOnboarding?.sector || selectedLead?.industry || "",
      aboutBusiness: leadOnboarding?.businessDetails || selectedLead?.aboutBusiness || "",
      expectations: leadOnboarding?.expectations || selectedLead?.expectations || [],
      mainGoals: leadOnboarding?.mainGoal || selectedLead?.mainGoals || [],
      motivation: leadOnboarding?.motivation || selectedLead?.motivation || "",
      hasSocials: (leadOnboarding?.socials?.length > 0) || (selectedLead?.socials?.length > 0) || true,
      socials: leadOnboarding?.socials || selectedLead?.socials || [],
      contactSource: leadOnboarding?.contactSource || selectedLead?.contactSource || "",
      contactPreference: leadOnboarding?.contactPreference || selectedLead?.contactPreference || "whatsapp",
      clientEmail: selectedLead?.clientEmail || "",
      clientPhone: selectedLead?.clientPhone || ""
    });
    setBriefingStep(1);
    setIsBriefingDialogOpen(true);
  };

  const handleSaveBriefing = async () => {
    if (!firestore || !id) return;
    setIsProcessing(true);
    try {
      const clientRef = doc(firestore, 'clients', id);
      const updateData = {
        industry: briefingData.industry,
        aboutBusiness: briefingData.aboutBusiness,
        expectations: briefingData.expectations,
        mainGoals: briefingData.mainGoals,
        motivation: briefingData.motivation,
        socials: briefingData.socials,
        contactSource: briefingData.contactSource,
        contactPreference: briefingData.contactPreference,
        clientEmail: briefingData.clientEmail,
        clientPhone: briefingData.clientPhone,
        updatedAt: new Date().toISOString()
      };

      await updateDoc(clientRef, updateData);

      setLeadOnboarding((prev: any) => ({
        ...prev || {},
        sector: briefingData.industry,
        businessDetails: briefingData.aboutBusiness,
        expectations: briefingData.expectations,
        mainGoal: briefingData.mainGoals,
        motivation: briefingData.motivation,
        socials: briefingData.socials,
        contactSource: briefingData.contactSource,
        contactPreference: briefingData.contactPreference,
        isMigrated: true
      }));

      setSelectedLead((prev: any) => ({
        ...prev,
        ...updateData
      }));

      setIsBriefingDialogOpen(false);
      toast({ title: "Briefing actualizado", description: "La información estratégica ha sido guardada." });
    } catch (error: any) {
      console.error("Error updating briefing:", error);
      toast({ variant: "destructive", title: "Error", description: "No se pudo actualizar el briefing." });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleToggleBriefingSelection = (field: 'expectations' | 'mainGoals', value: string) => {
    setBriefingData(prev => {
      const current = prev[field];
      if (current.includes(value)) {
        return { ...prev, [field]: current.filter(id => id !== value) };
      }
      if (current.length < 3) {
        return { ...prev, [field]: [...current, value] };
      }
      toast({
        title: "Límite alcanzado",
        description: "Puedes seleccionar un máximo de 3 opciones.",
        variant: "destructive"
      });
      return prev;
    });
  };

  const handlePrint = () => {
    window.print();
  };

  const generatePdfBlob = async (elementId: string, qNum: string) => {
    const element = document.getElementById(elementId);
    if (!element) throw new Error("Plantilla no encontrada");

    const canvas = await html2canvas(element, { scale: 2, useCORS: true });
    const imgData = canvas.toDataURL('image/png');

    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
    const pdfBlob = pdf.output('blob');
    const fileName = `Cotizacion_${qNum}.pdf`;
    
    return { pdfBlob, fileName };
  };

  const handleDownload = async () => {
    if (!previewQuotation) return;
    setIsProcessing(true);
    try {
      const qNum = String(previewQuotation.quotationNumber || previewQuotation.id);
      const { pdfBlob, fileName } = await generatePdfBlob('print-area-carta', qNum);
      
      const url = URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      toast({ title: "Descarga exitosa", description: "El PDF se ha generado correctamente." });
    } catch (error) {
      console.error("PDF Error:", error);
      toast({ variant: "destructive", title: "Error", description: "No se pudo generar el PDF." });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSharePdf = async () => {
    if (!previewQuotation) return;
    setIsProcessing(true);
    try {
      const qNum = String(previewQuotation.quotationNumber || previewQuotation.id);
      const { pdfBlob, fileName } = await generatePdfBlob('print-area-carta', qNum);

      if (navigator.share && navigator.canShare) {
        const file = new File([pdfBlob], fileName, { type: 'application/pdf' });
        if (navigator.canShare({ files: [file] })) {
          await navigator.share({
            title: `Cotizacion ${previewQuotation.title || qNum}`,
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
      setIsProcessing(false);
    }
  };

  const handleShareWhatsApp = () => {
    if (!previewQuotation || !selectedLead) return;
    const phone = (selectedLead.clientPhone || selectedLead.phone)?.replace(/\D/g, '');
    const clientName = selectedLead.clientName || selectedLead.name || `${selectedLead.firstName || ''} ${selectedLead.lastName || ''}`.trim() || 'Cliente';
    const message = `Hola ${clientName}, te adjunto la propuesta *${previewQuotation.title || 'Cotización'}* por un monto de ₡${(previewQuotation.totalAmount || previewQuotation.total || 0).toLocaleString()}. ¡Quedo atento!`;
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, '_blank');
  };

  const hasOverdueInvoices       = leadInvoices.some(inv => inv.status === 'overdue');
  const hasPendingInvoices       = leadInvoices.some(inv => inv.status === 'pending');
  const hasSentInvoices          = leadInvoices.some(inv => inv.status === 'sent');
  const hasPartialInvoices       = leadInvoices.some(inv => inv.status === 'partially_paid');
  const hasPendingVerifInvoices  = leadInvoices.some(inv => inv.status === 'pending_verification');
  const hasPaidInvoices          = leadInvoices.some(inv => inv.status === 'paid');
  const hasAnyActivePlan         = activePlans.length > 0 || activeProjects.length > 0;

  const isAccountPending = hasOverdueInvoices || hasPendingInvoices || hasPartialInvoices || hasSentInvoices;

  let accountStatusLabel = 'Sin actividad';
  let accountStatusDescription = 'Sin registros financieros';

  if (hasOverdueInvoices) {
    accountStatusLabel = 'Vencida';
    accountStatusDescription = 'Hay facturas vencidas sin pagar — acción urgente requerida';
  } else if (hasPendingInvoices) {
    accountStatusLabel = 'Pendiente';
    accountStatusDescription = 'Existen facturas por pagar';
  } else if (hasPartialInvoices) {
    accountStatusLabel = 'Pago Parcial';
    accountStatusDescription = 'Facturas con abonos aplicados, saldo pendiente';
  } else if (hasSentInvoices) {
    accountStatusLabel = 'Factura Enviada';
    accountStatusDescription = 'Factura enviada al cliente, en espera de pago';
  } else if (hasPendingVerifInvoices) {
    accountStatusLabel = 'Verificando Pago';
    accountStatusDescription = 'Pago recibido, pendiente de confirmación';
  } else if (!hasPendingInvoices && hasPaidInvoices && hasAnyActivePlan) {
    accountStatusLabel = 'Al día';
    accountStatusDescription = 'Pagos actualizados y servicios activos';
  } else if (!hasPendingInvoices && hasPaidInvoices && !hasAnyActivePlan) {
    accountStatusLabel = 'Sin Plan Activo';
    accountStatusDescription = 'No hay planes o servicios vigentes';
  } else if (!hasPendingInvoices && !hasPaidInvoices && hasAnyActivePlan) {
    accountStatusLabel = 'Nueva Cuenta';
    accountStatusDescription = 'Servicios iniciados, sin facturas aún';
  }

  const isAccountOk = !isAccountPending && (accountStatusLabel === 'Al día' || accountStatusLabel === 'Nueva Cuenta' || accountStatusLabel === 'Verificando Pago');

  return {
    isLoading,
    selectedLead,
    leadOnboarding,
    leadUser,
    activeQuotation,
    activePlans,
    activeProjects,
    clientData,
    copiedField,
    isEditingSocials,
    editableSocials,
    PLATFORMS,
    isCancelPlanOpen,
    setIsCancelPlanOpen,
    isProcessing,
    companySettings,
    previewQuotation,
    setPreviewQuotation,
    isPreviewOpen,
    setIsPreviewOpen,
    isServicesDetailOpen,
    setIsServicesDetailOpen,
    docsSearchTerm,
    setDocsSearchTerm,
    filteredQuotations,
    filteredInvoices,
    isEditingProfile,
    setIsEditingProfile,
    editableProfile,
    setEditableProfile,
    isBriefingDialogOpen,
    setIsBriefingDialogOpen,
    briefingStep,
    setBriefingStep,
    briefingData,
    setBriefingData,
    accountStatusLabel,
    accountStatusDescription,
    isAccountPending,
    isAccountOk,
    industries,
    expectations,
    mainGoals,
    motivations,
    contactSources,
    
    // Handlers
    handleStartEditSocials,
    handleCancelEditSocials,
    handleAddSocialRow,
    handleRemoveSocialRow,
    handleUpdateSocialField,
    handleSaveSocials,
    copyToClipboard,
    markAsContacted,
    handleGenerateMonth1Part2,
    handleCancelPlan,
    handleProcessInvoicePayment,
    handleAcceptQuotation,
    handleArchiveClient,
    handleUnarchiveClient,
    handleOpenEditProfile,
    handleSaveProfile,
    handleOpenBriefing,
    handleSaveBriefing,
    handleToggleBriefingSelection,
    handlePrint,
    handleDownload,
    handleSharePdf,
    handleShareWhatsApp
  };
}
