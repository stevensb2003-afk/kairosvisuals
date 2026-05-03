'use client';

import {
  Slide,
  OutputFormat,
  BrandColors,
} from '../hooks/useVisionEngine';
import {
  BgType,
  DecorativeElement,
  resolveBrandColors,
} from '@/constants/creative-palettes';
import { useGoogleFonts } from '../hooks/useGoogleFonts';
import { cn } from '@/lib/utils';
import { DecorativeLayer } from './decorative-layer';



// ─── Font helpers ─────────────────────────────────────────────────────────────
function resolveTitleFont(fontPrimary?: string): string {
  if (fontPrimary && fontPrimary !== 'auto') return `'${fontPrimary}', 'Montserrat', sans-serif`;
  return "'Montserrat', 'Arial Black', sans-serif";
}

function resolveBodyFont(fontSecondary?: string): string {
  if (fontSecondary && fontSecondary !== 'auto') return `'${fontSecondary}', 'Inter', sans-serif`;
  return "'Inter', 'Lato', sans-serif";
}

const TITLE_BASE = 'font-black uppercase tracking-tighter leading-[0.9]';

// ─── Slide Content ────────────────────────────────────────────────────────────
type ColorToken = ReturnType<typeof resolveBrandColors>;

function SlideContent({ slide, colors, format }: {
  slide: Slide;
  colors: ColorToken;
  format: OutputFormat;
}) {
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
        &ldquo;{slide.imageHint}&rdquo;
      </p>
    </div>
  );

  if (slide.layout === 'center') return (
    <div className="h-full flex flex-col items-center justify-center text-center z-10"
      style={{ padding: isReel ? '10% 8%' : '20% 10%' }}>
      <div className="space-y-3 w-full">
        <span className={subtitleStyle} style={{ color: colors.accent, fontFamily: bodyFont }}>{slide.subtitle}</span>
        <h3 className={cn(titleSize, TITLE_BASE, 'line-clamp-3')} style={{ color: colors.text, fontFamily: titleFont }}>{slide.title}</h3>
      </div>
      <div className="w-12 h-[3px] rounded-full my-4 flex-shrink-0" style={{ backgroundColor: colors.accent }} />
      <p className="text-[13px] font-medium leading-relaxed max-w-[15rem] line-clamp-4" style={{ color: colors.muted, fontFamily: bodyFont }}>
        {slide.content}
      </p>
    </div>
  );

  if (slide.layout === 'bottom-heavy') return (
    <div className="h-full flex flex-col justify-end z-10" style={{ padding: '8% 10% 12%' }}>
      <div className="absolute top-[12%] right-[8%] w-40 h-40 rounded-full border-[1px] opacity-10 z-0" style={{ borderColor: colors.accent }} />
      <div className="space-y-4 z-10">
        <h3 className={cn(titleSize, TITLE_BASE, 'line-clamp-3')} style={{ color: colors.text, fontFamily: titleFont }}>{slide.title}</h3>
        <div className="flex items-center gap-3">
          <div className="h-[2px] w-10 rounded-full flex-shrink-0" style={{ backgroundColor: colors.accent }} />
          <span className={subtitleStyle} style={{ color: colors.accent, fontFamily: bodyFont }}>{slide.subtitle}</span>
        </div>
        <p className="text-[13px] font-medium leading-relaxed max-w-[17rem] line-clamp-4" style={{ color: colors.muted, fontFamily: bodyFont }}>
          {slide.content}
        </p>
      </div>
    </div>
  );

  if (slide.layout.startsWith('split')) {
    const isLeft = slide.layout === 'split-left';
    return (
      <div className="h-full flex flex-col items-center justify-center gap-6 z-10" style={{ padding: '10% 10%' }}>
        <div className={cn('flex flex-col justify-center space-y-3 w-full', isLeft ? 'text-left' : 'items-end text-right')}>
          <span className={subtitleStyle} style={{ color: colors.accent, fontFamily: bodyFont }}>{slide.subtitle}</span>
          <h3 className={cn('text-3xl lg:text-4xl', TITLE_BASE, 'line-clamp-3')} style={{ color: colors.text, fontFamily: titleFont }}>{slide.title}</h3>
          <p className="text-[12px] font-medium leading-relaxed max-w-[14rem] line-clamp-3" style={{ color: colors.muted, fontFamily: bodyFont }}>
            {slide.content}
          </p>
        </div>
        <ImageHintBox />
      </div>
    );
  }

  if (slide.layout === 'minimal-text') return (
    <div className="h-full flex flex-col justify-between z-10" style={{ padding: '14% 10%' }}>
      <span className={subtitleStyle} style={{ color: colors.accent, fontFamily: bodyFont }}>{slide.subtitle}</span>
      <div className="space-y-6">
        <h3 className={cn(titleSize, TITLE_BASE, 'line-clamp-3')} style={{ color: colors.text, fontFamily: titleFont }}>{slide.title}</h3>
        <div className="w-10 h-[2px]" style={{ backgroundColor: colors.accent }} />
      </div>
      <p className="text-[12px] font-medium max-w-[13rem] italic opacity-80 line-clamp-3" style={{ color: colors.muted, fontFamily: bodyFont }}>
        {slide.content}
      </p>
    </div>
  );

  // diagonal / default
  return (
    <div className="h-full relative flex flex-col justify-between z-10" style={{ padding: '14% 10%' }}>
      <div className="absolute -top-16 -left-16 w-80 h-80 border-[50px] opacity-5 rounded-full z-0" style={{ borderColor: colors.accent }} />
      <div className="space-y-2 z-10">
        <span className={subtitleStyle} style={{ color: colors.accent, fontFamily: bodyFont }}>{slide.subtitle}</span>
        <h3 className={cn('text-3xl lg:text-4xl', TITLE_BASE, 'line-clamp-3')} style={{ color: colors.text, fontFamily: titleFont }}>{slide.title}</h3>
      </div>
      <div className="max-w-[180px] z-10">
        <ImageHintBox />
      </div>
      <p className="text-[12px] font-medium self-end text-right max-w-[14rem] leading-relaxed italic line-clamp-3 z-10" style={{ color: colors.muted, fontFamily: bodyFont }}>
        {slide.content}
      </p>
    </div>
  );
}

