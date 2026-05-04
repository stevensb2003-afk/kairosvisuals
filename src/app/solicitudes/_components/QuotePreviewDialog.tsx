'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Download, Share, Loader2, Printer } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="flex flex-col w-full max-w-[95vw] sm:max-w-4xl max-h-[95dvh] p-0 gap-0">
        {/* Header */}
        <DialogHeader className="px-4 sm:px-6 py-3 border-b shrink-0">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <DialogTitle className="text-sm sm:text-base font-semibold">
              Vista Previa — {clientData?.name}
            </DialogTitle>
            <div className="flex items-center gap-1.5 flex-wrap">
              <Button
                id="btn-download-carta"
                variant="outline"
                size="sm"
                className="h-8 text-xs gap-1.5"
                onClick={() => onDownload('carta')}
                disabled={isExporting}
              >
                {isExporting ? <Loader2 className="h-3 w-3 animate-spin" /> : <Download className="h-3 w-3" />}
                PDF Carta
              </Button>
              <Button
                id="btn-share-carta"
                variant="outline"
                size="sm"
                className="h-8 text-xs gap-1.5"
                onClick={() => onShare('carta')}
                disabled={isExporting}
              >
                <Share className="h-3 w-3" />
                <span className="hidden xs:inline">Compartir</span>
              </Button>
              {!isReadOnly && (
                <Button
                  id="btn-publish-from-preview"
                  size="sm"
                  className="h-8 text-xs gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90"
                  onClick={onPublish}
                  disabled={isSaving}
                >
                  {isSaving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Printer className="h-3 w-3" />}
                  Publicar
                </Button>
              )}
            </div>
          </div>

          {/* Total summary bar */}
          <div className="flex items-center justify-end gap-4 pt-1 text-xs text-muted-foreground">
            <span>Subtotal: <strong className="text-foreground">{formatCurrency(subtotalAmount)}</strong></span>
            {ivaAmount > 0 && <span>IVA: <strong className="text-foreground">{formatCurrency(ivaAmount)}</strong></span>}
            <span className="text-base font-bold text-foreground">{formatCurrency(totalAmount)}</span>
          </div>
        </DialogHeader>

        {/* Preview area — horizontally scrollable on mobile */}
        <ScrollArea className="flex-1 bg-muted/30">
          <div className="p-4 sm:p-6 overflow-x-auto">
            <div id="print-area-carta-quotation" className="origin-top-left">
              <CartaTemplate
                invoice={invoiceData}
                client={clientForTemplate}
                settings={companySettings}
              />
            </div>
          </div>
        </ScrollArea>

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
