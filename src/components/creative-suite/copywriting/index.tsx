'use client';

import { useState } from 'react';
import { PenLine, FileText, Sparkles, MessageSquareText } from 'lucide-react';
import { cn } from '@/lib/utils';
import { CopyGenerator } from './copy-generator';
import { ScriptWriter } from './script-writer';

type Tab = 'copy' | 'script';

interface CopywritingHubProps {
  apiKey: string;
}

export function CopywritingHub({ apiKey }: CopywritingHubProps) {
  const [activeTab, setActiveTab] = useState<Tab>('copy');

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'copy', label: 'Generador de Copy', icon: <PenLine className="w-4 h-4" /> },
    { id: 'script', label: 'Escritor de Guiones', icon: <FileText className="w-4 h-4" /> },
  ];

  return (
    <div className="h-full flex flex-col space-y-6 max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 shrink-0">
        <div>
          <h1 className="text-3xl font-headline font-bold flex items-center gap-3 text-white">
            <div className="w-10 h-10 rounded-xl bg-[#FF5C2B]/20 flex items-center justify-center">
              <MessageSquareText className="w-6 h-6 text-[#FF5C2B]" />
            </div>
            Copywriting & Scripts
          </h1>
          <p className="text-white/50 mt-1.5 text-sm">
            Diseña textos persuasivos y guiones creativos alineados a tu marca.
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-1.5 p-1.5 bg-white/[0.03] rounded-2xl border border-white/5 backdrop-blur-sm self-start">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'flex items-center gap-2.5 px-6 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all',
                activeTab === tab.id
                  ? 'bg-[#FF5C2B] text-white shadow-xl shadow-[#FF5C2B]/20'
                  : 'text-white/35 hover:text-white/60 hover:bg-white/5'
              )}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="w-full border-t border-white/5 shrink-0" />

      {/* Content Area */}
      <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar pr-2">
        {activeTab === 'copy' ? (
          <CopyGenerator apiKey={apiKey} />
        ) : (
          <ScriptWriter apiKey={apiKey} />
        )}
      </div>
    </div>
  );
}
