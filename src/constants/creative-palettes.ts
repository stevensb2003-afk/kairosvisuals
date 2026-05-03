// Creative palettes & decorative systems for Vision Engine

// bgType describes the VISUAL STRUCTURE of the slide background.
// Colors are ALWAYS resolved from brand/manual colors — not hardcoded here.
export type BgType =
  | 'dark'        // primary (darkened) bg — dominant, cinematic
  | 'light'       // tertiary/light bg — clean, airy
  | 'vibrant'     // primary as the full background
  | 'gradient'    // gradient: primary → secondary (diagonal)
  | 'split'       // half secondary / half primary
  | 'accent-bg'   // secondary color as background, primary as accent
  | 'minimal';    // near-white or very light bg, brand accent pops

export type DecorativeElement =
  // ── Geométrico ──────────────────────────────────────────────────────────────
  | 'circles'          // sistema de anillos concéntricos, tipo objetivo/sello
  | 'diamond-grid'     // rombos rotados en composición diagonal
  | 'triangle-burst'   // triángulos explotando desde una esquina
  | 'slash'            // franja diagonal brutalista que corta el canvas
  | 'arch'             // arco arquitectónico elegante (portal)
  | 'cross-marks'      // marcas × dispersas de distintos tamaños
  | 'abstract'         // composición de cuadrados rotados tipo Bauhaus
  // ── Patrón / Textura ──────────────────────────────────────────────────────
  | 'grid'             // cuadrícula de líneas finas
  | 'dots'             // grid de puntos equidistantes
  | 'halftone'         // trama de puntos tipo offset/serigrafía
  | 'diagonal-stripes' // rayas diagonales paralelas
  | 'hexagon-mesh'     // malla hexagonal tipo panal
  // ── Orgánico / Flujo ────────────────────────────────────────────────────
  | 'blob'             // manchas orgánicas difuminadas
  | 'waves'            // ondas fluidas (tipo paisaje o tela)
  | 'brush'            // brochazos pintados orgánicos
  | 'radial-glow'      // resplandor radial tipo halo
  // ── Editorial / Composicional ─────────────────────────────────────────
  | 'corner-frame'     // marcos decorativos en esquinas
  | 'lines'            // líneas verticales tipo columnas editoriales
  | 'arrows'           // flechas vectoriales en composición
  | 'floating-shapes'  // mezcla de formas a distintas escalas y opacidades
  | 'typographic'      // letra/número gigante como fondo (estilo editorial)
  | 'none';            // sin decoración (para slides ultra-minimalistas)

export type SlideLayout =
  | 'center'
  | 'split-left'
  | 'split-right'
  | 'bottom-heavy'
  | 'diagonal'
  | 'minimal-text';

export type SlideMood =
  | 'bold'
  | 'elegant'
  | 'playful'
  | 'minimal'
  | 'dramatic'
  | 'editorial';

export interface ColorToken {
  bg: string;
  text: string;
  accent: string;
  muted: string;
  overlay?: string;
}

export interface BrandColors {
  primary: string;
  secondary: string;
  tertiary: string;
}

/**
 * Resolves actual ColorToken from brand colors + bgType structure.
 * This is the ONLY source of colors for the canvas — always brand-accurate.
 */
