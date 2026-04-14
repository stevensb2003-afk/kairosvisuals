'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Wallet, Receipt, CreditCard, Laptop, PiggyBank, ArrowRight, TrendingUp } from 'lucide-react';
import { useFirestore } from '@/firebase';
import { query, collection, onSnapshot, where } from 'firebase/firestore';
import type { Expense, SavingsGoal } from '@/lib/types';
import { startOfMonth, endOfMonth, isWithinInterval, differenceInDays } from 'date-fns';

export default function FinanceDashboardPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [subscriptions, setSubscriptions] = useState<Expense[]>([]);
  const [assets, setAssets] = useState<Expense[]>([]);
  const [savings, setSavings] = useState<SavingsGoal[]>([]);
  const [loading, setLoading] = useState(true);
  
  const firestore = useFirestore();

  useEffect(() => {
    if (!firestore) return;

    // Listeners para Gastos y Suscripciones (viven en la misma colección)
    const qExpenses = query(collection(firestore, 'expenses'));
    const unsubExpenses = onSnapshot(qExpenses, (snapshot) => {
      const allExpenses = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Expense));
      
      // Separar según tipo
      setExpenses(allExpenses.filter(e => ['operativo', 'legal', 'otro', 'reparticion_socios'].includes(e.expenseType)));
      setSubscriptions(allExpenses.filter(e => e.expenseType === 'subscripcion'));
      setAssets(allExpenses.filter(e => e.expenseType === 'activo'));
    });

    // Listener para Ahorros
    const qSavings = query(collection(firestore, 'savings_goals'));
    const unsubSavings = onSnapshot(qSavings, (snapshot) => {
      setSavings(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as SavingsGoal)));
      setLoading(false);
    });

    return () => {
      unsubExpenses();
      unsubSavings();
    };
  }, [firestore]);

  // Cálculos de Métricas
  const now = new Date();
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);

  const monthlyExpensesTotal = expenses
    .filter(e => e.date && isWithinInterval(new Date(e.date), { start: monthStart, end: monthEnd }))
    .reduce((sum, e) => sum + e.amount, 0);

  const monthlySubscriptionsTotal = subscriptions.reduce((acc, current) => {
    let monthlyEquiv = current.amount;
    if (current.periodicity === 'annual') monthlyEquiv = current.amount / 12;
    if (current.periodicity === 'quarterly') monthlyEquiv = current.amount / 3;
    if (current.periodicity === 'semiannual') monthlyEquiv = current.amount / 6;
    return acc + monthlyEquiv;
  }, 0);

  const calculateCurrentAssetValue = (amount: number, date: string) => {
    const acquisitionDate = new Date(date);
    const daysElapsed = differenceInDays(now, acquisitionDate);
    const yearsElapsed = daysElapsed / 365.25;
    const depreciationRate = 0.20; // 20% anual
    return amount * Math.max(0, 1 - (yearsElapsed * depreciationRate));
  };

  const assetsTotalValue = assets.reduce((sum, a) => sum + calculateCurrentAssetValue(a.amount, a.date), 0);
  const totalSavings = savings.reduce((sum, s) => sum + s.currentAmount, 0);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold font-headline flex items-center gap-3">
          <Wallet className="w-8 h-8 text-primary" />
          Gestión Financiera
        </h1>
        <p className="text-muted-foreground max-w-2xl">
          Control centralizado de la salud financiera de Kairos Visuals. Administra gastos operativos, suscripciones, activos de la empresa y metas de ahorro.
        </p>
      </div>

      {/* Resumen General */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-card to-card/50 border-border/50 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Receipt className="w-4 h-4" /> Gastos del Mes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? "..." : `₡${monthlyExpensesTotal.toLocaleString('es-CR')}`}
            </div>
            <p className="text-xs text-muted-foreground mt-1 text-emerald-500 font-medium flex items-center gap-1">
              <TrendingUp className="w-3 h-3" /> Dentro del presupuesto
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-card to-card/50 border-border/50 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <CreditCard className="w-4 h-4" /> Suscripciones Activas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? "..." : `₡${Math.round(monthlySubscriptionsTotal).toLocaleString('es-CR')}`}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Pagos programados
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-card to-card/50 border-border/50 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Laptop className="w-4 h-4" /> Valor de Activos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? "..." : `₡${Math.round(assetsTotalValue).toLocaleString('es-CR')}`}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Equipos de la empresa
            </p>
          </CardContent>
        </Card>

        <Card className="bg-primary/5 border-primary/20 shadow-sm ring-1 ring-primary/10">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-primary flex items-center gap-2">
              <PiggyBank className="w-4 h-4" /> Fondo de Reserva
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              {loading ? "..." : `₡${totalSavings.toLocaleString('es-CR')}`}
            </div>
            <p className="text-xs text-primary/80 mt-1">
              Ahorro acumulado
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Accesos a los Módulos */}
      <h2 className="text-xl font-bold font-headline mt-10 mb-4">Módulos Financieros</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Gastos */}
        <Card className="group hover:border-primary/50 transition-all hover:bg-card/80">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div className="flex gap-4">
                <div className="p-3 rounded-lg bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400">
                  <Receipt className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">Gastos Operativos</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Registra y categoriza gastos diarios, compras de insumos y costos logísticos.
                  </p>
                </div>
              </div>
            </div>
            <div className="mt-6 flex justify-end">
              <Link href="/finance/expenses">
                <Button variant="outline" className="group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                  Gestionar Gastos <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Suscripciones */}
        <Card className="group hover:border-primary/50 transition-all hover:bg-card/80">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div className="flex gap-4">
                <div className="p-3 rounded-lg bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
                  <CreditCard className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">Suscripciones y Servicios</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Controla membresías recurrentes (Adobe, Canva, Hosting) y sus próximas fechas de cobro.
                  </p>
                </div>
              </div>
            </div>
            <div className="mt-6 flex justify-end">
              <Link href="/finance/subscriptions">
                <Button variant="outline" className="group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                  Ver Suscripciones <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Activos */}
        <Card className="group hover:border-primary/50 transition-all hover:bg-card/80">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div className="flex gap-4">
                <div className="p-3 rounded-lg bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400">
                  <Laptop className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">Activos y Equipo</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Inventario de hardware de la empresa, amortizaciones y compras a tasa cero.
                  </p>
                </div>
              </div>
            </div>
            <div className="mt-6 flex justify-end">
              <Link href="/finance/assets">
                <Button variant="outline" className="group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                  Inventario de Activos <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Ahorros */}
        <Card className="group hover:border-primary/50 transition-all hover:bg-card/80">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div className="flex gap-4">
                <div className="p-3 rounded-lg bg-pink-100 text-pink-600 dark:bg-pink-900/30 dark:text-pink-400">
                  <PiggyBank className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">Ahorros y Reservas</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Define metas financieras, fondos de emergencia y monitoriza el crecimiento del capital.
                  </p>
                </div>
              </div>
            </div>
            <div className="mt-6 flex justify-end">
              <Link href="/finance/savings">
                <Button variant="outline" className="group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                  Vigilar Ahorros <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}
