'use client';

import { useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Edit, Trash2, Layers, ExternalLink } from 'lucide-react';
import { PredefinedPlan, ProductOrService } from '@/lib/types';
import { formatCurrency } from '@/lib/utils';

interface Props {
  plans: PredefinedPlan[];
  services: ProductOrService[] | undefined | null;
  calculatePlanTotal: (items: PredefinedPlan['items']) => number;
  onDelete: (id: string) => void;
}

export function PlansTab({ plans, services, calculatePlanTotal, onDelete }: Props) {
  const router = useRouter();

  return (
    <>
      {/* ── Desktop Table ─────────────────────────────────────────────────── */}
      <div className="hidden sm:block rounded-md border bg-card">
        <table className="w-full">
          <thead>
            <tr className="border-b text-left text-xs font-bold uppercase tracking-wider text-muted-foreground">
              <th className="px-4 py-3">Plan</th>
              <th className="px-4 py-3">Descripción</th>
              <th className="px-4 py-3 text-center">Servicios</th>
              <th className="px-4 py-3 text-right">Total</th>
              <th className="px-4 py-3 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {plans.map(plan => (
              <tr key={plan.id} className="hover:bg-muted/30 transition-colors">
                <td className="px-4 py-3">
                  <div>
                    <p className="font-bold text-sm">{plan.name}</p>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-widest">Plan Predeterminado</p>
                  </div>
                </td>
                <td className="px-4 py-3 text-xs text-muted-foreground max-w-[280px] line-clamp-2">
                  {plan.description}
                </td>
                <td className="px-4 py-3">
                  <ServiceAvatars plan={plan} services={services} />
                </td>
                <td className="px-4 py-3 text-right font-bold text-primary">
                  {formatCurrency(calculatePlanTotal(plan.items))}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-1">
                    <Button variant="ghost" size="icon" onClick={() => router.push(`/services/plans/${plan.id}/edit`)}>
                      <Edit className="h-4 w-4 text-muted-foreground" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => onDelete(plan.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ── Mobile Cards ──────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-3 sm:hidden">
        {plans.map(plan => (
          <div key={plan.id} className="rounded-xl border bg-card p-4 space-y-3 shadow-sm">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="font-bold text-sm truncate">{plan.name}</p>
                <p className="text-[10px] text-muted-foreground uppercase tracking-widest mt-0.5">
                  Plan Predeterminado
                </p>
              </div>
              <div className="flex gap-1 shrink-0">
                <Button
                  variant="ghost" size="icon" className="h-8 w-8"
                  onClick={() => router.push(`/services/plans/${plan.id}/edit`)}
                >
                  <Edit className="h-3.5 w-3.5 text-muted-foreground" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onDelete(plan.id)}>
                  <Trash2 className="h-3.5 w-3.5 text-destructive" />
                </Button>
              </div>
            </div>

            {plan.description && (
              <p className="text-xs text-muted-foreground line-clamp-2">{plan.description}</p>
            )}

            <div className="flex items-center justify-between gap-2 pt-1 border-t border-border/50">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 text-xs">
                  <Layers className="w-3 h-3 mr-1" />
                  {plan.items.length} {plan.items.length === 1 ? 'servicio' : 'servicios'}
                </Badge>
                <ServiceAvatars plan={plan} services={services} />
              </div>
              <span className="font-black text-base text-primary">
                {formatCurrency(calculatePlanTotal(plan.items))}
              </span>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

function ServiceAvatars({ plan, services }: {
  plan: PredefinedPlan;
  services: ProductOrService[] | undefined | null;
}) {
  return (
    <div className="flex items-center justify-center">
      <div className="flex -space-x-2">
        {plan.items.slice(0, 3).map((item, i) => {
          const s = services?.find(sv => sv.id === item.serviceId);
          return (
            <div
              key={i}
              className="w-6 h-6 rounded-full border-2 border-background flex items-center justify-center text-[9px] font-bold text-white shadow-sm"
              style={{ backgroundColor: s?.color || '#888' }}
              title={s?.name}
            >
              {s?.name?.[0]}
            </div>
          );
        })}
        {plan.items.length > 3 && (
          <div className="flex items-center justify-center w-6 h-6 rounded-full border-2 border-background bg-muted text-[8px] font-medium">
            +{plan.items.length - 3}
          </div>
        )}
      </div>
    </div>
  );
}
