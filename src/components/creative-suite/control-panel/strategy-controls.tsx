'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import * as Select from '@radix-ui/react-select';
import { ChevronDown, Check, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useFirestore, useUser } from '@/firebase/provider';
import { collection, getDocs, query, orderBy, where } from 'firebase/firestore';



const FONT_STYLES = [
  'Inter', 'Roboto', 'Open Sans', 'Lato', 'Nunito', 'Poppins', 'Raleway',
  'Montserrat', 'Oswald', 'Source Sans Pro', 'Merriweather', 'Playfair Display',
  'DM Sans', 'DM Serif Display', 'Cormorant Garamond', 'Josefin Sans', 'Josefin Slab',
  'Bebas Neue', 'Roboto Condensed', 'Cabin', 'Barlow', 'Work Sans',
  'Outfit', 'Plus Jakarta Sans', 'Space Grotesk',
];

interface StrategyControlsProps {
  service: string;
  tone: string;
  cta: string;
  brandBookId: string | null;
  manualColors: { primary: string; secondary: string; tertiary: string } | null;
  manualTypography: { primary: string; secondary: string } | null;
  onChange: (key: 'service' | 'tone' | 'cta' | 'brandBookId' | 'manualColors' | 'manualTypography', value: any) => void;
  apiKey: string;
}

const SERVICES = [
  { value: 'none', label: 'Ninguno (Enfoque General)' },
  { value: 'Diseño gráfico y storytelling visual', label: 'Diseño gráfico y storytelling' },
  { value: 'Branding y logos', label: 'Branding y logos' },
  { value: 'Producción audiovisual', label: 'Producción audiovisual' },
  { value: 'Gestión de Redes Sociales', label: 'Gestión de Redes Sociales' },
  { value: 'Asesoría personalizada', label: 'Asesoría personalizada' },
  { value: 'Publicidad digital', label: 'Publicidad digital' },
  { value: 'Equipo Kairós', label: 'Equipo Kairós' },
];

const TONES = [
  { value: 'none', label: 'Tono (Auto)' },
  { value: 'Educativo y de Autoridad', label: 'Educativo' },
  { value: 'Inspiracional y Visionario', label: 'Inspiracional' },
  { value: 'Directo a Venta / Persuasivo', label: 'Directo / Venta' },
  { value: 'Cercano, Humano y Detrás de Escena', label: 'Cercano (Humano)' },
];

const CTAS = [
  { value: 'none', label: 'CTA (Auto)' },
  { value: 'Comentar o Interactuar', label: 'Interactuar' },
  { value: 'Guardar este post para después', label: 'Guardar Post' },
  { value: 'Enviar un mensaje directo (DM) para cotizar', label: 'Enviar DM' },
  { value: 'Visitar el Link en la Bio', label: 'Link en Bio' },
];

// ─── KairosSelect ─────────────────────────────────────────────────────────────
function KairosSelect({ value, onChange, options, placeholder }: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  placeholder: string;
}) {
  const selected = options.find((o) => o.value === value);

  return (
    <Select.Root value={value} onValueChange={onChange}>
      <Select.Trigger className={cn(
        'w-full flex items-center justify-between gap-2 p-3.5 bg-white/5 border border-white/10 rounded-2xl',
        'text-[9px] font-bold uppercase tracking-wider text-white/90 outline-none',
        'hover:border-[#FF5C2B]/50 focus:ring-2 focus:ring-[#FF5C2B]/20 transition-all'
      )}>
        <Select.Value placeholder={placeholder}>
          <span>{selected?.label || placeholder}</span>
        </Select.Value>
        <Select.Icon>
          <ChevronDown className="w-3.5 h-3.5 text-white/40" />
        </Select.Icon>
      </Select.Trigger>

      <Select.Portal>
        <Select.Content
          position="popper"
          sideOffset={4}
          className="z-[999] w-[var(--radix-select-trigger-width)] bg-[#050D14] border border-white/10 rounded-2xl shadow-xl overflow-hidden animate-in fade-in-0 zoom-in-95"
        >
          <Select.Viewport className="p-1.5 max-h-[260px] overflow-y-auto">
            {options.map((opt) => (
              <Select.Item
                key={opt.value}
                value={opt.value}
                className={cn(
                  'flex items-center justify-between px-3 py-2.5 rounded-xl text-[9px] font-bold uppercase tracking-wider cursor-pointer outline-none transition-colors',
                  'text-white/80 hover:bg-[#FF5C2B]/20 hover:text-white data-[highlighted]:bg-[#FF5C2B]/20 data-[highlighted]:text-white'
                )}
              >
                <Select.ItemText>{opt.label}</Select.ItemText>
                <Select.ItemIndicator>
                  <Check className="w-3 h-3 text-[#FF5C2B]" />
                </Select.ItemIndicator>
              </Select.Item>
            ))}
          </Select.Viewport>
        </Select.Content>
      </Select.Portal>
    </Select.Root>
  );
}

