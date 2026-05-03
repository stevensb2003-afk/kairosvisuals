'use client';

import { useState, useCallback } from 'react';
import { Firestore } from 'firebase/firestore';
import { getBrandBookById } from '@/lib/brandbookService';
import { buildBrandContext } from '@/utils/buildBrandContext';
import { buildSystemPrompt, buildUserPrompt, buildResponseSchema } from '@/utils/buildVisionPrompt';
import type { BgType, DecorativeElement, SlideLayout, SlideMood, BrandColors } from '@/constants/creative-palettes';

async function fetchLogoAsBase64(url: string): Promise<{ data: string; mimeType: string } | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const blob = await res.blob();
    const mimeType = blob.type || 'image/png';
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string;
        resolve({ data: dataUrl.split(',')[1], mimeType });
      };
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

export type OutputFormat = 'post' | 'carousel' | 'reel_cover';
export type { BgType, DecorativeElement, SlideLayout, SlideMood, BrandColors };

// Default brand colors (Kairós brand identity)
export const DEFAULT_BRAND_COLORS: BrandColors = {
  primary: '#FF5C2B',
  secondary: '#0A1A26',
  tertiary: '#E8D9C5',
};

export interface Slide {
  title: string;
  subtitle: string;
  content: string;
  imageHint: string;
  layout: SlideLayout;
  bgType: BgType;
  decorativeElement: DecorativeElement;
  mood?: SlideMood;
  fontPrimary?: string;
  fontSecondary?: string;
}

export interface VisionState {
  format: OutputFormat;
  service: string;
  tone: string;
  cta: string;
  topic: string;
  brandBookId: string | null;
  brandName: string | null;
  resolvedColors: BrandColors;               // ← always-accurate brand colors for canvas
  manualColors: { primary: string; secondary: string; tertiary: string } | null;
  manualTypography: { primary: string; secondary: string } | null;
  referenceImageBase64: string | null;
  referenceImagePreviewUrl: string | null;
  slides: Slide[];
  currentIndex: number;
  isGenerating: boolean;
  isBrandbookOpen: boolean;
  isCaptionModalOpen: boolean;
  captionText: string;
  isGeneratingCaption: boolean;
}

const initialState: VisionState = {
  format: 'carousel',
  service: 'none',
  tone: 'none',
  cta: 'none',
  topic: '',
  brandBookId: null,
  brandName: null,
  resolvedColors: DEFAULT_BRAND_COLORS,
  manualColors: null,
  manualTypography: null,
  referenceImageBase64: null,
  referenceImagePreviewUrl: null,
  slides: [],
  currentIndex: 0,
  isGenerating: false,
  isBrandbookOpen: false,
  isCaptionModalOpen: false,
  captionText: '',
  isGeneratingCaption: false,
};

function makeErrorSlide(title: string, subtitle: string, content: string, imageHint = 'Error visual.'): Slide[] {
  return [{
    title,
    subtitle,
    content,
    imageHint,
    layout: 'center',
    bgType: 'vibrant',
    decorativeElement: 'abstract',
    mood: 'dramatic',
  }];
}

