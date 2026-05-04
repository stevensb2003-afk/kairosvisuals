'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { PhoneInput } from '@/components/ui/phone-input';
import { ArrowLeft, Search, UserPlus, Loader2, Users, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Client } from '@/app/solicitudes/_hooks/useQuoteBuilder';

interface ClientSelectorViewProps {
  allClients: Client[];
  clientSearch: string;
  newClient: { firstName: string; lastName: string; email: string; phone: string; company: string };
  isFormValid: boolean;
  isSaving: boolean;
  onSelectClient: (id: string) => void;
  onSearchChange: (val: string) => void;
  onNewClientChange: (field: string, val: string) => void;
  onCreateClient: () => void;
}

export function ClientSelectorView({
  allClients,
  clientSearch,
  newClient,
  isFormValid,
  isSaving,
  onSelectClient,
  onSearchChange,
  onNewClientChange,
  onCreateClient,
}: ClientSelectorViewProps) {
  const filtered = allClients.filter(c => {
    const q = clientSearch.toLowerCase();
    return (
      c.name?.toLowerCase().includes(q) ||
      c.contactEmail?.toLowerCase().includes(q) ||
      c.company?.toLowerCase().includes(q) ||
      c.phone?.includes(q)
    );
  });

  return (
    <div className="min-h-screen pb-8">
      {/* Back nav */}
      <div className="flex items-center gap-2 mb-6">
        <Button asChild variant="ghost" size="sm" className="h-8 px-2 gap-1.5 text-muted-foreground">
          <Link href="/solicitudes">
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline text-xs">Propuestas</span>
          </Link>
        </Button>
        <span className="text-muted-foreground/40">/</span>
        <span className="text-sm font-medium">Nueva Propuesta</span>
      </div>

      <div className="mb-6">
        <h2 className="text-xl sm:text-2xl font-bold font-headline">¿Para quién es la propuesta?</h2>
        <p className="text-sm text-muted-foreground mt-1">Selecciona un cliente existente o regístralo rápidamente.</p>
      </div>

      {/* Two-panel layout: stacks on mobile, side-by-side on md+ */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 items-start">

        {/* Panel 1: Client search list */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" />
              Clientes Registrados
            </CardTitle>
            <CardDescription className="text-xs">{allClients.length} clientes disponibles</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {/* Search bar */}
            <div className="px-4 pb-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  id="client-search-input"
                  placeholder="Buscar por nombre, email, empresa..."
                  value={clientSearch}
                  onChange={e => onSearchChange(e.target.value)}
                  className="pl-8 h-9 text-sm"
                />
              </div>
            </div>

            <Separator />

            <ScrollArea className="h-72 sm:h-80">
              <div className="p-2">
                {filtered.length === 0 && (
                  <p className="py-8 text-center text-xs text-muted-foreground">
                    {clientSearch ? 'Sin resultados.' : 'No hay clientes registrados.'}
                  </p>
                )}
                {filtered.map(client => (
                  <button
                    key={client.id}
                    id={`client-option-${client.id}`}
                    onClick={() => onSelectClient(client.id)}
                    className="w-full text-left flex items-center justify-between gap-3 rounded-lg px-3 py-2.5 transition-colors hover:bg-muted focus:outline-none focus:bg-muted"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate">{client.name}</p>
                      {client.company && (
                        <p className="text-xs text-muted-foreground truncate">{client.company}</p>
                      )}
                      <p className="text-xs text-muted-foreground truncate">{client.contactEmail}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      {client.hasActivePlan && (
                        <Badge variant="secondary" className="text-[9px] h-4 px-1.5 text-green-600 bg-green-500/10">
                          <CheckCircle2 className="h-2.5 w-2.5 mr-0.5" /> Plan Activo
                        </Badge>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Panel 2: Quick create client */}
        <Card className={cn('border-dashed border-primary/30')}>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <UserPlus className="h-4 w-4 text-primary" />
              Nuevo Cliente Rápido
            </CardTitle>
            <CardDescription className="text-xs">
              Registra al cliente sin salir del flujo de propuesta.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="nc-firstName" className="text-xs">Nombre *</Label>
                <Input
                  id="nc-firstName"
                  value={newClient.firstName}
                  onChange={e => onNewClientChange('firstName', e.target.value)}
                  placeholder="Ej: María"
                  className="h-9 text-sm"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="nc-lastName" className="text-xs">Apellidos *</Label>
                <Input
                  id="nc-lastName"
                  value={newClient.lastName}
                  onChange={e => onNewClientChange('lastName', e.target.value)}
                  placeholder="Ej: Rodríguez"
                  className="h-9 text-sm"
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label htmlFor="nc-phone" className="text-xs">Teléfono *</Label>
              <PhoneInput
                id="nc-phone"
                value={newClient.phone}
                onChange={(val: string) => onNewClientChange('phone', val)}
                defaultCountry="CR"
                className="h-9 text-sm"
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="nc-email" className="text-xs">Email <span className="text-muted-foreground">(opcional)</span></Label>
              <Input
                id="nc-email"
                type="email"
                value={newClient.email}
                onChange={e => onNewClientChange('email', e.target.value)}
                placeholder="cliente@correo.com"
                className="h-9 text-sm"
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="nc-company" className="text-xs">Empresa <span className="text-muted-foreground">(opcional)</span></Label>
              <Input
                id="nc-company"
                value={newClient.company}
                onChange={e => onNewClientChange('company', e.target.value)}
                placeholder="Ej: Distribuidora ABC"
                className="h-9 text-sm"
              />
            </div>

            <Button
              id="btn-create-client"
              onClick={onCreateClient}
              disabled={!isFormValid || isSaving}
              className="w-full gap-2 mt-1"
            >
              {isSaving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <UserPlus className="h-4 w-4" />
              )}
              Registrar y Continuar
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
