'use client';

import { Slide, BgType, DecorativeElement, SlideLayout, OutputFormat } from '../hooks/useVisionEngine';
import { useGoogleFonts } from '../hooks/useGoogleFonts';
import { cn } from '@/lib/utils';

const COLORS = {
  navy: {
    bg: 'linear-gradient(135deg, #0A1A26 0%, #050D13 100%)',
    text: '#E8D9C5',
    accent: '#FF5C2B',
    muted: 'rgba(232, 217, 197, 0.6)',
  },
  orange: {
    bg: 'linear-gradient(135deg, #FF5C2B 0%, #E64A19 100%)',
    text: '#0A1A26',
    accent: '#FFFFFF',
    muted: 'rgba(10, 26, 38, 0.6)',
  },
  cream: {
    bg: 'linear-gradient(135deg, #E8D9C5 0%, #D8C9B5 100%)',
    text: '#0A1A26',
    accent: '#FF5C2B',
    muted: 'rgba(10, 26, 38, 0.6)',
  },
};

function DecorativeLayer({ element, accent }: { element: DecorativeElement; accent: string }) {
  if (element === 'arrows') return (
    <>
      <div className="absolute top-1/4 right-8 opacity-30 pointer-events-none z-0">
        <svg width="120" height="120" viewBox="0 0 24 24" fill="none" stroke={accent} strokeWidth="0.25">
          <path d="M5 12h14M12 5l7 7-7 7" />
        </svg>
      </div>
      <div className="absolute bottom-1/4 left-8 opacity-30 pointer-events-none z-0 rotate-180">
        <svg width="120" height="120" viewBox="0 0 24 24" fill="none" stroke={accent} strokeWidth="0.25">
          <path d="M5 12h14M12 5l7 7-7 7" />
        </svg>
      </div>
    </>
  );
  if (element === 'grid') return (
    <div className="absolute inset-0 opacity-[0.05] pointer-events-none z-0"
      style={{ backgroundImage: `linear-gradient(${accent} 1px, transparent 1px), linear-gradient(90deg, ${accent} 1px, transparent 1px)`, backgroundSize: '40px 40px' }} />
  );
  if (element === 'circles') return (
    <>
      <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full border-[0.5px] opacity-20 pointer-events-none z-0" style={{ borderColor: accent }} />
      <div className="absolute -bottom-16 -left-16 w-56 h-56 rounded-full border-[12px] opacity-10 pointer-events-none z-0" style={{ borderColor: accent }} />
    </>
  );
  if (element === 'lines') return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0 opacity-20">
      <div className="absolute top-0 left-1/4 w-[1px] h-full" style={{ backgroundColor: accent }} />
      <div className="absolute top-0 left-2/4 w-[1px] h-full" style={{ backgroundColor: accent }} />
      <div className="absolute top-0 left-3/4 w-[1px] h-full" style={{ backgroundColor: accent }} />
    </div>
  );
  if (element === 'abstract') return (
    <>
      <div className="absolute right-12 bottom-32 w-32 h-32 border-[1px] opacity-20 rotate-45 pointer-events-none z-0" style={{ borderColor: accent }} />
      <div className="absolute left-12 top-24 w-16 h-16 border-[1px] opacity-15 rotate-12 pointer-events-none z-0" style={{ borderColor: accent }} />
    </>
  );
  return null;
}

// Resolved fonts con fallbacks seguros
function resolveTitleFont(fontPrimary?: string): string {
  if (fontPrimary && fontPrimary !== 'auto') return `'${fontPrimary}', 'Montserrat', sans-serif`;
  return "'Montserrat', 'Arial Black', sans-serif";
}

function resolveBodyFont(fontSecondary?: string): string {
  if (fontSecondary && fontSecondary !== 'auto') return `'${fontSecondary}', 'Inter', sans-serif`;
  return "'Inter', 'Lato', sans-serif";
}

const TITLE_BASE = "font-black uppercase tracking-tighter leading-[0.9]";

