'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Laptop, Plus, Search, HelpCircle, HardDrive, ChevronLeft } from 'lucide-react';
import Link from 'next/link';
import { useFirestore } from '@/firebase';
import { query, collection, onSnapshot, orderBy, where } from 'firebase/firestore';
import type { Expense } from '@/lib/types';
import { format, differenceInDays } from 'date-fns';
import { es } from 'date-fns/locale';
import { ExpenseDialog } from '@/components/finance/expense-dialog';

export default function AssetsPage() {
  const [assets, setAssets] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const firestore = useFirestore();

  useEffect(() => {
    if (!firestore) return;

    try {
      // Query to get expenses marked as assets (activo)
      const q = query(
        collection(firestore, 'expenses'),
        where('expenseType', '==', 'activo'),
        orderBy('date', 'desc')
      );

      const unsubscribe = onSnapshot(q, (snapshot) => {
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Expense));
        setAssets(data);
        setLoading(false);
      }, (error) => {
        console.error("Error fetching assets:", error);
        setLoading(false);
      });

      return () => unsubscribe();
    } catch (error) {
      console.error("Firebase query error:", error);
      setLoading(false);
    }
  }, [firestore]);

  const calculateCurrentValue = (amount: number, date: string) => {
    const acquisitionDate = new Date(date);
    const today = new Date();
    const daysElapsed = differenceInDays(today, acquisitionDate);
    const yearsElapsed = daysElapsed / 365.25;
    const depreciationRate = 0.20; // 20% annual
    
    const value = amount * Math.max(0, 1 - (yearsElapsed * depreciationRate));
    return value;
  };

  const filteredAssets = assets.filter(asset => 
    asset.description.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (asset.vendor && asset.vendor.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const totalValue = filteredAssets.reduce((acc, current) => acc + current.amount, 0);
  const totalCurrentValue = filteredAssets.reduce((acc, current) => acc + calculateCurrentValue(current.amount, current.date), 0);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <Link href="/finance">
              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                <ChevronLeft className="w-5 h-5" />
              </Button>
            </Link>
            <h1 className="text-2xl font-bold font-headline flex items-center gap-2">
              <Laptop className="w-6 h-6 text-emerald-500" />
              Activos y Equipo
            </h1>
          </div>
          <p className="text-muted-foreground text-sm ml-11">Inventario de hardware de la empresa, valorización y amortización.</p>
        </div>
        <Button className="shrink-0 group" onClick={() => setIsDialogOpen(true)}>
          <Plus className="w-4 h-4 mr-2" /> Añadir Equipo
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-card p-4 rounded-xl border border-border/50 shadow-sm">
        <div className="relative w-full sm:w-[300px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            placeholder="Buscar por equipo o marca..." 
            className="pl-9 bg-background"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-4 w-full sm:w-auto">
          <div className="flex items-center gap-2 text-sm text-muted-foreground border-r pr-4 border-border">
            <HardDrive className="w-4 h-4" /> Registros: <span className="font-bold text-foreground">{filteredAssets.length}</span>
          </div>
          <div className="bg-muted px-4 py-2 rounded-md font-semibold whitespace-nowrap text-sm">
            Costo Orig: ₡{totalValue.toLocaleString('es-CR')}
          </div>
          <div className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-4 py-2 rounded-md font-semibold whitespace-nowrap">
            Valor Real: ₡{totalCurrentValue.toLocaleString('es-CR', { maximumFractionDigits: 0 })}
          </div>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead>Fecha Adquisición</TableHead>
                <TableHead>Equipo / Descripción</TableHead>
                <TableHead>Proveedor</TableHead>
                <TableHead>Tipo Adquisición</TableHead>
                <TableHead className="text-right">Costo Original</TableHead>
                <TableHead className="text-right">Valor Actual (-20% anual)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    Cargando inventario...
                  </TableCell>
                </TableRow>
              ) : filteredAssets.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-12">
                    <div className="flex flex-col items-center justify-center text-muted-foreground">
                      <Laptop className="w-8 h-8 mb-4 opacity-20" />
                      <p>El inventario de activos está vacío.</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredAssets.map((asset) => (
                  <TableRow key={asset.id} className="hover:bg-muted/50 cursor-pointer transition-colors">
                     <TableCell className="font-medium">
                      {asset.date ? format(new Date(asset.date), 'dd MMM yyyy', { locale: es }) : 'N/A'}
                    </TableCell>
                    <TableCell className="font-medium">{asset.description}</TableCell>
                    <TableCell className="text-muted-foreground">{asset.vendor || '-'}</TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-[10px] font-medium ${asset.isRecurring ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300' : 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300'}`}>
                        {asset.isRecurring ? 'A Crédito / Cuotas' : 'Contado'}
                      </span>
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      ₡{asset.amount.toLocaleString('es-CR')}
                    </TableCell>
                    <TableCell className="text-right font-bold text-emerald-600 dark:text-emerald-400">
                      ₡{calculateCurrentValue(asset.amount, asset.date).toLocaleString('es-CR', { maximumFractionDigits: 0 })}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      
      <div className="bg-emerald-500/5 rounded-lg p-4 flex items-start gap-4 mt-8 border border-emerald-500/10">
          <HelpCircle className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
          <div className="text-sm text-muted-foreground text-balance">
              <p className="font-medium text-foreground mb-1">Amortización Aplicada</p>
              El sistema calcula automáticamente una depreciación lineal del 20% anual basándose en la fecha de adquisición. Este valor es orientativo para control interno de activos de la empresa.
          </div>
      </div>

      <ExpenseDialog 
        open={isDialogOpen} 
        onOpenChange={setIsDialogOpen} 
        type="activo" 
      />
    </div>
  );
}
