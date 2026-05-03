'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import * as Select from '@radix-ui/react-select';
import { ChevronDown, Check, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useFirestore, useUser } from '@/firebase/provider';
import { collection, getDocs, query, orderBy, where } from 'firebase/firestore';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';



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
  canvasRatio?: string;
  imagePersonGeneration?: string;
  imageSeed?: number | null;
  imageNegativePrompt?: string;
  imageCustomPrompt?: string;
  enableImageBackground?: boolean;
  imageSampleCount?: number;
  onChange: (key: 'service' | 'tone' | 'cta' | 'brandBookId' | 'manualColors' | 'manualTypography' | 'canvasRatio' | 'imagePersonGeneration' | 'imageSeed' | 'imageNegativePrompt' | 'imageCustomPrompt' | 'enableImageBackground' | 'imageSampleCount', value: any) => void;
  apiKey: string;
}

const IMAGE_RATIOS = [
  { value: '1:1', label: '1:1 (Cuadrado)' },
  { value: '4:5', label: '4:5 (Post)' },
  { value: '16:9', label: '16:9 (Horizontal)' },
  { value: '9:16', label: '9:16 (Historia / Reel)' },
];

const PERSON_GENERATION = [
  { value: 'dont_allow', label: 'Sin Personas' },
  { value: 'allow_adult', label: 'Adultos' },
  { value: 'allow_all', label: 'Todos (Sin filtro)' },
];

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

