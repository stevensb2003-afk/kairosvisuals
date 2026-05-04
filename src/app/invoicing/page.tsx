'use client';

import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useFirestore, useCollection, useUser } from '@/firebase';
import {
  collection, getDocs, query, orderBy, collectionGroup, where
} from 'firebase/firestore';
import {
  format, startOfMonth, endOfMonth, parseISO,
  startOfWeek, endOfWeek, startOfYear, endOfYear,
  subWeeks, subMonths, subYears
} from 'date-fns';
import {
  Receipt, Plus, FileText, CheckCircle, Search,
  SlidersHorizontal, Loader2, ArrowUpRight, RefreshCw, Users
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { cn, formatCurrency } from '@/lib/utils';

import { STATUS_CONFIG } from './_utils/status';
import { InvoiceCard } from './_components/InvoiceCard';
import { InvoiceListTable } from './_components/InvoiceListTable';
import { FiltersSheet } from './_components/FiltersSheet';

export default function InvoicingPage() {
  const firestore = useFirestore();
  const { isUserLoading } = useUser();
  const router = useRouter();
  const searchParams = useSearchParams();

  // ── Data Fetching ──────────────────────────────────────────────────────────
  const clientsQuery = useMemo(() =>
    firestore && !isUserLoading ? collection(firestore, 'clients') : null,
  [firestore, isUserLoading]);
  const { data: clients } = useCollection<any>(clientsQuery);

  const usersQuery = useMemo(() =>
    firestore && !isUserLoading
      ? query(collection(firestore, 'users'), where('type', '==', 'client'))
      : null,
  [firestore, isUserLoading]);
  const { data: usersData } = useCollection<any>(usersQuery);

  const [allInvoices, setAllInvoices] = useState<any[]>([]);
  const [isLoadingInvoices, setIsLoadingInvoices] = useState(false);
  const [lastRefresh, setLastRefresh] = useState(0);

  const loadAllInvoices = useCallback(async () => {
    if (!firestore) return;
    setIsLoadingInvoices(true);
    try {
      const snap = await getDocs(
        query(collectionGroup(firestore, 'invoices'), orderBy('createdAt', 'desc'))
      );
      setAllInvoices(snap.docs.map(d => ({ id: d.id, _path: d.ref.path, ...d.data() })));
    } catch (err) {
      console.error('[Invoicing] Error:', err);
    } finally {
      setIsLoadingInvoices(false);
    }
  }, [firestore]);

  useEffect(() => { loadAllInvoices(); }, [loadAllInvoices, lastRefresh]);

  useEffect(() => {
    const shouldCreate = searchParams.get('create') === 'true';
    const cid = searchParams.get('clientId');
    if (shouldCreate) router.push(`/invoicing/create${cid ? `?clientId=${cid}` : ''}`);
  }, [searchParams, router]);

  // ── Filters ────────────────────────────────────────────────────────────────
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [datePreset, setDatePreset] = useState<string>('thisMonth');
  const [startDate, setStartDate] = useState<Date | undefined>(startOfMonth(new Date()));
  const [endDate, setEndDate] = useState<Date | undefined>(endOfMonth(new Date()));
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);

  useEffect(() => {
    const now = new Date();
    switch (datePreset) {
      case 'thisWeek':  setStartDate(startOfWeek(now, { weekStartsOn: 1 })); setEndDate(endOfWeek(now, { weekStartsOn: 1 })); break;
      case 'thisMonth': setStartDate(startOfMonth(now)); setEndDate(endOfMonth(now)); break;
      case 'thisYear':  setStartDate(startOfYear(now)); setEndDate(endOfYear(now)); break;
      case 'lastWeek':  { const lw = subWeeks(now, 1); setStartDate(startOfWeek(lw, { weekStartsOn: 1 })); setEndDate(endOfWeek(lw, { weekStartsOn: 1 })); break; }
      case 'lastMonth': { const lm = subMonths(now, 1); setStartDate(startOfMonth(lm)); setEndDate(endOfMonth(lm)); break; }
      case 'lastYear':  { const ly = subYears(now, 1); setStartDate(startOfYear(ly)); setEndDate(endOfYear(ly)); break; }
    }
  }, [datePreset]);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (statusFilter !== 'all') count++;
    if (datePreset !== 'thisMonth') count++;
    return count;
  }, [statusFilter, datePreset]);

  const handleResetFilters = () => {
    setStatusFilter('all');
    setDatePreset('thisMonth');
  };

  // ── FAB scroll-aware ───────────────────────────────────────────────────────
  const [fabVisible, setFabVisible] = useState(true);
  const lastScrollY = useRef(0);
  useEffect(() => {
    const onScroll = () => {
      const current = window.scrollY;
      setFabVisible(current < lastScrollY.current || current < 80);
      lastScrollY.current = current;
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // ── Derived Data ───────────────────────────────────────────────────────────
  const clientMap = useMemo(() => {
    const map: Record<string, any> = {};
    clients?.forEach((c: any) => { map[c.id] = c; });
    usersData?.forEach((u: any) => {
      const fullName = `${u.firstName || ''} ${u.lastName || ''}`.trim();
      const displayName = fullName || u.company || u.id;
      map[u.id] = map[u.id]
        ? { ...map[u.id], clientName: displayName, company: u.company }
        : { id: u.id, clientName: displayName, company: u.company };
    });
    return map;
  }, [clients, usersData]);

  const filteredInvoices = useMemo(() =>
    allInvoices.filter(inv => {
      if (statusFilter !== 'all' && inv.status !== statusFilter) return false;
      if (searchQuery) {
        const clientName = clientMap[inv.clientId]?.clientName || '';
        const q = searchQuery.toLowerCase();
        if (!inv.invoiceNumber?.toLowerCase().includes(q) && !clientName.toLowerCase().includes(q)) return false;
      }
      if (inv.createdAt && (startDate || endDate)) {
        const d = parseISO(inv.createdAt);
        if (startDate && d < startDate) return false;
        if (endDate && d > endDate) return false;
      }
      return true;
    }),
  [allInvoices, statusFilter, searchQuery, clientMap, startDate, endDate]);

  const stats = useMemo(() => {
    const valid = filteredInvoices.filter(i => i.status !== 'cancelled' && i.status !== 'draft');
    return {
      totalClients: clients?.filter((c: any) => !c.isArchived).length || 0,
      totalInvoiced: valid.reduce((s, i) => s + (i.totalAmount || 0), 0),
      totalReceived: valid.reduce((s, i) => s + (i.amountPaid || 0), 0),
    };
  }, [clients, filteredInvoices]);

  return (
    <div className="space-y-5 pb-28 sm:pb-6">
      {/* ── Header ────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold font-headline flex items-center gap-2.5">
            <Receipt className="w-6 h-6 sm:w-7 sm:h-7 text-primary" />
            Facturador
          </h1>
          <p className="text-muted-foreground mt-0.5 text-xs sm:text-sm">
            Gestiona y genera facturas. Modelo T&C §2 — 50/50.
          </p>
        </div>
        <Button onClick={() => router.push('/invoicing/create')} className="hidden sm:flex gap-2" size="sm">
          <Plus className="w-4 h-4" /> Nueva Factura
        </Button>
      </div>

      {/* ── Hero KPI Cards ──────────────────────────────────────────────────── */}
      {/* "Facturado" is the hero, takes full width; Recibido + Clientes split below */}
      <div className="space-y-2.5">
        {/* Hero: Facturado */}
        <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10 overflow-hidden relative">
          <CardContent className="pt-4 pb-4 px-5 flex items-center justify-between gap-4">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-widest text-primary/70 mb-1">
                Total Facturado
              </p>
              <p className="text-3xl sm:text-4xl font-black tabular-nums text-primary leading-none">
                {formatCurrency(stats.totalInvoiced)}
              </p>
              <p className="text-xs text-muted-foreground mt-1.5">
                {filteredInvoices.filter(i => i.status !== 'cancelled' && i.status !== 'draft').length} facturas activas
              </p>
            </div>
            <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
              <Receipt className="w-7 h-7 text-primary" />
            </div>
          </CardContent>
        </Card>

        {/* Secondary: Recibido + Clientes */}
        <div className="grid grid-cols-2 gap-2.5">
          <Card className="border-emerald-500/20 bg-emerald-500/5">
            <CardContent className="pt-3 pb-3 px-4">
              <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-emerald-600 mb-1.5">
                <CheckCircle className="w-3.5 h-3.5 shrink-0" />
                Recibido
              </div>
              <p className="text-xl sm:text-2xl font-black tabular-nums text-emerald-600 leading-none">
                {formatCurrency(stats.totalReceived)}
              </p>
              {stats.totalInvoiced > 0 && (
                <p className="text-[10px] text-emerald-600/60 mt-1 font-medium">
                  {Math.round((stats.totalReceived / stats.totalInvoiced) * 100)}% cobrado
                </p>
              )}
            </CardContent>
          </Card>
          <Card className="border-blue-500/20 bg-blue-500/5">
            <CardContent className="pt-3 pb-3 px-4">
              <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-blue-500 mb-1.5">
                <Users className="w-3.5 h-3.5 shrink-0" />
                Clientes
              </div>
              <p className="text-4xl font-black tabular-nums text-blue-500 leading-none">
                {stats.totalClients}
              </p>
              <p className="text-[10px] text-blue-500/60 mt-1 font-medium">activos</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* ── Invoice List ─────────────────────────────────────────────────────── */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base sm:text-lg font-bold flex items-center gap-2">
            <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground" />
            Historial de Facturas
          </h2>
          <Button
            variant="ghost" size="icon"
            className="w-8 h-8 text-muted-foreground hover:text-foreground"
            onClick={() => setLastRefresh(Date.now())}
          >
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>

        {/* ── Search + Filter Bar ──────────────────────────────────────────── */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <Input
              placeholder="Buscar factura o cliente..."
              className="pl-9 bg-card/60 border-border/40 h-10"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
          <Button
            variant="outline"
            size="default"
            className={cn(
              'h-10 gap-2 px-3.5 shrink-0 border-border/40 bg-card/60',
              activeFilterCount > 0 && 'border-primary/40 text-primary bg-primary/5'
            )}
            onClick={() => setIsFiltersOpen(true)}
          >
            <SlidersHorizontal className="w-4 h-4" />
            <span className="hidden sm:inline text-sm">Filtros</span>
            {activeFilterCount > 0 && (
              <Badge className="h-5 w-5 p-0 flex items-center justify-center text-[10px] font-bold rounded-full">
                {activeFilterCount}
              </Badge>
            )}
          </Button>
        </div>

        {/* Active filter pills — desktop summary */}
        {activeFilterCount > 0 && (
          <div className="hidden sm:flex items-center gap-2 flex-wrap">
            {statusFilter !== 'all' && (
              <Badge variant="secondary" className="gap-1.5 text-xs font-medium">
                {STATUS_CONFIG[statusFilter]?.label || statusFilter}
              </Badge>
            )}
            {datePreset !== 'thisMonth' && datePreset !== 'custom' && (
              <Badge variant="secondary" className="gap-1.5 text-xs font-medium">
                {{
                  thisWeek: 'Esta Semana',
                  thisYear: 'Este Año',
                  lastWeek: 'Sem. Pasada',
                  lastMonth: 'Mes Pasado',
                  lastYear: 'Año Anterior',
                }[datePreset] || datePreset}
              </Badge>
            )}
            <button
              onClick={handleResetFilters}
              className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-2 transition-colors"
            >
              Limpiar
            </button>
          </div>
        )}

        {/* List Content */}
        {isLoadingInvoices ? (
          <div className="space-y-2">
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-[120px] w-full rounded-xl" />)}
          </div>
        ) : filteredInvoices.length === 0 ? (
          <div className="text-center py-16 rounded-xl border border-border/30 bg-card/40">
            <FileText className="w-10 h-10 text-muted-foreground/20 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">
              {searchQuery || activeFilterCount > 0
                ? 'Sin resultados para este filtro.'
                : 'No hay facturas registradas aún.'}
            </p>
          </div>
        ) : (
          <div className="rounded-xl border border-border/30 bg-card/60 overflow-hidden">
            {/* Mobile: cards */}
            <div className="block sm:hidden divide-y divide-border/30">
              {filteredInvoices.map(inv => (
                <InvoiceCard key={inv.id} inv={inv} client={clientMap[inv.clientId]} />
              ))}
            </div>
            {/* Desktop: table */}
            <div className="hidden sm:block">
              <InvoiceListTable invoices={filteredInvoices} clientMap={clientMap} />
            </div>
          </div>
        )}
      </div>

      {/* ── Filters Bottom Sheet ─────────────────────────────────────────────── */}
      <FiltersSheet
        open={isFiltersOpen}
        onOpenChange={setIsFiltersOpen}
        datePreset={datePreset}
        setDatePreset={setDatePreset}
        startDate={startDate}
        setStartDate={setStartDate}
        endDate={endDate}
        setEndDate={setEndDate}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        activeFilterCount={activeFilterCount}
        onReset={handleResetFilters}
      />

      {/* ── Mobile FAB (scroll-aware) ────────────────────────────────────────── */}
      <div
        className={cn(
          'fixed bottom-20 right-4 z-40 sm:hidden transition-all duration-300',
          fabVisible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0 pointer-events-none'
        )}
      >
        <Button
          onClick={() => router.push('/invoicing/create')}
          size="lg"
          className="h-14 w-14 rounded-full shadow-2xl shadow-primary/40 p-0"
        >
          <Plus className="w-6 h-6" />
        </Button>
      </div>
    </div>
  );
}