export function resolveBrandColors(brand: BrandColors, bgType: BgType): ColorToken {
  const { primary, secondary, tertiary } = brand;

  // Determine if primary is a dark color (for text contrast)
  const isDarkPrimary = isColorDark(primary);
  const isDarkSecondary = isColorDark(secondary);
  const isDarkTertiary = isColorDark(tertiary);

  const resolveToken = (baseToken: ColorToken, bgRef: string): ColorToken => {
    return {
      ...baseToken,
      text: ensureContrast(baseToken.text, bgRef),
      muted: ensureContrast(baseToken.muted, bgRef),
    };
  };

  switch (bgType) {
    case 'dark': {
      const bg = darkenHex(primary, 0.82);
      return resolveToken({
        bg: `linear-gradient(145deg, ${bg} 0%, ${darkenHex(secondary, 0.88)} 100%)`,
        text: isDarkTertiary ? '#FFFFFF' : tertiary,
        accent: primary,
        muted: hexWithAlpha(isDarkTertiary ? '#FFFFFF' : tertiary, 0.55),
        overlay: `linear-gradient(135deg, ${hexWithAlpha(primary, 0.08)} 0%, transparent 60%)`,
      }, bg);
    }

    case 'light': {
      const bg = lightenHex(tertiary, 0.85);
      return resolveToken({
        bg: `linear-gradient(145deg, ${bg} 0%, ${lightenHex(tertiary, 0.7)} 100%)`,
        text: isDarkSecondary ? secondary : darkenHex(secondary, 0.7),
        accent: primary,
        muted: hexWithAlpha(isDarkSecondary ? secondary : darkenHex(secondary, 0.7), 0.55),
        overlay: `linear-gradient(135deg, ${hexWithAlpha(primary, 0.06)} 0%, transparent 60%)`,
      }, bg);
    }

    case 'vibrant':
      return resolveToken({
        bg: `linear-gradient(145deg, ${primary} 0%, ${darkenHex(primary, 0.75)} 100%)`,
        text: isDarkPrimary ? '#FFFFFF' : darkenHex(secondary, 0.8),
        accent: isDarkPrimary ? '#FFFFFF' : secondary,
        muted: isDarkPrimary ? 'rgba(255,255,255,0.65)' : hexWithAlpha(secondary, 0.65),
        overlay: `linear-gradient(135deg, ${hexWithAlpha('#FFFFFF', 0.12)} 0%, transparent 60%)`,
      }, primary);

    case 'gradient':
      return resolveToken({
        bg: `linear-gradient(145deg, ${primary} 0%, ${secondary} 100%)`,
        text: isDarkPrimary && isDarkSecondary ? '#FFFFFF' : darkenHex(secondary, 0.85),
        accent: isDarkPrimary ? tertiary : '#FFFFFF',
        muted: hexWithAlpha(isDarkPrimary ? tertiary : '#FFFFFF', 0.6),
        overlay: `linear-gradient(135deg, ${hexWithAlpha('#FFFFFF', 0.08)} 0%, transparent 50%)`,
      }, primary);

    case 'split':
      return resolveToken({
        bg: `linear-gradient(135deg, ${secondary} 50%, ${primary} 50%)`,
        text: isDarkSecondary ? '#FFFFFF' : darkenHex(secondary, 0.8),
        accent: primary,
        muted: hexWithAlpha(isDarkSecondary ? '#FFFFFF' : tertiary, 0.6),
        overlay: undefined,
      }, secondary);

    case 'accent-bg': {
      const bg = secondary;
      return resolveToken({
        bg: `linear-gradient(145deg, ${bg} 0%, ${darkenHex(secondary, 0.8)} 100%)`,
        text: isDarkSecondary ? '#FFFFFF' : darkenHex(secondary, 0.85),
        accent: primary,
        muted: hexWithAlpha(isDarkSecondary ? '#FFFFFF' : tertiary, 0.55),
        overlay: `linear-gradient(135deg, ${hexWithAlpha(primary, 0.1)} 0%, transparent 65%)`,
      }, bg);
    }

    case 'minimal':
    default:
      return resolveToken({
        bg: `linear-gradient(145deg, #FFFFFF 0%, ${lightenHex(tertiary, 0.92)} 100%)`,
        text: isDarkSecondary ? secondary : darkenHex(secondary, 0.75),
        accent: primary,
        muted: hexWithAlpha(isDarkSecondary ? secondary : darkenHex(secondary, 0.75), 0.5),
        overlay: `linear-gradient(135deg, ${hexWithAlpha(primary, 0.04)} 0%, transparent 70%)`,
      }, '#FFFFFF');
  }
}

// ─── Color Utilities ──────────────────────────────────────────────────────────

/** Returns true if the hex color is perceptually dark */
export function isColorDark(hex: string): boolean {
  const rgb = hexToRgb(hex);
  if (!rgb) return true;
  const luminance = (0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b) / 255;
  return luminance < 0.5;
}

/** Darkens a hex color by a factor (0=black, 1=original) */
export function darkenHex(hex: string, factor: number): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return hex;
  return `rgb(${Math.round(rgb.r * factor)}, ${Math.round(rgb.g * factor)}, ${Math.round(rgb.b * factor)})`;
}

/** Lightens a hex color toward white by a factor (0=white, 1=original) */
export function lightenHex(hex: string, factor: number): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return hex;
  const r = Math.round(rgb.r + (255 - rgb.r) * (1 - factor));
  const g = Math.round(rgb.g + (255 - rgb.g) * (1 - factor));
  const b = Math.round(rgb.b + (255 - rgb.b) * (1 - factor));
  return `rgb(${r}, ${g}, ${b})`;
}

