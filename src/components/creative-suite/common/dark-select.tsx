'use client';

import * as React from 'react';
import * as SelectPrimitive from '@radix-ui/react-select';
import { Check, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

const NONE_SENTINEL = '__none__';

interface Option {
  id: string;
  label: string;
  emoji?: string;
}

interface DarkSelectProps {
  value: string | null;
  onChange: (value: string) => void;
  options: Option[];
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export function DarkSelect({
  value,
  onChange,
  options,
  placeholder = 'Seleccionar...',
  className,
  disabled,
}: DarkSelectProps) {
  // Radix forbids value="". Map '' → NONE_SENTINEL internally.
  const toRadix = (v: string | null) => (!v ? NONE_SENTINEL : v);
  const fromRadix = (v: string) => (v === NONE_SENTINEL ? '' : v);

  const radixValue = toRadix(value);
  const selectedOption = options.find((o) => o.id === value);

  return (
    <SelectPrimitive.Root
      value={radixValue}
      onValueChange={(v) => onChange(fromRadix(v))}
      disabled={disabled}
    >
      <SelectPrimitive.Trigger
        className={cn(
          'group w-full flex items-center justify-between gap-3 px-4 py-3 rounded-2xl border transition-all text-left outline-none',
          'bg-white/[0.03] border-white/10 text-[12px]',
          'hover:border-white/20 hover:bg-white/[0.05]',
          'focus:border-[#FF5C2B]/50 focus:bg-white/5 focus:shadow-lg focus:shadow-[#FF5C2B]/5',
          'data-[state=open]:border-[#FF5C2B]/50 data-[state=open]:bg-white/5 data-[state=open]:shadow-lg data-[state=open]:shadow-[#FF5C2B]/5',
          'disabled:opacity-40 disabled:cursor-not-allowed',
          className
        )}
      >
        <div className="flex items-center gap-2 truncate min-w-0">
          {selectedOption?.emoji && (
            <span className="text-base shrink-0 leading-none">{selectedOption.emoji}</span>
          )}
          <span className={cn('truncate', selectedOption ? 'text-white/90' : 'text-white/35')}>
            {selectedOption ? selectedOption.label : placeholder}
          </span>
        </div>
        <SelectPrimitive.Icon asChild>
          <ChevronDown className="w-4 h-4 shrink-0 text-white/20 group-data-[state=open]:rotate-180 group-data-[state=open]:text-[#FF5C2B] transition-all duration-200" />
        </SelectPrimitive.Icon>
      </SelectPrimitive.Trigger>

      <SelectPrimitive.Portal>
        <SelectPrimitive.Content
          position="popper"
          sideOffset={6}
          className={cn(
            'z-[200] w-[var(--radix-select-trigger-width)] overflow-hidden',
            'rounded-2xl border border-white/10 bg-[#0A1929] shadow-2xl shadow-black/60',
            'backdrop-blur-2xl',
            'data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95 data-[state=open]:slide-in-from-top-2',
            'data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[state=closed]:slide-out-to-top-2',
            'duration-200'
          )}
        >
          <SelectPrimitive.Viewport className="p-1.5">
            {options.length === 0 ? (
              <div className="px-4 py-3 text-[11px] text-white/25 italic text-center">
                No hay opciones disponibles
              </div>
            ) : (
              options.map((option) => {
                const itemValue = option.id === '' ? NONE_SENTINEL : option.id;
                return (
                  <SelectPrimitive.Item
                    key={itemValue}
                    value={itemValue}
                    className={cn(
                      'relative flex items-center gap-2 px-3 py-2.5 rounded-xl text-[11px] font-medium',
                      'cursor-pointer select-none outline-none transition-all duration-150',
                      'text-white/50',
                      'data-[highlighted]:bg-white/[0.06] data-[highlighted]:text-white',
                      'data-[state=checked]:bg-[#FF5C2B]/10 data-[state=checked]:text-white'
                    )}
                  >
                    {option.emoji && (
                      <span className="text-base shrink-0 leading-none">{option.emoji}</span>
                    )}
                    <SelectPrimitive.ItemText>
                      <span className="truncate">{option.label}</span>
                    </SelectPrimitive.ItemText>
                    <SelectPrimitive.ItemIndicator className="absolute right-3 flex items-center justify-center">
                      <Check className="w-3.5 h-3.5 text-[#FF5C2B]" />
                    </SelectPrimitive.ItemIndicator>
                  </SelectPrimitive.Item>
                );
              })
            )}
          </SelectPrimitive.Viewport>
        </SelectPrimitive.Content>
      </SelectPrimitive.Portal>
    </SelectPrimitive.Root>
  );
}