// ─── KairosCombobox ─────────────────────────────────────────────────────────────
function KairosCombobox({ value, onChange, options, placeholder }: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  placeholder: string;
}) {
  const [open, setOpen] = useState(false);
  const selected = options.find((o) => o.value === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          role="combobox"
          aria-expanded={open}
          className={cn(
            'w-full flex items-center justify-between gap-2 p-3.5 bg-white/5 border border-white/10 rounded-2xl',
            'text-[9px] font-bold uppercase tracking-wider text-white/90 outline-none',
            'hover:border-[#FF5C2B]/50 focus:ring-2 focus:ring-[#FF5C2B]/20 transition-all text-left'
          )}
        >
          <span className="truncate">{selected?.label || placeholder}</span>
          <ChevronDown className="w-3.5 h-3.5 text-white/40 shrink-0" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0 bg-[#050D14] border border-white/10 rounded-2xl shadow-xl z-[999] overflow-hidden" align="start">
        <Command className="bg-transparent border-none">
          <CommandInput placeholder="Buscar..." className="h-10 text-[9px] text-white/80 uppercase tracking-wider border-none focus:ring-0 focus-visible:ring-0" />
          <CommandList className="max-h-[260px] overflow-y-auto p-1.5 custom-scrollbar">
            <CommandEmpty className="text-[9px] text-white/50 uppercase tracking-wider py-6 text-center">No encontrado.</CommandEmpty>
            <CommandGroup>
              {options.map((opt) => (
                <CommandItem
                  key={opt.value}
                  value={opt.label}
                  onSelect={() => {
                    onChange(opt.value);
                    setOpen(false);
                  }}
                  className={cn(
                    'flex items-center justify-between px-3 py-2.5 rounded-xl text-[9px] font-bold uppercase tracking-wider cursor-pointer outline-none transition-colors',
                    'text-white/80 aria-selected:bg-[#FF5C2B]/20 aria-selected:text-white',
                    value === opt.value && 'bg-[#FF5C2B]/20 text-white'
                  )}
                >
                  {opt.label}
                  <Check className={cn("w-3 h-3 text-[#FF5C2B]", value === opt.value ? "opacity-100" : "opacity-0")} />
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

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
export function StrategyControls({ 
  service, tone, cta, brandBookId, manualColors, manualTypography, 
  canvasRatio, imagePersonGeneration, imageSeed, imageNegativePrompt, imageCustomPrompt,
  enableImageBackground, imageSampleCount,
  onChange, apiKey 
}: StrategyControlsProps) {
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
          <KairosCombobox value={brandBookId || 'none'} onChange={(v) => onChange('brandBookId', v === 'none' ? null : v)} options={brandBooks} placeholder="Seleccionar Brand Book..." />
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

      <div className="space-y-2.5">
        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/50">Proporción del Canvas</label>
        <KairosSelect 
          value={canvasRatio || '4:5'} 
          onChange={(v) => onChange('canvasRatio', v)} 
          options={IMAGE_RATIOS} 
          placeholder="Proporción" 
        />
      </div>

      {/* IA Background Toggle */}
      <div 
        className={cn(
          "p-4 border rounded-2xl transition-all cursor-pointer select-none",
          enableImageBackground 
            ? "bg-gradient-to-br from-[#FF5C2B]/10 to-transparent border-[#FF5C2B]/30" 
            : "bg-white/5 border-white/10 hover:border-white/20"
        )}
        onClick={() => onChange('enableImageBackground', !enableImageBackground)}
      >
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-white">Fondo IA (Imagen 3)</h3>
            <p className="text-[9px] font-medium text-white/50 leading-relaxed">Genera fondos fotorrealistas alineados a tu marca.</p>
          </div>
          <div className={cn(
            "w-10 h-5 rounded-full p-0.5 transition-colors duration-300 ease-in-out relative flex items-center",
            enableImageBackground ? "bg-[#FF5C2B]" : "bg-white/10"
          )}>
            <div className={cn(
              "w-4 h-4 bg-white rounded-full shadow-sm transition-transform duration-300 ease-in-out",
              enableImageBackground ? "translate-x-5" : "translate-x-0"
            )} />
          </div>
        </div>
      </div>

      {enableImageBackground && (
        <Accordion type="single" collapsible className="w-full">
        <AccordionItem value="advanced-image" className="border-white/5">
          <AccordionTrigger className="text-[10px] font-black uppercase tracking-[0.2em] text-[#FF5C2B] hover:no-underline py-2">
            Ajustes Avanzados de Imagen
          </AccordionTrigger>
          <AccordionContent className="space-y-4 pt-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-[9px] font-bold uppercase tracking-wider text-white/40 block">Detalles Adicionales del Fondo</label>
                <textarea
                  value={imageCustomPrompt || ''}
                  onChange={(e) => onChange('imageCustomPrompt', e.target.value)}
                  placeholder="Detalles extra (ej. 'fondo de playa al atardecer')"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-[10px] font-medium text-white/80 outline-none placeholder:text-white/20 hover:border-[#FF5C2B]/40 focus:ring-2 focus:ring-[#FF5C2B]/20 transition-all min-h-[40px] resize-none"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[9px] font-bold uppercase tracking-wider text-white/40 block">Personas</label>
                <KairosSelect 
                  value={imagePersonGeneration || 'allow_adult'} 
                  onChange={(v) => onChange('imagePersonGeneration', v)} 
                  options={PERSON_GENERATION} 
                  placeholder="Filtro" 
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-[9px] font-bold uppercase tracking-wider text-white/40 block">Variantes</label>
                <KairosSelect 
                  value={String(imageSampleCount || 1)} 
                  onChange={(v) => onChange('imageSampleCount', parseInt(v))} 
                  options={[
                    { value: '1', label: '1 Imagen' },
                    { value: '2', label: '2 Imágenes' },
                    { value: '3', label: '3 Imágenes' },
                    { value: '4', label: '4 Imágenes' }
                  ]} 
                  placeholder="Cantidad" 
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[9px] font-bold uppercase tracking-wider text-white/40 block">Semilla</label>
                <input
                  type="number"
                  value={imageSeed === null || imageSeed === undefined ? '' : imageSeed}
                  onChange={(e) => onChange('imageSeed', e.target.value ? parseInt(e.target.value) : null)}
                  placeholder="Aleatorio"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-[10px] font-mono text-white/80 outline-none placeholder:text-white/20 hover:border-[#FF5C2B]/40 focus:ring-2 focus:ring-[#FF5C2B]/20 transition-all"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[9px] font-bold uppercase tracking-wider text-white/40 block">Prompt Negativo</label>
              <textarea
                value={imageNegativePrompt || ''}
                onChange={(e) => onChange('imageNegativePrompt', e.target.value)}
                placeholder="Elementos a evitar (ej. texto, logos...)"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-[10px] font-medium text-white/80 outline-none placeholder:text-white/20 hover:border-[#FF5C2B]/40 focus:ring-2 focus:ring-[#FF5C2B]/20 transition-all min-h-[60px] resize-none"
              />
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
      )}
    </div>
  );
}
