'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import {
  Wallet, Receipt, CreditCard, Laptop, PiggyBank,
  TrendingUp, TrendingDown, ChevronRight,
  BarChart3, ShieldCheck, Plus, X
} from 'lucide-react';
import { useFirestore } from '@/firebase';
import { query, collection, onSnapshot } from 'firebase/firestore';
import type { Expense, SavingsGoal } from '@/lib/types';
import { startOfMonth, endOfMonth, isWithinInterval, differenceInDays } from 'date-fns';
import { cn } from '@/lib/utils';
import { ExpenseDialog } from '@/components/finance/expense-dialog';
import { SavingsDialog } from '@/components/finance/savings-dialog';

// ─── Types ────────────────────────────────────────────────────────────────────
interface FinanceData {
  expenses: Expense[];
  subscriptions: Expense[];
  assets: Expense[];
  savings: SavingsGoal[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const calcDepreciation = (amount: number, date: string) => {
  const days = differenceInDays(new Date(), new Date(date));
  return amount * Math.max(0, 1 - (days / 365.25) * 0.2);
};

const toMonthly = (e: Expense) => {
  const map: Record<string, number> = { annual: 12, quarterly: 3, semiannual: 6 };
  return e.amount / (map[e.periodicity ?? ''] ?? 1);
};

// ─── Sub-components ───────────────────────────────────────────────────────────
function KpiHero({ label, value, sub, accent = false }: {
  label: string; value: string; sub?: React.ReactNode; accent?: boolean;
}) {
  return (
    <div className={`rounded-2xl p-5 flex flex-col gap-1 ${
      accent
        ? 'bg-gradient-to-br from-primary to-primary/70 text-primary-foreground shadow-lg shadow-primary/20'
        : 'bg-card border border-border/50'
    }`}>
      <span className={`text-xs font-medium tracking-wide uppercase ${accent ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
        {label}
      </span>
      <span className={`text-3xl font-bold font-headline tracking-tight ${accent ? 'text-primary-foreground' : ''}`}>
        {value}
      </span>
      {sub && <div className={`text-xs mt-1 ${accent ? 'text-primary-foreground/80' : 'text-muted-foreground'}`}>{sub}</div>}
    </div>
  );
}

function ModuleCard({ href, icon: Icon, iconBg, title, description, stat }: {
  href: string; icon: React.ElementType; iconBg: string;
  title: string; description: string; stat?: string;
}) {
  return (
    <Link href={href}>
      <div className="group flex items-center gap-4 p-4 rounded-xl bg-card border border-border/50 hover:border-primary/40 hover:bg-primary/5 transition-all duration-200 cursor-pointer">
        <div className={`shrink-0 p-3 rounded-xl ${iconBg}`}>
          <Icon className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm">{title}</p>
          <p className="text-xs text-muted-foreground truncate mt-0.5">{description}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {stat && <span className="text-xs font-medium text-muted-foreground">{stat}</span>}
          <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
        </div>
      </div>
    </Link>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
type DialogType = 'gasto' | 'subscripcion' | 'activo' | 'ahorro' | null;

export default function FinanceDashboardPage() {
  const firestore = useFirestore();
  const [data, setData] = useState<FinanceData>({ expenses: [], subscriptions: [], assets: [], savings: [] });
  const [loading, setLoading] = useState(true);
  const [fabOpen, setFabOpen] = useState(false);
  const [fabVisible, setFabVisible] = useState(true);
  const [activeDialog, setActiveDialog] = useState<DialogType>(null);
  const lastScrollY = useRef(0);

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      setFabVisible(y < lastScrollY.current || y < 80);
      if (fabOpen && y > lastScrollY.current + 10) setFabOpen(false);
      lastScrollY.current = y;
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [fabOpen]);

  useEffect(() => {
    if (!firestore) return;
    let loaded = 0;
    const done = () => { if (++loaded >= 2) setLoading(false); };

    const unsubE = onSnapshot(query(collection(firestore, 'expenses')), (snap) => {
      const all = snap.docs.map(d => ({ id: d.id, ...d.data() } as Expense));
      setData(prev => ({
        ...prev,
        expenses: all.filter(e => ['operativo','legal','otro','reparticion_socios'].includes(e.expenseType)),
        subscriptions: all.filter(e => e.expenseType === 'subscripcion'),
        assets: all.filter(e => e.expenseType === 'activo'),
      }));
      done();
    });

    const unsubS = onSnapshot(query(collection(firestore, 'savings_goals')), (snap) => {
      setData(prev => ({ ...prev, savings: snap.docs.map(d => ({ id: d.id, ...d.data() } as SavingsGoal)) }));
      done();
    });

    return () => { unsubE(); unsubS(); };
  }, [firestore]);

  // ── Metrics ──
  const now = new Date();
  const interval = { start: startOfMonth(now), end: endOfMonth(now) };

  const monthlyExpenses = data.expenses
    .filter(e => e.date && isWithinInterval(new Date(e.date), interval))
    .reduce((s, e) => s + e.amount, 0);

  const monthlySubscriptions = data.subscriptions.reduce((s, e) => s + toMonthly(e), 0);
  const assetsValue = data.assets.reduce((s, a) => s + calcDepreciation(a.amount, a.date), 0);
  const totalSavings = data.savings.reduce((s, g) => s + g.currentAmount, 0);
  const totalOutflow = monthlyExpenses + monthlySubscriptions;

  const fmt = (n: number) => loading ? '—' : `₡${Math.round(n).toLocaleString('es-CR')}`;

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-10 animate-in fade-in duration-500">

      {/* ── Header ── */}
      <div className="flex items-center gap-3 pt-2">
        <div className="p-2.5 rounded-xl bg-primary/10">
          <Wallet className="w-6 h-6 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold font-headline leading-tight">Gestión Financiera</h1>
          <p className="text-xs text-muted-foreground">Centro de control · Kairos Visuals</p>
        </div>
      </div>

      {/* ── Hero KPI + secundarias ── */}
      <div className="grid grid-cols-2 gap-3">
        {/* Hero: Reserva */}
        <div className="col-span-2">
          <KpiHero
            accent
            label="Fondo de Reserva"
            value={fmt(totalSavings)}
            sub={
              <span className="flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" /> Capital protegido acumulado
              </span>
            }
          />
        </div>
        {/* Secundarias */}
        <KpiHero
          label="Egreso Mensual"
          value={fmt(totalOutflow)}
          sub={
            <span className="flex items-center gap-1 text-rose-500">
              <TrendingDown className="w-3 h-3" /> Este mes
            </span>
          }
        />
        <KpiHero
          label="Valor Activos"
          value={fmt(assetsValue)}
          sub={
            <span className="flex items-center gap-1 text-emerald-500">
              <TrendingUp className="w-3 h-3" /> Depreciado
            </span>
          }
        />
      </div>

      {/* ── Breakdown rápido de egresos ── */}
      <div className="rounded-2xl bg-card border border-border/50 p-4 space-y-3">
        <div className="flex items-center gap-2 mb-1">
          <BarChart3 className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm font-semibold">Desglose de Egresos</span>
        </div>

        {/* Gastos operativos */}
        <div className="space-y-1">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Gastos operativos</span>
            <span>{fmt(monthlyExpenses)}</span>
          </div>
          <div className="h-1.5 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full rounded-full bg-orange-400 transition-all duration-700"
              style={{ width: totalOutflow > 0 ? `${(monthlyExpenses / totalOutflow) * 100}%` : '0%' }}
            />
          </div>
        </div>

        {/* Suscripciones */}
        <div className="space-y-1">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Suscripciones ({data.subscriptions.length})</span>
            <span>{fmt(monthlySubscriptions)}</span>
          </div>
          <div className="h-1.5 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full rounded-full bg-blue-400 transition-all duration-700"
              style={{ width: totalOutflow > 0 ? `${(monthlySubscriptions / totalOutflow) * 100}%` : '0%' }}
            />
          </div>
        </div>
      </div>

      {/* ── Módulos ── */}
      <div className="space-y-2">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest px-1">Módulos</p>
        <ModuleCard
          href="/finance/expenses"
          icon={Receipt}
          iconBg="bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400"
          title="Gastos Operativos"
          description="Compras, insumos y costos logísticos"
          stat={loading ? '' : `${data.expenses.length} registros`}
        />
        <ModuleCard
          href="/finance/subscriptions"
          icon={CreditCard}
          iconBg="bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"
          title="Suscripciones y Servicios"
          description="Membresías recurrentes y próximos cobros"
          stat={loading ? '' : `${data.subscriptions.length} activas`}
        />
        <ModuleCard
          href="/finance/assets"
          icon={Laptop}
          iconBg="bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400"
          title="Activos y Equipo"
          description="Inventario, amortizaciones y hardware"
          stat={loading ? '' : `${data.assets.length} activos`}
        />
        <ModuleCard
          href="/finance/savings"
          icon={PiggyBank}
          iconBg="bg-pink-100 text-pink-600 dark:bg-pink-900/30 dark:text-pink-400"
          title="Ahorros y Reservas"
          description="Metas financieras y fondos de emergencia"
          stat={loading ? '' : `${data.savings.length} metas`}
        />
      </div>

      {/* ── FAB overlay backdrop ── */}
      {fabOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setFabOpen(false)}
        />
      )}

      {/* ── FAB mini-menu ── */}
      <div className={cn(
        'fixed bottom-6 right-5 z-50 flex flex-col items-end gap-2 transition-all duration-300',
        fabVisible ? 'translate-y-0 opacity-100' : 'translate-y-20 opacity-0 pointer-events-none'
      )}>
        {/* Action items */}
        <div className={cn(
          'flex flex-col items-end gap-2 transition-all duration-200',
          fabOpen ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'
        )}>
          {([
            { label: 'Nuevo Gasto',        icon: Receipt,   color: 'bg-orange-500 text-white', dialog: 'gasto' as DialogType },
            { label: 'Suscripción',         icon: CreditCard, color: 'bg-blue-500 text-white',   dialog: 'subscripcion' as DialogType },
            { label: 'Activo',              icon: Laptop,    color: 'bg-emerald-500 text-white', dialog: 'activo' as DialogType },
            { label: 'Meta de Ahorro',      icon: PiggyBank, color: 'bg-pink-500 text-white',    dialog: 'ahorro' as DialogType },
          ] as const).map(({ label, icon: Icon, color, dialog }) => (
            <button
              key={dialog}
              onClick={() => { setActiveDialog(dialog); setFabOpen(false); }}
              className={cn(
                'flex items-center gap-2.5 px-4 py-2.5 rounded-2xl shadow-lg text-sm font-semibold',
                'transition-all duration-150 active:scale-95 hover:brightness-110',
                color
              )}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>

        {/* Main FAB */}
        <button
          onClick={() => setFabOpen(v => !v)}
          className={cn(
            'w-14 h-14 rounded-full shadow-xl flex items-center justify-center',
            'bg-primary text-primary-foreground transition-all duration-200',
            'hover:brightness-110 active:scale-95',
            fabOpen && 'rotate-45'
          )}
        >
          {fabOpen ? <X className="w-6 h-6" /> : <Plus className="w-6 h-6" />}
        </button>
      </div>

      {/* ── Dialogs ── */}
      <ExpenseDialog
        open={activeDialog === 'gasto'}
        onOpenChange={o => !o && setActiveDialog(null)}
        type="operativo"
      />
      <ExpenseDialog
        open={activeDialog === 'subscripcion'}
        onOpenChange={o => !o && setActiveDialog(null)}
        type="subscripcion"
      />
      <ExpenseDialog
        open={activeDialog === 'activo'}
        onOpenChange={o => !o && setActiveDialog(null)}
        type="activo"
      />
      <SavingsDialog
        open={activeDialog === 'ahorro'}
        onOpenChange={o => !o && setActiveDialog(null)}
      />
    </div>
  );
}
