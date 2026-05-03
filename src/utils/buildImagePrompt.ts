import type { BrandBook } from '@/lib/types';

/**
 * Construye un prompt súper optimizado en inglés para Imagen 3,
 * inyectando el contexto de identidad visual de la marca y las sugerencias de Gemini.
 */
export function buildImagePromptFromBrand(
  bb: BrandBook | null,
  imageHint: string,
  userTopic: string
): string {
  // Base prompt with the core visual hint from Gemini
  let prompt = `Professional photography, ${imageHint}.`;

  if (bb) {
    const graphicStyle = bb.visualIdentity?.graphicStyle || 'Modern and professional';
    const industry = bb.industry || 'general';
    const primaryColor = bb.visualIdentity?.primaryColor || '#0A1A26';
    const secondaryColor = bb.visualIdentity?.secondaryColor || '#FF5C2B';
    const tone = bb.tone && bb.tone.length > 0 ? bb.tone.join(', ') : 'Professional';

    prompt += ` Visual style: ${graphicStyle}.`;
    prompt += ` Industry: ${industry}.`;
    prompt += ` Color palette inspiration: ${primaryColor}, ${secondaryColor}.`;
    prompt += ` Brand personality: ${tone}.`;
  }

  if (userTopic && userTopic.trim() !== '') {
    prompt += ` Context topic: ${userTopic}.`;
  }

  prompt += ` High resolution, commercial quality, editorial lighting.`;

  return prompt.trim();
}
