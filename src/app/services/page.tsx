'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Package, Layers, Search, X, Plus, Loader2 } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

import { useServicesData } from './_hooks/useServicesData';
import { ServicesTab } from './_components/ServicesTab';
import { PlansTab } from './_components/PlansTab';
import { ServiceFormDialog } from './_components/ServiceFormDialog';
import { DeleteConfirmDialog } from './_components/DeleteConfirmDialog';

export default function ServicesPage() {
  const router = useRouter();
  const data = useServicesData();

  const [activeTab, setActiveTab] = useState('services');
  const [serviceSearch, setServiceSearch] = useState('');
  const [planSearch, setPlanSearch] = useState('');

  // Delete state
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; type: 'service' | 'plan'; name: string } | null>(null);

  const filteredServices = useMemo(() => {
    if (!data.services) return [];
    if (!serviceSearch.trim()) return data.services;
    const q = serviceSearch.toLowerCase();
    return data.services.filter(s =>
      s.name.toLowerCase().includes(q) ||
      s.description?.toLowerCase().includes(q) ||
      s.pricingModel.toLowerCase().includes(q) ||
      s.packages?.some(p => p.name.toLowerCase().includes(q))
    );
  }, [data.services, serviceSearch]);

  const filteredPlans = useMemo(() => {
    if (!data.plans) return [];
    if (!planSearch.trim()) return data.plans;
    return data.plans.filter(p => p.name.toLowerCase().includes(planSearch.toLowerCase()));
  }, [data.plans, planSearch]);

  const isLoadingAny = data.isLoading || data.isLoadingPlans;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Catálogo de Servicios</h2>
          <p className="text-sm text-muted-foreground">
            Gestiona servicios, productos y planes predeterminados.
          </p>
        </div>
        <div className="shrink-0">
          {activeTab === 'services' ? (
            <Button onClick={data.openNewService} className="w-full sm:w-auto gap-2">
              <Plus className="h-4 w-4" /> Nuevo Servicio
            </Button>
          ) : (
            <Button onClick={() => router.push('/services/plans/create')} className="w-full sm:w-auto gap-2">
              <Plus className="h-4 w-4" /> Nuevo Plan
            </Button>
          )}
        </div>
      </div>

      {/* ── Tabs ────────────────────────────────────────────────────────── */}
      <Tabs defaultValue="services" onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full max-w-sm grid-cols-2 h-11">
          <TabsTrigger value="services" className="h-full flex items-center gap-2 text-xs sm:text-sm">
            <Package className="w-4 h-4" />
            <span className="hidden xs:inline">Servicios</span>
            <span className="xs:hidden">Servicios</span>
          </TabsTrigger>
          <TabsTrigger value="plans" className="h-full flex items-center gap-2 text-xs sm:text-sm">
            <Layers className="w-4 h-4" />
            <span>Planes</span>
          </TabsTrigger>
        </TabsList>

        {/* ── Tab: Servicios ──────────────────────────────────────────── */}
        <TabsContent value="services" className="space-y-4 pt-5">
          <SearchBar
            value={serviceSearch}
            onChange={setServiceSearch}
            placeholder="Buscar por nombre, tipo o paquete..."
            count={`${filteredServices.length} ${filteredServices.length === 1 ? 'servicio' : 'servicios'}`}
          />

          {data.isLoading ? (
            <LoadingState />
          ) : (data.services?.length ?? 0) === 0 ? (
            <EmptyState
              icon={<Package className="w-12 h-12 opacity-20" />}
              title="Sin servicios aún"
              description="Crea tu primer servicio para comenzar."
              action={<Button onClick={data.openNewService} className="gap-2"><Plus className="w-4 h-4" />Crear Servicio</Button>}
            />
          ) : filteredServices.length === 0 ? (
            <EmptyState
              icon={<Search className="w-10 h-10 opacity-20" />}
              title={`Sin resultados para "${serviceSearch}"`}
              description="Intenta con otro término de búsqueda."
            />
          ) : (
            <ServicesTab
              services={filteredServices}
              onEdit={data.openEditService}
              onDelete={(id) => {
                const s = data.services?.find(sv => sv.id === id);
                if (s) setDeleteTarget({ id, type: 'service', name: s.name });
              }}
            />
          )}
        </TabsContent>

        {/* ── Tab: Planes ─────────────────────────────────────────────── */}
        <TabsContent value="plans" className="space-y-4 pt-5">
          <SearchBar
            value={planSearch}
            onChange={setPlanSearch}
            placeholder="Buscar por nombre de plan..."
            count={`${filteredPlans.length} ${filteredPlans.length === 1 ? 'plan' : 'planes'}`}
          />

          {data.isLoadingPlans ? (
            <LoadingState />
          ) : (data.plans?.length ?? 0) === 0 ? (
            <EmptyState
              icon={<Layers className="w-12 h-12 opacity-20" />}
              title="Sin planes aún"
              description="Crea tu primer plan predeterminado."
              action={<Button onClick={() => router.push('/services/plans/create')} className="gap-2"><Plus className="w-4 h-4" />Crear Plan</Button>}
            />
          ) : filteredPlans.length === 0 ? (
            <EmptyState
              icon={<Search className="w-10 h-10 opacity-20" />}
              title={`Sin resultados para "${planSearch}"`}
              description="Intenta con otro término."
            />
          ) : (
            <PlansTab
              plans={filteredPlans}
              services={data.services}
              calculatePlanTotal={data.calculatePlanTotal}
              onDelete={(id) => {
                const p = data.plans?.find(pl => pl.id === id);
                if (p) setDeleteTarget({ id, type: 'plan', name: p.name });
              }}
            />
          )}
        </TabsContent>
      </Tabs>

      {/* ── Dialogs ─────────────────────────────────────────────────────── */}
      <ServiceFormDialog
        open={data.isServiceDialogOpen}
        onOpenChange={data.setIsServiceDialogOpen}
        editingId={data.editingServiceId}
        formData={data.formData}
        setFormData={data.setFormData}
        newPackage={data.newPackage}
        setNewPackage={data.setNewPackage}
        ivaTypes={data.ivaTypes}
        isSubmitting={data.isSubmitting}
        onSubmit={data.submitService}
      />

      <DeleteConfirmDialog
        open={!!deleteTarget}
        onOpenChange={v => { if (!v) setDeleteTarget(null); }}
        title={`Eliminar ${deleteTarget?.type === 'service' ? 'servicio' : 'plan'}`}
        description={`¿Eliminar "${deleteTarget?.name}"? Esta acción no se puede deshacer.`}
        onConfirm={async () => {
          if (!deleteTarget) return;
          if (deleteTarget.type === 'service') await data.deleteService(deleteTarget.id);
          else await data.deletePlan(deleteTarget.id);
        }}
      />
    </div>
  );
}

// ── Shared sub-components ─────────────────────────────────────────────────────

function SearchBar({ value, onChange, placeholder, count }: {
  value: string; onChange: (v: string) => void;
  placeholder: string; count: string;
}) {
  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
      <div className="relative w-full max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder={placeholder}
          value={value}
          onChange={e => onChange(e.target.value)}
          className="pl-9 pr-9"
        />
        {value && (
          <Button variant="ghost" size="icon" className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7" onClick={() => onChange('')}>
            <X className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>
      <span className="text-xs text-muted-foreground bg-muted/40 px-3 py-1.5 rounded-full border border-border/50 shrink-0">
        {count}
      </span>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="flex justify-center items-center py-20">
      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
    </div>
  );
}

function EmptyState({ icon, title, description, action }: {
  icon: React.ReactNode; title: string; description: string; action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-3 text-center">
      <div className="text-muted-foreground">{icon}</div>
      <p className="font-semibold text-foreground">{title}</p>
      <p className="text-sm text-muted-foreground max-w-xs">{description}</p>
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
