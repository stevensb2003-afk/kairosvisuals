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

    // Inject logo assets when available
    const { logoAssets } = bb;
    const logoLines: string[] = [];
    if (logoAssets?.primary)    logoLines.push(`  - Logo Principal (URL): ${logoAssets.primary}`);
    if (logoAssets?.secondary)  logoLines.push(`  - Logo Secundario (URL): ${logoAssets.secondary}`);
    if (logoAssets?.icon)       logoLines.push(`  - Isotipo (URL): ${logoAssets.icon}`);
    if (logoAssets?.monochrome) logoLines.push(`  - Logo Monocromo (URL): ${logoAssets.monochrome}`);

    if (logoLines.length > 0) {
      lines.push(
        '',
        'ACTIVOS DE MARCA (LOGOS):',
        ...logoLines,
        '',
        'INSTRUCCIÓN DE BRANDING: La marca tiene logos registrados. En composiciones visuales, prioriza el isotipo o logo principal como elemento de identidad. Refleja la paleta y tipografía de la marca en todas las decisiones de diseño.',
      );
    }
  }

  return lines.join('\n');
}
