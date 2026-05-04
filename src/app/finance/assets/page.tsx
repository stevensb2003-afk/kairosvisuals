'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Laptop, Plus, Search, ChevronLeft, Loader2, HelpCircle, HardDrive } from 'lucide-react';
import Link from 'next/link';
import { useFirestore } from '@/firebase';
import { query, collection, onSnapshot, orderBy, where } from 'firebase/firestore';
import type { Expense } from '@/lib/types';
import { format, differenceInDays } from 'date-fns';
import { es } from 'date-fns/locale';
import { ExpenseDialog } from '@/components/finance/expense-dialog';

// ─── Helpers ──────────────────────────────────────────────────────────────────
const calcValue = (amount: number, date: string) => {
  const years = differenceInDays(new Date(), new Date(date)) / 365.25;
  return amount * Math.max(0, 1 - years * 0.2);
};

const depreciationPct = (amount: number, date: string) =>
  Math.min(100, (differenceInDays(new Date(), new Date(date)) / 365.25) * 20);

// ─── Asset card row ───────────────────────────────────────────────────────────
function AssetRow({ asset }: { asset: Expense }) {
  const currentValue = calcValue(asset.amount, asset.date);
  const deprPct = depreciationPct(asset.amount, asset.date);
  const retainedPct = Math.max(0, 100 - deprPct);

  return (
    <div className="py-4 border-b border-border/50 last:border-0 space-y-2">
      {/* Top row */}
      <div className="flex items-start gap-3">
        <div className="shrink-0 w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
          <Laptop className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{asset.description}</p>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-xs text-muted-foreground">
              {asset.date ? format(new Date(asset.date), 'dd MMM yyyy', { locale: es }) : '—'}
            </span>
            {asset.vendor && (
              <span className="text-xs text-muted-foreground">· {asset.vendor}</span>
            )}
            <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${
              asset.isRecurring
                ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300'
                : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
            }`}>
              {asset.isRecurring ? 'Crédito' : 'Contado'}
            </span>
          </div>
        </div>
        <div className="shrink-0 text-right">
          <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
            ₡{Math.round(currentValue).toLocaleString('es-CR')}
          </p>
          <p className="text-[10px] text-muted-foreground line-through">
            ₡{asset.amount.toLocaleString('es-CR')}
          </p>
        </div>
      </div>

      {/* Depreciation bar */}
      <div className="pl-13 space-y-1 ml-13" style={{ marginLeft: '52px' }}>
        <div className="flex justify-between text-[10px] text-muted-foreground">
          <span>Valor retenido</span>
          <span className="font-medium text-emerald-600 dark:text-emerald-400">{Math.round(retainedPct)}%</span>
        </div>
        <div className="h-1.5 rounded-full bg-muted overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-emerald-600 transition-all duration-700"
            style={{ width: `${retainedPct}%` }}
          />
        </div>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function AssetsPage() {
  const firestore = useFirestore();
  const [assets, setAssets] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  useEffect(() => {
    if (!firestore) return;
    const q = query(
      collection(firestore, 'expenses'),
      where('expenseType', '==', 'activo'),
      orderBy('date', 'desc')
    );
    return onSnapshot(q, (snap) => {
      setAssets(snap.docs.map(d => ({ id: d.id, ...d.data() } as Expense)));
      setLoading(false);
    }, () => setLoading(false));
  }, [firestore]);

  const filtered = useMemo(() =>
    assets.filter(a =>
      a.description.toLowerCase().includes(search.toLowerCase()) ||
      (a.vendor?.toLowerCase().includes(search.toLowerCase()))
    ), [assets, search]);

  const totalOriginal = filtered.reduce((s, a) => s + a.amount, 0);
  const totalCurrent = filtered.reduce((s, a) => s + calcValue(a.amount, a.date), 0);

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
            <Laptop className="w-5 h-5 text-emerald-500" /> Activos y Equipo
          </h1>
          <p className="text-xs text-muted-foreground">Inventario y amortización 20% anual</p>
        </div>
        <Button size="sm" onClick={() => setIsDialogOpen(true)} className="shrink-0">
          <Plus className="w-4 h-4 mr-1" /> Añadir
        </Button>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-card border border-border/50 rounded-2xl p-3">
          <div className="flex items-center gap-1.5 mb-1">
            <HardDrive className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">Costo original</span>
          </div>
          <p className="text-lg font-bold">₡{Math.round(totalOriginal).toLocaleString('es-CR')}</p>
        </div>
        <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-2xl p-3">
          <div className="flex items-center gap-1.5 mb-1">
            <Laptop className="w-3.5 h-3.5 text-emerald-500" />
            <span className="text-xs text-emerald-600 dark:text-emerald-400">Valor real hoy</span>
          </div>
          <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
            ₡{Math.round(totalCurrent).toLocaleString('es-CR')}
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Buscar equipo o marca..."
          className="pl-9"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {/* List */}
      <div className="bg-card rounded-2xl border border-border/50 px-4">
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center py-14 text-muted-foreground gap-3">
            <Laptop className="w-10 h-10 opacity-20" />
            <p className="text-sm">{search ? 'Sin resultados' : 'Inventario vacío'}</p>
          </div>
        ) : (
          filtered.map(a => <AssetRow key={a.id} asset={a} />)
        )}
      </div>

      {/* Note */}
      <div className="flex items-start gap-3 bg-emerald-500/5 border border-emerald-500/10 rounded-xl p-3">
        <HelpCircle className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
        <p className="text-xs text-muted-foreground">
          <span className="font-medium text-foreground">Depreciación lineal 20% anual</span> — aplicada automáticamente desde la fecha de adquisición. Es orientativo para control interno.
        </p>
      </div>

      <ExpenseDialog open={isDialogOpen} onOpenChange={setIsDialogOpen} type="activo" />
    </div>
  );
}
