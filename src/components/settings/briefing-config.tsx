'use client';

import { useState, useMemo, useEffect } from 'react';
import { useFirestore, useUser, useDoc, setDocumentNonBlocking } from '@/firebase';
import { doc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Plus, Trash2, Save, RotateCcw, LayoutGrid, Target, Lightbulb, Users as UsersIcon, Building } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';

interface BriefingConfigData {
  industries: string[];
  expectations: string[];
  mainGoals: string[];
  motivations: string[];
  contactSources: string[];
}

export function BriefingConfig() {
  const firestore = useFirestore();
  const { toast } = useToast();
  
  const configRef = useMemo(() => 
    firestore ? doc(firestore, 'settings', 'briefing') : null, 
  [firestore]);
  
  const { data: config, isLoading } = useDoc<BriefingConfigData>(configRef);
  const [localData, setLocalData] = useState<BriefingConfigData | null>(null);
  const [newItem, setNewItem] = useState<{ [key in keyof BriefingConfigData]?: string }>({});

  useEffect(() => {
    if (config) {
      setLocalData(config);
    } else if (!isLoading && config === null) {
      // Initialize with defaults if document doesn't exist
      setLocalData({
        industries: [],
        expectations: [],
        mainGoals: [],
        motivations: [],
        contactSources: []
      });
    }
  }, [config, isLoading]);

  const handleAddItem = (category: keyof BriefingConfigData) => {
    const value = newItem[category]?.trim();
    if (!value || !localData) return;
    
    if (localData[category].includes(value)) {
      toast({
        title: "Item duplicado",
        description: "Esta opción ya existe en la lista.",
        variant: "destructive"
      });
      return;
    }

    setLocalData({
      ...localData,
      [category]: [...localData[category], value]
    });
    setNewItem({ ...newItem, [category]: '' });
  };

  const handleRemoveItem = (category: keyof BriefingConfigData, index: number) => {
    if (!localData) return;
    const newList = [...localData[category]];
    newList.splice(index, 1);
    setLocalData({
      ...localData,
      [category]: newList
    });
  };

  const handleSave = async () => {
    if (!configRef || !localData) return;
    try {
      await setDocumentNonBlocking(configRef, localData);
      toast({
        title: "Configuración guardada",
        description: "Los campos del formulario de briefing han sido actualizados.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo guardar la configuración.",
        variant: "destructive"
      });
    }
  };

  const handleReset = () => {
    if (config) {
      setLocalData(config);
    }
  };

  if (isLoading || !localData) {
    return (
      <div className="space-y-6">
        {[1, 2, 3, 4, 5].map((i) => (
          <Skeleton key={i} className="h-64 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  const sections: { key: keyof BriefingConfigData; title: string; description: string; icon: any }[] = [
    { 
      key: 'industries', 
      title: 'Industrias / Nichos', 
      description: 'Sectores que los clientes pueden seleccionar.',
      icon: Building
    },
    { 
      key: 'expectations', 
      title: 'Expectativas', 
      description: 'Lo que el cliente espera lograr a corto plazo (Sugerido: Máx 8 opciones).',
      icon: Lightbulb
    },
    { 
      key: 'mainGoals', 
      title: 'Objetivos Principales', 
      description: 'Metas a largo plazo para escalar el negocio.',
      icon: Target
    },
    { 
      key: 'motivations', 
      title: 'Motivaciones', 
      description: 'Por qué el cliente busca ayuda profesional ahora.',
      icon: LayoutGrid
    },
    { 
      key: 'contactSources', 
      title: 'Fuentes de Contacto', 
      description: '¿Cómo nos conocieron?',
      icon: UsersIcon
    },
  ];

  const hasChanges = JSON.stringify(config) !== JSON.stringify(localData);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between sticky top-0 z-30 bg-background/95 backdrop-blur-md py-4 border-b">
        <div>
          <h2 className="text-xl font-bold">Configuración de Briefing</h2>
          <p className="text-sm text-muted-foreground">Personaliza las opciones que ven tus leads.</p>
        </div>
        <div className="flex gap-2">
          {hasChanges && (
            <Button variant="outline" onClick={handleReset} className="gap-2">
              <RotateCcw className="h-4 w-4" />
              Descartar
            </Button>
          )}
          <Button onClick={handleSave} disabled={!hasChanges} className="gap-2 shadow-lg shadow-primary/20">
            <Save className="h-4 w-4" />
            Guardar Cambios
          </Button>
        </div>
      </div>

      <div className="grid gap-6">
        {sections.map((section) => (
          <Card key={section.key} className="overflow-hidden border shadow-sm bg-card/50">
            <CardHeader className="flex flex-row items-center gap-4 space-y-0">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary border border-primary/20">
                <section.icon className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <CardTitle className="text-lg">{section.title}</CardTitle>
                <CardDescription>{section.description}</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-2 min-h-[40px] p-4 bg-secondary/20 rounded-lg border border-dashed border-muted-foreground/20">
                {localData[section.key].map((item, index) => (
                  <Badge 
                    key={index} 
                    variant="outline" 
                    className="pl-3 pr-1 py-1 gap-2 text-sm font-medium bg-background/50 hover:bg-secondary transition-colors"
                  >
                    {item}
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-5 w-5 hover:bg-destructive hover:text-destructive-foreground rounded-full transition-all"
                      onClick={() => handleRemoveItem(section.key, index)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </Badge>
                ))}
                {localData[section.key].length === 0 && (
                  <p className="text-sm text-muted-foreground italic">No hay opciones configuradas.</p>
                )}
              </div>
              
              <div className="flex gap-2">
                <Input 
                  placeholder={`Nueva opción para ${section.title.toLowerCase()}...`}
                  value={newItem[section.key] || ''}
                  onChange={(e) => setNewItem({ ...newItem, [section.key]: e.target.value })}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddItem(section.key);
                    }
                  }}
                  className="bg-background focus-visible:ring-primary/50"
                />
                <Button variant="secondary" onClick={() => handleAddItem(section.key)} disabled={!newItem[section.key]?.trim()}>
                  <Plus className="h-4 w-4 mr-2" />
                  Añadir
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
