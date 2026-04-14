'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { 
  Users, LayoutDashboard, Clock, FileText, 
  TrendingUp, CircleDollarSign, Plus, ArrowRight, Activity, Zap, RefreshCw, Settings, Inbox, Receipt
} from 'lucide-react';
import { useUser, useFirestore } from '@/firebase';
import { collection, getDocs, query, where, collectionGroup } from 'firebase/firestore';
import { formatCurrency } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { format, subMonths, isSameMonth, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

export default function Home() {
  const { user } = useUser();
  const firestore = useFirestore();
  const router = useRouter();

  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [metrics, setMetrics] = useState({
    activeClients: 0,
    pendingLeads: 0,
    monthlyRevenue: 0,
    totalPerceived: 0
  });
  const [recentInvoices, setRecentInvoices] = useState<any[]>([]);
  const [revenueData, setRevenueData] = useState<any[]>([]);

  const fetchDashboardData = async (isManual = false) => {
    if (!firestore) return;
    
    try {
      if (isManual) setIsRefreshing(true);
      else setIsLoading(true);

      const clientsSnap = await getDocs(collection(firestore, 'clients'));
      const activeClients = clientsSnap.size;

      const leadsQuery = query(collection(firestore, 'requests'), where('status', '==', 'pending'));
      const leadsSnap = await getDocs(leadsQuery);
      const pendingLeads = leadsSnap.size;

      const invoicesSnap = await getDocs(collectionGroup(firestore, 'invoices'));
      let monthlyTotal = 0;
      let lifetimeTotal = 0;
      const now = new Date();
      const past6Months = Array.from({length: 6}).map((_, i) => subMonths(now, 5 - i));
      
      // Formatter for month name e.g., 'Ene', 'Feb'
      const revenueMap: Record<string, number> = {};
      past6Months.forEach(d => {
        revenueMap[format(d, 'MMM', { locale: es })] = 0;
      });

      const allInvoices = invoicesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() as any }));
      
      allInvoices.forEach(inv => {
        const payments = inv.payments || [];
        payments.forEach((payment: any) => {
          const payDate = payment.date ? new Date(payment.date) : new Date();
          const amount = Number(payment.amount) || 0;
          
          lifetimeTotal += amount;
          
          if (isSameMonth(payDate, now)) {
            monthlyTotal += amount;
          }

          // Map data to chart
          const monthKey = format(payDate, 'MMM', { locale: es });
          if (revenueMap[monthKey] !== undefined) {
            revenueMap[monthKey] += amount;
          }
        });
      });

      // Convert map to array for chart
      const chartData = Object.keys(revenueMap).map(key => ({
        name: key.charAt(0).toUpperCase() + key.slice(1),
        ingresos: revenueMap[key]
      }));

      setMetrics({
        activeClients,
        pendingLeads,
        monthlyRevenue: monthlyTotal,
        totalPerceived: lifetimeTotal
      });
      
      setRevenueData(chartData);

      // Sort for recent activity (paid or recently created invoices)
      const sortedInvoices = allInvoices
        .filter(inv => inv.status !== 'draft')
        .sort((a, b) => {
          const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return dateB - dateA;
        })
        .slice(0, 4);

      setRecentInvoices(sortedInvoices);

    } catch (error) {
      console.error("Dashboard dataload error", error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [firestore]);

  const firstName = user?.displayName ? user.displayName.split(' ')[0] : 'Equipo';

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-12 overflow-x-hidden max-w-[1400px] mx-auto">
      
      {/* Header Area */}
      <div className="flex flex-col md:flex-row justify-between items-start lg:items-end gap-6 relative">
        <div className="absolute top-0 left-10 w-96 h-96 bg-primary/20 rounded-full blur-[100px] -z-10 opacity-60"></div>
        <div className="absolute top-20 right-20 w-72 h-72 bg-emerald-500/10 rounded-full blur-[100px] -z-10 opacity-50"></div>

        <div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-widest mb-3 border border-primary/20">
             <Activity className="w-3.5 h-3.5" /> Torre de Control
          </span>
          <h1 className="text-4xl md:text-5xl font-black font-headline tracking-tighter text-foreground mb-2">
             Hola, <span className="text-primary bg-clip-text text-transparent bg-gradient-to-r from-primary to-indigo-400">{firstName}</span> 🚀
          </h1>
          <p className="text-muted-foreground text-lg md:text-xl font-medium max-w-xl">
             Bienvenido a tu hub central. Aquí tienes el pulso de las operaciones creativas y financieras.
          </p>
        </div>
        
        <div className="flex flex-wrap lg:flex-nowrap items-center gap-3 bg-muted/30 p-2 rounded-2xl border border-border/50 backdrop-blur-md shadow-xl">
           {/* Quick Actions Mode */}
           <Button size="sm" variant="ghost" className="rounded-xl flex-1 md:flex-none justify-start md:justify-center px-4 py-5 hover:bg-background/80 hover:text-primary transition-all font-bold gap-2" onClick={() => router.push('/clients')}>
             <Users className="w-4 h-4 text-blue-500" /> Clientes
           </Button>
           <Button size="sm" variant="ghost" className="rounded-xl flex-1 md:flex-none justify-start md:justify-center px-4 py-5 hover:bg-background/80 hover:text-primary transition-all font-bold gap-2" onClick={() => router.push('/requests')}>
             <Inbox className="w-4 h-4 text-amber-500" /> Leads
           </Button>
           <Button size="sm" variant="ghost" className="rounded-xl flex-1 md:flex-none justify-start md:justify-center px-4 py-5 hover:bg-background/80 hover:text-primary transition-all font-bold gap-2" onClick={() => router.push('/solicitudes/create')}>
             <FileText className="w-4 h-4 text-orange-500" /> Cotizar
           </Button>
           <Button size="sm" variant="ghost" className="rounded-xl flex-1 md:flex-none justify-start md:justify-center px-4 py-5 hover:bg-background/80 hover:text-primary transition-all font-bold gap-2" onClick={() => router.push('/invoicing')}>
             <Receipt className="w-4 h-4 text-emerald-500" /> Facturación
           </Button>
           
           <div className="w-[1px] h-8 bg-border hidden md:block mx-1"></div>
           
           <Button 
             size="sm" 
             variant="outline" 
             className="rounded-xl px-4 py-5 font-bold gap-2 flex-1 md:flex-none" 
             onClick={() => fetchDashboardData(true)}
             disabled={isLoading || isRefreshing}
           >
             <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-primary' : ''}`} /> 
             <span className="hidden md:inline">Refrescar</span>
           </Button>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        
        <Card className="border-border/40 shadow-sm bg-card/40 backdrop-blur-md relative overflow-hidden group hover:border-primary/30 transition-all hover:-translate-y-1 duration-300">
          <div className="absolute top-0 right-0 p-4 opacity-10 blur-xl group-hover:opacity-30 transition-opacity bg-primary w-24 h-24 rounded-bl-full"></div>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
               <CircleDollarSign className="w-4 h-4 text-emerald-500" /> Ingreso Mes Actual
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black tabular-nums tracking-tighter text-emerald-500/90 dark:text-emerald-400">
               {isLoading ? '...' : formatCurrency(metrics.monthlyRevenue)}
            </div>
            <p className="text-xs text-muted-foreground font-semibold mt-1">Percibido (Cobrado) en este mes</p>
          </CardContent>
        </Card>

        <Card className="border-border/40 shadow-sm bg-card/40 backdrop-blur-md relative overflow-hidden group hover:border-primary/30 transition-all hover:-translate-y-1 duration-300">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
               <TrendingUp className="w-4 h-4 text-primary" /> Ingreso Histórico
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black tabular-nums tracking-tighter text-foreground">
               {isLoading ? '...' : formatCurrency(metrics.totalPerceived)}
            </div>
            <p className="text-xs text-muted-foreground font-semibold mt-1">Total acumulado histórico</p>
          </CardContent>
        </Card>

        <Card className="border-border/40 shadow-sm bg-card/40 backdrop-blur-md relative overflow-hidden group hover:border-primary/30 transition-all hover:-translate-y-1 duration-300">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
               <Users className="w-4 h-4 text-blue-500" /> Clientes Activos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black tabular-nums tracking-tighter text-blue-500 dark:text-blue-400">
               {isLoading ? '...' : metrics.activeClients}
            </div>
            <p className="text-xs text-muted-foreground font-semibold mt-1">En el ecosistema Kairos</p>
          </CardContent>
        </Card>

        <Card className="border-border/40 shadow-sm bg-card/40 backdrop-blur-md relative overflow-hidden group hover:border-primary/30 transition-all hover:-translate-y-1 duration-300">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
               <FileText className="w-4 h-4 text-amber-500" /> Leads Pendientes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
                <div className="text-3xl font-black tabular-nums tracking-tighter text-amber-500 dark:text-amber-400">
                  {isLoading ? '...' : metrics.pendingLeads}
                </div>
                {metrics.pendingLeads > 0 && !isLoading && (
                  <span className="flex h-3 w-3 rounded-full bg-amber-500 animate-ping opacity-75"></span>
                )}
            </div>
            <p className="text-xs text-muted-foreground font-semibold mt-1">Briefings esperando revisión</p>
          </CardContent>
        </Card>

      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Main Analytics Chart */}
        <Card className="md:col-span-2 border-border/40 shadow-sm bg-card/40 backdrop-blur-md flex flex-col">
          <CardHeader className="pb-0 border-b border-white/5 mb-4">
             <CardTitle className="text-lg font-bold flex justify-between items-center bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/60 w-fit">
                Evolución de Ingresos Percibidos (6 Meses)
             </CardTitle>
             <CardDescription className="text-muted-foreground/80 font-medium pb-4">
                El gráfico refleja el dinero real ingresado (abonos/pagos).
             </CardDescription>
          </CardHeader>
          <CardContent className="flex-1 pb-6 pt-2">
             <div className="h-[280px] w-full">
               {isLoading ? (
                  <div className="w-full h-full flex items-center justify-center bg-primary/5 rounded-xl border border-primary/10">
                     <span className="animate-pulse text-primary font-bold">Analizando datos históricos...</span>
                  </div>
               ) : (
                 <ResponsiveContainer width="100%" height="100%">
                   <AreaChart data={revenueData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                     <defs>
                       <linearGradient id="colorIngresos" x1="0" y1="0" x2="0" y2="1">
                         <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.4}/>
                         <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                       </linearGradient>
                     </defs>
                     <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} opacity={0.5} />
                     <XAxis 
                        dataKey="name" 
                        stroke="hsl(var(--muted-foreground))" 
                        fontSize={12} 
                        tickLine={false}
                        axisLine={false}
                     />
                     <YAxis 
                        stroke="hsl(var(--muted-foreground))" 
                        fontSize={12} 
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(value) => `₡${(value / 1000).toFixed(0)}k`}
                     />
                     <Tooltip 
                       contentStyle={{ 
                          backgroundColor: 'hsl(var(--background))', 
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '12px',
                          color: 'hsl(var(--foreground))',
                          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5)'
                       }}
                       cursor={{ stroke: 'hsl(var(--primary))', strokeWidth: 1, strokeDasharray: '4 4' }}
                       formatter={(value: number) => [formatCurrency(value), 'Ingreso']}
                       labelStyle={{ fontWeight: 'bold', marginBottom: '4px' }}
                     />
                     <Area 
                        type="monotone" 
                        dataKey="ingresos" 
                        stroke="hsl(var(--primary))" 
                        strokeWidth={4}
                        fillOpacity={1} 
                        fill="url(#colorIngresos)" 
                        activeDot={{ r: 6, fill: "hsl(var(--background))", stroke: "hsl(var(--primary))", strokeWidth: 3 }}
                     />
                   </AreaChart>
                 </ResponsiveContainer>
               )}
             </div>
          </CardContent>
        </Card>

        {/* Recent Activity / Fast Access */}
        <div className="space-y-6 flex flex-col">
          <Card className="border-border/40 shadow-sm bg-card/40 backdrop-blur-md flex-1">
            <CardHeader className="pb-4">
              <CardTitle className="text-sm uppercase tracking-widest text-muted-foreground font-black flex items-center gap-2">
                 <Activity className="w-4 h-4" /> Pulse: Facturas Recientes
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
               {isLoading ? (
                  <div className="space-y-3">
                     {[1,2,3].map(i => <div key={i} className="h-12 bg-muted/40 rounded-xl animate-pulse"></div>)}
                  </div>
               ) : recentInvoices.length === 0 ? (
                  <div className="h-32 border border-dashed rounded-xl flex items-center justify-center bg-background/50">
                     <p className="text-xs text-muted-foreground font-semibold">No hay movimientos recientes.</p>
                  </div>
               ) : (
                  recentInvoices.map((inv) => (
                    <div 
                      key={inv.id} 
                      className="group flex gap-3 p-3 rounded-xl hover:bg-primary/10 border border-transparent hover:border-primary/20 transition-all cursor-pointer"
                      onClick={() => router.push(`/invoicing/${inv.id}?clientId=${inv.clientId}`)}
                    >
                       <div className="w-10 h-10 rounded-full bg-background border border-border flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                          <ReceiptIcon status={inv.status} />
                       </div>
                       <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold truncate group-hover:text-primary transition-colors">
                            {inv.concept || `Factura #${inv.invoiceNumber}`}
                          </p>
                          <p className="text-[11px] text-muted-foreground truncate uppercase font-semibold">
                            {inv.createdAt ? format(parseISO(inv.createdAt), "dd MMM", { locale: es }) : ''} · {inv.status === 'paid' ? 'Pagada' : inv.status === 'partially_paid' ? 'Abonos' : 'Pendiente'}
                          </p>
                       </div>
                       <div className="text-right shrink-0">
                          <p className="text-sm font-black text-foreground">{formatCurrency(inv.totalAmount)}</p>
                       </div>
                    </div>
                  ))
               )}
               
               <Button variant="ghost" className="w-full mt-2 text-xs font-bold text-muted-foreground hover:text-primary gap-1" onClick={() => router.push('/invoicing')}>
                  Ver todo el historial <ArrowRight className="w-3 h-3" />
               </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function ReceiptIcon({ status }: { status: string }) {
   if (status === 'paid') return <CircleDollarSign className="w-5 h-5 text-emerald-500" />;
   if (status === 'overdue') return <Clock className="w-5 h-5 text-red-500" />;
   if (status === 'partially_paid') return <CircleDollarSign className="w-5 h-5 text-amber-500" />;
   return <FileText className="w-5 h-5 text-blue-500" />;
}