// ─── SlideCanvas ─────────────────────────────────────────────────────────────
export interface SlideCanvasProps {
  slide: Slide;
  format: OutputFormat;
  canvasRatio: '1:1' | '16:9' | '9:16' | '4:5' | '3:4' | '21:9';
  brandName?: string;
  resolvedColors: BrandColors;
  generatedImage?: string | null;
}

export function getRatioClasses(ratio: string) {
  switch (ratio) {
    case '1:1': return 'aspect-square max-w-sm';
    case '16:9': return 'aspect-video max-w-2xl';
    case '9:16': return 'aspect-[9/16] max-w-xs';
    case '4:5': return 'aspect-[4/5] max-w-sm';
    case '3:4': return 'aspect-[3/4] max-w-sm';
    case '21:9': return 'aspect-[21/9] max-w-3xl';
    default: return 'aspect-[4/5] max-w-sm';
  }
}

export function SlideCanvas({ slide, format, canvasRatio, brandName, resolvedColors, generatedImage }: SlideCanvasProps) {
  const colors = resolveBrandColors(resolvedColors, slide.bgType as BgType);
  const isReel = format === 'reel_cover';
  const titleFont = resolveTitleFont(slide.fontPrimary);
  const displayBrand = brandName || 'Kairós';
  const hasAiImage = Boolean(generatedImage);

  useGoogleFonts([slide.fontPrimary, slide.fontSecondary]);

  return (
    <div
      className={cn(
        'w-full rounded-[3rem] lg:rounded-[4rem] overflow-hidden relative border-[12px] lg:border-[16px] border-white shadow-[0_50px_100px_-20px_rgba(10,26,38,0.4)]',
        getRatioClasses(canvasRatio)
      )}
      style={{ background: hasAiImage ? resolvedColors.secondary : colors.bg }}
    >
      {/* LAYER 0: AI Background Photo (when active) */}
      {hasAiImage && (
        <img
          src={generatedImage!}
          alt="AI generated background"
          className="absolute inset-0 w-full h-full object-cover z-0"
        />
      )}

      {/* LAYER 0b: Dark scrim over photo for text legibility */}
      {hasAiImage && (
        <div
          className="absolute inset-0 z-[1] pointer-events-none"
          style={{
            background: `linear-gradient(160deg, ${resolvedColors.secondary}CC 0%, ${resolvedColors.secondary}66 50%, ${resolvedColors.secondary}99 100%)`,
          }}
        />
      )}

      {/* LAYER 0c: CSS structural overlay (only without AI photo) */}
      {!hasAiImage && colors.overlay && (
        <div className="absolute inset-0 pointer-events-none z-[1]" style={{ background: colors.overlay }} />
      )}

      {/* LAYER 1: Decorative elements — reduced opacity when photo is active */}
      <div className={cn('transition-opacity duration-500', hasAiImage ? 'opacity-30' : 'opacity-100')}>
        <DecorativeLayer
          element={slide.decorativeElement as DecorativeElement}
          accent={colors.accent}
          secondary={resolvedColors.secondary}
          brandName={displayBrand}
        />
      </div>

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

      {/* LAYER 3: Brand watermark */}
      <div
        className={cn(
          'absolute top-8 left-8 lg:top-10 lg:left-10 flex items-center gap-3 z-20',
          hasAiImage
            ? 'bg-black/30 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10'
            : 'opacity-60'
        )}
      >
        <div className="h-[2px] w-6 rounded-full" style={{ backgroundColor: colors.accent }} />
        <span
          className="text-[10px] font-black uppercase tracking-[0.3em]"
          style={{ color: '#ffffff', fontFamily: titleFont }}
        >
          {displayBrand}
        </span>
      </div>

      {/* LAYER 2: Main content — glassmorphism wrap when AI photo is active */}
      {hasAiImage ? (
        <div className="absolute inset-0 z-10 flex flex-col justify-end p-6 lg:p-8">
          <div
            className="rounded-3xl p-5 lg:p-7 border border-white/20"
            style={{
              backdropFilter: 'blur(16px)',
              WebkitBackdropFilter: 'blur(16px)',
              background: `${resolvedColors.secondary}B3`,
              boxShadow: `0 8px 32px 0 ${resolvedColors.primary}33`,
            }}
          >
            <SlideContent slide={slide} colors={colors} format={format} />
          </div>
        </div>
      ) : (
        <SlideContent slide={slide} colors={colors} format={format} />
      )}

      {/* Glossy overlay */}
      <div className="absolute inset-0 bg-gradient-to-tr from-white/5 to-transparent pointer-events-none z-30" />
    </div>
  );
}
