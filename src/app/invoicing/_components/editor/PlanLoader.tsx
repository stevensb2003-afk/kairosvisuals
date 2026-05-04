import React, { useState, useMemo } from 'react';
import { Zap, Search, Package } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';

interface PlanLoaderProps {
  isOpen: boolean;
  onClose: () => void;
  plans: any[] | undefined;
  onSelect: (id: string) => void;
}

export function PlanLoader({
  isOpen,
  onClose,
  plans,
  onSelect
}: PlanLoaderProps) {
  const [search, setSearch] = useState('');

  const filteredPlans = useMemo(() => {
    if (!plans) return [];
    return plans.filter(p =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.description.toLowerCase().includes(search.toLowerCase())
    );
  }, [plans, search]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-primary fill-current" />
            Cargar Plan Predeterminado
          </DialogTitle>
          <DialogDescription>
            Selecciona un plan para añadir automáticamente todos sus servicios a la factura actual.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar planes por nombre o descripción..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>

          <ScrollArea className="h-[350px] pr-4">
            <div className="grid grid-cols-1 gap-3">
              {filteredPlans.length > 0 ? (
                filteredPlans.map((plan) => (
                  <Button
                    key={plan.id}
                    variant="outline"
                    className="flex flex-col items-start h-auto p-4 gap-2 hover:border-primary hover:bg-primary/5 transition-all text-left group"
                    onClick={() => onSelect(plan.id)}
                  >
                    <div className="flex justify-between items-start w-full">
                      <span className="font-bold text-base group-hover:text-primary">{plan.name}</span>
                      <Badge variant="secondary" className="bg-primary/10 text-primary border-none">
                        {plan.items.length} ítems
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2">{plan.description}</p>
                    <div className="flex gap-2 mt-1">
                      {plan.items.slice(0, 3).map((item: any, idx: number) => (
                        <Badge key={idx} variant="outline" className="text-[9px] font-normal py-0 px-1.5 opacity-70">
                          {item.quantity}x de catálogo
                        </Badge>
                      ))}
                      {plan.items.length > 3 && (
                        <span className="text-[9px] text-muted-foreground">+{plan.items.length - 3} más</span>
                      )}
                    </div>
                  </Button>
                ))
              ) : (
                <div className="text-center py-12 border-2 border-dashed rounded-xl">
                  <Package className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">No se encontraron planes que coincidan.</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>Cancelar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
