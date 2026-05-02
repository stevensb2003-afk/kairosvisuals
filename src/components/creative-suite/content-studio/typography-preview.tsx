'use client';

import { useState } from 'react';
import { Sparkles, Wand2, Loader2, Check, ChevronRight, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useGoogleFonts } from '../hooks/useGoogleFonts';
import { useTypographySuggester, type BrandBriefing, type TypographySuggestion } from '../hooks/useTypographySuggester';
import { DarkSelect } from '../common/dark-select';

// ─── Config ───────────────────────────────────────────────────────────────────

const POPULAR_FONTS = [
  'Inter', 'Roboto', 'Outfit', 'Playfair Display', 'Montserrat', 'Lora',
  'Bebas Neue', 'Space Grotesk', 'Cormorant Garamond', 'DM Sans', 'Josefin Sans',
  'Raleway', 'Poppins', 'Oswald', 'Plus Jakarta Sans', 'Nunito', 'Merriweather',
  'Work Sans', 'Barlow', 'DM Serif Display',
];

const INDUSTRIES = [
  'Moda & Lifestyle', 'Tecnología', 'Salud & Bienestar', 'Gastronomía',
  'Arte & Diseño', 'Educación', 'Finanzas', 'Fitness', 'Inmobiliaria',
  'Entretenimiento', 'Retail', 'Legal & Corporativo',
];

const STYLES = ['Formal', 'Casual', 'Lujoso', 'Minimalista', 'Bold', 'Juguetón', 'Moderno', 'Clásico'];
const AUDIENCES = ['Jóvenes (18-25)', 'Millenials (26-40)', 'Profesionales', 'Mujeres', 'Emprendedores', 'Corporativo', 'Familias'];
const PLATFORMS = ['Instagram', 'TikTok', 'LinkedIn', 'Web', 'Impresión', 'YouTube'];

// ─── Sub-components ────────────────────────────────────────────────────────────

function Pills({
  options, selected, onToggle, multi = true,
}: { options: string[]; selected: string[]; onToggle: (v: string) => void; multi?: boolean }) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => {
        const active = selected.includes(o);
        return (
          <button
            key={o}
            type="button"
            onClick={() => onToggle(o)}
            className={cn(
              'px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all',
              active
                ? 'bg-[#FF5C2B] text-white shadow-md shadow-[#FF5C2B]/25'
                : 'bg-white/5 text-white/40 hover:bg-white/10 hover:text-white/70 border border-white/8'
            )}
          >
            {o}
          </button>
        );
      })}
    </div>
  );
}

