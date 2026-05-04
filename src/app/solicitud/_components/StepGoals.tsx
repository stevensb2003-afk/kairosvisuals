'use client';

import React from 'react';
import type { Variants } from 'framer-motion';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Target, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { BriefingFormData } from '../_hooks/useBriefingForm';
import { ScrollFadeWrapper } from './ScrollFadeWrapper';

const EXPECTATIONS_FALLBACK = [
  "Crear y Fidelizar una Comunidad Activa",
  "Generar más Leads y Consultas de Clientes",
  "Educación de Audiencia sobre mis Servicios",
  "Identidad de Marca Coherente",
  "Diseño Visual de Alto Impacto",
  "Estrategia de Contenido Clara"
];

const MAIN_GOALS_FALLBACK = [
  "Escalar Ventas en un 50% o más",
  "Posicionarme como Referente No. 1 en mi Nicho",
  "Automatizar Marketing para Liberar mi Tiempo",
  "Lanzar un Nuevo Producto o Servicio",
  "Internacionalizar mi Marca",
  "Mejorar el Enganche (Engagement)"
];

const MOTIVATIONS_FALLBACK = [
  "Delegar las redes porque no tengo tiempo",
  "Mi marca actual se ve anticuada",
  "Acabo de iniciar un nuevo proyecto",
  "No estoy logrando resultados con mi imagen actual",
  "Quiero llevar mi negocio al siguiente nivel"
];

interface StepGoalsProps {
  formData: BriefingFormData;
  handleToggleSelection: (field: 'expectations' | 'mainGoals', value: string) => void;
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
    transition: { delay: i * 0.07, duration: 0.35, ease: EASE_OUT },
  }),
};

function OptionChip({
  label, isSelected, onToggle, disabled
}: { label: string; isSelected: boolean; onToggle: () => void; disabled: boolean }) {
  return (
    <motion.div
      whileTap={{ scale: 0.97 }}
      onClick={!disabled || isSelected ? onToggle : undefined}
      className={cn(
        'p-4 sm:p-5 rounded-2xl border-2 cursor-pointer transition-all duration-250 flex items-center justify-between gap-3 group select-none',
        isSelected
          ? 'border-primary bg-primary/8 shadow-md shadow-primary/10'
          : disabled
          ? 'border-secondary/30 bg-secondary/10 opacity-50 cursor-not-allowed'
          : 'border-secondary/50 bg-secondary/20 hover:border-primary/30 hover:bg-secondary/35'
      )}
    >
      <span className={cn('text-sm font-medium leading-snug', isSelected ? 'text-primary' : 'text-foreground/80')}>
        {label}
      </span>
      <div className={cn(
        'w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all',
        isSelected ? 'bg-primary border-primary' : 'border-muted-foreground/30 group-hover:border-primary/50'
      )}>
        {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-primary-foreground" />}
      </div>
    </motion.div>
  );
}

export function StepGoals({ formData, handleToggleSelection, handleSelectChange, config }: StepGoalsProps) {
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
              <Target className="h-6 w-6" />
            </div>
            <h2 className="text-3xl md:text-4xl font-headline font-bold tracking-tight">Tus Metas Visuales.</h2>
            <p className="text-muted-foreground text-base leading-relaxed max-w-xl">
              Define qué quieres lograr. Selecciona hasta <strong>3 opciones</strong> en cada categoría.
            </p>
          </motion.div>

          <div className="space-y-10">
            {/* Expectations */}
            <motion.div custom={1} variants={fieldVariants} initial="hidden" animate="visible" className="space-y-4">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                  ¿Qué esperas lograr con Kairos?
                </Label>
                <Badge
                  variant="secondary"
                  className={cn(
                    'text-xs font-bold border transition-colors',
                    formData.expectations.length === 3
                      ? 'bg-primary/10 text-primary border-primary/30'
                      : 'bg-muted/40 text-muted-foreground border-border/40'
                  )}
                >
                  {formData.expectations.length} / 3
                </Badge>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {(config?.expectations || EXPECTATIONS_FALLBACK).map((opt: string) => (
                  <OptionChip
                    key={opt}
                    label={opt}
                    isSelected={formData.expectations.includes(opt)}
                    onToggle={() => handleToggleSelection('expectations', opt)}
                    disabled={formData.expectations.length >= 3 && !formData.expectations.includes(opt)}
                  />
                ))}
              </div>
            </motion.div>

            {/* Main Goals */}
            <motion.div custom={2} variants={fieldVariants} initial="hidden" animate="visible" className="space-y-4">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                  Objetivos de Crecimiento
                </Label>
                <Badge
                  variant="secondary"
                  className={cn(
                    'text-xs font-bold border transition-colors',
                    formData.mainGoals.length === 3
                      ? 'bg-primary/10 text-primary border-primary/30'
                      : 'bg-muted/40 text-muted-foreground border-border/40'
                  )}
                >
                  {formData.mainGoals.length} / 3
                </Badge>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {(config?.mainGoals || MAIN_GOALS_FALLBACK).map((opt: string) => (
                  <OptionChip
                    key={opt}
                    label={opt}
                    isSelected={formData.mainGoals.includes(opt)}
                    onToggle={() => handleToggleSelection('mainGoals', opt)}
                    disabled={formData.mainGoals.length >= 3 && !formData.mainGoals.includes(opt)}
                  />
                ))}
              </div>
            </motion.div>

            {/* Motivation */}
            <motion.div custom={3} variants={fieldVariants} initial="hidden" animate="visible" className="space-y-4">
              <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                ¿Qué te motivó a contactarnos hoy?
              </Label>
              <RadioGroup
                value={formData.motivation}
                onValueChange={(val) => handleSelectChange('motivation', val)}
                className="grid grid-cols-1 gap-3"
              >
                {(config?.motivations || MOTIVATIONS_FALLBACK).map((opt: string) => (
                  <Label
                    key={opt}
                    className={cn(
                      'flex items-center gap-4 p-4 sm:p-5 rounded-2xl border-2 cursor-pointer transition-all duration-250 hover:bg-secondary/30',
                      formData.motivation === opt
                        ? 'border-primary bg-primary/8 text-foreground'
                        : 'border-secondary/50 bg-secondary/10'
                    )}
                  >
                    <RadioGroupItem value={opt} className="w-5 h-5 border-primary text-primary shrink-0" />
                    <span className="font-medium text-sm leading-snug">{opt}</span>
                  </Label>
                ))}
              </RadioGroup>
            </motion.div>
          </div>
          <div className="h-6" />
        </ScrollFadeWrapper>
      </Card>
    </motion.div>
  );
}
