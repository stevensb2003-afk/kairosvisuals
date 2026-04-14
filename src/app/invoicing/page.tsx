'use client';

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useFirestore, useCollection, useUser } from '@/firebase';
import { collection, doc, addDoc, updateDoc, query, orderBy, collectionGroup, getDocs, onSnapshot, where } from 'firebase/firestore';
import { format, startOfMonth, endOfMonth, isWithinInterval, parseISO, startOfWeek, endOfWeek, startOfYear, endOfYear, subWeeks, subMonths, subYears } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  Receipt, Plus, FileText, CheckCircle, Clock, AlertCircle, XCircle,
  Eye, Send, ShieldCheck, Share, Download, Calendar as CalendarIcon,
  Filter, Search, Loader2, ArrowUpRight, ArrowRight,
  Trash2, Package, Layers, RefreshCw
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { cn, formatCurrency } from '@/lib/utils';
import { PremiumDatePicker } from '@/components/ui/premium-date-picker';

// ── Helpers ─────────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  draft:                { label: 'Borrador',        color: 'bg-slate-500/10 text-slate-500 border-slate-500/20',   icon: <FileText className="w-3.5 h-3.5" /> },
  sent:                 { label: 'Enviada',          color: 'bg-blue-500/10 text-blue-600 border-blue-500/20',      icon: <Send className="w-3.5 h-3.5" /> },
  partially_paid:       { label: 'Parcialmente Pagada', color: 'bg-amber-500/10 text-amber-600 border-amber-500/20', icon: <Clock className="w-3.5 h-3.5" /> },
  pending_verification: { label: 'Verificando Pago', color: 'bg-violet-500/10 text-violet-600 border-violet-500/20', icon: <ShieldCheck className="w-3.5 h-3.5" /> },
  paid:                 { label: 'Pagada',           color: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20', icon: <CheckCircle className="w-3.5 h-3.5" /> },
  overdue:              { label: 'Vencida',          color: 'bg-red-500/10 text-red-600 border-red-500/20',         icon: <AlertCircle className="w-3.5 h-3.5" /> },
  cancelled:            { label: 'Cancelada',        color: 'bg-muted text-muted-foreground border-border',         icon: <XCircle className="w-3.5 h-3.5" /> },
};

function generateInvoiceNumber(): string {
  const year = new Date().getFullYear();
  const month = String(new Date().getMonth() + 1).padStart(2, '0');
  const random = Math.floor(Math.random() * 9000) + 1000;
  return `KV-${year}${month}-${random}`;
}

// ── Componente principal ─────────────────────────────────────────────────────

