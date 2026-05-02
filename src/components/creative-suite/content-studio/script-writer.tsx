'use client';

import { useState, useEffect } from 'react';
import { Loader2, Save, Trash2, ChevronDown, Sparkles, Pencil, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import type { ScriptFormat } from '@/lib/types';
import { useScriptWriter, SCRIPT_FORMAT_META } from '../hooks/useScriptWriter';
import { DarkClientSelect } from './dark-client-select';
import { useUser, useFirestore } from '@/firebase/provider';
import { DarkSelect } from '../common/dark-select';

const FORMATS = Object.entries(SCRIPT_FORMAT_META).map(([key, meta]) => ({
  id: key as ScriptFormat,
  label: meta.label,
  emoji: meta.emoji,
  sections: meta.sections,
}));

export function ScriptWriter({ apiKey }: { apiKey: string }) {
  const { user } = useUser();
  const db = useFirestore();
  const { state, update, generate, updateSection, save, loadHistory, removeFromHistory } = useScriptWriter(apiKey, db, user?.uid ?? null);
  const [showHistory, setShowHistory] = useState(false);
  const [brandBooks, setBrandBooks] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    getDocs(query(collection(db, 'brandBooks'), orderBy('name', 'asc')))
      .then((snap) => setBrandBooks(snap.docs.map((d) => ({ id: d.id, name: d.data().name }))))
      .catch(() => {});
  }, [db]);

  useEffect(() => { loadHistory(); }, [loadHistory]);

  const currentMeta = SCRIPT_FORMAT_META[state.format];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      {/* Configuration Column */}
      <div className="lg:col-span-4 space-y-6">
        <div className="p-6 bg-white/[0.02] border border-white/5 rounded-3xl space-y-6">
          <div className="space-y-3">
            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[#FF5C2B]">Formato de Guión</label>
            <div className="grid grid-cols-1 gap-2">
              {FORMATS.map((f) => (
                <button key={f.id} onClick={() => update({ format: f.id })}
                  className={cn('flex items-center gap-3 px-4 py-3.5 rounded-2xl border transition-all text-left',
                    state.format === f.id ? 'border-[#FF5C2B] bg-[#FF5C2B]/10 text-white' : 'border-white/8 bg-white/[0.03] text-white/40 hover:bg-white/5 hover:border-white/20')}>
                  <span className="text-xl">{f.emoji}</span>
                  <span className="text-[11px] font-black uppercase tracking-wider">{f.label}</span>
                </button>
              ))}
            </div>
          </div>

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
                placeholder="Ej: Proyecto X..."
                className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-[12px] text-white placeholder:text-white/25 outline-none focus:border-[#FF5C2B]/40 transition-all" />
            )}
          </div>

          <div className="space-y-3">
            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[#FF5C2B]">¿De qué trata el contenido?</label>
            <textarea value={state.context} onChange={(e) => update({ context: e.target.value })}
              placeholder="Ej: Los 3 errores más comunes al emprender..." rows={4}
              className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-[13px] text-white/80 placeholder:text-white/25 outline-none focus:border-[#FF5C2B]/40 transition-all resize-none leading-relaxed" />
          </div>

          <button onClick={generate} disabled={state.isGenerating}
            className="w-full py-5 bg-[#FF5C2B] text-white rounded-2xl text-[12px] font-black uppercase tracking-[0.3em] shadow-xl shadow-[#FF5C2B]/20 flex items-center justify-center gap-3 hover:bg-white hover:text-[#FF5C2B] transition-all disabled:opacity-60 disabled:cursor-not-allowed active:scale-[0.98]">
            {state.isGenerating
              ? <><Loader2 className="w-4 h-4 animate-spin" /><span>Escribiendo...</span></>
              : <><Sparkles className="w-4 h-4" /><span>Generar Guión</span></>}
          </button>
        </div>
        
        {/* History Section */}
        <div className="space-y-4">
          <button onClick={() => { setShowHistory((s) => !s); if (!showHistory) loadHistory(); }}
            className="w-full flex items-center justify-between py-3 px-4 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-white/10 transition-all">
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30">Historial de Guiones</span>
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
                <p className="text-center py-8 text-[11px] text-white/20 italic">Sin guiones guardados aún</p>
              ) : state.history.map((saved) => (
                <div key={saved.id} className="p-4 bg-white/[0.02] border border-white/5 rounded-2xl hover:border-white/10 transition-all">
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-base">{SCRIPT_FORMAT_META[saved.format]?.emoji || '📄'}</span>
                      <div>
                        <p className="text-[11px] font-bold text-white/70">{saved.clientName || 'Sin cliente'}</p>
                        <p className="text-[9px] text-white/25 mt-0.5">{new Date(saved.createdAt).toLocaleDateString('es', { day: '2-digit', month: 'short' })}</p>
                      </div>
                    </div>
                    <button onClick={() => removeFromHistory(saved.id)} className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-red-500/10 text-white/20 hover:text-red-400 transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <p className="text-[11px] text-white/40 line-clamp-1">{saved.sections[0]?.content}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Script Content Column */}
      <div className="lg:col-span-8 space-y-6">
        {state.sections.length > 0 ? (
          <div className="space-y-6">
            <div className="flex items-center justify-between px-2">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{currentMeta.emoji}</span>
                <div>
                  <p className="text-[12px] font-black uppercase tracking-[0.2em] text-white">{currentMeta.label}</p>
                  <p className="text-[10px] text-white/40 mt-0.5">Edita las secciones para pulir tu guión.</p>
                </div>
              </div>
              <button onClick={() => save()} disabled={state.isSaving}
                className="flex items-center gap-2 px-6 py-3 bg-[#FF5C2B]/10 border border-[#FF5C2B]/20 rounded-2xl text-[#FF5C2B] text-[11px] font-black uppercase tracking-widest hover:bg-[#FF5C2B] hover:text-white transition-all disabled:opacity-50">
                {state.isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                <span>Guardar Guión</span>
              </button>
            </div>

            <div className="grid gap-6">
              {state.sections.map((section, idx) => (
                <div key={idx} className="group relative bg-white/[0.03] border border-white/5 rounded-3xl p-6 hover:border-[#FF5C2B]/30 transition-all backdrop-blur-sm">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center text-[10px] font-black text-white/40 border border-white/10 group-hover:border-[#FF5C2B]/40 group-hover:text-[#FF5C2B] transition-colors">
                        {String(idx + 1).padStart(2, '0')}
                      </div>
                      <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-white/60">{section.label}</h4>
                    </div>
                    <Pencil className="w-3.5 h-3.5 text-white/10 group-hover:text-[#FF5C2B]/50 transition-colors" />
                  </div>
                  <textarea value={section.content} onChange={(e) => updateSection(idx, e.target.value)}
                    rows={Math.max(3, Math.ceil(section.content.length / 80))}
                    className="w-full bg-transparent border-none text-[15px] leading-relaxed text-white/80 placeholder:text-white/10 outline-none resize-none custom-scrollbar"
                    placeholder={`Escribe aquí el contenido de ${section.label}...`} />
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="h-[500px] flex flex-col items-center justify-center bg-white/[0.02] border border-dashed border-white/10 rounded-3xl text-center p-8">
            <div className="w-20 h-20 rounded-3xl bg-white/5 flex items-center justify-center mb-6">
              <FileText className="w-10 h-10 text-white/20" />
            </div>
            <h3 className="text-white/60 font-bold text-lg">Tu guión aparecerá aquí</h3>
            <p className="text-white/30 text-sm mt-2 max-w-[320px]">Selecciona un formato y describe tu idea para empezar a escribir con IA.</p>
          </div>
        )}
      </div>
    </div>
  );
}
