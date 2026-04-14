import React from 'react';
import { 
  ChevronDown, 
  Circle, 
  AlertTriangle,
  Clock,
  CheckCircle,
  AlertCircle,
  Construction,
  Eye,
  CheckCheck,
  RotateCcw,
  MessageSquare,
  Zap
} from "lucide-react";

export const ZapIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M4 14.71 13 3l-1.5 8h7.52L10 21l1.5-8.5Z"/>
  </svg>
);

// We'll use the Lucide Zap for consistency unless the custom one is specifically better
// but the user's screenshots showed 'Zap' being missing. 
// I'll export our custom one as Zap as well for compatibility.
export const ZapSymbol = ZapIcon;

export const PRIORITY_CONFIG: Record<string, { label: string; className: string; icon: any }> = {
  'low':    { label: 'Baja',    className: 'bg-slate-500/10 text-slate-600 border-slate-500/30', icon: ChevronDown },
  'medium': { label: 'Media',   className: 'bg-blue-500/10 text-blue-600 border-blue-500/30', icon: Circle },
  'high':   { label: 'Alta',    className: 'bg-orange-500/10 text-orange-600 border-orange-500/30', icon: AlertTriangle },
  'urgent': { label: 'Urgente', className: 'bg-rose-500/10 text-rose-600 border-rose-500/30', icon: ZapIcon },
};

export const STATUS_LABELS: Record<string, string> = {
  'to-do': 'Por Hacer',
  'in-progress': 'En Progreso',
  'internal-review': 'Revisión Interna',
  'client-review': 'Revisión Cliente',
  'client-approved': 'Aprobado por Cliente',
  'done': 'Completado',
};

export const STATUS_CONFIG: Record<string, { label: string; color: string; icon: any }> = {
  'to-do':           { label: 'Por Hacer',        color: 'bg-slate-500/10 text-slate-600 border-slate-500/20', icon: Clock },
  'in-progress':     { label: 'En Progreso',      color: 'bg-blue-500/10 text-blue-600 border-blue-500/20',     icon: Construction },
  'internal-review': { label: 'Revisión Interna', color: 'bg-amber-500/10 text-amber-600 border-amber-500/20',   icon: Eye },
  'client-review':   { label: 'Revisión Cliente', color: 'bg-violet-500/10 text-violet-600 border-violet-500/20', icon: MessageSquare }, 
  'client-approved': { label: 'Aprobado',         color: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20', icon: CheckCheck },
  'done':            { label: 'Completado',       color: 'bg-emerald-600 text-white border-transparent',             icon: CheckCircle },
};

