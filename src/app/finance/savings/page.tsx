'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { PiggyBank, Plus, Target, CheckCircle2, ChevronLeft, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useFirestore } from '@/firebase';
import { query, collection, onSnapshot, orderBy } from 'firebase/firestore';
import type { SavingsGoal } from '@/lib/types';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { SavingsDialog } from '@/components/finance/savings-dialog';

// ─── Goal Card ────────────────────────────────────────────────────────────────
function GoalCard({ goal, onManage }: { goal: SavingsGoal; onManage: () => void }) {
  const pct = Math.min(100, Math.max(0, (goal.currentAmount / goal.targetAmount) * 100));
  const done = pct >= 100;
  const remaining = Math.max(0, goal.targetAmount - goal.currentAmount);

  return (
    <div className={`rounded-2xl border p-4 space-y-3 transition-all ${
      done
        ? 'border-emerald-500/30 bg-emerald-500/5'
        : 'border-border/50 bg-card hover:border-pink-300/50 dark:hover:border-pink-700/50'
    }`}>
      {/* Title row */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className={`shrink-0 p-1.5 rounded-lg ${done ? 'bg-emerald-100 dark:bg-emerald-900/30' : 'bg-pink-100 dark:bg-pink-900/30'}`}>
            {done
              ? <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              : <Target className="w-4 h-4 text-pink-500" />
            }
          </div>
          <p className="font-semibold text-sm truncate">{goal.name}</p>
        </div>
        <span className={`shrink-0 text-lg font-bold ${done ? 'text-emerald-500' : 'text-pink-500'}`}>
          {Math.round(pct)}%
        </span>
      </div>

      {/* Radial-style progress (linear pero visualmente dominante) */}
      <Progress
        value={pct}
        className="h-2.5 bg-pink-100 dark:bg-pink-950/50"
        indicatorColor={done ? 'bg-emerald-500' : 'bg-gradient-to-r from-pink-400 to-pink-600'}
      />

      {/* Amounts */}
      <div className="flex justify-between text-xs">
        <div>
          <p className="text-muted-foreground">Acumulado</p>
          <p className="font-bold text-sm">₡{goal.currentAmount.toLocaleString('es-CR')}</p>
        </div>
        {!done && (
          <div className="text-right">
            <p className="text-muted-foreground">Faltante</p>
            <p className="font-bold text-sm text-pink-500">₡{remaining.toLocaleString('es-CR')}</p>
          </div>
        )}
        <div className="text-right">
          <p className="text-muted-foreground">Meta</p>
          <p className="font-medium text-sm">₡{goal.targetAmount.toLocaleString('es-CR')}</p>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-1 border-t border-border/30">
        <span className="text-xs text-muted-foreground">
          {goal.deadline
            ? `Meta: ${format(new Date(goal.deadline), 'MMM yyyy', { locale: es })}`
            : 'Sin fecha límite'}
        </span>
        <Button variant="ghost" size="sm" className="h-7 text-xs hover:text-pink-600 -mr-2" onClick={onManage}>
          Gestionar
        </Button>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function SavingsPage() {
  const firestore = useFirestore();
  const [savings, setSavings] = useState<SavingsGoal[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  useEffect(() => {
    if (!firestore) return;
    const q = query(collection(firestore, 'savings_goals'), orderBy('createdAt', 'desc'));
    return onSnapshot(q, (snap) => {
      setSavings(snap.docs.map(d => ({ id: d.id, ...d.data() } as SavingsGoal)));
      setLoading(false);
    }, () => setLoading(false));
  }, [firestore]);

  const totalCurrent = savings.reduce((s, g) => s + g.currentAmount, 0);
  const totalTarget = savings.reduce((s, g) => s + g.targetAmount, 0);
  const globalPct = totalTarget > 0 ? (totalCurrent / totalTarget) * 100 : 0;
  const completedCount = savings.filter(g => g.currentAmount >= g.targetAmount).length;

  return (
    <div className="max-w-2xl mx-auto space-y-4 pb-24 animate-in fade-in duration-500">

      {/* Header */}
      <div className="flex items-center gap-3 pt-2">
        <Link href="/finance">
          <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full shrink-0">
            <ChevronLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-xl font-bold font-headline flex items-center gap-2">
            <PiggyBank className="w-5 h-5 text-pink-500" /> Ahorros y Reservas
          </h1>
          <p className="text-xs text-muted-foreground">
            {loading ? '...' : `${savings.length} metas · ${completedCount} completadas`}
          </p>
        </div>
        <Button size="sm" onClick={() => setIsDialogOpen(true)}
          className="shrink-0 bg-pink-600 hover:bg-pink-700 text-white">
          <Plus className="w-4 h-4 mr-1" /> Nueva
        </Button>
      </div>

      {/* Global hero */}
      <div className="rounded-2xl bg-gradient-to-br from-pink-500/10 to-pink-500/5 border border-pink-500/20 p-5 space-y-3">
        <div className="flex justify-between items-baseline">
          <div>
            <p className="text-xs text-pink-500 font-medium uppercase tracking-wide">Capital Acumulado</p>
            <p className="text-3xl font-bold font-headline mt-1">₡{totalCurrent.toLocaleString('es-CR')}</p>
            <p className="text-xs text-muted-foreground mt-1">de ₡{totalTarget.toLocaleString('es-CR')} en metas totales</p>
          </div>
          <span className="text-4xl font-bold text-pink-500">{Math.round(globalPct)}%</span>
        </div>
        <Progress
          value={globalPct}
          className="h-3 bg-pink-200/50 dark:bg-pink-950"
          indicatorColor="bg-gradient-to-r from-pink-400 to-pink-600"
        />
      </div>

      {/* Goals list */}
      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : savings.length === 0 ? (
        <div className="flex flex-col items-center py-14 text-muted-foreground gap-4">
          <Target className="w-12 h-12 opacity-20" />
          <div className="text-center">
            <p className="font-medium">Sin metas definidas</p>
            <p className="text-sm mt-1">Crea tu primer fondo de emergencia o reserva</p>
          </div>
          <Button variant="outline" className="border-pink-200 text-pink-600 hover:bg-pink-50 dark:hover:bg-pink-950"
            onClick={() => setIsDialogOpen(true)}>
            Crear primera meta
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {savings.map(g => (
            <GoalCard key={g.id} goal={g} onManage={() => setIsDialogOpen(true)} />
          ))}
        </div>
      )}

      <SavingsDialog open={isDialogOpen} onOpenChange={setIsDialogOpen} />
    </div>
  );
}
