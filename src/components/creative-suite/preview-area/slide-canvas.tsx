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
  isColorDark,
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

// ─── Style Helpers ────────────────────────────────────────────────────────────
function getTextEffectClasses(effect?: string): string {
  switch (effect) {
    case 'glow': return 'drop-shadow-[0_0_15px_rgba(255,255,255,0.4)]';
    case 'drop-shadow': return 'drop-shadow-[0_10px_10px_rgba(0,0,0,0.5)]';
    case 'gradient': return 'bg-clip-text text-transparent bg-gradient-to-br from-white to-white/50';
    case 'neon': return 'drop-shadow-[0_0_10px_currentColor] drop-shadow-[0_0_20px_currentColor]';
    default: return '';
  }
}

function getTextEffectStyles(effect: string | undefined, accentColor: string, defaultColor: string): React.CSSProperties {
  if (effect === 'stroke') {
    return { WebkitTextStroke: `1px ${accentColor}`, color: 'transparent' };
  }
  if (effect === 'gradient') {
    return { backgroundImage: `linear-gradient(to bottom right, ${defaultColor}, ${accentColor})` };
  }
  return { color: defaultColor };
}

function getFrameStyles(type: string | undefined, accentColor: string): React.CSSProperties {
  switch (type) {
    case 'solid': return { border: `3px solid ${accentColor}`, padding: '1.5rem', borderRadius: '1.5rem' };
    case 'dashed': return { border: `3px dashed ${accentColor}`, padding: '1.5rem', borderRadius: '1.5rem' };
    case 'glass': return { background: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.1)', padding: '1.5rem', borderRadius: '1.5rem' };
    case 'minimal': return { borderLeft: `4px solid ${accentColor}`, paddingLeft: '1.5rem' };
    case 'neon-border': return { border: `2px solid ${accentColor}`, boxShadow: `0 0 15px ${accentColor}, inset 0 0 15px ${accentColor}`, padding: '1.5rem', borderRadius: '1.5rem' };
    default: return {};
  }
}

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



  if (slide.layout === 'center') return (
    <div className="h-full flex flex-col items-center justify-center text-center z-10"
      style={{ padding: isReel ? '10% 8%' : '20% 10%' }}>
      <div className="flex flex-col items-center justify-center w-full" style={getFrameStyles(slide.frameType, colors.accent)}>
        <div className="space-y-3 w-full">
          <span className={subtitleStyle} style={{ color: colors.accent, fontFamily: bodyFont }}>{slide.subtitle}</span>
          <h3 className={cn(titleSize, TITLE_BASE, 'line-clamp-3', getTextEffectClasses(slide.textEffect))} style={{ fontFamily: titleFont, ...getTextEffectStyles(slide.textEffect, colors.accent, colors.text) }}>{slide.title}</h3>
        </div>
        <div className="w-12 h-[3px] rounded-full my-4 flex-shrink-0" style={{ backgroundColor: colors.accent }} />
        <p className="text-[13px] font-medium leading-relaxed max-w-[15rem] line-clamp-4" style={{ color: colors.muted, fontFamily: bodyFont }}>
          {slide.content}
        </p>
      </div>
    </div>
  );

  if (slide.layout === 'bottom-heavy') return (
    <div className="h-full flex flex-col justify-end z-10" style={{ padding: '8% 10% 12%' }}>
      <div className="absolute top-[12%] right-[8%] w-40 h-40 rounded-full border-[1px] opacity-10 z-0" style={{ borderColor: colors.accent }} />
      <div className="space-y-4 z-10 w-full" style={getFrameStyles(slide.frameType, colors.accent)}>
        <h3 className={cn(titleSize, TITLE_BASE, 'line-clamp-3', getTextEffectClasses(slide.textEffect))} style={{ fontFamily: titleFont, ...getTextEffectStyles(slide.textEffect, colors.accent, colors.text) }}>{slide.title}</h3>
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
        <div className={cn('flex flex-col justify-center space-y-3 w-full', isLeft ? 'text-left' : 'items-end text-right')} style={getFrameStyles(slide.frameType, colors.accent)}>
          <span className={subtitleStyle} style={{ color: colors.accent, fontFamily: bodyFont }}>{slide.subtitle}</span>
          <h3 className={cn('text-3xl lg:text-4xl', TITLE_BASE, 'line-clamp-3', getTextEffectClasses(slide.textEffect))} style={{ fontFamily: titleFont, ...getTextEffectStyles(slide.textEffect, colors.accent, colors.text) }}>{slide.title}</h3>
          <p className="text-[12px] font-medium leading-relaxed max-w-[14rem] line-clamp-3" style={{ color: colors.muted, fontFamily: bodyFont }}>
            {slide.content}
          </p>
        </div>
      </div>
    );
  }

  if (slide.layout === 'minimal-text') return (
    <div className="h-full flex flex-col justify-between z-10" style={{ padding: '14% 10%' }}>
      <span className={subtitleStyle} style={{ color: colors.accent, fontFamily: bodyFont }}>{slide.subtitle}</span>
      <div className="space-y-6 w-full" style={getFrameStyles(slide.frameType, colors.accent)}>
        <h3 className={cn(titleSize, TITLE_BASE, 'line-clamp-3', getTextEffectClasses(slide.textEffect))} style={{ fontFamily: titleFont, ...getTextEffectStyles(slide.textEffect, colors.accent, colors.text) }}>{slide.title}</h3>
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
      <div className="space-y-2 z-10 w-full" style={getFrameStyles(slide.frameType, colors.accent)}>
        <span className={subtitleStyle} style={{ color: colors.accent, fontFamily: bodyFont }}>{slide.subtitle}</span>
        <h3 className={cn('text-3xl lg:text-4xl', TITLE_BASE, 'line-clamp-3', getTextEffectClasses(slide.textEffect))} style={{ fontFamily: titleFont, ...getTextEffectStyles(slide.textEffect, colors.accent, colors.text) }}>{slide.title}</h3>
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
  brandLogoBase64?: string | null;
  brandLogoMimeType?: string | null;
  resolvedColors: BrandColors;
  generatedImage?: string | null;
}

