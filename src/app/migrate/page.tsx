'use client';

import { useState } from 'react';
import { useFirestore } from '@/firebase';
import { collection, getDocs, setDoc, doc, deleteDoc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2, CheckCircle } from 'lucide-react';
import { ProductOrService, ServiceUnitType, PricingModel } from '@/lib/types';

export default function MigratePage() {
  const firestore = useFirestore();
  const [isMigrating, setIsMigrating] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = (msg: string) => setLogs(prev => [...prev, msg]);

  const handleMigrate = async () => {
    if (!firestore) return;
    setIsMigrating(true);
    setLogs(['Iniciando migración...']);

    try {
      const taskTypesRef = collection(firestore, 'task_types');
      const servicesRef = collection(firestore, 'services');

      const snapshot = await getDocs(taskTypesRef);
      addLog(`Encontrados ${snapshot.docs.length} Task Types.`);

      let migratedCount = 0;

      for (const d of snapshot.docs) {
        const data = d.data();
        
        // Ensure data maps cleanly to the updated ProductOrService structure
        const service: ProductOrService = {
          id: data.id || d.id,
          name: data.name || 'Migrated Service',
          description: data.description || 'Migrado de Task Types',
          color: data.color || '#cccccc',
          unitType: 'unit', // Default
          pricingModel: (data.pricingModel as PricingModel) || 'fixed',
          basePrice: data.basePrice || data.price || 0,
          useComplexityMatrix: data.useComplexityMatrix || false,
          complexityTiers: data.complexityTiers || [],
          packages: data.packages || [],
          includedUnits: data.includedUnits,
          unitPrice: data.unitPrice,
          createdAt: data.createdAt || new Date().toISOString(),
          updatedAt: data.updateTime || new Date().toISOString(),
        };

        // Remove undefined fields
        const cleanService = Object.fromEntries(
          Object.entries(service).filter(([_, v]) => v !== undefined)
        );

        // Saving to services collection
        await setDoc(doc(servicesRef, service.id), cleanService);
        addLog(`✅ Migrado: ${service.name}`);
        migratedCount++;
        
        // Optionally delete old document (commenting out for safety, user can delete manually)
        // await deleteDoc(doc(taskTypesRef, d.id));
      }

      addLog(`Migración completada. ${migratedCount} servicios migrados.`);
    } catch (error: any) {
      addLog(`❌ Error durante migración: ${error.message}`);
    } finally {
      setIsMigrating(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-8 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Migración de Datos: Task Types a Services</CardTitle>
          <CardDescription>
            Ejecuta esta herramienta una sola vez para mover todos los "Task Types" obsoletos hacia el nuevo catálogo unificado de "Services".
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button onClick={handleMigrate} disabled={isMigrating} className="w-full">
            {isMigrating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle className="mr-2 h-4 w-4" />}
            Iniciar Migración
          </Button>

          {logs.length > 0 && (
            <div className="bg-zinc-950 text-emerald-400 p-4 rounded-md font-mono text-sm h-64 overflow-auto">
              {logs.map((log, i) => (
                <div key={i}>{log}</div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
