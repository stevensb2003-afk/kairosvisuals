'use client';

import { useState, useCallback } from 'react';
import { Firestore } from 'firebase/firestore';
import { getBrandBookById } from '@/lib/brandbookService';

export type OutputFormat = 'post' | 'carousel' | 'reel_cover';
export type BgType = 'navy' | 'orange' | 'cream';
export type SlideLayout = 'center' | 'split-left' | 'split-right' | 'bottom-heavy' | 'diagonal' | 'minimal-text';
export type DecorativeElement = 'arrows' | 'grid' | 'circles' | 'lines' | 'abstract' | 'none';

export interface Slide {
  title: string;
  subtitle: string;
  content: string;
  imageHint: string;
  layout: SlideLayout;
  bgType: BgType;
  decorativeElement: DecorativeElement;
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
    const { format, service, tone, cta, topic, referenceImageBase64, brandBookId, manualColors, manualTypography } = state;
    update({ isGenerating: true });

    let brandContext = '';

    if (brandBookId && db) {
      try {
        const brandBook = await getBrandBookById(db, brandBookId);
        if (brandBook) {
          const typoSecondary = brandBook.visualIdentity?.typography?.secondary || 'No especificada';
          brandContext = `
=== IDENTIDAD DE MARCA OFICIAL (LEE Y USA TODO) ===
EMPRESA: ${brandBook.name}
INDUSTRIA: ${brandBook.industry || 'No especificada'}
MISIÓN: ${brandBook.mission || 'No especificada'}
VISIÓN: ${(brandBook as any).vision || 'No especificada'}
PROPÓSITO: ${brandBook.purpose || 'No especificado'}
VALORES DE MARCA: ${brandBook.values || 'No especificados'}
PÚBLICO OBJETIVO: ${brandBook.targetAudience || 'No especificado'}
TONO DE VOZ: ${brandBook.tone?.join(', ') || 'No especificado'}
ESTILO GRÁFICO: ${brandBook.visualIdentity?.graphicStyle || 'No especificado'}

PALETA DE COLORES:
  - Color Principal: ${brandBook.visualIdentity?.primaryColor || '#0A1A26'}
  - Color Secundario: ${brandBook.visualIdentity?.secondaryColor || '#FF5C2B'}
  - Color Terciario: ${brandBook.visualIdentity?.tertiaryColor || '#E8D9C5'}

TIPOGRAFÍA DE MARCA:
  - Fuente Principal (Títulos): ${brandBook.visualIdentity?.typography?.primary || 'Montserrat'}
  - Fuente Secundaria (Cuerpo): ${typoSecondary}

REGLA ESTRICTA: Usa OBLIGATORIAMENTE las fuentes de marca en fontPrimary y fontSecondary.
Elige bgType basándote en qué color de la paleta comunica mejor cada slide (navy si el primario es oscuro, orange si el acento es cálido, cream si es neutro/claro).`;
        }
      } catch (err) {
        console.error('Error fetching brandbook', err);
      }
    } else {
      const pColor = manualColors?.primary || '#0A1A26';
      const sColor = manualColors?.secondary || '#FF5C2B';
      const tColor = manualColors?.tertiary || '#E8D9C5';
      const fontPrimary = manualTypography?.primary || 'Montserrat';
      const fontSecondary = manualTypography?.secondary || 'Inter';
      brandContext = `
=== ESTÉTICA Y MARCA MANUAL ===
PALETA:
  - Principal: ${pColor}
  - Secundario: ${sColor}
  - Terciario: ${tColor}
TIPOGRAFÍA: Principal "${fontPrimary}" para títulos, Secundaria "${fontSecondary}" para cuerpo.
REGLA ESTRICTA: Usa SIEMPRE "${fontPrimary}" en fontPrimary y "${fontSecondary}" en fontSecondary en cada slide.`;
    }

