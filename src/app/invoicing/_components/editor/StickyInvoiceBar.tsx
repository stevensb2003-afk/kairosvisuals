'use client';

import React from 'react';
import { Save, CheckCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/utils';

interface StickyInvoiceBarProps {
  totalAmount: number;
  isSaving: boolean;
  canSave: boolean;
  isEditing: boolean;
  onSaveDraft: () => void;
  onConfirm: () => void;
}

export function StickyInvoiceBar({
  totalAmount,
  isSaving,
  canSave,
  isEditing,
  onSaveDraft,
  onConfirm,
}: StickyInvoiceBarProps) {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 sm:hidden border-t border-border/50 bg-background/95 backdrop-blur-md px-4 pt-3 pb-5 flex items-center gap-3 shadow-2xl">
      {/* Running total */}
      <div className="flex-1 min-w-0">
        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground leading-none mb-0.5">Total</p>
        <p className="text-2xl font-black text-primary tabular-nums tracking-tight truncate">
          {formatCurrency(totalAmount)}
        </p>
      </div>

      {/* Draft save */}
      <Button
        variant="outline"
        size="sm"
        onClick={onSaveDraft}
        disabled={isSaving || !canSave}
        className="h-12 px-4 shrink-0 rounded-xl"
      >
        {isSaving
          ? <Loader2 className="w-4 h-4 animate-spin" />
          : <Save className="w-4 h-4" />
        }
      </Button>

      {/* Confirm / emit */}
      <Button
        size="sm"
        onClick={onConfirm}
        disabled={isSaving || !canSave}
        className="h-12 px-5 shrink-0 rounded-xl font-bold"
      >
        {isSaving
          ? <Loader2 className="w-4 h-4 animate-spin mr-1.5" />
          : <CheckCircle className="w-4 h-4 mr-1.5" />
        }
        {isEditing ? 'Guardar' : 'Emitir'}
      </Button>
    </div>
  );
}
