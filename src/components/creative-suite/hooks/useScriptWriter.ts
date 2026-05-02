'use client';

import { useState, useCallback } from 'react';
import type { Firestore } from 'firebase/firestore';
import type { ScriptFormat, ScriptSection, SavedScript, CopyTone, CopyLength, CopyPurpose } from '@/lib/types';
import { getBrandBookById } from '@/lib/brandbookService';
import { buildBrandContext } from '@/utils/buildBrandContext';
import { saveScript, getScripts, deleteScript } from '@/lib/scriptService';

const GEMINI_URL = '/api/gemini';

export const SCRIPT_FORMAT_META: Record<ScriptFormat, { label: string; emoji: string; sections: string[] }> = {
  reel: {
    label: 'Reel',
    emoji: '🎬',
    sections: ['Hook (3s)', 'Desarrollo (15s)', 'Cierre (5s)', 'CTA'],
  },
  story_sequence: {
    label: 'Story Sequence',
    emoji: '📱',
    sections: ['Story 1 — Gancho', 'Story 2 — Desarrollo', 'Story 3 — Resolución', 'Story 4 — CTA'],
  },
  tutorial: {
    label: 'Tutorial',
    emoji: '🎓',
    sections: ['Intro', 'Paso 1', 'Paso 2', 'Paso 3', 'Cierre y CTA'],
  },
  presentation: {
    label: 'Presentación',
    emoji: '📊',
    sections: ['Apertura', 'Problema', 'Solución', 'Beneficios', 'CTA'],
  },
  podcast_intro: {
    label: 'Podcast Intro',
    emoji: '🎙️',
    sections: ['Gancho', 'Presentación del Host', 'Tema del Día', 'Transición'],
  },
  ad_spot: {
    label: 'Ad Spot (AIDA)',
    emoji: '📣',
    sections: ['Atención', 'Interés', 'Deseo', 'Acción'],
  },
};

interface ScriptWriterState {
  format: ScriptFormat;
  context: string;
  tone: CopyTone;
  length: CopyLength;
  purpose: CopyPurpose;
  holidayContext: string;
  brandBookId: string | null;
  clientId: string | null;
  clientName: string;
  useClientSelect: boolean;
  sections: ScriptSection[];
  isGenerating: boolean;
  isSaving: boolean;
  saveTitle: string;
  history: SavedScript[];
  isLoadingHistory: boolean;
  error: string | null;
}

const initialState: ScriptWriterState = {
  format: 'reel',
  context: '',
  tone: 'professional',
  length: 'medium',
  purpose: 'inform',
  holidayContext: '',
  brandBookId: null,
  clientId: null,
  clientName: '',
  useClientSelect: false,
  sections: [],
  isGenerating: false,
  isSaving: false,
  saveTitle: '',
  history: [],
  isLoadingHistory: false,
  error: null,
};

