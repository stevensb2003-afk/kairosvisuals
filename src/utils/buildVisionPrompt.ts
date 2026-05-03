import {
  BG_TYPE_ENUM,
  DECORATIVE_ELEMENT_ENUM,
  DECORATIVE_DESCRIPTIONS,
  LAYOUT_ENUM,
  MOOD_ENUM,
  TEXT_EFFECT_ENUM,
  FRAME_TYPE_ENUM,
} from '@/constants/creative-palettes';
import { OutputFormat } from '@/components/creative-suite/hooks/useVisionEngine';

interface PromptConfig {
  format: OutputFormat;
  service: string;
  tone: string;
  cta: string;
  topic: string;
  brandContext: string;
  logoInstruction: string;
  hasReferenceImage: boolean;
  brandBookId: string | null;
  manualColors: { primary: string; secondary: string; tertiary: string } | null;
  manualTypography: { primary: string; secondary: string } | null;
  carouselSlideCount: number;
  imageRatio?: string;
  imagePersonGeneration?: string;
  imageSeed?: number | null;
  imageNegativePrompt?: string;
}

function buildFormatInstruction(format: OutputFormat, slideCount: number): string {
  if (format === 'post') {
    return `FORMATO POST ESTÁTICO: Genera 3 OPCIONES VISUALMENTE DISTINTAS (misma idea, enfoques y estéticas radicalmente diferentes).
- OBLIGATORIO: Cada opción DEBE usar diferente bgType, diferente decorativeElement y diferente mood.
- Genera mucha ASIMETRÍA y distribuciones espaciales poco convencionales. Evita diseños genéricos.
- Formato 4:5 (1080x1350px). ZONA SEGURA: el contenido principal debe caber en el área cuadrada central (1080x1080px).`;
  }

  if (format === 'carousel') {
    return `FORMATO CARRUSEL ESTRATÉGICO: Genera exactamente ${slideCount} slides con narrativa persuasiva cinematográfica:
- La narrativa debe fluir lógicamente desde un gancho poderoso (Slide 1), pasando por desarrollo/problema, hasta llegar a la conclusión y CTA (Slide ${slideCount}).
- OBLIGATORIO: No repetir bgType, layout ni decorativeElement consecutivos. Máxima variedad visual y asimetría.
- Alterna entre slides con mucha carga tipográfica y slides más respirables/visuales.
- Formato 4:5 (1080x1350px). ZONA SEGURA: contenido centrado en área 1:1 central.`;
  }

  return `FORMATO PORTADA REEL: Genera 3 OPCIONES de portadas de reel para máximo impacto en feed.
- Layout SIEMPRE "center" para respetar zona segura 9:16.
- Título de máximo 4 palabras en mayúsculas — que detenga el scroll.
- Cada opción con diferente bgType, mood y decorativeElement para ofrecer variedad real.
- Formato 9:16 (1080x1920px). Zona segura: área central con margen de 12% en todos los lados.`;
}

