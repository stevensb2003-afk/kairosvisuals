'use client';
import React, { useRef, useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { FileText, Printer, Download, Share2, Loader2 } from "lucide-react";
import { CartaTemplate } from '@/components/invoicing/DocumentTemplates';
import { Quotation } from '@/lib/types';

interface QuotationPreviewModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  previewQuotation: Quotation | null;
  handlePrint: () => void;
  handleDownload: () => void;
  isProcessing: boolean;
  handleSharePdf: () => void;
  handleShareWhatsApp: () => void;
  selectedLead: any;
  leadUser: any;
  companySettings: any;
}

const TEMPLATE_W = 800;
const TEMPLATE_MIN_H = 1131;

export function QuotationPreviewModal({
  isOpen, onOpenChange, previewQuotation,
  handlePrint, handleDownload, isProcessing,
  handleSharePdf, handleShareWhatsApp,
  selectedLead, leadUser, companySettings,
}: QuotationPreviewModalProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    if (!isOpen) return;

    const update = () => {
      const vw = window.innerWidth;
      // Modal es full-width en mobile, max-w-[850px] en sm+
      const modalContentW = Math.min(vw, 850);
      // Descontar padding interno del DialogContent + scroll gutter
      const innerPadding = vw < 640 ? 48 : 80;
      const available = modalContentW - innerPadding;
      setScale(available / TEMPLATE_W);
    };

    // Esperar a que el Dialog termine su animación de entrada
    const timer = setTimeout(update, 200);
    window.addEventListener('resize', update);
    return () => { clearTimeout(timer); window.removeEventListener('resize', update); };
  }, [isOpen]);

  const clientInfo = {
    clientName: selectedLead?.clientName || `${leadUser?.firstName || ''} ${leadUser?.lastName || ''}`.trim(),
    company: selectedLead?.company || leadUser?.company,
    contactEmail: selectedLead?.clientEmail || leadUser?.email,
    contactPhone: selectedLead?.clientPhone || leadUser?.phone,
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="w-full max-w-full sm:max-w-[850px] h-[95dvh] sm:h-[90vh] flex flex-col p-0 overflow-hidden bg-[#09090b] border border-zinc-800/50 sm:rounded-3xl shadow-[0_0_50px_-12px_rgba(0,0,0,0.5)] animate-in fade-in zoom-in-95 duration-300">

        {/* Header */}
        <div className="flex items-center justify-between p-3 sm:p-4 bg-zinc-900/50 backdrop-blur-xl border-b border-zinc-800/50 z-10 shrink-0">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <div className="p-1.5 sm:p-2 bg-primary/20 rounded-xl text-primary border border-primary/20 shrink-0">
              <FileText className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0">
              <p className="text-[9px] sm:text-[10px] font-black uppercase tracking-[0.2em] text-primary/80">Visor de Documentos</p>
              <DialogTitle className="text-xs sm:text-sm font-bold text-zinc-100 line-clamp-1">
                {previewQuotation?.title || 'Vista Previa'}
              </DialogTitle>
            </div>
          </div>

          {/* Desktop actions */}
          <div className="hidden sm:flex items-center gap-2">
            <Button variant="outline" size="sm" className="h-9 px-3 text-xs font-bold gap-2 bg-zinc-800/50 border-zinc-700/50 text-zinc-300 hover:bg-zinc-800 hover:text-white transition-all" onClick={handlePrint}>
              <Printer className="w-3.5 h-3.5" /> Imprimir
            </Button>
            <Button variant="outline" size="sm" className="h-9 px-3 text-xs font-bold gap-2 bg-zinc-800/50 border-zinc-700/50 text-zinc-300 hover:bg-zinc-800 hover:text-white transition-all" onClick={handleDownload} disabled={isProcessing}>
              {isProcessing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />} Descargar PDF
            </Button>
            <Button size="sm" className="h-9 px-5 text-xs font-black gap-2 bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg active:scale-95 transition-all" onClick={handleSharePdf} disabled={isProcessing}>
              {isProcessing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Share2 className="w-3.5 h-3.5" />} Compartir PDF
            </Button>
            <Button size="sm" className="h-9 px-4 text-xs font-black gap-2 bg-[#25D366] hover:bg-[#20bd5a] text-white shadow-lg shadow-emerald-500/20 active:scale-95 transition-all" onClick={handleShareWhatsApp}>
              <Share2 className="w-3.5 h-3.5" /> WhatsApp
            </Button>
          </div>

          {/* Mobile: compact icons only */}
          <div className="flex sm:hidden items-center gap-1.5">
            <Button variant="outline" size="icon" className="h-8 w-8 bg-zinc-800/50 border-zinc-700/50 text-zinc-300" onClick={handleDownload} disabled={isProcessing}>
              {isProcessing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
            </Button>
            <Button size="sm" className="h-8 px-3 text-xs font-black gap-1.5 bg-[#25D366] text-white" onClick={handleShareWhatsApp}>
              <Share2 className="w-3.5 h-3.5" /> WA
            </Button>
            <Button size="sm" className="h-8 px-3 text-xs font-black gap-1.5 bg-primary text-primary-foreground" onClick={handleSharePdf} disabled={isProcessing}>
              {isProcessing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Share2 className="w-3.5 h-3.5" />} PDF
            </Button>
          </div>
        </div>

        {/* Scaled document viewer */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto overflow-x-hidden p-4 sm:p-8 bg-[#09090b] bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-zinc-900/20 via-transparent to-transparent">
          {/* Wrapper que colapsa el layout al tamaño visual escalado */}
          <div
            className="mx-auto"
            style={{
              width: `${TEMPLATE_W * scale}px`,
              height: `${TEMPLATE_MIN_H * scale + 32}px`,
              position: 'relative',
            }}
          >
            {/* Template a 800px escalado desde top-left */}
            <div
              style={{
                width: `${TEMPLATE_W}px`,
                transform: `scale(${scale})`,
                transformOrigin: 'top left',
                position: 'absolute',
                top: 0,
                left: 0,
              }}
            >
              <div className="shadow-[0_20px_50px_rgba(0,0,0,0.5)] bg-white rounded-sm overflow-hidden border border-zinc-800/30">
                <CartaTemplate
                  invoice={previewQuotation}
                  client={clientInfo}
                  settings={companySettings}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Mobile bottom action bar */}
        <div className="flex sm:hidden items-center gap-2 p-3 bg-zinc-900/80 border-t border-zinc-800/50 shrink-0">
          <Button variant="outline" className="flex-1 h-10 text-xs font-bold gap-2 bg-zinc-800/50 border-zinc-700/50 text-zinc-300 hover:bg-zinc-800" onClick={handlePrint}>
            <Printer className="w-3.5 h-3.5" /> Imprimir
          </Button>
          <Button className="flex-1 h-10 text-xs font-black gap-2 bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg" onClick={handleSharePdf} disabled={isProcessing}>
            {isProcessing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Share2 className="w-3.5 h-3.5" />} Compartir
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
