'use client';

import React from 'react';
import type { Variants } from 'framer-motion';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { PhoneInput } from '@/components/ui/phone-input';
import { Users as UsersIcon, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { type Country } from 'react-phone-number-input';
import { BriefingFormData } from '../_hooks/useBriefingForm';
import { ScrollFadeWrapper } from './ScrollFadeWrapper';

interface StepProfileProps {
  formData: BriefingFormData;
  handleChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  handleSelectChange: (name: string, value: string) => void;
  emailError: string;
  showPhoneWarning: boolean;
  setShowPhoneWarning: (show: boolean) => void;
  selectedCountry: Country | undefined;
  setSelectedCountry: (country: Country | undefined) => void;
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
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.35, ease: EASE_OUT },
  }),
};

export function StepProfile({
  formData,
  handleChange,
  handleSelectChange,
  emailError,
  showPhoneWarning,
  setShowPhoneWarning,
  selectedCountry,
  setSelectedCountry,
}: StepProfileProps) {
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
              <UsersIcon className="h-6 w-6" />
            </div>
            <h2 className="text-3xl md:text-4xl font-headline font-bold tracking-tight">
              Cuéntanos sobre ti.
            </h2>
            <p className="text-muted-foreground text-base max-w-xl leading-relaxed">
              Queremos saber con quién estamos hablando. Estos datos nos servirán para el seguimiento inicial.
            </p>
          </motion.div>

          {/* Fields */}
          <div className="grid gap-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <motion.div custom={1} variants={fieldVariants} initial="hidden" animate="visible" className="space-y-2">
                <Label htmlFor="firstName" className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                  Nombre <span className="text-primary">*</span>
                </Label>
                <Input
                  id="firstName" name="firstName" value={formData.firstName} onChange={handleChange}
                  placeholder="Ej. Juan"
                  className="bg-secondary/30 h-13 border border-transparent text-base focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:border-primary/40 focus-visible:shadow-[0_0_12px_hsl(var(--primary)/0.15)] px-5 rounded-2xl transition-all duration-200"
                />
              </motion.div>

              <motion.div custom={2} variants={fieldVariants} initial="hidden" animate="visible" className="space-y-2">
                <Label htmlFor="lastName" className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                  Apellido <span className="text-primary">*</span>
                </Label>
                <Input
                  id="lastName" name="lastName" value={formData.lastName} onChange={handleChange}
                  placeholder="Ej. Pérez"
                  className="bg-secondary/30 h-13 border border-transparent text-base focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:border-primary/40 focus-visible:shadow-[0_0_12px_hsl(var(--primary)/0.15)] px-5 rounded-2xl transition-all duration-200"
                />
              </motion.div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <motion.div custom={3} variants={fieldVariants} initial="hidden" animate="visible" className="space-y-2">
                <Label htmlFor="phone" className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                  Teléfono / WhatsApp <span className="text-primary">*</span>
                </Label>
                <div
                  className="relative"
                  onClick={() => { if (!selectedCountry) setShowPhoneWarning(true); }}
                >
                  <PhoneInput
                    value={formData.phone as any}
                    defaultCountry="CR"
                    country={selectedCountry}
                    onCountryChange={(country) => {
                      setSelectedCountry(country);
                      if (country) setShowPhoneWarning(false);
                    }}
                    onChange={(val) => handleSelectChange('phone', val)}
                    placeholder="8888 8888"
                    className="h-13 font-medium"
                  />
                  {showPhoneWarning && !selectedCountry && (
                    <motion.p
                      initial={{ opacity: 0, y: -6 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-xs text-amber-500 font-semibold mt-2 flex items-center gap-1.5"
                    >
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      Selecciona tu país primero para habilitar el campo.
                    </motion.p>
                  )}
                </div>
              </motion.div>

              <motion.div custom={4} variants={fieldVariants} initial="hidden" animate="visible" className="space-y-2">
                <Label htmlFor="email" className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                  Correo <span className="text-muted-foreground/60 font-normal normal-case tracking-normal text-xs ml-1">(Opcional)</span>
                </Label>
                <Input
                  id="email" name="email" type="email" value={formData.email}
                  onChange={handleChange}
                  placeholder="tu@correo.com"
                  className={cn(
                    'bg-secondary/30 h-13 border border-transparent text-base focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:border-primary/40 focus-visible:shadow-[0_0_12px_hsl(var(--primary)/0.15)] px-5 rounded-2xl transition-all duration-200',
                    emailError && 'ring-2 ring-destructive/60 border-destructive/40'
                  )}
                />
                {emailError && (
                  <motion.p
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-xs text-destructive flex items-center gap-1.5 font-medium"
                  >
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    {emailError}
                  </motion.p>
                )}
              </motion.div>
            </div>
          </div>

          {/* Bottom spacer for scroll fade */}
          <div className="h-6" />
        </ScrollFadeWrapper>
      </Card>
    </motion.div>
  );
}
