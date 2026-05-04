import React from 'react';
import ReactDOM from 'react-dom';
import { useRouter } from 'next/navigation';
import { User, Mail, Phone, Building2 } from "lucide-react";
import { Quotation } from '@/lib/types';

interface ClientQuickInfoCardProps {
  quotation: Quotation;
  position: { top: number; left: number };
  onClose: () => void;
  cardRef: React.RefObject<HTMLDivElement | null> | any;
}

export function ClientQuickInfoCard({ quotation, position, onClose, cardRef }: ClientQuickInfoCardProps) {
  const router = useRouter();
  
  return ReactDOM.createPortal(
    <div
      ref={cardRef}
      style={{ position: 'absolute', top: position.top, left: position.left }}
      className="z-[9999] w-72 rounded-2xl overflow-hidden border border-white/10 shadow-2xl bg-slate-950/95 backdrop-blur-md animate-in fade-in-0 zoom-in-95 slide-in-from-top-2 duration-150"
    >
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-white/5 bg-slate-900/80">
        <div className="w-9 h-9 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center flex-shrink-0">
          <User className="w-4 h-4 text-primary" />
        </div>
        <div className="min-w-0">
          <p className="font-bold text-sm text-white truncate">{quotation.clientName || 'Cliente'}</p>
          {(quotation as any).clientCompany && (
            <p className="text-[11px] text-muted-foreground truncate">{(quotation as any).clientCompany}</p>
          )}
        </div>
      </div>
      {/* Info rows */}
      <div className="px-4 py-3 space-y-2.5">
        <div className="flex items-center gap-2.5">
          <Mail className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
          <span className="text-xs text-slate-300 truncate">{quotation.clientEmail || 'Sin correo'}</span>
        </div>
        <div className="flex items-center gap-2.5">
          <Phone className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
          <span className="text-xs text-slate-300">{(quotation as any).clientData?.clientPhone || (quotation as any).clientData?.phone || 'Sin teléfono'}</span>
        </div>
        {(quotation as any).clientCompany && (
          <div className="flex items-center gap-2.5">
            <Building2 className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
            <span className="text-xs text-slate-300 truncate">{(quotation as any).clientCompany}</span>
          </div>
        )}
      </div>
      {/* CTA */}
      <div className="px-4 pb-4">
        <button
          className="w-full text-xs font-bold text-primary border border-primary/30 rounded-xl py-2 hover:bg-primary/10 transition-colors"
          onClick={(e) => { e.stopPropagation(); onClose(); router.push(`/clients/${quotation.clientId}`); }}
        >
          Ver Perfil Completo →
        </button>
      </div>
    </div>,
    document.body
  );
}
