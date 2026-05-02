'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Check, Pencil } from 'lucide-react';
import { cn } from '@/lib/utils';

interface InlineTextFieldProps {
  value: string;
  onSave: (newValue: string) => Promise<void>;
  placeholder?: string;
  multiline?: boolean;
  rows?: number;
  className?: string;
  displayClassName?: string;
  emptyLabel?: string;
}

export function InlineTextField({
  value,
  onSave,
  placeholder = 'Click para editar...',
  multiline = false,
  rows = 3,
  className,
  displayClassName,
  emptyLabel = 'Sin definir',
}: InlineTextFieldProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const [isSaving, setIsSaving] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [saveError, setSaveError] = useState(false);
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);

  useEffect(() => { setDraft(value); }, [value]);

  useEffect(() => {
    if (isEditing) inputRef.current?.focus();
  }, [isEditing]);

  const handleSave = async () => {
    if (draft === value) { setIsEditing(false); return; }
    setIsSaving(true);
    setSaveError(false);
    try {
      await onSave(draft);
      setShowConfirm(true);
      setTimeout(() => setShowConfirm(false), 1500);
      setIsEditing(false);
    } catch (err) {
      console.error('InlineTextField: failed to save', err);
      setSaveError(true);
      setTimeout(() => setSaveError(false), 3000);
      // Keep editing open so user doesn't lose their draft
    } finally {
      setIsSaving(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !multiline) { e.preventDefault(); handleSave(); }
    if (e.key === 'Escape') { setDraft(value); setIsEditing(false); }
  };

  const sharedInputClass = cn(
    'w-full bg-primary/5 border border-primary/20 rounded-xl px-3 py-2',
    'text-foreground/90 focus:outline-none focus:ring-2 focus:ring-primary/30',
    'transition-all duration-200 resize-none',
    className
  );

  if (isEditing) {
    return (
      <div className="relative group/field">
        {multiline ? (
          <textarea
            ref={inputRef as React.RefObject<HTMLTextAreaElement>}
            value={draft}
            onChange={e => setDraft(e.target.value)}
            onBlur={handleSave}
            onKeyDown={handleKeyDown}
            rows={rows}
            placeholder={placeholder}
            className={cn(sharedInputClass, 'leading-relaxed text-base')}
          />
        ) : (
          <input
            ref={inputRef as React.RefObject<HTMLInputElement>}
            value={draft}
            onChange={e => setDraft(e.target.value)}
            onBlur={handleSave}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={isSaving}
            className={cn(sharedInputClass, 'h-10 text-base')}
          />
        )}
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setIsEditing(true)}
      className={cn(
        'relative w-full text-left group/field rounded-xl px-3 py-2',
        'hover:bg-primary/5 border border-transparent hover:border-primary/15',
        'transition-all duration-200 cursor-text',
        displayClassName
      )}
    >
      {value ? (
        <span className={cn('text-foreground/90 leading-relaxed', multiline ? 'text-base whitespace-pre-wrap' : 'text-base')}>
          {value}
        </span>
      ) : (
        <span className="text-muted-foreground/40 italic text-sm">{emptyLabel}</span>
      )}

      {/* Hover Edit indicator */}
      <span className="absolute top-2 right-2 opacity-0 group-hover/field:opacity-100 transition-opacity duration-200">
        {showConfirm ? (
          <Check className="w-3.5 h-3.5 text-emerald-500" />
        ) : saveError ? (
          <span className="text-[10px] font-bold text-destructive">Error</span>
        ) : (
          <Pencil className="w-3 h-3 text-primary/40" />
        )}
      </span>
    </button>
  );
}