/** Returns hex color with alpha as rgba() */
export function hexWithAlpha(hex: string, alpha: number): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return `rgba(0,0,0,${alpha})`;
  return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})`;
}

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const clean = hex.replace('#', '').trim();
  if (clean.length !== 6 && clean.length !== 3) return null;
  const full = clean.length === 3 ? clean.split('').map(c => c + c).join('') : clean;
  const num = parseInt(full, 16);
  return { r: (num >> 16) & 255, g: (num >> 8) & 255, b: num & 255 };
}

// ─── Enums for AI schema ──────────────────────────────────────────────────────
export const BG_TYPE_ENUM: BgType[] = ['dark', 'light', 'vibrant', 'gradient', 'split', 'accent-bg', 'minimal'];

export const DECORATIVE_ELEMENT_ENUM: DecorativeElement[] = [
  'circles', 'diamond-grid', 'triangle-burst', 'slash', 'arch', 'cross-marks', 'abstract',
  'grid', 'dots', 'halftone', 'diagonal-stripes', 'hexagon-mesh',
  'blob', 'waves', 'brush', 'radial-glow',
  'corner-frame', 'lines', 'arrows', 'floating-shapes', 'typographic',
  'none',
];

export const DECORATIVE_DESCRIPTIONS: Record<DecorativeElement, string> = {
  circles: 'anillos concéntricos tipo radar/objetivo — ideal para precisión, tecnología y sofisticación.',
  'diamond-grid': 'rombos Bauhaus en diagonal — estructura geométrica moderna y editorial.',
  'triangle-burst': 'triángulos explotando desde una esquina — energía, dinamismo y disrupción.',
  slash: 'franja diagonal brutalista que corta el canvas — audaz, moderno y cortante.',
  arch: 'arco arquitectónico tipo portal elegante — aspiracional, lujo y apertura.',
  'cross-marks': 'marcas × dispersas — orgánico, artístico y rítmico.',
  abstract: 'cuadrados rotados tipo Bauhaus — complejidad visual y arte geométrico.',
  grid: 'cuadrícula de líneas finas — técnico, estructurado y minimalista.',
  dots: 'grid de puntos equidistantes — sutil, limpio y ordenado.',
  halftone: 'trama serigráfica que se desvanece — retro premium, estilo offset y artístico.',
  'diagonal-stripes': 'rayas diagonales paralelas — movimiento constante y dirección.',
  'hexagon-mesh': 'malla hexagonal tipo panal — conectividad, red y tecnología.',
  blob: 'manchas orgánicas difuminadas — amigable, fluido y natural.',
  waves: 'ondas fluidas tipo paisaje — serenidad, movimiento suave y elegancia natural.',
  brush: 'brochazos pintados orgánicos — creatividad, artesanal y humano.',
  'radial-glow': 'resplandor radial tipo halo — enfoque, iluminación y atmósfera.',
  'corner-frame': 'marcos en las 4 esquinas — enfoque editorial, clásico y encuadrado.',
  lines: 'columnas editoriales verticales — ritmo tipográfico y estructura de revista.',
  arrows: 'flechas vectoriales direccionales — guía, crecimiento y movimiento.',
  'floating-shapes': 'mix de formas a distintas escalas — juguetón, variado y dinámico.',
  typographic: 'letra gigante como fondo — impacto tipográfico puro y estilo póster.',
  none: 'sin decoración — para máxima simplicidad.',
};

export const LAYOUT_ENUM: SlideLayout[] = [
  'center', 'split-left', 'split-right', 'bottom-heavy', 'diagonal', 'minimal-text',
];

// ...existing code...
export const MOOD_ENUM: SlideMood[] = [
  'bold', 'elegant', 'playful', 'minimal', 'dramatic', 'editorial',
];

/**
 * Ensures contrast between text and background using WCAG principles.
 * If contrast is too low, it darkens or lightens the text.
 */
export function ensureContrast(textHex: string, bgHex: string): string {
  const l1 = getRelativeLuminance(textHex);
  const l2 = getRelativeLuminance(bgHex);
  const ratio = getContrastRatio(l1, l2);

  if (ratio >= 4.5) return textHex;

  // If contrast is poor, move text toward black or white
  return l2 > 0.5 ? darkenHex(textHex, 0.4) : lightenHex(textHex, 0.8);
}

function getRelativeLuminance(color: string): number {
  const hex = color.startsWith('rgb') ? rgbToHex(color) : color;
  const rgb = hexToRgb(hex);
  if (!rgb) return 0;
  const a = [rgb.r, rgb.g, rgb.b].map(v => {
    v /= 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  });
  return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
}

function getContrastRatio(l1: number, l2: number): number {
  const brightest = Math.max(l1, l2);
  const darkest = Math.min(l1, l2);
  return (brightest + 0.05) / (darkest + 0.05);
}

function rgbToHex(rgbStr: string): string {
  const match = rgbStr.match(/\d+/g);
  if (!match) return '#000000';
  const [r, g, b] = match.map(Number);
  return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
}
