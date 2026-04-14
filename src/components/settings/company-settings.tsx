'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { useFirestore } from '@/firebase';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { useToast } from "@/hooks/use-toast";
import { Loader2, Save } from "lucide-react";

export function CompanySettings() {
  const firestore = useFirestore();
  const { toast } = useToast();
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  const [companyInfo, setCompanyInfo] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
  });
  
  const [applyIva, setApplyIva] = useState(false);
  const [ivaTypes, setIvaTypes] = useState<{id: string, name: string, rate: number, isActive: boolean}[]>([
    { id: 'general', name: 'General', rate: 13, isActive: true },
    { id: 'reducido', name: 'Reducido', rate: 4, isActive: true },
    { id: 'exento', name: 'Exento', rate: 0, isActive: true }
  ]);

  useEffect(() => {
    if (!firestore) return;

    const docRef = doc(firestore, 'settings', 'general');
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setCompanyInfo({
          name: data.companyName || '',
          email: data.companyEmail || '',
          phone: data.companyPhone || '',
          address: data.companyAddress || '',
        });
        setApplyIva(data.applyIva || false);
        if (data.ivaTypes && Array.isArray(data.ivaTypes)) {
          setIvaTypes(data.ivaTypes);
        }
      }
      setIsLoading(false);
    }, (error) => {
      console.error("Error fetching company settings:", error);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [firestore]);

  const handleSave = async () => {
    if (!firestore) return;
    setIsSaving(true);
    
    try {
      const docRef = doc(firestore, 'settings', 'general');
      await setDoc(docRef, {
        companyName: companyInfo.name,
        companyEmail: companyInfo.email,
        companyPhone: companyInfo.phone,
        companyAddress: companyInfo.address,
        applyIva: applyIva,
        ivaTypes: ivaTypes
      }, { merge: true });
      
      toast({
        title: "¡Configuraciones guardadas!",
        description: "Se han actualizado los datos de la empresa exitosamente.",
      });
    } catch (error) {
      console.error("Error saving settings: ", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Hubo un error al guardar las configuraciones.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleInputChange = (field: keyof typeof companyInfo, value: string) => {
    setCompanyInfo((prev) => ({ ...prev, [field]: value }));
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex justify-center p-10">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Información de la Empresa</CardTitle>
        <CardDescription>
          Estos datos se utilizarán para generar documentos formales como Cotizaciones y Facturas.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-8">
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label>Nombre de la Empresa Comercial</Label>
            <Input 
              placeholder="Ej. Kairos Visuals S.A." 
              value={companyInfo.name} 
              onChange={(e) => handleInputChange('name', e.target.value)} 
            />
          </div>
          <div className="space-y-2">
            <Label>Correo Electrónico de Contacto</Label>
            <Input 
              type="email" 
              placeholder="contacto@kairosvisuals.com" 
              value={companyInfo.email} 
              onChange={(e) => handleInputChange('email', e.target.value)} 
            />
          </div>
          <div className="space-y-2">
            <Label>Teléfono Comercial</Label>
            <Input 
              type="tel" 
              placeholder="+506 8888 8888" 
              value={companyInfo.phone} 
              onChange={(e) => handleInputChange('phone', e.target.value)} 
            />
          </div>
          <div className="space-y-2">
            <Label>Dirección Física o Jurídica</Label>
            <Input 
              placeholder="San José, Costa Rica" 
              value={companyInfo.address} 
              onChange={(e) => handleInputChange('address', e.target.value)} 
            />
          </div>
        </div>

        <div className="h-px bg-border w-full" />

        <div className="space-y-4">
          <h3 className="font-semibold text-lg font-headline">Configuración Financiera (IVA)</h3>
          <div className="flex flex-row items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
              <Label className="text-base">Módulo de Impuestos (IVA)</Label>
              <p className="text-sm text-muted-foreground">
                Habilita el soporte para impuestos en facturación y cotizaciones.
              </p>
            </div>
            <Switch
              checked={applyIva}
              onCheckedChange={setApplyIva}
            />
          </div>

          {applyIva && (
            <div className="rounded-lg border p-4 space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <Label>Tipos de IVA</Label>
                  <p className="text-xs text-muted-foreground">Agrega y configura los porcentajes de IVA disponibles para tus facturas.</p>
                </div>
                <Button variant="outline" size="sm" onClick={() => setIvaTypes([...ivaTypes, { id: 'iva_'+Date.now(), name: 'Nuevo', rate: 0, isActive: true }])}>
                  Agregar Tipo
                </Button>
              </div>
              <div className="space-y-2">
                {ivaTypes.map((iva, index) => (
                  <div key={index} className="flex gap-2 items-center bg-secondary/20 p-2 rounded-lg">
                    <Input 
                      value={iva.name} 
                      onChange={e => {
                        const newT = [...ivaTypes];
                        newT[index].name = e.target.value;
                        setIvaTypes(newT);
                      }} 
                      placeholder="Nombre (ej. Reducido)"
                      className="flex-1"
                    />
                    <div className="relative w-24">
                      <Input 
                        type="number"
                        value={iva.rate} 
                        onChange={e => {
                          const newT = [...ivaTypes];
                          newT[index].rate = parseFloat(e.target.value) || 0;
                          setIvaTypes(newT);
                        }} 
                        className="pr-6 text-right"
                      />
                      <span className="absolute right-2 top-2 text-muted-foreground text-sm">%</span>
                    </div>
                    <div className="flex items-center gap-2 border-l pl-2">
                      <Label className="text-xs">Activo</Label>
                      <Switch 
                        checked={iva.isActive} 
                        onCheckedChange={c => {
                          const newT = [...ivaTypes];
                          newT[index].isActive = c;
                          setIvaTypes(newT);
                        }}
                      />
                    </div>
                    <Button variant="ghost" size="icon" className="text-red-500 shrink-0" onClick={() => setIvaTypes(ivaTypes.filter((_, i) => i !== index))}>
                      {/* Using simple X icon */}
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end pt-4">
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
            Guardar Cambios
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