// ─── ColorSwatch ─────────────────────────────────────────────────────────────
function ColorSwatch({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void; }) {
  const pickerRef = useRef<HTMLInputElement>(null);
  const displayColor = value && value.startsWith('#') ? value : '#000000';

  return (
    <div className="space-y-1.5">
      <p className="text-[8px] font-bold uppercase tracking-[0.2em] text-white/30">{label}</p>
      <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl p-2 hover:border-[#FF5C2B]/40 transition-all">
        <div
          className="relative w-8 h-8 rounded-lg cursor-pointer flex-shrink-0 border border-white/20 shadow-sm overflow-hidden"
          style={{ backgroundColor: displayColor }}
          onClick={() => pickerRef.current?.click()}
        >
          <input
            ref={pickerRef}
            type="color"
            value={displayColor}
            onChange={(e) => onChange(e.target.value)}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />
        </div>
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="#000000"
          className="flex-1 bg-transparent text-[10px] font-mono text-white/80 outline-none placeholder:text-white/20 min-w-0"
          maxLength={7}
        />
      </div>
    </div>
  );
}

// ─── FontSelect ──────────────────────────────────────────────────────────────
function FontSelect({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void; }) {
  const options = [{ value: 'auto', label: 'Automático' }, ...Array.from(new Set(FONT_STYLES)).map(f => ({ value: f, label: f }))];
  return (
    <div className="space-y-1.5">
      <p className="text-[8px] font-bold uppercase tracking-[0.2em] text-white/30">{label}</p>
      <KairosSelect value={value || 'auto'} onChange={(v) => onChange(v === 'auto' ? '' : v)} options={options} placeholder="Automático" />
    </div>
  );
}



// ─── Main Component ───────────────────────────────────────────────────────────
export function StrategyControls({ service, tone, cta, brandBookId, manualColors, manualTypography, onChange, apiKey }: StrategyControlsProps) {
  const [brandBooks, setBrandBooks] = useState<{value: string, label: string}[]>([]);
  const [isLoadingBooks, setIsLoadingBooks] = useState(true);
  
  const db = useFirestore();
  const { user, userData, isUserLoading } = useUser();

  const fetchBooks = useCallback(async () => {
    if (!db || !user) return;
    try {
      const isTeam = userData?.type === 'team' || ['Administrador', 'Administrativo', 'Creativo', 'admin', 'manager', 'designer', 'editor'].includes(userData?.role) || ['stevensb.2003@gmail.com', 'kairosvisuals@gmail.com'].includes(user.email || '');
      let q = isTeam ? query(collection(db, 'brandBooks'), orderBy('name', 'asc')) : query(collection(db, 'brandBooks'), where('clientId', '==', user.uid), orderBy('name', 'asc'));
      const snap = await getDocs(q);
      const books = snap.docs.map(doc => ({ value: doc.id, label: doc.data().name }));
      setBrandBooks([{ value: 'none', label: 'Ninguno (Configuración Manual)' }, ...books]);
    } catch (error) {
      console.error('Error fetching brand books:', error);
      setBrandBooks([{ value: 'none', label: 'Ninguno (Configuración Manual)' }]);
    } finally {
      setIsLoadingBooks(false);
    }
  }, [db, user, userData]);

  useEffect(() => {
    if (!isUserLoading) {
      if (user) fetchBooks();
      else setIsLoadingBooks(false);
    }
  }, [fetchBooks, isUserLoading, user]);



  return (
    <div className="space-y-4">
      {/* Brand Book Selector */}
      <div className="space-y-2.5">
        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/50">Manual de Marca (Opcional)</label>
        {isLoadingBooks ? (
          <div className="w-full flex items-center justify-center p-3.5 bg-white/5 border border-white/10 rounded-2xl text-[9px] font-bold text-white/50">
            <Loader2 className="w-4 h-4 animate-spin mr-2" /> Cargando...
          </div>
        ) : (
          <KairosSelect value={brandBookId || 'none'} onChange={(v) => onChange('brandBookId', v === 'none' ? null : v)} options={brandBooks} placeholder="Seleccionar Brand Book..." />
        )}
      </div>

      {(!brandBookId || brandBookId === 'none') && (
        <div className="p-4 bg-black/20 border border-white/5 rounded-2xl space-y-5">
          <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-[#FF5C2B]">Configuración Estética Manual</label>

          <div className="space-y-2">
            <label className="text-[9px] font-bold uppercase tracking-wider text-white/40 block">Colores Base</label>
            <div className="space-y-2">
              <ColorSwatch label="Primario" value={manualColors?.primary || ''} onChange={(v) => onChange('manualColors', { ...manualColors, primary: v })} />
              <ColorSwatch label="Secundario" value={manualColors?.secondary || ''} onChange={(v) => onChange('manualColors', { ...manualColors, secondary: v })} />
              <ColorSwatch label="Terciario" value={manualColors?.tertiary || ''} onChange={(v) => onChange('manualColors', { ...manualColors, tertiary: v })} />
            </div>
          </div>

          <div className="space-y-3">
            <label className="text-[9px] font-bold uppercase tracking-wider text-white/40 block">Tipografía</label>
            <FontSelect label="Fuente Principal (Títulos)" value={manualTypography?.primary || ''} onChange={(v) => onChange('manualTypography', { ...manualTypography, primary: v, secondary: manualTypography?.secondary || '' })} />
            <FontSelect label="Fuente Secundaria (Cuerpo)" value={manualTypography?.secondary || ''} onChange={(v) => onChange('manualTypography', { ...manualTypography, secondary: v, primary: manualTypography?.primary || '' })} />
          </div>
        </div>
      )}

      <div className="space-y-2.5">
        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/50">Servicio (Opcional)</label>
        <KairosSelect value={service} onChange={(v) => onChange('service', v)} options={SERVICES} placeholder="Ninguno (Enfoque General)" />
      </div>

      <div className="space-y-2.5">
        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/50">Estrategia de Comunicación</label>
        <div className="grid grid-cols-2 gap-2">
          <KairosSelect value={tone} onChange={(v) => onChange('tone', v)} options={TONES} placeholder="Tono (Auto)" />
          <KairosSelect value={cta} onChange={(v) => onChange('cta', v)} options={CTAS} placeholder="CTA (Auto)" />
        </div>
      </div>
    </div>
  );
}