function SlideContent({ slide, colors, format }: { slide: Slide; colors: any; format: OutputFormat }) {
  const isReel = format === 'reel_cover';
  const titleSize = isReel ? 'text-3xl lg:text-4xl' : 'text-4xl lg:text-5xl';
  const subtitleStyle = 'text-[9px] font-bold uppercase tracking-[0.5em]';
  const titleFont = resolveTitleFont(slide.fontPrimary);
  const bodyFont = resolveBodyFont(slide.fontSecondary);

  const ImageHintBox = () => (
    <div className="w-full rounded-3xl border border-white/10 bg-white/5 backdrop-blur-md p-5 flex flex-col items-center justify-center gap-2 shadow-2xl relative overflow-hidden group">
      <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
      <p className="text-[9px] font-black uppercase tracking-[0.2em] opacity-60 relative z-10" style={{ color: colors.text }}>
        Visual Concept
      </p>
      <p className="text-[10px] font-medium text-center italic relative z-10 line-clamp-3" style={{ color: colors.text, fontFamily: bodyFont }}>
        "{slide.imageHint}"
      </p>
    </div>
  );

  // ─── CENTER: contenido en zona 1:1 central ────────────────────────────────
  if (slide.layout === 'center') return (
    <div className="h-full flex flex-col items-center justify-center text-center z-10"
      style={{ padding: isReel ? '10% 8%' : '20% 10%' }}
    >
      <div className="space-y-3 w-full">
        <span className={subtitleStyle} style={{ color: colors.accent, fontFamily: bodyFont }}>
          {slide.subtitle}
        </span>
        <h3
          className={cn(titleSize, TITLE_BASE, 'line-clamp-3')}
          style={{ color: colors.text, fontFamily: titleFont }}
        >
          {slide.title}
        </h3>
      </div>
      <div className="w-12 h-[3px] rounded-full my-4 flex-shrink-0" style={{ backgroundColor: colors.accent }} />
      <p
        className="text-[13px] font-medium leading-relaxed max-w-[15rem] line-clamp-4"
        style={{ color: colors.muted, fontFamily: bodyFont }}
      >
        {slide.content}
      </p>
    </div>
  );

  // ─── BOTTOM-HEAVY ─────────────────────────────────────────────────────────
  if (slide.layout === 'bottom-heavy') return (
    <div className="h-full flex flex-col justify-end z-10" style={{ padding: '8% 10% 12%' }}>
      <div className="absolute top-[15%] right-[10%] w-32 h-32 rounded-full border-[1px] opacity-10 z-0" style={{ borderColor: colors.accent }} />
      <div className="space-y-4 z-10">
        <h3
          className={cn(titleSize, TITLE_BASE, 'line-clamp-3')}
          style={{ color: colors.text, fontFamily: titleFont }}
        >
          {slide.title}
        </h3>
        <div className="flex items-center gap-3">
          <div className="h-[2px] w-10 rounded-full flex-shrink-0" style={{ backgroundColor: colors.accent }} />
          <span className={subtitleStyle} style={{ color: colors.accent, fontFamily: bodyFont }}>{slide.subtitle}</span>
        </div>
        <p
          className="text-[13px] font-medium leading-relaxed max-w-[17rem] line-clamp-4"
          style={{ color: colors.muted, fontFamily: bodyFont }}
        >
          {slide.content}
        </p>
      </div>
    </div>
  );

  // ─── SPLIT ────────────────────────────────────────────────────────────────
  if (slide.layout.startsWith('split')) {
    const isLeft = slide.layout === 'split-left';
    return (
      <div className="h-full flex flex-col items-center justify-center gap-6 z-10" style={{ padding: '10% 10%' }}>
        <div className={cn('flex flex-col justify-center space-y-3 w-full', isLeft ? 'text-left' : 'items-end text-right')}>
          <span className={subtitleStyle} style={{ color: colors.accent, fontFamily: bodyFont }}>{slide.subtitle}</span>
          <h3
            className={cn('text-3xl lg:text-4xl', TITLE_BASE, 'line-clamp-3')}
            style={{ color: colors.text, fontFamily: titleFont }}
          >
            {slide.title}
          </h3>
          <p
            className="text-[12px] font-medium leading-relaxed max-w-[14rem] line-clamp-3"
            style={{ color: colors.muted, fontFamily: bodyFont }}
          >
            {slide.content}
          </p>
        </div>
        <ImageHintBox />
      </div>
    );
  }

  // ─── MINIMAL-TEXT ─────────────────────────────────────────────────────────
  if (slide.layout === 'minimal-text') return (
    <div className="h-full flex flex-col justify-between z-10" style={{ padding: '14% 10%' }}>
      <span className={subtitleStyle} style={{ color: colors.accent, fontFamily: bodyFont }}>{slide.subtitle}</span>
      <div className="space-y-6">
        <h3
          className={cn(titleSize, TITLE_BASE, 'line-clamp-3')}
          style={{ color: colors.text, fontFamily: titleFont }}
        >
          {slide.title}
        </h3>
        <div className="w-10 h-[2px]" style={{ backgroundColor: colors.accent }} />
      </div>
      <p
        className="text-[12px] font-medium max-w-[13rem] italic opacity-80 line-clamp-3"
        style={{ color: colors.muted, fontFamily: bodyFont }}
      >
        {slide.content}
      </p>
    </div>
  );

  // ─── DIAGONAL / DEFAULT ───────────────────────────────────────────────────
  return (
    <div className="h-full relative flex flex-col justify-between z-10" style={{ padding: '14% 10%' }}>
      <div className="absolute -top-12 -left-12 w-64 h-64 border-[40px] opacity-5 rounded-full z-0" style={{ borderColor: colors.accent }} />
      <div className="space-y-2 z-10">
        <span className={subtitleStyle} style={{ color: colors.accent, fontFamily: bodyFont }}>{slide.subtitle}</span>
        <h3
          className={cn('text-3xl lg:text-4xl', TITLE_BASE, 'line-clamp-3')}
          style={{ color: colors.text, fontFamily: titleFont }}
        >
          {slide.title}
        </h3>
      </div>
      <div className="max-w-[180px] z-10">
        <ImageHintBox />
      </div>
      <p
        className="text-[12px] font-medium self-end text-right max-w-[14rem] leading-relaxed italic line-clamp-3 z-10"
        style={{ color: colors.muted, fontFamily: bodyFont }}
      >
        {slide.content}
      </p>
    </div>
  );
}

