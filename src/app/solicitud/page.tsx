'use client';

import React, { useState, useMemo } from 'react';
import {
  Building,
  Target,
  Phone,
  ArrowRight,
  ArrowLeft,
  CheckCircle,
  Loader2,
  Mail,
  MessageSquare,
  Sparkles,
  Users as UsersIcon,
  ChevronRight,
  ChevronLeft
} from 'lucide-react';
import { useFirestore, useDoc } from '@/firebase';
import { doc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PhoneInput } from '@/components/ui/phone-input';
import { formatPhoneNumberIntl, type Country } from 'react-phone-number-input';
import { Badge } from '@/components/ui/badge';
import { X, Plus, Instagram, Facebook, Music2, Linkedin, Twitter, Youtube, Link as LinkIcon, Globe } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

import { initializeFirebase } from '@/firebase/init';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { Logo } from '@/components/ui/logo';

const steps = [
  { id: 1, title: 'Tu Perfil', icon: UsersIcon, description: 'Información de contacto' },
  { id: 2, title: 'Tu Negocio', icon: Building, description: 'Sobre tu marca' },
  { id: 3, title: 'Tus Objetivos', icon: Target, description: 'Metas y motivaciones' },
  { id: 4, title: 'Finalización', icon: CheckCircle, description: 'Detalles finales' }
];

// Dynamic configuration will be fetched from Firestore
// These are fallbacks in case of loading or error
const INDUSTRIES_FALLBACK = [
  "Bienes Raíces", "Marcas Personales", "E-commerce", "Salud y Bienestar", "Gastronomía",
  "Tecnología / SaaS", "Educación", "Servicios Profesionales", "Construcción / Arquitectura", "Otro"
];

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