    const formatInstruction =
      format === 'post'
        ? `FORMATO POST ESTÁTICO: Genera 3 OPCIONES DISTINTAS (misma idea, diferentes enfoques visuales).
- Cada opción DEBE tener layout diferente: usa center, bottom-heavy y minimal-text.
- Alterna bgType entre las 3 opciones.
- Formato 4:5 (1080x1350px). ZONA SEGURA: El contenido principal debe caber en el área cuadrada central (1080x1080px). Solo logos o detalles decorativos pueden ir en las franjas superior e inferior.`
        : format === 'carousel'
        ? `FORMATO CARRUSEL ESTRATÉGICO: Genera exactamente 5 slides con estructura narrativa persuasiva:
- Slide 1 (HOOK): Pregunta o afirmación disruptiva que genere intriga. Layout: center o minimal-text.
- Slide 2 (PROBLEMA): Contexto del dolor o necesidad. Layout: bottom-heavy o split-left.
- Slide 3 (SOLUCIÓN): Valor principal de la marca. Layout: split-right o center.
- Slide 4 (PROFUNDIZACIÓN): Datos, beneficios o ejemplos concretos. Layout: diagonal o bottom-heavy.
- Slide 5 (CTA): Llamado a acción claro y directo. Layout: center.
- Formato 4:5 (1080x1350px). ZONA SEGURA: Contenido principal centrado en área 1:1 central.`
        : `FORMATO PORTADA REEL: Genera 3 OPCIONES de portadas de reel para impacto máximo.
- Usa SIEMPRE layout "center" para respetar la zona segura 9:16.
- Título impactante de máximo 4 palabras en mayúsculas.
- Formato 9:16 (1080x1920px). Zona segura: área central con margen de 12% en todos los lados.`;

    const creativityRules = `
=== REGLAS CREATIVAS OBLIGATORIAS ===
LONGITUD DE COPY (REGLA DE ORO — NO NEGOCIABLE):
  - title: MÁXIMO 6 palabras. Impactante, directo, en mayúsculas.
  - subtitle: MÁXIMO 8 palabras. Etiqueta o categoría en estilo minimalista.
  - content: MÁXIMO 25 palabras. Frase completa, clara y con punch. NO listas. Solo prosa concisa.
  - imageHint: Descripción visual en inglés para el diseñador. Máximo 15 palabras.

VARIEDAD VISUAL (OBLIGATORIA entre slides/opciones):
  - Nunca repitas el mismo layout en dos slides consecutivos.
  - Alterna decorativeElement: usa arrows, grid, circles, lines, abstract o none. Nunca el mismo dos veces seguidas.
  - Alterna bgType entre slides cuando sea posible.

ZONA SEGURA 1:1 (CRÍTICO):
  - El contenido textual PRINCIPAL (title + subtitle + content) debe diseñarse para caber en el área central cuadrada del canvas.
  - El imageHint puede sugerir elementos decorativos fuera de esa zona.
  - No uses textos largos que requieran múltiples líneas y desborden el cuadro.`;

    const systemPrompt = `Eres el Director Creativo Senior de una Agencia de Marketing Digital Premium. Tu misión es generar contenido visual estratégico de alto impacto para redes sociales.

${formatInstruction}

${brandContext}

${tone && tone !== 'none' ? `TONO ESPECÍFICO PARA ESTE CONTENIDO: ${tone}.` : ''}
${cta && cta !== 'none' ? `CTA OBLIGATORIO: El último slide o el CTA del diseño debe orientar al usuario a: ${cta}.` : ''}
${service && service !== 'none' && service !== 'Equipo Kairós' ? `SERVICIO A DESTACAR: "${service}". El contenido debe posicionar este servicio como la solución ideal.` : ''}
${service === 'Equipo Kairós' ? 'ENFOQUE HUMANO: Muestra el lado creativo, apasionado y talentoso del equipo Kairós. Autenticidad y calidad como valores.' : ''}
${referenceImageBase64 ? 'IMAGEN DE REFERENCIA: Analiza la imagen adjunta. Identifica su intención comunicativa, estilo visual y mensaje. Recréalo adaptado a la identidad de marca.' : ''}

${creativityRules}

FUENTES: En CADA slide, especifica fontPrimary (fuente para títulos) y fontSecondary (fuente para cuerpo). Deben ser fuentes de Google Fonts disponibles públicamente.`;

