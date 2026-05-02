'use client';

import { useState, useCallback } from 'react';
import type { Firestore } from 'firebase/firestore';
import type { CopyLength, CopyOption, CopyPurpose, CopyTone, SavedCopy } from '@/lib/types';
import { getBrandBookById } from '@/lib/brandbookService';
import { saveCopy, getCopys, deleteCopy } from '@/lib/copywritingService';


const GEMINI_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';

const PURPOSE_LABELS: Record<CopyPurpose, string> = {
  inform: 'Informar',
  sell: 'Vender',
  cta: 'Call to Action',
  educate: 'Educar',
  promote: 'Promocionar',
  holiday: 'Feriado / Fecha especial',
  entertain: 'Entretener',
};

const TONE_LABELS: Record<CopyTone, string> = {
  professional: 'Profesional',
  casual: 'Casual',
  playful: 'Juguetón',
  luxurious: 'Lujoso',
  urgent: 'Urgente',
  inspirational: 'Inspiracional',
  educational: 'Educativo',
};

const LENGTH_WORDS: Record<CopyLength, string> = {
  short:  'menos de 30 palabras (máximo 125 caracteres)',
  medium: 'entre 125 y 300 palabras (500–1000 caracteres)',
  long:   'más de 300 palabras (1000–2200 caracteres)',
};

const LENGTH_STRUCTURE: Record<CopyLength, string> = {
  short:  'Gancho directo → 1-2 emojis relevantes → CTA conciso. SIN párrafos largos. Máximo 2 líneas.',
  medium: 'Titular llamativo → 2-3 párrafos cortos con saltos de línea → beneficio claro → CTA accionable. Usar emojis como separadores visuales.',
  long:   'Hook potente (primera línea que engancha) → narración dividida en párrafos muy breves (1-2 oraciones) → valor educativo o emocional profundo → CTA fuerte al final. Usar saltos de línea generosos para facilitar la lectura en móvil.',
};

interface CopywriterState {
  purpose: CopyPurpose;
  tone: CopyTone;
  length: CopyLength;
  context: string;
  holidayContext: string;
  brandBookId: string | null;
  clientId: string | null;
  clientName: string;
  useClientSelect: boolean;
  options: CopyOption[];
  isGenerating: boolean;
  isSaving: boolean;
  history: SavedCopy[];
  isLoadingHistory: boolean;
  error: string | null;
}

const initialState: CopywriterState = {
  purpose: 'inform',
  tone: 'professional',
  length: 'medium',
  context: '',
  holidayContext: '',
  brandBookId: null,
  clientId: null,
  clientName: '',
  useClientSelect: false,
  options: [],
  isGenerating: false,
  isSaving: false,
  history: [],
  isLoadingHistory: false,
  error: null,
};

