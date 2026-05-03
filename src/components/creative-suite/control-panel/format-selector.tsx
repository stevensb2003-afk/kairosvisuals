'use client';

import { OutputFormat } from '../hooks/useVisionEngine';
import { cn } from '@/lib/utils';
import { Plus, Minus } from 'lucide-react';

const FORMATS: { id: OutputFormat; label: string }[] = [
  { id: 'post', label: 'Post Único' },
  { id: 'carousel', label: 'Carrusel' },
  { id: 'reel_cover', label: 'Portada Reel' },
];

interface FormatSelectorProps {
  value: OutputFormat;
  onChange: (format: OutputFormat) => void;
  slideCount?: number;
  onSlideCountChange?: (count: number) => void;
}

export function FormatSelector({ value, onChange, slideCount = 5, onSlideCountChange }: FormatSelectorProps) {
  return (
    <div className="space-y-4">
      <div className="space-y-2.5">
        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/60">
          Objetivo del Diseño
        </label>
        <div className="grid grid-cols-3 gap-2">
          {FORMATS.map((f) => (
            <button
              key={f.id}
              onClick={() => onChange(f.id)}
              className={cn(
                'py-3 rounded-2xl text-[9px] font-black uppercase tracking-wider border transition-all duration-200 active:scale-95',
                value === f.id
                  ? 'bg-[#FF5C2B] text-[#0A1A26] border-[#FF5C2B] shadow-lg shadow-[#FF5C2B]/20'
                  : 'bg-white/5 text-stone-400 border-white/10 hover:border-[#FF5C2B] hover:text-[#FF5C2B]'
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {value === 'carousel' && onSlideCountChange && (
        <div className="space-y-3 p-4 bg-black/20 rounded-2xl border border-white/5">
          <div className="flex items-center justify-between">
            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/60">
              Cantidad de Páginas
            </label>
            <div className="flex items-center gap-4 bg-white/5 p-1 rounded-xl border border-white/10">
              <button
                onClick={() => onSlideCountChange(Math.max(3, slideCount - 1))}
                disabled={slideCount <= 3}
                className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/5 border border-white/10 hover:bg-[#FF5C2B]/20 hover:text-[#FF5C2B] disabled:opacity-30 disabled:cursor-not-allowed transition-all active:scale-90"
              >
                <Minus size={14} strokeWidth={3} />
              </button>
              
              <span className="text-[#FF5C2B] font-black text-sm min-w-[1.5rem] text-center">
                {slideCount}
              </span>

              <button
                onClick={() => onSlideCountChange(Math.min(10, slideCount + 1))}
                disabled={slideCount >= 10}
                className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/5 border border-white/10 hover:bg-[#FF5C2B]/20 hover:text-[#FF5C2B] disabled:opacity-30 disabled:cursor-not-allowed transition-all active:scale-90"
              >
                <Plus size={14} strokeWidth={3} />
              </button>
            </div>
          </div>
          <p className="text-[9px] text-white/40 italic">
            Define cuántas slides tendrá la narrativa del carrusel (3 a 10).
          </p>
        </div>
      )}
    </div>
  );
}
