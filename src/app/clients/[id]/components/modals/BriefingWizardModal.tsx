import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { PhoneInput } from "@/components/ui/phone-input";
import { 
  Building, Target, MessageSquare, Trash2, Plus, 
  Check, MessageCircle, Mail, Sparkles, ArrowLeft, 
  ChevronRight, Save, Loader2 
} from "lucide-react";

interface BriefingWizardModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  briefingStep: number;
  setBriefingStep: React.Dispatch<React.SetStateAction<number>>;
  briefingData: any;
  setBriefingData: React.Dispatch<React.SetStateAction<any>>;
  industries: string[];
  PLATFORMS: string[];
  motivations: string[];
  mainGoals: string[];
  handleToggleBriefingSelection: (field: "expectations" | "mainGoals", item: string) => void;
  expectations: string[];
  contactSources: string[];
  handleSaveBriefing: () => void;
  isProcessing: boolean;
}

export function BriefingWizardModal({
  isOpen,
  onOpenChange,
  briefingStep,
  setBriefingStep,
  briefingData,
  setBriefingData,
  industries,
  PLATFORMS,
  motivations,
  mainGoals,
  handleToggleBriefingSelection,
  expectations,
  contactSources,
  handleSaveBriefing,
  isProcessing
}: BriefingWizardModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl bg-card border-none shadow-2xl p-0 overflow-hidden rounded-[2rem] animate-in fade-in slide-in-from-bottom-4 duration-300">
        {/* Header Section */}
        <div className="bg-gradient-to-br from-amber-600/20 via-amber-600/5 to-transparent p-6 text-foreground relative border-b border-border/50">
          <div className="relative z-10 flex items-center justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-3 mb-1">
                <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/20 px-3 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest">Paso {briefingStep} de 3</Badge>
                <div className="h-1 w-1 rounded-full bg-amber-500" />
                <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/60 font-headline">Briefing Estratégico</span>
              </div>
              <DialogTitle className="text-2xl font-black font-headline tracking-tighter">
                {briefingStep === 1 && "Negocio y Marca"}
                {briefingStep === 2 && "Valor Estratégico"}
                {briefingStep === 3 && "Cierre y Contacto"}
              </DialogTitle>
            </div>
            <div className="h-12 w-12 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-600 border border-amber-500/20 shadow-sm">
              {briefingStep === 1 && <Building className="w-5 h-5 text-amber-600" />}
              {briefingStep === 2 && <Target className="w-5 h-5 text-amber-600" />}
              {briefingStep === 3 && <MessageSquare className="w-5 h-5 text-amber-600" />}
            </div>
          </div>

          {/* Progress Bar */}
          <div className="absolute bottom-0 left-0 w-full h-1 bg-muted">
            <div
              className="h-full bg-amber-500 transition-all duration-500 ease-out shadow-[0_0_8px_rgba(245,158,11,0.4)]"
              style={{ width: `${(briefingStep / 3) * 100}%` }}
            />
          </div>
        </div>

        <div className="p-6">
          <div className="min-h-[380px] max-h-[60vh] overflow-y-auto px-1 custom-scrollbar">
            {briefingStep === 1 && (
              <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-[10px] uppercase font-black tracking-widest text-muted-foreground ml-1">Industria / Nicho</Label>
                    <Select value={briefingData.industry} onValueChange={(val) => setBriefingData((prev: any) => ({ ...prev, industry: val }))}>
                      <SelectTrigger className="h-10 bg-muted/30 border-none rounded-xl focus:ring-amber-500/20 font-medium text-xs">
                        <SelectValue placeholder="Seleccionar..." />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl border-border max-h-[200px]">
                        {industries.map((ind: string) => (
                          <SelectItem key={ind} value={ind} className="rounded-lg text-xs">{ind}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] uppercase font-black tracking-widest text-muted-foreground ml-1">Redes Sociales</Label>
                    <div className="flex items-center justify-between bg-muted/30 px-3 h-10 rounded-xl">
                      <span className="text-xs font-bold text-muted-foreground">¿Tiene redes sociales?</span>
                      <div
                        className={`w-9 h-5 rounded-full relative cursor-pointer transition-colors ${briefingData.hasSocials ? 'bg-amber-500' : 'bg-muted-foreground/30'}`}
                        onClick={() => setBriefingData((prev: any) => ({ ...prev, hasSocials: !prev.hasSocials, socials: !prev.hasSocials ? (prev.socials.length > 0 ? prev.socials : [{ platform: 'Instagram', handle: '' }]) : [] }))}
                      >
                        <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${briefingData.hasSocials ? 'left-5' : 'left-1'}`} />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-[10px] uppercase font-black tracking-widest text-muted-foreground ml-1">Descripción del Negocio</Label>
                  <Textarea
                    placeholder="Cuéntanos sobre tu negocio y marca..."
                    className="min-h-[80px] max-h-[120px] rounded-xl bg-muted/30 border-none focus:ring-amber-500/20 text-xs p-4 leading-relaxed custom-scrollbar font-medium"
                    value={briefingData.aboutBusiness}
                    onChange={(e) => setBriefingData((prev: any) => ({ ...prev, aboutBusiness: e.target.value }))}
                  />
                </div>

                {briefingData.hasSocials && (
                  <div className="space-y-3 pt-2">
                    <Label className="text-[10px] uppercase font-black tracking-widest text-muted-foreground ml-1">Cuentas Registradas</Label>
                    <div className="grid grid-cols-1 gap-2">
                      {briefingData.socials.map((social: any, idx: number) => (
                        <div key={idx} className="flex gap-2 items-center bg-muted/20 p-1.5 rounded-xl border border-border/10 animate-in zoom-in-95 duration-200">
                          <Select value={social.platform} onValueChange={(val) => {
                            const newSocials = [...briefingData.socials];
                            newSocials[idx].platform = val;
                            setBriefingData((prev: any) => ({ ...prev, socials: newSocials }));
                          }}>
                            <SelectTrigger className="w-[100px] h-8 bg-background border-none text-[9px] font-black rounded-lg uppercase tracking-wider">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="rounded-xl border-border">
                              {PLATFORMS.map(p => <SelectItem key={p} value={p} className="text-[10px] uppercase font-bold tracking-tight">{p}</SelectItem>)}
                            </SelectContent>
                          </Select>
                          <Input
                            className="h-8 bg-background border-none text-xs flex-1 rounded-lg font-bold"
                            placeholder="@usuario"
                            value={social.handle}
                            onChange={(e) => {
                              const newSocials = [...briefingData.socials];
                              newSocials[idx].handle = e.target.value;
                              setBriefingData((prev: any) => ({ ...prev, socials: newSocials }));
                            }}
                          />
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/10 rounded-lg shrink-0 transition-colors" onClick={() => {
                            setBriefingData((prev: any) => ({ ...prev, socials: prev.socials.filter((_: any, i: number) => i !== idx) }));
                          }}>
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      ))}
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full h-9 border-dashed border-amber-500/30 bg-amber-500/5 hover:bg-amber-500/10 text-amber-600 text-[9px] font-black uppercase tracking-widest gap-2 rounded-xl transition-all"
                        onClick={() => setBriefingData((prev: any) => ({ ...prev, socials: [...prev.socials, { platform: 'Instagram', handle: '' }] }))}
                      >
                        <Plus className="w-3 h-3" /> Agregar Red Social
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {briefingStep === 2 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="space-y-3">
                  <Label className="text-[10px] uppercase font-black tracking-widest text-muted-foreground ml-1">¿Qué te motivó a contactarnos?</Label>
                  <div className="grid grid-cols-1 gap-2">
                    {motivations.map((mot: string) => (
                      <div
                        key={mot}
                        className={`group flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer ${briefingData.motivation === mot ? 'bg-amber-500/10 border-amber-500/30' : 'bg-muted/20 border-transparent hover:bg-muted/40'}`}
                        onClick={() => setBriefingData((prev: any) => ({ ...prev, motivation: mot }))}
                      >
                        <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${briefingData.motivation === mot ? 'border-amber-500 bg-amber-500' : 'border-muted-foreground/30 group-hover:border-amber-500/50'}`}>
                          {briefingData.motivation === mot && <Check className="w-2.5 h-2.5 text-white" />}
                        </div>
                        <span className={`text-[10px] font-black leading-tight uppercase tracking-tight ${briefingData.motivation === mot ? 'text-amber-700' : 'text-foreground/50'}`}>{mot}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between px-1">
                    <Label className="text-[10px] uppercase font-black tracking-widest text-muted-foreground ml-1">Objetivos de Crecimiento (Hasta 3)</Label>
                    <Badge variant="outline" className="text-[9px] h-5 border-amber-500/30 text-amber-600 bg-amber-500/5 px-2">{briefingData.mainGoals.length}/3</Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {mainGoals.map((goal: string) => {
                      const isSelected = briefingData.mainGoals.includes(goal);
                      return (
                        <div
                          key={goal}
                          className={`flex items-center gap-2.5 p-2.5 rounded-xl border transition-all cursor-pointer ${isSelected ? 'bg-amber-500/10 border-amber-500/30 shadow-sm' : 'bg-muted/10 border-transparent hover:bg-muted/20'}`}
                          onClick={() => handleToggleBriefingSelection('mainGoals', goal)}
                        >
                          <div className={`w-3.5 h-3.5 rounded border flex items-center justify-center shrink-0 transition-colors ${isSelected ? 'bg-amber-500 border-amber-500' : 'border-muted-foreground/30'}`}>
                            {isSelected && <Check className="w-2.5 h-2.5 text-white" />}
                          </div>
                          <span className={`text-[10px] font-black leading-tight uppercase tracking-tight ${isSelected ? 'text-amber-700' : 'text-foreground/50'}`}>{goal}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between px-1">
                    <Label className="text-[10px] uppercase font-black tracking-widest text-muted-foreground ml-1">Expectativas con Kairos (Hasta 3)</Label>
                    <Badge variant="outline" className="text-[9px] h-5 border-amber-500/30 text-amber-600 bg-amber-500/5 px-2">{briefingData.expectations.length}/3</Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {expectations.map((exp: string) => {
                      const isSelected = briefingData.expectations.includes(exp);
                      return (
                        <div
                          key={exp}
                          className={`flex items-center gap-2.5 p-2.5 rounded-xl border transition-all cursor-pointer ${isSelected ? 'bg-amber-500/10 border-amber-500/30 shadow-sm' : 'bg-muted/10 border-transparent hover:bg-muted/20'}`}
                          onClick={() => handleToggleBriefingSelection('expectations', exp)}
                        >
                          <div className={`w-3.5 h-3.5 rounded border flex items-center justify-center shrink-0 transition-colors ${isSelected ? 'bg-amber-500 border-amber-500' : 'border-muted-foreground/30'}`}>
                            {isSelected && <Check className="w-2.5 h-2.5 text-white" />}
                          </div>
                          <span className={`text-[10px] font-black leading-tight uppercase tracking-tight ${isSelected ? 'text-amber-700' : 'text-foreground/50'}`}>{exp}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {briefingStep === 3 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-3">
                    <Label className="text-[10px] uppercase font-black tracking-widest text-muted-foreground ml-1">¿Cómo nos conociste?</Label>
                    <Select value={briefingData.contactSource} onValueChange={(val) => setBriefingData((prev: any) => ({ ...prev, contactSource: val }))}>
                      <SelectTrigger className="h-10 bg-muted/30 border-none rounded-xl focus:ring-amber-500/20 font-black text-[10px] uppercase tracking-wider">
                        <SelectValue placeholder="Seleccionar..." />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl border-border">
                        {contactSources.map((src: string) => (
                          <SelectItem key={src} value={src} className="text-[10px] uppercase font-bold text-muted-foreground rounded-lg">{src}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-3">
                    <Label className="text-[10px] uppercase font-black tracking-widest text-muted-foreground ml-1">Canal de Contacto</Label>
                    <div className="grid grid-cols-2 gap-2">
                      <div
                        className={`h-10 flex items-center justify-center gap-2 rounded-xl border transition-all cursor-pointer ${briefingData.contactPreference === 'whatsapp' ? 'bg-amber-500/10 border-amber-500/30 text-amber-600' : 'bg-muted/20 border-transparent hover:bg-muted/30'}`}
                        onClick={() => setBriefingData((prev: any) => ({ ...prev, contactPreference: 'whatsapp' }))}
                      >
                        <MessageCircle className="w-4 h-4" />
                        <span className="text-[9px] font-black uppercase tracking-widest">WhatsApp</span>
                      </div>
                      <div
                        className={`h-10 flex items-center justify-center gap-2 rounded-xl border transition-all cursor-pointer ${briefingData.contactPreference === 'email' ? 'bg-amber-500/10 border-amber-500/30 text-amber-600' : 'bg-muted/20 border-transparent hover:bg-muted/30'}`}
                        onClick={() => setBriefingData((prev: any) => ({ ...prev, contactPreference: 'email' }))}
                      >
                        <Mail className="w-4 h-4" />
                        <span className="text-[9px] font-black uppercase tracking-widest">Email</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-5 pt-4 border-t border-border/50">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/40 text-center">Confirmación de Datos Maestros</p>

                  <div className="grid grid-cols-1 gap-4">
                    <div className="space-y-2">
                      <Label className="text-[10px] uppercase font-black tracking-widest text-muted-foreground ml-1">Email Principal</Label>
                      <div className="relative group">
                        <Input
                          value={briefingData.clientEmail}
                          onChange={(e) => setBriefingData((prev: any) => ({ ...prev, clientEmail: e.target.value }))}
                          className="h-10 bg-muted/40 border-none rounded-xl focus:ring-amber-500/20 pl-10 text-[11px] font-bold"
                          placeholder="correo@ejemplo.com"
                        />
                        <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/30" />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-[10px] uppercase font-black tracking-widest text-muted-foreground ml-1">WhatsApp de Seguimiento</Label>
                      <div className="phone-input-kairos-compact">
                        <PhoneInput
                          value={briefingData.clientPhone}
                          onChange={(val) => setBriefingData((prev: any) => ({ ...prev, clientPhone: val || "" }))}
                          className="kairos-phone-input-sm"
                          placeholder="Número telefónico"
                          defaultCountry="CR"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-amber-500/5 p-4 rounded-[1.25rem] border border-amber-500/10 flex items-start gap-4 shadow-sm">
                  <div className="w-8 h-8 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-600 shrink-0 border border-amber-500/20">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-black uppercase tracking-widest text-amber-600">¡Estrategia Lista para Despegar!</p>
                    <p className="text-[11px] text-muted-foreground leading-relaxed font-medium">Al finalizar, sincronizaremos estos datos con tu perfil maestro para optimizar cada interacción con Kairos.</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-6 bg-muted/30 border-t border-border/50 flex items-center justify-between gap-4">
          <Button
            variant="ghost"
            className={`h-11 rounded-xl text-[10px] font-black uppercase tracking-widest gap-2 transition-all ${briefingStep === 1 ? 'invisible' : 'hover:bg-amber-500/10 text-muted-foreground/60 border border-transparent hover:border-amber-500/20'}`}
            onClick={() => setBriefingStep((prev: number) => Math.max(1, prev - 1))}
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Atrás
          </Button>

          <div className="flex items-center gap-3">
            {briefingStep < 3 ? (
              <Button
                className="px-8 h-11 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-black text-[10px] uppercase tracking-widest gap-2 shadow-xl shadow-amber-600/20 active:scale-[0.98] transition-all hover:scale-[1.02]"
                onClick={() => setBriefingStep((prev: number) => Math.min(3, prev + 1))}
              >
                Continuar <ChevronRight className="w-3.5 h-3.5" />
              </Button>
            ) : (
              <Button
                className="px-8 h-11 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-black text-[10px] uppercase tracking-widest gap-2 shadow-xl shadow-amber-500/30 active:scale-[0.98] transition-all hover:scale-[1.05]"
                onClick={handleSaveBriefing}
                disabled={isProcessing}
              >
                {isProcessing ? <Loader2 className="w-4 h-4 animate-spin text-white" /> : <><Save className="w-4 h-4" /> Guardar Briefing</>}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
