'use client';

import { useVisionEngine } from './hooks/useVisionEngine';
import { ControlPanel } from './control-panel';
import { PreviewArea } from './preview-area';
import { BrandbookModal } from './brandbook/brandbook-modal';
import { CaptionModal } from './modals/caption-modal';
import { useFirestore } from '@/firebase/provider';

const API_KEY = process.env.NEXT_PUBLIC_GEMINI_API_KEY || '';

export function VisionEngine() {
  const db = useFirestore();
  const {
    state,
    setFormat,
    handleImageSelect,
    removeImage,
    nextSlide,
    prevSlide,
    generate,
    generateCaption,
    copyCopys,
    update,
  } = useVisionEngine(API_KEY, db);

  return (
    <div className="flex flex-col lg:flex-row h-full overflow-hidden bg-[#0A1A26]">
      {/* Left: Controls */}
      <ControlPanel
        state={state}
        onFormatChange={setFormat}
        onStrategyChange={(key, value) => update({ [key]: value })}
        onTopicChange={(topic) => update({ topic })}
        onImageSelect={handleImageSelect}
        onImageRemove={removeImage}
        onGenerate={generate}
        apiKey={API_KEY}
      />

      {/* Center: Preview */}
      <PreviewArea
        slides={state.slides}
        currentIndex={state.currentIndex}
        format={state.format}
        onNext={nextSlide}
        onPrev={prevSlide}
        onCopyCopys={copyCopys}
        onGenerateCaption={generateCaption}
      />

      {/* Modals */}
      <BrandbookModal
        open={state.isBrandbookOpen}
        onOpenChange={(open) => update({ isBrandbookOpen: open })}
      />

      <CaptionModal
        open={state.isCaptionModalOpen}
        onOpenChange={(open) => update({ isCaptionModalOpen: open })}
        caption={state.captionText}
        isLoading={state.isGeneratingCaption}
      />
    </div>
  );
}

