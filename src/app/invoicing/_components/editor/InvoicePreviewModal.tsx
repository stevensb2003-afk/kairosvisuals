import React from 'react';
import { Trash2, Loader2, CheckCircle, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CartaTemplate, POSTemplate } from '@/components/invoicing/DocumentTemplates';
interface InvoicePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: any[];
  globalDiscountAmount: number;
  globalDiscountValue: number;
  globalDiscountType: 'percentage' | 'amount';
  totalAmount: number;
  subtotalAmount: number;
  ivaAmount: number;
  clientData: any;
  settings: any;
  isSaving: boolean;
  selectedClientId: string | null;
  handleCreateInvoice: (status: 'sent' | 'draft') => void;
}

export function InvoicePreviewModal({
  isOpen,
  onClose,
  items,
  globalDiscountAmount,
  globalDiscountValue,
  globalDiscountType,
  totalAmount,
  subtotalAmount,
  ivaAmount,
  clientData,
  settings,
  isSaving,
  selectedClientId,
  handleCreateInvoice
}: InvoicePreviewModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 md:p-10 animate-in fade-in duration-300">
      <div className="bg-white rounded-2xl w-full max-w-4xl max-h-full overflow-y-auto relative shadow-2xl overflow-x-hidden">
        <Button
          variant="ghost"
          size="icon"
          className="absolute right-4 top-4 z-10 bg-slate-100 hover:bg-slate-200"
          onClick={onClose}
        >
          <Trash2 className="w-5 h-5" />
        </Button>
        <div className="p-4 md:p-10 overflow-x-auto">
          <CartaTemplate
            invoice={{
              invoiceNumber: 'KV-PREVIEW',
              issueDate: new Date().toISOString(),
              items: items.filter(i => i.description),
              totalDiscount: globalDiscountAmount,
              globalDiscountValue,
              globalDiscountType,
              taxRate: 0,
              ivaType: 'Items',
              totalAmount: totalAmount,
              subtotalAmount: subtotalAmount,
              taxAmount: ivaAmount
            }}
            client={clientData || { clientName: 'Nombre del Cliente' }}
            settings={settings}
          />
          <div className="mt-10 pt-10 border-t border-dashed">
            <h4 className="text-center text-sm font-bold uppercase text-muted-foreground mb-4 italic">- Previsualización Formato POS -</h4>
            <div className="flex justify-center">
              <div className="border shadow-lg p-2 bg-slate-50 scale-90 origin-top">
                <POSTemplate
                  invoice={{
                    invoiceNumber: 'KV-PREVIEW',
                    issueDate: new Date().toISOString(),
                    items: items.filter(i => i.description).map(i => ({
                      ...i,
                      total: (i.quantity * i.unitPrice) - i.discount
                    })),
                    totalDiscount: globalDiscountAmount,
                    globalDiscountType,
                    globalDiscountValue,
                    taxAmount: ivaAmount,
                    totalAmount: totalAmount,
                    subtotalAmount: subtotalAmount,
                    status: 'draft',
                  } as any}
                  client={clientData || { clientName: 'Nombre del Cliente' }}
                  settings={settings}
                />
              </div>
            </div>
          </div>
        </div>
        <div className="p-6 bg-slate-50 border-t flex justify-center flex-wrap gap-4">
          <Button variant="outline" onClick={onClose}>Cerrar Previsualización</Button>
          <Button onClick={() => handleCreateInvoice('draft')} disabled={isSaving || !selectedClientId} variant="secondary" className="border shadow-sm bg-background hover:bg-muted text-foreground">
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
            Guardar Borrador
          </Button>
          <Button onClick={() => handleCreateInvoice('sent')} disabled={isSaving || !selectedClientId}>
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <CheckCircle className="w-4 h-4 mr-2" />}
            Emitir Factura Ahora
          </Button>
        </div>

        {/* Hidden containers for printing/export if needed */}
        <div style={{ position: 'absolute', top: '-9999px', left: '-9999px', opacity: 0, zIndex: -1 }} id="print-area-pos">
          <POSTemplate
            invoice={{
              invoiceNumber: 'KV-BORRADOR',
              issueDate: new Date().toISOString(),
              items: items.filter(i => i.description).map(i => ({
                ...i,
                total: (i.quantity * i.unitPrice) - i.discount
              })),
              totalDiscount: globalDiscountAmount,
              globalDiscountType,
              globalDiscountValue,
              taxAmount: ivaAmount,
              totalAmount: totalAmount,
              subtotalAmount: subtotalAmount,
              status: 'draft',
            } as any}
            client={clientData || { clientName: 'Nombre del Cliente' }}
            settings={settings}
          />
        </div>
      </div>
    </div>
  );
}
