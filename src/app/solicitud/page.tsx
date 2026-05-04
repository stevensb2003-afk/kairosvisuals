'use client';

import React, { useMemo } from 'react';
import { AnimatePresence } from 'framer-motion';
import {
  Building,
  Target,
  CheckCircle,
  Users as UsersIcon
} from 'lucide-react';
import { useFirestore, useDoc } from '@/firebase';
import { doc } from 'firebase/firestore';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Logo } from '@/components/ui/logo';

import { useBriefingForm } from './_hooks/useBriefingForm';
import { StepProfile } from './_components/StepProfile';
import { StepBusiness } from './_components/StepBusiness';
import { StepGoals } from './_components/StepGoals';
import { StepFinal } from './_components/StepFinal';
import { SuccessView } from './_components/SuccessView';
import { FormNavigation } from './_components/FormNavigation';

const steps = [
  { id: 1, title: 'Tu Perfil', icon: UsersIcon, description: 'Información de contacto' },
  { id: 2, title: 'Tu Negocio', icon: Building, description: 'Sobre tu marca' },
  { id: 3, title: 'Tus Objetivos', icon: Target, description: 'Metas y motivaciones' },
  { id: 4, title: 'Finalización', icon: CheckCircle, description: 'Detalles finales' }
];

export default function SolicitudPage() {
  const form = useBriefingForm();
  const firestore = useFirestore();

  const configRef = useMemo(() =>
    firestore ? doc(firestore, 'settings', 'briefing') : null,
  [firestore]);

  const { data: config } = useDoc<any>(configRef);

  if (form.isSuccess) {
    return <SuccessView />;
  }

  return (
    <div className="min-h-[100dvh] bg-background text-foreground flex flex-col lg:flex-row relative selection:bg-primary/20 lg:h-[100dvh] lg:overflow-hidden">
      {/* Ambient backgrounds — fixed so they don't scroll or split visually */}
      <div className="fixed inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 pointer-events-none z-0" />
      <div className="fixed -top-[20%] -right-[10%] w-[60%] h-[60%] rounded-full bg-primary/8 blur-[160px] pointer-events-none z-0" />
      <div className="fixed -bottom-[20%] -left-[10%] w-[40%] h-[40%] rounded-full bg-accent/5 blur-[120px] pointer-events-none z-0" />

      {/* Sidebar — transparent on mobile so global bg shines through, card bg on desktop */}
      <div className="w-full lg:w-[340px] xl:w-[380px] bg-transparent lg:bg-card/80 border-b lg:border-b-0 lg:border-r border-border/40 px-5 py-4 sm:px-7 sm:py-5 lg:p-10 xl:p-12 flex flex-col relative z-30 shrink-0 lg:backdrop-blur-sm sticky top-0 lg:static">
        {/* Logo */}
        <div
          className="flex items-center gap-3 mb-5 lg:mb-14 group cursor-pointer"
          onClick={() => window.location.href = '/'}
        >
          <div className="w-11 h-11 lg:w-13 lg:h-13 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
            <Logo className="w-full h-full text-primary" />
          </div>
          <span className="text-xl lg:text-2xl font-headline font-bold tracking-tight">Kairos Visuals</span>
        </div>

        {/* Heading */}
        <div className="mb-5 lg:mb-12">
          <Badge variant="outline" className="mb-3 border-primary/30 text-primary bg-primary/5 px-3 py-1 text-[11px]">
            Briefing de Marca
          </Badge>
          <h1 className="text-2xl lg:text-3xl xl:text-4xl font-headline font-bold mb-2 lg:mb-3 bg-clip-text text-transparent bg-gradient-to-br from-foreground to-foreground/50 leading-tight">
            Diseñemos tu futuro visual.
          </h1>
          <p className="text-muted-foreground text-xs lg:text-sm leading-relaxed hidden sm:block">
            Esta es la base de nuestra colaboración. Cuanto más sepamos, mejor podremos potenciar tu marca.
          </p>
        </div>

        {/* Mobile progress bar */}
        <div className="lg:hidden mb-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
              Paso {form.currentStep} de {steps.length}
            </span>
            <span className="text-xs font-bold text-primary">
              {Math.round((form.currentStep / steps.length) * 100)}%
            </span>
          </div>
          <div className="h-1.5 w-full bg-border/50 rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all duration-500 ease-in-out"
              style={{ width: `${(form.currentStep / steps.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Desktop step list */}
        <div className="hidden lg:flex flex-col gap-6 mt-auto">
          {steps.map((step) => (
            <div
              key={step.id}
              className={cn(
                'flex items-start gap-4 transition-all duration-500',
                form.currentStep === step.id ? 'opacity-100 translate-x-1.5' : 'opacity-30'
              )}
            >
              <div className={cn(
                'w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 border-2 transition-all duration-500',
                form.currentStep === step.id
                  ? 'bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/20 rotate-2'
                  : form.currentStep > step.id
                  ? 'bg-primary/15 text-primary border-primary/20'
                  : 'bg-secondary text-muted-foreground border-border'
              )}>
                {form.currentStep > step.id ? <CheckCircle className="w-5 h-5" /> : <step.icon className="w-5 h-5" />}
              </div>
              <div className="pt-0.5">
                <p className={cn(
                  'font-bold text-sm',
                  form.currentStep === step.id ? 'text-foreground' : 'text-foreground/60'
                )}>
                  {step.title}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">{step.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main content area */}
      <div className="flex-1 relative z-10 lg:h-full lg:flex lg:flex-col lg:overflow-hidden">
        {/* Mobile: natural scroll with bottom padding for fixed nav. Desktop: flex fill with internal scroll */}
        <div className="px-4 sm:px-6 lg:px-10 xl:px-14 pt-5 sm:pt-6 lg:pt-10 pb-28 lg:pb-8 lg:flex-1 lg:overflow-hidden lg:flex lg:flex-col">
          <div className="max-w-2xl xl:max-w-3xl mx-auto w-full lg:flex-1 lg:flex lg:flex-col lg:min-h-0">
            <AnimatePresence mode="wait">
              <div key={form.currentStep} className="lg:flex-1 lg:flex lg:flex-col lg:min-h-0">
                {form.currentStep === 1 && (
                  <StepProfile
                    formData={form.formData}
                    handleChange={form.handleChange}
                    handleSelectChange={form.handleSelectChange}
                    emailError={form.emailError}
                    showPhoneWarning={form.showPhoneWarning}
                    setShowPhoneWarning={form.setShowPhoneWarning}
                    selectedCountry={form.selectedCountry}
                    setSelectedCountry={form.setSelectedCountry}
                  />
                )}
                {form.currentStep === 2 && (
                  <StepBusiness
                    formData={form.formData}
                    handleChange={form.handleChange}
                    handleSelectChange={form.handleSelectChange}
                    setFormData={form.setFormData}
                    newSocial={form.newSocial}
                    setNewSocial={form.setNewSocial}
                    addSocial={form.addSocial}
                    removeSocial={form.removeSocial}
                    config={config}
                  />
                )}
                {form.currentStep === 3 && (
                  <StepGoals
                    formData={form.formData}
                    handleToggleSelection={form.handleToggleSelection}
                    handleSelectChange={form.handleSelectChange}
                    config={config}
                  />
                )}
                {form.currentStep === 4 && (
                  <StepFinal
                    formData={form.formData}
                    handleSelectChange={form.handleSelectChange}
                    config={config}
                  />
                )}
              </div>
            </AnimatePresence>
          </div>
        </div>

        {/* Navigation */}
        <FormNavigation
          currentStep={form.currentStep}
          totalSteps={steps.length}
          isSubmitting={form.isSubmitting}
          validateStep={form.validateStep}
          prevStep={form.prevStep}
          nextStep={form.nextStep}
          handleSubmit={form.handleSubmit}
        />
      </div>
    </div>
  );
}
