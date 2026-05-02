'use client';

import { ContentStudio } from '@/components/creative-suite/content-studio';

const API_KEY = process.env.NEXT_PUBLIC_GEMINI_API_KEY || '';

export default function ContentStudioPage() {
  return (
    <div className="h-full bg-[#0A1A26] overflow-hidden">
      <ContentStudio apiKey={API_KEY} />
    </div>
  );
}
