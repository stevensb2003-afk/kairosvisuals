import { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Download, Share, Loader2, Printer } from 'lucide-react';
import { formatCurrency, cn } from '@/lib/utils';
import { CartaTemplate, POSTemplate } from '@/components/invoicing/DocumentTemplates';
import type { Client, CompanySettings } from '@/app/solicitudes/_hooks/useQuoteBuilder';

interface QuotePreviewDialogProps {
  isOpen: boolean;
  onClose: () => void;
  isExporting: boolean;
  isSaving: boolean;
  clientData: Client | null;
  companySettings: CompanySettings;
  details: { title: string; validityDays: number; notes: string; startDate: string };
  itemCalculations: any[];
  totalAmount: number;
  subtotalAmount: number;
  ivaAmount: number;
  totalDiscounts: number;
  globalDiscountAmount: number;
  quotationNumber: string | null;
  isReadOnly: boolean;
  onDownload: (type: 'carta' | 'pos') => void;
  onShare: (type: 'carta' | 'pos') => void;
  onPublish: () => void;
}

export function QuotePreviewDialog({
  isOpen, onClose, isExporting, isSaving,
  clientData, companySettings, details, itemCalculations,
  totalAmount, subtotalAmount, ivaAmount, totalDiscounts, globalDiscountAmount,
  quotationNumber, isReadOnly,
  onDownload, onShare, onPublish,
}: QuotePreviewDialogProps) {
  const invoiceData = {
    title: details.title,
    validityDays: details.validityDays,
    notes: details.notes,
    startDate: details.startDate,
    issueDate: new Date().toISOString(),
    quotationNumber,
    items: itemCalculations,
    totalAmount,
    subtotalAmount,
    taxAmount: ivaAmount,
    totalDiscount: totalDiscounts + globalDiscountAmount,
    applyIva: itemCalculations.some(i => (i.ivaRate ?? 0) > 0),
  };

  const clientForTemplate = clientData
    ? { ...clientData, clientName: clientData.name, contactEmail: clientData.contactEmail }
    : {};

  const [scale, setScale] = useState(1);
  const [docHeight, setDocHeight] = useState(1056); // Default US Letter (Carta) height at 96dpi
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const updateDimensions = () => {
      // 1. Calculate scale based on container width
      if (containerRef.current) {
        const containerWidth = containerRef.current.offsetWidth;
        const padding = window.innerWidth < 640 ? 32 : 64; // Responsive padding
        const availableWidth = containerWidth - padding;
        
        if (availableWidth > 0 && availableWidth < 816) {
          setScale(availableWidth / 816);
        } else {
          setScale(1);
        }
      }

      // 2. Measure actual document height
      if (contentRef.current) {
        const height = contentRef.current.scrollHeight;
        if (height > 0) {
          setDocHeight(height);
        }
      }
    };

    // Initial calculation with slight delay to ensure rendering
    const timer = setTimeout(updateDimensions, 100);

    const observer = new ResizeObserver(updateDimensions);
    if (containerRef.current) observer.observe(containerRef.current);
    if (contentRef.current) observer.observe(contentRef.current);

    window.addEventListener('resize', updateDimensions);
    
    return () => {
      clearTimeout(timer);
      observer.disconnect();
      window.removeEventListener('resize', updateDimensions);
    };
  }, [isOpen, itemCalculations]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="flex flex-col w-full max-w-[95vw] sm:max-w-4xl max-h-[95dvh] p-0 gap-0 overflow-hidden">
        {/* Header */}
        <DialogHeader className="px-4 sm:px-6 py-3 border-b shrink-0 bg-background z-10">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <DialogTitle className="text-sm sm:text-base font-bold">
              Vista Previa — <span className="text-primary">{clientData?.name || 'Cliente'}</span>
            </DialogTitle>
            <div className="flex items-center gap-1.5 flex-wrap">
              <Button
                id="btn-download-carta"
                variant="outline"
                size="sm"
                className="h-8 text-xs gap-1.5 font-medium"
                onClick={() => onDownload('carta')}
                disabled={isExporting}
              >
                {isExporting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
                PDF Carta
              </Button>
              <Button
                id="btn-share-carta"
                variant="outline"
                size="sm"
                className="h-8 text-xs gap-1.5 font-medium"
                onClick={() => onShare('carta')}
                disabled={isExporting}
              >
                <Share className="h-3.5 w-3.5" />
                <span className="hidden xs:inline">Compartir</span>
              </Button>
              {!isReadOnly && (
                <Button
                  id="btn-publish-from-preview"
                  size="sm"
                  className="h-8 text-xs gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90 font-bold shadow-sm"
                  onClick={onPublish}
                  disabled={isSaving}
                >
                  {isSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Printer className="h-3.5 w-3.5" />}
                  Publicar
                </Button>
              )}
            </div>
          </div>

          {/* Total summary bar */}
          <div className="flex items-center justify-end gap-4 pt-1.5 text-[11px] sm:text-xs text-muted-foreground border-t mt-2">
            <span className="flex gap-1">Subtotal: <strong className="text-foreground">{formatCurrency(subtotalAmount)}</strong></span>
            {ivaAmount > 0 && <span className="flex gap-1">IVA: <strong className="text-foreground">{formatCurrency(ivaAmount)}</strong></span>}
            <span className="text-sm sm:text-base font-black text-primary ml-2">{formatCurrency(totalAmount)}</span>
          </div>
        </DialogHeader>

        {/* Preview area with dynamic scaling */}
        <div ref={containerRef} className="flex-1 bg-muted/30 overflow-hidden relative">
          <ScrollArea className="h-full">
            <div className={cn(
              "flex justify-center min-h-full transition-all duration-300",
              scale < 1 ? "items-start pt-4 pb-8 sm:pt-8" : "items-start p-4 sm:p-8"
            )}>
              {/* Outer Wrapper: Defines the exact layout footprint of the scaled document */}
              <div 
                style={{ 
                  width: `${816 * scale}px`,
                  height: `${docHeight * scale}px`,
                  transition: 'width 0.2s ease-out, height 0.2s ease-out'
                }}
                className="relative shrink-0"
              >
                {/* Inner Wrapper: Applies the visual scale transform */}
                <div 
                  style={{ 
                    transform: `scale(${scale})`, 
                    transformOrigin: 'top left',
                    width: '816px',
                    transition: 'transform 0.2s ease-out'
                  }}
                  className="absolute top-0 left-0"
                >
                  <div 
                    ref={contentRef}
                    id="print-area-carta-quotation" 
                    className="bg-white shadow-2xl shadow-black/10 ring-1 ring-black/5 rounded-sm overflow-hidden"
                  >
                    <CartaTemplate
                      invoice={invoiceData}
                      client={clientForTemplate}
                      settings={companySettings}
                    />
                  </div>
                </div>
              </div>
            </div>
          </ScrollArea>
        </div>

        {/* Hidden POS template for export */}
        <div className="fixed -left-[9999px] -top-[9999px] pointer-events-none" aria-hidden>
          <div id="print-area-pos-quotation">
            <POSTemplate
              invoice={invoiceData}
              client={clientForTemplate}
              settings={companySettings}
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
