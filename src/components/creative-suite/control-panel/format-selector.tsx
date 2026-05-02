'use client';

import { OutputFormat } from '../hooks/useVisionEngine';
import { cn } from '@/lib/utils';

const FORMATS: { id: OutputFormat; label: string }[] = [
  { id: 'post', label: 'Post Único' },
  { id: 'carousel', label: 'Carrusel' },
  { id: 'reel_cover', label: 'Portada Reel' },
];

interface FormatSelectorProps {
  value: OutputFormat;
  onChange: (format: OutputFormat) => void;
}

export function FormatSelector({ value, onChange }: FormatSelectorProps) {
  return (
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
  );
}
