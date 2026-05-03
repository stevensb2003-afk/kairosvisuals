'use client';

import { ClipboardCopy, MessageSquarePlus, Download, Loader2 } from 'lucide-react';

interface ActionBarProps {
  slideCount: number;
  currentIndex: number;
  format: 'post' | 'carousel' | 'reel_cover';
  onCopyCopys: () => void;
  onGenerateCaption: () => void;
  onExport: () => void;
  isExporting: boolean;
}

export function ActionBar({ slideCount, currentIndex, format, onCopyCopys, onGenerateCaption, onExport, isExporting }: ActionBarProps) {
  const label = format === 'carousel' ? 'Slide' : 'Opción';

  return (
    <div className="flex flex-wrap justify-center items-center gap-3 mt-8 lg:mt-10">
      <button
        onClick={onExport}
        disabled={slideCount === 0 || isExporting}
        className="px-7 py-4 bg-[#FF5C2B] text-[#0A1A26] rounded-full shadow-xl shadow-[#FF5C2B]/20 text-[10px] font-black uppercase tracking-[0.35em] hover:bg-white hover:text-[#0A1A26] transition-all flex items-center gap-3 disabled:opacity-40 disabled:cursor-not-allowed active:scale-95"
      >
        {isExporting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
        Exportar PNG
      </button>

      <button
        onClick={onCopyCopys}
        disabled={slideCount === 0}
        className="px-7 py-4 bg-white/5 border border-white/10 text-white rounded-full shadow-xl text-[10px] font-black uppercase tracking-[0.35em] hover:border-[#FF5C2B] hover:text-[#FF5C2B] hover:bg-white/10 transition-all flex items-center gap-3 disabled:opacity-40 disabled:cursor-not-allowed active:scale-95"
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
        Caption
      </button>

      {slideCount > 0 && (
        <div className="px-5 py-4 bg-white/5 border border-white/10 rounded-full shadow-sm text-[10px] font-black text-[#FF5C2B] uppercase tracking-widest">
          {label} {currentIndex + 1}/{slideCount}
        </div>
      )}
    </div>
  );
}