export const LOGO_POSITIONS: Record<string, string> = {
  'center': 'top-8 left-1/2 -translate-x-1/2',
  'bottom-heavy': 'top-8 left-8 lg:top-10 lg:left-10',
  'split-left': 'top-8 right-8 lg:top-10 lg:right-10 flex-row-reverse',
  'split-right': 'top-8 left-8 lg:top-10 lg:left-10',
  'minimal-text': 'bottom-8 right-8 lg:bottom-10 lg:right-10 flex-row-reverse',
  'diagonal': 'top-8 left-8 lg:top-10 lg:left-10',
  'default': 'top-8 left-8 lg:top-10 lg:left-10'
};

export function getRatioClasses(ratio: string) {
  switch (ratio) {
    case '1:1': return 'aspect-square w-[350px] lg:w-[400px]';
    case '16:9': return 'aspect-video w-[350px] lg:w-[600px]';
    case '9:16': return 'aspect-[9/16] w-[280px] lg:w-[320px]';
    case '4:5': return 'aspect-[4/5] w-[350px] lg:w-[400px]';
    case '3:4': return 'aspect-[3/4] w-[350px] lg:w-[400px]';
    case '21:9': return 'aspect-[21/9] w-[350px] lg:w-[600px]';
    default: return 'aspect-[4/5] w-[350px] lg:w-[400px]';
  }
}

export function SlideCanvas({ slide, format, canvasRatio, brandName, brandLogoBase64, brandLogoMimeType, resolvedColors, generatedImage }: SlideCanvasProps) {
  const colors = resolveBrandColors(resolvedColors, slide.bgType as BgType);
  const isReel = format === 'reel_cover';
  const titleFont = resolveTitleFont(slide.fontPrimary);
  const displayBrand = brandName || 'Kairós';
  const hasAiImage = Boolean(generatedImage);
  const isTextDark = isColorDark(colors.text);

  useGoogleFonts([slide.fontPrimary, slide.fontSecondary]);

  return (
    <div
      className={cn(
        'overflow-hidden relative shadow-[0_50px_100px_-20px_rgba(10,26,38,0.4)]',
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

      {/* LAYER 0c: CSS structural overlay (only without AI photo) */}
      {!hasAiImage && colors.overlay && (
        <div className="absolute inset-0 pointer-events-none z-[1]" style={{ background: colors.overlay }} />
      )}

      {/* LAYER 1: Decorative elements — reduced opacity when photo is active */}
      <div className={cn('transition-opacity duration-500', hasAiImage ? 'opacity-0' : 'opacity-100')}>
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

      {/* LAYER 3: Brand watermark / Logo */}
      <div
        className={cn(
          'absolute flex items-center gap-3 z-20 transition-all duration-500',
          LOGO_POSITIONS[slide.layout] || LOGO_POSITIONS['default'],
          hasAiImage
            ? cn('backdrop-blur-md px-3 py-1.5 rounded-full border', isTextDark ? 'bg-white/50 border-black/10' : 'bg-black/30 border-white/10')
            : 'opacity-60'
        )}
      >
        {brandLogoBase64 && brandLogoMimeType ? (
          <img 
            src={`data:${brandLogoMimeType};base64,${brandLogoBase64}`} 
            alt={`${displayBrand} Logo`} 
            className="h-6 w-auto object-contain drop-shadow-md"
          />
        ) : (
          <>
            <div className="h-[2px] w-6 rounded-full" style={{ backgroundColor: colors.accent }} />
            <span
              className="text-[10px] font-black uppercase tracking-[0.3em]"
              style={{ color: hasAiImage ? (isTextDark ? '#000000' : '#ffffff') : colors.text, fontFamily: titleFont }}
            >
              {displayBrand}
            </span>
          </>
        )}
      </div>

      {/* LAYER 2: Main content — clean blur overlay when AI photo is active */}
      {hasAiImage ? (
        <div className="absolute inset-0 z-10">
          {/* Full coverage base overlay for contrast */}
          <div className={cn("absolute inset-0 pointer-events-none backdrop-blur-[2px]", isTextDark ? "bg-white/60" : "bg-black/40")} />
          
          {/* Additional gradient for depth */}
          <div className={cn("absolute inset-0 pointer-events-none bg-gradient-to-t", isTextDark ? "from-white/90 via-white/30 to-white/10" : "from-black/80 via-transparent to-black/30")} />
          
          {/* Brand color tint */}
          <div 
            className="absolute inset-0 pointer-events-none mix-blend-color"
            style={{ backgroundColor: colors.accent, opacity: 0.4 }}
          />
          
          <div className="relative z-10 w-full h-full p-2 lg:p-4">
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
