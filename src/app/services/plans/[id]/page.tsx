'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  ArrowLeft, Edit, Layers, Package, DollarSign,
  Loader2, Sparkles, Tag, BarChart3,
} from 'lucide-react';
import { useFirestore } from '@/firebase';
import { collection, doc, getDoc, getDocs } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { formatCurrency } from '@/lib/utils';
import { ProductOrService, PredefinedPlan, PlanItem } from '@/lib/types';

// ── Pricing helpers (mirrors edit page logic) ────────────────────────────────

function getEffectiveUnitPrice(item: PlanItem, services: ProductOrService[]): number {
  if (item.overridePrice !== undefined) return item.overridePrice;
  const svc = services.find(s => s.id === item.serviceId);
  if (!svc) return 0;
  let price = svc.basePrice || 0;
  if (svc.pricingModel === 'scalable' && item.overriddenQuantity !== undefined) {
    price += Math.max(0, (item.overriddenQuantity || 0) - (svc.includedUnits || 0)) * (svc.unitPrice || 0);
  } else if (svc.pricingModel === 'package' && item.selectedPackage) {
    const pkg = svc.packages?.find(p => p.name === item.selectedPackage);
    if (pkg) price = pkg.price;
  }
  if (svc.useComplexityMatrix && item.selectedComplexityLevel !== undefined) {
    const tier = svc.complexityTiers?.find(t => t.level === item.selectedComplexityLevel);
    if (tier) price += tier.surcharge || 0;
  }
  return price;
}

function getItemConfig(item: PlanItem, svc: ProductOrService): string | null {
  const parts: string[] = [];
  if (item.selectedPackage) parts.push(`Paquete: ${item.selectedPackage}`);
  if (item.overriddenQuantity !== undefined && svc.pricingModel === 'scalable')
    parts.push(`${item.overriddenQuantity} unidades`);
  if (item.selectedComplexityLevel !== undefined && svc.complexityTiers) {
    const tier = svc.complexityTiers.find(t => t.level === item.selectedComplexityLevel);
    if (tier) parts.push(`Complejidad: ${tier.name}`);
  }
  return parts.length > 0 ? parts.join(' · ') : null;
}

// ── Skeleton ─────────────────────────────────────────────────────────────────

