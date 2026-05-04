'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Layers } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import type { PredefinedPlan } from '@/lib/types';

interface PlanLoaderDialogProps {
  isOpen: boolean;
  onClose: () => void;
  plans: PredefinedPlan[];
  onLoadPlan: (planId: string) => void;
}

export function PlanLoaderDialog({ isOpen, onClose, plans, onLoadPlan }: PlanLoaderDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-sm sm:max-w-lg mx-4 sm:mx-auto flex flex-col max-h-[90dvh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base sm:text-lg">
            <Layers className="h-4 w-4 text-primary" />
            Cargar Plan Predefinido
          </DialogTitle>
          <DialogDescription className="text-xs sm:text-sm">
            Selecciona un plan para añadir sus ítems a la propuesta actual.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 -mx-6 px-6">
          <div className="grid gap-3 pb-4">
            {plans.length === 0 && (
              <p className="py-8 text-center text-sm text-muted-foreground">
                No hay planes predefinidos creados aún.
              </p>
            )}
            {plans.map((plan) => {
              const planTotal = (plan.items || []).reduce((acc: number, item: any) => {
                return acc + (item.overridePrice || 0) * (item.quantity || 1);
              }, 0);

              return (
                <div
                  key={plan.id}
                  className="rounded-lg border border-border p-3 sm:p-4 transition-colors hover:border-primary/40 hover:bg-primary/5"
                >
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm truncate">{plan.name}</p>
                      {plan.description && (
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{plan.description}</p>
                      )}
                    </div>
                    {planTotal > 0 && (
                      <Badge variant="secondary" className="shrink-0 text-xs font-bold">
                        {formatCurrency(planTotal)}
                      </Badge>
                    )}
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs text-muted-foreground">
                      {plan.items?.length || 0} ítem{plan.items?.length !== 1 ? 's' : ''}
                    </span>
                    <Button
                      id={`btn-load-plan-${plan.id}`}
                      size="sm"
                      variant="outline"
                      className="h-7 text-xs"
                      onClick={() => onLoadPlan(plan.id)}
                    >
                      Cargar Plan
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
