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

  return (
    <div id="print-area-carta" className="bg-white text-black p-12 mx-auto" style={{ width: '800px', minHeight: '1131px', fontFamily: 'sans-serif' }}>
      <div className="flex justify-between items-start border-b-2 border-gray-200 pb-8 mb-8">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Logo className="w-12 h-12 text-gray-900" />
            <h1 className="text-4xl font-bold text-gray-900 tracking-tight">{settings?.companyName || 'Kairos Visuals'}</h1>
          </div>
          <p className="text-gray-500 mt-2">{settings?.companyAddress || 'San José, Costa Rica'}</p>
          <p className="text-gray-500">{settings?.companyEmail || 'hello@kairosvisuals.com'}</p>
          <p className="text-gray-500">{settings?.companyPhone || '+506 8888 8888'}</p>
        </div>
        <div className="text-right">
          <h2 className="text-3xl font-semibold text-gray-800 uppercase tracking-wider">{invoice.invoiceNumber ? 'FACTURA' : 'COTIZACIÓN'}</h2>
          <p className="text-gray-500 mt-1"># {invoice.quotationNumber ? String(invoice.quotationNumber).padStart(4, '0') : (invoice.invoiceNumber || (invoice.id ? invoice.id.substring(0,8).toUpperCase() : 'BORRADOR'))}</p>
          <div className="text-gray-500 mt-2 text-sm">
            <p>Emisión: {format(new Date(invoice.issueDate || Date.now()), "dd MMM yyyy", { locale: es })}</p>
            {invoice.validityDays && (
              <p className="font-semibold text-gray-700">
                Vencimiento: {format(addBusinessDays(new Date(invoice.issueDate || Date.now()), invoice.validityDays), "dd MMM yyyy", { locale: es })}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="mb-10">
        <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-2">{invoice.invoiceNumber ? 'Facturar a' : 'Presentado a'}:</h3>
        <p className="font-bold text-xl text-gray-900">{client.clientName || client.name}</p>
        {(client.company || client.clientCompany) && (
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mt-0.5">{client.company || client.clientCompany}</p>
        )}
        {client.contactEmail && <p className="text-gray-600">{client.contactEmail}</p>}
        {(client.contactPhone || client.phone || client.clientPhone) && (
          <p className="text-gray-600">{client.contactPhone || client.phone || client.clientPhone}</p>
        )}
      </div>

      <table className="w-full text-left mb-10 border-collapse">
        <thead>
          <tr className="border-b-2 border-gray-300">
            <th className="py-3 text-gray-700 font-bold uppercase text-xs">Descripción</th>
            <th className="py-3 text-right text-gray-700 font-bold uppercase text-xs">Cant.</th>
            <th className="py-3 text-right text-gray-700 font-bold uppercase text-xs">P. Base</th>
            <th className="py-3 text-right text-gray-700 font-bold uppercase text-xs">I.V.A.</th>
            <th className="py-3 text-right text-gray-700 font-bold uppercase text-xs">Total</th>
          </tr>
        </thead>
        <tbody>
          {invoice.items?.map((item: any, idx: number) => {
            // Re-calculate if not provided (for older documents)
            const subtotal = item.subtotal || (item.quantity * item.unitPrice);
            const total = item.total || (subtotal + (item.tax || 0));
            
            return (
              <tr key={idx} className="border-b border-gray-100">
                <td className="py-4 text-gray-800">
                  <p className="font-bold text-gray-900">{item.serviceName || 'Servicio Personalizado'}</p>
                  <p className="text-xs text-gray-500 mt-0.5 whitespace-pre-wrap">{item.description}</p>
                  {(item.discountValue > 0 || item.discount > 0) && (
                    <p className="text-[10px] text-red-500 mt-1">
                      Descuento: {item.discountType === 'percentage' ? `${item.discountValue}%` : formatCurrency(item.discountValue || item.discount)}
                    </p>
                  )}
                </td>
                <td className="py-4 text-right text-gray-800">{item.quantity || 1}</td>
                <td className="py-4 text-right text-gray-800">{formatCurrency(subtotal / (item.quantity || 1))}</td>
                <td className="py-4 text-right text-gray-800">
                  {item.tax > 0 ? formatCurrency(item.tax) : '-'}
                  {(item.ivaRate ?? 0) > 0 && <span className="text-[9px] text-gray-400 block">({item.ivaRate}%)</span>}
                </td>
                <td className="py-4 text-right text-gray-950 font-bold">{formatCurrency(total)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <div className="flex justify-end">
        <div className="w-72">
          <div className="space-y-3">
            <div className="flex justify-between text-gray-600 text-sm">
              <span>Subtotal Base</span>
              <span>{formatCurrency(invoice.subtotal || invoice.subtotalAmount || ((invoice.totalAmount || invoice.grandTotal || 0) - (invoice.taxAmount || invoice.ivaAmount || 0)))}</span>
            </div>
            
            {invoice.totalDiscount > 0 && (
              <div className="flex justify-between text-red-500 text-sm italic">
                <span>Descuento Global {invoice.globalDiscountType === 'percentage' ? `(${invoice.globalDiscountValue}%)` : ''}</span>
                <span>-{formatCurrency(invoice.totalDiscount)}</span>
              </div>
            )}

            {(invoice.taxAmount > 0 || invoice.ivaAmount > 0) && (
              <div className="flex justify-between text-gray-600 text-sm">
                <span>I.V.A. Total</span>
                <span>{formatCurrency(invoice.taxAmount || invoice.ivaAmount)}</span>
              </div>
            )}

            <div className="flex justify-between text-2xl font-bold text-gray-950 border-t-2 border-gray-900 pt-3 mt-3">
              <span>TOTAL</span>
              <span>{formatCurrency(invoice.grandTotal || invoice.totalAmount || invoice.total || 0)}</span>
            </div>
          </div>
        </div>
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
        <p>{invoice.invoiceNumber ? 'FACTURA' : 'COTIZACIÓN'}: {invoice.quotationNumber ? String(invoice.quotationNumber).padStart(4, '0') : (invoice.invoiceNumber || (invoice.id ? invoice.id.substring(0,6).toUpperCase() : 'BORRADOR'))}</p>
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
                  <br/>
                  {item.description && <span className="text-gray-500 block truncate max-w-[150px] mb-0.5">{item.description}</span>}
                  <span className="text-gray-600">{item.quantity || 1}x {formatCurrency(subtotal / (item.quantity || 1))}</span>
                  {item.tax > 0 && <span className="text-gray-500 ml-1">(IVA {item.ivaRate}%)</span>}
                </td>
                <td className="py-1 text-right align-top font-bold text-[11px]">
                  {formatCurrency(total)}
                </td>
              </tr>
            )})}
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
