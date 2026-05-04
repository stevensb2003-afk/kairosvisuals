import React from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, CheckCircle, Receipt, FileText, AlertTriangle, TrendingUp, MoreVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface ClientHeaderProps {
  selectedLead: any;
  isProcessing: boolean;
  onArchive: () => void;
  onUnarchive: () => void;
  onMarkAsContacted: () => void;
}

export const ClientHeader: React.FC<ClientHeaderProps> = ({
  selectedLead, isProcessing, onArchive, onUnarchive, onMarkAsContacted,
}) => {
  const router = useRouter();
  if (!selectedLead) return null;

  const isPending = selectedLead.status === 'pending';
  const isArchived = selectedLead.isArchived;
  const clientId = selectedLead.clientId || selectedLead.id;

  return (
    <div className="flex items-center justify-between gap-3 border-b pb-4">
      {/* Left: Back + Identity */}
      <div className="flex items-center gap-2 min-w-0">
        <Button variant="ghost" size="icon" onClick={() => router.push('/clients')} className="shrink-0 h-9 w-9">
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div className="min-w-0">
          <h1 className="text-lg md:text-2xl font-bold font-headline flex items-center gap-2">
            <span className="truncate">{selectedLead.clientName}</span>
            {isArchived && (
              <Badge variant="outline" className="text-[10px] bg-red-500/10 text-red-600 border-red-500/20 shrink-0">Archivado</Badge>
            )}
          </h1>
          <p className="text-muted-foreground text-xs truncate">
            <span className="font-medium text-foreground">{selectedLead.company || 'Sin empresa'}</span>
            <span className="hidden sm:inline"> • ID: {selectedLead.clientId?.substring(0, 8)}...</span>
          </p>
        </div>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-2 shrink-0">
        {/* Primary CTA: always visible on mobile if pending */}
        {isPending && (
          <Button onClick={onMarkAsContacted} size="sm" className="bg-primary hover:bg-primary/90 gap-1.5 text-xs">
            <CheckCircle className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Atender Solicitud</span>
            <span className="sm:hidden">Atender</span>
          </Button>
        )}

        {/* Desktop: full button row */}
        <div className="hidden md:flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-2 border-primary/30 text-primary hover:bg-primary/5"
            onClick={() => router.push(`/invoicing/create?clientId=${clientId}`)}>
            <Receipt className="w-4 h-4" /> Nueva Factura
          </Button>
          <Button variant="outline" size="sm" className="gap-2"
            onClick={() => router.push(`/solicitudes/create?leadId=${selectedLead.id}&clientId=${selectedLead.clientId}`)}>
            <FileText className="w-4 h-4" /> Nueva Propuesta
          </Button>
          {isArchived ? (
            <Button variant="outline" size="sm" className="gap-2 border-emerald-500/30 text-emerald-600 hover:bg-emerald-50"
              onClick={onUnarchive} disabled={isProcessing}>
              <TrendingUp className="w-4 h-4" /> Restaurar
            </Button>
          ) : (
            <Button variant="outline" size="sm" className="gap-2 border-red-500/30 text-red-600 hover:bg-red-50"
              onClick={onArchive} disabled={isProcessing}>
              <AlertTriangle className="w-4 h-4" /> Archivar
            </Button>
          )}
        </div>

        {/* Mobile: overflow menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="icon" className="h-9 w-9 md:hidden">
              <MoreVertical className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
            <DropdownMenuItem className="gap-2"
              onClick={() => router.push(`/invoicing/create?clientId=${clientId}`)}>
              <Receipt className="w-4 h-4" /> Nueva Factura
            </DropdownMenuItem>
            <DropdownMenuItem className="gap-2"
              onClick={() => router.push(`/solicitudes/create?leadId=${selectedLead.id}&clientId=${selectedLead.clientId}`)}>
              <FileText className="w-4 h-4" /> Nueva Propuesta
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            {isArchived ? (
              <DropdownMenuItem onClick={onUnarchive} disabled={isProcessing}
                className="gap-2 text-emerald-600 focus:text-emerald-600">
                <TrendingUp className="w-4 h-4" /> Restaurar Cliente
              </DropdownMenuItem>
            ) : (
              <DropdownMenuItem onClick={onArchive} disabled={isProcessing}
                className="gap-2 text-red-600 focus:text-red-600">
                <AlertTriangle className="w-4 h-4" /> Archivar Cliente
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
};
