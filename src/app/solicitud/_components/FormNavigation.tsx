'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Loader2, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

interface FormNavigationProps {
  currentStep: number;
  totalSteps?: number;
  isSubmitting: boolean;
  validateStep: () => boolean;
  prevStep: () => void;
  nextStep: () => void;
  handleSubmit: () => void;
}

export function FormNavigation({
  currentStep,
  totalSteps = 4,
  isSubmitting,
  validateStep,
  prevStep,
  nextStep,
  handleSubmit,
}: FormNavigationProps) {
  const isValid = validateStep();
  const isLast = currentStep >= totalSteps;

  return (
    <div
      className="fixed lg:relative bottom-0 left-0 right-0 z-50 lg:z-30 px-4 pt-0 sm:px-6 lg:p-0 lg:mt-0"
      style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom, 1rem))' }}
    >
      {/* Glassmorphism backdrop — only visible on mobile */}
      <div className="absolute inset-0 lg:hidden bg-background/85 backdrop-blur-xl border-t border-white/5 shadow-[0_-20px_60px_rgba(0,0,0,0.25)]" />

      <div className="relative max-w-3xl mx-auto">
        {/* Progress bar */}
        <div className="hidden lg:block w-full h-0.5 bg-border/40 rounded-full mb-6 overflow-hidden">
          <motion.div
            className="h-full bg-primary rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${(currentStep / totalSteps) * 100}%` }}
            transition={{ duration: 0.5, ease: 'easeInOut' }}
          />
        </div>

        <div className="flex items-center gap-3 py-3 lg:py-0">
          {/* Back button */}
          <AnimatePresence mode="wait">
            {currentStep > 1 ? (
              <motion.div
                key="back-btn"
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -12 }}
                transition={{ duration: 0.2 }}
              >
                <Button
                  variant="outline"
                  size="lg"
                  onClick={prevStep}
                  disabled={isSubmitting}
                  className="h-12 w-12 sm:w-auto sm:px-6 px-0 rounded-full sm:rounded-2xl shrink-0 font-bold border-2 hover:bg-secondary transition-all"
                >
                  <ChevronLeft className="w-5 h-5 sm:mr-1.5" />
                  <span className="hidden sm:inline">Atrás</span>
                </Button>
              </motion.div>
            ) : (
              <div key="back-placeholder" className="h-12 w-12 sm:w-32 shrink-0" />
            )}
          </AnimatePresence>

          {/* Step dots indicator */}
          <div className="flex-1 flex justify-center items-center gap-2">
            {Array.from({ length: totalSteps }).map((_, i) => (
              <motion.div
                key={i}
                animate={{
                  width: currentStep === i + 1 ? 28 : 8,
                  backgroundColor:
                    currentStep > i + 1
                      ? 'hsl(var(--primary))'
                      : currentStep === i + 1
                      ? 'hsl(var(--primary))'
                      : 'hsl(var(--muted-foreground) / 0.3)',
                  opacity: currentStep >= i + 1 ? 1 : 0.5,
                }}
                transition={{ duration: 0.35, ease: 'easeInOut' }}
                className="h-2 rounded-full"
              />
            ))}
          </div>

          {/* Continue / Submit button */}
          <AnimatePresence mode="wait">
            <motion.div
              key={isLast ? 'submit' : 'next'}
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 12 }}
              transition={{ duration: 0.2 }}
              className="shrink-0"
            >
              {isLast ? (
                <Button
                  size="lg"
                  onClick={handleSubmit}
                  disabled={!isValid || isSubmitting}
                  className={cn(
                    'h-12 sm:h-14 px-5 sm:px-8 rounded-full sm:rounded-2xl font-bold transition-all',
                    isValid && !isSubmitting && 'shadow-xl shadow-primary/30'
                  )}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      <span className="hidden sm:inline">Enviando...</span>
                      <span className="sm:hidden">...</span>
                    </>
                  ) : (
                    <>
                      <span className="hidden sm:inline">Enviar Solicitud</span>
                      <span className="sm:hidden">Enviar</span>
                      <Sparkles className="w-4 h-4 ml-2" />
                    </>
                  )}
                </Button>
              ) : (
                <Button
                  size="lg"
                  onClick={nextStep}
                  disabled={!isValid}
                  className={cn(
                    'h-12 sm:h-14 px-5 sm:px-8 rounded-full sm:rounded-2xl font-bold group transition-all',
                    isValid
                      ? 'shadow-xl shadow-primary/30 animate-none'
                      : 'opacity-60 cursor-not-allowed'
                  )}
                >
                  <span className="hidden sm:inline">Continuar</span>
                  <span className="sm:hidden">Siguiente</span>
                  <ChevronRight className="w-5 h-5 ml-1.5 group-hover:translate-x-1 transition-transform" />
                </Button>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
