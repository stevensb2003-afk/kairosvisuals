import React from 'react';
import { FileText, Send, Clock, ShieldCheck, CheckCircle, AlertCircle, XCircle } from 'lucide-react';

export const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  draft:                { label: 'Borrador',           color: 'bg-slate-500/10 text-slate-500 border-slate-500/20',      icon: <FileText className="w-3.5 h-3.5" /> },
  sent:                 { label: 'Enviada',             color: 'bg-blue-500/10 text-blue-600 border-blue-500/20',        icon: <Send className="w-3.5 h-3.5" /> },
  partially_paid:       { label: 'Parcial',             color: 'bg-amber-500/10 text-amber-600 border-amber-500/20',     icon: <Clock className="w-3.5 h-3.5" /> },
  pending_verification: { label: 'Verificando',         color: 'bg-violet-500/10 text-violet-600 border-violet-500/20', icon: <ShieldCheck className="w-3.5 h-3.5" /> },
  paid:                 { label: 'Pagada',              color: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20', icon: <CheckCircle className="w-3.5 h-3.5" /> },
  overdue:              { label: 'Vencida',             color: 'bg-red-500/10 text-red-600 border-red-500/20',           icon: <AlertCircle className="w-3.5 h-3.5" /> },
  cancelled:            { label: 'Cancelada',           color: 'bg-muted text-muted-foreground border-border',           icon: <XCircle className="w-3.5 h-3.5" /> },
};
