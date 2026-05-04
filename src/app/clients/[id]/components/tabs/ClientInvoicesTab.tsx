import React from 'react';
import { TabsContent } from "@/components/ui/tabs";
import { SearchIcon, FileText, Eye, Receipt, Zap } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

// Shared badge styles
const quotationBadgeClass = (status: string) =>
  status === 'accepted' ? 'bg-emerald-500/10 text-emerald-700 border-emerald-500/30' :
  status === 'published' ? 'bg-blue-500/10 text-blue-700 border-blue-500/30' :
  'bg-slate-500/10 text-slate-600 border-slate-500/30';

const quotationLabel = (status: string) =>
  status === 'accepted' ? 'Aceptada' : status === 'published' ? 'Enviada' : status;

const invoiceBadgeClass = (status: string) =>
  status === 'paid' ? 'bg-emerald-500/10 text-emerald-700 border-emerald-500/30' :
  status === 'pending' ? 'bg-amber-500/10 text-amber-700 border-amber-500/30' :
  'bg-slate-500/10 text-slate-600 border-slate-500/30';

const invoiceLabel = (status: string) =>
  status === 'paid' ? 'Pagada' : status === 'pending' ? 'Pendiente' : status;

export function ClientInvoicesTab({
  docsSearchTerm, setDocsSearchTerm,
  filteredQuotations, setPreviewQuotation, setIsPreviewOpen,
  filteredInvoices
}: any) {
  const openPreview = (doc: any) => { setPreviewQuotation(doc); setIsPreviewOpen(true); };

  return (
    <TabsContent value="invoices" className="outline-none m-0 space-y-8">

      {/* Search bar — full width on mobile */}
      <div className="relative group w-full max-w-md">
        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
          <SearchIcon className="h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
        </div>
        <Input
          type="text"
          placeholder="Buscar por #, título o monto..."
          className="pl-10 h-11 bg-muted/20 border-border/40 focus:bg-background focus:ring-primary/20 transition-all rounded-xl text-sm font-medium"
          value={docsSearchTerm}
          onChange={(e) => setDocsSearchTerm(e.target.value)}
        />
      </div>

      {/* ── QUOTATIONS ─────────────────────────────────────────── */}
      <div className="space-y-4">
        <h4 className="text-sm font-bold text-primary flex items-center gap-2 uppercase tracking-wider">
          <FileText className="w-4 h-4" /> Historial de Propuestas
        </h4>

        {filteredQuotations.length > 0 ? (
          <>
            {/* Mobile: Cards */}
            <div className="md:hidden space-y-3">
              {filteredQuotations.map((q: any, idx: number) => (
                <div key={idx} onClick={() => openPreview(q)}
                  className="p-4 rounded-xl border border-border/50 bg-card shadow-sm space-y-2 cursor-pointer hover:border-primary/30 active:scale-[0.99] transition-all">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-bold text-sm text-foreground truncate">{q.title}</p>
                      <p className="text-[10px] font-mono font-bold text-primary mt-0.5">
                        {q.quotationNumber ? `#${q.quotationNumber}` : 'PRO-TEMP'}
                      </p>
                    </div>
                    <Badge variant="outline" className={quotationBadgeClass(q.status)}>
                      {quotationLabel(q.status)}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between pt-1 border-t border-border/40">
                    <span className="text-xs text-muted-foreground">
                      {q.createdAt ? new Date(q.createdAt).toLocaleDateString() : 'Sin fecha'}
                    </span>
                    <span className="font-bold text-sm text-foreground">
                      ₡{q.grandTotal?.toLocaleString() || q.subtotal?.toLocaleString() || '0'}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop: Table */}
            <div className="hidden md:block border border-border/50 rounded-xl overflow-hidden bg-card shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50 border-b border-border/50">
                    <tr>
                      <th className="text-left p-4 font-bold text-xs uppercase text-muted-foreground tracking-wider w-[120px]"># Propuesta</th>
                      <th className="text-left p-4 font-bold text-xs uppercase text-muted-foreground tracking-wider">Propuesta</th>
                      <th className="text-left p-4 font-bold text-xs uppercase text-muted-foreground tracking-wider">Emisión</th>
                      <th className="text-right p-4 font-bold text-xs uppercase text-muted-foreground tracking-wider">Monto</th>
                      <th className="text-center p-4 font-bold text-xs uppercase text-muted-foreground tracking-wider">Estado</th>
                      <th className="p-4 text-right" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/30">
                    {filteredQuotations.map((q: any, idx: number) => (
                      <tr key={idx} className="hover:bg-muted/30 transition-colors">
                        <td className="p-4">
                          <span className="font-bold font-mono text-xs text-primary cursor-pointer hover:underline" onClick={() => openPreview(q)}>
                            {q.quotationNumber ? String(q.quotationNumber) : 'PRO-TEMP'}
                          </span>
                        </td>
                        <td className="p-4"><span className="font-semibold line-clamp-1">{q.title}</span></td>
                        <td className="p-4 text-muted-foreground text-xs whitespace-nowrap">
                          {q.createdAt ? new Date(q.createdAt).toLocaleDateString() : 'Sin fecha'}
                        </td>
                        <td className="p-4 text-right font-bold">
                          ₡{q.grandTotal?.toLocaleString() || q.subtotal?.toLocaleString() || '0'}
                        </td>
                        <td className="p-4 text-center">
                          <Badge variant="outline" className={quotationBadgeClass(q.status)}>
                            {quotationLabel(q.status)}
                          </Badge>
                        </td>
                        <td className="p-4 text-right">
                          <Button variant="outline" size="sm"
                            className="h-8 px-3 text-[11px] font-black border-primary/20 text-primary hover:bg-primary hover:text-white gap-1.5"
                            onClick={() => openPreview(q)}>
                            <Eye className="w-3.5 h-3.5" /> Ver
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center p-8 bg-muted/20 rounded-xl border border-dashed text-center">
            <p className="text-sm font-medium text-muted-foreground">No se encontraron propuestas.</p>
          </div>
        )}
      </div>

      <div className="w-full h-px bg-border/50" />

      {/* ── INVOICES ───────────────────────────────────────────── */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-bold text-primary flex items-center gap-2 uppercase tracking-wider">
            <Receipt className="w-4 h-4" /> Registro de Facturación
          </h4>
          {filteredInvoices.length > 0 && <Badge variant="secondary" className="font-bold">{filteredInvoices.length}</Badge>}
        </div>

        {filteredInvoices.length > 0 ? (
          <>
            {/* Mobile: Cards */}
            <div className="md:hidden space-y-3">
              {filteredInvoices.map((inv: any) => (
                <div key={inv.id} onClick={() => openPreview(inv)}
                  className="p-4 rounded-xl border border-border/50 bg-card shadow-sm space-y-2 cursor-pointer hover:border-primary/30 active:scale-[0.99] transition-all">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      {inv.isPlanInvoice ? (
                        <p className="font-bold text-sm text-primary flex items-center gap-1.5">
                          <Zap className="w-3.5 h-3.5" /> Plan Mensual
                        </p>
                      ) : (
                        <p className="font-bold text-sm text-foreground truncate">{inv.title || 'Servicios Genéricos'}</p>
                      )}
                      <p className="text-[10px] font-mono font-bold text-muted-foreground mt-0.5">
                        {inv.invoiceNumber ? String(inv.invoiceNumber) : `INV-${inv.id?.substring(0, 5).toUpperCase()}`}
                      </p>
                      {inv.isPlanInvoice && (
                        <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider mt-0.5">
                          {inv.billingMonth} • PAGO {inv.planPartNumber}/2
                        </p>
                      )}
                    </div>
                    <Badge variant="outline" className={invoiceBadgeClass(inv.status)}>
                      {invoiceLabel(inv.status)}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between pt-1 border-t border-border/40">
                    <span className="text-xs text-muted-foreground">
                      {inv.createdAt ? new Date(inv.createdAt).toLocaleDateString() : '-'}
                    </span>
                    <span className="font-bold text-sm text-foreground">
                      ₡{inv.totalAmount?.toLocaleString() || inv.total?.toLocaleString() || '0'}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop: Table */}
            <div className="hidden md:block border border-border/50 rounded-xl overflow-hidden bg-card shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50 border-b border-border/50">
                    <tr>
                      <th className="text-left p-4 font-bold text-xs uppercase text-muted-foreground tracking-wider w-[120px]"># Factura</th>
                      <th className="text-left p-4 font-bold text-xs uppercase text-muted-foreground tracking-wider">Concepto</th>
                      <th className="text-left p-4 font-bold text-xs uppercase text-muted-foreground tracking-wider">Emisión</th>
                      <th className="text-right p-4 font-bold text-xs uppercase text-muted-foreground tracking-wider">Monto</th>
                      <th className="text-center p-4 font-bold text-xs uppercase text-muted-foreground tracking-wider">Estado</th>
                      <th className="p-4 text-right" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/30">
                    {filteredInvoices.map((inv: any) => (
                      <tr key={inv.id} className="hover:bg-muted/30 transition-colors">
                        <td className="p-4">
                          <span className="font-bold font-mono text-xs cursor-pointer hover:underline hover:text-primary transition-colors" onClick={() => openPreview(inv)}>
                            {inv.invoiceNumber ? String(inv.invoiceNumber) : `INV-${inv.id?.substring(0, 5).toUpperCase()}`}
                          </span>
                        </td>
                        <td className="p-4">
                          <div className="flex flex-col text-sm">
                            <span className="font-semibold max-w-[200px] truncate">
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
                        <td className="p-4 text-muted-foreground text-xs whitespace-nowrap">
                          {inv.createdAt ? new Date(inv.createdAt).toLocaleDateString() : '-'}
                        </td>
                        <td className="p-4 text-right font-bold">
                          ₡{inv.totalAmount?.toLocaleString() || inv.total?.toLocaleString() || '0'}
                        </td>
                        <td className="p-4 text-center">
                          <Badge variant="outline" className={invoiceBadgeClass(inv.status)}>
                            {invoiceLabel(inv.status)}
                          </Badge>
                        </td>
                        <td className="p-4 text-right">
                          <Button variant="ghost" size="sm"
                            className="h-8 px-3 text-[11px] font-bold text-muted-foreground hover:text-primary hover:bg-primary/5 gap-1.5"
                            onClick={() => openPreview(inv)}>
                            <Eye className="w-4 h-4" /> Ver
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center p-8 bg-muted/20 rounded-xl border border-dashed text-center">
            <p className="text-sm font-medium text-muted-foreground">Sin registros contables que coincidan.</p>
          </div>
        )}
      </div>
    </TabsContent>
  );
}
