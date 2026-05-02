'use client';

import * as Dialog from '@radix-ui/react-dialog';
import { X, Zap, Grid3X3, Paintbrush, Type, Mic2, Shapes } from 'lucide-react';

interface BrandbookModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function Section({ number, title, icon: Icon, children }: { number: string; title: string; icon: React.ElementType; children: React.ReactNode }) {
  return (
    <section className="space-y-6">
      <div className="flex items-center gap-3 border-b border-stone-200 pb-4">
        <Icon className="w-6 h-6 text-[#FF5C2B]" />
        <h3 className="text-xl font-black uppercase tracking-tight text-[#0A1A26]" style={{ fontFamily: "'Montserrat', sans-serif" }}>
          {number}. {title}
        </h3>
      </div>
      {children}
    </section>
  );
}

export function BrandbookModal({ open, onOpenChange }: BrandbookModalProps) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-[#0A1A26]/85 backdrop-blur-md z-[70] animate-in fade-in-0 duration-200" />
        <Dialog.Content className="fixed inset-4 lg:inset-10 z-[75] bg-[#FAFAFA] rounded-[2rem] shadow-2xl flex flex-col overflow-hidden animate-in fade-in-0 zoom-in-95 duration-300 border border-stone-200">
          <Dialog.Title className="sr-only">Kairós Creativo - Guía de Identidad Visual</Dialog.Title>
          {/* Header */}
          <div className="p-6 lg:p-8 border-b border-stone-200 flex justify-between items-center bg-white sticky top-0 z-10 shadow-sm shrink-0">
            <div>
              <h2 className="text-xl font-black text-[#0A1A26] uppercase tracking-tight" style={{ fontFamily: "'Montserrat', sans-serif" }}>Kairós Creativo</h2>
              <p className="text-[9px] font-bold tracking-[0.4em] text-[#FF5C2B] uppercase mt-1">Guía de Identidad Visual</p>
            </div>
            <Dialog.Close className="w-9 h-9 bg-stone-100 rounded-full flex items-center justify-center text-[#0A1A26] hover:bg-[#FF5C2B] hover:text-white transition-colors">
              <X className="w-4 h-4" />
            </Dialog.Close>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-6 lg:p-12 space-y-14 scrollbar-thin scrollbar-thumb-[#0A1A26]/20 scrollbar-track-transparent">

            {/* 01. ADN */}
            <Section number="01" title="ADN de la Marca" icon={Zap}>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-[#0A1A26] text-white p-8 rounded-3xl relative overflow-hidden shadow-lg">
                  <div className="absolute -right-10 -top-10 opacity-[0.04]">
                    <div className="w-64 h-64 rounded-full bg-white" />
                  </div>
                  <p className="text-[9px] font-black uppercase tracking-widest text-[#FF5C2B] mb-3 z-10">El Concepto</p>
                  <p className="text-xl font-black text-[#FF5C2B] uppercase tracking-tight mb-3" style={{ fontFamily: "'Montserrat', sans-serif" }}>Kairós (καιρός)</p>
                  <p className="text-sm text-[#E8D9C5] font-medium leading-relaxed">El momento perfecto, el tiempo oportuno. El instante exacto donde estrategia y propósito se alinean.</p>
                </div>
                <div className="space-y-4">
                  <div className="bg-[#FF5C2B] p-5 rounded-2xl">
                    <p className="text-[9px] font-black uppercase tracking-widest text-[#0A1A26] mb-2">Nuestro Propósito</p>
                    <p className="text-sm text-white font-bold leading-relaxed italic">"Usamos la creatividad para inspirar, conectar y construir marcas con propósito."</p>
                  </div>
                  <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm">
                    <p className="text-[9px] font-black uppercase tracking-widest text-[#FF5C2B] mb-3">Misión</p>
                    <p className="text-xs text-[#0A1A26] font-medium leading-relaxed">Impulsar a emprendedores y marcas a comunicar su propósito con identidad visual coherente y estratégica.</p>
                  </div>
                  <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm">
                    <p className="text-[9px] font-black uppercase tracking-widest text-[#FF5C2B] mb-3">Visión</p>
                    <p className="text-xs text-[#0A1A26] font-medium leading-relaxed">Ser una agencia creativa reconocida por autenticidad, excelencia y enfoque humano.</p>
                  </div>
                </div>
              </div>
              <div className="bg-[#E8D9C5] p-6 rounded-3xl border border-stone-200">
                <p className="text-[10px] font-black uppercase tracking-widest text-[#0A1A26] mb-5">Valores</p>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                  {['Excelencia', 'Creatividad', 'Honestidad', 'Servicio Genuino'].map((v) => (
                    <div key={v}><p className="text-sm font-black text-[#0A1A26]">{v}</p></div>
                  ))}
                </div>
              </div>
            </Section>

            {/* 02. Servicios */}
            <Section number="02" title="Nuestros Servicios" icon={Grid3X3}>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {['Diseño gráfico y storytelling visual', 'Branding y logos', 'Producción audiovisual', 'Gestión de Redes Sociales', 'Asesoría personalizada', 'Publicidad digital'].map((s, i) => (
                  <div key={s} className="bg-white p-4 rounded-2xl border border-stone-200 shadow-sm flex items-center gap-3 hover:border-[#FF5C2B] transition-colors">
                    <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${i % 2 === 0 ? 'bg-[#FF5C2B]' : 'bg-[#0A1A26]'}`} />
                    <span className="text-[10px] font-bold text-[#0A1A26] uppercase tracking-wider">{s}</span>
                  </div>
                ))}
              </div>
            </Section>

            {/* 03. Colores */}
            <Section number="03" title="Universo Cromático" icon={Paintbrush}>
              <p className="text-sm text-[#0A1A26] font-medium">Combinación de la energía del naranja con la sobriedad del azul medianoche — balance <em>Minimalist Luxe</em>.</p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {[
                  { name: 'Naranja Kairós', hex: '#FF5C2B', rgb: '255, 92, 43', role: 'Energía y Creatividad', bg: '#FF5C2B', text: 'white' },
                  { name: 'Azul Profundo', hex: '#0A1A26', rgb: '10, 26, 38', role: 'Autoridad y Confianza', bg: '#0A1A26', text: '#E8D9C5' },
                  { name: 'Crema Kairós', hex: '#E8D9C5', rgb: '232, 217, 197', role: 'Calidez y Claridad', bg: '#E8D9C5', text: '#0A1A26' },
                ].map((c) => (
                  <div key={c.hex} className="rounded-3xl p-7 shadow-lg" style={{ backgroundColor: c.bg }}>
                    <h4 className="text-xl font-black mb-5 uppercase" style={{ color: c.text, fontFamily: "'Montserrat', sans-serif" }}>{c.name}</h4>
                    <div className="space-y-0.5 font-mono text-xs font-bold mb-5" style={{ color: c.text }}>
                      <p>HEX: {c.hex}</p>
                      <p>RGB: {c.rgb}</p>
                    </div>
                    <p className="text-[9px] uppercase tracking-widest font-black border-t pt-3 opacity-80" style={{ color: c.text, borderColor: `${c.text}40` }}>{c.role}</p>
                  </div>
                ))}
              </div>
            </Section>

            {/* 04. Tipografía */}
            <Section number="04" title="Tipografías" icon={Type}>
              <div className="space-y-4">
                {[
                  { role: 'Títulos de Marca', name: 'Montserrat Black', usage: 'Identidad visual. Siempre en mayúsculas. Kern negativo para máximo impacto.', preview: 'KAIRÓS', previewClass: 'text-4xl font-black tracking-tight' },
                  { role: 'Eslogan & Subtítulos', name: 'Montserrat Medium', usage: 'Espaciado amplio (+200) para look de lujo. Complementa sin restar al logo.', preview: 'MINIMALIST LUXE', previewClass: 'text-xl font-medium tracking-[0.3em]' },
                  { role: 'Cuerpo de Texto', name: 'Inter Regular', usage: 'Máxima legibilidad en pantallas. Limpieza visual y versatilidad.', preview: 'El diseño es el embajador silencioso de tu marca.', previewClass: 'text-sm font-medium' },
                ].map((t) => (
                  <div key={t.name} className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm flex flex-col md:flex-row items-center gap-6">
                    <div className="flex-1">
                      <p className="text-[9px] font-black text-[#FF5C2B] uppercase tracking-widest mb-1">{t.role}</p>
                      <h4 className="text-lg font-bold text-[#0A1A26] mb-1">{t.name}</h4>
                      <p className="text-xs text-[#0A1A26]/60 font-medium leading-relaxed">{t.usage}</p>
                    </div>
                    <div className="flex-1 w-full bg-stone-50 p-5 rounded-xl border border-stone-200 flex items-center justify-center">
                      <span className={`text-[#0A1A26] text-center ${t.previewClass}`} style={{ fontFamily: "'Montserrat', sans-serif" }}>{t.preview}</span>
                    </div>
                  </div>
                ))}
              </div>
            </Section>

            {/* 05. Tono de voz */}
            <Section number="05" title="Tono de Voz" icon={Mic2}>
              <div className="bg-[#0A1A26] text-white p-10 lg:p-14 rounded-[2rem] shadow-2xl relative overflow-hidden">
                <div className="absolute -right-16 -bottom-16 opacity-[0.04] w-72 h-72 rounded-full bg-white pointer-events-none" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
                  {[
                    { label: 'Personalidad', title: 'Mentor Creativo', desc: 'Guías con experiencia. Sabios pero frescos. No dictamos órdenes, inspiramos caminos.' },
                    { label: 'Tono', title: 'Inspirador, Seguro y Directo', desc: 'Hablamos con autoridad desde la cercanía humana. Evitamos tecnicismos vacíos.' },
                  ].map((t) => (
                    <div key={t.label} className="bg-white/10 border border-white/20 p-6 rounded-3xl backdrop-blur-sm">
                      <p className="text-[9px] font-black uppercase tracking-widest text-[#FF5C2B] mb-3">{t.label}</p>
                      <p className="text-white font-bold text-lg mb-2" style={{ fontFamily: "'Montserrat', sans-serif" }}>{t.title}</p>
                      <p className="text-[#E8D9C5] text-sm font-medium leading-relaxed">{t.desc}</p>
                    </div>
                  ))}
                </div>
                <div className="bg-[#FF5C2B] p-8 rounded-3xl text-center">
                  <p className="text-[9px] font-black uppercase tracking-widest text-[#0A1A26] mb-2 opacity-90">Frase de Oro</p>
                  <p className="text-2xl lg:text-3xl font-bold text-white italic">"Creatividad en el tiempo perfecto"</p>
                </div>
              </div>
            </Section>

            {/* 06. Elementos Gráficos */}
            <Section number="06" title="Elementos Gráficos" icon={Shapes}>
              <p className="text-sm text-[#0A1A26] font-medium">Recursos visuales de apoyo que mantienen la estética Minimalist Luxe.</p>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { name: 'Flechas', hint: 'thin line arrow', el: <svg viewBox="0 0 24 24" fill="none" stroke="#FF5C2B" strokeWidth="1" className="w-8 h-8"><path d="M5 12h14M12 5l7 7-7 7" /></svg> },
                  { name: 'Grid', hint: 'dot grid pattern', el: <div className="w-12 h-12 opacity-40" style={{ backgroundImage: 'radial-gradient(#FF5C2B 2px, transparent 2px)', backgroundSize: '10px 10px' }} /> },
                  { name: 'Círculos', hint: 'thin circle outline', el: <div className="w-10 h-10 rounded-full border-2 border-[#FF5C2B] opacity-60" /> },
                  { name: 'Abstracto', hint: 'minimalist geometric', el: <div className="w-10 h-10 border-2 border-[#FF5C2B] opacity-60 rotate-45" /> },
                ].map((e) => (
                  <div key={e.name} className="bg-white border border-stone-200 rounded-2xl p-4 flex flex-col items-center justify-center gap-3 aspect-square hover:border-[#FF5C2B] transition-colors shadow-sm">
                    {e.el}
                    <p className="text-[9px] font-black uppercase tracking-widest text-[#0A1A26]">{e.name}</p>
                    <code className="text-[8px] text-stone-500 bg-stone-100 px-2 py-0.5 rounded">{e.hint}</code>
                  </div>
                ))}
              </div>
            </Section>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
