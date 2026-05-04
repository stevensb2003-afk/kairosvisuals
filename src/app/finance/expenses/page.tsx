'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Receipt, Plus, Search, ChevronLeft, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useFirestore } from '@/firebase';
import { query, collection, onSnapshot, orderBy, where } from 'firebase/firestore';
import type { Expense } from '@/lib/types';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { ExpenseDialog } from '@/components/finance/expense-dialog';

// ─── Category config ──────────────────────────────────────────────────────────
const CAT_LABELS: Record<string, string> = {
  operativo: 'Operativo', legal: 'Legal',
  otro: 'Otro', reparticion_socios: 'Repartición',
};
const CAT_COLORS: Record<string, string> = {
  operativo: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
  legal: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
  reparticion_socios: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
  otro: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
};

// ─── Card row ─────────────────────────────────────────────────────────────────
function ExpenseRow({ expense }: { expense: Expense }) {
  const color = CAT_COLORS[expense.expenseType] ?? CAT_COLORS.otro;
  const label = CAT_LABELS[expense.expenseType] ?? expense.expenseType;

  return (
    <div className="flex items-center gap-3 py-3 border-b border-border/50 last:border-0">
      <div className="shrink-0 w-10 h-10 rounded-xl bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
        <Receipt className="w-4 h-4 text-orange-500" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{expense.description}</p>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-xs text-muted-foreground">
            {expense.date ? format(new Date(expense.date), 'dd MMM yyyy', { locale: es }) : '—'}
          </span>
          {expense.vendor && (
            <span className="text-xs text-muted-foreground truncate">· {expense.vendor}</span>
          )}
        </div>
      </div>
      <div className="shrink-0 flex flex-col items-end gap-1">
        <span className="text-sm font-bold text-orange-600 dark:text-orange-400">
          ₡{expense.amount.toLocaleString('es-CR')}
        </span>
        <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${color}`}>
          {label}
        </span>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function ExpensesPage() {
  const firestore = useFirestore();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  useEffect(() => {
    if (!firestore) return;
    const q = query(
      collection(firestore, 'expenses'),
      where('expenseType', 'in', ['operativo', 'legal', 'otro', 'reparticion_socios']),
      orderBy('date', 'desc')
    );
    return onSnapshot(q, (snap) => {
      setExpenses(snap.docs.map(d => ({ id: d.id, ...d.data() } as Expense)));
      setLoading(false);
    }, () => setLoading(false));
  }, [firestore]);

  const filtered = useMemo(() =>
    expenses.filter(e =>
      e.description.toLowerCase().includes(search.toLowerCase()) ||
      (e.vendor?.toLowerCase().includes(search.toLowerCase()))
    ), [expenses, search]);

  const total = filtered.reduce((s, e) => s + e.amount, 0);

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
            <Receipt className="w-5 h-5 text-orange-500" /> Gastos Operativos
          </h1>
          <p className="text-xs text-muted-foreground">Costos, compras y proveedores</p>
        </div>
        <Button size="sm" onClick={() => setIsDialogOpen(true)} className="shrink-0">
          <Plus className="w-4 h-4 mr-1" /> Nuevo
        </Button>
      </div>

      {/* Search + total */}
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
        <div className="bg-orange-500/10 text-orange-600 dark:text-orange-400 px-3 py-2 rounded-lg font-semibold text-sm flex items-center whitespace-nowrap">
          ₡{Math.round(total).toLocaleString('es-CR')}
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
            <Receipt className="w-10 h-10 opacity-20" />
            <p className="text-sm">{search ? 'Sin resultados' : 'Sin gastos registrados'}</p>
          </div>
        ) : (
          filtered.map(e => <ExpenseRow key={e.id} expense={e} />)
        )}
      </div>

      <ExpenseDialog open={isDialogOpen} onOpenChange={setIsDialogOpen} type="operativo" />
    </div>
  );
}
