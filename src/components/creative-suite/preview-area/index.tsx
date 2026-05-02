'use client';

import { ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';
import { Slide, OutputFormat } from '../hooks/useVisionEngine';
import { SlideCanvas } from './slide-canvas';
import { ActionBar } from './action-bar';

interface PreviewAreaProps {
  slides: Slide[];
  currentIndex: number;
  format: OutputFormat;
  onNext: () => void;
  onPrev: () => void;
  onCopyCopys: () => void;
  onGenerateCaption: () => void;
}

export function PreviewArea({
  slides,
  currentIndex,
  format,
  onNext,
  onPrev,
  onCopyCopys,
  onGenerateCaption,
}: PreviewAreaProps) {
  const hasSlides = slides.length > 0;
  const currentSlide = hasSlides ? slides[currentIndex] : null;

  return (
    <main className="flex-1 bg-[#050D14] flex flex-col relative overflow-hidden h-full">
      
      {/* Header label - Fixed position outside scrollable area */}
      <div className="flex flex-col items-center gap-2.5 z-20 pointer-events-none shrink-0 pt-6 lg:pt-14 pb-10 bg-[#050D14]">
        <div className="flex items-center gap-3 px-4 py-1.5 bg-[#050D14]/80 backdrop-blur-md rounded-full shadow-sm border border-white/10 mb-1 animate-in fade-in slide-in-from-top-2 duration-700 pointer-events-auto">
          <div className="w-2 h-2 rounded-full bg-[#FF5C2B] animate-pulse" />
          <span className="text-[9px] font-black uppercase tracking-[0.2em] text-white/90">Vision Engine <span className="text-white/40 font-bold ml-1">v2.5 Flash</span></span>
        </div>
        <span className="text-[8px] font-bold uppercase tracking-[0.4em] text-white/40 opacity-60">Estrategia Creativa Generada</span>
        {hasSlides && (
          <div className="flex gap-2 mt-1 pointer-events-auto">
            {slides.map((_, i) => (
              <div
                key={i}
                className="h-[4px] rounded-full transition-all duration-500"
                style={{
                  width: i === currentIndex ? '2rem' : '0.4rem',
                  backgroundColor: i === currentIndex ? '#FF5C2B' : 'rgba(255, 255, 255, 0.2)',
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Scrollable Container */}
      <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent flex flex-col items-center justify-start px-6 lg:px-14 relative min-h-0">
        
        {/* Canvas area */}
        <div className="relative flex items-center justify-center w-full min-h-[400px]">
          {/* Prev button */}
          {hasSlides && slides.length > 1 && (
            <button
              onClick={onPrev}
              className="absolute -left-2 lg:-left-20 z-30 w-12 h-12 bg-white/5 backdrop-blur-md rounded-full shadow-2xl flex items-center justify-center text-white/80 hover:text-[#FF5C2B] hover:bg-white/10 hover:scale-110 transition-all active:scale-95 border border-white/10"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
          )}

          {/* Slide or empty state */}
          {currentSlide ? (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <SlideCanvas slide={currentSlide} format={format} />
            </div>
          ) : (
            <div className={`w-full rounded-[2.5rem] lg:rounded-[3.5rem] overflow-hidden bg-white/5 backdrop-blur-2xl border-[4px] lg:border-[8px] border-[#0A1A26] shadow-[0_40px_80px_-20px_rgba(0,0,0,0.5)] flex flex-col items-center justify-center text-center p-12 ${format === 'reel_cover' ? 'aspect-[9/16] max-w-xs' : 'aspect-[4/5] max-w-sm'}`}>
              <div className="w-16 h-16 bg-[#FF5C2B]/10 rounded-3xl flex items-center justify-center mb-6">
                <Sparkles className="w-8 h-8 text-[#FF5C2B]" />
              </div>
              <h3 className="text-2xl lg:text-3xl font-black text-white uppercase leading-none mb-4" style={{ fontFamily: "'Montserrat', sans-serif", letterSpacing: '-0.03em' }}>
                Tu momento<br /><span className="text-[#FF5C2B]">comienza aquí</span>
              </h3>
              <p className="text-[10px] font-bold uppercase tracking-[0.35em] text-white/50 max-w-[14rem] leading-relaxed">
                Sube una imagen o describe tu tema para generar contenido de alto nivel.
              </p>
            </div>
          )}

          {/* Next button */}
          {hasSlides && slides.length > 1 && (
            <button
              onClick={onNext}
              className="absolute -right-2 lg:-right-20 z-30 w-12 h-12 bg-white/5 backdrop-blur-md rounded-full shadow-2xl flex items-center justify-center text-white/80 hover:text-[#FF5C2B] hover:bg-white/10 hover:scale-110 transition-all active:scale-95 border border-white/10"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Action bar */}
        <ActionBar
          slideCount={slides.length}
          currentIndex={currentIndex}
          format={format}
          onCopyCopys={onCopyCopys}
          onGenerateCaption={onGenerateCaption}
        />
        
        {/* Bottom spacer */}
        <div className="h-10 shrink-0" />
      </div>
    </main>
  );
}

