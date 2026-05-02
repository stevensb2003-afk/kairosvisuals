import type { BrandBook } from '@/lib/types';

export function buildBrandContext(
  bb: BrandBook,
  opts?: { includeVisualIdentity?: boolean }
): string {
  const lines = [
    'BRAND BOOK:',
    `- Nombre: ${bb.name}`,
    `- Industria: ${bb.industry || 'N/A'}`,
    `- Misión: ${bb.mission || 'N/A'}`,
    `- Visión: ${bb.vision || 'N/A'}`,
    `- Valores: ${bb.values || 'N/A'}`,
    `- Propósito: ${bb.purpose || 'N/A'}`,
    `- Audiencia: ${bb.targetAudience || 'N/A'}`,
    `- Tono: ${bb.tone?.join(', ') || 'N/A'}`,
    `- Estilo gráfico: ${bb.visualIdentity?.graphicStyle || 'N/A'}`,
  ];

  if (opts?.includeVisualIdentity) {
    lines.push(
      '',
      'PALETA DE COLORES:',
      `  - Principal: ${bb.visualIdentity?.primaryColor || '#0A1A26'}`,
      `  - Secundario: ${bb.visualIdentity?.secondaryColor || '#FF5C2B'}`,
      `  - Terciario: ${bb.visualIdentity?.tertiaryColor || '#E8D9C5'}`,
      '',
      'TIPOGRAFÍA:',
      `  - Títulos: ${bb.visualIdentity?.typography?.primary || 'Montserrat'}`,
      `  - Cuerpo: ${bb.visualIdentity?.typography?.secondary || 'Inter'}`,
    );
  }

  return lines.join('\n');
}
