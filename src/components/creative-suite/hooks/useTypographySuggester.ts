'use client';

import { useState, useCallback } from 'react';

const GEMINI_URL = '/api/gemini';

export interface TypographySuggestion {
  name: string;
  primary: string;
  secondary: string;
  why: string;
  fitScore: number;
}

export interface BrandBriefing {
  brandName: string;
  industry: string;
  styles: string[];
  audiences: string[];
  platforms: string[];
}

const SYSTEM_PROMPT = `Eres un experto en tipografía, branding y diseño editorial premium.
El usuario te describe una marca y debes sugerir las 3 mejores combinaciones tipográficas.
Responde ÚNICAMENTE con un array JSON válido (sin markdown ni texto extra) con esta estructura exacta:
[
  {
    "name": "Nombre estilístico de la combinación",
    "primary": "NombreFuenteGoogleFonts",
    "secondary": "NombreFuenteGoogleFonts",
    "why": "Razón de 1 oración: por qué esta combinación encaja con la marca.",
    "fitScore": 95
  }
]
Reglas:
- Solo usa fuentes disponibles en Google Fonts.
- El fitScore va de 70 a 99 (número entero).
- Las 3 combinaciones deben ser distintas entre sí (estilos diferentes).
- Ordénalas de mayor a menor fitScore.`;

export function useTypographySuggester() {
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<TypographySuggestion[]>([]);
  const [error, setError] = useState<string | null>(null);

  const suggestFromBriefing = useCallback(
    async (briefing: BrandBriefing): Promise<TypographySuggestion[]> => {
      setIsLoading(true);
      setError(null);
      setSuggestions([]);

      const prompt = [
        briefing.brandName ? `Nombre de marca: "${briefing.brandName}".` : '',
        briefing.industry ? `Industria: ${briefing.industry}.` : '',
        briefing.styles.length ? `Estilo de comunicación: ${briefing.styles.join(', ')}.` : '',
        briefing.audiences.length ? `Público objetivo: ${briefing.audiences.join(', ')}.` : '',
        briefing.platforms.length ? `Plataformas principales: ${briefing.platforms.join(', ')}.` : '',
      ]
        .filter(Boolean)
        .join(' ');

      try {
        const res = await fetch(GEMINI_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ role: 'user', parts: [{ text: prompt }] }],
            systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
            generationConfig: { responseMimeType: 'application/json' },
          }),
        });

        const result = await res.json();
        if (!res.ok || !result.candidates?.length)
          throw new Error('Sin respuesta de la IA');

        const data: TypographySuggestion[] = JSON.parse(
          result.candidates[0].content.parts[0].text
        );
        setSuggestions(data);
        return data;
      } catch {
        setError('Error al generar sugerencias. Intenta de nuevo.');
        return [];
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const clearSuggestions = useCallback(() => {
    setSuggestions([]);
    setError(null);
  }, []);

  return { isLoading, suggestions, error, suggestFromBriefing, clearSuggestions };
}
