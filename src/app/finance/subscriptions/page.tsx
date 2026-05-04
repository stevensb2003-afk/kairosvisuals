'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CreditCard, Plus, Search, ChevronLeft, Loader2, AlertTriangle, RefreshCw, CalendarDays } from 'lucide-react';
import Link from 'next/link';
import { useFirestore } from '@/firebase';
import { query, collection, onSnapshot, orderBy, where } from 'firebase/firestore';
import { differenceInDays, format } from 'date-fns';
import { es } from 'date-fns/locale';
import { ExpenseDialog } from '@/components/finance/expense-dialog';
import { Expense } from '@/lib/types';

// ─── Helpers ──────────────────────────────────────────────────────────────────
const PERIODICITY_LABELS: Record<string, string> = {
  monthly: 'Mensual', annual: 'Anual',
  quarterly: 'Trimestral', semiannual: 'Semestral',
};

const toMonthly = (e: Expense) => {
  const map: Record<string, number> = { annual: 12, quarterly: 3, semiannual: 6 };
  return e.amount / (map[e.periodicity ?? ''] ?? 1);
};

// ─── Row ──────────────────────────────────────────────────────────────────────
function SubscriptionRow({ sub }: { sub: Expense }) {
  const daysLeft = sub.nextPaymentDate
    ? differenceInDays(new Date(sub.nextPaymentDate), new Date())
    : null;
  const urgent = daysLeft !== null && daysLeft <= 5;

  return (
    <div className="flex items-center gap-3 py-3 border-b border-border/50 last:border-0">
      {/* Avatar */}
      <div className={`shrink-0 w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold
        ${urgent ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400' : 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'}`}>
        {sub.vendor ? sub.vendor.substring(0, 2).toUpperCase() : '??'}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium truncate">{sub.vendor || sub.description}</p>
          {urgent && (
            <span className="shrink-0 flex items-center gap-1 text-[10px] font-bold text-red-500 bg-red-50 dark:bg-red-500/10 px-1.5 py-0.5 rounded-full border border-red-200 dark:border-red-500/30 animate-pulse">
              <AlertTriangle className="w-2.5 h-2.5" /> PRÓXIMO
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
            {PERIODICITY_LABELS[sub.periodicity ?? ''] ?? 'N/D'}
          </span>
          {sub.nextPaymentDate && (
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <CalendarDays className="w-3 h-3" />
              {format(new Date(sub.nextPaymentDate), 'dd MMM', { locale: es })}
              {daysLeft !== null && (
                <span className={`font-medium ${urgent ? 'text-red-500' : ''}`}>
                  ({daysLeft}d)
                </span>
              )}
            </span>
          )}
        </div>
      </div>

      {/* Monto */}
      <div className="shrink-0 text-right">
        <p className="text-sm font-bold text-blue-600 dark:text-blue-400">
          ₡{sub.amount.toLocaleString('es-CR')}
        </p>
        <p className="text-[10px] text-muted-foreground">
          ≈ ₡{Math.round(toMonthly(sub)).toLocaleString('es-CR')}/mes
        </p>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function SubscriptionsPage() {
  const firestore = useFirestore();
  const [subscriptions, setSubscriptions] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  useEffect(() => {
    if (!firestore) return;
    const q = query(
      collection(firestore, 'expenses'),
      where('expenseType', '==', 'subscripcion'),
      orderBy('date', 'desc')
    );
    return onSnapshot(q, (snap) => {
      setSubscriptions(snap.docs.map(d => ({ id: d.id, ...d.data() } as Expense)));
      setLoading(false);
    }, () => setLoading(false));
  }, [firestore]);

  const filtered = useMemo(() =>
    subscriptions.filter(s =>
      s.description.toLowerCase().includes(search.toLowerCase()) ||
      (s.vendor?.toLowerCase().includes(search.toLowerCase()))
    ), [subscriptions, search]);

  const monthlyBurn = filtered.reduce((s, e) => s + toMonthly(e), 0);
  const urgentCount = filtered.filter(s =>
    s.nextPaymentDate && differenceInDays(new Date(s.nextPaymentDate), new Date()) <= 5
  ).length;

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
            <CreditCard className="w-5 h-5 text-blue-500" /> Suscripciones
          </h1>
          <p className="text-xs text-muted-foreground">
            {loading ? '...' : `${filtered.length} activas`}
            {urgentCount > 0 && <span className="text-red-500 font-medium"> · {urgentCount} próximas a vencer</span>}
          </p>
        </div>
        <Button size="sm" onClick={() => setIsDialogOpen(true)} className="shrink-0">
          <Plus className="w-4 h-4 mr-1" /> Nueva
        </Button>
      </div>

      {/* Search + burn */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar..."
            className="pl-9"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className="bg-blue-500/10 text-blue-600 dark:text-blue-400 px-3 py-2 rounded-lg font-semibold text-sm flex items-center gap-1 whitespace-nowrap">
          <RefreshCw className="w-3 h-3" /> ₡{Math.round(monthlyBurn).toLocaleString('es-CR')}/mes
        </div>
      </div>

      {/* List */}
      <div className="bg-card rounded-2xl border border-border/50 px-4">
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center py-14 text-muted-foreground gap-3">
            <CreditCard className="w-10 h-10 opacity-20" />
            <p className="text-sm">{search ? 'Sin resultados' : 'Sin suscripciones registradas'}</p>
          </div>
        ) : (
          filtered.map(s => <SubscriptionRow key={s.id} sub={s} />)
        )}
      </div>

      <ExpenseDialog open={isDialogOpen} onOpenChange={setIsDialogOpen} type="subscripcion" />
    </div>
  );
}
