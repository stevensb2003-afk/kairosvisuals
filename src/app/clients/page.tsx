'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Contact, Loader2, Search, AlertTriangle, TrendingUp, MoreVertical, Receipt, LayoutDashboard, ExternalLink, Mail, MessageCircle, List, LayoutGrid, CheckCircle2 } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useFirestore, useUser } from '@/firebase';
import { collection, query, where, getDocs, doc, updateDoc, orderBy, onSnapshot, collectionGroup, setDoc, getDoc, addDoc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { formatPhone } from '@/lib/utils';
import { useRouter, useSearchParams } from 'next/navigation';
import { PhoneInput } from "@/components/ui/phone-input";
import { 
  acceptQuotationClient, 
  processInvoicePayment, 
  generateMonth1Part2, 
  cancelPlanRequest 
} from '@/lib/billing_utils';
import { validateClientUniqueness } from '@/lib/client_utils';


export default function ClientsPage() {
  const searchParams = useSearchParams();
  const openLead = searchParams.get('openLead');
  const tabParam = searchParams.get('tab');
  const router = useRouter();
  const [acceptedClients, setAcceptedClients] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedLead, setSelectedLead] = useState<any>(null);
  const [isLeadLoading, setIsLeadLoading] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [openDialogId, setOpenDialogId] = useState<string | null>(null);
  const [isCreateClientOpen, setIsCreateClientOpen] = useState(false);
  const [isCancelPlanOpen, setIsCancelPlanOpen] = useState(false);
  const [newClientForm, setNewClientForm] = useState({ 
    firstName: '', 
    lastName: '', 
    email: '', 
    phone: '', 
    company: '' 
  });

  const isFormValid = useMemo(() => {
    // Required: FirstName, LastName and Phone. Company, Email are optional.
    return !!newClientForm.firstName.trim() && !!newClientForm.lastName.trim() && !!newClientForm.phone?.trim();
  }, [newClientForm]);

  const [clientDocs, setClientDocs] = useState<Map<string, any>>(new Map());
  const [planFilter, setPlanFilter] = useState<'all' | 'active' | 'none' | 'archived'>('all');
  const [financialFilter, setFinancialFilter] = useState<'all' | 'upToDate' | 'overdue'>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState("");


  const filterList = (list: any[]) => {
    if (!searchQuery) return list;
    const q = searchQuery.toLowerCase();
    return list.filter(item =>
      (item.clientName?.toLowerCase().includes(q)) ||
      (item.clientEmail?.toLowerCase().includes(q)) ||
      (item.email?.toLowerCase().includes(q)) ||
      (item.company?.toLowerCase().includes(q)) ||
      (item.companyName?.toLowerCase().includes(q)) ||
      (item.firstName?.toLowerCase().includes(q)) ||
      (item.lastName?.toLowerCase().includes(q))
    );
  };

  const filteredAccepted = filterList(acceptedClients);

  const firestore = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();


  useEffect(() => {
    const autoOpen = async () => {
      if (openLead && !openDialogId) {
        if (acceptedClients.length > 0) {
          const req = acceptedClients.find(r => (r.id === openLead) || (r.clientId === openLead) || (r.requestId === openLead));
          if (req) {
            setOpenDialogId(req.id || req.clientId);
            await handleOpenLead(req);
            const params = new URLSearchParams(window.location.search);
            params.delete('openLead');
            router.replace(`/clients?${params.toString()}`, { scroll: false });
          }
        }
      }
    };
    autoOpen();
  }, [openLead, acceptedClients]);

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    toast({
      title: "Copiado al portapapeles",
      description: `${field} ha sido copiado correctamente.`,
    });
    setTimeout(() => setCopiedField(null), 2000);
  };



  // Phase B: Listen to /clients collection for clientCategory and other fields
  useEffect(() => {
    if (!firestore) return;

    const unsubscribe = onSnapshot(collection(firestore, 'clients'), (snapshot) => {
      const docs = new Map<string, any>();
      snapshot.docs.forEach(d => {
        docs.set(d.id, { id: d.id, ...d.data() });
      });
      setClientDocs(docs);
    });

    return () => unsubscribe();
  }, [firestore]);

  useEffect(() => {
    if (!firestore) return;
    setIsLoading(true);
    
    // We derive active clients only from the /clients collection as requested
    const clientsList = Array.from(clientDocs.values()).map(c => ({
      id: c.id,
      clientId: c.id,
      clientName: c.clientName || c.name || c.id,
      clientEmail: c.clientEmail || c.email || '',
      company: c.company || '',
      createdAt: c.createdAt || '',
      ...c
    }));

    clientsList.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    setAcceptedClients(clientsList);
    setIsLoading(false);
  }, [clientDocs]);

  const handleOpenLead = async (lead: any) => {
    router.push(`/clients/${lead.clientId || lead.id}`);
  };

  const handleArchiveClient = async (clientId: string) => {
    if (!firestore) return;
    try {
      await updateDoc(doc(firestore, 'clients', clientId), {
        isArchived: true,
        updatedAt: new Date().toISOString()
      });
      toast({ title: "Cliente archivado correctamente" });
    } catch (error) {
      console.error("Error archiving client:", error);
      toast({ variant: "destructive", title: "Error al archivar cliente" });
    }
  };

  const handleUnarchiveClient = async (clientId: string) => {
    if (!firestore) return;
    try {
      await updateDoc(doc(firestore, 'clients', clientId), {
        isArchived: false,
        updatedAt: new Date().toISOString()
      });
      toast({ title: "Cliente restaurado correctamente" });
    } catch (error) {
      console.error("Error unarchiving client:", error);
      toast({ variant: "destructive", title: "Error al restaurar cliente" });
    }
  };





  const handleAcceptQuotation = async (quotation: any) => {
    if (!firestore || !selectedLead) return;

    setIsLeadLoading(true);
    try {
      await acceptQuotationClient(firestore, quotation, selectedLead);

      toast({
        title: "¡Propuesta Aceptada!",
        description: "El lead ha sido convertido a cliente fijo y la primera factura ha sido generada.",
      });

      // Refresh data
      await handleOpenLead(selectedLead);
    } catch (error) {
      console.error("Error accepting quotation:", error);
      toast({ variant: "destructive", title: "Error", description: "No se pudo procesar la aceptación." });
    } finally {
      setIsLeadLoading(false);
    }
  };

  const handleProcessInvoicePayment = async (invoice: any) => {
    if (!firestore || !selectedLead) return;

    setIsLeadLoading(true);
    try {
      const clientId = selectedLead.clientId || selectedLead.id;
      await processInvoicePayment(firestore, clientId, invoice, selectedLead.clientName);

      toast({ title: "Factura marcada como pagada", description: "El estado de cuenta se ha actualizado." });
      await handleOpenLead(selectedLead);
    } catch (error) {
      console.error("Error processing payment:", error);
      toast({ variant: "destructive", title: "Error" });
    } finally {
      setIsLeadLoading(false);
    }
  };

  const handleGenerateMonth1Part2 = async () => {
    if (!firestore || !selectedLead) return;

    setIsLeadLoading(true);
    try {
      const clientId = selectedLead.clientId || selectedLead.id;
      await generateMonth1Part2(firestore, clientId, selectedLead.clientName);

      toast({ title: "Factura Parte 2 Generada", description: "Se ha creado el borrador de la factura restante." });
      await handleOpenLead(selectedLead);
    } catch (error: any) {
      console.error("Error generating Part 2:", error);
      toast({ variant: "destructive", title: "Error", description: error.message });
    } finally {
      setIsLeadLoading(false);
    }
  };

  const handleCancelPlan = async () => {
    if (!firestore || !selectedLead) return;

    setIsLeadLoading(true);
    try {
      const clientId = selectedLead.clientId || selectedLead.id;
      const { isLate } = await cancelPlanRequest(firestore, clientId, selectedLead.clientName);

      toast({ title: "Plan Cancelado", description: isLate ? "Se ha generado una factura de recargo extemporáneo." : "El plan ha sido cancelado exitosamente." });
      setIsCancelPlanOpen(false);
      await handleOpenLead(selectedLead);
    } catch (error: any) {
      console.error("Error cancelling plan:", error);
      toast({ variant: "destructive", title: "Error al cancelar plan", description: error.message });
    } finally {
      setIsLeadLoading(false);
    }
  };


  const filteredClients = useMemo(() => {
    let list = filteredAccepted;

    // By default, filter out archived unless specifically looking for them
    if (planFilter !== 'archived') {
      list = list.filter(client => {
        const clientDoc = clientDocs.get(client.clientId);
        return !clientDoc?.isArchived;
      });
    }

    if (planFilter === 'active') {
      list = list.filter(client => {
        const clientDoc = clientDocs.get(client.clientId);
        return clientDoc?.activePlan?.status === 'active';
      });
    } else if (planFilter === 'none') {
      list = list.filter(client => {
        const clientDoc = clientDocs.get(client.clientId);
        return !clientDoc?.activePlan || clientDoc?.activePlan?.status !== 'active';
      });
    } else if (planFilter === 'archived') {
      list = list.filter(client => {
        const clientDoc = clientDocs.get(client.clientId);
        return clientDoc?.isArchived === true;
      });
    }

    if (financialFilter === 'upToDate') {
      list = list.filter(client => {
        const clientDoc = clientDocs.get(client.clientId);
        const pStatus = clientDoc?.paymentStatus || client.paymentStatus;
        return pStatus !== 'overdue' && pStatus !== 'suspended';
      });
    } else if (financialFilter === 'overdue') {
      list = list.filter(client => {
        const clientDoc = clientDocs.get(client.clientId);
        const pStatus = clientDoc?.paymentStatus || client.paymentStatus;
        return pStatus === 'overdue' || pStatus === 'suspended';
      });
    }

    return list;
  }, [filteredAccepted, planFilter, financialFilter, clientDocs]);



  return (
    <div className="space-y-6">

      <Card className="border-none shadow-none bg-transparent">
        <CardHeader className="px-0 pt-0">
          <CardTitle>Fichas de Cliente</CardTitle>
          <CardDescription>Gestiona datos de contacto, tarifas y estados de facturación de tus clientes registrados.</CardDescription>
        </CardHeader>
        <CardContent className="px-0">
          <div className="flex flex-col gap-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex flex-col gap-4 flex-1">
                {/* Top Row: Search and View Mode */}
                <div className="flex items-center gap-4">
                  <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="client-search-bar"
                      name="client-search-bar"
                      placeholder="Buscar por nombre, email o empresa..."
                      className="pl-10 h-10 bg-card border-border/50 focus:border-primary/50 transition-all rounded-lg"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      autoComplete="off"
                    />
                  </div>
                  <div className="flex items-center gap-2 border-l pl-4 border-border/50">
                    <Button
                      variant={viewMode === 'grid' ? 'default' : 'outline'}
                      size="icon"
                      className="h-10 w-10 rounded-lg transition-all"
                      onClick={() => setViewMode('grid')}
                      title="Vista de Tarjetas"
                    >
                      <LayoutGrid className="w-4 h-4" />
                    </Button>
                    <Button
                      variant={viewMode === 'list' ? 'default' : 'outline'}
                      size="icon"
                      className="h-10 w-10 rounded-lg transition-all"
                      onClick={() => setViewMode('list')}
                      title="Vista de Lista"
                    >
                      <List className="w-5 h-5" />
                    </Button>
                  </div>
                </div>

                {/* Bottom Row: Filters */}
                <div className="flex flex-wrap items-center gap-6 p-1.5 bg-muted/20 border border-border/30 rounded-xl">
                  {/* Plan Filters */}
                  <div className="flex items-center gap-2 border-r border-border/50 pr-6">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mr-1 opacity-70">Plan:</span>
                    <Button
                      variant={planFilter === 'all' ? 'default' : 'ghost'}
                      size="sm"
                      className={`h-8 text-xs rounded-full px-4 ${planFilter !== 'all' && 'hover:bg-background'}`}
                      onClick={() => setPlanFilter('all')}
                    >
                      Todos
                      <Badge variant="secondary" className="ml-1.5 h-4 px-1 text-[10px] border-0">
                        {acceptedClients.filter(c => !c.isArchived).length}
                      </Badge>
                    </Button>
                    <Button
                      variant={planFilter === 'active' ? 'default' : 'ghost'}
                      size="sm"
                      className={`h-8 text-xs rounded-full px-4 gap-2 ${planFilter !== 'active' && 'hover:bg-background'}`}
                      onClick={() => setPlanFilter('active')}
                    >
                      <TrendingUp className="w-3 h-3" />
                      Con Plan
                    </Button>
                    <Button
                      variant={planFilter === 'none' ? 'default' : 'ghost'}
                      size="sm"
                      className={`h-8 text-xs rounded-full px-4 gap-2 ${planFilter !== 'none' && 'hover:bg-background'}`}
                      onClick={() => setPlanFilter('none')}
                    >
                      <LayoutDashboard className="w-3 h-3" />
                      Sin Plan
                    </Button>
                    <Button
                      variant={planFilter === 'archived' ? 'secondary' : 'ghost'}
                      size="sm"
                      className={`h-8 text-xs px-4 gap-2 transition-all rounded-full ${planFilter === 'archived' ? 'bg-amber-100 text-amber-700 hover:bg-amber-200 border border-amber-200 shadow-sm' : 'text-muted-foreground hover:bg-amber-50 hover:text-amber-600'}`}
                      onClick={() => setPlanFilter('archived')}
                    >
                      <AlertTriangle className={`w-3 h-3 ${planFilter === 'archived' ? 'text-amber-600' : 'text-amber-500/50'}`} />
                      Archivados
                    </Button>
                  </div>

                  {/* Financial Filters */}
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mr-1 opacity-70">Estado:</span>
                    <Button
                      variant={financialFilter === 'all' ? 'default' : 'ghost'}
                      size="sm"
                      className={`h-8 text-xs rounded-full px-4 ${financialFilter !== 'all' && 'hover:bg-background'}`}
                      onClick={() => setFinancialFilter('all')}
                    >
                      Todos
                    </Button>
                    <Button
                      variant={financialFilter === 'upToDate' ? 'default' : 'ghost'}
                      size="sm"
                      className={`h-8 text-xs rounded-full px-4 gap-2 transition-all ${financialFilter === 'upToDate' ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20' : 'text-emerald-700 hover:bg-emerald-50'}`}
                      onClick={() => setFinancialFilter('upToDate')}
                    >
                      <CheckCircle2 className="w-3 h-3" />
                      Al Día
                    </Button>
                    <Button
                      variant={financialFilter === 'overdue' ? 'default' : 'ghost'}
                      size="sm"
                      className={`h-8 text-xs rounded-full px-4 gap-2 transition-all ${financialFilter === 'overdue' ? 'bg-red-600 text-white shadow-md shadow-red-600/20' : 'text-red-700 hover:bg-red-50'}`}
                      onClick={() => setFinancialFilter('overdue')}
                    >
                      <AlertTriangle className="w-3 h-3" />
                      En Mora
                    </Button>
                  </div>
                </div>
              </div>

              <Button onClick={() => setIsCreateClientOpen(true)} className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20 transition-all">
                <Plus className="w-4 h-4" /> Nuevo Cliente
              </Button>
            </div>

            {isLoading && acceptedClients.length === 0 ? (
              <div className="flex justify-center p-20"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
            ) : acceptedClients.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-80 border-2 border-dashed border-border/50 rounded-2xl text-center p-8 bg-card/10">
                <Contact className="w-16 h-16 text-muted-foreground/30 mb-4" />
                <h3 className="text-xl font-bold font-headline mb-2 text-foreground/80">CRM Vacío</h3>
                <p className="text-muted-foreground max-w-md text-sm">
                  No hay clientes que coincidan con los criterios de búsqueda o aún no tienes clientes registrados formalmente.
                </p>
                <Button onClick={() => setIsCreateClientOpen(true)} className="mt-6 gap-2">
                  <Contact className="w-4 h-4" /> Crear Primer Cliente
                </Button>
              </div>
            ) : viewMode === 'list' ? (
              <div className="rounded-2xl border border-border/60 bg-card overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-muted/30 border-b border-border/50 text-xs uppercase text-muted-foreground">
                      <tr>
                        <th className="px-6 py-4 font-semibold tracking-wider">Cliente</th>
                        <th className="px-6 py-4 font-semibold tracking-wider">Contacto</th>
                        <th className="px-6 py-4 font-semibold tracking-wider">Servicio / Plan</th>
                        <th className="px-6 py-4 font-semibold tracking-wider">Estado Financiero</th>
                        <th className="px-6 py-4 font-semibold tracking-wider text-right">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/50">
                      {filteredClients.map((client) => {
                        const clientDoc = clientDocs.get(client.clientId);
                        const paymentStatus = clientDoc?.paymentStatus || client.paymentStatus;
                        const isOverdue = paymentStatus === 'overdue' || paymentStatus === 'suspended';
                        const contractType = clientDoc?.contractType || client.contractType;
                        
                        return (
                          <tr key={client.id} className={`hover:bg-accent/5 transition-colors group ${isOverdue ? 'bg-red-500/5 hover:bg-red-500/10' : ''}`}>
                            <td className="px-6 py-4">
                              <div className="font-bold text-base text-foreground group-hover:text-primary transition-colors cursor-pointer inline-block" onClick={() => handleOpenLead(client)}>
                                {client.clientName}
                              </div>
                              {client.company && <div className="text-xs text-muted-foreground mt-0.5">{client.company}</div>}
                            </td>
                            <td className="px-6 py-4">
                              <div className="text-sm">{client.clientEmail || '-'}</div>
                              {client.clientPhone && <div className="text-xs text-muted-foreground mt-0.5">{client.clientPhone}</div>}
                            </td>
                            <td className="px-6 py-4">
                              {contractType === 'recurring' ? (
                                <Badge variant="outline" className="text-xs bg-blue-500/10 text-blue-600 border-blue-500/20 py-0.5 font-medium">
                                  <TrendingUp className="h-3 w-3 mr-1" /> Recurrente
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="text-xs bg-slate-500/10 text-slate-500 border-slate-500/20 py-0.5 font-medium">Único</Badge>
                              )}
                            </td>
                            <td className="px-6 py-4">
                              {isOverdue ? (
                                <Badge variant="destructive" className="text-xs py-0.5 shadow-sm">
                                  <AlertTriangle className="h-3 w-3 mr-1" />
                                  {paymentStatus === 'suspended' ? 'Suspendido' : `Mora${clientDoc?.daysOverdue ? ` (${clientDoc.daysOverdue}d)` : ''}`}
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="text-xs bg-emerald-500/10 text-emerald-600 border-emerald-500/20 py-0.5 font-medium">Al día</Badge>
                              )}
                            </td>
                            <td className="px-6 py-4 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <Button variant="outline" size="sm" className="h-8 rounded-lg text-xs font-semibold" onClick={() => handleOpenLead(client)}>
                                  Ficha
                                </Button>
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full border border-transparent hover:border-border">
                                      <MoreVertical className="h-4 w-4 text-muted-foreground" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end" className="w-48 shadow-xl border-border/50">
                                    <DropdownMenuItem onClick={() => router.push(`/invoicing/create?clientId=${client.clientId || client.id}`)}>
                                      <Receipt className="w-4 h-4 mr-2" /> Nueva Factura
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    {clientDoc?.isArchived ? (
                                      <DropdownMenuItem className="text-emerald-600 font-medium" onClick={() => handleUnarchiveClient(client.clientId)}>
                                        <TrendingUp className="w-4 h-4 mr-2" /> Restaurar Cliente
                                      </DropdownMenuItem>
                                    ) : (
                                      <DropdownMenuItem className="text-red-600 font-medium" onClick={() => handleArchiveClient(client.clientId)}>
                                        <AlertTriangle className="w-4 h-4 mr-2" /> Archivar
                                      </DropdownMenuItem>
                                    )}
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredClients.map((client) => {
                  const clientDoc = clientDocs.get(client.clientId);
                  const consumptionPercent = (clientDoc?.consumptionLimit || client.consumptionLimit) > 0
                    ? Math.min(100, Math.round(((clientDoc?.currentConsumption || client.currentConsumption || 0) / (clientDoc?.consumptionLimit || client.consumptionLimit)) * 100))
                    : 0;
                  const paymentStatus = clientDoc?.paymentStatus || client.paymentStatus;
                  const isOverdue = paymentStatus === 'overdue' || paymentStatus === 'suspended';
                  const contractType = clientDoc?.contractType || client.contractType;
                  const consumptionLimit = clientDoc?.consumptionLimit || client.consumptionLimit || 0;
                  const currentConsumption = clientDoc?.currentConsumption || client.currentConsumption || 0;
                  const monthlyQuota = clientDoc?.monthlyQuota || client.monthlyQuota || 0;

                  return (
                    <div key={client.id} className={`p-5 rounded-2xl border bg-card hover:bg-accent/10 hover:border-primary/40 hover:shadow-lg transition-all group relative ${isOverdue ? 'border-red-500/40' : 'border-border/50'}`}>
                      <div className="flex items-start justify-between mb-4">
                        <div className="bg-primary/5 p-2.5 rounded-xl text-primary">
                          <Contact className="w-6 h-6" />
                        </div>
                        <div className="flex items-center gap-1.5">
                          {contractType === 'recurring' ? (
                            <Badge variant="outline" className="text-[10px] bg-blue-500/10 text-blue-600 border-blue-500/20 py-0.5">
                              <TrendingUp className="h-2.5 w-2.5 mr-1" /> Recurrente
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-[10px] bg-slate-500/10 text-slate-500 border-slate-500/20 py-0.5">Único</Badge>
                          )}
                          {isOverdue ? (
                            <Badge variant="destructive" className="text-[10px] py-0.5">
                              <AlertTriangle className="h-2.5 w-2.5 mr-1" />
                              {paymentStatus === 'suspended' ? 'Suspendido' : `Mora${clientDoc?.daysOverdue ? ` (${clientDoc.daysOverdue}d)` : ''}`}
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-[10px] bg-green-500/10 text-green-600 border-green-500/20 py-0.5 font-medium">Al día</Badge>
                          )}
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48">
                              <DropdownMenuItem onClick={() => handleOpenLead(client)}>
                                <ExternalLink className="w-4 h-4 mr-2" /> Ver Expediente
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              {clientDoc?.isArchived ? (
                                <DropdownMenuItem className="text-emerald-600 focus:text-emerald-700 focus:bg-emerald-50" onClick={() => handleUnarchiveClient(client.clientId)}>
                                  <TrendingUp className="w-4 h-4 mr-2" /> Restaurar Cliente
                                </DropdownMenuItem>
                              ) : (
                                <DropdownMenuItem className="text-red-600 focus:text-red-700 focus:bg-red-50" onClick={() => handleArchiveClient(client.clientId)}>
                                  <AlertTriangle className="w-4 h-4 mr-2" /> Archivar Cliente
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                      <div className="mb-4">
                        <h3 className="font-bold text-xl tracking-tight text-foreground group-hover:text-primary transition-colors truncate">{client.clientName}</h3>
                        <div className="flex items-center gap-1.5 mt-1">
                          <p className="text-xs text-muted-foreground truncate">{client.clientEmail}</p>
                          {client.company && (
                            <>
                              <span className="text-muted-foreground/30 text-[10px]">•</span>
                              <p className="text-xs font-medium text-muted-foreground/80 truncate">{client.company}</p>
                            </>
                          )}
                        </div>
                      </div>

                      {contractType === 'recurring' && consumptionLimit > 0 && (
                        <div className="space-y-2.5 mb-4 p-3.5 rounded-xl bg-secondary/20 border border-border/30">
                          <div className="flex justify-between items-center text-[11px]">
                            <span className="text-muted-foreground font-semibold">Consumo del plan</span>
                            <span className="font-bold text-foreground">{currentConsumption} / {consumptionLimit}</span>
                          </div>
                          <Progress value={consumptionPercent} className="h-1.5 bg-background/50" />
                          {monthlyQuota > 0 && (
                            <div className="flex items-center justify-between text-[11px]">
                              <span className="text-muted-foreground">Cuota mensual</span>
                              <span className="font-semibold">₡{monthlyQuota.toLocaleString()}</span>
                            </div>
                          )}
                        </div>
                      )}

                      {contractType === 'recurring' && clientDoc?.activePlan?.currentCycleMonth === 1 && (
                        <div className="mt-4 p-4 bg-primary/5 rounded-2xl border border-primary/10 space-y-3">
                          <p className="text-[10px] uppercase font-bold text-primary/70 flex items-center gap-1.5 leading-none tracking-widest">
                            <Receipt className="w-3.5 h-3.5" /> Estado de Inicio (Mes 1)
                          </p>
                          <div className="flex gap-2">
                            <div className={`flex-1 h-8 rounded-lg flex items-center justify-center text-[10px] font-bold border transition-all ${clientDoc.activePlan.isMonth1Part1Paid ? 'bg-emerald-500/20 border-emerald-500/20 text-emerald-700' : 'bg-amber-500/10 border-amber-500/20 text-amber-700'}`}>
                              PAGO 1 {clientDoc.activePlan.isMonth1Part1Paid ? '✓' : '(50%)'}
                            </div>
                            <div className={`flex-1 h-8 rounded-lg flex items-center justify-center text-[10px] font-bold border transition-all ${clientDoc.activePlan.isMonth1Part2Paid ? 'bg-emerald-500/20 border-emerald-500/20 text-emerald-700' : 'bg-muted/30 border-dashed text-muted-foreground'}`}>
                              PAGO 2 {clientDoc.activePlan.isMonth1Part2Paid ? '✓' : '(50%)'}
                            </div>
                          </div>
                        </div>
                      )}

                      <div className="flex items-center gap-2 mt-4 pt-4 border-t border-border/40">
                        <Button variant="outline" size="sm" className="w-full text-xs h-9 rounded-lg font-medium" onClick={() => handleOpenLead(client)}>
                          Ficha Completa
                        </Button>
                        <Button size="sm" className="w-full text-xs h-9 rounded-lg font-medium shadow-sm hover:shadow-md transition-all" onClick={() => router.push(`/invoicing/create?clientId=${client.clientId || client.id}`)}>
                          Nueva Factura
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </CardContent>
      </Card>


      <Dialog open={isCreateClientOpen} onOpenChange={setIsCreateClientOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Añadir Cliente Directo</DialogTitle>
            <DialogDescription>
              Crea un cliente sin necesidad de solicitud de reunión o briefing.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70">
                  Nombre <span className="text-destructive">*</span>
                </label>
                <Input
                  id="cr-f-name"
                  name="cr-f-name"
                  placeholder="Ej. Juan"
                  value={newClientForm.firstName}
                  onChange={e => setNewClientForm({ ...newClientForm, firstName: e.target.value })}
                  className="bg-card/50"
                  autoComplete="off"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70">
                  Apellido <span className="text-destructive">*</span>
                </label>
                <Input
                  id="cr-l-name"
                  name="cr-l-name"
                  placeholder="Ej. Pérez"
                  value={newClientForm.lastName}
                  onChange={e => setNewClientForm({ ...newClientForm, lastName: e.target.value })}
                  className="bg-card/50"
                  autoComplete="off"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70">Empresa (Opcional)</label>
              <Input
                id="cr-company"
                name="cr-company"
                placeholder="Ej. Acme Corp"
                value={newClientForm.company}
                onChange={e => setNewClientForm({ ...newClientForm, company: e.target.value })}
                className="bg-card/50"
                autoComplete="off"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70">Email (Opcional)</label>
              <Input
                id="cr-email"
                name="cr-email"
                type="email"
                placeholder="Ej. juan@acme.com"
                value={newClientForm.email}
                onChange={e => setNewClientForm({ ...newClientForm, email: e.target.value })}
                className="bg-card/50"
                autoComplete="off"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70">
                Teléfono <span className="text-destructive">*</span>
              </label>
              <PhoneInput
                defaultCountry="CR"
                placeholder="Introducir número"
                value={newClientForm.phone}
                onChange={val => setNewClientForm({ ...newClientForm, phone: val })}
              />
            </div>
          </div>
          <DialogFooter className="pt-2">
            <Button variant="outline" onClick={() => setIsCreateClientOpen(false)}>Cancelar</Button>
            <Button 
              disabled={!isFormValid}
              onClick={async () => {

                // Email validation if provided
                if (newClientForm.email) {
                  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                  if (!emailRegex.test(newClientForm.email)) {
                    toast({ title: "Email inválido", description: "Por favor introduce un correo válido o déjalo vacío.", variant: "destructive" });
                    return;
                  }
                }

                if (firestore) {
                  const { isUnique, conflictField } = await validateClientUniqueness(firestore, newClientForm.email, newClientForm.phone);
                  if (!isUnique) {
                    toast({
                      title: "Cliente duplicado",
                      description: `Ya existe un cliente con este ${conflictField === 'email' ? 'correo electrónico' : 'número de teléfono'}. Por favor busca o selecciona el cliente existente.`,
                      variant: "destructive"
                    });
                    return;
                  }
                }

                const newId = `cli_${Date.now()}`;
                const unifiedName = `${newClientForm.firstName} ${newClientForm.lastName}`.trim();
                
                try {
                  await setDoc(doc(firestore, 'clients', newId), {
                    id: newId,
                    firstName: newClientForm.firstName,
                    lastName: newClientForm.lastName,
                    clientName: unifiedName,
                    company: newClientForm.company,
                    clientEmail: newClientForm.email || '',
                    clientPhone: newClientForm.phone || '',
                    onboardingType: 'direct',
                    isArchived: false,
                    portalAccessActive: false,
                    source: 'quick_add',
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                  });
                  
                  toast({ title: "Cliente Creado exitosamente" });
                  setIsCreateClientOpen(false);
                  setNewClientForm({ firstName: '', lastName: '', email: '', phone: '', company: '' });
                } catch (error) {
                  console.error("Error creating client:", error);
                  toast({ title: "Error al crear cliente", variant: "destructive" });
                }
              }}
              className="bg-primary hover:bg-primary/90 shadow-md"
            >
              Crear Cliente
            </Button>
          </DialogFooter>
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

              {(() => {
                const activePlan = selectedLead?.activePlan;
                if (!activePlan) return null;
                const tDay = new Date().getDate();
                const planStartDay = activePlan.planStartDay || 30;
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
            <AlertDialogAction
              onClick={handleCancelPlan}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Confirmar Cancelación
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </div>
  );
}
