'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FileText, Share2, Download, X, Loader2 } from "lucide-react";
import { CartaTemplate } from '@/components/invoicing/DocumentTemplates';
import { Quotation } from '@/lib/types';
import { formatCurrency } from '@/lib/utils';

const DOCUMENT_WIDTH = 800;

interface QuotationPreviewDialogProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  quotation: Quotation | null;
  companySettings: any;
  isExporting: boolean;
  onShare: (q: Quotation) => void;
  onDownload: (q: Quotation) => void;
}

export function QuotationPreviewDialog({
  isOpen,
  setIsOpen,
  quotation,
  companySettings,
  isExporting,
  onShare,
  onDownload
}: QuotationPreviewDialogProps) {
  const [pdfScale, setPdfScale] = useState(1);
  const [docNaturalHeight, setDocNaturalHeight] = useState(1130);
  const scrollRef = useRef<HTMLDivElement>(null);
  const docRef = useRef<HTMLDivElement>(null);

  // Calculate PDF scale when dialog opens or viewport resizes
  useEffect(() => {
    if (!isOpen) return;
    const recalc = () => {
      const el = scrollRef.current;
      if (!el) return;
      const padding = 32; // 16px cada lado
      const available = el.clientWidth - padding;
      setPdfScale(Math.min(1, available / DOCUMENT_WIDTH));
    };
    // Delay to allow dialog enter animation to complete
    const t = setTimeout(recalc, 200);
    window.addEventListener('resize', recalc);
    return () => { clearTimeout(t); window.removeEventListener('resize', recalc); };
  }, [isOpen]);

  // Measure rendered document height
  useEffect(() => {
    if (!docRef.current || !isOpen) return;
    const ro = new ResizeObserver(([entry]) => setDocNaturalHeight(entry.contentRect.height));
    ro.observe(docRef.current);
    return () => ro.disconnect();
  }, [isOpen, quotation]);

  // Ghost overlay safety fix
  useEffect(() => {
    if (!isOpen) {
      const t = setTimeout(() => {
        if (typeof document !== 'undefined') {
          document.body.style.pointerEvents = '';
          document.body.style.overflow = '';
        }
      }, 400);
      return () => clearTimeout(t);
    }
  }, [isOpen]);

  // Prevent body scroll while open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  if (!isOpen || !quotation) return null;

  return (
    // Backdrop
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
      aria-modal="true"
      role="dialog"
    >
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={() => setIsOpen(false)}
      />

      {/* Panel — full-screen on mobile, max-w on desktop */}
      <div className="
        relative z-10 flex flex-col bg-slate-950 text-white
        w-full h-[96dvh] rounded-t-2xl
        sm:h-[92vh] sm:w-full sm:max-w-[860px] sm:rounded-2xl
        shadow-2xl overflow-hidden
      ">
        {/* ── Header ── */}
        <div className="flex items-center gap-3 px-4 py-3 bg-slate-900 border-b border-white/10 shrink-0">
          <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center border border-primary/40 shrink-0">
            <FileText className="w-4 h-4 text-primary" />
          </div>

          {/* Title — truncated on mobile */}
          <div className="flex-1 min-w-0">
            <p className="font-bold text-sm leading-tight text-white truncate">
              {quotation.title}
            </p>
            <p className="text-xs text-muted-foreground truncate">
              {quotation.clientName} · {formatCurrency(quotation.totalAmount)}
            </p>
          </div>

          {/* Desktop actions */}
          <div className="hidden sm:flex items-center gap-2 shrink-0">
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full h-9 w-9 text-muted-foreground hover:text-white hover:bg-white/10"
              onClick={() => onShare(quotation)}
              disabled={isExporting}
              title="Compartir"
            >
              {isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Share2 className="w-4 h-4" />}
            </Button>
            <Button
              variant="default"
              size="icon"
              className="rounded-full h-9 w-9"
              onClick={() => onDownload(quotation)}
              disabled={isExporting}
              title="Descargar PDF"
            >
              <Download className="w-4 h-4" />
            </Button>
          </div>

          {/* Close — always visible */}
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full h-9 w-9 shrink-0 hover:bg-white/10 hover:text-white text-muted-foreground"
            onClick={() => setIsOpen(false)}
            aria-label="Cerrar"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* ── PDF Scroll Area ── */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden bg-black/40" ref={scrollRef}>
          <div className="p-4 sm:p-8">
            {/* Height-compensated scaling wrapper */}
            <div
              className="mx-auto overflow-hidden rounded-sm shadow-2xl"
              style={{
                width: `${DOCUMENT_WIDTH * pdfScale}px`,
                height: `${docNaturalHeight * pdfScale}px`,
              }}
            >
              <div
                ref={docRef}
                id="print-area-preview"
                className="bg-white overflow-hidden rounded-sm"
                style={{
                  width: `${DOCUMENT_WIDTH}px`,
                  transform: `scale(${pdfScale})`,
                  transformOrigin: 'top left',
                }}
              >
                <CartaTemplate
                  invoice={quotation}
                  client={{
                    clientName: (quotation as any).clientName || (quotation as any).clientData?.clientName || 'Cliente',
                    company: (quotation as any).clientCompany || (quotation as any).clientData?.company,
                    contactEmail: (quotation as any).clientEmail || (quotation as any).clientData?.clientEmail || '',
                    contactPhone: (quotation as any).clientPhone || (quotation as any).clientData?.clientPhone || ''
                  }}
                  settings={companySettings}
                />
              </div>
            </div>
          </div>
        </div>

        {/* ── Mobile Bottom Actions ── */}
        <div className="sm:hidden flex gap-3 p-4 bg-slate-900 border-t border-white/10 shrink-0">
          <Button
            variant="outline"
            className="flex-1 h-12 rounded-2xl gap-2 border-white/15 hover:bg-white/5 text-white font-semibold"
            onClick={() => onShare(quotation)}
            disabled={isExporting}
          >
            {isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Share2 className="w-4 h-4" />}
            Compartir
          </Button>
          <Button
            className="flex-1 h-12 rounded-2xl gap-2 font-semibold"
            onClick={() => onDownload(quotation)}
            disabled={isExporting}
          >
            <Download className="w-4 h-4" />
            Descargar
          </Button>
        </div>
      </div>
    </div>
  );
}
