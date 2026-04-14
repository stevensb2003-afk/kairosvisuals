'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useFirestore, useCollection, useUser } from '@/firebase';
import { collection, doc, setDoc, query, where, getDocs } from 'firebase/firestore';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  Receipt, CheckCircle, AlertCircle,
  Search, Loader2, Zap, ArrowRight,
  TrendingUp, Calendar, Filter, Users,
  ChevronRight, Sparkles, Check, RefreshCw
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { toast } from '@/hooks/use-toast';
import { formatCurrency } from '@/lib/utils';
import { generateMonth1Part2 } from '@/lib/billing_utils';

export default function RecurringBillingPage() {
  const firestore = useFirestore();
  const { user, userData } = useUser();
  const [isGenerating, setIsGenerating] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Track which invoices are already generated for the current month
  const [generatedFlags, setGeneratedFlags] = useState<Record<string, { part1: boolean, part2: boolean }>>({});
  const [isCheckingFlags, setIsCheckingFlags] = useState(true);

  // 1. Fetch all clients with recurring plans
  const clientsQuery = useMemo(() => 
    firestore ? query(collection(firestore, 'clients'), where('contractType', '==', 'recurring')) : null
  , [firestore]);
  
  const { data: clients, isLoading } = useCollection<any>(clientsQuery);

  // 2. Filter active plans (Month 2+)
  const activePlans = useMemo(() => {
    if (!clients) return [];
    return clients.filter((c: any) => 
      !c.isArchived &&
      c.activePlan?.status === 'active' && 
      (c.activePlan?.currentCycleMonth >= 2 || (c.activePlan?.currentCycleMonth === 1 && c.activePlan.isMonth1Part2Paid))
    );
  }, [clients]);

  // 3. Filter Onboarding plans (Month 1, waiting for Part 2)
  const onboardingPlans = useMemo(() => {
    if (!clients) return [];
    return clients.filter((c: any) => 
      !c.isArchived &&
      c.activePlan?.status === 'active' && 
      c.activePlan?.currentCycleMonth === 1 && 
      c.activePlan.isMonth1Part1Paid &&
      !c.activePlan.isMonth1Part2Paid
    );
  }, [clients]);

  // 4. Check generation status asynchronously
  useEffect(() => {
    if (!firestore || activePlans.length === 0) {
        setIsCheckingFlags(false);
        return;
    }
    const currentMonth = format(new Date(), 'yyyy-MM');
    const checkStatus = async () => {
      setIsCheckingFlags(true);
      const flags: Record<string, { part1: boolean, part2: boolean }> = {};
      await Promise.all(activePlans.map(async (client) => {
        const invoicesRef = collection(firestore, 'clients', client.id, 'invoices');
        const q1 = query(invoicesRef, where('billingMonth', '==', currentMonth), where('planPartNumber', '==', 1));
        const q2 = query(invoicesRef, where('billingMonth', '==', currentMonth), where('planPartNumber', '==', 2));
        
        const [snap1, snap2] = await Promise.all([getDocs(q1), getDocs(q2)]);
        flags[client.id] = {
           part1: !snap1.empty,
           part2: !snap2.empty
        };
      }));
      setGeneratedFlags(flags);
      setIsCheckingFlags(false);
    };
    checkStatus();
  }, [firestore, activePlans]);

  const filteredPlans = useMemo(() => {
    return activePlans.filter((p: any) => 
      p.clientName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.company?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [activePlans, searchQuery]);

  const group15 = filteredPlans;
  const group30 = filteredPlans;

  const currentDay = new Date().getDate();
  const activeSlice = currentDay <= 15 ? 1 : 2;
  const activeGroup = activeSlice === 1 ? group15 : group30;
  
  const totalForSlice = activeGroup.length;
  const generatedForSlice = activeGroup.filter(c => generatedFlags[c.id]?.[activeSlice === 1 ? 'part1' : 'part2']).length;
  const progressValue = totalForSlice === 0 ? 0 : Math.round((generatedForSlice / totalForSlice) * 100);

  const handleGenerateBatch = async (group: any[], slice: 1 | 2) => {
    if (!firestore || group.length === 0) return;
    setIsGenerating(true);
    
    let successCount = 0;
    const currentMonth = format(new Date(), 'yyyy-MM');

    try {
      for (const client of group) {
        // Skip if we already checked it's generated
        if (generatedFlags[client.id]?.[slice === 1 ? 'part1' : 'part2']) continue;

        const baseAmount = client.activePlan.baseRecurringAmount || client.monthlyQuota || 0;
        const amount = baseAmount / 2;
        const invoiceId = `INV-REC-${Date.now().toString().slice(-4)}-${successCount}`;

        let subtotalAmt = 0;
        let taxAmt = 0;
        let totalDiscAmt = 0;
        
        let formattedItems = [];

        if (client.activePlan.services && client.activePlan.services.length > 0) {
            formattedItems = client.activePlan.services.map((svc: any) => {
                const lineSubtotal = (svc.unitPrice * svc.quantity) / 2;
                const lineDisc = (svc.discountValue || 0) / 2;
                const lineTax = ((lineSubtotal - lineDisc) * (svc.ivaRate || 0)) / 100;
                
                subtotalAmt += lineSubtotal;
                totalDiscAmt += lineDisc;
                taxAmt += lineTax;
    
                return {
                    id: `item-${Math.random().toString(36).substr(2, 9)}`,
                    description: `Plan Mensual - Pago ${slice}/2 (50%) - ${svc.description || 'Servicio'}`,
                    quantity: svc.quantity,
                    unitPrice: svc.unitPrice / 2,
                    total: (lineSubtotal - lineDisc + lineTax),
                    discount: lineDisc,
                    discountType: svc.discountType || 'amount',
                    discountValue: svc.discountValue ? svc.discountValue / 2 : 0,
                    ivaRate: svc.ivaRate || 0,
                    ivaType: svc.ivaType || 'none',
                    paymentCategory: 'plan'
                };
            });
        } else {
            // Fallback if no services defined
            subtotalAmt = amount;
            formattedItems = [{
                id: `item-${Math.random().toString(36).substr(2, 9)}`,
                description: `Plan Mensual - Quincena ${slice}/2 - ${currentMonth}`,
                quantity: 1,
                unitPrice: amount,
                total: amount,
                discount: 0,
                paymentCategory: 'plan'
            }];
        }

        const totalFinal = subtotalAmt - totalDiscAmt + taxAmt;
        
        await setDoc(doc(firestore, 'clients', client.id, 'invoices', invoiceId), {
          clientId: client.id,
          invoiceNumber: invoiceId,
          totalAmount: totalFinal,
          subtotalAmount: subtotalAmt,
          taxAmount: taxAmt,
          totalDiscount: totalDiscAmt,
          status: 'draft',
          isPlanInvoice: true,
          planPartNumber: slice,
          billingMonth: currentMonth,
          items: formattedItems,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          issueDate: new Date().toISOString(),
          firstPaymentDueDate: new Date().toISOString(),
        });
        
        // Update local state to reflect it's generated
        setGeneratedFlags(prev => ({
            ...prev,
            [client.id]: {
                ...prev[client.id],
                [slice === 1 ? 'part1' : 'part2']: true
            }
        }));

        successCount++;
      }

      toast({
        title: `Lote completado: ${successCount} facturas`,
        description: `Se han generado los borradores para la quincena ${slice}.`
      });
    } catch (err) {
      console.error(err);
      toast({ title: "Error en la generación masiva", variant: "destructive" });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerateOnboarding = async (clientId: string, clientName: string) => {
    if (!firestore) return;
    try {
        await generateMonth1Part2(firestore, clientId, clientName);
        toast({ title: "Factura Parte 2 Onboarding Generada Exitosamente" });
    } catch (err: any) {
        toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-20 gap-4">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
        <p className="text-muted-foreground animate-pulse">Cargando motor de facturación...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold font-headline flex items-center gap-3">
            <div className="bg-primary/10 p-2 rounded-xl text-primary">
              <RefreshCw className="w-8 h-8" />
            </div>
            Facturación Recurrente (Motor 15/30)
          </h1>
          <p className="text-muted-foreground mt-1">Gestión masiva de cobros quincenales para planes activos.</p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 py-1.5 px-4 rounded-full">
            Próximo Corte: {activeSlice === 1 ? '15 de ' : '30 de '} {format(new Date(), 'MMMM', { locale: es })}
          </Badge>
        </div>
      </div>

      {onboardingPlans.length > 0 && (
          <Card className="border-indigo-500/20 bg-indigo-500/5 shadow-none">
              <CardHeader className="pb-3 border-b border-indigo-500/10">
                  <div className="flex justify-between items-center">
                     <div>
                        <CardTitle className="text-sm font-bold flex items-center gap-2 text-indigo-600">
                            <Sparkles className="w-4 h-4" /> Clientes en Onboarding (Mes 1)
                        </CardTitle>
                        <CardDescription className="text-indigo-600/70">
                            Han pagado la Parte 1/2 y están listos para que generes la Parte 2/2.
                        </CardDescription>
                     </div>
                     <Badge className="bg-indigo-500">{onboardingPlans.length} Pendientes</Badge>
                  </div>
              </CardHeader>
              <CardContent className="pt-4 flex flex-col gap-3">
                  {onboardingPlans.map((p: any) => (
                      <div key={p.id} className="flex items-center justify-between p-3 rounded-lg bg-background border hover:border-indigo-500/30 transition-all">
                          <div>
                              <p className="font-bold text-sm text-foreground">{p.clientName}</p>
                              <p className="text-xs text-muted-foreground">{p.activePlan.services?.[0]?.description || 'Servicios'}</p>
                          </div>
                          <div className="flex items-center gap-4">
                              <p className="font-bold text-indigo-600">₡{(p.activePlan.baseRecurringAmount / 2).toLocaleString()}</p>
                              <Button variant="outline" className="border-indigo-500/30 text-indigo-600 hover:bg-indigo-50" size="sm" onClick={() => handleGenerateOnboarding(p.id, p.clientName)}>
                                  Generar Parte 2/2
                              </Button>
                          </div>
                      </div>
                  ))}
              </CardContent>
          </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="md:col-span-1 border-primary/10 bg-primary/5">
          <CardHeader>
            <CardTitle className="text-sm font-bold uppercase text-primary">Corte {activeSlice === 1 ? 'Quincena 1 (Día 15)' : 'Quincena 2 (Día 30)'}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-bold">
                <span>Progreso Facturación</span>
                <span>{isCheckingFlags ? <Loader2 className="w-3 h-3 animate-spin inline" /> : `${progressValue}%`}</span>
              </div>
              <Progress value={progressValue} className="h-2" />
              <p className="text-[10px] text-muted-foreground text-center pt-1">
                 {generatedForSlice} de {totalForSlice} facturas generadas
              </p>
            </div>
            
            <div className="p-4 bg-background rounded-xl border space-y-2">
              <p className="text-[10px] uppercase font-bold text-muted-foreground">Configuración Global</p>
              <p className="text-sm font-medium">Split: <span className="text-primary font-bold">50% / 50%</span></p>
              <p className="text-sm font-medium">Cortes: <span className="text-primary font-bold">Días 15 y 30</span></p>
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-3">
          <CardHeader className="flex flex-row items-center justify-between border-b pb-6">
            <div className="space-y-1">
              <CardTitle>Planes Activos (Mes 2+)</CardTitle>
              <CardDescription>Cobro regular en ciclo de facturación 15/30.</CardDescription>
            </div>
            <div className="relative w-72">
               <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
               <Input 
                 placeholder="Buscar cliente..." 
                 className="pl-9" 
                 value={searchQuery}
                 onChange={(e) => setSearchQuery(e.target.value)}
               />
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* QUINCENA 1 */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-blue-500" />
                    1ra Quincena (Día 15)
                  </h3>
                  <Badge variant={activeSlice === 1 ? "default" : "outline"} className={activeSlice === 1 ? "bg-blue-500" : ""}>{group15.length} Clientes</Badge>
                </div>
                
                <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                  {group15.length > 0 ? group15.map((p) => {
                    const isGenerated = generatedFlags[p.id]?.part1;
                    return (
                    <div key={p.id} className={`flex items-center justify-between p-3 rounded-xl border transition-all ${isGenerated ? 'bg-muted/50 border-blue-500/20' : 'bg-card hover:border-blue-500/50'}`}>
                      <div className="min-w-0 flex items-center gap-3">
                        {isGenerated && <CheckCircle className="w-4 h-4 text-blue-500 shrink-0" />}
                        <div>
                            <p className={`font-bold text-sm truncate ${isGenerated ? 'text-muted-foreground' : ''}`}>{p.clientName}</p>
                            <p className="text-[10px] text-muted-foreground uppercase">{p.company || 'Sin Empresa'}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`font-bold text-xs ${isGenerated ? 'text-muted-foreground' : 'text-primary'}`}>₡{(p.activePlan.baseRecurringAmount / 2).toLocaleString()}</p>
                        {!isGenerated && <p className="text-[8px] uppercase text-blue-600 font-bold">Pendiente</p>}
                      </div>
                    </div>
                  )}) : (
                    <p className="text-xs text-center p-8 text-muted-foreground border border-dashed rounded-xl">No hay clientes para este corte.</p>
                  )}
                </div>

                <Button 
                  className="w-full h-12 gap-2 bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-500/20" 
                  disabled={isGenerating || isCheckingFlags || group15.length === 0 || group15.every(c => generatedFlags[c.id]?.part1)}
                  onClick={() => handleGenerateBatch(group15, 1)}
                >
                  {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : 
                   group15.every(c => generatedFlags[c.id]?.part1) && group15.length > 0 ? <Check className="w-4 h-4" /> : <Zap className="w-4 h-4" />}
                  {group15.every(c => generatedFlags[c.id]?.part1) && group15.length > 0 ? 'Lote Generado' : 'Generar Faltantes (Día 15)'}
                </Button>
              </div>

              {/* QUINCENA 2 */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-emerald-500" />
                    2da Quincena (Día 30)
                  </h3>
                  <Badge variant={activeSlice === 2 ? "default" : "outline"} className={activeSlice === 2 ? "bg-emerald-500" : ""}>{group30.length} Clientes</Badge>
                </div>

                <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                  {group30.length > 0 ? group30.map((p) => {
                    const isGenerated = generatedFlags[p.id]?.part2;
                    return (
                    <div key={p.id} className={`flex items-center justify-between p-3 rounded-xl border transition-all ${isGenerated ? 'bg-muted/50 border-emerald-500/20' : 'bg-card hover:border-emerald-500/50'}`}>
                      <div className="min-w-0 flex items-center gap-3">
                         {isGenerated && <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />}
                        <div>
                            <p className={`font-bold text-sm truncate ${isGenerated ? 'text-muted-foreground' : ''}`}>{p.clientName}</p>
                            <p className="text-[10px] text-muted-foreground uppercase">{p.company || 'Sin Empresa'}</p>
                        </div>
                      </div>
                      <div className="text-right">
                         <p className={`font-bold text-xs ${isGenerated ? 'text-muted-foreground' : 'text-primary'}`}>₡{(p.activePlan.baseRecurringAmount / 2).toLocaleString()}</p>
                         {!isGenerated && <p className="text-[8px] uppercase text-emerald-600 font-bold">Pendiente</p>}
                      </div>
                    </div>
                  )}) : (
                    <p className="text-xs text-center p-8 text-muted-foreground border border-dashed rounded-xl">No hay clientes para este corte.</p>
                  )}
                </div>

                <Button 
                  className="w-full h-12 gap-2 bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-500/20" 
                  disabled={isGenerating || isCheckingFlags || group30.length === 0 || group30.every(c => generatedFlags[c.id]?.part2)}
                  onClick={() => handleGenerateBatch(group30, 2)}
                >
                  {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : 
                   group30.every(c => generatedFlags[c.id]?.part2) && group30.length > 0 ? <Check className="w-4 h-4" /> : <Zap className="w-4 h-4" />}
                   {group30.every(c => generatedFlags[c.id]?.part2) && group30.length > 0 ? 'Lote Generado' : 'Generar Faltantes (Día 30)'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="border-amber-500/20 bg-amber-500/5">
            <CardHeader className="pb-2">
                <CardTitle className="text-sm font-bold flex items-center gap-2 text-amber-600">
                    <AlertCircle className="w-4 h-4" /> Importante: Reglas de Facturación
                </CardTitle>
            </CardHeader>
            <CardContent>
                <ul className="text-xs space-y-2 text-amber-700">
                    <li className="flex gap-2"><ArrowRight className="w-3 h-3 shrink-0 mt-0.5" /> Las facturas se generan en estado **Borrador (Draft)** para revisión final.</li>
                    <li className="flex gap-2"><ArrowRight className="w-3 h-3 shrink-0 mt-0.5" /> El sistema calcula el IVA automáticamente según la configuración del servicio original.</li>
                    <li className="flex gap-2"><ArrowRight className="w-3 h-3 shrink-0 mt-0.5" /> Solo se generan las facturas que **aún no se han generado** en la quincena.</li>
                </ul>
            </CardContent>
          </Card>
          
          <Card className="border-primary/20 bg-primary/5">
            <CardHeader className="pb-2">
                <CardTitle className="text-sm font-bold flex items-center gap-2 text-primary">
                    <Sparkles className="w-4 h-4" /> Inteligencia Comercial
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-xs text-muted-foreground uppercase font-bold tracking-tighter">Proyección Facturación Mensual</p>
                        <p className="text-2xl font-black text-primary">₡{activePlans.reduce((acc, p) => acc + (p.activePlan.baseRecurringAmount || 0), 0).toLocaleString()}</p>
                    </div>
                    <TrendingUp className="w-10 h-10 text-primary opacity-20" />
                </div>
            </CardContent>
          </Card>
      </div>
    </div>
  );
}


