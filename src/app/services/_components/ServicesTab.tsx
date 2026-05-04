'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Edit, Trash2, Gem } from 'lucide-react';
import { ProductOrService } from '@/lib/types';
import { formatCurrency } from '@/lib/utils';

interface Props {
  services: ProductOrService[];
  onEdit: (s: ProductOrService) => void;
  onDelete: (id: string) => void;
}

const getPricingBadge = (model: string) => {
  const map: Record<string, [string, string]> = {
    fixed: ['bg-blue-500/10 text-blue-600', 'Fijo'],
    scalable: ['bg-purple-500/10 text-purple-600', 'Escalable'],
    package: ['bg-orange-500/10 text-orange-600', 'Paquete'],
  };
  const [cls, label] = map[model] ?? ['', model];
  return <Badge variant="outline" className={cls}>{label}</Badge>;
};

export function ServicesTab({ services, onEdit, onDelete }: Props) {
  return (
    <>
      {/* ── Desktop Table (hidden on mobile) ─────────────────────────────── */}
      <div className="hidden sm:block rounded-md border bg-card">
        <table className="w-full">
          <thead>
            <tr className="border-b text-left text-xs font-bold uppercase tracking-wider text-muted-foreground">
              <th className="px-4 py-3">Servicio</th>
              <th className="px-4 py-3">Modelo</th>
              <th className="px-4 py-3">Unidad</th>
              <th className="px-4 py-3 text-right">Precio Base</th>
              <th className="px-4 py-3 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {services.map(s => (
              <tr key={s.id} className="hover:bg-muted/30 transition-colors">
                <td className="px-4 py-3">
                  <div className="flex flex-col gap-0.5">
                    <div className="flex items-center gap-2">
                      {s.color && <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: s.color }} />}
                      <span className="font-medium text-sm">{s.name}</span>
                      {s.useComplexityMatrix && (
                        <Badge variant="outline" className="text-[9px] py-0 px-1 border-primary/30 text-primary h-4">
                          <Gem className="w-2.5 h-2.5 mr-0.5" />Matriz
                        </Badge>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground line-clamp-1">{s.description}</span>
                  </div>
                </td>
                <td className="px-4 py-3">{getPricingBadge(s.pricingModel)}</td>
                <td className="px-4 py-3 capitalize text-sm">{s.unitType}</td>
                <td className="px-4 py-3 text-right">
                  <ServicePriceCell service={s} />
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-1">
                    <Button variant="ghost" size="icon" onClick={() => onEdit(s)}>
                      <Edit className="h-4 w-4 text-muted-foreground" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => onDelete(s.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ── Mobile Cards (hidden on sm+) ──────────────────────────────────── */}
      <div className="flex flex-col gap-3 sm:hidden">
        {services.map(s => (
          <div key={s.id} className="rounded-xl border bg-card p-4 space-y-3 shadow-sm">
            {/* Top: color dot + name + badge */}
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                {s.color && (
                  <div className="w-3 h-3 rounded-full shrink-0 mt-0.5" style={{ backgroundColor: s.color }} />
                )}
                <div className="min-w-0">
                  <p className="font-semibold text-sm truncate">{s.name}</p>
                  {s.description && (
                    <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{s.description}</p>
                  )}
                </div>
              </div>
              <div className="flex gap-1 shrink-0">
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onEdit(s)}>
                  <Edit className="h-3.5 w-3.5 text-muted-foreground" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onDelete(s.id)}>
                  <Trash2 className="h-3.5 w-3.5 text-destructive" />
                </Button>
              </div>
            </div>

            {/* Bottom: metadata row */}
            <div className="flex items-center gap-2 flex-wrap">
              {getPricingBadge(s.pricingModel)}
              <Badge variant="secondary" className="text-xs capitalize">{s.unitType}</Badge>
              {s.useComplexityMatrix && (
                <Badge variant="outline" className="text-[9px] border-primary/30 text-primary">
                  <Gem className="w-2.5 h-2.5 mr-0.5" />Matriz
                </Badge>
              )}
              <span className="ml-auto font-bold text-sm text-primary">
                <ServicePriceCell service={s} />
              </span>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

function ServicePriceCell({ service: s }: { service: ProductOrService }) {
  if (s.pricingModel === 'package' && s.packages?.length) {
    return (
      <div className="flex flex-col gap-0.5 items-end">
        <Badge variant="secondary" className="text-[9px] mb-0.5">
          {s.packages.length} opciones
        </Badge>
        {s.packages.map((pkg, i) => (
          <span key={i} className="text-xs">{pkg.name}: {formatCurrency(pkg.price)}</span>
        ))}
      </div>
    );
  }
  return (
    <div className="flex flex-col items-end gap-0.5">
      <span className="font-medium text-sm">{formatCurrency(s.basePrice)}</span>
      {s.pricingModel === 'scalable' && s.unitPrice && (
        <span className="text-[10px] text-muted-foreground">+{formatCurrency(s.unitPrice)}/extra</span>
      )}
      {s.useComplexityMatrix && (
        <span className="text-[10px] text-muted-foreground italic">
          +hasta {formatCurrency(Math.max(...(s.complexityTiers?.map(t => t.surcharge) || [0])))} (complejidad)
        </span>
      )}
    </div>
  );
}
