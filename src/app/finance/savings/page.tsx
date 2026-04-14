'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { PiggyBank, Plus, Target, CheckCircle2, ChevronLeft } from 'lucide-react';
import Link from 'next/link';
import { useFirestore } from '@/firebase';
import { query, collection, onSnapshot, orderBy } from 'firebase/firestore';
import type { SavingsGoal } from '@/lib/types';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { SavingsDialog } from '@/components/finance/savings-dialog';

export default function SavingsPage() {
  const [savings, setSavings] = useState<SavingsGoal[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const firestore = useFirestore();

  useEffect(() => {
    if (!firestore) return;

    try {
      const q = query(
        collection(firestore, 'savings_goals'),
        orderBy('createdAt', 'desc')
      );

      const unsubscribe = onSnapshot(q, (snapshot) => {
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as SavingsGoal));
        setSavings(data);
        setLoading(false);
      }, (error) => {
        console.error("Error fetching savings:", error);
        setLoading(false);
      });

      return () => unsubscribe();
    } catch (error) {
      console.error("Firebase query error:", error);
      setLoading(false);
    }
  }, [firestore]);

  const totalCurrent = savings.reduce((sum, goal) => sum + goal.currentAmount, 0);
  const totalTarget = savings.reduce((sum, goal) => sum + goal.targetAmount, 0);
  const globalProgress = totalTarget > 0 ? (totalCurrent / totalTarget) * 100 : 0;

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
              <PiggyBank className="w-6 h-6 text-pink-500" />
              Ahorros y Reservas
            </h1>
          </div>
          <p className="text-muted-foreground text-sm ml-11">Monitoriza el crecimiento del capital y las metas financieras.</p>
        </div>
        <Button 
          className="shrink-0 group bg-pink-600 hover:bg-pink-700 text-white"
          onClick={() => setIsDialogOpen(true)}
        >
          <Plus className="w-4 h-4 mr-2" /> Nueva Meta de Ahorro
        </Button>
      </div>

      {/* Global Summary Card */}
      <Card className="bg-gradient-to-br from-card to-pink-500/5 border-pink-500/20 shadow-sm relative overflow-hidden">
        <div className="absolute right-0 top-0 w-32 h-32 bg-pink-500/10 rounded-bl-full -mr-8 -mt-8 pointer-events-none" />
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row justify-between gap-6 items-center">
            <div className="w-full sm:w-1/3">
              <p className="text-sm font-medium text-pink-600 dark:text-pink-400 mb-1">Capital Total Acumulado</p>
              <h2 className="text-4xl font-bold font-headline">
                ₡{totalCurrent.toLocaleString('es-CR')}
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                De la meta global de ₡{totalTarget.toLocaleString('es-CR')}
              </p>
            </div>
            <div className="w-full sm:w-2/3 space-y-2">
              <div className="flex justify-between items-end">
                <span className="text-sm font-medium">Progreso Global</span>
                <span className="text-2xl font-bold text-pink-600">{Math.round(globalProgress)}%</span>
              </div>
              <Progress value={globalProgress} className="h-3 bg-pink-100 dark:bg-pink-950" indicatorColor="bg-pink-500" />
            </div>
          </div>
        </CardContent>
      </Card>

      <h2 className="text-xl font-bold font-headline mt-8 mb-4">Metas Activas</h2>
      
      {loading ? (
        <div className="text-center py-12 text-muted-foreground">Cargando metas de ahorro...</div>
      ) : savings.length === 0 ? (
        <Card className="border-dashed bg-card/30">
          <CardContent className="flex flex-col items-center justify-center p-12 text-center">
            <Target className="w-12 h-12 text-muted-foreground mb-4 opacity-30" />
            <h3 className="text-lg font-bold mb-2">Sin Metas Definidas</h3>
            <p className="text-muted-foreground max-w-md mb-6">
              Empieza creando tu primer "Fondo de Emergencia" o planea la compra de un nuevo equipo definiendo una meta de ahorro.
            </p>
            <Button 
              variant="outline" 
              className="text-pink-600 border-pink-200 hover:bg-pink-50"
              onClick={() => setIsDialogOpen(true)}
            >
              Crear mi primera meta financiera
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {savings.map((goal) => {
            const percentage = Math.min(100, Math.max(0, (goal.currentAmount / goal.targetAmount) * 100));
            const isCompleted = percentage >= 100;

            return (
              <Card key={goal.id} className={`group hover:shadow-md transition-all ${isCompleted ? 'border-emerald-500/30 bg-emerald-500/5' : ''}`}>
                <CardHeader className="pb-3 border-b border-border/10">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-base font-semibold truncate pr-4">
                      {goal.name}
                    </CardTitle>
                    {isCompleted ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                    ) : (
                      <Target className="w-5 h-5 text-muted-foreground/50 shrink-0 group-hover:text-pink-400 transition-colors" />
                    )}
                  </div>
                </CardHeader>
                <CardContent className="pt-4 space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-1 line-clamp-1">
                      <span className="font-bold">₡{goal.currentAmount.toLocaleString('es-CR')}</span>
                      <span className="text-muted-foreground">/ ₡{goal.targetAmount.toLocaleString('es-CR')}</span>
                    </div>
                    <Progress 
                      value={percentage} 
                      className="h-2" 
                      indicatorColor={isCompleted ? "bg-emerald-500" : "bg-pink-500"} 
                    />
                  </div>
                  
                  <div className="flex justify-between items-center pt-2">
                    <div className="text-xs text-muted-foreground">
                      {goal.deadline ? `Meta: ${format(new Date(goal.deadline), 'MMM yyyy', { locale: es })}` : 'Sin fecha límite'}
                    </div>
                    <Button variant="ghost" size="sm" className="h-8 text-xs hover:text-pink-600">
                      Gestionar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
      <SavingsDialog 
        open={isDialogOpen} 
        onOpenChange={setIsDialogOpen} 
      />
    </div>
  );
}
