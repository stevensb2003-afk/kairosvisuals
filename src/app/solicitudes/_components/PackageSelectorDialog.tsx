'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Package } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import type { ProductOrService } from '@/lib/types';

interface PackageSelectorDialogProps {
  isOpen: boolean;
  onClose: () => void;
  service: ProductOrService | null;
  itemId: string | null;
  onSelectPackage: (itemId: string, packageName: string, price: number) => void;
}

export function PackageSelectorDialog({
  isOpen,
  onClose,
  service,
  itemId,
  onSelectPackage,
}: PackageSelectorDialogProps) {
  if (!service || !itemId) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-sm sm:max-w-md mx-4 sm:mx-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base sm:text-lg">
            <Package className="h-4 w-4 text-primary" />
            Seleccionar Paquete
          </DialogTitle>
          <DialogDescription className="text-xs sm:text-sm">
            {service.name}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-2 pt-2">
          {(service.packages || []).map((pkg) => (
            <button
              key={pkg.name}
              id={`pkg-option-${pkg.name.replace(/\s+/g, '-').toLowerCase()}`}
              onClick={() => {
                onSelectPackage(itemId, pkg.name, pkg.price);
                onClose();
              }}
              className="flex items-center justify-between rounded-lg border border-border p-3 sm:p-4 text-left transition-colors hover:border-primary/50 hover:bg-primary/5 focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <div className="flex flex-col gap-0.5">
                <span className="font-semibold text-sm">{pkg.name}</span>
                {(pkg as any).description && (
                  <span className="text-xs text-muted-foreground line-clamp-2">{(pkg as any).description}</span>
                )}
              </div>
              <Badge variant="secondary" className="ml-3 shrink-0 text-sm font-bold">
                {formatCurrency(pkg.price)}
              </Badge>
            </button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
