'use client';

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, useFirestore, useDoc } from '@/firebase';
import { doc } from "firebase/firestore";
import { createBrandBook } from '@/lib/brandbookService';
import { BrandBook } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Save, Loader2, Plus, X, Sparkles } from 'lucide-react';
import { ClientSelect } from '@/components/clients/client-select';
import { INDUSTRIES } from '@/lib/constants';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";


export default function CreateBrandBookPage() {
  const router = useRouter();
  const auth = useAuth();
  const firestore = useFirestore();
  const [isSaving, setIsSaving] = useState(false);

  // Load dynamic industries from settings/briefing
  const configRef = useMemo(() =>
    firestore ? doc(firestore, 'settings', 'briefing') : null,
    [firestore]);

  const { data: config } = useDoc<any>(configRef);
  const industries = config?.industries || INDUSTRIES;
  
  const [formData, setFormData] = useState<Partial<BrandBook>>({
    name: '',
    industry: '',
    mission: '',
    targetAudience: '',
    tone: [],
    visualIdentity: {
      primaryColor: '#7c3aed',
      secondaryColor: '#f59e0b',
      tertiaryColor: '#1e1b4b',
      typography: {
        primary: '',
        secondary: ''
      }
    }
  });

  const [currentTone, setCurrentTone] = useState('');

  const handleAddTone = () => {
    if (currentTone.trim() && !formData.tone?.includes(currentTone.trim())) {
      setFormData(prev => ({
        ...prev,
        tone: [...(prev.tone || []), currentTone.trim()]
      }));
      setCurrentTone('');
    }
  };

  const handleRemoveTone = (toneToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tone: prev.tone?.filter(t => t !== toneToRemove) || []
    }));
  };

  const handleSave = async () => {
    if (!formData.name) {
      alert('El nombre es obligatorio');
      return;
    }

    if (!auth?.currentUser) {
      alert('Debes iniciar sesión para crear un Brand Book');
      return;
    }

    setIsSaving(true);
    try {
      const payload = { ...formData };
      if (!payload.clientId) {
        delete payload.clientId;
      }
      
      const newBookId = await createBrandBook(firestore, payload as any);
      router.push(`/creative-suite/brand-books/${newBookId}`);
    } catch (error) {
      console.error('Error creating brand book:', error);
      alert('Hubo un error al crear el Brand Book');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-8 max-w-[1400px] mx-auto pb-20 px-4 sm:px-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-full">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-headline font-bold">Nuevo Brand Book</h1>
            <p className="text-muted-foreground mt-1">
              Define la identidad y configuración visual de la marca.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={() => router.back()}>Cancelar</Button>
          <Button onClick={handleSave} disabled={isSaving} className="shadow-lg shadow-primary/20">
            {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
            Guardar
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        {/* Identidad Básica */}
        <div className="space-y-6">
          <div className="bg-card/50 backdrop-blur-sm border rounded-2xl p-7 space-y-5">
            <h2 className="text-xl font-bold font-headline border-b pb-3">Información General</h2>
            
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-primary/70 ml-1">Cliente Asociado (Opcional)</Label>
              <ClientSelect
                value={formData.clientId || ''}
                onChange={(val) => setFormData({...formData, clientId: val})}
                placeholder="Busca o agrega un cliente..."
              />
              <p className="text-xs text-muted-foreground ml-1">Vincular este Brand Book a un cliente existente.</p>
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-primary/70 ml-1">Nombre de la Marca *</Label>
              <Input 
                placeholder="Ej. Acme Corp" 
                value={formData.name || ''}
                onChange={e => setFormData({...formData, name: e.target.value})}
                className="h-11 bg-background/40 border-primary/10 rounded-xl focus:ring-primary/20 bg-muted/20"
              />
            </div>
            
            {/* Dropdown de Industria — Estilo Premium */}
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-primary/70 ml-1">Industria / Segmento de Mercado</Label>
              <div className="relative group">
                <Select 
                  value={formData.industry || ''} 
                  onValueChange={(val) => setFormData({...formData, industry: val})}
                >
                  <SelectTrigger className="h-11 bg-background/40 border-primary/10 rounded-xl focus:ring-primary/20 transition-all group-hover:border-primary/30 pl-11 bg-muted/20">
                    <SelectValue placeholder="Seleccionar industria..." />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-primary/20 max-h-[320px] rounded-2xl overflow-hidden shadow-2xl">
                    {industries.map((ind: string) => (
                      <SelectItem
                        key={ind}
                        value={ind}
                        className="hover:bg-primary/10 focus:bg-primary/10 transition-colors py-3 px-4 text-sm"
                      >
                        {ind}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Sparkles className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-primary/40 group-focus-within:text-primary transition-colors z-10 pointer-events-none" />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-primary/70 ml-1">Misión</Label>
              <Textarea 
                placeholder="¿Cuál es la misión de la marca?" 
                value={formData.mission || ''}
                onChange={e => setFormData({...formData, mission: e.target.value})}
                className="resize-none bg-muted/20 border-primary/10 rounded-xl"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-primary/70 ml-1">Público Meta (Target Audience)</Label>
              <Textarea 
                placeholder="Describe a quién va dirigida la marca..." 
                value={formData.targetAudience || ''}
                onChange={e => setFormData({...formData, targetAudience: e.target.value})}
                className="resize-none bg-muted/20 border-primary/10 rounded-xl"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-primary/70 ml-1">Tono de Voz</Label>
              <div className="flex gap-2">
                <Input 
                  placeholder="Ej. Formal, Divertido, Inspirador" 
                  value={currentTone}
                  onChange={e => setCurrentTone(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddTone();
                    }
                  }}
                  className="h-11 bg-muted/20 border-primary/10 rounded-xl"
                />
                <Button type="button" variant="secondary" onClick={handleAddTone} className="rounded-xl h-11 px-4">
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              {formData.tone && formData.tone.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {formData.tone.map(t => (
                    <span key={t} className="flex items-center gap-1.5 bg-primary/10 border border-primary/20 px-3 py-1.5 rounded-full text-xs font-semibold text-primary">
                      {t}
                      <button onClick={() => handleRemoveTone(t)} className="hover:text-destructive transition-colors">
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Identidad Visual */}
        <div className="space-y-6">
          <div className="bg-card/50 backdrop-blur-sm border rounded-2xl p-7 space-y-5">
            <h2 className="text-xl font-bold font-headline border-b pb-3">Identidad Visual</h2>
            
            <div className="space-y-4">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-primary/70">Colores</h3>
              
              <div className="space-y-3">
                {/* Color Primario */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-muted-foreground">Primario</Label>
                  <div className="flex items-center gap-3 p-3 bg-muted/20 border border-primary/10 rounded-xl">
                    <div className="relative flex-shrink-0">
                      <div
                        className="w-10 h-10 rounded-lg border-2 border-white/20 shadow-md cursor-pointer overflow-hidden"
                        style={{ backgroundColor: formData.visualIdentity?.primaryColor || '#7c3aed' }}
                      >
                        <input
                          type="color"
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                          value={formData.visualIdentity?.primaryColor || '#7c3aed'}
                          onChange={e => setFormData({
                            ...formData, 
                            visualIdentity: { ...formData.visualIdentity, primaryColor: e.target.value }
                          })}
                        />
                      </div>
                    </div>
                    <Input 
                      value={formData.visualIdentity?.primaryColor || ''}
                      onChange={e => setFormData({
                        ...formData, 
                        visualIdentity: { ...formData.visualIdentity, primaryColor: e.target.value }
                      })}
                      className="font-mono text-sm h-10 bg-transparent border-0 focus-visible:ring-0 p-0"
                      placeholder="#7c3aed"
                    />
                  </div>
                </div>

                {/* Color Secundario */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-muted-foreground">Secundario</Label>
                  <div className="flex items-center gap-3 p-3 bg-muted/20 border border-primary/10 rounded-xl">
                    <div className="relative flex-shrink-0">
                      <div
                        className="w-10 h-10 rounded-lg border-2 border-white/20 shadow-md cursor-pointer overflow-hidden"
                        style={{ backgroundColor: formData.visualIdentity?.secondaryColor || '#f59e0b' }}
                      >
                        <input
                          type="color"
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                          value={formData.visualIdentity?.secondaryColor || '#f59e0b'}
                          onChange={e => setFormData({
                            ...formData, 
                            visualIdentity: { ...formData.visualIdentity, secondaryColor: e.target.value }
                          })}
                        />
                      </div>
                    </div>
                    <Input 
                      value={formData.visualIdentity?.secondaryColor || ''}
                      onChange={e => setFormData({
                        ...formData, 
                        visualIdentity: { ...formData.visualIdentity, secondaryColor: e.target.value }
                      })}
                      className="font-mono text-sm h-10 bg-transparent border-0 focus-visible:ring-0 p-0"
                      placeholder="#f59e0b"
                    />
                  </div>
                </div>

                {/* Color Terciario */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-muted-foreground">Terciario</Label>
                  <div className="flex items-center gap-3 p-3 bg-muted/20 border border-primary/10 rounded-xl">
                    <div className="relative flex-shrink-0">
                      <div
                        className="w-10 h-10 rounded-lg border-2 border-white/20 shadow-md cursor-pointer overflow-hidden"
                        style={{ backgroundColor: formData.visualIdentity?.tertiaryColor || '#1e1b4b' }}
                      >
                        <input
                          type="color"
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                          value={formData.visualIdentity?.tertiaryColor || '#1e1b4b'}
                          onChange={e => setFormData({
                            ...formData, 
                            visualIdentity: { ...formData.visualIdentity, tertiaryColor: e.target.value }
                          })}
                        />
                      </div>
                    </div>
                    <Input 
                      value={formData.visualIdentity?.tertiaryColor || ''}
                      onChange={e => setFormData({
                        ...formData, 
                        visualIdentity: { ...formData.visualIdentity, tertiaryColor: e.target.value }
                      })}
                      className="font-mono text-sm h-10 bg-transparent border-0 focus-visible:ring-0 p-0"
                      placeholder="#1e1b4b"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4 pt-2">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-primary/70">Tipografía</h3>
              
              <div className="space-y-2">
                <Label className="text-xs font-semibold text-muted-foreground">Fuente Principal (Títulos)</Label>
                <Input 
                  placeholder="Ej. Inter, Montserrat" 
                  value={formData.visualIdentity?.typography?.primary || ''}
                  onChange={e => setFormData({
                    ...formData, 
                    visualIdentity: { 
                      ...formData.visualIdentity, 
                      typography: { ...formData.visualIdentity?.typography, primary: e.target.value }
                    }
                  })}
                  className="h-11 bg-muted/20 border-primary/10 rounded-xl"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-semibold text-muted-foreground">Fuente Secundaria (Cuerpo)</Label>
                <Input 
                  placeholder="Ej. Roboto, Open Sans" 
                  value={formData.visualIdentity?.typography?.secondary || ''}
                  onChange={e => setFormData({
                    ...formData, 
                    visualIdentity: { 
                      ...formData.visualIdentity, 
                      typography: { ...formData.visualIdentity?.typography, secondary: e.target.value }
                    }
                  })}
                  className="h-11 bg-muted/20 border-primary/10 rounded-xl"
                />
              </div>
            </div>
            
            <div className="space-y-4 pt-2">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-primary/70">Estilo Gráfico</h3>
              <div className="space-y-2">
                <Label className="text-xs font-semibold text-muted-foreground">Descripción del estilo gráfico</Label>
                <Textarea 
                  placeholder="Ej. Minimalista, colores pasteles, fotografía con alto contraste..." 
                  value={formData.visualIdentity?.graphicStyle || ''}
                  onChange={e => setFormData({
                    ...formData, 
                    visualIdentity: { ...formData.visualIdentity, graphicStyle: e.target.value }
                  })}
                  className="resize-none bg-muted/20 border-primary/10 rounded-xl"
                  rows={4}
                />
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
