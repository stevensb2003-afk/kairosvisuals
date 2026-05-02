'use client';

import { Sparkles, Type } from 'lucide-react';
import { TypographyPreview } from './typography-preview';

interface ContentStudioProps {
  apiKey: string;
}

export function ContentStudio({ apiKey }: ContentStudioProps) {
  return (
    <div className="h-full flex flex-col space-y-6 max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 shrink-0">
        <div>
          <h1 className="text-3xl font-headline font-bold flex items-center gap-3 text-white">
            <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-primary" />
            </div>
            Content Studio
          </h1>
          <p className="text-white/50 mt-1.5 text-sm">
            Herramientas visuales y creativas para potenciar el contenido de tu marca.
          </p>
        </div>
      </div>

      <div className="w-full border-t border-white/5 shrink-0" />

      {/* Content Area - Focus on Typography for now */}
      <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar pr-2">
        <div className="space-y-8">
          <div className="bg-white/[0.02] border border-white/5 rounded-3xl p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center">
                <Type className="w-4 h-4 text-white/40" />
              </div>
              <h2 className="text-sm font-black uppercase tracking-[0.2em] text-white/60">Laboratorio de Tipografía</h2>
            </div>
            <TypographyPreview apiKey={apiKey} />
          </div>
          
          {/* Placeholder for more visual tools */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 opacity-40 grayscale pointer-events-none">
            <div className="p-8 bg-white/[0.02] border border-dashed border-white/10 rounded-3xl text-center">
              <p className="text-[10px] font-black uppercase tracking-widest text-white/30 mb-2">Próximamente</p>
              <h3 className="text-white/40 font-bold">Generador de Paletas</h3>
            </div>
            <div className="p-8 bg-white/[0.02] border border-dashed border-white/10 rounded-3xl text-center">
              <p className="text-[10px] font-black uppercase tracking-widest text-white/30 mb-2">Próximamente</p>
              <h3 className="text-white/40 font-bold">Compositor de Layouts</h3>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
