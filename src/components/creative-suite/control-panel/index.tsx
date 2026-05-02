'use client';

import { Loader2 } from 'lucide-react';
import { OutputFormat, VisionState } from '../hooks/useVisionEngine';
import { FormatSelector } from './format-selector';
import { StrategyControls } from './strategy-controls';
import { ImageUploader } from './image-uploader';

interface ControlPanelProps {
  state: VisionState;
  onFormatChange: (f: OutputFormat) => void;
  onStrategyChange: (key: 'service' | 'tone' | 'cta' | 'brandBookId' | 'manualColors' | 'manualTypography', value: any) => void;
  onTopicChange: (topic: string) => void;
  onImageSelect: (file: File) => void;
  onImageRemove: () => void;
  onGenerate: () => void;
  apiKey: string;
}

export function ControlPanel({
  state,
  onFormatChange,
  onStrategyChange,
  onTopicChange,
  onImageSelect,
  onImageRemove,
  onGenerate,
  apiKey,
}: ControlPanelProps) {
  return (
    <aside className="w-full lg:w-[420px] bg-[#0A1A26] border-r border-white/5 shadow-2xl z-30 flex flex-col h-full overflow-y-auto shrink-0 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent isolate">
      {/* Header */}
      <div className="p-7 pb-0 sticky top-0 bg-[#0A1A26] z-40">
        <div className="flex items-center gap-4 pb-6 border-b border-white/5">
          <div className="w-12 h-12 bg-[#FF5C2B] rounded-2xl flex items-center justify-center shadow-lg shadow-[#FF5C2B]/30 shrink-0">
            <span className="font-black text-2xl text-[#0A1A26]" style={{ fontFamily: "'Montserrat', sans-serif", letterSpacing: '-0.04em' }}>K</span>
          </div>
          <div>
            <h2 className="text-xl font-black leading-none text-white uppercase tracking-tight" style={{ fontFamily: "'Montserrat', sans-serif" }}>
              Kairós <span className="font-light text-[#FF5C2B] italic">Vision</span>
            </h2>
            <p className="text-[9px] font-bold tracking-[0.35em] text-stone-400 uppercase mt-1">Creative Director AI <span className="text-[#FF5C2B]/50 ml-1">Powered by Nano-Banana</span></p>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex-1 p-7 space-y-6">
        <FormatSelector value={state.format} onChange={onFormatChange} />
        <StrategyControls
          service={state.service}
          tone={state.tone}
          cta={state.cta}
          brandBookId={state.brandBookId}
          manualColors={state.manualColors}
          manualTypography={state.manualTypography}
          onChange={onStrategyChange}
          apiKey={apiKey}
        />
        <ImageUploader
          previewUrl={state.referenceImagePreviewUrl}
          onSelect={onImageSelect}
          onRemove={onImageRemove}
        />

        {/* Instructions textarea */}
        <div className="space-y-2.5">
          <label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/60">
            Prompt Principal
          </label>
          <textarea
            value={state.topic}
            onChange={(e) => onTopicChange(e.target.value)}
            placeholder="Describe tu idea detalladamente. Ej: Un post para instagram anunciando nuestra nueva colección de verano..."
            className="w-full p-4 bg-white/5 border border-white/10 rounded-2xl text-xs font-medium h-24 resize-none outline-none text-white placeholder:text-white/30 focus:ring-2 focus:ring-[#FF5C2B]/20 focus:border-[#FF5C2B]/30 transition-all"
          />
        </div>

        {/* Generate Button */}
        <button
          onClick={onGenerate}
          disabled={state.isGenerating}
          className="w-full py-5 bg-[#FF5C2B] text-[#0A1A26] rounded-[1.5rem] text-xs font-black uppercase tracking-[0.3em] shadow-xl shadow-[#FF5C2B]/25 flex items-center justify-center gap-3 hover:bg-white hover:text-[#0A1A26] transition-all duration-300 hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {state.isGenerating ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Kairisando...</span>
            </>
          ) : (
            <span>Kairisar Idea ✨</span>
          )}
        </button>
      </div>

      {/* Bottom spacer */}
      <div className="pb-4" />
    </aside>
  );
}
