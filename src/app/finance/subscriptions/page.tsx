'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { CreditCard, Plus, Search, Filter, CalendarDays, RefreshCw, ChevronLeft, AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import { useFirestore } from '@/firebase';
import { query, collection, onSnapshot, orderBy, where } from 'firebase/firestore';
import { format, differenceInDays } from 'date-fns';
import { es } from 'date-fns/locale';
import { ExpenseDialog } from '@/components/finance/expense-dialog';

export default function SubscriptionsPage() {
  const [subscriptions, setSubscriptions] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const firestore = useFirestore();

  useEffect(() => {
    if (!firestore) return;

    try {
      // Query to get expenses marked as subscriptions
      const q = query(
        collection(firestore, 'expenses'),
        where('expenseType', '==', 'subscripcion'),
        orderBy('date', 'desc')
      );

      const unsubscribe = onSnapshot(q, (snapshot) => {
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Expense));
        setSubscriptions(data);
        setLoading(false);
      }, (error) => {
        console.error("Error fetching subscriptions:", error);
        setLoading(false);
      });

      return () => unsubscribe();
    } catch (error) {
      console.error("Firebase query error:", error);
      setLoading(false);
    }
  }, [firestore]);

  const filteredSubscriptions = subscriptions.filter(sub => 
    sub.description.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (sub.vendor && sub.vendor.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const calculateMonthlyBurn = () => {
    return filteredSubscriptions.reduce((acc, current) => {
      let monthlyEquiv = current.amount;
      if (current.periodicity === 'annual') monthlyEquiv = current.amount / 12;
      if (current.periodicity === 'quarterly') monthlyEquiv = current.amount / 3;
      if (current.periodicity === 'semiannual') monthlyEquiv = current.amount / 6;
      return acc + monthlyEquiv;
    }, 0);
  };

  const getPeriodicityLabel = (p?: string) => {
    switch(p) {
      case 'monthly': return 'Mensual';
      case 'annual': return 'Anual';
      case 'quarterly': return 'Trimestral';
      case 'semiannual': return 'Semestral';
      default: return 'No definida';
    }
  };

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
              <CreditCard className="w-6 h-6 text-blue-500" />
              Suscripciones y Servicios
            </h1>
          </div>
          <p className="text-muted-foreground text-sm ml-11">Gestiona membresías, licencias de software y pagos recurrentes.</p>
        </div>
        <Button className="shrink-0 group" onClick={() => setIsDialogOpen(true)}>
          <Plus className="w-4 h-4 mr-2" /> Nueva Suscripción
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-card p-4 rounded-xl border border-border/50 shadow-sm">
        <div className="relative w-full sm:w-[300px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            placeholder="Buscar suscripción..." 
            className="pl-9 bg-background"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-4 w-full sm:w-auto">
          <div className="flex items-center gap-2 text-sm text-muted-foreground border-r pr-4 border-border">
            <RefreshCw className="w-4 h-4" /> Activas: <span className="font-bold text-foreground">{filteredSubscriptions.length}</span>
          </div>
          <div className="bg-blue-500/10 text-blue-600 dark:text-blue-400 px-4 py-2 rounded-md font-semibold whitespace-nowrap">
            Gasto Mensual: ₡{Math.round(calculateMonthlyBurn()).toLocaleString('es-CR')}
          </div>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead>Servicio / Proveedor</TableHead>
                <TableHead>Periodicidad</TableHead>
                <TableHead>Próximo Cobro</TableHead>
                <TableHead>Descripción</TableHead>
                <TableHead className="text-right">Monto</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    Cargando suscripciones...
                  </TableCell>
                </TableRow>
              ) : filteredSubscriptions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-12">
                    <div className="flex flex-col items-center justify-center text-muted-foreground">
                      <CreditCard className="w-8 h-8 mb-4 opacity-20" />
                      <p>No se encontraron suscripciones activas.</p>
                      <p className="text-sm mt-1">Usa el botón "Nueva Suscripción" para añadir una.</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredSubscriptions.map((sub) => (
                  <TableRow key={sub.id} className="hover:bg-muted/50 cursor-pointer transition-colors">
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded bg-muted flex items-center justify-center text-xs font-bold text-muted-foreground">
                          {sub.vendor ? sub.vendor.substring(0, 2).toUpperCase() : 'NA'}
                        </div>
                        {sub.vendor || 'Proveedor Desconocido'}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-[10px] font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300">
                        {getPeriodicityLabel(sub.periodicity)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center text-sm gap-2">
                        <div className="flex items-center text-muted-foreground whitespace-nowrap">
                          <CalendarDays className="w-3 h-3 mr-1" />
                          {sub.nextPaymentDate ? new Date(sub.nextPaymentDate).toLocaleDateString('es-CR') : 'No definida'}
                        </div>
                        {sub.nextPaymentDate && differenceInDays(new Date(sub.nextPaymentDate), new Date()) <= 3 && (
                          <div className="flex items-center gap-1 text-[10px] font-bold text-red-500 animate-pulse bg-red-50 dark:bg-red-500/10 px-1.5 py-0.5 rounded border border-red-200 dark:border-red-500/20">
                            <AlertTriangle className="w-3 h-3" /> PRÓXIMO
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm max-w-[200px] truncate" title={sub.description}>
                      {sub.description}
                    </TableCell>
                    <TableCell className="text-right font-bold">
                      ₡{sub.amount.toLocaleString('es-CR')}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      <ExpenseDialog 
        open={isDialogOpen} 
        onOpenChange={setIsDialogOpen} 
        type="subscripcion" 
      />
    </div>
  );
}
