'use client';

import React, { useState, useRef } from 'react';
import { Plus, X, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface InlineTagEditorProps {
  tags: string[];
  onSave: (newTags: string[]) => Promise<void>;
  placeholder?: string;
  emptyLabel?: string;
  tagClassName?: string;
}

export function InlineTagEditor({
  tags,
  onSave,
  placeholder = 'Agregar...',
  emptyLabel = 'Sin etiquetas',
  tagClassName,
}: InlineTagEditorProps) {
  const [inputValue, setInputValue] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const persist = async (updated: string[]) => {
    setIsSaving(true);
    try {
      await onSave(updated);
      setShowConfirm(true);
      setTimeout(() => setShowConfirm(false), 1200);
    } finally {
      setIsSaving(false);
    }
  };

  const handleAdd = async () => {
    const trimmed = inputValue.trim();
    if (!trimmed || tags.includes(trimmed)) { setInputValue(''); return; }
    await persist([...tags, trimmed]);
    setInputValue('');
  };

  const handleRemove = async (tag: string) => {
    await persist(tags.filter(t => t !== tag));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') { e.preventDefault(); handleAdd(); }
    if (e.key === 'Backspace' && !inputValue && tags.length > 0) {
      handleRemove(tags[tags.length - 1]);
    }
  };

  return (
    <div className="space-y-2.5">
      {/* Tag List */}
      <div className="flex flex-wrap gap-2 min-h-[32px]">
        {tags.length > 0 ? (
          tags.map((tag) => (
            <span
              key={tag}
              className={cn(
                'group/tag flex items-center gap-1.5',
                'px-3.5 py-1.5 rounded-full text-sm font-medium',
                'bg-primary/10 border border-primary/20 text-primary',
                'transition-all duration-150 hover:border-primary/40',
                tagClassName
              )}
            >
              {tag}
              <button
                type="button"
                onClick={() => handleRemove(tag)}
                disabled={isSaving}
                className="opacity-0 group-hover/tag:opacity-100 transition-opacity hover:text-destructive ml-0.5 -mr-1"
                aria-label={`Eliminar ${tag}`}
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))
        ) : (
          <span className="text-sm text-muted-foreground/40 italic self-center">{emptyLabel}</span>
        )}

        {/* Confirm flash */}
        {showConfirm && (
          <span className="flex items-center gap-1 text-emerald-500 text-xs font-semibold animate-in fade-in-0 duration-200">
            <Check className="w-3.5 h-3.5" /> Guardado
          </span>
        )}
      </div>

      {/* Input Row */}
      <div className="flex items-center gap-2">
        <input
          ref={inputRef}
          value={inputValue}
          onChange={e => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={isSaving}
          className={cn(
            'flex-1 h-9 px-3 rounded-xl text-sm',
            'bg-primary/5 border border-primary/15',
            'focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary/30',
            'placeholder:text-muted-foreground/40',
            'transition-all duration-200'
          )}
        />
        <button
          type="button"
          onClick={handleAdd}
          disabled={isSaving || !inputValue.trim()}
          className={cn(
            'h-9 w-9 flex items-center justify-center rounded-xl',
            'bg-primary/10 border border-primary/20 text-primary',
            'hover:bg-primary/20 transition-all duration-150',
            'disabled:opacity-40 disabled:cursor-not-allowed'
          )}
          aria-label="Agregar etiqueta"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
