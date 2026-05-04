'use client';

import React from 'react';
import type { Variants } from 'framer-motion';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Sparkles, MessageSquare, Mail, Phone, Instagram, Music2, Facebook, Linkedin, Search, Megaphone, Share2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { BriefingFormData } from '../_hooks/useBriefingForm';
import { ScrollFadeWrapper } from './ScrollFadeWrapper';

const CONTACT_SOURCES_FALLBACK = [
  "Instagram", "TikTok", "Facebook", "LinkedIn", "Referido por un amigo",
  "Google / Búsqueda", "Publicidad Pagada", "Otro"
];

const SOURCE_ICONS: Record<string, any> = {
  "Instagram": Instagram,
  "TikTok": Music2,
  "Facebook": Facebook,
  "LinkedIn": Linkedin,
  "Google / Búsqueda": Search,
  "Publicidad Pagada": Megaphone,
  "Referido por un amigo": Share2,
};

interface StepFinalProps {
  formData: BriefingFormData;
  handleSelectChange: (name: string, value: string) => void;
  config: any;
}

const EASE_OUT = [0.4, 0, 0.2, 1] as const;
const EASE_IN = [0.4, 0, 1, 1] as const;

const containerVariants: Variants = {
  hidden: { opacity: 0, x: 40 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.35, ease: EASE_OUT } },
  exit: { opacity: 0, x: -40, transition: { duration: 0.25, ease: EASE_IN } },
};

const fieldVariants: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.08, duration: 0.35, ease: EASE_OUT },
  }),
};

const CONTACT_METHODS = [
  { id: 'whatsapp', icon: MessageSquare, label: 'WhatsApp', description: 'Rápido y directo' },
  { id: 'email', icon: Mail, label: 'E-mail', description: 'Con más detalle' },
  { id: 'phone', icon: Phone, label: 'Llamada', description: 'Conversación directa' },
];

export function StepFinal({ formData, handleSelectChange, config }: StepFinalProps) {
  const sources: string[] = config?.contactSources || CONTACT_SOURCES_FALLBACK;

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      className="lg:h-full flex flex-col"
    >
      <Card className="border-primary/10 shadow-xl lg:shadow-2xl flex flex-col lg:flex-1 lg:min-h-0 overflow-hidden">
        <ScrollFadeWrapper className="p-5 sm:p-8 md:p-12">
          {/* Header */}
          <motion.div custom={0} variants={fieldVariants} initial="hidden" animate="visible" className="space-y-3 mb-8">
            <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20">
              <Sparkles className="h-6 w-6" />
            </div>
            <h2 className="text-3xl md:text-4xl font-headline font-bold tracking-tight">Casi Listos.</h2>
            <p className="text-muted-foreground text-base leading-relaxed max-w-xl">
              Para finalizar, cuéntanos cómo nos encontraste y cómo prefieres que sigamos la conversación.
            </p>
          </motion.div>

          <div className="space-y-10">
            {/* Contact source */}
            <motion.div custom={1} variants={fieldVariants} initial="hidden" animate="visible" className="space-y-4">
              <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                ¿Cómo te enteraste de nosotros?
              </Label>
              <RadioGroup
                value={formData.contactSource}
                onValueChange={(val) => handleSelectChange('contactSource', val)}
                className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3"
              >
                {sources.map((opt: string) => {
                  const Icon = SOURCE_ICONS[opt] || Sparkles;
                  const isSelected = formData.contactSource === opt;
                  return (
                    <Label
                      key={opt}
                      className={cn(
                        'flex flex-col items-center justify-center gap-2 p-4 rounded-2xl border-2 cursor-pointer transition-all duration-250 text-center min-h-[90px]',
                        isSelected
                          ? 'border-primary bg-primary/8 text-primary shadow-md shadow-primary/10 scale-[1.03]'
                          : 'border-secondary/50 bg-secondary/10 hover:border-primary/25 hover:bg-secondary/25'
                      )}
                    >
                      <RadioGroupItem value={opt} className="sr-only" />
                      <Icon className={cn('w-5 h-5', isSelected ? 'text-primary' : 'text-muted-foreground')} />
                      <span className="font-semibold text-xs leading-tight">{opt}</span>
                    </Label>
                  );
                })}
              </RadioGroup>
            </motion.div>

            {/* Contact preference */}
            <motion.div custom={2} variants={fieldVariants} initial="hidden" animate="visible" className="space-y-4">
              <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                Método de contacto favorito
              </Label>
              <RadioGroup
                value={formData.contactPreference}
                onValueChange={(val) => handleSelectChange('contactPreference', val)}
                className="grid grid-cols-1 sm:grid-cols-3 gap-4"
              >
                {CONTACT_METHODS.map((item) => {
                  const isSelected = formData.contactPreference === item.id;
                  return (
                    <motion.div key={item.id} whileTap={{ scale: 0.97 }}>
                      <Label className={cn(
                        'flex flex-col items-center gap-2 p-6 rounded-2xl border-2 cursor-pointer transition-all duration-250 w-full',
                        isSelected
                          ? 'border-primary bg-primary/8 text-primary shadow-lg shadow-primary/15'
                          : 'border-secondary/50 bg-secondary/10 hover:border-primary/30 hover:bg-secondary/25'
                      )}>
                        <RadioGroupItem value={item.id} className="sr-only" />
                        <item.icon className={cn('w-8 h-8 mb-1 transition-colors', isSelected ? 'text-primary' : 'text-muted-foreground')} />
                        <span className="font-bold text-sm">{item.label}</span>
                        <span className={cn('text-[11px] font-medium', isSelected ? 'text-primary/70' : 'text-muted-foreground/60')}>
                          {item.description}
                        </span>
                      </Label>
                    </motion.div>
                  );
                })}
              </RadioGroup>
            </motion.div>
          </div>
          <div className="h-6" />
        </ScrollFadeWrapper>
      </Card>
    </motion.div>
  );
}
