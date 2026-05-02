'use client';

import * as Dialog from '@radix-ui/react-dialog';
import { X, Loader2, Copy, Check } from 'lucide-react';
import { useState } from 'react';

interface CaptionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  caption: string;
  isLoading: boolean;
}

export function CaptionModal({ open, onOpenChange, caption, isLoading }: CaptionModalProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(caption);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-[#0A1A26]/85 backdrop-blur-md z-[70] animate-in fade-in-0 duration-200" />
        <Dialog.Content className="fixed inset-x-4 bottom-4 top-auto lg:inset-auto lg:bottom-8 lg:left-1/2 lg:-translate-x-1/2 lg:w-[520px] z-[75] bg-white rounded-[2rem] shadow-2xl overflow-hidden animate-in slide-in-from-bottom-8 duration-300 border border-stone-200">
          <Dialog.Title className="sr-only">Caption Generado</Dialog.Title>
          <div className="flex justify-between items-center p-6 lg:p-8 border-b border-stone-100">
            <div>
              <h2 className="text-lg font-black text-[#0A1A26] uppercase tracking-tight" style={{ fontFamily: "'Montserrat', sans-serif" }}>Caption Generado</h2>
              <p className="text-[9px] font-bold tracking-widest text-[#FF5C2B] uppercase mt-1">Listo para publicar</p>
            </div>
            <Dialog.Close className="w-9 h-9 bg-stone-100 rounded-full flex items-center justify-center text-[#0A1A26] hover:bg-[#FF5C2B] hover:text-white transition-colors">
              <X className="w-4 h-4" />
            </Dialog.Close>
          </div>

          <div className="p-6 lg:p-8 space-y-4 max-h-[55vh] overflow-y-auto">
            {isLoading ? (
              <div className="flex flex-col items-center py-10 gap-4">
                <div className="w-14 h-14 bg-[#FF5C2B]/10 rounded-2xl flex items-center justify-center">
                  <Loader2 className="w-7 h-7 text-[#FF5C2B] animate-spin" />
                </div>
                <p className="text-[10px] font-black uppercase tracking-[0.35em] text-stone-400">Redactando con estilo...</p>
              </div>
            ) : (
              <div className="bg-stone-50 p-6 rounded-2xl border border-stone-200">
                <pre className="text-sm font-medium text-[#0A1A26] leading-relaxed whitespace-pre-wrap font-sans">{caption}</pre>
              </div>
            )}
          </div>

          {!isLoading && caption && (
            <div className="p-6 lg:p-8 border-t border-stone-100">
              <button
                onClick={handleCopy}
                className="w-full py-4 bg-[#0A1A26] text-white rounded-full font-black text-[10px] uppercase tracking-[0.35em] flex items-center justify-center gap-3 hover:bg-[#FF5C2B] hover:text-[#0A1A26] transition-all"
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copied ? 'Copiado' : 'Copiar Caption'}
              </button>
            </div>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
