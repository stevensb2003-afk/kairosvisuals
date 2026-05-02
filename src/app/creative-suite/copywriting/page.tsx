'use client';

import { CopywritingHub } from '@/components/creative-suite/copywriting';

const API_KEY = process.env.NEXT_PUBLIC_GEMINI_API_KEY || '';

export default function CopywritingPage() {
  return (
    <div className="h-full bg-[#0A1A26] overflow-hidden">
      <CopywritingHub apiKey={API_KEY} />
    </div>
  );
}
