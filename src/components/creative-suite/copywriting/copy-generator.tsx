'use client';

import { useState, useEffect } from 'react';
import { Copy, Check, Loader2, Save, Trash2, ChevronDown, Sparkles, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import type { CopyLength, CopyPurpose, CopyTone, CopyOption } from '@/lib/types';
import { useCopywriter } from '../hooks/useCopywriter';
import { DarkClientSelect } from './dark-client-select';
import { Badge } from '@/components/ui/badge';
import { DarkSelect } from '../common/dark-select';
import { Input } from '@/components/ui/input';
import { useUser, useFirestore } from '@/firebase/provider';

const PURPOSES: { value: CopyPurpose; label: string; emoji: string }[] = [
  { value: 'inform', label: 'Informar', emoji: 'ℹ️' },
  { value: 'sell', label: 'Vender', emoji: '💰' },
  { value: 'cta', label: 'CTA', emoji: '🎯' },
  { value: 'educate', label: 'Educar', emoji: '📚' },
  { value: 'promote', label: 'Promocionar', emoji: '📣' },
  { value: 'holiday', label: 'Feriado', emoji: '🎉' },
  { value: 'entertain', label: 'Entretener', emoji: '✨' },
];

const TONES: { value: CopyTone; label: string }[] = [
  { value: 'professional', label: 'Profesional' },
  { value: 'casual', label: 'Casual' },
  { value: 'playful', label: 'Juguetón' },
  { value: 'luxurious', label: 'Lujoso' },
  { value: 'urgent', label: 'Urgente' },
  { value: 'inspirational', label: 'Inspiracional' },
  { value: 'educational', label: 'Educativo' },
];

const LENGTHS: { value: CopyLength; label: string; desc: string; sub: string }[] = [
  { value: 'short', label: 'Corto', desc: '< 30 palabras', sub: 'Reels · Memes · CTA rápido' },
  { value: 'medium', label: 'Medio', desc: '70–150 palabras', sub: 'Carruseles · Producto · Historias' },
  { value: 'long', label: 'Extenso', desc: '150+ palabras', sub: 'Storytelling · Tutoriales · Casos' },
];


function PillSelector<T extends string>({
  options, value, onChange,
}: { options: { value: T; label: string; emoji?: string }[]; value: T; onChange: (v: T) => void }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((o) => (
        <button key={o.value} onClick={() => onChange(o.value)}
          className={cn('px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all',
            value === o.value
              ? 'bg-[#FF5C2B] text-white shadow-lg shadow-[#FF5C2B]/20'
              : 'bg-white/5 text-white/50 hover:bg-white/10 border border-white/8')}>
          {o.emoji && <span className="mr-1.5">{o.emoji}</span>}{o.label}
        </button>
      ))}
    </div>
  );
}