export function useScriptWriter(apiKey: string, db: Firestore, userId: string | null, mode: 'script' | 'copy' = 'script') {
  const [state, setState] = useState<ScriptWriterState>(initialState);

  const update = useCallback((partial: Partial<ScriptWriterState>) => {
    setState((s) => ({ ...s, ...partial }));
  }, []);

  const generate = useCallback(async () => {
    if (!apiKey) return;
    update({ isGenerating: true, error: null, sections: [] });

    const meta = SCRIPT_FORMAT_META[state.format];

    try {
      let brandContext = '';
      if (state.brandBookId && db) {
        const bb = await getBrandBookById(db, state.brandBookId);
        if (bb) brandContext = buildBrandContext(bb);
      }

      const systemPrompt = `Eres un experto en ${mode === 'script' ? 'guiones creativos' : 'copywriting y redacción publicitaria'} para contenido digital. 
Generas contenido estructurado, conciso y efectivo.
Responde ÚNICAMENTE con JSON válido, sin texto adicional.`;

      let userPrompt = '';
      if (mode === 'script') {
        const sectionsSchema = meta.sections.map((s) => `"${s}"`).join(', ');
        userPrompt = `Genera un guión de ${meta.label} (${meta.emoji}) con esta estructura: [${sectionsSchema}]

FORMATO: ${meta.label}
CONTEXTO / IDEA: ${state.context || 'Contenido general de marca'}
${state.clientName ? `PARA: ${state.clientName}` : ''}
${brandContext ? `\n${brandContext}` : ''}

REGLAS:
- Cada sección debe ser concisa, directa y lista para usar
- Adapta el tono y estilo al brand book si se proporcionó
- El guión debe sonar natural y humano, no corporativo`;
      } else {
        userPrompt = `Genera 3 opciones de COPY (texto publicitario/descriptivo) para redes sociales.

TONO: ${state.tone}
EXTENSIÓN: ${state.length}
PROPÓSITO: ${state.purpose}
${state.purpose === 'holiday' ? `FESTIVIDAD/CONTEXTO: ${state.holidayContext}` : ''}
IDEA/CONTEXTO: ${state.context || 'Contenido general de marca'}
${state.clientName ? `PARA: ${state.clientName}` : ''}
${brandContext ? `\n${brandContext}` : ''}

REGLAS:
- Genera exactamente 3 opciones (Opción 1, Opción 2, Opción 3)
- Cada opción debe tener un enfoque ligeramente distinto pero respetando el tono
- Incluye emojis pertinentes
- Incluye un Call to Action (CTA) potente en cada opción`;
      }

      const res = await fetch(GEMINI_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
          systemInstruction: { parts: [{ text: systemPrompt }] },
          generationConfig: {
            temperature: 0.8,
            responseMimeType: 'application/json',
            responseSchema: {
              type: 'object',
              properties: {
                sections: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      label: { type: 'string' },
                      content: { type: 'string' },
                    },
                    required: ['label', 'content'],
                  },
                },
              },
              required: ['sections'],
            },
          },
        }),
      });

      if (!res.ok) throw new Error(`API error: ${res.status}`);
      const data = await res.json();
      const raw = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!raw) throw new Error('Respuesta vacía de la API');
      const parsed = JSON.parse(raw);
      update({ sections: parsed.sections ?? [], isGenerating: false });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error desconocido';
      console.error('[ScriptWriter] Error:', msg);
      update({ isGenerating: false, error: msg });
    }
  }, [apiKey, db, state.format, state.context, state.brandBookId, state.clientName, update]);

  const updateSection = useCallback((index: number, content: string) => {
    setState((s) => {
      const sections = [...s.sections];
      sections[index] = { ...sections[index], content };
      return { ...s, sections };
    });
  }, []);

  const save = useCallback(async () => {
    if (!db || !userId || state.sections.length === 0) return;
    update({ isSaving: true });
    try {
      await saveScript(db, {
        userId,
        clientId: state.clientId ?? undefined,
        clientName: state.clientName || undefined,
        brandBookId: state.brandBookId ?? undefined,
        title: state.saveTitle || `Guión ${SCRIPT_FORMAT_META[state.format].label}`,
        format: state.format,
        context: state.context,
        sections: state.sections,
      });
      await loadHistory();
    } catch (err) {
      console.error('[ScriptWriter] Save error:', err);
    } finally {
      update({ isSaving: false });
    }
  }, [db, userId, state, update]);

  const loadHistory = useCallback(async () => {
    if (!db || !userId) return;
    update({ isLoadingHistory: true });
    try {
      const scripts = await getScripts(db, userId);
      update({ history: scripts, isLoadingHistory: false });
    } catch (err) {
      console.error('[ScriptWriter] History error:', err);
      update({ isLoadingHistory: false });
    }
  }, [db, userId, update]);

  const removeFromHistory = useCallback(async (id: string) => {
    if (!db) return;
    try {
      await deleteScript(db, id);
      update({ history: state.history.filter((s) => s.id !== id) });
    } catch (err) {
      console.error('[ScriptWriter] Delete error:', err);
    }
  }, [db, state.history, update]);

  return { state, update, generate, updateSection, save, loadHistory, removeFromHistory };
}