export function useCopywriter(apiKey: string, db: Firestore, userId: string | null) {
  const [state, setState] = useState<CopywriterState>(initialState);

  const update = useCallback((partial: Partial<CopywriterState>) => {
    setState((s) => ({ ...s, ...partial }));
  }, []);

  const generate = useCallback(async () => {
    if (!apiKey) return;
    update({ isGenerating: true, error: null, options: [] });

    try {
      let brandContext = '';
      if (state.brandBookId) {
        const bb = await getBrandBookById(db, state.brandBookId);
        if (bb) {
          brandContext = `
BRAND BOOK DE LA MARCA:
- Nombre: ${bb.name}
- Industria: ${bb.industry || 'N/A'}
- Misión: ${bb.mission || 'N/A'}
- Valores: ${bb.values || 'N/A'}
- Propósito: ${bb.purpose || 'N/A'}
- Audiencia objetivo: ${bb.targetAudience || 'N/A'}
- Tono de comunicación habitual: ${bb.tone?.join(', ') || 'N/A'}
- Estilo gráfico: ${bb.visualIdentity?.graphicStyle || 'N/A'}
`.trim();
        }
      }

      const systemPrompt = `Eres un experto copywriter de marketing digital especializado en Instagram y redes sociales. 
Tu tarea es generar EXACTAMENTE 3 opciones de copy para una publicación, con variaciones de enfoque y estructura dentro del mismo tono.
Las 3 opciones deben ser diferentes en su forma de comunicar, no copias con cambios mínimos.
Responde ÚNICAMENTE con un JSON válido, sin texto adicional, sin markdown.`;

      const userPrompt = `Genera 3 opciones de copy para Instagram con estas especificaciones:

PROPÓSITO: ${PURPOSE_LABELS[state.purpose]}
${state.purpose === 'holiday' ? `FESTIVIDAD / FECHA: ${state.holidayContext}` : ''}
TONO: ${TONE_LABELS[state.tone]}
EXTENSIÓN: ${LENGTH_WORDS[state.length]}
ESTRUCTURA REQUERIDA: ${LENGTH_STRUCTURE[state.length]}
CONTEXTO / IDEA: ${state.context || 'Post general de marca'}
${state.clientName ? `PARA: ${state.clientName}` : ''}
${brandContext ? `\n${brandContext}` : ''}

REGLAS ESTRICTAS:
- Genera exactamente 3 opciones de alta calidad.
- Cada opción debe respetar ESTRICTAMENTE el rango de extensión: ${LENGTH_WORDS[state.length]}.
- Aplica la estructura indicada para el formato seleccionado: ${LENGTH_STRUCTURE[state.length]}
- Usa emojis pertinentes que refuercen el mensaje (más emojis en copy corto, menos en extenso).
- Incluye un Call to Action (CTA) potente y claro en cada opción.
- Las 3 opciones deben variar en estructura: una más directa, otra narrativa y otra interactiva (pregunta).
- Incluye hashtags relevantes al final.
- Usa saltos de línea reales (\n) para separar párrafos.

Responde con este JSON exacto:
{
  "options": [
    { "id": "a", "text": "...", "toneLabel": "Directa y clara" },
    { "id": "b", "text": "...", "toneLabel": "Storytelling" },
    { "id": "c", "text": "...", "toneLabel": "Gancho/Pregunta" }
  ]
}`;

      const res = await fetch(`${GEMINI_URL}?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
          systemInstruction: { parts: [{ text: systemPrompt }] },
          generationConfig: {
            temperature: 0.85,
            responseMimeType: 'application/json',
            responseSchema: {
              type: 'object',
              properties: {
                options: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      id: { type: 'string' },
                      text: { type: 'string' },
                      toneLabel: { type: 'string' },
                    },
                    required: ['id', 'text', 'toneLabel'],
                  },
                },
              },
              required: ['options'],
            },
          },
        }),
      });

      if (!res.ok) throw new Error(`API error: ${res.status}`);
      const data = await res.json();
      const raw = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!raw) throw new Error('Respuesta vacía de la API');
      const parsed = JSON.parse(raw);
      update({ options: parsed.options ?? [], isGenerating: false });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error desconocido';
      console.error('[Copywriter] Error:', msg);
      update({ isGenerating: false, error: msg });
    }
  }, [apiKey, db, state.purpose, state.tone, state.length, state.context, state.brandBookId, state.clientName, update]);

  const save = useCallback(async (selectedOptionId?: string) => {
    if (!userId || state.options.length === 0) return;
    update({ isSaving: true });
    try {
      await saveCopy(db, {
        userId,
        clientId: state.clientId ?? undefined,
        clientName: state.clientName || undefined,
        brandBookId: state.brandBookId ?? undefined,
        purpose: state.purpose,
        tone: state.tone,
        length: state.length,
        context: state.context,
        options: state.options,
        selectedOptionId,
      });
      await loadHistory();
    } catch (err) {
      console.error('[Copywriter] Save error:', err);
    } finally {
      update({ isSaving: false });
    }
  }, [db, userId, state, update]);

  const loadHistory = useCallback(async () => {
    if (!userId) return;
    update({ isLoadingHistory: true });
    try {
      const copys = await getCopys(db, userId);
      update({ history: copys, isLoadingHistory: false });
    } catch (err) {
      console.error('[Copywriter] History error:', err);
      update({ isLoadingHistory: false });
    }
  }, [db, userId, update]);

  const removeFromHistory = useCallback(async (id: string) => {
    try {
      await deleteCopy(db, id);
      update({ history: state.history.filter((c) => c.id !== id) });
    } catch (err) {
      console.error('[Copywriter] Delete error:', err);
    }
  }, [db, state.history, update]);

  return { state, update, generate, save, loadHistory, removeFromHistory };
}