function CopyCard({ option, onSave, isSaving, purpose, length }: {
  option: CopyOption;
  onSave: () => void;
  isSaving: boolean;
  purpose: string;
  length: string;
}) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="rounded-2xl border border-white/8 bg-white/[0.03] overflow-hidden hover:border-[#FF5C2B]/30 transition-all group backdrop-blur-sm">
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/5 bg-white/[0.02]">
        <div className="flex items-center gap-2.5">
          <span className="w-6 h-6 rounded-lg bg-[#FF5C2B]/20 text-[#FF5C2B] text-[10px] font-black flex items-center justify-center uppercase">{option.id}</span>
          <Badge variant="outline" className="text-[9px] border-[#FF5C2B]/30 text-[#FF5C2B] uppercase px-2 py-0">
            {option.toneLabel}
          </Badge>
          <span className="text-[9px] font-bold uppercase tracking-wider text-white/20 ml-2">{purpose} • {length}</span>
        </div>
        <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={() => { navigator.clipboard.writeText(option.text); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
            className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-white/10 text-white/40 hover:text-white transition-colors">
            {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
          <button onClick={onSave} disabled={isSaving}
            className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-[#FF5C2B]/20 text-white/40 hover:text-[#FF5C2B] transition-colors">
            {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>
      <div className="p-5">
        <p className="text-[14px] leading-relaxed text-white/90 whitespace-pre-wrap font-medium">{option.text}</p>
      </div>
    </div>
  );
}

export function CopyGenerator({ apiKey }: { apiKey: string }) {
  const { user } = useUser();
  const db = useFirestore();
  const { state, update, generate, save, loadHistory, removeFromHistory } = useCopywriter(apiKey, db, user?.uid ?? null);
  const [showHistory, setShowHistory] = useState(false);
  const [brandBooks, setBrandBooks] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    getDocs(query(collection(db, 'brandBooks'), orderBy('name', 'asc')))
      .then((snap) => setBrandBooks(snap.docs.map((d) => ({ id: d.id, name: d.data().name }))))
      .catch(() => { });
  }, [db]);

  useEffect(() => { loadHistory(); }, [loadHistory]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      {/* Configuration Column */}
      <div className="lg:col-span-5 space-y-6">
        <div className="p-6 bg-white/[0.02] border border-white/5 rounded-3xl space-y-6">
          <div className="space-y-3">
            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[#FF5C2B]">Propósito</label>
            <PillSelector options={PURPOSES} value={state.purpose} onChange={(v) => update({ purpose: v })} />
          </div>

          <div className="space-y-3">
            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[#FF5C2B]">Tono de Voz</label>
            <PillSelector options={TONES} value={state.tone} onChange={(v) => update({ tone: v })} />
          </div>

          <div className="space-y-3">
            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[#FF5C2B]">Extensión sugerida</label>
            <div className="grid grid-cols-3 gap-3">
              {LENGTHS.map((l) => (
                <button key={l.value} onClick={() => update({ length: l.value })}
                  className={cn('py-3 px-2 rounded-2xl border text-center transition-all',
                    state.length === l.value ? 'border-[#FF5C2B] bg-[#FF5C2B]/10 text-[#FF5C2B]' : 'border-white/8 bg-white/[0.03] text-white/50 hover:border-white/20')}>
                  <p className="text-[11px] font-black">{l.label}</p>
                  <p className="text-[9px] text-white/30 mt-1">{l.desc}</p>
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-3">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[#FF5C2B]">Brand Book</label>
              <DarkSelect
                value={state.brandBookId}
                onChange={(id) => update({ brandBookId: id || null })}
                placeholder="Sin brand book"
                options={[
                  { id: '', label: 'Sin brand book' },
                  ...brandBooks.map(b => ({ id: b.id, label: b.name }))
                ]}
              />
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[#FF5C2B]">Cliente</label>
                <button onClick={() => update({ useClientSelect: !state.useClientSelect, clientId: null, clientName: '' })}
                  className="text-[9px] text-white/40 hover:text-[#FF5C2B] font-bold uppercase tracking-wider transition-colors">
                  {state.useClientSelect ? 'Manual' : 'CRM'}
                </button>
              </div>
              {state.useClientSelect ? (
                <DarkClientSelect value={state.clientId ?? undefined}
                  onChange={(id, name) => update({ clientId: id, clientName: name })}
                  onClear={() => update({ clientId: null, clientName: '' })} />
              ) : (
                <input type="text" value={state.clientName} onChange={(e) => update({ clientName: e.target.value })}
                  placeholder="Ej: Café Alma..."
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-[12px] text-white placeholder:text-white/25 outline-none focus:border-[#FF5C2B]/40 transition-all" />
              )}
            </div>
          </div>

          {state.purpose === 'holiday' && (
            <div className="space-y-3 animate-in slide-in-from-top-2 duration-300">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[#FF5C2B]">Festividad / Fecha especial</label>
              <input
                type="text"
                value={state.holidayContext}
                onChange={(e) => update({ holidayContext: e.target.value })}
                placeholder="Ej: Día de la Madre, Navidad, Black Friday..."
                className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-[12px] text-white placeholder:text-white/25 outline-none focus:border-[#FF5C2B]/40 transition-all"
              />
            </div>
          )}

          <div className="space-y-3">
            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[#FF5C2B]">Contexto / Idea base</label>
            <textarea value={state.context} onChange={(e) => update({ context: e.target.value })}
              placeholder="Describe lo que necesitas comunicar..." rows={3}
              className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-[13px] text-white/80 placeholder:text-white/25 outline-none focus:border-[#FF5C2B]/40 transition-all resize-none leading-relaxed" />
          </div>

          <button onClick={generate} disabled={state.isGenerating}
            className="w-full py-5 bg-[#FF5C2B] text-white rounded-2xl text-[12px] font-black uppercase tracking-[0.3em] shadow-xl shadow-[#FF5C2B]/20 flex items-center justify-center gap-3 hover:bg-white hover:text-[#FF5C2B] transition-all disabled:opacity-60 disabled:cursor-not-allowed active:scale-[0.98]">
            {state.isGenerating
              ? <><Loader2 className="w-4 h-4 animate-spin" /><span>Generando...</span></>
              : <><Sparkles className="w-4 h-4" /><span>Generar Copy</span></>}
          </button>

          {state.error && <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-[11px] text-red-400">{state.error}</div>}
        </div>
      </div>

      {/* Results Column */}
      <div className="lg:col-span-7 space-y-6">
        {state.options.length > 0 ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between px-2">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30">Opciones Generadas</p>
              <button onClick={generate} className="text-white/30 hover:text-white transition-colors flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider" title="Regenerar">
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Regenerar</span>
              </button>
            </div>
            <div className="grid gap-6">
              {state.options.map((opt) => (
                <CopyCard
                  key={opt.id}
                  option={opt}
                  onSave={() => save(opt.id)}
                  isSaving={state.isSaving}
                  purpose={PURPOSES.find(p => p.value === state.purpose)?.label || ''}
                  length={LENGTHS.find(l => l.value === state.length)?.label || ''}
                />
              ))}
            </div>
          </div>
        ) : (
          <div className="h-[400px] flex flex-col items-center justify-center bg-white/[0.02] border border-dashed border-white/10 rounded-3xl text-center p-8">
            <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mb-4">
              <Sparkles className="w-8 h-8 text-white/20" />
            </div>
            <h3 className="text-white/60 font-bold">Sin resultados</h3>
            <p className="text-white/30 text-xs mt-2 max-w-[240px]">Configura los parámetros a la izquierda y pulsa "Generar" para ver opciones.</p>
          </div>
        )}

        {/* History Section */}
        <div className="space-y-4">
          <button onClick={() => { setShowHistory((s) => !s); if (!showHistory) loadHistory(); }}
            className="w-full flex items-center justify-between py-3 px-4 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-white/10 transition-all">
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30">Historial guardado</span>
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-white/20 font-bold">{state.history.length}</span>
              <ChevronDown className={cn('w-4 h-4 text-white/30 transition-transform', showHistory && 'rotate-180')} />
            </div>
          </button>

          {showHistory && (
            <div className="grid gap-3">
              {state.isLoadingHistory ? (
                <div className="flex items-center justify-center py-8"><Loader2 className="w-5 h-5 text-white/20 animate-spin" /></div>
              ) : state.history.length === 0 ? (
                <p className="text-center py-8 text-[11px] text-white/20 italic">Sin copys guardados aún</p>
              ) : state.history.map((saved) => (
                <div key={saved.id} className="p-4 bg-white/[0.02] border border-white/5 rounded-2xl hover:border-white/10 transition-all">
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div>
                      <p className="text-[11px] font-bold text-white/70">{saved.clientName || 'Sin cliente'}</p>
                      <p className="text-[10px] text-white/25 mt-0.5">{new Date(saved.createdAt).toLocaleDateString('es', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
                    </div>
                    <button onClick={() => removeFromHistory(saved.id)} className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-red-500/10 text-white/20 hover:text-red-400 transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <p className="text-[12px] text-white/50 line-clamp-3 leading-relaxed italic">"{saved.options[0]?.text}"</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
