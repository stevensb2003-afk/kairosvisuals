'use client';

import React from 'react';
import type { Variants } from 'framer-motion';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Building, Plus, X, Globe, Instagram, Facebook, Music2, Linkedin, Twitter, Youtube, Link as LinkIcon } from 'lucide-react';
import { BriefingFormData, SocialMedia } from '../_hooks/useBriefingForm';
import { ScrollFadeWrapper } from './ScrollFadeWrapper';

const INDUSTRIES_FALLBACK = [
  "Bienes Raíces", "Marcas Personales", "E-commerce", "Salud y Bienestar", "Gastronomía",
  "Tecnología / SaaS", "Educación", "Servicios Profesionales", "Construcción / Arquitectura", "Otro"
];

const SOCIAL_PLATFORMS = [
  { id: 'instagram', name: 'Instagram' },
  { id: 'facebook', name: 'Facebook' },
  { id: 'tiktok', name: 'TikTok' },
  { id: 'linkedin', name: 'LinkedIn' },
  { id: 'twitter', name: 'Twitter/X' },
  { id: 'youtube', name: 'YouTube' },
  { id: 'web', name: 'Sitio Web' },
  { id: 'other', name: 'Otro' }
];

const SOCIAL_MEDIA_ICONS: Record<string, any> = {
  instagram: Instagram,
  facebook: Facebook,
  tiktok: Music2,
  linkedin: Linkedin,
  twitter: Twitter,
  youtube: Youtube,
  other: LinkIcon
};

