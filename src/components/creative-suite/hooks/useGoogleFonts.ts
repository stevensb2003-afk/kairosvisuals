'use client';

import { useEffect } from 'react';

const loadedFonts = new Set<string>();

export function useGoogleFonts(fontNames: (string | undefined | null)[]) {
  useEffect(() => {
    const validFonts = fontNames.filter((f): f is string => !!f && f !== 'auto');

    validFonts.forEach((fontName) => {
      if (loadedFonts.has(fontName)) return;
      loadedFonts.add(fontName);

      const encoded = encodeURIComponent(fontName);
      const href = `https://fonts.googleapis.com/css2?family=${encoded}:wght@400;700;900&display=swap`;

      const existing = document.querySelector(`link[data-gfont="${encoded}"]`);
      if (existing) return;

      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = href;
      link.crossOrigin = 'anonymous';
      link.setAttribute('data-gfont', encoded);
      document.head.appendChild(link);
    });
  }, [fontNames.join(',')]); // eslint-disable-line react-hooks/exhaustive-deps
}
