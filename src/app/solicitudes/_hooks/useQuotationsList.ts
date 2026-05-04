import { useState, useEffect } from 'react';
import { useFirestore } from '@/firebase';
import { collection, getDocs, deleteDoc, doc, updateDoc, getDoc } from 'firebase/firestore';
import { acceptQuotationClient } from '@/lib/billing_utils';
import { useToast } from "@/hooks/use-toast";
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { Quotation } from '@/lib/types';

export function useQuotationsList() {
  const firestore = useFirestore();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(true);
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [companySettings, setCompanySettings] = useState<any>(null);
  
  const [isExporting, setIsExporting] = useState(false);
  const [isAccepting, setIsAccepting] = useState<string | null>(null);

  useEffect(() => {
    async function fetchQuotations() {
      if (!firestore) return;
      
      try {
        setLoading(true);
        
        // Step 1: Fetch all clients
        const clientsSnapshot = await getDocs(collection(firestore, 'clients'));
        const allQuotations: Quotation[] = [];
        const clientsMap = new Map();
        
        clientsSnapshot.docs.forEach(doc => {
          clientsMap.set(doc.id, { id: doc.id, ...doc.data() });
        });
        
        // Step 2: Fetch quotations for each client
        await Promise.all(clientsSnapshot.docs.map(async (clientDoc) => {
          const quotesSnapshot = await getDocs(collection(firestore, 'clients', clientDoc.id, 'quotations'));
          quotesSnapshot.docs.forEach(qDoc => {
            const data = qDoc.data();
            allQuotations.push({
              id: qDoc.id,
              clientId: clientDoc.id,
              clientCompany: clientDoc.data().company || null,
              clientData: clientsMap.get(clientDoc.id),
              ...data
            } as any);
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

  const handleShare = async (quotation: any, elementId: string = 'print-area-preview') => {
    if (!quotation) return;
    setIsExporting(true);
    try {
      const qNum = quotation.quotationNumber || quotation.id;
      const { pdfBlob, fileName } = await generatePdfBlob(elementId, qNum);

      if (navigator.share && navigator.canShare) {
        const file = new File([pdfBlob], fileName, { type: 'application/pdf' });
        if (navigator.canShare({ files: [file] })) {
          await navigator.share({
            title: `Cotizacion ${quotation.title}`,
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

  const handleDownload = async (quotation: any, elementId: string = 'print-area-preview') => {
    if (!quotation) return;
    setIsExporting(true);
    try {
      const qNum = quotation.quotationNumber || quotation.id;
      const { pdfBlob, fileName } = await generatePdfBlob(elementId, qNum);

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
      toast({ title: 'Error al descargar', variant: 'destructive' });
    } finally {
      setIsExporting(false);
    }
  };

  return {
    loading,
    quotations: filteredQuotations,
    searchTerm,
    setSearchTerm,
    statusFilter,
    setStatusFilter,
    companySettings,
    isExporting,
    isAccepting,
    handleDelete,
    handlePublish,
    handleAccept,
    handleShare,
    handleDownload
  };
}
