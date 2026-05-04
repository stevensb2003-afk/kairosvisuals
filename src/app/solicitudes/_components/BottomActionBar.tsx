'use client';

import { Button } from '@/components/ui/button';
import { FileText, Save, Share, Loader2 } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

interface BottomActionBarProps {
  totalAmount: number;
  isSaving: boolean;
  isReadOnly: boolean;
  onPreview: () => void;
  onSave: () => void;
  onPublish: () => void;
}

export function BottomActionBar({
  totalAmount,
  isSaving,
  isReadOnly,
  onPreview,
  onSave,
  onPublish,
}: BottomActionBarProps) {
  if (isReadOnly) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-border/50 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-screen-xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
        {/* Total */}
        <div className="hidden sm:flex flex-col">
          <span className="text-[10px] uppercase tracking-widest text-muted-foreground">Total Propuesta</span>
          <span className="text-xl font-bold font-headline text-foreground">
            {formatCurrency(totalAmount)}
          </span>
        </div>

        {/* Mobile: compact total */}
        <div className="flex sm:hidden flex-col">
          <span className="text-[10px] text-muted-foreground">Total</span>
          <span className="text-base font-bold">{formatCurrency(totalAmount)}</span>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <Button
            id="btn-preview-quotation"
            variant="outline"
            size="sm"
            onClick={onPreview}
            className="gap-1.5 text-xs sm:text-sm"
          >
            <FileText className="h-3.5 w-3.5" />
            <span className="hidden xs:inline">Vista Previa</span>
            <span className="inline xs:hidden">Preview</span>
          </Button>

          <Button
            id="btn-save-draft"
            variant="outline"
            size="sm"
            onClick={onSave}
            disabled={isSaving}
            className="gap-1.5 text-xs sm:text-sm"
          >
            {isSaving ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Save className="h-3.5 w-3.5" />
            )}
            <span className="hidden sm:inline">Guardar</span>
          </Button>

          <Button
            id="btn-publish-quotation"
            size="sm"
            onClick={onPublish}
            disabled={isSaving}
            className="gap-1.5 text-xs sm:text-sm bg-primary text-primary-foreground hover:bg-primary/90"
          >
            {isSaving ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Share className="h-3.5 w-3.5" />
            )}
            Publicar
          </Button>
        </div>
      </div>
    </div>
  );
}
