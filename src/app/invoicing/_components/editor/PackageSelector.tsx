import React from 'react';
import { Package } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/utils';

interface PackageSelectorProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  service: any;
  activeItemId: string | null;
  onSelectPackage: (id: string, service: any, pkg: any) => void;
}

export function PackageSelector({
  isOpen,
  onOpenChange,
  service,
  activeItemId,
  onSelectPackage
}: PackageSelectorProps) {
  if (!service) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="w-5 h-5 text-primary" />
            Seleccionar Paquete de {service.name}
          </DialogTitle>
          <DialogDescription>
            Elige una de las opciones predefinidas para este servicio.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-3 py-4">
          {service.packages?.map((pkg: any, idx: number) => (
            <Button
              key={idx}
              variant="outline"
              className="justify-between h-auto py-3 px-4 hover:border-primary hover:bg-primary/5 group"
              onClick={() => {
                if (activeItemId) {
                  onSelectPackage(activeItemId, service, pkg);
                }
                onOpenChange(false);
              }}
            >
              <div className="flex flex-col items-start gap-1 text-left">
                <span className="font-bold group-hover:text-primary transition-colors">{pkg.name}</span>
                <span className="text-[10px] text-muted-foreground">{pkg.units} {service.unitType || 'unidades'} incluidas</span>
              </div>
              <span className="font-bold text-primary">{formatCurrency(pkg.price)}</span>
            </Button>
          ))}
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancelar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