function SuggestionCard({
  suggestion, isApplied, onApply,
}: { suggestion: TypographySuggestion; isApplied: boolean; onApply: () => void }) {
  useGoogleFonts([suggestion.primary, suggestion.secondary]);
  return (
    <div className={cn(
      'relative p-5 rounded-3xl border transition-all duration-300 group',
      isApplied
        ? 'border-[#FF5C2B]/40 bg-[#FF5C2B]/5 shadow-lg shadow-[#FF5C2B]/10'
        : 'border-white/8 bg-white/[0.02] hover:border-white/15 hover:bg-white/[0.04]'
    )}>
      {/* Score badge */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-[10px] font-black uppercase tracking-widest text-[#FF5C2B]">{suggestion.name}</p>
          <p className="text-[10px] text-white/30 mt-0.5">{suggestion.why}</p>
        </div>
        <span className="shrink-0 ml-3 text-[11px] font-black text-white/40">
          {suggestion.fitScore}<span className="text-white/20">%</span>
        </span>
      </div>

      {/* Fit score bar */}
      <div className="w-full h-0.5 bg-white/5 rounded-full mb-4">
        <div
          className="h-full bg-[#FF5C2B] rounded-full transition-all duration-700"
          style={{ width: `${suggestion.fitScore}%` }}
        />
      </div>

      {/* Font preview */}
      <div className="space-y-1 mb-5 min-h-[68px]">
        <p style={{ fontFamily: suggestion.primary }} className="text-xl font-bold text-white leading-tight">
          Aa — {suggestion.primary}
        </p>
        <p style={{ fontFamily: suggestion.secondary }} className="text-sm text-white/50">
          Texto de cuerpo — {suggestion.secondary}
        </p>
      </div>

      {/* Apply button */}
      <button
        onClick={onApply}
        className={cn(
          'w-full flex items-center justify-center gap-2 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all',
          isApplied
            ? 'bg-[#FF5C2B]/20 text-[#FF5C2B] border border-[#FF5C2B]/30'
            : 'bg-white/5 text-white/50 border border-white/8 hover:bg-[#FF5C2B]/10 hover:text-[#FF5C2B] hover:border-[#FF5C2B]/20'
        )}
      >
        {isApplied ? <Check className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
        {isApplied ? 'Aplicado' : 'Aplicar al preview'}
      </button>
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────

interface TypographyPreviewProps {
  apiKey: string;
}

export function TypographyPreview({ apiKey }: TypographyPreviewProps) {
  const [primaryFont, setPrimaryFont] = useState('Outfit');
  const [secondaryFont, setSecondaryFont] = useState('Inter');
  const [appliedId, setAppliedId] = useState<string | null>(null);

  const [briefing, setBriefing] = useState<BrandBriefing>({
    brandName: '',
    industry: '',
    styles: [],
    audiences: [],
    platforms: [],
  });

  const { isLoading, suggestions, error, suggestFromBriefing, clearSuggestions } = useTypographySuggester(apiKey);

  useGoogleFonts([primaryFont, secondaryFont]);

  const togglePill = (field: keyof Pick<BrandBriefing, 'styles' | 'audiences' | 'platforms'>, val: string) => {
    setBriefing((prev) => {
      const arr = prev[field];
      return { ...prev, [field]: arr.includes(val) ? arr.filter((v) => v !== val) : [...arr, val] };
    });
  };

  const handleAnalyze = () => {
    clearSuggestions();
    suggestFromBriefing(briefing);
  };

  const handleApply = (s: TypographySuggestion) => {
    setPrimaryFont(s.primary);
    setSecondaryFont(s.secondary);
    setAppliedId(s.name);
  };

  const canAnalyze = briefing.industry || briefing.styles.length > 0 || briefing.brandName;

  return (
    <div className="space-y-10">

      {/* ── SECTION 1: AI WIZARD ────────────────────────────────────────── */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Wand2 className="w-4 h-4 text-[#FF5C2B]" />
            <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-white/70">Sugerencias por IA</h3>
          </div>
          {suggestions.length > 0 && (
            <button onClick={() => { clearSuggestions(); setAppliedId(null); }} className="flex items-center gap-1.5 text-[10px] text-white/30 hover:text-white/60 transition-colors">
              <RotateCcw className="w-3 h-3" /> Nuevo análisis
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          {/* Form */}
          <div className="lg:col-span-2 space-y-5 p-5 bg-white/[0.02] border border-white/5 rounded-3xl">
            {/* Brand name */}
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-white/40">Nombre de la marca</label>
              <input
                value={briefing.brandName}
                onChange={(e) => setBriefing((p) => ({ ...p, brandName: e.target.value }))}
                placeholder="Ej: Lumina Studio..."
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-[13px] text-white/80 placeholder:text-white/20 outline-none focus:border-[#FF5C2B]/40 transition-all"
              />
            </div>

            {/* Industry */}
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-white/40">Industria / Sector</label>
              <DarkSelect
                value={briefing.industry}
                onChange={(v) => setBriefing((p) => ({ ...p, industry: v }))}
                placeholder="Selecciona una industria..."
                options={[{ id: '', label: 'Selecciona una industria...' }, ...INDUSTRIES.map((i) => ({ id: i, label: i }))]}
              />
            </div>

            {/* Style */}
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-white/40">Estilo de comunicación</label>
              <Pills options={STYLES} selected={briefing.styles} onToggle={(v) => togglePill('styles', v)} />
            </div>

            {/* Audience */}
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-white/40">Público objetivo</label>
              <Pills options={AUDIENCES} selected={briefing.audiences} onToggle={(v) => togglePill('audiences', v)} />
            </div>

            {/* Platforms */}
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-white/40">Plataformas</label>
              <Pills options={PLATFORMS} selected={briefing.platforms} onToggle={(v) => togglePill('platforms', v)} />
            </div>

            <button
              onClick={handleAnalyze}
              disabled={isLoading || !canAnalyze}
              className={cn(
                'w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all mt-2',
                'bg-[#FF5C2B] text-white shadow-lg shadow-[#FF5C2B]/20',
                'hover:bg-[#ff4517] hover:shadow-xl hover:shadow-[#FF5C2B]/30 hover:-translate-y-0.5',
                'disabled:opacity-40 disabled:cursor-not-allowed disabled:translate-y-0'
              )}
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              {isLoading ? 'Analizando...' : 'Analizar y Sugerir →'}
            </button>

            {error && (
              <p className="text-[10px] text-red-400/80 bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2 text-center">
                {error}
              </p>
            )}
          </div>

          {/* Results */}
          <div className="lg:col-span-3">
            {suggestions.length > 0 ? (
              <div className="grid grid-cols-1 gap-4">
                {suggestions.map((s) => (
                  <SuggestionCard
                    key={s.name}
                    suggestion={s}
                    isApplied={appliedId === s.name}
                    onApply={() => handleApply(s)}
                  />
                ))}
              </div>
            ) : (
              <div className="h-full min-h-[300px] flex flex-col items-center justify-center text-center p-8 bg-white/[0.01] border border-dashed border-white/8 rounded-3xl">
                <Sparkles className="w-8 h-8 text-white/10 mb-4" />
                <p className="text-[11px] font-bold text-white/25 uppercase tracking-widest">Completa el briefing</p>
                <p className="text-[10px] text-white/15 mt-1">La IA analizará tu marca y sugerirá las 3 mejores combinaciones tipográficas.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Divider */}
      <div className="flex items-center gap-4">
        <div className="flex-1 h-px bg-white/5" />
        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white/20">Preview Manual</span>
        <div className="flex-1 h-px bg-white/5" />
      </div>

      {/* ── SECTION 2: MANUAL SELECTOR + LIVE PREVIEW ──────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Selectors */}
        <div className="lg:col-span-4 space-y-4 p-5 bg-white/[0.02] border border-white/5 rounded-3xl">
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-[#FF5C2B]">Fuente Principal (Títulos)</label>
            <DarkSelect
              value={primaryFont}
              onChange={setPrimaryFont}
              options={POPULAR_FONTS.map((f) => ({ id: f, label: f }))}
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-[#FF5C2B]">Fuente Secundaria (Cuerpo)</label>
            <DarkSelect
              value={secondaryFont}
              onChange={setSecondaryFont}
              options={POPULAR_FONTS.map((f) => ({ id: f, label: f }))}
            />
          </div>
          <div className="grid grid-cols-2 gap-3 pt-1">
            <div className="p-3 bg-white/[0.02] border border-white/5 rounded-2xl text-center">
              <p className="text-[9px] text-white/25 uppercase tracking-widest mb-1">Título</p>
              <p className="text-sm font-bold text-white" style={{ fontFamily: primaryFont }}>{primaryFont}</p>
            </div>
            <div className="p-3 bg-white/[0.02] border border-white/5 rounded-2xl text-center">
              <p className="text-[9px] text-white/25 uppercase tracking-widest mb-1">Cuerpo</p>
              <p className="text-sm text-white/70" style={{ fontFamily: secondaryFont }}>{secondaryFont}</p>
            </div>
          </div>
        </div>

        {/* Live preview canvas */}
        <div className="lg:col-span-8 p-8 sm:p-12 bg-white/[0.02] border border-white/5 rounded-[40px] relative overflow-hidden group min-h-[400px] flex flex-col justify-center">
          <div className="absolute inset-0 bg-gradient-to-br from-[#FF5C2B]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
          <div className="relative space-y-6">
            <div className="space-y-1">
              <span className="text-[10px] font-black uppercase tracking-[0.4em] text-[#FF5C2B]">Headline · {primaryFont}</span>
              <h2 style={{ fontFamily: primaryFont }} className="text-4xl sm:text-5xl font-bold text-white leading-[1.1] tracking-tight">
                Creatividad que trasciende lo convencional.
              </h2>
            </div>
            <div className="space-y-2 max-w-xl">
              <span className="text-[10px] font-black uppercase tracking-[0.4em] text-white/20">Body · {secondaryFont}</span>
              <p style={{ fontFamily: secondaryFont }} className="text-lg text-white/55 leading-relaxed font-light">
                Construimos marcas con propósito. Cada decisión tipográfica comunica sin palabras: quiénes somos, a quién hablamos y por qué importamos.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
