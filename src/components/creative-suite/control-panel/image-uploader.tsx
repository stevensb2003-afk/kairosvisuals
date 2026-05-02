'use client';

import { useRef, useCallback } from 'react';
import { ImagePlus, X, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ImageUploaderProps {
  previewUrl: string | null;
  onSelect: (file: File) => void;
  onRemove: () => void;
}

export function ImageUploader({ previewUrl, onSelect, onRemove }: ImageUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) onSelect(file);
  }, [onSelect]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  return (
    <div className="space-y-2.5">
      <label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/60">
        Referencia Visual (Opcional)
      </label>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => e.target.files?.[0] && onSelect(e.target.files[0])}
      />

      {previewUrl ? (
        <div className="relative group rounded-2xl overflow-hidden border-2 border-white/10 h-36">
          <img
            src={previewUrl}
            alt="Referencia"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-[#0A1A26]/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <button
              onClick={onRemove}
              className="w-9 h-9 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center shadow-lg hover:bg-red-500/20 hover:text-red-400 text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="absolute bottom-2 left-2 flex items-center gap-1.5 bg-[#0A1A26]/80 backdrop-blur-md rounded-full px-2 py-1 border border-white/10">
            <CheckCircle2 className="w-3 h-3 text-emerald-500" />
            <span className="text-[9px] font-black uppercase tracking-wider text-white">Imagen Cargada</span>
          </div>
        </div>
      ) : (
        <button
          onClick={() => inputRef.current?.click()}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          className={cn(
            'w-full py-8 bg-white/5 border-2 border-dashed border-white/10 rounded-2xl',
            'flex flex-col items-center justify-center gap-2.5',
            'hover:bg-[#FF5C2B]/5 hover:border-[#FF5C2B]/30 transition-all group'
          )}
        >
          <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-[#FF5C2B]/10 transition-colors border border-white/5">
            <ImagePlus className="w-5 h-5 text-white/40 group-hover:text-[#FF5C2B] transition-colors" />
          </div>
          <div className="text-center">
            <p className="text-[10px] font-black uppercase tracking-wider text-white/50 group-hover:text-[#FF5C2B] transition-colors">
              Subir Imagen de Referencia
            </p>
            <p className="text-[9px] text-white/30 mt-0.5">Opcional: Si no subes nada, generaremos desde cero</p>
          </div>
        </button>
      )}
    </div>
  );
}