interface SlideCanvasProps {
  slide: Slide;
  format: OutputFormat;
}

export function SlideCanvas({ slide, format }: SlideCanvasProps) {
  const colors = COLORS[slide.bgType] || COLORS.navy;
  const isReel = format === 'reel_cover';
  const titleFont = resolveTitleFont(slide.fontPrimary);

  // Cargar fuentes dinámicamente de Google Fonts
  useGoogleFonts([slide.fontPrimary, slide.fontSecondary]);

  return (
    <div
      className={cn(
        'w-full rounded-[3rem] lg:rounded-[4rem] overflow-hidden relative border-[12px] lg:border-[16px] border-white shadow-[0_50px_100px_-20px_rgba(10,26,38,0.4)]',
        isReel ? 'aspect-[9/16] max-w-xs' : 'aspect-[4/5] max-w-sm'
      )}
      style={{ background: colors.bg }}
    >
      {/* Decorative elements — fuera de la zona segura, z-0 */}
      <DecorativeLayer element={slide.decorativeElement} accent={colors.accent} />

      {/* Safe zone indicator */}
      {isReel ? (
        <div className="absolute inset-0 border-[2px] border-dashed border-red-500/20 m-12 pointer-events-none z-50 flex items-start justify-center pt-4">
          <span className="text-[8px] text-white bg-red-500/60 backdrop-blur-sm px-3 py-1 rounded-full uppercase font-black tracking-[0.2em]">Safe Zone 9:16</span>
        </div>
      ) : (
        <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 aspect-square border-[1.5px] border-dashed opacity-20 pointer-events-none z-50 flex items-start justify-center pt-5" style={{ borderColor: colors.text }}>
          <span className="text-[8px] uppercase font-black tracking-[0.2em] px-4 py-1.5 rounded-full shadow-lg text-[#0A1A26] bg-white/90 backdrop-blur-sm">Feed Preview 1:1</span>
        </div>
      )}

      {/* Brand watermark — puede ir fuera de la zona segura (z-20) */}
      <div className="absolute top-8 left-8 lg:top-10 lg:left-10 flex items-center gap-3 opacity-60 z-20">
        <div className="h-[2px] w-6 rounded-full" style={{ backgroundColor: colors.accent }} />
        <span
          className="text-[10px] font-black uppercase tracking-[0.3em]"
          style={{ color: colors.text, fontFamily: titleFont }}
        >
          Kairós
        </span>
      </div>

      {/* Main content — respeta zona 1:1 vía padding */}
      <SlideContent slide={slide} colors={colors} format={format} />

      {/* Glossy overlay */}
      <div className="absolute inset-0 bg-gradient-to-tr from-white/5 to-transparent pointer-events-none z-30" />
    </div>
  );
}