    const userPrompt = topic
      ? `BRIEF CREATIVO: ${topic}`
      : referenceImageBase64
      ? 'Crea contenido estratégico basado en la imagen de referencia adjunta.'
      : 'Genera contenido creativo y estratégico de alto impacto para esta marca.';

    const payload = {
      contents: [{
        parts: [
          { text: userPrompt },
          ...(referenceImageBase64 ? [{ inlineData: { mimeType: 'image/png', data: referenceImageBase64 } }] : []),
        ],
      }],
      systemInstruction: { parts: [{ text: systemPrompt }] },
      generationConfig: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: 'OBJECT',
          properties: {
            slides: {
              type: 'ARRAY',
              items: {
                type: 'OBJECT',
                properties: {
                  title: { type: 'STRING' },
                  subtitle: { type: 'STRING' },
                  content: { type: 'STRING' },
                  imageHint: { type: 'STRING' },
                  layout: { type: 'STRING', enum: ['center', 'split-left', 'split-right', 'bottom-heavy', 'diagonal', 'minimal-text'] },
                  bgType: { type: 'STRING', enum: ['navy', 'orange', 'cream'] },
                  decorativeElement: { type: 'STRING', enum: ['arrows', 'grid', 'circles', 'lines', 'abstract', 'none'] },
                  fontPrimary: { type: 'STRING' },
                  fontSecondary: { type: 'STRING' },
                },
                required: ['title', 'subtitle', 'content', 'imageHint', 'layout', 'bgType', 'decorativeElement', 'fontPrimary', 'fontSecondary'],
              },
            },
          },
          required: ['slides'],
        },
      },
    };

    try {
      const MODEL_ID = 'gemini-2.5-flash';
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL_ID}:generateContent?key=${apiKey}`;
      console.log('[VisionEngine] 🚀 Sending request to:', MODEL_ID);
      console.log('[VisionEngine] 📦 Format:', format, '| Topic:', topic || '(empty)');

      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      console.log('[VisionEngine] 📡 HTTP Status:', res.status, res.statusText);
      const result = await res.json();
      console.log('[VisionEngine] 📋 Full API Response (first 500):', JSON.stringify(result).substring(0, 500));

      if (!res.ok) {
        const errorMessage = result.error?.message || `HTTP ${res.status}: ${res.statusText}`;
        console.error('[VisionEngine] ❌ HTTP Error:', errorMessage);
        update({
          slides: [{
            title: "ERROR DE API",
            subtitle: `STATUS ${res.status}`,
            content: `${errorMessage}`,
            imageHint: "Verifica tu conexión o límite de peticiones.",
            layout: "center",
            bgType: "orange",
            decorativeElement: "abstract",
          }],
          currentIndex: 0,
        });
        return;
      }

      if (!result.candidates || result.candidates.length === 0) {
        const blockReason = result.promptFeedback?.blockReason || 'Sin motivo';
        console.error('[VisionEngine] ❌ No candidates. Block:', blockReason);
        update({
          slides: [{
            title: "SIN RESULTADOS",
            subtitle: "IA BLOQUEADA",
            content: `Motivo: ${blockReason}. Intenta cambiar tu prompt.`,
            imageHint: "Contenido bloqueado por filtros de seguridad.",
            layout: "center",
            bgType: "orange",
            decorativeElement: "abstract",
          }],
          currentIndex: 0,
        });
        return;
      }

      const candidate = result.candidates[0];
      const finishReason = candidate.finishReason || 'UNKNOWN';
      console.log('[VisionEngine] ✅ finishReason:', finishReason);

      if (!candidate.content?.parts?.length) {
        console.error('[VisionEngine] ❌ No content/parts. finishReason:', finishReason);
        update({
          slides: [{
            title: "RESPUESTA VACÍA",
            subtitle: `REASON: ${finishReason}`,
            content: `La IA respondió sin contenido utilizable. Intenta con otro prompt.`,
            imageHint: "Respuesta filtrada o truncada.",
            layout: "center",
            bgType: "orange",
            decorativeElement: "abstract",
          }],
          currentIndex: 0,
        });
        return;
      }

      let text = candidate.content.parts[0].text;
      console.log('[VisionEngine] 📄 Raw text (300):', text?.substring(0, 300));

      if (!text) {
        console.error('[VisionEngine] ❌ text vacío');
        update({
          slides: [{
            title: "TEXTO VACÍO",
            subtitle: "SIN DATOS",
            content: "La IA devolvió respuesta sin texto. Intenta de nuevo.",
            imageHint: "Respuesta vacía.",
            layout: "center",
            bgType: "orange",
            decorativeElement: "abstract",
          }],
          currentIndex: 0,
        });
        return;
      }

      text = text.replace(/```json/g, '').replace(/```/g, '').trim();
      const data = JSON.parse(text);
      console.log('[VisionEngine] 🎨 Slides parsed:', data.slides?.length);

      if (!data.slides || !Array.isArray(data.slides) || data.slides.length === 0) {
        console.error('[VisionEngine] ❌ JSON sin slides:', data);
        update({
          slides: [{
            title: "JSON INCOMPLETO",
            subtitle: "FORMATO INVÁLIDO",
            content: "La IA devolvió JSON sin el array slides. Intenta de nuevo.",
            imageHint: "Formato de respuesta inesperado.",
            layout: "center",
            bgType: "orange",
            decorativeElement: "abstract",
          }],
          currentIndex: 0,
        });
        return;
      }

      console.log('[VisionEngine] ✅ SUCCESS! Generated', data.slides.length, 'slides');
      update({ slides: data.slides, currentIndex: 0 });
    } catch (error: any) {
      console.error('[VisionEngine] 💥 CATCH:', error.message, error);
      update({
        slides: [{
          title: "ERROR INTERNO",
          subtitle: "EXCEPCIÓN",
          content: `Fallo: ${error.message || 'Error desconocido'}. Revisa F12.`,
          imageHint: "Error de procesamiento interno.",
          layout: "center",
          bgType: "orange",
          decorativeElement: "abstract",
        }],
        currentIndex: 0,
      });
    } finally {
      update({ isGenerating: false });
    }
  }, [state, apiKey, db, update]);

  const generateCaption = useCallback(async () => {
    const { slides, currentIndex, format, tone, cta } = state;
    if (!slides.length) return;

    update({ isCaptionModalOpen: true, isGeneratingCaption: true, captionText: '' });

    const effectiveTone = (tone && tone !== 'none') ? tone : 'Minimalist Luxe (sofisticado e inspirador)';
    const effectiveCta = (cta && cta !== 'none') ? cta : 'Interacción y engagement';

    const slideData = format === 'carousel'
      ? slides.map((s, i) => `Slide ${i + 1}: ${s.title} — ${s.content}`).join('\n')
      : `Título: ${slides[currentIndex].title}\nSubtítulo: ${slides[currentIndex].subtitle}\nContenido: ${slides[currentIndex].content}`;

    const systemPrompt = `Eres el Copywriter de Kairós Studio. Tono: ${effectiveTone}.
Redacta un caption CORTO para Instagram/LinkedIn. Estructura: 1) Gancho impactante 2) Valor en máx. 2 líneas 3) CTA claro — Objetivo: ${effectiveCta} 4) 3-5 hashtags relevantes.
Ortografía impecable. Lectura rápida.`;

    const payload = {
      contents: [{ parts: [{ text: `Genera un caption para esta publicación:\n\n${slideData}` }] }],
      systemInstruction: { parts: [{ text: systemPrompt }] },
    };

    try {
      const MODEL_ID = 'gemini-2.5-flash';
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${MODEL_ID}:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const result = await res.json();

      if (!res.ok || !result.candidates?.length) {
        console.warn('[VisionEngine] Caption API error:', result);
        update({ captionText: `Error: ${result.error?.message || 'No se pudo generar el caption.'}` });
        return;
      }

      const text = result.candidates[0].content.parts[0].text;
      update({ captionText: text });
    } catch (error: any) {
      console.warn('[VisionEngine] Caption catch:', error);
      update({ captionText: `Fallo interno: ${error.message}` });
    } finally {
      update({ isGeneratingCaption: false });
    }
  }, [state, apiKey, update]);

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
