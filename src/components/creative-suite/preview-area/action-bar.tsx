'use client';

import { ClipboardCopy, MessageSquarePlus } from 'lucide-react';

interface ActionBarProps {
  slideCount: number;
  currentIndex: number;
  format: 'post' | 'carousel' | 'reel_cover';
  onCopyCopys: () => void;
  onGenerateCaption: () => void;
}

export function ActionBar({ slideCount, currentIndex, format, onCopyCopys, onGenerateCaption }: ActionBarProps) {
  const label = format === 'carousel' ? 'Slide' : 'Opción';

  return (
    <div className="flex flex-wrap justify-center items-center gap-3 mt-8 lg:mt-10">
      <button
        onClick={onCopyCopys}
        disabled={slideCount === 0}
        className="px-7 py-4 bg-[#FF5C2B] text-white rounded-full shadow-xl text-[10px] font-black uppercase tracking-[0.35em] hover:bg-white hover:text-[#FF5C2B] transition-all flex items-center gap-3 disabled:opacity-40 disabled:cursor-not-allowed active:scale-95"
      >
        <ClipboardCopy className="w-3.5 h-3.5" />
        Copiar Copys
      </button>

      <button
        onClick={onGenerateCaption}
        disabled={slideCount === 0}
        className="px-7 py-4 bg-white/5 border border-white/10 text-white rounded-full shadow-xl text-[10px] font-black uppercase tracking-[0.35em] hover:border-[#FF5C2B] hover:text-[#FF5C2B] hover:bg-white/10 transition-all flex items-center gap-3 disabled:opacity-40 disabled:cursor-not-allowed active:scale-95"
      >
        <MessageSquarePlus className="w-3.5 h-3.5" />
        Generar Caption
      </button>

      {slideCount > 0 && (
        <div className="px-5 py-4 bg-white/5 border border-white/10 rounded-full shadow-sm text-[10px] font-black text-[#FF5C2B] uppercase tracking-widest">
          {label} {currentIndex + 1}/{slideCount}
        </div>
      )}
    </div>
  );
}