export function useVisionEngine(apiKey: string, db: Firestore | null) {
  const [state, setState] = useState<VisionState>(initialState);

  const update = useCallback((patch: Partial<VisionState>) => {
    setState((prev) => ({ ...prev, ...patch }));
  }, []);

  const setFormat = useCallback((format: OutputFormat) => update({ format }), [update]);

  const handleImageSelect = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      update({
        referenceImageBase64: dataUrl.split(',')[1],
        referenceImagePreviewUrl: dataUrl,
      });
    };
    reader.readAsDataURL(file);
  }, [update]);

  const removeImage = useCallback(() => {
    update({ referenceImageBase64: null, referenceImagePreviewUrl: null });
  }, [update]);

  const nextSlide = useCallback(() => {
    setState((prev) => ({ ...prev, currentIndex: (prev.currentIndex + 1) % prev.slides.length }));
  }, []);

  const prevSlide = useCallback(() => {
    setState((prev) => ({ ...prev, currentIndex: (prev.currentIndex - 1 + prev.slides.length) % prev.slides.length }));
  }, []);

  const generate = useCallback(async () => {
    const {
      format, service, tone, cta, topic,
      referenceImageBase64, brandBookId, manualColors, manualTypography,
    } = state;

    update({ isGenerating: true });

    let brandContext = '';
    let brandName: string | null = null;
    let resolvedColors: BrandColors = DEFAULT_BRAND_COLORS;
    let logoInlineParts: { inlineData: { mimeType: string; data: string } }[] = [];

    if (brandBookId && db) {
      try {
        const brandBook = await getBrandBookById(db, brandBookId);
        if (brandBook) {
          brandName = brandBook.name ?? null;
          // Extract real brand colors — these will ALWAYS control canvas rendering
          resolvedColors = {
            primary: brandBook.visualIdentity?.primaryColor || DEFAULT_BRAND_COLORS.primary,
            secondary: brandBook.visualIdentity?.secondaryColor || DEFAULT_BRAND_COLORS.secondary,
            tertiary: brandBook.visualIdentity?.tertiaryColor || DEFAULT_BRAND_COLORS.tertiary,
          };
          brandContext = `\n=== IDENTIDAD DE MARCA OFICIAL: ${brandBook.name} ===\n${buildBrandContext(brandBook, { includeVisualIdentity: true })}\nEl canvas SIEMPRE usa los colores exactos de la marca. Usa bgType solo para definir la ESTRUCTURA (dark=oscuro, light=claro, vibrant=vibrante, gradient=degradado, split=dividido, accent-bg=secundario como fondo, minimal=blanco limpio).`;
          const logoUrls = [brandBook.logoAssets?.primary, brandBook.logoAssets?.icon]
            .filter((u): u is string => Boolean(u));
          if (logoUrls.length > 0) {
            const results = await Promise.all(logoUrls.map(fetchLogoAsBase64));
            logoInlineParts = results
              .filter((r): r is { data: string; mimeType: string } => r !== null)
              .map((r) => ({ inlineData: { mimeType: r.mimeType, data: r.data } }));
          }
        }
      } catch (err) {
        console.error('[VisionEngine] Error fetching brandbook:', err);
      }
    } else {
      const pColor = manualColors?.primary || DEFAULT_BRAND_COLORS.primary;
      const sColor = manualColors?.secondary || DEFAULT_BRAND_COLORS.secondary;
      const tColor = manualColors?.tertiary || DEFAULT_BRAND_COLORS.tertiary;
      resolvedColors = { primary: pColor, secondary: sColor, tertiary: tColor };
      const fontPrimary = manualTypography?.primary || 'Montserrat';
      const fontSecondary = manualTypography?.secondary || 'Inter';
      brandContext = `\n=== ESTÉTICA MANUAL ===\nPALETA: Principal ${pColor} · Secundario ${sColor} · Terciario ${tColor}\nFUENTES: "${fontPrimary}" títulos, "${fontSecondary}" cuerpo.\nUsa bgType solo para ESTRUCTURA: dark, light, vibrant, gradient, split, accent-bg, minimal.`;
    }

    const logoInstruction = logoInlineParts.length > 0
      ? `\nLOGOS ADJUNTOS (${logoInlineParts.length}): Se incluyen los logos oficiales como referencia visual. Analiza formas, estética y estilo. El diseño debe ser coherente con esta identidad.`
      : '';

    const systemPrompt = buildSystemPrompt({
      format, service, tone, cta, topic,
      brandContext,
      logoInstruction,
      hasReferenceImage: !!referenceImageBase64,
      brandBookId,
      manualColors,
      manualTypography,
    });

    const userPrompt = buildUserPrompt(topic, !!referenceImageBase64);

    const payload = {
      contents: [{
        parts: [
          { text: userPrompt },
          ...(referenceImageBase64 ? [{ inlineData: { mimeType: 'image/png', data: referenceImageBase64 } }] : []),
          ...logoInlineParts,
        ],
      }],
      systemInstruction: { parts: [{ text: systemPrompt }] },
      generationConfig: {
        responseMimeType: 'application/json',
        responseSchema: buildResponseSchema(),
      },
    };

    try {
      const res = await fetch('/api/gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const result = await res.json();

      if (!res.ok) {
        const msg = result.error?.message || `HTTP ${res.status}: ${res.statusText}`;
        console.error('[VisionEngine] ❌ HTTP Error:', msg);
        update({ slides: makeErrorSlide('ERROR DE API', `STATUS ${res.status}`, msg), currentIndex: 0 });
        return;
      }

      if (!result.candidates?.length) {
        const blockReason = result.promptFeedback?.blockReason || 'Sin motivo';
        console.error('[VisionEngine] ❌ No candidates. Block:', blockReason);
        update({ slides: makeErrorSlide('SIN RESULTADOS', 'IA BLOQUEADA', `Motivo: ${blockReason}. Intenta cambiar tu prompt.`), currentIndex: 0 });
        return;
      }

      const candidate = result.candidates[0];
      const finishReason = candidate.finishReason || 'UNKNOWN';

      if (!candidate.content?.parts?.length) {
        console.error('[VisionEngine] ❌ No content/parts. Reason:', finishReason);
        update({ slides: makeErrorSlide('RESPUESTA VACÍA', `REASON: ${finishReason}`, 'La IA respondió sin contenido. Intenta con otro prompt.'), currentIndex: 0 });
        return;
      }

      let text = candidate.content.parts[0].text;

      if (!text) {
        console.error('[VisionEngine] ❌ text vacío');
        update({ slides: makeErrorSlide('TEXTO VACÍO', 'SIN DATOS', 'La IA devolvió respuesta sin texto. Intenta de nuevo.'), currentIndex: 0 });
        return;
      }

      text = text.replace(/```json/g, '').replace(/```/g, '').trim();
      const data = JSON.parse(text);

      if (!data.slides || !Array.isArray(data.slides) || data.slides.length === 0) {
        console.error('[VisionEngine] ❌ JSON sin slides:', data);
        update({ slides: makeErrorSlide('JSON INCOMPLETO', 'FORMATO INVÁLIDO', 'La IA devolvió JSON sin slides. Intenta de nuevo.'), currentIndex: 0 });
        return;
      }

      update({ slides: data.slides, currentIndex: 0, brandName, resolvedColors });
    } catch (error: any) {
      console.error('[VisionEngine] 💥 CATCH:', error.message, error);
      update({ slides: makeErrorSlide('ERROR INTERNO', 'EXCEPCIÓN', `Fallo: ${error.message || 'Error desconocido'}. Revisa F12.`), currentIndex: 0 });
    } finally {
      update({ isGenerating: false });
    }
  }, [state, db, update]);

  const generateCaption = useCallback(async () => {
    const { slides, currentIndex, format, tone, cta, brandBookId } = state;
    if (!slides.length) return;

    update({ isCaptionModalOpen: true, isGeneratingCaption: true, captionText: '' });

    const effectiveTone = (tone && tone !== 'none') ? tone : 'Minimalist Luxe (sofisticado e inspirador)';
    const effectiveCta = (cta && cta !== 'none') ? cta : 'Interacción y engagement';

    let captionBrandContext = '';
    if (brandBookId && db) {
      try {
        const bb = await getBrandBookById(db, brandBookId);
        if (bb) captionBrandContext = `\n\nCONTEXTO DE MARCA:\n${buildBrandContext(bb)}`;
      } catch { /* silent */ }
    }

    const slideData = format === 'carousel'
      ? slides.map((s, i) => `Slide ${i + 1}: ${s.title} — ${s.content}`).join('\n')
      : `Título: ${slides[currentIndex].title}\nSubtítulo: ${slides[currentIndex].subtitle}\nContenido: ${slides[currentIndex].content}`;

    const systemPrompt = `Eres el Copywriter Senior de Kairós Studio. Tono: ${effectiveTone}.
Redacta un caption corto y poderoso para Instagram/LinkedIn.
Estructura: 1) Gancho que detiene el scroll 2) Valor en máx. 2 líneas 3) CTA claro — Objetivo: ${effectiveCta} 4) 3-5 hashtags relevantes.
Ortografía impecable. Lectura fluida en mobile.${captionBrandContext}`;

    const payload = {
      contents: [{ parts: [{ text: `Genera un caption para esta publicación:\n\n${slideData}` }] }],
      systemInstruction: { parts: [{ text: systemPrompt }] },
    };

    try {
      const res = await fetch('/api/gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const result = await res.json();

      if (!res.ok || !result.candidates?.length) {
        update({ captionText: `Error: ${result.error?.message || 'No se pudo generar el caption.'}` });
        return;
      }

      update({ captionText: result.candidates[0].content.parts[0].text });
    } catch (error: any) {
      update({ captionText: `Fallo interno: ${error.message}` });
    } finally {
      update({ isGeneratingCaption: false });
    }
  }, [state, db, update]);

  const copyCopys = useCallback(() => {
    if (!state.slides.length) return;
    const label = state.format === 'carousel' ? 'SLIDE' : 'OPCIÓN';
    const text = state.slides
      .map((s, i) => `${label} ${i + 1}\n[${s.subtitle}]\n${s.title}\n\n${s.content}\nSugerencia Visual: ${s.imageHint}\n---`)
      .join('\n\n');
    navigator.clipboard.writeText(text);
  }, [state.slides, state.format]);

  return { state, setFormat, handleImageSelect, removeImage, nextSlide, prevSlide, generate, generateCaption, copyCopys, update };
}
