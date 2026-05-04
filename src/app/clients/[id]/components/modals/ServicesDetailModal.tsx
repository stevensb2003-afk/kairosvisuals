import React from 'react';
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Zap } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ServicesDetailModal({
  isServicesDetailOpen,
  setIsServicesDetailOpen,
  activeQuotation,
  router,
  selectedLead
}: any) {
  const globalSubtotal = parseFloat(activeQuotation?.subtotalAmount) || parseFloat(activeQuotation?.subtotal) || 0;
  const globalDiscount = parseFloat(activeQuotation?.totalDiscount) || parseFloat(activeQuotation?.discount) || 0;
  const hasGlobalDiscount = globalDiscount > 0 && globalSubtotal > 0;
  const netFactor = hasGlobalDiscount ? (globalSubtotal - globalDiscount) / globalSubtotal : 1;

  return (
    <Dialog open={isServicesDetailOpen} onOpenChange={setIsServicesDetailOpen}>
      <DialogContent className="w-[calc(100vw-24px)] max-w-2xl max-h-[90dvh] overflow-hidden flex flex-col bg-card rounded-2xl border border-primary/10 shadow-2xl p-0">

        {/* Header */}
        <div className="bg-gradient-to-br from-primary/30 via-primary/5 to-transparent p-4 sm:p-5 border-b border-primary/10 relative shrink-0">
          <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
            <Zap className="w-10 h-10 text-primary" />
          </div>
          <DialogTitle className="text-base sm:text-xl font-black font-headline tracking-tight flex items-center gap-2.5">
            <div className="p-1.5 sm:p-2 bg-primary rounded-lg shadow-lg shadow-primary/30 shrink-0">
              <Zap className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
            </div>
            Detalles del Contrato Activo
          </DialogTitle>
        </div>

        {/* Scrollable body */}
        <div className="overflow-y-auto flex-1 p-3 sm:p-6 space-y-4">
          {activeQuotation ? (
            <>
              {/* Mobile: Cards */}
              <div className="md:hidden space-y-2.5">
                {activeQuotation.items?.map((item: any, i: number) => {
                  const quantity = parseFloat(item.quantity) || 1;
                  const unitPrice = parseFloat(item.unitPrice) || 0;
                  const netUnitPrice = Math.round(unitPrice * netFactor);
                  const netLineTotal = netUnitPrice * quantity;
                  return (
                    <div key={i} className="p-3.5 rounded-xl border border-border/50 bg-muted/20 space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="font-bold text-sm text-foreground leading-snug">{item.serviceName || item.description}</p>
                          {item.serviceName && item.description && item.serviceName !== item.description && (
                            <p className="text-[11px] text-muted-foreground mt-0.5 leading-snug">{item.description}</p>
                          )}
                          {item.overriddenQuantity && (
                            <span className="text-[10px] text-primary font-medium inline-flex w-fit bg-primary/10 px-2 py-0.5 rounded-full mt-1.5">
                              Base + {item.overriddenQuantity} extra
                            </span>
                          )}
                        </div>
                        <span className="text-xs font-bold text-muted-foreground bg-muted rounded-lg px-2 py-1 shrink-0">×{item.quantity}</span>
                      </div>
                      <div className="flex items-center justify-between pt-2 border-t border-border/30">
                        <div className="flex flex-col">
                          <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">P. Unitario</span>
                          {hasGlobalDiscount ? (
                            <div className="flex items-center gap-1.5">
                              <span className="line-through text-muted-foreground/50 text-xs">₡{unitPrice.toLocaleString()}</span>
                              <span className="font-bold text-sm">₡{netUnitPrice.toLocaleString()}</span>
                            </div>
                          ) : (
                            <span className="font-semibold text-sm">₡{unitPrice.toLocaleString()}</span>
                          )}
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider block">Total</span>
                          <span className="font-bold text-primary text-base">₡{netLineTotal.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Desktop: Table */}
              <div className="hidden md:block border border-border/50 rounded-xl overflow-hidden bg-card shadow-sm">
                <table className="w-full text-sm">
                  <thead className="bg-primary/5 border-b border-border/50">
                    <tr>
                      <th className="text-left p-4 font-bold text-xs uppercase text-muted-foreground tracking-wider">Servicio / Concepto</th>
                      <th className="text-center p-4 font-bold text-xs uppercase text-muted-foreground tracking-wider">Cant.</th>
                      <th className="text-right p-4 font-bold text-xs uppercase text-muted-foreground tracking-wider">P. Unitario</th>
                      <th className="text-right p-4 font-bold text-xs uppercase text-muted-foreground tracking-wider">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/20">
                    {activeQuotation.items?.map((item: any, i: number) => {
                      const quantity = parseFloat(item.quantity) || 1;
                      const unitPrice = parseFloat(item.unitPrice) || 0;
                      const netUnitPrice = Math.round(unitPrice * netFactor);
                      const netLineTotal = netUnitPrice * quantity;
                      return (
                        <tr key={i} className="hover:bg-muted/10 transition-colors">
                          <td className="p-4">
                            <div className="flex flex-col gap-0.5">
                              <span className="font-bold text-foreground">{item.serviceName || item.description}</span>
                              {item.serviceName && item.description && item.serviceName !== item.description && (
                                <span className="text-[11px] text-muted-foreground leading-snug">{item.description}</span>
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
                                <span className="font-bold">₡{netUnitPrice.toLocaleString()}</span>
                              </div>
                            ) : (
                              <span className="text-muted-foreground font-medium">₡{unitPrice.toLocaleString()}</span>
                            )}
                          </td>
                          <td className="p-4 text-right font-bold text-primary">₡{netLineTotal.toLocaleString()}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Totals — siempre visible */}
              <div className="rounded-xl border border-border/50 bg-muted/20 overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 text-sm">
                  <span className="font-bold text-muted-foreground uppercase tracking-wider text-xs">Subtotal</span>
                  <span className="font-bold">₡{(activeQuotation.subtotalAmount || activeQuotation.subtotal || 0).toLocaleString()}</span>
                </div>
                {(activeQuotation.totalDiscount || activeQuotation.discount || 0) > 0 && (
                  <div className="flex items-center justify-between px-4 py-3 text-sm border-t border-border/30">
                    <span className="font-bold text-amber-600 uppercase tracking-wider text-xs">Descuento Total</span>
                    <span className="font-bold text-amber-600">-₡{(activeQuotation.totalDiscount || activeQuotation.discount || 0).toLocaleString()}</span>
                  </div>
                )}
                {(activeQuotation.taxAmount || activeQuotation.ivaAmount || 0) > 0 && (
                  <div className="flex items-center justify-between px-4 py-3 text-sm border-t border-border/30">
                    <span className="font-bold text-muted-foreground uppercase tracking-wider text-xs">IVA ({activeQuotation.ivaRate || 13}%)</span>
                    <span className="font-bold">₡{(activeQuotation.taxAmount || activeQuotation.ivaAmount || 0).toLocaleString()}</span>
                  </div>
                )}
                <div className="flex items-center justify-between px-4 py-3 border-t-2 border-primary/20 bg-primary/5">
                  <span className="font-black text-primary uppercase tracking-widest text-xs">Total Contractual</span>
                  <span className="font-black text-primary text-lg sm:text-xl">₡{(activeQuotation.totalAmount || activeQuotation.grandTotal || activeQuotation.total || 0).toLocaleString()}</span>
                </div>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center p-10 text-center bg-muted/30 rounded-xl border border-dashed border-border">
              <div className="p-4 bg-background rounded-full shadow-sm mb-4">
                <Zap className="w-8 h-8 text-muted-foreground/50" />
              </div>
              <h4 className="font-semibold text-foreground text-lg">Sin servicios en curso</h4>
              <p className="text-sm text-muted-foreground max-w-[280px] mt-1 mb-4">Acepta una cotización para habilitar el seguimiento del contrato.</p>
              <Button variant="outline" onClick={() => {
                setIsServicesDetailOpen(false);
                router.push(`/solicitudes/create?leadId=${selectedLead.id}&clientId=${selectedLead.clientId}`);
              }}>Generar Cotización</Button>
            </div>
          )}
        </div>

        {/* Footer fijo */}
        <div className="flex justify-end px-4 py-3 border-t border-border/50 bg-background shrink-0">
          <Button variant="outline" className="h-9 px-5 font-bold" onClick={() => setIsServicesDetailOpen(false)}>Cerrar</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