function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse rounded bg-muted/50 ${className ?? ''}`} />;
}

function PlanViewSkeleton() {
  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20 animate-in fade-in duration-300">
      <div className="flex items-center gap-3">
        <Skeleton className="w-9 h-9 rounded-full" />
        <div className="space-y-2">
          <Skeleton className="h-7 w-56" />
          <Skeleton className="h-4 w-32" />
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Skeleton className="h-36 rounded-2xl" />
        <Skeleton className="h-36 rounded-2xl" />
      </div>
      <div className="space-y-3">
        {[1, 2, 3].map(i => <Skeleton key={i} className="h-24 rounded-xl" />)}
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function PlanViewPage() {
  const router = useRouter();
  const params = useParams();
  const planId = params.id as string;
  const firestore = useFirestore();
  const { toast } = useToast();

  const [isLoading, setIsLoading] = useState(true);
  const [plan, setPlan] = useState<PredefinedPlan | null>(null);
  const [services, setServices] = useState<ProductOrService[]>([]);

  useEffect(() => {
    async function loadData() {
      if (!firestore || !planId) return;
      try {
        const [servicesSnap, planSnap] = await Promise.all([
          getDocs(collection(firestore, 'services')),
          getDoc(doc(firestore, 'predefined_plans', planId)),
        ]);
        setServices(servicesSnap.docs.map(d => ({ id: d.id, ...d.data() } as ProductOrService)));
        if (planSnap.exists()) {
          setPlan({ id: planSnap.id, ...planSnap.data() } as PredefinedPlan);
        } else {
          toast({ title: 'Error', description: 'El plan no existe.', variant: 'destructive' });
          router.push('/services');
        }
      } catch (e) {
        console.error('Error loading plan view:', e);
        toast({ title: 'Error', description: 'No se pudieron cargar los datos.', variant: 'destructive' });
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, [firestore, planId, router, toast]);

  if (isLoading) return <PlanViewSkeleton />;
  if (!plan) return null;

  const total = plan.items.reduce(
    (acc, item) => acc + item.quantity * getEffectiveUnitPrice(item, services),
    0,
  );

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20 animate-in fade-in slide-in-from-bottom-4 duration-500">

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="flex items-start gap-3">
          <Button
            variant="ghost" size="icon"
            onClick={() => router.push('/services?tab=plans')}
            className="rounded-full shrink-0 mt-0.5"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight">{plan.name}</h1>
              <Badge className="bg-primary/10 text-primary border-primary/20 text-[10px] font-bold uppercase tracking-widest">
                <Sparkles className="w-3 h-3 mr-1" />
                Plantilla
              </Badge>
            </div>
            {plan.description && (
              <p className="text-sm text-muted-foreground mt-1 max-w-xl leading-relaxed">
                {plan.description}
              </p>
            )}
          </div>
        </div>

        <Button
          size="sm"
          onClick={() => router.push(`/services/plans/${plan.id}/edit`)}
          className="ml-11 sm:ml-0 shrink-0 gap-2 shadow-lg shadow-primary/20"
        >
          <Edit className="w-4 h-4" />
          Editar Plan
        </Button>
      </div>

      {/* ── KPI Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Total */}
        <div className="relative rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent p-6 overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-primary/5 -translate-y-1/2 translate-x-1/2 blur-2xl" />
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-primary/20 flex items-center justify-center shrink-0">
              <DollarSign className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                Total Estimado
              </p>
              <p className="text-3xl sm:text-4xl font-black text-primary tracking-tight mt-0.5">
                {formatCurrency(total)}
              </p>
              <p className="text-[10px] text-muted-foreground italic mt-1">
                * Precio base sin impuestos
              </p>
            </div>
          </div>
        </div>

        {/* Services count */}
        <div className="rounded-2xl border border-border/60 bg-card p-6 flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-muted flex items-center justify-center shrink-0">
            <Layers className="w-6 h-6 text-muted-foreground" />
          </div>
          <div className="flex-1">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              Servicios Incluidos
            </p>
            <p className="text-4xl font-black tracking-tight mt-0.5">
              {plan.items.length}
            </p>
            {/* Mini avatars */}
            <div className="flex -space-x-1.5 mt-3">
              {plan.items.slice(0, 6).map((item, i) => {
                const svc = services.find(s => s.id === item.serviceId);
                return (
                  <div
                    key={i}
                    className="w-6 h-6 rounded-full border-2 border-background flex items-center justify-center text-[9px] font-bold text-white shadow"
                    style={{ backgroundColor: svc?.color || '#888' }}
                    title={svc?.name}
                  >
                    {svc?.name?.[0]}
                  </div>
                );
              })}
              {plan.items.length > 6 && (
                <div className="w-6 h-6 rounded-full border-2 border-background bg-muted flex items-center justify-center text-[8px] font-medium">
                  +{plan.items.length - 6}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Service Detail List ── */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Package className="w-4 h-4 text-muted-foreground" />
          <h2 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">
            Desglose de Servicios
          </h2>
        </div>

        <div className="rounded-2xl border border-border/60 bg-card overflow-hidden">
          {plan.items.map((item, index) => {
            const svc = services.find(s => s.id === item.serviceId);
            const unitPrice = getEffectiveUnitPrice(item, services);
            const lineTotal = item.quantity * unitPrice;
            const config = svc ? getItemConfig(item, svc) : null;

            return (
              <div key={index}>
                {index > 0 && <Separator className="opacity-50" />}
                <div className="flex flex-col sm:grid sm:grid-cols-[auto_1fr_100px_160px] gap-4 sm:gap-6 p-4 sm:p-5 hover:bg-muted/20 transition-colors tabular-nums">
                  {/* Top Line (Mobile) / First 2 Columns (Desktop) */}
                  <div className="flex items-center gap-3 sm:contents">
                    {/* Column 1: Icon */}
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-black text-white shrink-0 shadow-sm"
                      style={{ backgroundColor: svc?.color || '#666' }}
                    >
                      {svc?.name?.[0] ?? '?'}
                    </div>

                    {/* Column 2: Name & Description */}
                    <div className="min-w-0 flex-1 flex flex-col justify-center">
                      <p className="font-bold text-sm sm:text-base truncate">
                        {svc?.name ?? <span className="text-muted-foreground italic">Servicio eliminado</span>}
                      </p>
                      {svc?.description && (
                        <p className="text-[11px] sm:text-xs text-muted-foreground mt-0.5 sm:line-clamp-1 leading-snug">
                          {svc.description}
                        </p>
                      )}
                      {config && (
                        <div className="hidden sm:flex items-center gap-1.5 mt-1.5">
                          <Tag className="w-3 h-3 text-primary/50" />
                          <span className="text-[10px] font-semibold text-primary/70">{config}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Bottom Line (Mobile) / Last 2 Columns (Desktop) */}
                  <div className="flex items-center justify-between sm:contents pt-3 sm:pt-0 border-t border-border/10 sm:border-0">
                    {/* Column 3: Quantity */}
                    <div className="flex sm:flex-col items-center justify-center sm:border-x sm:border-border/40 h-full sm:px-6">
                      <span className="text-[9px] font-black text-muted-foreground/40 tracking-tighter mr-2 sm:mr-0 sm:mb-1">CANT.</span>
                      <div className="h-7 sm:h-8 min-w-[32px] sm:min-w-[36px] flex items-center justify-center rounded-lg bg-primary/5 border border-primary/10 text-primary font-black text-xs sm:text-sm px-2 sm:px-0">
                        {item.quantity}
                      </div>
                    </div>

                    {/* Column 4: Price */}
                    <div className="text-right shrink-0">
                      <div className="flex flex-col sm:block">
                        <p className="font-black text-base sm:text-lg text-primary tracking-tight leading-none">
                          {formatCurrency(lineTotal)}
                        </p>
                        <p className="text-[10px] text-muted-foreground mt-1.5 font-medium">
                          {formatCurrency(unitPrice)} <span className="text-[8px] opacity-60 uppercase font-black">u.</span>
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Config Tags (Full width on mobile, part of Name col on desktop) */}
                  {config && (
                    <div className="sm:hidden flex items-center gap-1.5 mt-[-8px]">
                      <Tag className="w-3 h-3 text-primary/50" />
                      <span className="text-[10px] font-semibold text-primary/70">{config}</span>
                    </div>
                  )}
                  {/* For desktop, we keep the config inside the name div above, 
                      but since I removed it from the 'Column 2' block in the replace, 
                      I should add it back properly to handle both. */}
                </div>
              </div>
            );
          })}

          {/* Footer total */}
          <div className="flex items-center justify-between px-5 py-4 bg-primary/5 border-t border-primary/10">
            <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
              Total del Plan
            </span>
            <span className="text-xl font-black text-primary">{formatCurrency(total)}</span>
          </div>
        </div>
      </div>

    </div>
  );
}
