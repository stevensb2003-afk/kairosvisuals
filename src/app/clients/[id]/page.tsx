"use client";

import React, { useEffect, useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { useFirestore, useUser, useDoc } from "@/firebase";
import { collection, query, where, getDocs, doc, getDoc, updateDoc, orderBy, setDoc } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { formatPhone } from "@/lib/utils";
import {
  Loader2, Sparkles, CheckCircle, Receipt, Contact, LayoutDashboard, User,
  Zap, Calendar, AlertTriangle, MessageCircle, Mail, Copy, Check, ExternalLink, Globe, TrendingUp, FileText, ArrowLeft,
  Phone, MessageSquare, Plus, Trash2, Edit2, Save, X, Link, AtSign, Building, Target, ChevronRight,
  Instagram, Facebook, Music2, Linkedin, Twitter, Youtube, Search as S,
  Eye,
  Printer,
  Download,
  Share2,
  SearchIcon
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle
} from "@/components/ui/alert-dialog";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose, DialogDescription
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { PhoneInput } from "@/components/ui/phone-input";
import { CartaTemplate } from '@/components/invoicing/DocumentTemplates';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { Quotation } from '@/lib/types';
import { formatCurrency, cn } from '@/lib/utils';
import { acceptQuotationClient, processInvoicePayment, generateMonth1Part2, cancelPlanRequest } from '@/lib/billing_utils';


const INDUSTRIES = [
  "Bienes Raíces", "Marcas Personales", "E-commerce", "Salud y Bienestar", "Gastronomía",
  "Tecnología / SaaS", "Educación", "Servicios Profesionales", "Construcción / Arquitectura", "Otro"
];

const EXPECTATIONS = [
  "Crear y Fidelizar una Comunidad Activa",
  "Generar más Leads y Consultas de Clientes",
  "Educación de Audiencia sobre mis Servicios",
  "Identidad de Marca Coherente",
  "Diseño Visual de Alto Impacto",
  "Estrategia de Contenido Clara"
];

const MAIN_GOALS = [
  "Escalar Ventas en un 50% o más",
  "Posicionarme como Referente No. 1 en mi Nicho",
  "Automatizar Marketing para Liberar mi Tiempo",
  "Lanzar un Nuevo Producto o Servicio",
  "Internacionalizar mi Marca",
  "Mejorar el Enganche (Engagement)"
];

const MOTIVATIONS = [
  "Delegar las redes porque no tengo tiempo",
  "Mi marca actual se ve anticuada",
  "Acabo de iniciar un nuevo proyecto",
  "No estoy logrando resultados con mi imagen actual",
  "Quiero llevar mi negocio al siguiente nivel"
];

export default function ClientProfilePage() {
  const { id } = useParams() as { id: string };
  const router = useRouter();
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

  // Estados para edición de redes sociales
  const [isEditingSocials, setIsEditingSocials] = useState(false);
  const [editableSocials, setEditableSocials] = useState<any[]>([]);

  const PLATFORMS = ["Instagram", "Facebook", "TikTok", "LinkedIn", "YouTube", "X (Twitter)", "Threads", "Pinterest", "Website", "Otro"];
  const [isCancelPlanOpen, setIsCancelPlanOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // States for Quotation Preview (Standard)
  const [companySettings, setCompanySettings] = useState<any>(null);
  const [previewQuotation, setPreviewQuotation] = useState<Quotation | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [isServicesDetailOpen, setIsServicesDetailOpen] = useState(false);

  // Estados de filtrado para documentos
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

  // Estados para edición de perfil
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editableProfile, setEditableProfile] = useState({
    clientName: "",
    company: "",
    clientEmail: "",
    clientPhone: "",
    industry: ""
  });

  // Estados para completar briefing
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

  // Safety fix for "Ghost Overlay" issue in Radix/Shadcn Dialogs
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
        // 1. Intentar cargar desde /clients primero (prioridad absoluta para datos maestros)
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
            // Prioridad a campos específicos si existen
            clientName: d.clientName || `${d.firstName || ''} ${d.lastName || ''}`.trim() || d.name || id,
            clientEmail: d.clientEmail || d.email,
            clientPhone: d.clientPhone || d.phone,
            company: d.company || d.businessName
          };
          foundInClients = true;
        }

        // 2. Cargar desde /requests para info histórica/onboarding si existe
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
            // Combinamos, pero leadData (que ya tiene info de clients) tiene prioridad
            leadData = { ...rd, ...leadData };
          }
        } else if (!foundInClients) {
          // 3. Intento final: buscar por field clientId en /clients (si el ID de URL no es el ID de doc directo)
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

        // Sub-fetches in parallel to speed up and handle partial failures
        const fetchMetadata = async () => {
          try {
            // 2. Fetch Client Doc from /clients para info de categoría y plan activo
            const clientDocSnap = await getDoc(doc(firestore, 'clients', leadData.clientId));
            if (clientDocSnap.exists()) {
              setClientData(clientDocSnap.data());
            }

            // 3. Fetch User profile (users)
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

            // 3.5. Fetch Company Settings
            try {
              const settingsSnap = await getDoc(doc(firestore, 'settings', 'general'));
              if (settingsSnap.exists()) {
                setCompanySettings(settingsSnap.data());
              }
            } catch (e) {
              console.error("Error fetching settings:", e);
            }

            // 4. Onboarding data map
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

            // 5. Fetch Quotations
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

            // 6. Fetch Invoices
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
      // Filtrar entradas vacías
      const cleanSocials = editableSocials.filter(s => s.platform && s.handle);

      // Actualizar en /clients
      const clientRef = doc(firestore, 'clients', id);
      await updateDoc(clientRef, { socials: cleanSocials });

      // Intentar actualizar en /requests si existe por el mismo ID
      try {
        const requestRef = doc(firestore, 'requests', id);
        const reqSnap = await getDoc(requestRef);
        if (reqSnap.exists()) {
          await updateDoc(requestRef, { socials: cleanSocials });
        }
      } catch (e) {
        console.warn("Could not update requests doc, maybe it doesn't exist with this ID", e);
      }

      // Actualizar estado local
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
      // No reload needed if we rely on useEffect fetching or reload page
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

  // Handlers para edición de perfil
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

      // Sync local state
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

  // Handlers para completar briefing
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

      // Sincronizar estado local de onboarding
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

      // También actualizar el cliente seleccionado si es necesario
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

  const handleDownload = async () => {
    if (!previewQuotation) return;
    setIsProcessing(true);
    try {
      const element = document.getElementById('print-area-carta');
      if (!element) throw new Error("No se encontró el área de impresión");

      const canvas = await html2canvas(element, { scale: 2, useCORS: true });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgProps = pdf.getImageProperties(imgData);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`Cotización_${previewQuotation.quotationNumber || previewQuotation.id}.pdf`);
      toast({ title: "Descarga exitosa", description: "El PDF se ha generado correctamente." });
    } catch (error) {
      console.error("PDF Error:", error);
      toast({ variant: "destructive", title: "Error", description: "No se pudo generar el PDF." });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleShare = () => {
    if (!previewQuotation || !selectedLead) return;
    const phone = selectedLead.clientPhone?.replace(/\D/g, '');
    const message = `Hola ${selectedLead.clientName}, te adjunto la propuesta *${previewQuotation.title}* por un monto de ₡${(previewQuotation.totalAmount || previewQuotation.total || 0).toLocaleString()}. ¡Quedo atento!`;
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, '_blank');
  };


  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-20 gap-4 min-h-screen">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
        <p className="text-sm font-medium text-muted-foreground animate-pulse">Cargando expediente del cliente...</p>
      </div>
    );
  }

  if (!selectedLead) {
    return (
      <div className="flex flex-col items-center justify-center p-20 gap-4 min-h-[50vh]">
        <AlertTriangle className="w-12 h-12 text-destructive" />
        <h2 className="text-xl font-bold">Cliente no encontrado</h2>
        <Button onClick={() => router.push('/clients')} variant="outline">Volver a Clientes</Button>
      </div>
    );
  }

  // Detección completa de estados de factura
  const hasOverdueInvoices       = leadInvoices.some(inv => inv.status === 'overdue');
  const hasPendingInvoices       = leadInvoices.some(inv => inv.status === 'pending');
  const hasSentInvoices          = leadInvoices.some(inv => inv.status === 'sent');
  const hasPartialInvoices       = leadInvoices.some(inv => inv.status === 'partially_paid');
  const hasPendingVerifInvoices  = leadInvoices.some(inv => inv.status === 'pending_verification');
  const hasPaidInvoices          = leadInvoices.some(inv => inv.status === 'paid');
  const hasAnyActivePlan         = activePlans.length > 0 || activeProjects.length > 0;

  // El estado más crítico/urgente toma precedencia (orden: vencida > pendiente > parcial > enviada > verificando > pagada > nueva)
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
  } else {
    accountStatusLabel = 'Sin actividad';
    accountStatusDescription = 'No hay historial de planes ni facturas';
  }

  const isAccountOk = !isAccountPending && (accountStatusLabel === 'Al día' || accountStatusLabel === 'Nueva Cuenta' || accountStatusLabel === 'Verificando Pago');

  return (
    <div className="container mx-auto max-w-7xl p-4 md:p-6 space-y-6">
      {/* Header Navigation */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b pb-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.push('/clients')} className="shrink-0 h-10 w-10">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold font-headline flex items-center gap-2">
              {selectedLead.clientName}
              {selectedLead.isArchived && (
                <Badge variant="outline" className="text-[10px] bg-red-500/10 text-red-600 border-red-500/20">Archivado</Badge>
              )}
            </h1>
            <p className="text-muted-foreground text-sm flex items-center gap-2">
              <span className="font-medium text-foreground">{selectedLead.company || 'Empresa no especificada'}</span>
              <span>•</span>
              <span>ID: {selectedLead.clientId?.substring(0, 8)}...</span>
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="gap-2 border-primary/30 text-primary hover:bg-primary/5 shadow-sm" onClick={() => router.push(`/invoicing/create?clientId=${selectedLead.clientId || selectedLead.id}`)}>
            <Receipt className="w-4 h-4" /> Nueva Factura
          </Button>
          <Button variant="outline" className="gap-2" onClick={() => router.push(`/solicitudes/create?leadId=${selectedLead.id}&clientId=${selectedLead.clientId}`)}>
            <FileText className="w-4 h-4" /> Nueva Propuesta
          </Button>
          {selectedLead.status === 'pending' && (
            <Button onClick={markAsContacted} className="bg-primary hover:bg-primary/90">
              <CheckCircle className="w-4 h-4 mr-2" /> Atender Solicitud
            </Button>
          )}
          {selectedLead.isArchived ? (
            <Button variant="outline" className="gap-2 border-emerald-500/30 text-emerald-600 hover:bg-emerald-50" onClick={handleUnarchiveClient} disabled={isProcessing}>
              <TrendingUp className="w-4 h-4" /> Restaurar Cliente
            </Button>
          ) : (
            <Button variant="outline" className="gap-2 border-red-500/30 text-red-600 hover:bg-red-50" onClick={handleArchiveClient} disabled={isProcessing}>
              <AlertTriangle className="w-4 h-4" /> Archivar
            </Button>
          )}
        </div>
      </div>

      {/* Tabs Layout */}
      <Tabs defaultValue="dashboard" className="w-full mt-6">
        <TabsList className="bg-muted/50 p-1 rounded-xl gap-2 overflow-x-auto justify-start border border-border/50">
          <TabsTrigger value="dashboard" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm px-4">
            <LayoutDashboard className="w-4 h-4 mr-2" /> Dashboard
          </TabsTrigger>
          <TabsTrigger value="invoices" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm px-4">
            <Receipt className="w-4 h-4 mr-2" /> Cotizaciones y Facturas
          </TabsTrigger>
          <TabsTrigger value="profile" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm px-4">
            <Contact className="w-4 h-4 mr-2" /> Perfil y Onboarding
          </TabsTrigger>
        </TabsList>

        <div className="mt-6">
          <TabsContent value="dashboard" className="outline-none m-0 space-y-6">
            {/* ALERTA DE BRIEFING PENDIENTE (Premium Design) */}
            {leadOnboarding?.onboardingType === 'direct' && !leadOnboarding?.isMigrated && (
              <div className="relative overflow-hidden bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-500/20 rounded-2xl p-6 shadow-xl shadow-amber-500/5 group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full -mr-16 -mt-16 blur-3xl" />
                <div className="flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
                  <div className="flex items-center gap-5">
                    <div className="bg-amber-500/20 p-3 rounded-2xl border border-amber-500/30 group-hover:scale-110 transition-transform duration-500">
                      <Sparkles className="w-6 h-6 text-amber-500" />
                    </div>
                    <div>
                      <h4 className="text-base font-black text-amber-500 uppercase tracking-tighter font-headline">Perfil Estratégico Pendiente</h4>
                      <p className="text-sm text-muted-foreground/80 font-medium max-w-md">Para ofrecer una estrategia personalizada, necesitamos conocer los objetivos y el valor diferencial de la marca.</p>
                    </div>
                  </div>
                  <Button
                    onClick={handleOpenBriefing}
                    className="bg-amber-500 hover:bg-amber-600 text-white font-black h-12 px-8 rounded-xl shadow-lg shadow-amber-500/20 transition-all hover:scale-105 active:scale-95 gap-2 w-full md:w-auto"
                  >
                    <Sparkles className="w-4 h-4" />
                    Completar Formulario de Briefing
                  </Button>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-2 space-y-6">
                {/* PLANES PREMIUM / SUSCRIPCIONES */}
                <Card className="overflow-hidden border-emerald-500/20 shadow-sm">
                  <CardHeader className="bg-emerald-500/5 pb-4 border-b border-emerald-500/10 flex flex-row items-center justify-between">
                    <CardTitle className="text-sm font-bold uppercase tracking-wider text-emerald-600 flex items-center gap-2 m-0 mt-2">
                      <Zap className="w-4 h-4" /> Mi Plan Premium
                    </CardTitle>
                    <div className="flex items-center mt-0">
                      <Button variant="outline" size="sm" onClick={() => {
                        setPreviewQuotation(activePlans.length > 0 ? activePlans[0] : null);
                        setIsPreviewOpen(true);
                      }} className="h-6 text-[10px] font-bold border-emerald-500/30 text-emerald-600 hover:bg-emerald-50 gap-1" disabled={activePlans.length === 0}>
                        <Eye className="w-3 h-3" /> Ver Plan
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-6">
                    {activePlans.length > 0 ? (
                      <div className="space-y-4">
                        {activePlans.map((plan: any, i: number) => (
                          <div key={i} className="space-y-4">
                            <div className="flex justify-between items-start">
                              <div>
                                <h3 className="text-xl font-bold">{plan.title || 'Plan de Suscripción'}</h3>
                                <div className="flex flex-col gap-1 mt-1">
                                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                                    <CheckCircle className="w-3 h-3 text-emerald-500" /> Aprobado el {(() => {
                                      try {
                                        const dateVal = plan.updatedAt || plan.createdAt || plan.acceptedAt;
                                        return dateVal ? new Date(dateVal).toLocaleDateString() : 'N/A';
                                      } catch (e) { return 'Invalid Date'; }
                                    })()}
                                  </p>
                                  {clientData?.billingPeriodStart && (
                                    <p className="text-xs text-emerald-600 font-bold flex items-center gap-1">
                                      <Calendar className="w-3 h-3" /> Inicio de Ciclo: {new Date(clientData.billingPeriodStart + 'T12:00:00').toLocaleDateString('es-ES', { day: 'numeric', month: 'long' })}
                                    </p>
                                  )}
                                </div>
                              </div>
                              <div className="text-right flex flex-col items-end gap-1">
                                <div>
                                  <p className="text-2xl font-black text-emerald-600 leading-none">
                                    ₡{(plan.grandTotal || plan.totalAmount || plan.total || 0).toLocaleString()}
                                  </p>
                                  <p className="text-xs text-emerald-600/70 font-medium mt-1">
                                    ₡{Math.round((plan.grandTotal || plan.totalAmount || plan.total || 0) / 2).toLocaleString()} <span className="text-muted-foreground/60">/ quincenal</span>
                                  </p>
                                </div>
                                <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/30 capitalize mt-1">
                                  Suscripción Recurrente
                                </Badge>
                              </div>
                            </div>

                            <div className="space-y-2 pt-2">
                              <p className="text-xs font-bold text-muted-foreground uppercase">Servicios Incluidos:</p>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                {plan.items?.map((item: any, idx: number) => (
                                  <div key={idx} className="flex items-start gap-3 p-3 rounded-xl bg-card border border-border/40 shadow-sm hover:border-emerald-500/30 transition-colors">
                                    <div className="mt-0.5 p-1 bg-emerald-500/10 rounded-md shrink-0">
                                      <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <p className="font-bold text-sm text-foreground leading-tight">{item.serviceName || item.description}</p>
                                      {item.serviceName && item.description && item.serviceName !== item.description && (
                                        <p className="text-[11px] text-muted-foreground leading-snug mt-0.5 line-clamp-2">{item.description}</p>
                                      )}
                                      <div className="flex flex-wrap gap-1 mt-1.5">
                                        {item.quantity > 1 && (
                                          <span className="inline-flex items-center text-[10px] font-bold text-emerald-700 bg-emerald-500/10 px-1.5 py-0.5 rounded-full border border-emerald-500/20">× {item.quantity} uds.</span>
                                        )}
                                        {item.quantity === 1 && (
                                          <span className="inline-flex items-center text-[10px] font-bold text-muted-foreground bg-muted/50 px-1.5 py-0.5 rounded-full">× 1</span>
                                        )}
                                        {(item.discount > 0) && (
                                          <span className="inline-flex items-center text-[10px] font-bold text-amber-700 bg-amber-500/10 px-1.5 py-0.5 rounded-full border border-amber-500/20">-₡{Number(item.discount).toLocaleString()}</span>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                            {i < activePlans.length - 1 && <Separator className="my-6" />}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center p-8 text-center bg-secondary/50 rounded-xl border border-dashed border-border">
                        <AlertTriangle className="w-10 h-10 text-muted-foreground mb-3" />
                        <h4 className="font-semibold mb-1">Sin Plan Activo</h4>
                        <p className="text-xs text-muted-foreground max-w-[250px]">Este cliente no tiene una suscripción vigente.</p>
                        <Button variant="outline" size="sm" className="mt-4" onClick={() => router.push(`/solicitudes/create?leadId=${selectedLead.id}&clientId=${selectedLead.clientId}`)}>Crear Plan</Button>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* PROYECTOS ADICIONALES / EXTRAS */}
                <Card className="overflow-hidden border-blue-500/20 shadow-sm">
                  <CardHeader className="bg-blue-500/5 pb-4 border-b border-blue-500/10 flex flex-row items-center justify-between">
                    <CardTitle className="text-sm font-bold uppercase tracking-wider text-blue-600 flex items-center gap-2 m-0 mt-2">
                      <Target className="w-4 h-4" /> Proyectos Adicionales / Extras
                    </CardTitle>
                    <div className="flex items-center mt-0">
                      <Button variant="outline" size="sm" onClick={() => {
                        setPreviewQuotation(activeProjects.length > 0 ? activeProjects[0] : null);
                        setIsPreviewOpen(true);
                      }} className="h-6 text-[10px] font-bold border-blue-500/30 text-blue-600 hover:bg-blue-50 gap-1" disabled={activeProjects.length === 0}>
                        <Eye className="w-3 h-3" /> Ver Proyecto
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-6">
                    {activeProjects.length > 0 ? (
                      <div className="space-y-4">
                        {activeProjects.map((project: any, i: number) => (
                          <div key={i} className="space-y-4">
                            <div className="flex justify-between items-start">
                              <div>
                                <h3 className="text-xl font-bold">{project.title || 'Proyecto Adicional'}</h3>
                                <div className="flex flex-col gap-1 mt-1">
                                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                                    <CheckCircle className="w-3 h-3 text-blue-500" /> Aprobado el {(() => {
                                      try {
                                        const dateVal = project.updatedAt || project.createdAt || project.acceptedAt;
                                        return dateVal ? new Date(dateVal).toLocaleDateString() : 'N/A';
                                      } catch (e) { return 'Invalid Date'; }
                                    })()}
                                  </p>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="text-2xl font-bold text-blue-600">₡{project.grandTotal?.toLocaleString() || project.total?.toLocaleString()}</p>
                                <Badge variant="outline" className="bg-blue-500/10 text-blue-600 border-blue-500/30 capitalize mt-2">
                                  Proyecto Único
                                </Badge>
                              </div>
                            </div>
                            <div className="space-y-2 pt-2">
                              <p className="text-xs font-bold text-muted-foreground uppercase">Servicios Incluidos:</p>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                {project.items?.map((item: any, idx: number) => (
                                  <div key={idx} className="flex items-start gap-3 p-3 rounded-xl bg-card border border-border/40 shadow-sm hover:border-blue-500/30 transition-colors">
                                    <div className="mt-0.5 p-1 bg-blue-500/10 rounded-md shrink-0">
                                      <CheckCircle className="w-3.5 h-3.5 text-blue-500" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <p className="font-bold text-sm text-foreground leading-tight">{item.serviceName || item.description}</p>
                                      {item.serviceName && item.description && item.serviceName !== item.description && (
                                        <p className="text-[11px] text-muted-foreground leading-snug mt-0.5 line-clamp-2">{item.description}</p>
                                      )}
                                      <div className="flex flex-wrap gap-1 mt-1.5">
                                        {item.quantity > 1 && (
                                          <span className="inline-flex items-center text-[10px] font-bold text-blue-700 bg-blue-500/10 px-1.5 py-0.5 rounded-full border border-blue-500/20">× {item.quantity} uds.</span>
                                        )}
                                        {item.quantity === 1 && (
                                          <span className="inline-flex items-center text-[10px] font-bold text-muted-foreground bg-muted/50 px-1.5 py-0.5 rounded-full">× 1</span>
                                        )}
                                        {(item.discount > 0) && (
                                          <span className="inline-flex items-center text-[10px] font-bold text-amber-700 bg-amber-500/10 px-1.5 py-0.5 rounded-full border border-amber-500/20">-₡{Number(item.discount).toLocaleString()}</span>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                            {i < activeProjects.length - 1 && <Separator className="my-6" />}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center p-8 text-center bg-secondary/50 rounded-xl border border-dashed border-border">
                        <AlertTriangle className="w-8 h-8 text-muted-foreground/60 mb-3" />
                        <h4 className="font-semibold text-sm mb-1 text-muted-foreground/80">Sin Proyectos Adicionales</h4>
                        <p className="text-xs text-muted-foreground/60 max-w-[250px]">No hay servicios extra facturados actualmente.</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* ESTADO DE CUENTA */}
              <div className="space-y-6">
                <Card className={isAccountPending ? "border-amber-500/30 bg-amber-500/5 shadow-sm" : (isAccountOk ? "border-emerald-500/20 bg-emerald-500/5 shadow-sm" : "border-border/50 bg-card shadow-sm")}>
                  <CardHeader className="pb-2">
                    <CardTitle className={isAccountPending ? "text-xs font-bold uppercase text-amber-600 flex items-center gap-2" : (isAccountOk ? "text-xs font-bold uppercase text-emerald-600 flex items-center gap-2" : "text-xs font-bold uppercase text-muted-foreground flex items-center gap-2")}>
                      <Receipt className="w-4 h-4" /> Estado de Cuenta
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-1">
                      <p className="text-2xl font-bold font-headline">
                        {accountStatusLabel}
                      </p>
                      <p className={`${isAccountPending ? 'text-amber-600/80' : (isAccountOk ? 'text-emerald-600/80' : 'text-muted-foreground/80')} text-xs font-medium`}>
                        {accountStatusDescription}
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-blue-500/20 shadow-sm">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-xs font-bold uppercase text-blue-600 flex items-center gap-2">
                      <MessageCircle className="w-4 h-4" /> Interacción
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-col gap-3">
                      <div className="flex justify-between items-center text-sm border-b pb-2 border-border/50">
                        <span className="text-muted-foreground flex items-center gap-1.5"><Calendar className="w-4 h-4 text-blue-500" /> Registro:</span>
                        <span className="font-bold text-foreground">{(() => {
                          try {
                            return selectedLead.createdAt ? new Date(selectedLead.createdAt).toLocaleDateString() : 'Sin fecha';
                          } catch (e) { return 'Fecha inválida'; }
                        })()}</span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-muted-foreground flex items-center gap-1.5"><MessageCircle className="w-4 h-4 text-blue-500" /> Preferencia:</span>
                        <span className="font-bold uppercase text-foreground">{selectedLead.preference || 'No especificada'}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* TRACKING DEL PLAN COMPONENT */}
              {clientData?.activePlan?.status === 'active' && (
                <Card className="md:col-span-3 border-emerald-500/20 bg-card overflow-hidden shadow-sm">
                  <CardHeader className="bg-emerald-500/5 pb-4 border-b border-emerald-500/10 flex flex-row items-center justify-between">
                    <CardTitle className="text-sm font-bold uppercase tracking-wider text-emerald-600 flex items-center gap-2 m-0 mt-2">
                      <Zap className="w-4 h-4" /> Tracking de Plan (Ciclo de Facturación)
                    </CardTitle>
                    <div className="flex items-center gap-2 mt-0">
                      <Badge variant="outline" className="text-emerald-600 border-emerald-500/30 bg-white shadow-sm">{clientData.activePlan.services?.length || 0} Servicios</Badge>
                      <Button variant="outline" size="sm" onClick={() => setIsServicesDetailOpen(true)} className="h-6 text-[10px] font-bold border-emerald-500/30 text-emerald-600 hover:bg-emerald-50">Ver Detalle</Button>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex flex-col justify-center p-5 border border-border/50 rounded-xl bg-muted/30">
                      <div className="flex justify-between items-start mb-2">
                        <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Mes Operativo</p>
                        <Badge variant="outline" className="font-bold border-emerald-500/30 text-emerald-700 bg-emerald-500/10">
                          Día de Corte: {clientData.activePlan.planStartDay === 15 ? '15/30' : '30/15'}
                        </Badge>
                      </div>
                      <p className="font-bold text-xl text-foreground">
                        {clientData.activePlan.currentCycleMonth === 1 ? 'Mes 1 (Setup)' : `Ciclo Recurrente`}
                      </p>
                    </div>

                    <div className="p-5 border rounded-xl bg-primary/5 border-primary/20 relative overflow-hidden group flex flex-col justify-center">
                      <div className="absolute -top-4 -right-4 p-4 opacity-10 blur-sm pointer-events-none">
                        <Zap className="w-24 h-24 text-primary" />
                      </div>
                      <div className="flex justify-between items-center relative z-10">
                        <div className="space-y-1">
                          <p className="text-xs font-bold text-primary uppercase tracking-wider">Control de Pago</p>
                          <p className="text-sm font-medium text-foreground">
                            {clientData.activePlan.currentCycleMonth === 1
                              ? (clientData.activePlan.isMonth1Part2Paid ? 'Mes 1 Completado' : 'Parte 1 de 2 Pagada')
                              : 'Ciclo 15/30 Activo'}
                          </p>
                        </div>
                        <div className="flex flex-col gap-2 items-end">
                          {clientData.activePlan.currentCycleMonth === 1 && clientData.activePlan.isMonth1Part1Paid && !clientData.activePlan.isMonth1Part2Paid && (
                            <Button size="sm" className="h-8 text-[10px] font-bold" onClick={handleGenerateMonth1Part2}>
                              <Receipt className="w-3 h-3 mr-1" /> Generar Parte 2
                            </Button>
                          )}
                          {clientData.activePlan.isMonth1Part2Paid && clientData.activePlan.currentCycleMonth === 1 && (
                            <Badge className="bg-emerald-500 text-white border-0 shadow-sm"><CheckCircle className="w-3 h-3 mr-1" /> Completado</Badge>
                          )}
                          {clientData.activePlan.currentCycleMonth > 1 && (
                            <Badge variant="outline" className="border-blue-500/30 text-blue-600 bg-blue-500/5 shadow-sm">Ciclo Recurrente</Badge>
                          )}
                          <Button size="sm" variant="outline" className="h-8 text-[10px] font-bold border-red-500/30 text-red-600 hover:bg-red-500/10" onClick={() => setIsCancelPlanOpen(true)}>
                            Cancelar Plan
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          <TabsContent value="invoices" className="outline-none m-0 space-y-8">
            {/* SEARCH AND FILTER BAR */}
            <div className="relative group max-w-md">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                <SearchIcon className="h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
              </div>
              <Input
                type="text"
                placeholder="Buscar propuestas o facturas por #, título o monto..."
                className="pl-10 h-11 bg-muted/20 border-border/40 focus:bg-background focus:ring-primary/20 transition-all rounded-xl text-sm font-medium"
                value={docsSearchTerm}
                onChange={(e) => setDocsSearchTerm(e.target.value)}
              />
            </div>

            {/* Quotations Section */}
            <div className="space-y-4">
              <h4 className="text-sm font-bold text-primary flex items-center gap-2 uppercase tracking-wider">
                <FileText className="w-4 h-4" /> Historial de Propuestas
              </h4>
              {filteredQuotations.length > 0 ? (
                <div className="border border-border/50 rounded-xl overflow-hidden bg-card shadow-sm">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-muted/50 border-b border-border/50">
                        <tr>
                          <th className="text-left p-4 font-bold text-xs uppercase text-muted-foreground tracking-wider w-[120px]"># Propuesta</th>
                          <th className="text-left p-4 font-bold text-xs uppercase text-muted-foreground tracking-wider">Propuesta</th>
                          <th className="text-left p-4 font-bold text-xs uppercase text-muted-foreground tracking-wider">Emisión</th>
                          <th className="text-right p-4 font-bold text-xs uppercase text-muted-foreground tracking-wider">Monto</th>
                          <th className="text-center p-4 font-bold text-xs uppercase text-muted-foreground tracking-wider">Estado</th>
                          <th className="p-4 text-right"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/30">
                        {filteredQuotations.map((q: any, idx: number) => (
                          <tr key={idx} className="hover:bg-muted/30 transition-colors">
                            <td className="p-4">
                              <span
                                className="font-bold font-mono text-xs tracking-tight text-primary cursor-pointer hover:underline transition-colors"
                                onClick={() => {
                                  setPreviewQuotation(q);
                                  setIsPreviewOpen(true);
                                }}
                              >
                                {q.quotationNumber ? String(q.quotationNumber) : 'PRO-TEMP'}
                              </span>
                            </td>
                            <td className="p-4">
                              <span className="font-semibold text-foreground line-clamp-1">{q.title}</span>
                            </td>
                            <td className="p-4 text-muted-foreground font-medium text-xs whitespace-nowrap">
                              {q.createdAt ? new Date(q.createdAt).toLocaleDateString() : 'Sin fecha'}
                            </td>
                            <td className="p-4 text-right font-bold text-foreground">
                              ₡{q.grandTotal?.toLocaleString() || q.subtotal?.toLocaleString() || '0'}
                            </td>
                            <td className="p-4 text-center">
                              <Badge variant="outline" className={
                                q.status === 'accepted' ? 'bg-emerald-500/10 text-emerald-700 border-emerald-500/30' :
                                  q.status === 'published' ? 'bg-blue-500/10 text-blue-700 border-blue-500/30' :
                                    'bg-slate-500/10 text-slate-600 border-slate-500/30'
                              }>
                                {q.status === 'accepted' ? 'Aceptada' : q.status === 'published' ? 'Enviada' : q.status}
                              </Badge>
                            </td>
                            <td className="p-4 text-right">
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-8 px-3 text-[11px] font-black border-primary/20 text-primary hover:bg-primary hover:text-white transition-all gap-1.5 shadow-sm"
                                onClick={() => {
                                  setPreviewQuotation(q);
                                  setIsPreviewOpen(true);
                                }}
                              >
                                <Eye className="w-3.5 h-3.5" /> Ver
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center p-8 bg-muted/20 rounded-xl border border-dashed text-center">
                  <p className="text-sm font-medium text-muted-foreground">No se encontraron propuestas con los criterios de búsqueda.</p>
                </div>
              )}
            </div>

            <div className="w-full h-px bg-border/50" />

            {/* Invoices Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-primary flex items-center gap-2 uppercase tracking-wider">
                  <Receipt className="w-4 h-4" /> Registro de Facturación
                </h4>
                {filteredInvoices.length > 0 && <Badge variant="secondary" className="font-bold">{filteredInvoices.length}</Badge>}
              </div>

              {filteredInvoices.length > 0 ? (
                <div className="border border-border/50 rounded-xl overflow-hidden bg-card shadow-sm">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-muted/50 border-b border-border/50">
                        <tr>
                          <th className="text-left p-4 font-bold text-xs uppercase text-muted-foreground tracking-wider w-[120px]"># Factura</th>
                          <th className="text-left p-4 font-bold text-xs uppercase text-muted-foreground tracking-wider">Concepto</th>
                          <th className="text-left p-4 font-bold text-xs uppercase text-muted-foreground tracking-wider">Emisión</th>
                          <th className="text-right p-4 font-bold text-xs uppercase text-muted-foreground tracking-wider">Monto</th>
                          <th className="text-center p-4 font-bold text-xs uppercase text-muted-foreground tracking-wider">Estado</th>
                          <th className="p-4 text-right"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/30">
                        {filteredInvoices.map((inv: any) => (
                          <tr key={inv.id} className="hover:bg-muted/30 transition-colors">
                            <td className="p-4">
                              <span
                                className="font-bold font-mono text-xs tracking-tight text-foreground cursor-pointer hover:underline hover:text-primary transition-colors"
                                onClick={() => {
                                  setPreviewQuotation(inv);
                                  setIsPreviewOpen(true);
                                }}
                              >
                                {inv.invoiceNumber ? String(inv.invoiceNumber) : `INV-${inv.id.substring(0, 5).toUpperCase()}`}
                              </span>
                            </td>
                            <td className="p-4">
                              <div className="flex flex-col text-sm">
                                <span className="font-semibold text-foreground max-w-[200px] truncate">
                                  {inv.isPlanInvoice ? (
                                    <span className="flex items-center gap-1.5 text-primary"><Zap className="w-3.5 h-3.5" /> Plan Mensual</span>
                                  ) : (inv.title || 'Servicios Genéricos')}
                                </span>
                                {inv.isPlanInvoice && (
                                  <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider mt-0.5">
                                    {inv.billingMonth} • PAGO {inv.planPartNumber}/2
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="p-4 text-muted-foreground font-medium text-xs whitespace-nowrap">
                              {inv.createdAt ? new Date(inv.createdAt).toLocaleDateString() : '-'}
                            </td>
                            <td className="p-4 text-right font-bold text-foreground">
                              ₡{inv.totalAmount?.toLocaleString() || inv.total?.toLocaleString() || '0'}
                            </td>
                            <td className="p-4 text-center">
                              <Badge variant="outline" className={
                                inv.status === 'paid' ? 'bg-emerald-500/10 text-emerald-700 border-emerald-500/30' :
                                  inv.status === 'pending' ? 'bg-amber-500/10 text-amber-700 border-amber-500/30 shadow-sm' :
                                    'bg-slate-500/10 text-slate-600 border-slate-500/30'
                              }>
                                {inv.status === 'paid' ? 'Pagada' : inv.status === 'pending' ? 'Pendiente' : inv.status}
                              </Badge>
                            </td>
                            <td className="p-4 text-right">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 px-3 text-[11px] font-bold text-muted-foreground hover:text-primary hover:bg-primary/5 transition-all gap-1.5"
                                title="Ver Factura"
                                onClick={() => {
                                  // Open preview logic if available for invoices, or external link
                                  setPreviewQuotation(inv); // Assuming similar structure for previewing
                                  setIsPreviewOpen(true);
                                }}
                              >
                                <Eye className="w-4 h-4" /> Ver
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center p-8 bg-muted/20 rounded-xl border border-dashed text-center">
                  <p className="text-sm font-medium text-muted-foreground">Sin registros contables que coincidan.</p>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="profile" className="outline-none m-0 space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Left Column: Specs */}
              <div className="space-y-6">
                {/* Contact Info */}
                <div className="space-y-4">
                  <h4 className="text-sm font-bold text-primary flex items-center justify-between gap-2 uppercase tracking-wider">
                    <span className="flex items-center gap-2"><Contact className="w-4 h-4" /> Datos de Identificación</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleOpenEditProfile}
                      className="h-7 text-[10px] font-bold text-primary hover:bg-primary/5 border border-primary/10 gap-1.5"
                    >
                      <Edit2 className="w-3 h-3" /> Editar Perfil
                    </Button>
                  </h4>
                  <Card className="border-border/50 shadow-sm">
                    <CardContent className="p-5 space-y-4">
                      <div>
                        <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider mb-1">Nombre y/o Empresa</p>
                        <p className="font-bold text-lg text-foreground">{leadUser ? `${leadUser.firstName} ${leadUser.lastName}` : selectedLead.clientName}</p>
                        <p className="text-sm font-medium text-muted-foreground mt-0.5">{leadUser?.company || selectedLead.company || 'Sin registro de empresa'}</p>
                      </div>
                      <div className="w-full h-px bg-border/50" />

                      <div className="space-y-4">
                        <div className="group">
                          <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider mb-1 px-1">Correo Electrónico</p>
                          <div className="flex items-center gap-3">
                            <div className="flex-1 flex items-center gap-2 justify-between bg-muted/30 p-2.5 rounded-xl border border-transparent group-hover:border-primary/20 transition-all">
                              <span className="text-xs font-bold truncate pl-1" title={leadUser?.email || selectedLead.clientEmail}>
                                {leadUser?.email || selectedLead.clientEmail || 'No proporcionado'}
                              </span>
                              <Button variant="ghost" size="icon" className="h-8 w-8 opacity-40 group-hover:opacity-100 transition-opacity shrink-0" onClick={() => copyToClipboard(leadUser?.email || selectedLead.clientEmail || "", "Email")}>
                                {copiedField === "Email" ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                              </Button>
                            </div>
                          </div>
                          {(leadUser?.email || selectedLead.clientEmail) && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="w-full mt-2 h-9 text-[11px] font-bold text-primary hover:bg-primary/5 rounded-lg flex items-center gap-2 transition-colors border border-primary/10"
                              onClick={() => window.open(`https://mail.google.com/mail/?view=cm&fs=1&to=${leadUser?.email || selectedLead.clientEmail}`, '_blank')}
                            >
                              <Mail className="w-3.5 h-3.5" /> Redactar Correo en Gmail
                            </Button>
                          )}
                        </div>

                        <Separator className="opacity-50" />

                        <div className="group">
                          <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider mb-1 px-1">Teléfono Móvil</p>
                          <div className="flex items-center gap-3">
                            <div className="flex-1 flex items-center gap-2 justify-between bg-muted/30 p-2.5 rounded-xl border border-transparent group-hover:border-primary/20 transition-all">
                              <span className="text-xs font-bold truncate tracking-wider pl-1">
                                {formatPhone(leadUser?.phone || selectedLead.clientPhone) || '-'}
                              </span>
                              <Button variant="ghost" size="icon" className="h-8 w-8 opacity-40 group-hover:opacity-100 transition-opacity shrink-0" onClick={() => copyToClipboard(leadUser?.phone || selectedLead.clientPhone || "", "Teléfono")}>
                                {copiedField === "Teléfono" ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                              </Button>
                            </div>
                          </div>
                          {(leadUser?.phone || selectedLead.clientPhone) && (
                            <Button
                              size="sm"
                              className="w-full mt-2 h-9 text-[11px] font-bold bg-[#25D366] hover:bg-[#128C7E] text-white rounded-lg flex items-center gap-2 transition-all shadow-sm shadow-green-500/10"
                              onClick={() => window.open(`https://wa.me/${(leadUser?.phone || selectedLead.clientPhone || '').replace(/\D/g, '')}`, '_blank')}
                            >
                              <MessageSquare className="w-3.5 h-3.5" /> Enviar WhatsApp
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Briefing: Contexto */}
                {leadOnboarding && (
                  <div className="space-y-4">
                    <h4 className="text-sm font-bold flex items-center justify-between gap-2 uppercase tracking-wider text-muted-foreground transition-all">
                      <span>Ecosistema Comercial</span>
                      {leadOnboarding?.onboardingType === 'direct' && !leadOnboarding?.isMigrated && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={handleOpenBriefing}
                          className="h-7 text-[10px] font-bold text-amber-600 hover:bg-amber-50 border border-amber-200 gap-1.5"
                        >
                          <Sparkles className="w-3 h-3" /> Completar Briefing
                        </Button>
                      )}
                    </h4>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-4 bg-accent/5 rounded-xl border border-accent/10">
                        <h4 className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">Segmento de Mercado</h4>
                        <p className="font-semibold text-sm">{leadOnboarding.sector || 'Sin definir'}</p>
                      </div>
                      <div className="p-4 bg-accent/5 rounded-xl border border-accent/10">
                        <h4 className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">Canal de Atracción</h4>
                        <p className="font-semibold text-sm">{leadOnboarding.contactSource || 'Orgánico'}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Right Column: Narrative */}
              {leadOnboarding && (
                <div className="space-y-6">
                  <div className="space-y-4">
                    <h4 className="text-sm font-bold text-primary flex items-center gap-2 uppercase tracking-wider">
                      <Sparkles className="w-4 h-4" /> Briefing Estratégico
                    </h4>

                    <Card className="border-border/50 shadow-sm">
                      <CardContent className="p-5 space-y-5">
                        <div className="space-y-2">
                          <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider flex items-center gap-1.5"><FileText className="w-3 h-3" /> Descripción y Narrativa</p>
                          <div className="text-sm leading-relaxed text-foreground/90 italic bg-muted/30 p-3 rounded-lg border-l-2 border-primary/40">
                            "{leadOnboarding.businessDetails || 'No se brindaron detalles en el Briefing.'}"
                          </div>
                        </div>

                        <div className="space-y-2">
                          <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider flex items-center gap-1.5"><TrendingUp className="w-3 h-3" /> Motivación Primaria</p>
                          {leadOnboarding.motivation ? (
                            <p className="text-sm font-semibold text-foreground/90 pl-1">{leadOnboarding.motivation}</p>
                          ) : (
                            <div className="p-4 bg-amber-500/5 border border-amber-500/20 rounded-xl space-y-3">
                              <p className="text-[11px] text-amber-600/80 font-medium italic">Pendiente de completar el briefing estratégico.</p>
                              <Button
                                onClick={handleOpenBriefing}
                                className="w-full bg-amber-500 hover:bg-amber-600 text-white text-[10px] font-black h-8 rounded-lg"
                              >
                                <Sparkles className="w-3 h-3 mr-2" /> Completar Ahora
                              </Button>
                            </div>
                          )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-border/50">
                          <div className="space-y-2">
                            <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Objetivos Específicos</p>
                            {Array.isArray(leadOnboarding.mainGoal) && leadOnboarding.mainGoal.length > 0 ? (
                              <ul className="grid gap-1.5">
                                {leadOnboarding.mainGoal.map((g: string, i: number) => (
                                  <li key={i} className="flex gap-2 text-xs bg-primary/5 p-2 rounded-lg items-start border border-primary/10">
                                    <CheckCircle className="w-3.5 h-3.5 text-primary shrink-0 mt-px" /> <span className="font-medium text-foreground/80">{g}</span>
                                  </li>
                                ))}
                              </ul>
                            ) : (
                              <p className="text-xs text-muted-foreground italic pl-1">No hay metas registradas.</p>
                            )}
                          </div>
                          <div className="space-y-2">
                            <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Exigencias (Expectativas)</p>
                            {Array.isArray(leadOnboarding.expectations) && leadOnboarding.expectations.length > 0 ? (
                              <ul className="grid gap-1.5">
                                {leadOnboarding.expectations.map((e: string, i: number) => (
                                  <li key={i} className="flex gap-2 text-xs bg-accent/5 p-2 rounded-lg items-start border border-accent/10">
                                    <CheckCircle className="w-3.5 h-3.5 text-accent shrink-0 mt-px" /> <span className="font-medium text-foreground/80">{e}</span>
                                  </li>
                                ))}
                              </ul>
                            ) : (
                              <p className="text-xs text-muted-foreground italic pl-1">No hay expectativas registradas.</p>
                            )}
                          </div>
                        </div>

                        <div className="space-y-4 pt-4 border-t border-border/50">
                          <div className="flex items-center justify-between">
                            <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider flex items-center gap-1.5">
                              <Globe className="w-3 h-3" /> Presencia Digital Validada
                            </p>
                            {!isEditingSocials ? (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 px-2 text-[10px] font-bold text-primary hover:bg-primary/5 gap-1.5"
                                onClick={handleStartEditSocials}
                              >
                                <Edit2 className="w-3 h-3" /> Editar
                              </Button>
                            ) : (
                              <div className="flex items-center gap-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 px-2 text-[10px] font-bold text-muted-foreground hover:bg-muted gap-1.5"
                                  onClick={handleCancelEditSocials}
                                >
                                  <X className="w-3 h-3" /> Cancelar
                                </Button>
                                <Button
                                  variant="default"
                                  size="sm"
                                  className="h-7 px-2 text-[10px] font-bold bg-primary hover:bg-primary/90 text-white gap-1.5 shadow-sm"
                                  onClick={handleSaveSocials}
                                  disabled={isProcessing}
                                >
                                  {isProcessing ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />} Guardar
                                </Button>
                              </div>
                            )}
                          </div>

                          {!isEditingSocials ? (
                            <div className="flex flex-col gap-3 pt-1">
                              {Array.isArray(leadOnboarding?.socials) && leadOnboarding.socials.length > 0 ? (
                                leadOnboarding.socials.map((social: any, idx: number) => {
                                  const platform = social.platform.toLowerCase();
                                  let Icon = Globe;
                                  let colorClasses = "text-primary bg-primary/10 border-primary/20";
                                  let iconContainerClass = "bg-primary text-white";
                                  let gradientOverlay = "from-primary/10";

                                  if (platform.includes('instagram')) {
                                    Icon = Instagram;
                                    colorClasses = "text-pink-600 bg-pink-50 hover:border-pink-300";
                                    iconContainerClass = "bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600 text-white";
                                    gradientOverlay = "from-pink-50";
                                  } else if (platform.includes('facebook')) {
                                    Icon = Facebook;
                                    colorClasses = "text-blue-700 bg-blue-50 hover:border-blue-300";
                                    iconContainerClass = "bg-blue-600 text-white";
                                    gradientOverlay = "from-blue-50";
                                  } else if (platform.includes('tiktok')) {
                                    Icon = Music2;
                                    colorClasses = "text-slate-900 bg-slate-50 hover:border-slate-300";
                                    iconContainerClass = "bg-slate-900 text-white";
                                    gradientOverlay = "from-slate-100";
                                  } else if (platform.includes('linkedin')) {
                                    Icon = Linkedin;
                                    colorClasses = "text-blue-800 bg-blue-50 hover:border-blue-400";
                                    iconContainerClass = "bg-[#0077b5] text-white";
                                    gradientOverlay = "from-[#0077b5]/5";
                                  } else if (platform.includes('x ') || platform.includes('twitter')) {
                                    Icon = Twitter;
                                    colorClasses = "text-slate-900 bg-slate-50 hover:border-slate-300";
                                    iconContainerClass = "bg-black text-white px-2.5";
                                    gradientOverlay = "from-slate-100";
                                  } else if (platform.includes('youtube')) {
                                    Icon = Youtube;
                                    colorClasses = "text-red-600 bg-red-50 hover:border-red-300";
                                    iconContainerClass = "bg-red-600 text-white";
                                    gradientOverlay = "from-red-50";
                                  } else if (platform.includes('threads')) {
                                    Icon = AtSign;
                                    colorClasses = "text-slate-900 bg-slate-50 hover:border-slate-300";
                                    iconContainerClass = "bg-black text-white";
                                    gradientOverlay = "from-slate-100";
                                  }

                                  return (
                                    <div
                                      key={idx}
                                      className={`group relative flex items-center gap-4 p-3 rounded-2xl border border-border/40 transition-all duration-300 overflow-hidden ${colorClasses} hover:shadow-md hover:-translate-y-0.5`}
                                    >
                                      <div className={`absolute inset-0 bg-gradient-to-r ${gradientOverlay} via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity`} />
                                      <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 shadow-sm z-10 transition-transform duration-500 group-hover:scale-110 ${iconContainerClass}`}>
                                        <Icon className="w-5 h-5" />
                                      </div>
                                      <div className="flex-1 min-w-0 z-10">
                                        <div className="flex items-center gap-2">
                                          <p className="text-[10px] font-black uppercase tracking-widest opacity-60">{social.platform}</p>
                                          {social.url && (
                                            <Badge variant="outline" className="h-4 px-1.5 text-[8px] font-bold border-current/20 bg-current/5 whitespace-nowrap">Link Validado</Badge>
                                          )}
                                        </div>
                                        <p className="text-sm font-black truncate text-foreground group-hover:text-primary transition-colors mt-0.5">{social.handle || 'Sin usuario'}</p>
                                      </div>
                                      <div className="flex items-center gap-1.5 z-10">
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          className="h-8 w-8 rounded-full bg-white/50 hover:bg-white hover:text-primary border border-transparent hover:border-primary/20 transition-all"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            copyToClipboard(social.handle, social.platform);
                                          }}
                                          title="Copiar usuario"
                                        >
                                          <Copy className="w-3.5 h-3.5" />
                                        </Button>
                                        {social.url && (
                                          <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 rounded-full bg-primary text-white hover:bg-primary/90 shadow-sm transition-all hover:scale-110"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              window.open(social.url, '_blank');
                                            }}
                                            title="Ir al perfil"
                                          >
                                            <ExternalLink className="w-3.5 h-3.5" />
                                          </Button>
                                        )}
                                      </div>
                                    </div>
                                  );
                                })
                              ) : (
                                <div className="flex flex-col items-center justify-center py-10 px-4 text-center bg-muted/10 rounded-2xl border border-dashed border-border/50">
                                  <div className="p-3 bg-background rounded-full shadow-sm mb-3">
                                    <Globe className="w-6 h-6 text-muted-foreground/40" />
                                  </div>
                                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Sin Presencia Digital</p>
                                  <p className="text-xs text-muted-foreground/60 mt-1 max-w-[200px]">Añade redes sociales para gestionar el contenido del cliente.</p>
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="space-y-3 pt-1">
                              <div className="grid gap-2">
                                {editableSocials.map((social, idx) => (
                                  <div key={idx} className="flex gap-2 items-start bg-muted/20 p-2 rounded-lg border border-border/50 relative group">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 flex-1">
                                      <div className="space-y-1">
                                        <p className="text-[9px] font-bold text-muted-foreground uppercase px-1">Plataforma</p>
                                        <Select value={social.platform} onValueChange={(val) => handleUpdateSocialField(idx, "platform", val)}>
                                          <SelectTrigger className="h-9 text-xs bg-background">
                                            <SelectValue placeholder="Seleccionar" />
                                          </SelectTrigger>
                                          <SelectContent>
                                            {PLATFORMS.map(p => <SelectItem key={p} value={p} className="text-xs">{p}</SelectItem>)}
                                          </SelectContent>
                                        </Select>
                                      </div>
                                      <div className="space-y-1">
                                        <p className="text-[9px] font-bold text-muted-foreground uppercase px-1">Usuario / Handle</p>
                                        <Input
                                          className="h-9 text-xs bg-background"
                                          placeholder="@usuario"
                                          value={social.handle}
                                          onChange={(e) => handleUpdateSocialField(idx, "handle", e.target.value)}
                                        />
                                      </div>
                                      <div className="md:col-span-2 space-y-1">
                                        <p className="text-[9px] font-bold text-muted-foreground uppercase px-1">Enlace Directo (Opcional)</p>
                                        <div className="flex gap-2">
                                          <Input
                                            className="h-9 text-xs bg-background flex-1"
                                            placeholder="https://..."
                                            value={social.url || ""}
                                            onChange={(e) => handleUpdateSocialField(idx, "url", e.target.value)}
                                          />
                                          <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-9 w-9 text-red-500 hover:text-red-600 hover:bg-red-50 shrink-0"
                                            onClick={() => handleRemoveSocialRow(idx)}
                                          >
                                            <Trash2 className="w-4 h-4" />
                                          </Button>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                              <Button
                                variant="outline"
                                size="sm"
                                className="w-full h-9 border-dashed border-primary/30 text-primary hover:bg-primary/5 gap-2 text-xs font-bold"
                                onClick={handleAddSocialRow}
                              >
                                <Plus className="w-3.5 h-3.5" /> Agregar Red Social
                              </Button>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              )}
            </div>
          </TabsContent>
        </div>
      </Tabs>

      {/* Modales Compartidos */}
      <Dialog open={isServicesDetailOpen} onOpenChange={setIsServicesDetailOpen}>
        <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto bg-card rounded-3xl border border-primary/10 shadow-2xl p-0">
          <div className="bg-gradient-to-br from-primary/30 via-primary/5 to-transparent p-5 text-white relative border-b border-primary/10">
            <div className="absolute top-0 right-0 p-5 opacity-10 pointer-events-none group-hover:rotate-12 transition-transform duration-700">
              <Zap className="w-12 h-12 text-primary" />
            </div>
            <div className="relative z-10">
              <DialogTitle className="text-xl font-black font-headline tracking-tighter flex items-center gap-2.5">
                <div className="p-2 bg-primary rounded-lg shadow-lg shadow-primary/30 scale-100 hover:scale-110 transition-transform">
                  <Zap className="w-4 h-4 text-white" />
                </div>
                Detalles del Contrato Activo
              </DialogTitle>
            </div>
          </div>
          <div className="p-6 space-y-4">
            {activeQuotation ? (
              <div className="border border-border/50 rounded-xl overflow-hidden bg-card shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-primary/5 border-b border-border/50">
                      <tr>
                        <th className="text-left p-4 font-bold text-xs uppercase text-muted-foreground whitespace-nowrap tracking-wider">Servicio / Concepto</th>
                        <th className="text-center p-4 font-bold text-xs uppercase text-muted-foreground tracking-wider">Cant.</th>
                        <th className="text-right p-4 font-bold text-xs uppercase text-muted-foreground tracking-wider">P. Unitario</th>
                        <th className="text-right p-4 font-bold text-xs uppercase text-muted-foreground tracking-wider">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/20">
                      {(() => {
                        // Factor de descuento global ponderado:
                        // netFactor = (subtotal - descuentoTotal) / subtotal
                        // P.Unit neto = unitPrice × netFactor
                        const globalSubtotal = parseFloat(activeQuotation.subtotalAmount) || parseFloat(activeQuotation.subtotal) || 0;
                        const globalDiscount = parseFloat(activeQuotation.totalDiscount) || parseFloat(activeQuotation.discount) || 0;
                        const hasGlobalDiscount = globalDiscount > 0 && globalSubtotal > 0;
                        const netFactor = hasGlobalDiscount ? (globalSubtotal - globalDiscount) / globalSubtotal : 1;

                        return activeQuotation.items?.map((item: any, i: number) => {
                          const quantity = parseFloat(item.quantity) || 1;
                          const unitPrice = parseFloat(item.unitPrice) || 0;
                          const netUnitPrice = Math.round(unitPrice * netFactor);
                          const netLineTotal = netUnitPrice * quantity;

                          return (
                            <tr key={i} className="hover:bg-muted/10 transition-colors">
                              <td className="p-4">
                                <div className="flex flex-col gap-0.5">
                                  <span className="font-bold text-foreground max-w-[260px] sm:max-w-md break-words">{item.serviceName || item.description}</span>
                                  {item.serviceName && item.description && item.serviceName !== item.description && (
                                    <span className="text-[11px] text-muted-foreground max-w-[260px] sm:max-w-md break-words leading-snug">{item.description}</span>
                                  )}
                                  {item.overriddenQuantity && (
                                    <span className="text-[10px] text-primary font-medium inline-flex w-fit bg-primary/10 px-2 py-0.5 rounded-full mt-1">Base + {item.overriddenQuantity} servicios extra</span>
                                  )}
                                </div>
                              </td>
                              <td className="p-4 text-center text-muted-foreground font-bold">{item.quantity}</td>
                              <td className="p-4 text-right">
                                {hasGlobalDiscount ? (
                                  <div className="flex flex-col items-end gap-0.5">
                                    <span className="line-through text-muted-foreground/50 text-xs">₡{unitPrice.toLocaleString()}</span>
                                    <span className="font-bold text-foreground">₡{netUnitPrice.toLocaleString()}</span>
                                  </div>
                                ) : (
                                  <span className="text-muted-foreground font-medium">₡{unitPrice.toLocaleString()}</span>
                                )}
                              </td>
                              <td className="p-4 text-right">
                                <span className="font-bold text-primary">₡{netLineTotal.toLocaleString()}</span>
                              </td>
                            </tr>
                          );
                        });
                      })()}
                    </tbody>
                    <tfoot className="bg-muted/30 border-t-2 border-border/50">
                      <tr>
                        <td colSpan={3} className="p-4 text-right font-bold text-muted-foreground text-xs uppercase tracking-wider">Subtotal:</td>
                        <td className="p-4 text-right font-bold text-foreground">₡{(activeQuotation.subtotalAmount || activeQuotation.subtotal || 0).toLocaleString()}</td>
                      </tr>
                      {(activeQuotation.totalDiscount || activeQuotation.discount || 0) > 0 && (
                        <tr>
                          <td colSpan={3} className="p-4 text-right font-bold text-amber-600 text-xs uppercase tracking-wider">Descuento Total:</td>
                          <td className="p-4 text-right font-bold text-amber-600">-₡{(activeQuotation.totalDiscount || activeQuotation.discount || 0).toLocaleString()}</td>
                        </tr>
                      )}
                      {(activeQuotation.taxAmount || activeQuotation.ivaAmount || 0) > 0 && (
                        <tr>
                          <td colSpan={3} className="p-4 text-right font-bold text-muted-foreground text-xs uppercase tracking-wider">IVA ({activeQuotation.ivaRate || 13}%):</td>
                          <td className="p-4 text-right font-bold text-foreground">₡{(activeQuotation.taxAmount || activeQuotation.ivaAmount || 0).toLocaleString()}</td>
                        </tr>
                      )}
                      <tr className="bg-primary/5">
                        <td colSpan={3} className="p-4 text-right font-black text-primary text-sm uppercase tracking-widest align-middle">Total Contractual:</td>
                        <td className="p-4 text-right font-black text-primary text-xl">₡{(activeQuotation.totalAmount || activeQuotation.grandTotal || activeQuotation.total || 0).toLocaleString()}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center p-12 text-center bg-muted/30 rounded-xl border border-dashed border-border">
                <div className="p-4 bg-background rounded-full shadow-sm mb-4">
                  <Zap className="w-8 h-8 text-muted-foreground/50" />
                </div>
                <h4 className="font-semibold text-foreground text-lg">Sin servicios en curso</h4>
                <p className="text-sm text-muted-foreground max-w-[300px] mt-1 mb-4">Acepta una cotización para habilitar el seguimiento del contrato.</p>
                <Button variant="outline" onClick={() => {
                  setIsServicesDetailOpen(false);
                  router.push(`/solicitudes/create?leadId=${selectedLead.id}&clientId=${selectedLead.clientId}`);
                }}>Generar Cotización</Button>
              </div>
            )}
            <div className="flex justify-end pt-4 border-t border-border/50">
              <Button variant="outline" onClick={() => setIsServicesDetailOpen(false)}>Cerrar</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={isCancelPlanOpen} onOpenChange={setIsCancelPlanOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-red-600 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" /> Confirmar Cancelación de Plan
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-3">
              <p>Estás a punto de cancelar el plan mensual de <strong>{selectedLead?.clientName}</strong>.</p>
              {clientData?.activePlan && (() => {
                const tDay = new Date().getDate();
                const planStartDay = clientData.activePlan.planStartDay || 30;
                let isLate = false;
                if (planStartDay === 15) {
                  if (tDay > 15) isLate = true;
                } else {
                  if (tDay === 31 || (tDay >= 1 && tDay <= 15)) isLate = true;
                }

                if (isLate) {
                  return (
                    <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-800 text-sm">
                      <strong>⚠️ Cancelación Tardía (Día {tDay}):</strong> La fecha máxima para cancelar este ciclo sin recargo ha expirado. Al confirmar, se generará <strong>automáticamente una factura por el 50%</strong> de la mensualidad (una quincena) como recargo por penalización.
                    </div>
                  );
                } else {
                  return (
                    <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-emerald-800 text-sm">
                      <strong>✅ Cancelación a Tiempo (Día {tDay}):</strong> Estás dentro de la fecha límite para cancelar el próximo ciclo sin ningún recargo adicional.
                    </div>
                  );
                }
              })()}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Volver</AlertDialogCancel>
            <AlertDialogAction onClick={handleCancelPlan} className="bg-red-600 hover:bg-red-700 text-white">
              Confirmar Cancelación
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Modal: Editar Perfil */}
      <Dialog open={isEditingProfile} onOpenChange={setIsEditingProfile}>
        <DialogContent className="max-w-md bg-card/95 border border-primary/20 shadow-2xl p-0 overflow-hidden rounded-3xl backdrop-blur-2xl animate-in fade-in zoom-in-95 duration-300">
          <div className="bg-gradient-to-br from-primary/30 via-primary/5 to-transparent p-5 text-white relative border-b border-white/5">
            <div className="absolute top-0 right-0 p-5 opacity-10 pointer-events-none group-hover:rotate-12 transition-transform duration-700">
              <User className="w-12 h-12 text-primary" />
            </div>
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-2">
                <Badge className="bg-primary/20 text-primary border-primary/30 hover:bg-primary/30 transition-all uppercase tracking-[0.2em] text-[8px] font-black px-2 py-0">Maestro</Badge>
                <div className="h-1 w-1 rounded-full bg-primary/40" />
              </div>
              <DialogTitle className="text-xl font-black font-headline tracking-tighter flex items-center gap-2.5">
                <div className="p-2 bg-primary rounded-lg shadow-lg shadow-primary/30 scale-100 hover:scale-110 transition-transform">
                  <Edit2 className="w-4 h-4 text-white" />
                </div>
                Editar Perfil
              </DialogTitle>
            </div>
          </div>

          <div className="p-5 space-y-4">
            <div className="grid gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="clientName" className="text-[10px] font-black uppercase tracking-widest text-primary/70 ml-1">Nombre Completo</Label>
                <div className="relative group">
                  <Input
                    id="clientName"
                    value={editableProfile.clientName}
                    onChange={(e) => setEditableProfile(prev => ({ ...prev, clientName: e.target.value }))}
                    className="h-11 bg-background/40 border-primary/10 rounded-xl focus:ring-primary/20 transition-all group-hover:border-primary/30 pl-11 font-medium bg-muted/20"
                    placeholder="Nombre del cliente"
                  />
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-primary/40 group-focus-within:text-primary transition-colors" />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="company" className="text-[10px] font-black uppercase tracking-widest text-primary/70 ml-1">Nombre de Empresa</Label>
                <div className="relative group">
                  <Input
                    id="company"
                    value={editableProfile.company}
                    onChange={(e) => setEditableProfile(prev => ({ ...prev, company: e.target.value }))}
                    className="h-11 bg-background/40 border-primary/10 rounded-xl focus:ring-primary/20 transition-all group-hover:border-primary/30 pl-11 font-medium bg-muted/20"
                    placeholder="Ej: Kairos Visuals"
                  />
                  <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-primary/40 group-focus-within:text-primary transition-colors" />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-[10px] font-black uppercase tracking-widest text-primary/70 ml-1">Email de Contacto</Label>
                <div className="relative group">
                  <Input
                    id="email"
                    type="email"
                    value={editableProfile.clientEmail}
                    onChange={(e) => setEditableProfile(prev => ({ ...prev, clientEmail: e.target.value }))}
                    className="h-11 bg-background/40 border-primary/10 rounded-xl focus:ring-primary/20 transition-all group-hover:border-primary/30 pl-11 text-sm bg-muted/20"
                    placeholder="correo@ejemplo.com"
                  />
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-primary/40 group-focus-within:text-primary transition-colors" />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="phone" className="text-[10px] font-black uppercase tracking-widest text-primary/70 ml-1">WhatsApp / Teléfono Internacional</Label>
                <div className="group phone-input-kairos">
                  <PhoneInput
                    id="phone"
                    value={editableProfile.clientPhone}
                    onChange={(val) => setEditableProfile(prev => ({ ...prev, clientPhone: val || "" }))}
                    className="kairos-phone-input"
                    placeholder="Número telefónico"
                    defaultCountry="CR"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="industry" className="text-[10px] font-black uppercase tracking-widest text-primary/70 ml-1">Segmento de Mercado</Label>
                <div className="relative group">
                  <Select value={editableProfile.industry} onValueChange={(val) => setEditableProfile(prev => ({ ...prev, industry: val }))}>
                    <SelectTrigger className="h-11 bg-background/40 border-primary/10 rounded-xl focus:ring-primary/20 transition-all group-hover:border-primary/30 pl-11 bg-muted/20">
                      <SelectValue placeholder="Seleccionar industria" />
                    </SelectTrigger>
                    <SelectContent className="bg-card border-primary/20 max-h-[300px] rounded-2xl overflow-hidden shadow-2xl">
                      {industries.map((ind: string) => <SelectItem key={ind} value={ind} className="hover:bg-primary/10 focus:bg-primary/10 transition-colors py-3 px-4 text-sm">{ind}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <Sparkles className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-primary/40 group-focus-within:text-primary transition-colors z-10 pointer-events-none" />
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-1">
              <Button
                variant="ghost"
                className="flex-1 h-10 rounded-xl font-bold text-muted-foreground hover:bg-white/5 transition-all text-[10px] uppercase tracking-widest"
                onClick={() => setIsEditingProfile(false)}
              >
                Cancelar
              </Button>
              <Button
                className="flex-[1.5] h-10 rounded-xl bg-primary hover:bg-primary/90 text-white font-black gap-2 shadow-xl shadow-primary/20 transition-all hover:scale-[1.02] active:scale-[0.98] text-xs"
                onClick={handleSaveProfile}
                disabled={isProcessing}
              >
                Guardar Cambios
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isBriefingDialogOpen} onOpenChange={setIsBriefingDialogOpen}>
        <DialogContent className="max-w-xl bg-card border-none shadow-2xl p-0 overflow-hidden rounded-[2rem] animate-in fade-in slide-in-from-bottom-4 duration-300">
          {/* Header Section */}
          <div className="bg-gradient-to-br from-amber-600/20 via-amber-600/5 to-transparent p-6 text-foreground relative border-b border-border/50">
            <div className="relative z-10 flex items-center justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-3 mb-1">
                  <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/20 px-3 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest">Paso {briefingStep} de 3</Badge>
                  <div className="h-1 w-1 rounded-full bg-amber-500" />
                  <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/60 font-headline">Briefing Estratégico</span>
                </div>
                <DialogTitle className="text-2xl font-black font-headline tracking-tighter">
                  {briefingStep === 1 && "Negocio y Marca"}
                  {briefingStep === 2 && "Valor Estratégico"}
                  {briefingStep === 3 && "Cierre y Contacto"}
                </DialogTitle>
              </div>
              <div className="h-12 w-12 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-600 border border-amber-500/20 shadow-sm">
                {briefingStep === 1 && <Building className="w-5 h-5 text-amber-600" />}
                {briefingStep === 2 && <Target className="w-5 h-5 text-amber-600" />}
                {briefingStep === 3 && <MessageSquare className="w-5 h-5 text-amber-600" />}
              </div>
            </div>

            {/* Progress Bar */}
            <div className="absolute bottom-0 left-0 w-full h-1 bg-muted">
              <div
                className="h-full bg-amber-500 transition-all duration-500 ease-out shadow-[0_0_8px_rgba(245,158,11,0.4)]"
                style={{ width: `${(briefingStep / 3) * 100}%` }}
              />
            </div>
          </div>

          <div className="p-6">
            <div className="min-h-[380px] max-h-[60vh] overflow-y-auto px-1 custom-scrollbar">
              {briefingStep === 1 && (
                <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-[10px] uppercase font-black tracking-widest text-muted-foreground ml-1">Industria / Nicho</Label>
                      <Select value={briefingData.industry} onValueChange={(val) => setBriefingData(prev => ({ ...prev, industry: val }))}>
                        <SelectTrigger className="h-10 bg-muted/30 border-none rounded-xl focus:ring-amber-500/20 font-medium text-xs">
                          <SelectValue placeholder="Seleccionar..." />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl border-border max-h-[200px]">
                          {industries.map((ind: string) => (
                            <SelectItem key={ind} value={ind} className="rounded-lg text-xs">{ind}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] uppercase font-black tracking-widest text-muted-foreground ml-1">Redes Sociales</Label>
                      <div className="flex items-center justify-between bg-muted/30 px-3 h-10 rounded-xl">
                        <span className="text-xs font-bold text-muted-foreground">¿Tiene redes sociales?</span>
                        <div
                          className={`w-9 h-5 rounded-full relative cursor-pointer transition-colors ${briefingData.hasSocials ? 'bg-amber-500' : 'bg-muted-foreground/30'}`}
                          onClick={() => setBriefingData(prev => ({ ...prev, hasSocials: !prev.hasSocials, socials: !prev.hasSocials ? (prev.socials.length > 0 ? prev.socials : [{ platform: 'Instagram', handle: '' }]) : [] }))}
                        >
                          <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${briefingData.hasSocials ? 'left-5' : 'left-1'}`} />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-[10px] uppercase font-black tracking-widest text-muted-foreground ml-1">Descripción del Negocio</Label>
                    <Textarea
                      placeholder="Cuéntanos sobre tu negocio y marca..."
                      className="min-h-[80px] max-h-[120px] rounded-xl bg-muted/30 border-none focus:ring-amber-500/20 text-xs p-4 leading-relaxed custom-scrollbar font-medium"
                      value={briefingData.aboutBusiness}
                      onChange={(e) => setBriefingData(prev => ({ ...prev, aboutBusiness: e.target.value }))}
                    />
                  </div>

                  {briefingData.hasSocials && (
                    <div className="space-y-3 pt-2">
                      <Label className="text-[10px] uppercase font-black tracking-widest text-muted-foreground ml-1">Cuentas Registradas</Label>
                      <div className="grid grid-cols-1 gap-2">
                        {briefingData.socials.map((social, idx) => (
                          <div key={idx} className="flex gap-2 items-center bg-muted/20 p-1.5 rounded-xl border border-border/10 animate-in zoom-in-95 duration-200">
                            <Select value={social.platform} onValueChange={(val) => {
                              const newSocials = [...briefingData.socials];
                              newSocials[idx].platform = val;
                              setBriefingData(prev => ({ ...prev, socials: newSocials }));
                            }}>
                              <SelectTrigger className="w-[100px] h-8 bg-background border-none text-[9px] font-black rounded-lg uppercase tracking-wider">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent className="rounded-xl border-border">
                                {PLATFORMS.map(p => <SelectItem key={p} value={p} className="text-[10px] uppercase font-bold tracking-tight">{p}</SelectItem>)}
                              </SelectContent>
                            </Select>
                            <Input
                              className="h-8 bg-background border-none text-xs flex-1 rounded-lg font-bold"
                              placeholder="@usuario"
                              value={social.handle}
                              onChange={(e) => {
                                const newSocials = [...briefingData.socials];
                                newSocials[idx].handle = e.target.value;
                                setBriefingData(prev => ({ ...prev, socials: newSocials }));
                              }}
                            />
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/10 rounded-lg shrink-0 transition-colors" onClick={() => {
                              setBriefingData(prev => ({ ...prev, socials: prev.socials.filter((_, i) => i !== idx) }));
                            }}>
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        ))}
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full h-9 border-dashed border-amber-500/30 bg-amber-500/5 hover:bg-amber-500/10 text-amber-600 text-[9px] font-black uppercase tracking-widest gap-2 rounded-xl transition-all"
                          onClick={() => setBriefingData(prev => ({ ...prev, socials: [...prev.socials, { platform: 'Instagram', handle: '' }] }))}
                        >
                          <Plus className="w-3 h-3" /> Agregar Red Social
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {briefingStep === 2 && (
                <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                  <div className="space-y-3">
                    <Label className="text-[10px] uppercase font-black tracking-widest text-muted-foreground ml-1">¿Qué te motivó a contactarnos?</Label>
                    <div className="grid grid-cols-1 gap-2">
                      {motivations.map((mot: string) => (
                        <div
                          key={mot}
                          className={`group flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer ${briefingData.motivation === mot ? 'bg-amber-500/10 border-amber-500/30' : 'bg-muted/20 border-transparent hover:bg-muted/40'}`}
                          onClick={() => setBriefingData(prev => ({ ...prev, motivation: mot }))}
                        >
                          <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${briefingData.motivation === mot ? 'border-amber-500 bg-amber-500' : 'border-muted-foreground/30 group-hover:border-amber-500/50'}`}>
                            {briefingData.motivation === mot && <Check className="w-2.5 h-2.5 text-white" />}
                          </div>
                          <span className={`text-[10px] font-black leading-tight uppercase tracking-tight ${briefingData.motivation === mot ? 'text-amber-700' : 'text-foreground/50'}`}>{mot}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between px-1">
                      <Label className="text-[10px] uppercase font-black tracking-widest text-muted-foreground ml-1">Objetivos de Crecimiento (Hasta 3)</Label>
                      <Badge variant="outline" className="text-[9px] h-5 border-amber-500/30 text-amber-600 bg-amber-500/5 px-2">{briefingData.mainGoals.length}/3</Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {mainGoals.map((goal: string) => {
                        const isSelected = briefingData.mainGoals.includes(goal);
                        return (
                          <div
                            key={goal}
                            className={`flex items-center gap-2.5 p-2.5 rounded-xl border transition-all cursor-pointer ${isSelected ? 'bg-amber-500/10 border-amber-500/30 shadow-sm' : 'bg-muted/10 border-transparent hover:bg-muted/20'}`}
                            onClick={() => handleToggleBriefingSelection('mainGoals', goal)}
                          >
                            <div className={`w-3.5 h-3.5 rounded border flex items-center justify-center shrink-0 transition-colors ${isSelected ? 'bg-amber-500 border-amber-500' : 'border-muted-foreground/30'}`}>
                              {isSelected && <Check className="w-2.5 h-2.5 text-white" />}
                            </div>
                            <span className={`text-[10px] font-black leading-tight uppercase tracking-tight ${isSelected ? 'text-amber-700' : 'text-foreground/50'}`}>{goal}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between px-1">
                      <Label className="text-[10px] uppercase font-black tracking-widest text-muted-foreground ml-1">Expectativas con Kairos (Hasta 3)</Label>
                      <Badge variant="outline" className="text-[9px] h-5 border-amber-500/30 text-amber-600 bg-amber-500/5 px-2">{briefingData.expectations.length}/3</Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {expectations.map((exp: string) => {
                        const isSelected = briefingData.expectations.includes(exp);
                        return (
                          <div
                            key={exp}
                            className={`flex items-center gap-2.5 p-2.5 rounded-xl border transition-all cursor-pointer ${isSelected ? 'bg-amber-500/10 border-amber-500/30 shadow-sm' : 'bg-muted/10 border-transparent hover:bg-muted/20'}`}
                            onClick={() => handleToggleBriefingSelection('expectations', exp)}
                          >
                            <div className={`w-3.5 h-3.5 rounded border flex items-center justify-center shrink-0 transition-colors ${isSelected ? 'bg-amber-500 border-amber-500' : 'border-muted-foreground/30'}`}>
                              {isSelected && <Check className="w-2.5 h-2.5 text-white" />}
                            </div>
                            <span className={`text-[10px] font-black leading-tight uppercase tracking-tight ${isSelected ? 'text-amber-700' : 'text-foreground/50'}`}>{exp}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {briefingStep === 3 && (
                <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="space-y-3">
                      <Label className="text-[10px] uppercase font-black tracking-widest text-muted-foreground ml-1">¿Cómo nos conociste?</Label>
                      <Select value={briefingData.contactSource} onValueChange={(val) => setBriefingData(prev => ({ ...prev, contactSource: val }))}>
                        <SelectTrigger className="h-10 bg-muted/30 border-none rounded-xl focus:ring-amber-500/20 font-black text-[10px] uppercase tracking-wider">
                          <SelectValue placeholder="Seleccionar..." />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl border-border">
                          {contactSources.map((src: string) => (
                            <SelectItem key={src} value={src} className="text-[10px] uppercase font-bold text-muted-foreground rounded-lg">{src}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-3">
                      <Label className="text-[10px] uppercase font-black tracking-widest text-muted-foreground ml-1">Canal de Contacto</Label>
                      <div className="grid grid-cols-2 gap-2">
                        <div
                          className={`h-10 flex items-center justify-center gap-2 rounded-xl border transition-all cursor-pointer ${briefingData.contactPreference === 'whatsapp' ? 'bg-amber-500/10 border-amber-500/30 text-amber-600' : 'bg-muted/20 border-transparent hover:bg-muted/30'}`}
                          onClick={() => setBriefingData(prev => ({ ...prev, contactPreference: 'whatsapp' }))}
                        >
                          <MessageCircle className="w-4 h-4" />
                          <span className="text-[9px] font-black uppercase tracking-widest">WhatsApp</span>
                        </div>
                        <div
                          className={`h-10 flex items-center justify-center gap-2 rounded-xl border transition-all cursor-pointer ${briefingData.contactPreference === 'email' ? 'bg-amber-500/10 border-amber-500/30 text-amber-600' : 'bg-muted/20 border-transparent hover:bg-muted/30'}`}
                          onClick={() => setBriefingData(prev => ({ ...prev, contactPreference: 'email' }))}
                        >
                          <Mail className="w-4 h-4" />
                          <span className="text-[9px] font-black uppercase tracking-widest">Email</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-5 pt-4 border-t border-border/50">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/40 text-center">Confirmación de Datos Maestros</p>

                    <div className="grid grid-cols-1 gap-4">
                      <div className="space-y-2">
                        <Label className="text-[10px] uppercase font-black tracking-widest text-muted-foreground ml-1">Email Principal</Label>
                        <div className="relative group">
                          <Input
                            value={briefingData.clientEmail}
                            onChange={(e) => setBriefingData(prev => ({ ...prev, clientEmail: e.target.value }))}
                            className="h-10 bg-muted/40 border-none rounded-xl focus:ring-amber-500/20 pl-10 text-[11px] font-bold"
                            placeholder="correo@ejemplo.com"
                          />
                          <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/30" />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-[10px] uppercase font-black tracking-widest text-muted-foreground ml-1">WhatsApp de Seguimiento</Label>
                        <div className="phone-input-kairos-compact">
                          <PhoneInput
                            value={briefingData.clientPhone}
                            onChange={(val) => setBriefingData(prev => ({ ...prev, clientPhone: val || "" }))}
                            className="kairos-phone-input-sm"
                            placeholder="Número telefónico"
                            defaultCountry="CR"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-amber-500/5 p-4 rounded-[1.25rem] border border-amber-500/10 flex items-start gap-4 shadow-sm">
                    <div className="w-8 h-8 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-600 shrink-0 border border-amber-500/20">
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] font-black uppercase tracking-widest text-amber-600">¡Estrategia Lista para Despegar!</p>
                      <p className="text-[11px] text-muted-foreground leading-relaxed font-medium">Al finalizar, sincronizaremos estos datos con tu perfil maestro para optimizar cada interacción con Kairos.</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Footer Actions */}
          <div className="p-6 bg-muted/30 border-t border-border/50 flex items-center justify-between gap-4">
            <Button
              variant="ghost"
              className={`h-11 rounded-xl text-[10px] font-black uppercase tracking-widest gap-2 transition-all ${briefingStep === 1 ? 'invisible' : 'hover:bg-amber-500/10 text-muted-foreground/60 border border-transparent hover:border-amber-500/20'}`}
              onClick={() => setBriefingStep(prev => Math.max(1, prev - 1))}
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Atrás
            </Button>

            <div className="flex items-center gap-3">
              {briefingStep < 3 ? (
                <Button
                  className="px-8 h-11 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-black text-[10px] uppercase tracking-widest gap-2 shadow-xl shadow-amber-600/20 active:scale-[0.98] transition-all hover:scale-[1.02]"
                  onClick={() => setBriefingStep(prev => Math.min(3, prev + 1))}
                >
                  Continuar <ChevronRight className="w-3.5 h-3.5" />
                </Button>
              ) : (
                <Button
                  className="px-8 h-11 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-black text-[10px] uppercase tracking-widest gap-2 shadow-xl shadow-amber-500/30 active:scale-[0.98] transition-all hover:scale-[1.05]"
                  onClick={handleSaveBriefing}
                  disabled={isProcessing}
                >
                  {isProcessing ? <Loader2 className="w-4 h-4 animate-spin text-white" /> : <><Save className="w-4 h-4" /> Guardar Briefing</>}
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* MODAL: PREVIEW DE PROPUESTA/COTIZACION (Estilo Dark Modo) */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-[850px] h-[90vh] flex flex-col p-0 overflow-hidden bg-[#09090b] border border-zinc-800/50 rounded-3xl shadow-[0_0_50px_-12px_rgba(0,0,0,0.5)] animate-in fade-in zoom-in-95 duration-300">
          <div className="flex items-center justify-between p-4 bg-zinc-900/50 backdrop-blur-xl border-b border-zinc-800/50 z-10 shrink-0">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/20 rounded-xl text-primary border border-primary/20">
                <FileText className="w-5 h-5" />
              </div>
              <div className="flex flex-col">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary/80">Visor de Documentos</p>
                <DialogTitle className="text-sm font-bold text-zinc-100 line-clamp-1">{previewQuotation?.title || 'Vista Previa'}</DialogTitle>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" className="h-9 px-3 text-xs font-bold gap-2 bg-zinc-800/50 border-zinc-700/50 text-zinc-300 hover:bg-zinc-800 hover:text-white transition-all" onClick={handlePrint}>
                <Printer className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Imprimir</span>
              </Button>
              <Button variant="outline" size="sm" className="h-9 px-3 text-xs font-bold gap-2 bg-zinc-800/50 border-zinc-700/50 text-zinc-300 hover:bg-zinc-800 hover:text-white transition-all" onClick={handleDownload} disabled={isProcessing}>
                {isProcessing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />} <span className="hidden sm:inline">Descargar PDF</span>
              </Button>
              <Button size="sm" className="h-9 px-5 text-xs font-black gap-2 bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-500/20 active:scale-95 transition-all" onClick={handleShare}>
                <Share2 className="w-3.5 h-3.5" /> Compartir
              </Button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-8 flex justify-center custom-scrollbar bg-[#09090b] bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-zinc-900/20 via-transparent to-transparent">
            <div className="shadow-[0_20px_50px_rgba(0,0,0,0.5)] bg-white origin-top transition-transform h-fit w-fit mb-8 rounded-sm overflow-hidden border border-zinc-800/30">
              <CartaTemplate
                invoice={previewQuotation}
                client={{
                  clientName: selectedLead?.clientName || leadUser?.firstName + ' ' + leadUser?.lastName,
                  contactEmail: selectedLead?.clientEmail || leadUser?.email,
                  contactPhone: selectedLead?.clientPhone || leadUser?.phone
                }}
                settings={companySettings}
              />
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