const CONTACT_SOURCES_FALLBACK = [
  "Instagram", "TikTok", "Facebook", "LinkedIn", "Referido por un amigo",
  "Google / Búsqueda", "Publicidad Pagada", "Otro"
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

export default function SolicitudPage() {
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    companyName: '',
    industry: '',
    hasSocials: true,
    socials: [] as { platform: string, handle: string }[],
    aboutBusiness: '',
    expectations: [] as string[],
    mainGoals: [] as string[],
    motivation: '',
    contactSource: '',
    contactPreference: 'whatsapp'
  });

  const firestore = useFirestore();
  const configRef = useMemo(() =>
    firestore ? doc(firestore, 'settings', 'briefing') : null,
    [firestore]);

  const { data: config, isLoading: isLoadingConfig } = useDoc<any>(configRef);

  const [emailError, setEmailError] = useState('');
  const [newSocial, setNewSocial] = useState({ platform: 'instagram', handle: '' });
  const [showPhoneWarning, setShowPhoneWarning] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState<Country | undefined>('CR');

  const validateEmail = (email: string) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const addSocial = () => {
    if (!newSocial.handle.trim()) return;
    setFormData(prev => ({
      ...prev,
      socials: [...prev.socials, { ...newSocial }]
    }));
    setNewSocial({ platform: 'instagram', handle: '' });
  };

  const removeSocial = (index: number) => {
    setFormData(prev => ({
      ...prev,
      socials: prev.socials.filter((_, i) => i !== index)
    }));
  };

  const handleToggleSelection = (field: 'expectations' | 'mainGoals', value: string) => {
    setFormData(prev => {
      const current = prev[field];
      if (current.includes(value)) {
        return { ...prev, [field]: current.filter(id => id !== value) };
      }
      if (current.length < 3) {
        return { ...prev, [field]: [...current, value] };
      }
      toast({
        title: "Límite alcanzado",
        description: "Puedes seleccionar un máximo de 3 opciones.",
        variant: "destructive"
      });
      return prev;
    });
  };

  const nextStep = () => setCurrentStep(prev => Math.min(prev + 1, 4));
  const prevStep = () => setCurrentStep(prev => Math.max(prev - 1, 1));

  const validateStep = () => {
    if (currentStep === 1) {
      return (
        formData.firstName.trim() !== '' &&
        formData.lastName.trim() !== '' &&
        (formData.email.trim() === '' || validateEmail(formData.email)) &&
        formData.phone.trim() !== ''
      );
    }
    if (currentStep === 2) {
      return formData.aboutBusiness.trim() !== '' && formData.industry !== '';
    }
    if (currentStep === 3) {
      return (
        formData.expectations.length > 0 &&
        formData.mainGoals.length > 0 &&
        formData.motivation !== ''
      );
    }
    if (currentStep === 4) {
      return formData.contactSource !== '' && formData.contactPreference !== '';
    }
    return false;
  };

  const handleSubmit = async () => {
    if (!validateStep()) return;

    setIsSubmitting(true);
    try {
      const { firestore } = initializeFirebase();
      const requestsRef = collection(firestore, 'requests');

      await addDoc(requestsRef, {
        ...formData,
        status: 'pending',
        createdAt: serverTimestamp()
      });

      setIsSuccess(true);
    } catch (error) {
      console.error('Error submitting form:', error);
      toast({
        title: "Error al enviar",
        description: "Hubo un problema procesando tu solicitud. Por favor intenta de nuevo.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-primary/5 blur-[100px] rounded-full scale-150" />
        <Card className="w-full max-w-md border-primary/20 bg-card/80 backdrop-blur-xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-500">
          <CardContent className="pt-12 pb-10 px-8 flex flex-col items-center text-center">
            <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-6 border border-primary/20 animate-bounce">
              <CheckCircle className="w-10 h-10 text-primary" />
            </div>
            <h2 className="text-3xl font-bold font-headline mb-3 text-card-foreground">¡Todo listo!</h2>
            <p className="text-muted-foreground mb-8 text-sm leading-relaxed">
              Hemos recibido los detalles de tu negocio. El equipo de <span className="text-primary font-semibold">Kairos Visuals</span> revisará tu briefing y te contactará en las próximas 24 horas.
            </p>
            <Button className="w-full h-12 text-base font-semibold" onClick={() => window.location.href = '/'}>
              Volver al Inicio
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col lg:flex-row relative selection:bg-primary/20 lg:h-screen lg:overflow-x-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-primary/5 to-transparent pointer-events-none" />
      <div className="absolute -top-[20%] -right-[10%] w-[60%] h-[60%] rounded-full bg-primary/10 blur-[150px] pointer-events-none" />
      <div className="absolute -bottom-[20%] -left-[10%] w-[40%] h-[40%] rounded-full bg-accent/5 blur-[120px] pointer-events-none" />

      {/* Sidebar - Visual Branding */}
      <div className="w-full lg:w-[350px] xl:w-[400px] bg-card border-b lg:border-b-0 lg:border-r border-border/50 p-6 lg:p-12 flex flex-col relative z-20 shrink-0">
        <div className="flex items-center gap-3 mb-6 lg:mb-16 group cursor-pointer" onClick={() => window.location.href = '/'}>
          <div className="w-12 h-12 lg:w-14 lg:h-14 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
            <Logo className="w-full h-full text-primary" />
          </div>
          <span className="text-2xl lg:text-3xl font-headline font-bold tracking-tight">Kairos Visuals</span>
        </div>

        <div className="mb-4 lg:mb-16">
          <Badge variant="outline" className="mb-3 lg:mb-4 border-primary/30 text-primary bg-primary/5 px-3 py-1">Briefing de Marca</Badge>
          <h1 className="text-2xl lg:text-4xl font-headline font-bold mb-2 lg:mb-4 bg-clip-text text-transparent bg-gradient-to-br from-foreground to-foreground/50 leading-tight">
            Diseñemos tu futuro visual.
          </h1>
          <p className="text-muted-foreground text-xs lg:text-sm leading-relaxed hidden sm:block">
            Esta es la base de nuestra colaboración. Cuanto más sepamos, mejor podremos potenciar tu marca.
          </p>
        </div>

        <div className="hidden lg:flex flex-col gap-8 mt-auto">
          {steps.map((step) => (
            <div
              key={step.id}
              className={cn(
                "flex items-start gap-4 transition-all duration-500",
                currentStep === step.id ? 'opacity-100 translate-x-2' : 'opacity-30'
              )}
            >
              <div className={cn(
                "w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border-2 transition-all duration-500 shadow-md",
                currentStep === step.id
                  ? 'bg-primary text-primary-foreground border-primary shadow-primary/20 rotate-3'
                  : currentStep > step.id
                    ? 'bg-primary/20 text-primary border-primary/20'
                    : 'bg-secondary text-muted-foreground border-border'
              )}>
                {currentStep > step.id ? <CheckCircle className="w-6 h-6" /> : <step.icon className="w-6 h-6" />}
              </div>
              <div className="pt-1">
                <p className={cn(
                  "font-bold text-sm tracking-wide",
                  currentStep === step.id ? 'text-foreground' : 'text-foreground/70'
                )}>
                  {step.title}
                </p>
                <p className="text-xs text-muted-foreground mt-1">{step.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex-1 flex flex-col relative z-10 lg:h-full lg:overflow-y-auto overflow-x-hidden">
        <div className="flex-1 p-4 sm:p-6 lg:p-12 pb-28 md:pb-32 lg:pb-12 flex flex-col lg:min-h-min bg-muted/5">
          <div className="max-w-3xl mx-auto w-full flex-1 flex flex-col lg:pb-6 lg:overflow-hidden">

            {/* Top Progress bar removed */}

            <div className="space-y-6 lg:space-y-10 min-h-[500px] flex-1">
              {/* STEP 1: PERFIL */}
              {currentStep === 1 && (
                <Card className="animate-in fade-in zoom-in-95 duration-500 ease-out border-primary/10 shadow-xl lg:shadow-2xl lg:max-h-[calc(100vh-180px)] flex flex-col my-auto">
                  <CardContent className="p-5 sm:p-8 md:p-12 space-y-8 overflow-y-auto custom-scrollbar flex-1 lg:pr-6">
                    <div className="space-y-4">
                      <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20 mb-6">
                        <UsersIcon className="h-6 w-6" />
                      </div>
                      <h2 className="text-3xl md:text-4xl font-headline font-bold tracking-tight">Cuéntanos sobre ti.</h2>
                      <p className="text-muted-foreground text-lg max-w-xl">
                        Queremos saber con quién estamos hablando. Estos datos nos servirán para el seguimiento inicial.
                      </p>
                    </div>

                    <div className="grid gap-8">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-3">
                          <Label htmlFor="firstName" className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Nombre <span className="text-primary">*</span></Label>
                          <Input
                            id="firstName" name="firstName" value={formData.firstName} onChange={handleChange}
                            placeholder="Ej. Juan" className="bg-secondary/30 h-14 border-none text-lg focus-visible:ring-primary/40 px-6 rounded-2xl transition-all"
                          />
                        </div>
                        <div className="space-y-3">
                          <Label htmlFor="lastName" className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Apellido <span className="text-primary">*</span></Label>
                          <Input
                            id="lastName" name="lastName" value={formData.lastName} onChange={handleChange}
                            placeholder="Ej. Pérez" className="bg-secondary/30 h-14 border-none text-lg focus-visible:ring-primary/40 px-6 rounded-2xl transition-all"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-3">
                          <Label htmlFor="phone" className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Teléfono / WhatsApp <span className="text-primary">*</span></Label>
                          <div 
                            className="relative"
                            onClick={() => {
                              if (!selectedCountry) setShowPhoneWarning(true);
                            }}
                          >
                            <PhoneInput
                              value={formData.phone as any} 
                              defaultCountry="CR"
                              country={selectedCountry}
                              onCountryChange={(country) => {
                                setSelectedCountry(country);
                                if (country) setShowPhoneWarning(false);
                              }}
                              onChange={(val) => {
                                handleSelectChange('phone', val);
                              }}
                              placeholder="8888 8888" className="h-14 font-medium"
                            />
                            {showPhoneWarning && !selectedCountry && (
                              <p className="text-[10px] md:text-xs text-orange-500 font-bold mt-2 animate-pulse flex items-center gap-1">
                                <Sparkles className="w-3 h-3" />
                                🚩 Selecciona primero tu país para habilitar la escritura.
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="space-y-3">
                          <Label htmlFor="email" className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Correo <span className="text-muted-foreground font-normal">(Opcional)</span></Label>
                          <Input
                            id="email" name="email" type="email" value={formData.email}
                            onChange={(e) => { handleChange(e); setEmailError(e.target.value && !validateEmail(e.target.value) ? 'Correo inválido' : ''); }}
                            placeholder="tu@correo.com" className={cn("bg-secondary/30 h-14 border-none text-lg focus-visible:ring-primary/40 px-6 rounded-2xl transition-all", emailError && "ring-2 ring-destructive ring-offset-2 ring-offset-background")}
                          />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* STEP 2: TU NEGOCIO */}
              {currentStep === 2 && (
                <Card className="animate-in fade-in zoom-in-95 duration-500 ease-out border-primary/10 shadow-xl lg:shadow-2xl lg:max-h-[calc(100vh-180px)] flex flex-col my-auto">
                  <CardContent className="p-5 sm:p-8 md:p-12 space-y-8 overflow-y-auto custom-scrollbar flex-1 lg:pr-6">
                    <div className="space-y-4">
                      <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20 mb-6">
                        <Building className="h-6 w-6" />
                      </div>
                      <h2 className="text-3xl md:text-4xl font-headline font-bold tracking-tight">Tu Negocio y Marca.</h2>
                      <p className="text-muted-foreground text-lg max-w-xl">
                        Háblanos de lo que haces. No escatimes en detalles, nos encanta conocer nuevas historias.
                      </p>
                    </div>

                    <div className="grid gap-10">
                      <div className="space-y-4">
                        <Label htmlFor="aboutBusiness" className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Cuéntanos sobre tu negocio <span className="text-primary">*</span></Label>
                        <Textarea
                          id="aboutBusiness" name="aboutBusiness" value={formData.aboutBusiness} onChange={handleChange}
                          placeholder="Dinos qué haces, a qué te dedicas, quién es tu cliente ideal y qué te hace único..."
                          className="min-h-[150px] bg-secondary/30 border-none text-lg focus-visible:ring-primary/40 p-6 rounded-2xl resize-none transition-all"
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-4">
                          <Label htmlFor="companyName" className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Nombre Comercial</Label>
                          <Input
                            id="companyName" name="companyName" value={formData.companyName} onChange={handleChange}
                            placeholder="Ej. Mi Marca S.A." className="bg-secondary/30 h-14 border-none text-lg focus-visible:ring-primary/40 px-6 rounded-2xl"
                          />
                        </div>
                        <div className="space-y-4">
                          <Label htmlFor="industry" className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Industria / Nicho <span className="text-primary">*</span></Label>
                          <Select value={formData.industry} onValueChange={(val) => handleSelectChange('industry', val)}>
                            <SelectTrigger className="bg-secondary/30 h-14 border-none text-lg focus-visible:ring-primary/40 px-6 rounded-2xl">
                              <SelectValue placeholder="Selecciona uno..." />
                            </SelectTrigger>
                            <SelectContent className="max-h-[200px]">
                              {(config?.industries || INDUSTRIES_FALLBACK).map((ind: string) => (
                                <SelectItem key={ind} value={ind}>{ind}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="space-y-6">
                        <div className="flex items-center justify-between">
                          <Label className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Redes Sociales Actuales</Label>
                          <div className="flex items-center space-x-3 bg-secondary/30 px-4 py-2 rounded-full cursor-pointer hover:bg-secondary/50 transition-colors"
                            onClick={() => setFormData(prev => ({ ...prev, hasSocials: !prev.hasSocials, socials: prev.hasSocials ? [] : prev.socials }))}>
                            <input type="checkbox" checked={!formData.hasSocials} readOnly className="w-4 h-4 rounded border-primary bg-background" />
                            <Label className="text-xs font-bold cursor-pointer">Aún no tengo redes</Label>
                          </div>
                        </div>

                        {formData.hasSocials && (
                          <div className="space-y-4 animate-in fade-in slide-in-from-top-4 duration-500">
                            <div className="flex gap-3">
                              <Select value={newSocial.platform} onValueChange={(val) => setNewSocial(prev => ({ ...prev, platform: val }))}>
                                <SelectTrigger className="w-[180px] h-14 bg-secondary/30 border-none rounded-2xl">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {SOCIAL_PLATFORMS.map(p => {
                                    const Icon = SOCIAL_MEDIA_ICONS[p.id] || Globe;
                                    return (
                                      <SelectItem key={p.id} value={p.id}>
                                        <div className="flex items-center gap-3">
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
                                  placeholder="Usuario o link..." value={newSocial.handle}
                                  onChange={(e) => setNewSocial(prev => ({ ...prev, handle: e.target.value }))}
                                  className="h-14 bg-secondary/30 border-none rounded-2xl px-6 pr-14"
                                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addSocial())}
                                />
                                <Button
                                  type="button" size="icon" variant="ghost"
                                  className="absolute right-2 top-2 h-10 w-10 rounded-xl hover:bg-primary/20 text-primary"
                                  onClick={addSocial}
                                >
                                  <Plus className="w-5 h-5 font-bold" />
                                </Button>
                              </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              {formData.socials.map((s, i) => {
                                const platform = SOCIAL_PLATFORMS.find(p => p.id === s.platform);
                                const Icon = SOCIAL_MEDIA_ICONS[s.platform] || Globe;
                                return (
                                  <div key={i} className="flex items-center justify-between p-4 rounded-2xl bg-card border border-primary/5 shadow-sm group animate-in zoom-in-95 duration-300">
                                    <div className="flex items-center gap-3">
                                      <div className="w-10 h-10 rounded-full bg-primary/5 flex items-center justify-center text-primary group-hover:scale-110 transition-all">
                                        <Icon className="w-5 h-5" />
                                      </div>
                                      <div className="flex flex-col">
                                        <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-tighter">{platform?.name}</span>
                                        <span className="text-sm font-semibold truncate max-w-[120px]">{s.handle}</span>
                                      </div>
                                    </div>
                                    <Button
                                      variant="ghost" size="icon" className="h-8 w-8 rounded-full opacity-0 group-hover:opacity-100 hover:bg-destructive/10 hover:text-destructive transition-opacity"
                                      onClick={() => removeSocial(i)}
                                    >
                                      <X className="h-4 w-4" />
                                    </Button>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* STEP 3: OBJETIVOS */}
              {currentStep === 3 && (
                <Card className="animate-in fade-in zoom-in-95 duration-500 ease-out border-primary/10 shadow-xl lg:shadow-2xl lg:max-h-[calc(100vh-180px)] flex flex-col my-auto">
                  <CardContent className="p-5 sm:p-8 md:p-12 space-y-10 overflow-y-auto custom-scrollbar flex-1 lg:pr-6">
                    <div className="space-y-4">
                      <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20 mb-6">
                        <Target className="h-6 w-6" />
                      </div>
                      <h2 className="text-3xl md:text-4xl font-headline font-bold tracking-tight">Tus Metas Visuales.</h2>
                      <p className="text-muted-foreground text-lg max-w-xl">
                        Define qué quieres lograr. Selecciona hasta 3 opciones en cada categoría.
                      </p>
                    </div>

                    <div className="space-y-12">
                      {/* Expectativas */}
                      <div className="space-y-6">
                        <div className="flex items-center justify-between">
                          <Label className="text-sm font-bold uppercase tracking-widest text-muted-foreground">¿Qué esperas lograr con Kairos? (Max 3)</Label>
                          <Badge variant="secondary" className="bg-primary/5 text-primary border-primary/20">{formData.expectations.length} / 3</Badge>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {(config?.expectations || EXPECTATIONS_FALLBACK).map((opt: string) => {
                            const isSelected = formData.expectations.includes(opt);
                            return (
                              <div
                                key={opt}
                                onClick={() => handleToggleSelection('expectations', opt)}
                                className={cn(
                                  "p-6 rounded-2xl border-2 cursor-pointer transition-all duration-300 flex items-center justify-between group",
                                  isSelected
                                    ? "border-primary bg-primary/5 shadow-md scale-[1.02]"
                                    : "border-secondary/50 bg-secondary/20 hover:border-primary/30 hover:bg-secondary/40"
                                )}
                              >
                                <span className={cn("text-sm font-medium", isSelected ? "text-primary" : "text-foreground/80")}>{opt}</span>
                                <div className={cn(
                                  "w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all",
                                  isSelected ? "bg-primary border-primary" : "border-muted-foreground/30 group-hover:border-primary/50"
                                )}>
                                  {isSelected && <CheckCircle className="w-4 h-4 text-primary-foreground" />}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Objetivos */}
                      <div className="space-y-6">
                        <div className="flex items-center justify-between">
                          <Label className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Objetivos de Crecimiento (Max 3)</Label>
                          <Badge variant="secondary" className="bg-primary/5 text-primary border-primary/20">{formData.mainGoals.length} / 3</Badge>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {(config?.mainGoals || MAIN_GOALS_FALLBACK).map((opt: string) => {
                            const isSelected = formData.mainGoals.includes(opt);
                            return (
                              <div
                                key={opt}
                                onClick={() => handleToggleSelection('mainGoals', opt)}
                                className={cn(
                                  "p-6 rounded-2xl border-2 cursor-pointer transition-all duration-300 flex items-center justify-between group",
                                  isSelected
                                    ? "border-primary bg-primary/5 shadow-md scale-[1.02]"
                                    : "border-secondary/50 bg-secondary/20 hover:border-primary/30 hover:bg-secondary/40"
                                )}
                              >
                                <span className={cn("text-sm font-medium", isSelected ? "text-primary" : "text-foreground/80")}>{opt}</span>
                                <div className={cn(
                                  "w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all",
                                  isSelected ? "bg-primary border-primary" : "border-muted-foreground/30 group-hover:border-primary/50"
                                )}>
                                  {isSelected && <CheckCircle className="w-4 h-4 text-primary-foreground" />}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Motivación */}
                      <div className="space-y-6">
                        <Label className="text-sm font-bold uppercase tracking-widest text-muted-foreground">¿Qué te motivó a contactarnos hoy?</Label>
                        <RadioGroup value={formData.motivation} onValueChange={(val) => handleSelectChange('motivation', val)} className="grid grid-cols-1 gap-4">
                          {(config?.motivations || MOTIVATIONS_FALLBACK).map((opt: string) => (
                            <Label key={opt} className={cn(
                              "flex items-center gap-4 p-5 rounded-2xl border-2 cursor-pointer transition-all duration-300 hover:bg-secondary/30",
                              formData.motivation === opt ? "border-primary bg-primary/5" : "border-secondary/50 bg-secondary/10"
                            )}>
                              <RadioGroupItem value={opt} className="w-5 h-5 shadow-none border-primary text-primary" />
                              <span className="font-medium text-sm">{opt}</span>
                            </Label>
                          ))}
                        </RadioGroup>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* STEP 4: FINALIZACION */}
              {currentStep === 4 && (
                <Card className="animate-in fade-in zoom-in-95 duration-500 ease-out border-primary/10 shadow-xl lg:shadow-2xl lg:max-h-[calc(100vh-180px)] flex flex-col my-auto">
                  <CardContent className="p-5 sm:p-8 md:p-12 space-y-10 overflow-y-auto custom-scrollbar flex-1 lg:pr-6">
                    <div className="space-y-4">
                      <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20 mb-6">
                        <Sparkles className="h-6 w-6" />
                      </div>
                      <h2 className="text-3xl md:text-4xl font-headline font-bold tracking-tight">Casi Listos.</h2>
                      <p className="text-muted-foreground text-lg max-w-xl">
                        Para finalizar, haznos saber cómo nos encontraste y cómo prefieres que sigamos la conversación.
                      </p>
                    </div>

                    <div className="space-y-12">
                      {/* Fuente de Contacto */}
                      <div className="space-y-6">
                        <Label className="text-sm font-bold uppercase tracking-widest text-muted-foreground">¿Cómo te enteraste de nosotros?</Label>
                        <RadioGroup value={formData.contactSource} onValueChange={(val) => handleSelectChange('contactSource', val)} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                          {(config?.contactSources || CONTACT_SOURCES_FALLBACK).map((opt: string) => (
                            <Label key={opt} className={cn(
                              "flex flex-col items-center justify-center gap-2 p-6 rounded-2xl border-2 cursor-pointer transition-all duration-300 text-center min-h-[100px]",
                              formData.contactSource === opt ? "border-primary bg-primary/5 text-primary scale-105 shadow-md shadow-primary/10" : "border-secondary/50 bg-secondary/10 hover:border-primary/20"
                            )}>
                              <RadioGroupItem value={opt} className="sr-only" />
                              <span className="font-bold text-xs uppercase tracking-tight">{opt}</span>
                            </Label>
                          ))}
                        </RadioGroup>
                      </div>

                      {/* Preferencia de Contacto */}
                      <div className="space-y-6">
                        <Label className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Método de contacto favorito</Label>
                        <RadioGroup value={formData.contactPreference} onValueChange={(val) => handleSelectChange('contactPreference', val)} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                          {[
                            { id: 'whatsapp', icon: MessageSquare, label: 'WhatsApp' },
                            { id: 'email', icon: Mail, label: 'E-mail' },
                            { id: 'phone', icon: Phone, label: 'Llamada' }
                          ].map((item) => (
                            <Label key={item.id} className={cn(
                              "flex flex-col items-center gap-3 p-8 rounded-2xl border-2 cursor-pointer transition-all duration-300",
                              formData.contactPreference === item.id ? "border-primary bg-primary/5 text-primary shadow-lg shadow-primary/15" : "border-secondary/50 bg-secondary/10 hover:border-primary/30"
                            )}>
                              <RadioGroupItem value={item.id} className="sr-only" />
                              <item.icon className="w-10 h-10 mb-2" />
                              <span className="font-bold text-sm">{item.label}</span>
                            </Label>
                          ))}
                        </RadioGroup>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>

        {/* Persistent Navigation Footer */}
        <div className="p-4 sm:p-6 lg:p-8 border-t border-border bg-background fixed lg:relative bottom-0 left-0 right-0 w-full z-50 lg:z-30 shadow-[0_-15px_30px_rgba(0,0,0,0.15)] lg:shadow-none">
          <div className="max-w-3xl mx-auto flex items-center justify-between">
            <Button
              variant="outline" size="lg" onClick={prevStep}
              disabled={currentStep === 1 || isSubmitting}
              className={cn(
                "h-12 w-12 px-0 md:w-auto md:px-8 rounded-full md:rounded-2xl shrink-0 font-bold border-2 transition-all hover:bg-secondary",
                currentStep === 1 ? 'invisible md:visible md:opacity-0' : ''
              )}
            >
              <ChevronLeft className="w-5 h-5 md:mr-2" />
              <span className="hidden md:inline">Atrás</span>
            </Button>

            <div className="flex-1 text-center hidden sm:block">
              <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground/50">Paso {currentStep} de 4</span>
            </div>

            {currentStep < 4 ? (
              <Button size="lg" onClick={nextStep} disabled={!validateStep()} className="h-12 w-full max-w-[180px] md:h-14 md:px-10 md:w-auto rounded-full md:rounded-2xl font-bold shadow-xl shadow-primary/20 group">
                <span className="hidden md:inline">Continuar</span>
                <span className="md:hidden">Continuar</span>
                <ChevronRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
            ) : (
              <Button size="lg" onClick={handleSubmit} disabled={!validateStep() || isSubmitting} className="h-12 w-full max-w-[200px] md:h-14 md:px-10 md:w-auto rounded-full md:rounded-2xl font-bold shadow-xl shadow-primary/30 md:min-w-[200px]">
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  <>
                    Enviar Solicitud
                    <Sparkles className="w-5 h-5 ml-2 animate-pulse" />
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

