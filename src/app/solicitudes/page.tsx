'use client';

import React, { useState, useEffect } from 'react';
import Link from "next/link";
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  FilePlus2, Search, Filter, MoreHorizontal, Edit, Trash2, 
  FileText, CheckCircle2, Clock, AlertCircle, Loader2,
  ArrowRight, Check, Share2, X, Download, Printer, Receipt,
  User, Mail, Phone, Building2
} from "lucide-react";
import { useFirestore } from '@/firebase';
import { collection, query, getDocs, deleteDoc, doc, updateDoc, getDoc } from 'firebase/firestore';
import { acceptQuotationClient } from '@/lib/billing_utils';
import { formatCurrency, cn } from '@/lib/utils';
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from "@/components/ui/table";
import { 
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { 
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger 
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { CartaTemplate } from '@/components/invoicing/DocumentTemplates';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { Quotation } from '@/lib/types';


export default function SolicitudesPage() {
  const router = useRouter();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [companySettings, setCompanySettings] = useState<any>(null);
  const [previewQuotation, setPreviewQuotation] = useState<Quotation | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isAccepting, setIsAccepting] = useState<string | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  const [selectedClientDetails, setSelectedClientDetails] = useState<any>(null);
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Safety fix for "Ghost Overlay" issue
  useEffect(() => {
    if (!isPreviewOpen && isMounted) {
      // If the dialog is closed, ensure the body is not stuck in pointer-events: none
      const timer = setTimeout(() => {
        if (typeof document !== 'undefined') {
          if (document.body.style.pointerEvents === 'none') {
            document.body.style.pointerEvents = '';
            document.body.style.overflow = '';
          }
        }
      }, 400); // Wait for Radix animations to finish
      return () => clearTimeout(timer);
    }
  }, [isPreviewOpen, isMounted]);

  useEffect(() => {
    async function fetchQuotations() {
      if (!firestore) return;
      
      try {
        setLoading(true);
        
        // Step 1: Fetch all clients
        const clientsSnapshot = await getDocs(collection(firestore, 'clients'));
        const allQuotations: Quotation[] = [];
        
        // Step 2: Fetch quotations for each client
        // This avoids collectionGroup index issues and handles "missing collection" scenarios
        await Promise.all(clientsSnapshot.docs.map(async (clientDoc) => {
          const quotesSnapshot = await getDocs(collection(firestore, 'clients', clientDoc.id, 'quotations'));
          quotesSnapshot.docs.forEach(qDoc => {
            const data = qDoc.data();
            allQuotations.push({
              id: qDoc.id,
              clientId: clientDoc.id,
              ...data
            } as Quotation);
          });
        }));
        
        // Sort in memory (Newest first)
        allQuotations.sort((a, b) => {
          const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return dateB - dateA;
        });

        setQuotations(allQuotations);
      } catch (error) {
        console.error("Error fetching quotations:", error);
        toast({
          title: "Error",
          description: "No se pudieron cargar las propuestas. Verifica tu conexión.",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    }

    fetchQuotations();

    async function loadSettings() {
      if (!firestore) return;
      const settingsSnap = await getDoc(doc(firestore, 'settings', 'general'));
      if (settingsSnap.exists()) {
        setCompanySettings(settingsSnap.data());
      }
    }
    loadSettings();
  }, [firestore, toast]);

  const filteredQuotations = quotations.filter(q => {
    const matchesSearch = 
      q.clientName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      q.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (q.quotationNumber && String(q.quotationNumber).includes(searchTerm));
    
    const matchesStatus = statusFilter === 'all' || q.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'draft':
        return <Badge variant="secondary" className="bg-slate-100 text-slate-700 border-slate-200 uppercase text-[10px] font-bold">Borrador</Badge>;
      case 'published':
        return <Badge variant="outline" className="text-blue-600 border-blue-200 bg-blue-50 uppercase text-[10px] font-bold tracking-wider">Enviada</Badge>;
      case 'accepted':
        return <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50 uppercase text-[10px] font-bold tracking-wider">Aceptada</Badge>;
      case 'rejected':
        return <Badge variant="destructive" className="uppercase text-[10px] font-bold tracking-wider">Rechazada</Badge>;
      case 'superseded':
        return <Badge variant="outline" className="text-amber-600 border-amber-200 bg-amber-50 uppercase text-[10px] font-bold tracking-wider">Superada</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const handleDelete = async (quotation: Quotation) => {
    if (!firestore || !confirm("¿Estás seguro de que deseas eliminar esta propuesta?")) return;
    
    try {
      await deleteDoc(doc(firestore, 'clients', quotation.clientId, 'quotations', quotation.id));
      setQuotations(prev => prev.filter(q => q.id !== quotation.id));
      toast({ title: "Eliminado", description: "La propuesta ha sido eliminada." });
    } catch (e) {
      console.error(e);
      toast({ title: "Error", description: "No se pudo eliminar la propuesta.", variant: "destructive" });
    }
  };

  const handlePublish = async (quotation: Quotation) => {
    if (!firestore || !confirm("¿Deseas publicar esta propuesta y marcarla como enviada?")) return;
    
    try {
      await updateDoc(doc(firestore, 'clients', quotation.clientId, 'quotations', quotation.id), {
        status: 'published',
        updatedAt: new Date().toISOString()
      });
      
      setQuotations(prev => prev.map(q => 
        q.id === quotation.id ? { ...q, status: 'published' } : q
      ));
      
      toast({ title: "Publicada", description: "La propuesta ahora está marcada como enviada." });
    } catch (e) {
      console.error(e);
      toast({ title: "Error", description: "No se pudo publicar la propuesta.", variant: "destructive" });
    }
  };

  const handleAccept = async (quotation: Quotation) => {
    if (!firestore || !confirm("¿Confirmas la aceptación de esta propuesta y la generación de la factura correspondiente?")) return;
    
    setIsAccepting(quotation.id || null);
    try {
      const invoiceId = await acceptQuotationClient(
        firestore, 
        quotation, 
        { id: quotation.clientId, clientName: quotation.clientName }, 
        quotation.isPlanUpdate
      );
      
      setQuotations(prev => prev.map(q => 
        q.id === quotation.id ? { ...q, status: 'accepted' } : q
      ));
      
      if (invoiceId) {
        toast({ title: "¡Trato Cerrado!", description: `Propuesta aceptada. Factura borrador generada con éxito.` });
      } else {
        toast({ title: "¡Actualización Confirmada!", description: "El plan ha sido actualizado correctamente. El cobro aplicará en el próximo ciclo." });
      }
    } catch (e: any) {
      console.error(e);
      toast({ title: "Error", description: e.message || "No se pudo aceptar la propuesta ni generar la factura.", variant: "destructive" });
    } finally {
      setIsAccepting(null);
    }
  };

  const handleShare = async (quotation: any) => {
    if (!quotation) return;
    setIsExporting(true);
    try {
      const element = document.getElementById(`print-area-preview`);
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
      const qNum = quotation.quotationNumber || quotation.id;
      const fileName = `Cotizacion_${qNum}.pdf`;

      if (navigator.share && navigator.canShare) {
        const file = new File([pdfBlob], fileName, { type: 'application/pdf' });
        if (navigator.canShare({ files: [file] })) {
          await navigator.share({
            title: `Cotizacion ${quotation.title}`,
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
      toast({ title: 'Cotización descargada' });

    } catch (err) {
      console.error(err);
      toast({ title: 'Error al exportar', variant: 'destructive' });
    } finally {
      setIsExporting(false);
    }
  };

  const handleClientClick = async (clientId: string) => {
    try {
      setLoading(true);
      const clientDoc = await getDoc(doc(firestore, 'clients', clientId));
      if (clientDoc.exists()) {
        setSelectedClientDetails({ id: clientDoc.id, ...clientDoc.data() });
        setIsClientModalOpen(true);
      } else {
        toast({ title: "Error", description: "No se encontró la información del cliente.", variant: "destructive" });
      }
    } catch (e) {
      console.error(e);
      toast({ title: "Error", description: "No se pudo cargar la información del cliente.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-4xl font-black font-headline tracking-tight text-primary">Propuestas</h1>
          <p className="text-muted-foreground mt-1">Gestión centralizada de cotizaciones y presentaciones comerciales.</p>
        </div>
        <Link href="/solicitudes/create">
          <Button className="rounded-full px-6 shadow-lg shadow-primary/20 hover:scale-105 transition-all font-bold">
            <FilePlus2 className="mr-2 w-5 h-5"/> Nueva Propuesta
          </Button>
        </Link>
      </div>

      <div className="flex flex-col md:flex-row gap-4 items-center mb-2">
        <div className="relative flex-1 w-full max-w-xl group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground transition-colors group-focus-within:text-primary" />
          <Input 
            placeholder="Buscar por cliente o título de propuesta..." 
            className="pl-12 h-12 bg-slate-900/50 border-white/5 focus:border-primary/50 transition-all rounded-2xl placeholder:text-muted-foreground/40 shadow-sm text-base text-white"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2 bg-muted/20 p-1.5 rounded-2xl border border-border/40 backdrop-blur-sm">
          <div className="px-3 py-1 flex items-center gap-2 border-r border-border/40 sm:flex hidden">
            <Filter className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="text-[10px] uppercase font-black tracking-widest text-muted-foreground/70">Estado</span>
          </div>
          <div className="flex gap-1 overflow-x-auto no-scrollbar max-w-[calc(100vw-4rem)]">
            {['all', 'draft', 'published', 'accepted'].map((s) => (
              <Button
                key={s}
                variant={statusFilter === s ? "default" : "ghost"}
                size="sm"
                className={cn(
                  "rounded-xl text-[10px] font-bold uppercase tracking-wider h-9 px-4 transition-all whitespace-nowrap",
                  statusFilter === s 
                    ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20 scale-105" 
                    : "text-muted-foreground hover:bg-white/10 hover:text-white"
                )}
                onClick={() => setStatusFilter(s)}
              >
                {s === 'all' ? 'Todos' : s === 'draft' ? 'Borradores' : s === 'published' ? 'Enviadas' : 'Aceptadas'}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {loading ? (
        <Card className="border-none bg-transparent shadow-none">
          <CardContent className="flex flex-col items-center justify-center h-80">
            <Loader2 className="w-10 h-10 animate-spin text-primary/40 mb-4" />
            <p className="text-muted-foreground animate-pulse font-medium">Cargando propuestas comerciales...</p>
          </CardContent>
        </Card>
      ) : filteredQuotations.length === 0 ? (
        <Card className="border-2 border-dashed bg-muted/10">
          <CardContent className="flex flex-col items-center justify-center h-80 text-center p-8">
            <div className="w-20 h-20 bg-primary/5 rounded-full flex items-center justify-center mb-6">
              <FileText className="w-10 h-10 text-primary/20" />
            </div>
            <h3 className="text-xl font-bold font-headline mb-2">No se encontraron propuestas</h3>
            <p className="max-w-[400px] text-muted-foreground mb-8">
              {searchTerm || statusFilter !== 'all' 
                ? "No hay resultados para los filtros aplicados. Intenta con otros términos." 
                : "Aún no has creado ninguna propuesta comercial. Comienza una ahora para formalizar tus servicios."}
            </p>
            {!(searchTerm || statusFilter !== 'all') && (
              <Link href="/solicitudes/create">
                <Button variant="outline" className="rounded-full px-8 border-primary/20 text-primary hover:bg-primary/5 font-bold">
                  <Plus className="mr-2 w-4 h-4" /> Crear mi primera propuesta
                </Button>
              </Link>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card className="overflow-hidden border-border/50 shadow-sm rounded-2xl">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/30">
                <TableRow className="hover:bg-transparent border-b-border/50">
                  <TableHead className="w-[100px] font-bold text-xs uppercase tracking-wider pl-6"># Cotiz.</TableHead>
                  <TableHead className="w-[120px] font-bold text-xs uppercase tracking-wider">Fecha</TableHead>
                  <TableHead className="w-[120px] font-bold text-xs uppercase tracking-wider">Vencimiento</TableHead>
                  <TableHead className="font-bold text-xs uppercase tracking-wider">Cliente</TableHead>
                  <TableHead className="font-bold text-xs uppercase tracking-wider">Título de Propuesta</TableHead>
                  <TableHead className="font-bold text-xs uppercase tracking-wider">Total</TableHead>
                  <TableHead className="font-bold text-xs uppercase tracking-wider">Estado</TableHead>
                  <TableHead className="text-right font-bold text-xs uppercase tracking-wider pr-6">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredQuotations.map((q) => (
                  <TableRow key={q.id} className="group hover:bg-primary/[0.01] border-b-border/40 transition-colors">
                    <TableCell className="pl-6 whitespace-nowrap min-w-[100px]">
                      <span className="font-bold text-primary text-xs">
                        {q.quotationNumber ? String(q.quotationNumber).padStart(4, '0') : '—'}
                      </span>
                    </TableCell>
                    <TableCell className="font-medium text-muted-foreground whitespace-nowrap">
                      {new Date(q.createdAt).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })}
                    </TableCell>
                    <TableCell className="font-medium text-muted-foreground whitespace-nowrap">
                      {q.validUntil ? new Date(q.validUntil).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' }) : 'N/A'}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col items-start">
                        <button 
                          onClick={() => handleClientClick(q.clientId)}
                          className="font-bold text-foreground leading-none mb-1 text-left hover:text-primary hover:underline transition-colors focus:outline-none"
                        >
                          {q.clientName || 'Cliente sin nombre'}
                        </button>
                        <span className="text-[11px] text-muted-foreground">{q.clientEmail}</span>
                      </div>
                    </TableCell>
                    <TableCell className="font-semibold text-slate-700">
                      <div className="flex items-center gap-2">
                        <span>{q.title || 'Propuesta sin título'}</span>
                        {q.version > 1 && <Badge variant="outline" className="text-[10px] py-0 h-4 bg-muted/50 border-muted-foreground/20">v{q.version}</Badge>}
                      </div>
                    </TableCell>
                    <TableCell className="font-black text-primary">
                      {formatCurrency(q.totalAmount)}
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(q.status)}
                    </TableCell>
                    <TableCell className="text-right pr-4">
                      <div className="flex justify-end gap-1 transition-all">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className={cn("h-9 w-9 rounded-full", q.status === 'accepted' ? "opacity-50 cursor-not-allowed" : "hover:text-primary hover:bg-primary/10")}
                          onClick={() => q.status !== 'accepted' && router.push(`/solicitudes/create?quotationId=${q.id}&clientId=${q.clientId}`)}
                          disabled={q.status === 'accepted'}
                          title={q.status === 'accepted' ? 'No se puede editar una propuesta aceptada' : 'Editar Propuesta'}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-56 p-2 rounded-xl border-border/50">
                            <DropdownMenuItem 
                              className="cursor-pointer rounded-lg gap-2 font-medium"
                              onClick={() => {
                                setPreviewQuotation(q);
                                setIsPreviewOpen(true);
                              }}
                            >
                              <FileText className="w-4 h-4 text-muted-foreground" /> Ver Detalles
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              className="text-destructive focus:text-destructive cursor-pointer rounded-lg gap-2 font-medium"
                              onClick={() => handleDelete(q)}
                            >
                              <Trash2 className="w-4 h-4" /> Eliminar Propuesta
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                        {q.status === 'draft' && (
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-9 w-9 rounded-full transition-all shadow-sm text-emerald-600 hover:bg-emerald-50 bg-emerald-50/30 border border-emerald-100 hover:scale-110" 
                            onClick={() => handlePublish(q)}
                            title="Confirmar y Publicar"
                          >
                            <Check className="w-4 h-4" />
                          </Button>
                        )}
                        {q.status === 'published' && (
                          <Button 
                            variant="default" 
                            size="sm" 
                            className="h-9 rounded-full transition-all shadow-md bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs" 
                            onClick={() => handleAccept(q)}
                            disabled={isAccepting === q.id}
                            title="Confirmar y Facturar"
                          >
                            {isAccepting === q.id ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <CheckCircle2 className="w-4 h-4 mr-1" />}
                            Facturar
                          </Button>
                        )}
                        {q.status === 'accepted' && (
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-9 rounded-full transition-all text-muted-foreground hover:text-primary hover:bg-primary/10 text-xs font-semibold" 
                            onClick={() => router.push('/invoicing')}
                            title="Ver en Facturación"
                          >
                            <Receipt className="w-4 h-4 mr-1" />
                            Facturas
                          </Button>
                        )}
                        {['superseded', 'rejected'].includes(q.status) && (
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-9 w-9 rounded-full transition-all shadow-sm text-primary hover:bg-primary/10" 
                            onClick={() => router.push(`/solicitudes/create?quotationId=${q.id}&clientId=${q.clientId}`)}
                            title="Ver Propuesta"
                          >
                            <ArrowRight className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>
      )}

      {/* Preview Modal */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-[850px] max-h-[95vh] p-0 overflow-hidden rounded-2xl border-none shadow-2xl bg-slate-950 select-none">
          {previewQuotation && (
            <div className="flex flex-col h-full bg-slate-950 text-white selection:bg-primary/30">
              <div className="flex justify-between items-center p-4 bg-slate-900 border-b border-white/10 sticky top-0 z-50 backdrop-blur-md">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center border border-primary/40 shadow-inner">
                    <FileText className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <DialogTitle className="font-bold text-lg leading-tight text-white tracking-tight">
                      {previewQuotation.title}
                    </DialogTitle>
                    <DialogDescription className="text-xs text-muted-foreground font-medium">
                      {previewQuotation.clientName} • {formatCurrency(previewQuotation.totalAmount)}
                    </DialogDescription>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="rounded-full text-muted-foreground hover:text-white hover:bg-white/10 h-9 w-9"
                    onClick={() => handleShare(previewQuotation)}
                    disabled={isExporting}
                    title="Compartir"
                  >
                    {isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Share2 className="w-4 h-4" />}
                  </Button>
                  <Button 
                    variant="default" 
                    size="icon" 
                    className="rounded-full shadow-lg shadow-primary/10 transition-transform active:scale-95 h-9 w-9"
                    onClick={() => handleShare(previewQuotation)}
                    disabled={isExporting}
                    title="Descargar PDF"
                  >
                    <Download className="w-4 h-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="rounded-full w-8 h-8 ml-2 hover:bg-white/10 hover:text-white" 
                    onClick={() => setIsPreviewOpen(false)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              
              <ScrollArea className="flex-1 p-4 sm:p-8 bg-black/40">
                <div id="print-area-preview" className="shadow-2xl mx-auto bg-white overflow-hidden origin-top scale-[0.7] sm:scale-100 mb-20 rounded-sm" style={{ width: '800px' }}>
                  <CartaTemplate 
                    invoice={previewQuotation} 
                    client={{ 
                      clientName: previewQuotation.clientName || 'Cliente', 
                      contactEmail: previewQuotation.clientEmail || '' 
                    }} 
                    settings={companySettings} 
                  />
                </div>
              </ScrollArea>

              <div className="p-4 bg-slate-900 border-t border-white/5 flex justify-between items-center sm:hidden">
                <Button 
                  variant="outline" 
                  className="w-full rounded-full gap-2 border-white/10 hover:bg-white/5 text-white"
                  onClick={() => handleShare(previewQuotation)}
                  disabled={isExporting}
                >
                  <Share2 className="w-4 h-4" />
                  Compartir Propuesta
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Client Quick View Modal */}
      <Dialog open={isClientModalOpen} onOpenChange={setIsClientModalOpen}>
        <DialogContent className="max-w-md rounded-2xl p-6">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <User className="w-5 h-5 text-primary" />
              Detalles del Cliente
            </DialogTitle>
          </DialogHeader>
          
          {selectedClientDetails ? (
            <div className="space-y-4 mt-4">
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Nombre completo</p>
                <p className="font-semibold text-lg">{selectedClientDetails.clientName || 'N/A'}</p>
              </div>
              
              <div className="grid grid-cols-1 gap-4">
                <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-xl">
                  <div className="bg-primary/10 p-2 rounded-lg">
                    <Mail className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Correo electrónico</p>
                    <p className="font-medium text-sm break-all">{selectedClientDetails.clientEmail || 'N/A'}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-xl">
                  <div className="bg-primary/10 p-2 rounded-lg">
                    <Phone className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Teléfono</p>
                    <p className="font-medium text-sm">{selectedClientDetails.clientPhone || 'N/A'}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-xl">
                  <div className="bg-primary/10 p-2 rounded-lg">
                    <Building2 className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Empresa</p>
                    <p className="font-medium text-sm">{selectedClientDetails.company || 'N/A'}</p>
                  </div>
                </div>
              </div>

              <div className="pt-4 mt-6 border-t border-border/50">
                <Button 
                  className="w-full rounded-full font-bold shadow-md shadow-primary/20"
                  onClick={() => router.push(`/clients/${selectedClientDetails.id}`)}
                >
                  Ver Perfil Completo
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex justify-center p-8">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

const Plus = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M5 12h14"/><path d="M12 5v14"/></svg>
);
