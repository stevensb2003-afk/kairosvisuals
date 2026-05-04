'use client';

import React from 'react';
import { SlidersHorizontal, CalendarIcon, Filter, X, Check } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetClose } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { PremiumDatePicker } from '@/components/ui/premium-date-picker';
import { cn } from '@/lib/utils';
import { STATUS_CONFIG } from '../_utils/status';

interface FiltersSheetProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  datePreset: string;
  setDatePreset: (v: string) => void;
  startDate: Date | undefined;
  setStartDate: (d: Date | undefined) => void;
  endDate: Date | undefined;
  setEndDate: (d: Date | undefined) => void;
  statusFilter: string;
  setStatusFilter: (v: string) => void;
  activeFilterCount: number;
  onReset: () => void;
}

const DATE_PRESETS = [
  { value: 'thisWeek',  label: 'Esta Semana' },
  { value: 'thisMonth', label: 'Este Mes' },
  { value: 'thisYear',  label: 'Este Año' },
  { value: 'lastWeek',  label: 'Sem. Pasada' },
  { value: 'lastMonth', label: 'Mes Pasado' },
  { value: 'lastYear',  label: 'Año Anterior' },
];

export function FiltersSheet({
  open, onOpenChange, datePreset, setDatePreset,
  startDate, setStartDate, endDate, setEndDate,
  statusFilter, setStatusFilter, activeFilterCount, onReset,
}: FiltersSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="rounded-t-2xl px-0 pb-0 max-h-[90dvh] overflow-y-auto"
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-2 pb-4 px-6">
          <div className="w-10 h-1 bg-border rounded-full" />
        </div>

        <SheetHeader className="px-6 pb-4">
          <div className="flex items-center justify-between">
            <SheetTitle className="text-xl font-bold flex items-center gap-2">
              <SlidersHorizontal className="w-5 h-5 text-primary" />
              Filtros
            </SheetTitle>
            {activeFilterCount > 0 && (
              <Button variant="ghost" size="sm" className="text-xs text-muted-foreground h-8 gap-1.5" onClick={onReset}>
                <X className="w-3.5 h-3.5" /> Limpiar todo
              </Button>
            )}
          </div>
        </SheetHeader>

        <Separator />

        <div className="px-6 py-5 space-y-6">
          {/* Period presets */}
          <div className="space-y-3">
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Periodo</p>
            <div className="grid grid-cols-3 gap-2">
              {DATE_PRESETS.map(p => (
                <button
                  key={p.value}
                  onClick={() => setDatePreset(p.value)}
                  className={cn(
                    'flex items-center justify-center gap-1.5 text-xs font-semibold py-2.5 px-2 rounded-xl border transition-all',
                    datePreset === p.value
                      ? 'bg-primary text-primary-foreground border-primary shadow-sm shadow-primary/30'
                      : 'bg-card border-border/40 text-foreground hover:border-primary/40'
                  )}
                >
                  {datePreset === p.value && <Check className="w-3 h-3 shrink-0" />}
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Custom date range */}
          <div className="space-y-3">
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Rango personalizado</p>
            <div className="grid grid-cols-2 gap-2">
              <PremiumDatePicker date={startDate} onSelect={(d) => { setStartDate(d); setDatePreset('custom'); }} placeholder="Desde" />
              <PremiumDatePicker date={endDate} onSelect={(d) => { setEndDate(d); setDatePreset('custom'); }} placeholder="Hasta" />
            </div>
          </div>

          <Separator />

          {/* Status */}
          <div className="space-y-3">
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Estado de Factura</p>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setStatusFilter('all')}
                className={cn(
                  'px-3 py-1.5 rounded-full text-xs font-semibold border transition-all',
                  statusFilter === 'all'
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-card border-border/40 text-foreground hover:border-primary/40'
                )}
              >
                Todos
              </button>
              {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
                <button
                  key={key}
                  onClick={() => setStatusFilter(key)}
                  className={cn(
                    'px-3 py-1.5 rounded-full text-xs font-semibold border transition-all flex items-center gap-1.5',
                    statusFilter === key
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-card border-border/40 text-foreground hover:border-primary/40'
                  )}
                >
                  {cfg.icon}
                  {cfg.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="px-6 pb-8 pt-2">
          <SheetClose asChild>
            <Button className="w-full h-12 rounded-xl text-sm font-semibold">
              Ver Resultados {activeFilterCount > 0 && <Badge className="ml-2 bg-white/20 text-white border-0 text-xs">{activeFilterCount}</Badge>}
            </Button>
          </SheetClose>
        </div>
      </SheetContent>
    </Sheet>
  );
}