interface StepBusinessProps {
  formData: BriefingFormData;
  handleChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  handleSelectChange: (name: string, value: string) => void;
  setFormData: React.Dispatch<React.SetStateAction<BriefingFormData>>;
  newSocial: SocialMedia;
  setNewSocial: React.Dispatch<React.SetStateAction<SocialMedia>>;
  addSocial: () => void;
  removeSocial: (index: number) => void;
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

const inputClass = "bg-secondary/30 border border-transparent text-base focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:border-primary/40 focus-visible:shadow-[0_0_12px_hsl(var(--primary)/0.15)] px-5 rounded-2xl transition-all duration-200";

export function StepBusiness({
  formData, handleChange, handleSelectChange, setFormData,
  newSocial, setNewSocial, addSocial, removeSocial, config
}: StepBusinessProps) {
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
              <Building className="h-6 w-6" />
            </div>
            <h2 className="text-3xl md:text-4xl font-headline font-bold tracking-tight">Tu Negocio y Marca.</h2>
            <p className="text-muted-foreground text-base leading-relaxed max-w-xl">
              Háblanos de lo que haces. No escatimes en detalles, nos encanta conocer nuevas historias.
            </p>
          </motion.div>

          <div className="grid gap-7">
            {/* About business textarea */}
            <motion.div custom={1} variants={fieldVariants} initial="hidden" animate="visible" className="space-y-2">
              <Label htmlFor="aboutBusiness" className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                Cuéntanos sobre tu negocio <span className="text-primary">*</span>
              </Label>
              <Textarea
                id="aboutBusiness" name="aboutBusiness" value={formData.aboutBusiness} onChange={handleChange}
                placeholder="Dinos qué haces, a qué te dedicas, quién es tu cliente ideal y qué te hace único..."
                className={`min-h-[140px] ${inputClass} py-4 resize-none`}
              />
            </motion.div>

            {/* Company + Industry */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <motion.div custom={2} variants={fieldVariants} initial="hidden" animate="visible" className="space-y-2">
                <Label htmlFor="companyName" className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                  Nombre Comercial
                </Label>
                <Input
                  id="companyName" name="companyName" value={formData.companyName} onChange={handleChange}
                  placeholder="Ej. Mi Marca S.A."
                  className={`h-13 ${inputClass}`}
                />
              </motion.div>

              <motion.div custom={3} variants={fieldVariants} initial="hidden" animate="visible" className="space-y-2">
                <Label htmlFor="industry" className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                  Industria / Nicho <span className="text-primary">*</span>
                </Label>
                <Select value={formData.industry} onValueChange={(val) => handleSelectChange('industry', val)}>
                  <SelectTrigger className={`h-13 ${inputClass}`}>
                    <SelectValue placeholder="Selecciona uno..." />
                  </SelectTrigger>
                  <SelectContent className="max-h-[200px]">
                    {(config?.industries || INDUSTRIES_FALLBACK).map((ind: string) => (
                      <SelectItem key={ind} value={ind}>{ind}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </motion.div>
            </div>

            {/* Social Media */}
            <motion.div custom={4} variants={fieldVariants} initial="hidden" animate="visible" className="space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                  Redes Sociales Actuales
                </Label>
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, hasSocials: !prev.hasSocials, socials: prev.hasSocials ? [] : prev.socials }))}
                  className="flex items-center gap-2 text-xs font-semibold text-muted-foreground hover:text-foreground bg-secondary/40 hover:bg-secondary/60 px-4 py-2 rounded-full transition-colors"
                >
                  <div className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors ${!formData.hasSocials ? 'bg-primary border-primary' : 'border-muted-foreground/40'}`}>
                    {!formData.hasSocials && <span className="text-primary-foreground text-[10px] font-black">✓</span>}
                  </div>
                  Aún no tengo redes
                </button>
              </div>

              {formData.hasSocials && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-4 overflow-hidden"
                >
                  {/* Add social row */}
                  <div className="flex gap-3">
                    <Select value={newSocial.platform} onValueChange={(val) => setNewSocial(prev => ({ ...prev, platform: val }))}>
                      <SelectTrigger className="w-[160px] h-12 bg-secondary/30 border border-transparent rounded-2xl focus:ring-2 focus:ring-primary/50 shrink-0">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {SOCIAL_PLATFORMS.map(p => {
                          const Icon = SOCIAL_MEDIA_ICONS[p.id] || Globe;
                          return (
                            <SelectItem key={p.id} value={p.id}>
                              <div className="flex items-center gap-2.5">
                                <Icon className="w-4 h-4 text-primary" />
                                <span>{p.name}</span>
                              </div>
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                    <div className="relative flex-1">
                      <Input
                        placeholder="@usuario o link..."
                        value={newSocial.handle}
                        onChange={(e) => setNewSocial(prev => ({ ...prev, handle: e.target.value }))}
                        className="h-12 bg-secondary/30 border border-transparent rounded-2xl px-5 pr-14 focus-visible:ring-2 focus-visible:ring-primary/50"
                        onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addSocial())}
                      />
                      <Button
                        type="button" size="icon" variant="ghost"
                        className="absolute right-2 top-1.5 h-9 w-9 rounded-xl hover:bg-primary/20 text-primary"
                        onClick={addSocial}
                      >
                        <Plus className="w-5 h-5" />
                      </Button>
                    </div>
                  </div>

                  {/* Social chips */}
                  {formData.socials.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {formData.socials.map((s, i) => {
                        const platform = SOCIAL_PLATFORMS.find(p => p.id === s.platform);
                        const Icon = SOCIAL_MEDIA_ICONS[s.platform] || Globe;
                        return (
                          <motion.div
                            key={i}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="flex items-center justify-between p-3.5 rounded-2xl bg-card border border-primary/10 shadow-sm group"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-full bg-primary/8 flex items-center justify-center text-primary">
                                <Icon className="w-4 h-4" />
                              </div>
                              <div className="flex flex-col">
                                <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-tight">{platform?.name}</span>
                                <span className="text-sm font-semibold truncate max-w-[130px]">{s.handle}</span>
                              </div>
                            </div>
                            <Button
                              variant="ghost" size="icon"
                              className="h-8 w-8 rounded-full opacity-0 group-hover:opacity-100 hover:bg-destructive/10 hover:text-destructive transition-all"
                              onClick={() => removeSocial(i)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </motion.div>
                        );
                      })}
                    </div>
                  )}
                </motion.div>
              )}
            </motion.div>
          </div>
          <div className="h-6" />
        </ScrollFadeWrapper>
      </Card>
    </motion.div>
  );
}
