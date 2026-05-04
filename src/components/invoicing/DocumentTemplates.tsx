import React from 'react';
import { formatCurrency } from '@/lib/utils';
import { format, addBusinessDays } from 'date-fns';
import { es } from 'date-fns/locale';
import { Logo } from '@/components/ui/logo';


interface TemplateProps {
  invoice: any;
  client: any;
  settings: any;
}

export const CartaTemplate: React.FC<TemplateProps> = ({ invoice, client, settings }) => {
  if (!invoice || !client) return null;

  const totalDiscount = (invoice.totalDiscount || 0);
  const totalAmount = (invoice.grandTotal || invoice.totalAmount || invoice.total || 0);
  const subtotalAmount = (invoice.subtotal || invoice.subtotalAmount || (totalAmount - (invoice.taxAmount || invoice.ivaAmount || 0)));

  return (
    <div
      id="print-area-carta"
      className="bg-white text-slate-900 p-12 mx-auto selection:bg-primary/10"
      style={{ width: '816px', minHeight: '1056px', fontFamily: "'Inter', system-ui, sans-serif" }}
    >
      <div className="flex justify-between items-start mb-12">
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-4">
            <img
              src="/kv_app_logo.png"
              alt="Kairos Visuals"
              className="w-14 h-14 object-contain rounded-xl shadow-sm"
            />
            <div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight leading-none mb-1">
                {settings?.companyName || 'Kairos Visuals'}
              </h1>
              <p className="text-[10px] text-slate-500 uppercase tracking-widest">CREATIVIDAD EN EL TIEMPO PERFECTO</p>
            </div>
          </div>

          <div className="space-y-0.5 text-slate-600 text-[12px] max-w-xs">
            <p>{settings?.companyAddress || 'San José, Costa Rica'}</p>
            <p>{settings?.companyEmail || 'hello@kairosvisuals.com'}</p>
            <p>{settings?.companyPhone || '+506 8888 8888'}</p>
          </div>
        </div>

        <div className="text-right flex flex-col items-end">
          <div className="mb-4">
            <h2 className="text-xl font-bold text-slate-900 uppercase tracking-wide">
              {invoice.invoiceNumber ? 'Factura Oficial' : 'Cotización'}
            </h2>
            <p className="text-lg font-medium text-slate-700">
              # {invoice.quotationNumber ? String(invoice.quotationNumber).padStart(4, '0') : (invoice.invoiceNumber || (invoice.id ? invoice.id.substring(0, 8).toUpperCase() : 'B-PROV'))}
            </p>
          </div>

          <div className="mt-4 flex gap-6 text-[12px]">
            <div>
              <p className="text-slate-400 font-bold uppercase tracking-wider mb-0.5">Emisión</p>
              <p className="font-semibold text-slate-700">{format(new Date(invoice.issueDate || Date.now()), "dd MMM, yyyy", { locale: es })}</p>
            </div>
            {invoice.validityDays && (
              <div>
                <p className="text-slate-400 font-bold uppercase tracking-wider mb-0.5">Vence</p>
                <p className="font-bold text-primary">{format(addBusinessDays(new Date(invoice.issueDate || Date.now()), invoice.validityDays), "dd MMM, yyyy", { locale: es })}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Client Info Section */}
      <div className="grid grid-cols-2 gap-12 mb-12">
        <div>
          <h3 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2 border-b border-slate-200 pb-1">Facturar a:</h3>
          <p className="font-bold text-base text-slate-900">{client.clientName || client.name}</p>
          {(client.company || client.clientCompany) && (
            <p className="text-sm font-medium text-slate-700 mt-0.5">{client.company || client.clientCompany}</p>
          )}
          <div className="mt-2 space-y-0.5 text-[12px] text-slate-600">
            {client.contactEmail && <p>{client.contactEmail}</p>}
            {(client.contactPhone || client.phone || client.clientPhone) && (
              <p>{client.contactPhone || client.phone || client.clientPhone}</p>
            )}
          </div>
        </div>

        {invoice.notes && (
          <div className="flex flex-col justify-center">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Términos & Notas</h3>
            <p className="text-[12px] text-slate-500 leading-relaxed italic whitespace-pre-wrap">
              "{invoice.notes}"
            </p>
          </div>
        )}
      </div>

      {/* Items Table */}
      <div className="mb-12">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-200">
              <th className="py-4 text-slate-400 font-black uppercase text-[10px] tracking-widest pl-2">Servicio / Descripción</th>
              <th className="py-4 text-right text-slate-400 font-black uppercase text-[10px] tracking-widest px-4">Cantidad</th>
              <th className="py-4 text-right text-slate-400 font-black uppercase text-[10px] tracking-widest px-4">Precio Unit.</th>
              <th className="py-4 text-right text-slate-400 font-black uppercase text-[10px] tracking-widest pr-2">Subtotal</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {invoice.items?.map((item: any, idx: number) => {
              const itemSubtotal = (item.quantity || 1) * (item.unitPrice || 0);
              const itemTotal = item.total || itemSubtotal;

              return (
                <tr key={idx} className="group">
                  <td className="py-4 pl-2">
                    <p className="font-bold text-slate-900 text-sm">{item.serviceName || 'Servicio Personalizado'}</p>
                    {item.description && (
                      <p className="text-[12px] text-slate-600 mt-1 leading-relaxed max-w-sm whitespace-pre-wrap">{item.description}</p>
                    )}
                    {(item.discountValue > 0 || item.discount > 0) && (
                      <p className="text-[11px] italic text-slate-500 mt-1">
                        Descuento aplicado: {item.discountType === 'percentage' ? `${item.discountValue}%` : formatCurrency(item.discountValue || item.discount)}
                      </p>
                    )}
                  </td>
                  <td className="py-4 text-right text-slate-700 px-4 tabular-nums">{item.quantity || 1}</td>
                  <td className="py-4 text-right text-slate-700 px-4 tabular-nums">{formatCurrency(item.unitPrice || 0)}</td>
                  <td className="py-4 text-right text-slate-900 font-bold pr-2 tabular-nums">{formatCurrency(itemTotal)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Summary Section */}
      <div className="flex justify-end pt-8 border-t border-slate-300">
        <div className="w-72">
          <div className="space-y-2">
            <div className="flex justify-between items-center text-slate-600 text-sm">
              <span>Subtotal</span>
              <span className="tabular-nums">{formatCurrency(subtotalAmount)}</span>
            </div>

            {totalDiscount > 0 && (
              <div className="flex justify-between items-center text-slate-600 text-sm">
                <span>Descuento</span>
                <span className="tabular-nums">-{formatCurrency(totalDiscount)}</span>
              </div>
            )}

            {(invoice.taxAmount > 0 || invoice.ivaAmount > 0) && (
              <div className="flex justify-between items-center text-slate-600 text-sm">
                <span>I.V.A.</span>
                <span className="tabular-nums">{formatCurrency(invoice.taxAmount || invoice.ivaAmount)}</span>
              </div>
            )}

            <div className="pt-4 mt-2 border-t border-slate-300">
              <div className="flex justify-between items-center text-slate-900">
                <span className="text-sm font-bold uppercase tracking-wider">Total</span>
                <span className="text-xl font-bold tabular-nums">
                  {formatCurrency(totalAmount)}
                </span>
              </div>
              <p className="text-[10px] text-slate-500 text-right mt-1">Expresado en colones</p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Branding */}
      <div className="mt-24 text-center border-t border-slate-200 pt-8">
        <p className="text-[10px] text-slate-400 uppercase tracking-widest">
          Generado a través de Kairos Visuals
        </p>
      </div>
    </div>
  );
};


export const POSTemplate: React.FC<TemplateProps> = ({ invoice, client, settings }) => {
  if (!invoice || !client) return null;

  return (
    <div id="print-area-pos" className="bg-white text-black p-4 mx-auto text-sm" style={{ width: '300px', fontFamily: 'monospace' }}>
      <div className="text-center pb-4 border-b border-black border-dashed mb-4 flex flex-col items-center">
        <Logo className="w-10 h-10 mb-2 text-black" />
        <h1 className="text-xl font-bold uppercase">{settings?.companyName || 'Kairos Visuals'}</h1>
        <p className="text-xs mt-1">{settings?.companyAddress || 'San José, CR'}</p>
        <p className="text-xs">{settings?.companyPhone || '+506 8888 8888'}</p>
      </div>

      <div className="mb-4 text-xs uppercase">
        <p>{invoice.invoiceNumber ? 'FACTURA' : 'COTIZACIÓN'}: {invoice.quotationNumber ? String(invoice.quotationNumber).padStart(4, '0') : (invoice.invoiceNumber || (invoice.id ? invoice.id.substring(0, 6).toUpperCase() : 'BORRADOR'))}</p>
        <p>FECHA: {format(new Date(invoice.issueDate || Date.now()), "dd/MM/yyyy HH:mm")}</p>
        {invoice.validityDays && (
          <p className="font-bold">VENCE: {format(addBusinessDays(new Date(invoice.issueDate || Date.now()), invoice.validityDays), "dd/MM/yyyy")}</p>
        )}
        <p className="mt-2 text-sm font-bold">CLIENTE: {client.clientName || client.name}</p>
      </div>

      <div className="border-b border-black border-dashed pb-2 mb-2">
        <table className="w-full text-left">
          <thead>
            <tr>
              <th className="pb-1 text-[10px] font-bold uppercase">Desc / Cant</th>
              <th className="pb-1 text-right text-[10px] font-bold uppercase">Total</th>
            </tr>
          </thead>
          <tbody>
            {invoice.items?.map((item: any, idx: number) => {
              const subtotal = item.subtotal || ((item.quantity || 1) * (item.unitPrice || 0));
              const total = item.total || (subtotal + (item.tax || 0));

              return (
                <tr key={idx}>
                  <td className="py-1 align-top text-[11px]">
                    <span className="font-bold">{item.serviceName || 'Servicio Personalizado'}</span>
                    <br />
                    {item.description && <span className="text-gray-500 block truncate max-w-[150px] mb-0.5">{item.description}</span>}
                    <span className="text-gray-600">{item.quantity || 1}x {formatCurrency(subtotal / (item.quantity || 1))}</span>
                    {item.tax > 0 && <span className="text-gray-500 ml-1">(IVA {item.ivaRate}%)</span>}
                  </td>
                  <td className="py-1 text-right align-top font-bold text-[11px]">
                    {formatCurrency(total)}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <div className="mb-6 uppercase text-xs">
        <div className="space-y-1">
          <div className="flex justify-between">
            <span>SUBTOTAL</span>
            <span>{formatCurrency(invoice.subtotal || invoice.subtotalAmount || ((invoice.totalAmount || invoice.grandTotal || 0) - (invoice.taxAmount || invoice.ivaAmount || 0)))}</span>
          </div>

          {(invoice.totalDiscount > 0 || invoice.globalDiscount > 0) && (
            <div className="flex justify-between text-red-600 italic">
              <span>DESC. GLOBAL {invoice.globalDiscountType === 'percentage' ? `(${invoice.globalDiscountValue}%)` : ''}</span>
              <span>-{formatCurrency(invoice.totalDiscount || invoice.globalDiscount)}</span>
            </div>
          )}

          {(invoice.taxAmount > 0 || invoice.ivaAmount > 0) && (
            <div className="flex justify-between">
              <span>I.V.A. TOTAL</span>
              <span>{formatCurrency(invoice.taxAmount || invoice.ivaAmount)}</span>
            </div>
          )}

          <div className="flex justify-between text-base font-bold border-t border-black border-dashed pt-2 mt-2">
            <span>TOTAL</span>
            <span>{formatCurrency(invoice.grandTotal || invoice.totalAmount || invoice.total || 0)}</span>
          </div>
        </div>
      </div>

      <div className="text-center text-[10px] uppercase">
        <p>¡Gracias por su preferencia!</p>
        {settings?.companyWebsite && <p className="mt-1">{settings.companyWebsite}</p>}
      </div>
    </div>
  );
};
