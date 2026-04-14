'use client';

import { useState, useMemo, useEffect } from 'react';
import { useFirestore, useDoc, setDocumentNonBlocking } from '@/firebase';
import { doc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Save, ShieldAlert, LayoutGrid } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';

interface SecurityConfigData {
  TEAM_CODE: string;
}

export function SecurityConfig() {
  const firestore = useFirestore();
  const { toast } = useToast();
  
  const configRef = useMemo(() => 
    firestore ? doc(firestore, 'config', 'security') : null, 
  [firestore]);
  
  const { data: config, isLoading } = useDoc<SecurityConfigData>(configRef);
  const [localData, setLocalData] = useState<SecurityConfigData | null>(null);

  useEffect(() => {
    if (config) {
      setLocalData(config);
    } else if (!isLoading && config === null) {
      // Initialize with default if document doesn't exist
      setLocalData({ TEAM_CODE: 'KAIROS-TEAM-2026' });
    }
  }, [config, isLoading]);

  const handleSave = async () => {
    if (!configRef || !localData) return;
    try {
      await setDocumentNonBlocking(configRef, localData);
      toast({
        title: "Seguridad actualizada",
        description: "El código de acceso del equipo ha sido guardado exitosamente.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo guardar la configuración de seguridad.",
        variant: "destructive"
      });
    }
  };

  if (isLoading || !localData) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    );
  }

  const hasChanges = JSON.stringify(config) !== JSON.stringify(localData);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between sticky top-0 z-30 bg-background/95 backdrop-blur-md py-4 border-b">
        <div>
          <h2 className="text-xl font-bold">Seguridad del Equipo</h2>
          <p className="text-sm text-muted-foreground">Gestiona el código de acceso (TEAM_CODE) para el registro y login.</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleSave} disabled={!hasChanges} className="gap-2 shadow-lg shadow-primary/20">
            <Save className="h-4 w-4" />
            Guardar Cambios
          </Button>
        </div>
      </div>

      <div className="grid gap-6">
        <Card className="overflow-hidden border shadow-sm bg-card/50">
          <CardHeader className="flex flex-row items-center gap-4 space-y-0">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary border border-primary/20">
              <ShieldAlert className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <CardTitle className="text-lg">Código de Acceso del Equipo (TEAM_CODE)</CardTitle>
              <CardDescription>Código requerido para que se puedan registrar como miembros del equipo.</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="team_code" className="text-sm font-medium">
                Código Actual
              </label>
              <Input
                id="team_code"
                placeholder="Ej. KAIROS2024"
                value={localData.TEAM_CODE || ''}
                onChange={(e) => setLocalData({ ...localData, TEAM_CODE: e.target.value })}
                className="max-w-md font-mono"
              />
              <p className="text-sm text-muted-foreground">
                Asegúrate de compartir este código solo con los miembros de tu equipo.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