export default function InvoicingPage() {
  const firestore = useFirestore();
  const { isUserLoading } = useUser();

  // Todos los clientes
  const clientsQuery = useMemo(() =>
    firestore && !isUserLoading ? collection(firestore, 'clients') : null,
  [firestore, isUserLoading]);
  const { data: clients, isLoading: isLoadingClients } = useCollection<any>(clientsQuery);

  // Clientes desde la colección users para nombres reales
  const usersQuery = useMemo(() =>
    firestore && !isUserLoading ? query(collection(firestore, 'users'), where('type', '==', 'client')) : null,
  [firestore, isUserLoading]);
  const { data: usersData } = useCollection<any>(usersQuery);

  // Historial de facturas (collectionGroup sobre todos los invoices)
  const [allInvoices, setAllInvoices] = useState<any[]>([]);
  const [isLoadingInvoices, setIsLoadingInvoices] = useState(false);
  const [lastInvoiceRefresh, setLastInvoiceRefresh] = useState(0);

  // Servicios
  const servicesQuery = useMemo(() =>
    firestore && !isUserLoading ? collection(firestore, 'services') : null,
  [firestore, isUserLoading]);
  const { data: services, isLoading: isLoadingServices } = useCollection<any>(servicesQuery);

  // Configuraciones generales (IVA)
  const [settings, setSettings] = useState<any>(null);
  React.useEffect(() => {
    if (!firestore) return;
    const unsub = onSnapshot(doc(firestore, 'settings', 'general'), (snap) => {
      if (snap.exists()) setSettings(snap.data());
    });
    return () => unsub();
  }, [firestore]);

  const loadAllInvoices = useCallback(async () => {
    if (!firestore) return;
    setIsLoadingInvoices(true);
    try {
      const snap = await getDocs(query(collectionGroup(firestore, 'invoices'), orderBy('createdAt', 'desc')));
      setAllInvoices(snap.docs.map(d => ({ id: d.id, _path: d.ref.path, ...d.data() })));
    } catch(err) {
      console.error('[Invoicing] Error cargando facturas:', err);
    } finally {
      setIsLoadingInvoices(false);
    }
  }, [firestore]);

  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    loadAllInvoices();
  }, [loadAllInvoices, lastInvoiceRefresh]);

  // Handle auto-open for invoice creation from query params
  useEffect(() => {
    const shouldCreate = searchParams.get('create') === 'true';
    const cid = searchParams.get('clientId');
    if (shouldCreate) {
      router.push(`/invoicing/create${cid ? `?clientId=${cid}` : ''}`);
    }
  }, [searchParams, router]);

  // ── Estado local ────────────────────────────────────────────────────────
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [datePreset, setDatePreset] = useState<string>('thisMonth');
  
  // Rango de fechas
  const [startDate, setStartDate] = useState<Date | undefined>(startOfMonth(new Date()));
  const [endDate, setEndDate] = useState<Date | undefined>(endOfMonth(new Date()));

  // Efecto para aplicar preset
  useEffect(() => {
    const now = new Date();
    switch (datePreset) {
      case 'thisWeek':
        setStartDate(startOfWeek(now, { weekStartsOn: 1 }));
        setEndDate(endOfWeek(now, { weekStartsOn: 1 }));
        break;
      case 'thisMonth':
        setStartDate(startOfMonth(now));
        setEndDate(endOfMonth(now));
        break;
      case 'thisYear':
        setStartDate(startOfYear(now));
        setEndDate(endOfYear(now));
        break;
      case 'lastWeek':
        const lw = subWeeks(now, 1);
        setStartDate(startOfWeek(lw, { weekStartsOn: 1 }));
        setEndDate(endOfWeek(lw, { weekStartsOn: 1 }));
        break;
      case 'lastMonth':
        const lm = subMonths(now, 1);
        setStartDate(startOfMonth(lm));
        setEndDate(endOfMonth(lm));
        break;
      case 'lastYear':
        const ly = subYears(now, 1);
        setStartDate(startOfYear(ly));
        setEndDate(endOfYear(ly));
        break;
      case 'custom':
        // no auto-update here, user picks manually
        break;
    }
  }, [datePreset]);

  // ── Helpers de cliente ─────────────────────────────────────────────────
  const clientMap = useMemo(() => {
    const map: any = {};
    if (clients) {
      clients.forEach((c: any) => { map[c.id] = c; });
    }
    if (usersData) {
      usersData.forEach((u: any) => {
        const fullName = `${u.firstName || ''} ${u.lastName || ''}`.trim();
        const displayName = fullName || u.company || u.id;
        if (map[u.id]) {
          map[u.id] = { ...map[u.id], clientName: displayName, company: u.company };
        } else {
          map[u.id] = { id: u.id, clientName: displayName, company: u.company, _isLeadOnly: true };
        }
      });
    }
    return map;
  }, [clients, usersData]);

  // Clientes para dropdown (solo los que están en la colección 'clients' o todos?)
  // El facturador actual parece requerir que estén en 'clients' para procesos de facturación recurrentes,
  // pero una factura libre podría ser para cualquier cliente. 
  // Por ahora mostraremos todos los que tienen perfil de usuario cliente.
  const selectableClients = useMemo(() => {
    return Object.values(clientMap).sort((a: any, b: any) => 
      (a.clientName || '').localeCompare(b.clientName || '')
    );
  }, [clientMap]);

  // ── Facturas filtradas ──────────────────────────────────────────────────
  const filteredInvoices = useMemo(() => {
    return allInvoices.filter(inv => {
      // Status Filter
      const matchesStatus = statusFilter === 'all' || inv.status === statusFilter;
      
      // Search Filter
      const clientName = clientMap[inv.clientId]?.clientName || '';
      const matchesSearch = !searchQuery ||
        inv.invoiceNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        clientName.toLowerCase().includes(searchQuery.toLowerCase());
        
      // Date Filter
      let matchesDate = true;
      if (inv.createdAt) {
          const invDate = parseISO(inv.createdAt);
          if (startDate && endDate) {
              matchesDate = invDate >= startDate && invDate <= endDate;
          } else if (startDate) {
              matchesDate = invDate >= startDate;
          } else if (endDate) {
              matchesDate = invDate <= endDate;
          }
      }

      return matchesStatus && matchesSearch && matchesDate;
    });
  }, [allInvoices, statusFilter, searchQuery, clientMap, startDate, endDate]);

  const stats = useMemo(() => {
    const validInvoices = filteredInvoices.filter(i => i.status !== 'cancelled' && i.status !== 'draft');
    
    return {
      totalClients: clients?.length || 0,
      totalInvoiced: validInvoices.reduce((sum, i) => sum + (i.totalAmount || 0), 0),
      totalReceived: validInvoices.reduce((sum, i) => sum + (i.amountPaid || 0), 0)
    };
  }, [clients, filteredInvoices]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-headline flex items-center gap-3">
            <Receipt className="w-7 h-7 text-primary" />
            Facturador
          </h1>
          <p className="text-muted-foreground mt-1">Genera y gestiona facturas. Modelo T&C §2 — 50/50.</p>
        </div>
        <Button onClick={() => router.push('/invoicing/create')} className="gap-2">
          <Plus className="w-4 h-4" />
          Nueva Factura Libre
        </Button>
      </div>

      {/* Resumen Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: 'Cartera de Clientes', value: stats.totalClients, icon: <ArrowUpRight className="w-4 h-4" />, color: 'text-blue-500' },
          { label: 'Total Facturado', value: formatCurrency(stats.totalInvoiced), icon: <span className="w-4 h-4 flex items-center justify-center font-bold">₡</span>, color: 'text-primary', isAmount: true },
          { label: 'Total Recibido (Pagos)', value: formatCurrency(stats.totalReceived), icon: <CheckCircle className="w-4 h-4" />, color: 'text-emerald-500', isAmount: true },
        ].map(stat => (
          <Card key={stat.label} className="border-border/40 bg-card/60">
            <CardContent className="pt-4 pb-4">
              <div className={cn("flex items-center gap-1.5 text-xs font-medium mb-1.5", stat.color)}>
                {stat.icon}
                {stat.label}
              </div>
              <p className={cn("font-bold", stat.isAmount ? 'text-2xl' : 'text-3xl')}>{stat.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Historial de Facturas */}
      <div className="mt-8 space-y-4">
        <h2 className="text-lg font-bold flex items-center gap-2">
          <FileText className="w-5 h-5 text-muted-foreground" />
          Historial de Facturas
        </h2>
        <div className="flex flex-col sm:flex-wrap lg:flex-row gap-3">
          <Select value={datePreset} onValueChange={setDatePreset}>
            <SelectTrigger className="w-full sm:w-40 bg-card/60 border-border/40">
              <CalendarIcon className="w-3.5 h-3.5 mr-2 text-muted-foreground" />
              <SelectValue placeholder="Periodo" />
            </SelectTrigger>
            <SelectContent className="min-w-[320px] p-2">
              <div className="grid grid-cols-2 gap-1 mb-1">
                <div className="space-y-1">
                  <p className="px-2 py-1 text-[10px] font-bold uppercase text-muted-foreground/60 tracking-wider">Actual</p>
                  <SelectItem value="thisWeek">Esta Semana</SelectItem>
                  <SelectItem value="thisMonth">Este Mes</SelectItem>
                  <SelectItem value="thisYear">Este Año</SelectItem>
                </div>
                <div className="space-y-1">
                  <p className="px-2 py-1 text-[10px] font-bold uppercase text-muted-foreground/60 tracking-wider">Pasado</p>
                  <SelectItem value="lastWeek">Semana Pasada</SelectItem>
                  <SelectItem value="lastMonth">Mes Pasado</SelectItem>
                  <SelectItem value="lastYear">Año Anterior</SelectItem>
                </div>
              </div>
              <Separator className="my-1" />
              <SelectItem value="custom">Personalizado / Libre</SelectItem>
            </SelectContent>
          </Select>
          <div className="flex gap-2">
            <div className="w-36">
              <PremiumDatePicker
                date={startDate}
                onSelect={(d) => { setStartDate(d); setDatePreset('custom'); }}
                placeholder="Desde"
              />
            </div>
            <div className="w-36">
              <PremiumDatePicker
                date={endDate}
                onSelect={(d) => { setEndDate(d); setDatePreset('custom'); }}
                placeholder="Hasta"
              />
            </div>
          </div>
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <Input
              placeholder="Buscar por # de factura o cliente..."
              className="pl-9 bg-card/60 border-border/40"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-48 bg-card/60 border-border/40">
              <Filter className="w-3.5 h-3.5 mr-2 text-muted-foreground" />
              <SelectValue placeholder="Todos los estados" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los estados</SelectItem>
              {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
                <SelectItem key={key} value={key}>{cfg.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {isLoadingInvoices ? (
          <div className="space-y-2">
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-16 w-full" />)}
          </div>
        ) : filteredInvoices.length === 0 ? (
          <div className="text-center py-16">
            <FileText className="w-10 h-10 text-muted-foreground/20 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">
              {searchQuery || statusFilter !== 'all' ? 'Sin resultados para este filtro.' : 'No hay facturas registradas aún.'}
            </p>
          </div>
        ) : (
          <div className="border border-border/30 rounded-xl overflow-hidden bg-card/60">
            <Table>
              <TableHeader className="bg-secondary/30">
                <TableRow>
                  <TableHead className="w-[150px]"># Factura</TableHead>
                  <TableHead>Emisión</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead className="text-right">Total Facturado</TableHead>
                  <TableHead className="text-right">Balance Due</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredInvoices.map((inv) => {
                  const cfg = STATUS_CONFIG[inv.status] || STATUS_CONFIG.draft;
                  const client = clientMap[inv.clientId];
                  const balanceDue = Math.max(0, (inv.totalAmount || 0) - (inv.amountPaid || 0));

                  return (
                    <TableRow key={inv.id} className="hover:bg-secondary/20 transition-colors">
                      <TableCell className="font-semibold align-middle">
                        <div className="flex items-center gap-2">
                           {inv.invoiceNumber}
                           {inv.isPlanInvoice && <Badge variant="secondary" className="px-1 py-0 text-[9px] uppercase bg-amber-500/10 text-amber-600 border-amber-500/20"><RefreshCw className="w-3 h-3 mr-1"/>Ciclo</Badge>}
                        </div>
                      </TableCell>
                      <TableCell className="align-middle whitespace-nowrap text-muted-foreground text-sm">
                        {inv.createdAt ? format(parseISO(inv.createdAt), 'dd/MM/yyyy') : '—'}
                      </TableCell>
                      <TableCell className="align-middle">
                         <p className="flex items-center gap-2 font-medium">
                            {client?.clientName || 'Cliente desconocido'}
                         </p>
                      </TableCell>
                      <TableCell className="text-right align-middle font-bold tabular-nums">
                        {formatCurrency(inv.totalAmount || 0)}
                      </TableCell>
                      <TableCell className="text-right align-middle">
                        <span className={cn("font-medium tabular-nums", balanceDue > 0 && inv.status !== 'cancelled' ? "text-amber-500" : "text-muted-foreground")}>
                           {formatCurrency(balanceDue)}
                        </span>
                      </TableCell>
                      <TableCell className="align-middle">
                        <Badge variant="outline" className={cn('gap-1', cfg.color)}>
                          {cfg.icon}
                          {cfg.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right align-middle">
                        <Button 
                           variant="ghost" 
                           size="sm" 
                           className="h-8 transition-colors text-primary hover:bg-primary/10 gap-1.5"
                           onClick={() => router.push(`/invoicing/${inv.id}?clientId=${inv.clientId}`)}
                        >
                           Modificar / Ver
                           <ArrowRight className="w-3.5 h-3.5" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

    </div>
  );
}