export function buildSystemPrompt(config: PromptConfig): string {
  const {
    format, service, tone, cta, brandContext, logoInstruction,
    hasReferenceImage, brandBookId, carouselSlideCount,
    imageRatio, imagePersonGeneration, imageNegativePrompt
  } = config;

  const formatInstruction = buildFormatInstruction(format, carouselSlideCount);

  const tonePart = tone && tone !== 'none' ? ` TONO EMOCIONAL: ${tone}.` : '';
  const ctaPart = cta && cta !== 'none' ? ` ACCIÓN DESEADA: ${cta}.` : '';
  const servicePart =
    service && service !== 'none' && service !== 'Equipo Kairós'
      ? ` SERVICIO A DESTACAR: "${service}".`
      : service === 'Equipo Kairós'
      ? ' ENFOQUE: la creatividad, pasión y talento del equipo Kairós como diferenciador.'
      : '';

  const imageRefPart = hasReferenceImage
    ? ' IMAGEN DE REFERENCIA ADJUNTA: analiza la composición, jerarquía visual, proporción texto/imagen, distribución espacial y energía de la pieza. Replica y eleva esa estética — adapta layouts, decorativos y mood a la identidad de la marca. Nota: los colores del canvas siempre serán los de la marca, no los de la imagen.'
    : '';

  const ratioPart = imageRatio ? ` PROPORCIÓN OBJETIVO DE IMAGEN: ${imageRatio}. Adapta las ideas visuales para que funcionen bien en este aspecto.` : '';
  const personGenerationPart = imagePersonGeneration === 'dont_allow'
    ? ' REGLA ESTRICTA DE IMAGEN: NO incluir personas, rostros, siluetas ni partes del cuerpo humano en el imageHint.'
    : imagePersonGeneration === 'allow_adult'
    ? ' REGLA DE IMAGEN: Si incluyes personas en el imageHint, deben ser únicamente adultos.'
    : '';
  const negativePromptPart = imageNegativePrompt ? ` ELEMENTOS PROHIBIDOS EN LA IMAGEN (Negative Prompt): ${imageNegativePrompt}. NUNCA sugieras estos elementos en el imageHint.` : '';

  const creativityRules = `
REGLAS DE CALIDAD CREATIVA MÁXIMA:
- Titles: ≤7 palabras, MAYÚSCULAS, impacto inmediato — que detengan el scroll.
- Subtitles: ≤10 palabras, contextualizan el título sin repetirlo.
- Content: ≤30 palabras de prosa fluida — nunca listas con guiones.
- ImageHint: ≤15 palabras en inglés. Genera fondos fotográficos limpios, profesionales y de alta calidad (high-end photography, cinematic lighting). EVITA collages, superposiciones extrañas o texto en la imagen. La imagen debe servir como un fondo perfecto y unificado, no como una composición recargada.
- VARIEDAD OBLIGATORIA: No repetir la misma combinación de [bgType + layout + decorativeElement + mood] en ningún slide o opción.
- ESTRUCTURA bgType — CRÍTICO: Los colores del canvas SIEMPRE son los de la marca/paleta del cliente. El bgType solo define la ESTRUCTURA del fondo:
  * "dark" = fondo oscuro (usar primary oscurecido) — ideal para tech, lujo, drama
  * "light" = fondo claro/airy — ideal para lifestyle, wellness, minimalismo
  * "vibrant" = fondo con el primary color — máximo impacto y energía
  * "gradient" = degradado primary → secondary — movimiento y dinamismo
  * "split" = fondo dividido en diagonal — editorial, moderno, sorprendente
  * "accent-bg" = secondary como fondo, primary como acento — contraste elegante
  * "minimal" = fondo casi blanco — limpio, premium, tipográfico
- GUÍA DE ELEMENTOS DECORATIVOS — elige el más coherente con el mood y tema:
${Object.entries(DECORATIVE_DESCRIPTIONS).map(([key, desc]) => `  * ${key}: ${desc}`).join('\n')}
- TIPOGRAFÍA: Elige Google Fonts coherentes con el mood — nunca uses la misma fuente en todos los slides.
- Mood define la energía visual: "bold" es contundente, "elegant" es refinado, "dramatic" es cinematográfico, "editorial" es intelectual, "playful" es juguetón, "minimal" es tipográfico puro.
- EFECTOS Y MARCOS: Tienes el poder de añadir un textEffect al título (glow, drop-shadow, stroke, gradient, neon) o un frameType al contenido (solid, dashed, glass, minimal, neon-border). Úsalos de manera balanceada (no en todos los slides) para destacar momentos clave.`;

  const fontInstructions = config.manualTypography
    ? `FUENTES OBLIGATORIAS DE LA MARCA:
- fontPrimary: "${config.manualTypography.primary}"
- fontSecondary: "${config.manualTypography.secondary}"
NUNCA inventes fuentes. Usa EXCLUSIVAMENTE estas dos fuentes en todos los slides para mantener la fidelidad de la marca.`
    : brandBookId
    ? 'FUENTES: Usa OBLIGATORIAMENTE las fuentes definidas en el brand book adjunto.'
    : 'FUENTES: Selecciona combinaciones de Google Fonts coherentes con el mood de cada slide.';

  return `Eres el Director Creativo Senior de una agencia de marketing digital de clase mundial. Tu trabajo no es generar contenido promedio — es crear estrategia visual que conecte, emocione y convierta.
${formatInstruction}
${brandContext}${logoInstruction}
${tonePart}${ctaPart}${servicePart}${imageRefPart}
${ratioPart}${personGenerationPart}${negativePromptPart}
${creativityRules}
${fontInstructions}`;
}

export function buildUserPrompt(topic: string, hasReferenceImage: boolean): string {
  if (topic) return `BRIEF CREATIVO DEL CLIENTE: ${topic}`;
  if (hasReferenceImage) return 'Analiza la imagen adjunta en detalle y crea contenido estratégico que replique y eleve esa estética para la marca.';
  return 'Genera contenido creativo de alto impacto y máxima variedad visual para esta marca. Sorprende con ideas frescas e inesperadas.';
}

export function buildResponseSchema() {
  return {
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
            layout: { type: 'STRING', enum: LAYOUT_ENUM },
            bgType: { type: 'STRING', enum: BG_TYPE_ENUM },
            decorativeElement: { type: 'STRING', enum: DECORATIVE_ELEMENT_ENUM },
            mood: { type: 'STRING', enum: MOOD_ENUM },
            fontPrimary: { type: 'STRING' },
            fontSecondary: { type: 'STRING' },
            textEffect: { type: 'STRING', enum: TEXT_EFFECT_ENUM },
            frameType: { type: 'STRING', enum: FRAME_TYPE_ENUM },
          },
          required: ['title', 'subtitle', 'content', 'imageHint', 'layout', 'bgType', 'decorativeElement', 'mood', 'fontPrimary', 'fontSecondary', 'textEffect', 'frameType'],
        },
      },
    },
    required: ['slides'],
  };
}
