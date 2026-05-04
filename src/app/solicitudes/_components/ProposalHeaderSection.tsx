'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Info } from 'lucide-react';
import type { Client, CompanySettings } from '@/app/solicitudes/_hooks/useQuoteBuilder';

interface ProposalHeaderSectionProps {
  companySettings: CompanySettings;
  clientData: Client | null;
  isReadOnly: boolean;
  currentStatus: string;
  currentVersion: number;
}

const statusLabels: Record<string, { label: string; className: string }> = {
  draft:      { label: 'Borrador',     className: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20' },
  published:  { label: 'Publicada',    className: 'bg-blue-500/10 text-blue-600 border-blue-500/20' },
  accepted:   { label: 'Aceptada',     className: 'bg-green-500/10 text-green-600 border-green-500/20' },
  superseded: { label: 'Supersedida',  className: 'bg-gray-500/10 text-gray-500 border-gray-500/20' },
};

export function ProposalHeaderSection({
  companySettings,
  clientData,
  isReadOnly,
  currentStatus,
  currentVersion,
}: ProposalHeaderSectionProps) {
  const statusInfo = statusLabels[currentStatus] || statusLabels['draft'];

  return (
    <div className="mb-4 sm:mb-6 space-y-3">
      {/* Breadcrumb + back */}
      <div className="flex items-center gap-2">
        <Button asChild variant="ghost" size="sm" className="h-8 px-2 gap-1.5 text-muted-foreground hover:text-foreground">
          <Link href="/solicitudes">
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline text-xs">Propuestas</span>
          </Link>
        </Button>

        <span className="text-muted-foreground/40 text-sm">/</span>
        <span className="text-sm font-medium truncate">
          {clientData?.name || 'Nueva Propuesta'}
        </span>

        <div className="ml-auto flex items-center gap-2">
          {currentVersion > 1 && (
            <Badge variant="outline" className="text-[10px] font-medium">
              v{currentVersion}
            </Badge>
          )}
          <Badge variant="outline" className={`text-[10px] font-semibold border ${statusInfo.className}`}>
            {statusInfo.label}
          </Badge>
        </div>
      </div>

      {/* Read-only banner */}
      {isReadOnly && (
        <div className="flex items-start gap-2.5 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2.5 text-xs text-amber-700 dark:text-amber-400">
          <Info className="h-4 w-4 mt-0.5 shrink-0" />
          <div>
            <p className="font-semibold">Modo Solo Lectura</p>
            <p className="mt-0.5 text-amber-600/80 dark:text-amber-400/70">
              Esta propuesta ya fue publicada. Para hacer cambios, crea una nueva versión desde la lista de propuestas.
            </p>
          </div>
        </div>
      )}

      {/* Company + Client cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Emisor */}
        <div className="rounded-xl border border-border bg-muted/30 p-3 sm:p-4 space-y-0.5">
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">De (Emisor)</p>
          <p className="font-semibold text-sm">{companySettings.companyName || 'Tu Empresa'}</p>
          {companySettings.companyEmail && (
            <p className="text-xs text-muted-foreground">{companySettings.companyEmail}</p>
          )}
          {companySettings.companyPhone && (
            <p className="text-xs text-muted-foreground">{companySettings.companyPhone}</p>
          )}
          {companySettings.companyAddress && (
            <p className="text-xs text-muted-foreground truncate">{companySettings.companyAddress}</p>
          )}
        </div>

        {/* Cliente */}
        <div className="rounded-xl border border-primary/20 bg-primary/5 p-3 sm:p-4 space-y-0.5">
          <p className="text-[10px] uppercase tracking-widest text-primary/70 mb-1">Para (Cliente)</p>
          {clientData ? (
            <>
              <p className="font-semibold text-sm">{clientData.name}</p>
              {clientData.company && (
                <p className="text-xs text-muted-foreground">{clientData.company}</p>
              )}
              {clientData.contactEmail && (
                <p className="text-xs text-muted-foreground truncate">{clientData.contactEmail}</p>
              )}
              {clientData.phone && (
                <p className="text-xs text-muted-foreground">{clientData.phone}</p>
              )}
            </>
          ) : (
            <p className="text-xs text-muted-foreground italic">Sin cliente seleccionado</p>
          )}
        </div>
      </div>
    </div>
  );
}
