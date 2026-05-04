'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PremiumDatePicker } from '@/components/ui/premium-date-picker';
import { Package, Layers, Info } from 'lucide-react';
import type { Client } from '@/app/solicitudes/_hooks/useQuoteBuilder';

interface DocumentDetailsSectionProps {
  details: { title: string; validityDays: number; notes: string; startDate: string };
  contractType: 'one_time' | 'recurring';
  isPlanUpdate: boolean;
  isReadOnly: boolean;
  clientData: Client | null;
  startDateOptions: { label: string; value: string }[];
  onDetailsChange: (field: string, value: any) => void;
  onContractTypeChange: (val: 'one_time' | 'recurring') => void;
  onPlanUpdateChange: (val: boolean) => void;
}

export function DocumentDetailsSection({
  details,
  contractType,
  isPlanUpdate,
  isReadOnly,
  clientData,
  startDateOptions,
  onDetailsChange,
  onContractTypeChange,
  onPlanUpdateChange,
}: DocumentDetailsSectionProps) {
  return (
    <Card className="mb-4 sm:mb-6">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm sm:text-base">Detalles del Documento</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Row 1: Title + Validity + Contract type — stacks on mobile */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Title */}
          <div className="space-y-1.5 sm:col-span-2 lg:col-span-1">
            <Label htmlFor="doc-title" className="text-xs font-semibold">Título de la Propuesta</Label>
            <Input
              id="doc-title"
              value={details.title}
              onChange={e => onDetailsChange('title', e.target.value)}
              placeholder="Ej. Paquete de Redes Sociales"
              disabled={isReadOnly}
              className="h-9 text-sm"
            />
          </div>

          {/* Validity */}
          <div className="space-y-1.5">
            <Label htmlFor="doc-validity" className="text-xs font-semibold">Días de Validez</Label>
            <Input
              id="doc-validity"
              type="number"
              min="1"
              value={details.validityDays}
              onChange={e => onDetailsChange('validityDays', parseInt(e.target.value) || 0)}
              disabled={isReadOnly}
              className="h-9 text-sm"
            />
          </div>

          {/* Contract type */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">Tipo de Contrato</Label>
            <Tabs
              value={contractType}
              onValueChange={val => onContractTypeChange(val as 'one_time' | 'recurring')}
            >
              <TabsList className="grid w-full grid-cols-2 h-9">
                <TabsTrigger value="one_time" className="text-xs gap-1.5" disabled={isReadOnly}>
                  <Package className="h-3 w-3" /> Único
                </TabsTrigger>
                <TabsTrigger value="recurring" className="text-xs gap-1.5" disabled={isReadOnly}>
                  <Layers className="h-3 w-3" /> Mensual
                </TabsTrigger>
              </TabsList>
            </Tabs>
            <p className="text-[10px] text-muted-foreground px-0.5">
              {contractType === 'recurring'
                ? '🔄 Reinicia mensual. Acceso completo al portal.'
                : '✨ Pago único. Aparece solo este mes.'}
            </p>
          </div>
        </div>

        {/* Active plan alert */}
        {contractType === 'recurring' && clientData?.hasActivePlan && (
          <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-amber-700 dark:text-amber-400 text-xs">
            <p className="font-bold flex items-center gap-1.5 mb-2">
              <Info className="h-3.5 w-3.5 shrink-0" />
              Este cliente ya tiene un plan activo.
            </p>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                id="chk-plan-update"
                className="h-4 w-4 rounded border-amber-500/50 accent-amber-500"
                checked={isPlanUpdate}
                onChange={e => onPlanUpdateChange(e.target.checked)}
                disabled={isReadOnly}
              />
              <span>Marcar como actualización del plan existente</span>
            </label>
            <p className="mt-1 pl-6 opacity-70 text-[10px]">
              Las actualizaciones previenen el cobro del 50% de onboarding.
            </p>
          </div>
        )}

        {/* Start date — full width row */}
        <div className="space-y-1.5">
          <Label
            className={`text-xs font-semibold ${contractType === 'recurring' ? 'text-primary' : ''}`}
          >
            {contractType === 'recurring' ? 'Fecha de Inicio del Ciclo *' : 'Fecha del Servicio'}
          </Label>

          {contractType === 'recurring' ? (
            <div className="space-y-1">
              <Select
                value={details.startDate}
                onValueChange={val => onDetailsChange('startDate', val)}
                disabled={isReadOnly}
              >
                <SelectTrigger
                  id="select-start-date"
                  className={`h-9 text-sm ${contractType === 'recurring' && !details.startDate
                    ? 'border-destructive ring-1 ring-destructive/20'
                    : ''}`}
                >
                  <SelectValue placeholder="Seleccionar inicio de ciclo..." />
                </SelectTrigger>
                <SelectContent>
                  {startDateOptions.map(opt => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-[10px] text-muted-foreground">
                Solo días 1 o 16 para alineación de ciclos quincenales.
              </p>
            </div>
          ) : (
            <PremiumDatePicker
              date={details.startDate ? new Date(details.startDate) : undefined}
              onSelect={date => onDetailsChange('startDate', date ? date.toISOString().split('T')[0] : '')}
              placeholder="Sin fecha definida"
              disabled={isReadOnly}
            />
          )}
        </div>

        {/* Notes */}
        <div className="space-y-1.5">
          <Label htmlFor="doc-notes" className="text-xs font-semibold">
            Términos y Notas Visibles
          </Label>
          <Textarea
            id="doc-notes"
            value={details.notes}
            onChange={e => onDetailsChange('notes', e.target.value)}
            placeholder="Ej. Condiciones de pago, alcances del proyecto..."
            className="h-20 text-sm resize-none"
            disabled={isReadOnly}
          />
          <p className="text-[10px] text-muted-foreground flex items-center gap-1">
            <Info className="h-3 w-3" /> Este mensaje aparecerá al pie del PDF.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
