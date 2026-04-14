'use client';

import React, { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { initializeFirebase } from '@/firebase/init';
import { collection, query, orderBy, addDoc, doc, deleteDoc, updateDoc, serverTimestamp, Timestamp, getDoc } from 'firebase/firestore';
import { useCollection } from '@/firebase/firestore/use-collection';
import { ProductOrService, PredefinedPlan, PlanItem } from '@/lib/types';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn, formatCurrency } from '@/lib/utils';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Plus, Edit, Trash2, Package, Info, Layers, Gem, Search, X } from "lucide-react";

export default function ServicesPage() {
  const router = useRouter();
  const { firestore } = initializeFirebase();
  
  const servicesQuery = useMemo(() => {
    return query(collection(firestore, 'services'), orderBy('createdAt', 'desc'));
  }, [firestore]);

  const { data: services, isLoading } = useCollection<ProductOrService>(servicesQuery);

  const plansQuery = useMemo(() => {
    return query(collection(firestore, 'predefined_plans'), orderBy('createdAt', 'desc'));
  }, [firestore]);

  const { data: plans, isLoading: isLoadingPlans } = useCollection<PredefinedPlan>(plansQuery);

  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('services');
  const [ivaTypes, setIvaTypes] = useState<any[]>([]);

  React.useEffect(() => {
    const fetchIva = async () => {
      try {
        const docSnap = await getDoc(doc(firestore, 'settings', 'general'));
        if (docSnap.exists() && docSnap.data().ivaTypes) {
          setIvaTypes(docSnap.data().ivaTypes.filter((t: any) => t.isActive));
        }
      } catch (error) {
        console.error("Error fetching IVA types:", error);
      }
    };
    fetchIva();
  }, [firestore]);
  
  const filteredServices = useMemo(() => {
    if (!services) return [];
    if (!searchTerm.trim()) return services;
    
    const search = searchTerm.toLowerCase();
    return services.filter(service => {
      const matchName = service.name.toLowerCase().includes(search);
      const matchDescription = service.description?.toLowerCase().includes(search);
      const matchModel = service.pricingModel.toLowerCase().includes(search);
      const matchPackages = service.packages?.some(pkg => 
        pkg.name.toLowerCase().includes(search)
      );
      
      return matchName || matchDescription || matchModel || matchPackages;
    });
  }, [services, searchTerm]);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Form State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    color: '#888888',
    unitType: 'session' as any,
    pricingModel: 'fixed' as any,
    basePrice: 0,
    includedUnits: 0,
    unitPrice: 0,
    useComplexityMatrix: false,
    complexityTiers: [
      { level: 0, name: 'Estándar', surcharge: 0 },
      { level: 1, name: 'Bajo', surcharge: 500 },
      { level: 2, name: 'Medio', surcharge: 1500 },
      { level: 3, name: 'Alto', surcharge: 2000 },
    ],
    packages: [] as { name: string; units: number; price: number }[],
    ivaType: '',
    ivaRate: 0,
  });

  const [newPackage, setNewPackage] = useState({ name: '', units: 1, price: 0 });

  const resetForm = () => {
    setEditingId(null);
    setNewPackage({ name: '', units: 1, price: 0 });
    setFormData({
      name: '',
      description: '',
      color: '#888888',
      unitType: 'session',
      pricingModel: 'fixed',
      basePrice: 0,
      includedUnits: 0,
      unitPrice: 0,
      useComplexityMatrix: false,
      complexityTiers: [
        { level: 0, name: 'Estándar', surcharge: 0 },
        { level: 1, name: 'Bajo', surcharge: 500 },
        { level: 2, name: 'Medio', surcharge: 1500 },
        { level: 3, name: 'Alto', surcharge: 2000 },
      ],
      packages: [],
      ivaType: '',
      ivaRate: 0,
    });
  };

  const handleOpenNew = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (service: ProductOrService) => {
    setEditingId(service.id);
    setFormData({
      name: service.name,
      description: service.description,
      color: service.color || '#888888',
      unitType: service.unitType,
      pricingModel: service.pricingModel,
      basePrice: service.basePrice || 0,
      includedUnits: service.includedUnits || 0,
      unitPrice: service.unitPrice || 0,
      useComplexityMatrix: service.useComplexityMatrix || false,
      complexityTiers: service.complexityTiers || [
        { level: 0, name: 'Estándar', surcharge: 0 },
        { level: 1, name: 'Bajo', surcharge: 500 },
        { level: 2, name: 'Medio', surcharge: 1500 },
        { level: 3, name: 'Alto', surcharge: 2000 },
      ],
      packages: service.packages || [],
      ivaType: service.ivaType || '',
      ivaRate: service.ivaRate || 0,
    });
    setNewPackage({ name: '', units: 1, price: 0 });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('¿Estás seguro de que deseas eliminar este servicio?')) return;
    try {
      await deleteDoc(doc(firestore, 'services', id));
    } catch (error) {
      console.error("Error deleting service:", error);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? (value === '' ? 0 : parseFloat(value) || 0) : value
    }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleComplexitySurchargeChange = (index: number, value: string) => {
    const newSurcharge = value === '' ? 0 : parseFloat(value) || 0;
    setFormData(prev => {
      const newTiers = [...prev.complexityTiers];
      newTiers[index] = { ...newTiers[index], surcharge: newSurcharge };
      return { ...prev, complexityTiers: newTiers };
    });
  };

  const handleAddPackage = () => {
    if (!newPackage.name.trim() || newPackage.units <= 0 || newPackage.price < 0) return;
    setFormData(prev => ({
      ...prev,
      packages: [...prev.packages, { ...newPackage }]
    }));
    setNewPackage({ name: '', units: 1, price: 0 });
  };

  const handleRemovePackage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      packages: prev.packages.filter((_, i) => i !== index)
    }));
  };

  const [isPlanDialogOpen, setIsPlanDialogOpen] = useState(false);
  const [editingPlanId, setEditingPlanId] = useState<string | null>(null);
  const [planFormData, setPlanFormData] = useState({
    name: '',
    description: '',
    items: [] as PlanItem[]
  });

  const handleOpenNewPlan = () => {
    setEditingPlanId(null);
    setPlanFormData({ name: '', description: '', items: [] });
    setIsPlanDialogOpen(true);
  };

  const handleOpenEditPlan = (plan: PredefinedPlan) => {
    setEditingPlanId(plan.id);
    setPlanFormData({
      name: plan.name,
      description: plan.description,
      items: plan.items
    });
    setIsPlanDialogOpen(true);
  };

  const handleDeletePlan = async (id: string) => {
    if (!window.confirm('¿Estás seguro de que deseas eliminar este plan?')) return;
    try {
      await deleteDoc(doc(firestore, 'predefined_plans', id));
    } catch (error) {
      console.error("Error deleting plan:", error);
    }
  };

  const handleAddServiceToPlan = (serviceId: string) => {
    const service = services?.find(s => s.id === serviceId);
    if (!service) return;
    
    setPlanFormData(prev => ({
      ...prev,
      items: [...prev.items, { serviceId: service.id, quantity: 1 }]
    }));
  };

  const handleUpdatePlanItem = (index: number, updates: Partial<PlanItem>) => {
    setPlanFormData(prev => {
      const newItems = [...prev.items];
      newItems[index] = { ...newItems[index], ...updates };
      return { ...prev, items: newItems };
    });
  };

  const handleRemovePlanItem = (index: number) => {
    setPlanFormData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
  };

  const calculatePlanTotal = (items: PlanItem[]) => {
    return items.reduce((acc, item) => {
      // If there's an explicit override, use it
      if (item.overridePrice !== undefined) return acc + (item.overridePrice * item.quantity);
      
      const service = services?.find(s => s.id === item.serviceId);
      if (!service) return acc;

      let itemBasePrice = service.basePrice || 0;

      // Scalable Pricing Model
      if (service.pricingModel === 'scalable' && item.overriddenQuantity !== undefined) {
        const extraUnits = Math.max(0, (item.overriddenQuantity || 0) - (service.includedUnits || 0));
        itemBasePrice += extraUnits * (service.unitPrice || 0);
      } 
      // Package Pricing Model
      else if (service.pricingModel === 'package' && item.selectedPackage) {
        const pkg = service.packages?.find(p => p.name === item.selectedPackage);
        if (pkg) itemBasePrice = pkg.price;
      }

      // Complexity Surcharge
      if (service.useComplexityMatrix && item.selectedComplexityLevel !== undefined) {
        const tier = service.complexityTiers?.find(t => t.level === item.selectedComplexityLevel);
        if (tier) itemBasePrice += (tier.surcharge || 0);
      }

      return acc + (itemBasePrice * item.quantity);
    }, 0);
  };

  const handlePlanSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const payload = {
        name: planFormData.name,
        description: planFormData.description,
        items: planFormData.items,
        updatedAt: serverTimestamp()
      };
      if (editingPlanId) {
        await updateDoc(doc(firestore, 'predefined_plans', editingPlanId), payload);
      } else {
        await addDoc(collection(firestore, 'predefined_plans'), {
          ...payload,
          createdAt: serverTimestamp()
        });
      }
      setIsPlanDialogOpen(false);
    } catch (error) {
      console.error("Error saving plan:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const payload = {
        name: formData.name,
        description: formData.description,
        color: formData.color,
        unitType: formData.unitType,
        pricingModel: formData.pricingModel,
        basePrice: formData.basePrice,
        ...(formData.pricingModel === 'scalable' ? {
          includedUnits: formData.includedUnits,
          unitPrice: formData.unitPrice
        } : {}),
        ...(formData.pricingModel === 'package' ? {
          packages: formData.packages
        } : {}),
        ...(formData.useComplexityMatrix ? {
          useComplexityMatrix: formData.useComplexityMatrix,
          complexityTiers: formData.complexityTiers
        } : { useComplexityMatrix: false }),
        ivaType: formData.ivaType,
        ivaRate: formData.ivaRate
      };

      if (editingId) {
        await updateDoc(doc(firestore, 'services', editingId), {
          ...payload,
          updatedAt: serverTimestamp()
        });
      } else {
        await addDoc(collection(firestore, 'services'), {
          ...payload,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
      }
      setIsDialogOpen(false);
      resetForm();
    } catch (error) {
      console.error("Error saving service:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getPricingModelBadge = (model: string) => {
    switch (model) {
      case 'fixed': return <Badge variant="outline" className="bg-blue-500/10 text-blue-600">Fijo</Badge>;
      case 'scalable': return <Badge variant="outline" className="bg-purple-500/10 text-purple-600">Escalable</Badge>;
      case 'package': return <Badge variant="outline" className="bg-orange-500/10 text-orange-600">Paquete</Badge>;
      default: return <Badge variant="outline">{model}</Badge>;
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Catálogo de Servicios</h2>
          <p className="text-muted-foreground">
            Gestiona los servicios, productos y paquetes que ofreces a tus clientes.
          </p>
        </div>
        <div className="flex gap-2">
          {activeTab === 'services' ? (
            <Button onClick={handleOpenNew}>
              <Plus className="mr-2 h-4 w-4" /> Nuevo Servicio
            </Button>
          ) : (
            <Button onClick={() => router.push('/services/plans/create')}>
              <Plus className="mr-2 h-4 w-4" /> Nuevo Plan
            </Button>
          )}
        </div>
      </div>

      <Tabs defaultValue="services" onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="services" className="flex items-center gap-2">
            <Package className="w-4 h-4" />
            Servicios individuales
          </TabsTrigger>
          <TabsTrigger value="plans" className="flex items-center gap-2">
            <Layers className="w-4 h-4" />
            Planes predeterminados
          </TabsTrigger>
        </TabsList>

        <TabsContent value="services" className="space-y-6 pt-6">
      
      <div className="flex flex-col sm:flex-row items-center gap-4 relative">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre, tipo o paquete..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 pr-9 bg-muted/20 border-border/50 focus-visible:ring-primary"
          />
          {searchTerm && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 hover:bg-transparent text-muted-foreground hover:text-foreground"
              onClick={() => setSearchTerm('')}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
        <div className="text-sm text-muted-foreground bg-muted/30 px-3 py-1.5 rounded-full border border-border/50">
          {filteredServices.length} {filteredServices.length === 1 ? 'servicio encontrado' : 'servicios encontrados'}
        </div>
      </div>

      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre del Servicio</TableHead>
              <TableHead>Modelo</TableHead>
              <TableHead>Unidad</TableHead>
              <TableHead className="text-right">Precio Base</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">
                  <div className="flex justify-center items-center">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                </TableCell>
              </TableRow>
                        ) : (services?.length ?? 0) === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                  No has registrado ningún servicio aún.
                </TableCell>
              </TableRow>
            ) : filteredServices.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                  No se encontraron servicios que coincidan con "<span className="font-medium text-foreground">{searchTerm}</span>".
                </TableCell>
              </TableRow>
            ) : (
              filteredServices.map((service) => (
                <TableRow key={service.id}>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        {service.color && (
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: service.color }} />
                        )}
                        <span className="font-medium">{service.name}</span>
                        {service.useComplexityMatrix && (
                          <Badge variant="outline" className="text-[10px] py-0 px-1 border-primary/30 text-primary uppercase tracking-wider h-4">
                            <Gem className="w-2.5 h-2.5 mr-1" /> Matriz
                          </Badge>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground line-clamp-1">{service.description}</span>
                    </div>
                  </TableCell>
                  <TableCell>{getPricingModelBadge(service.pricingModel)}</TableCell>
                  <TableCell className="capitalize">{service.unitType}</TableCell>
                  <TableCell className="text-right font-medium">
                    {service.pricingModel === 'package' && service.packages?.length ? (
                      <div className="flex flex-col gap-1 items-end">
                        <Badge variant="secondary" className="text-[10px] py-0 px-1 mb-1">
                          {service.packages.length} {service.packages.length === 1 ? 'Servicio incluido' : 'Servicios incluidos'}
                        </Badge>
                        {service.packages.map((pkg, idx) => (
                          <div key={idx} className="text-xs flex items-center justify-end gap-2 w-full whitespace-nowrap">
                            <span className="text-muted-foreground line-clamp-1 max-w-[200px]">{pkg.name}</span>
                            <Badge variant="outline" className="text-[9px] py-0 px-1 font-normal opacity-70">
                              {pkg.units} und.
                            </Badge>
                            <span>{formatCurrency(pkg.price)}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <>
                        {formatCurrency(service.basePrice)}
                        {service.pricingModel === 'scalable' && service.unitPrice && (
                          <span className="text-xs text-muted-foreground block">
                            : {formatCurrency(service.unitPrice)} / extra
                          </span>
                        )}
                      </>
                    )}
                    {service.useComplexityMatrix && (
                      <span className="text-[10px] text-muted-foreground block mt-1 italic animate-pulse">
                        + hasta {formatCurrency(Math.max(...(service.complexityTiers?.map(t => t.surcharge) || [0])))} (Complejidad)
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button variant="ghost" size="icon" onClick={() => handleOpenEdit(service)}>
                        <Edit className="h-4 w-4 text-muted-foreground" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(service.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </TabsContent>

    <TabsContent value="plans" className="space-y-6 pt-6">
      <div className="flex flex-col sm:flex-row items-center gap-4 relative">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre de plan..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 pr-9 bg-muted/20 border-border/50 focus-visible:ring-primary"
          />
        </div>
        <div className="text-sm text-muted-foreground bg-muted/30 px-3 py-1.5 rounded-full border border-border/50">
          {plans?.length || 0} planes configurados
        </div>
      </div>

      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre del Plan</TableHead>
              <TableHead>Descripción</TableHead>
              <TableHead className="text-center">Servicios</TableHead>
              <TableHead className="text-right">Precio Total</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoadingPlans ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">
                  <div className="flex justify-center items-center">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                </TableCell>
              </TableRow>
            ) : (plans?.length ?? 0) === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                  No has registrado ningún plan predeterminado aún.
                </TableCell>
              </TableRow>
            ) : (
              plans?.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase())).map((plan) => (
                <TableRow key={plan.id}>
                  <TableCell className="font-medium">
                    <div className="flex flex-col gap-1">
                      <span className="font-bold">{plan.name}</span>
                      <span className="text-[10px] text-muted-foreground uppercase tracking-widest">Plan Predeterminado</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-xs max-w-[300px] line-clamp-2">{plan.description}</TableCell>
                  <TableCell className="text-center">
                    <div className="flex flex-col gap-1 items-center">
                      <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20">
                        {plan.items.length} {plan.items.length === 1 ? 'Servicio' : 'Servicios'}
                      </Badge>
                      <div className="flex -space-x-2 overflow-hidden mt-1">
                        {plan.items.slice(0, 3).map((item, idx) => {
                          const s = services?.find(srv => srv.id === item.serviceId);
                          return (
                            <div 
                              key={idx} 
                              className="inline-block h-6 w-6 rounded-full border-2 border-background flex items-center justify-center text-[10px] font-bold text-white shadow-sm"
                              style={{ backgroundColor: s?.color || '#888' }}
                              title={s?.name}
                            >
                              {s?.name?.[0]}
                            </div>
                          );
                        })}
                        {plan.items.length > 3 && (
                          <div className="flex items-center justify-center h-6 w-6 rounded-full border-2 border-background bg-muted text-[8px] font-medium">
                            +{plan.items.length - 3}
                          </div>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-bold text-primary">
                    {formatCurrency(calculatePlanTotal(plan.items))}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button variant="ghost" size="icon" onClick={() => router.push(`/services/plans/${plan.id}/edit`)}>
                        <Edit className="h-4 w-4 text-muted-foreground" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDeletePlan(plan.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </TabsContent>
  </Tabs>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[700px] flex flex-col max-h-[90vh] p-0">
          <form onSubmit={handleSubmit} className="flex flex-col h-full overflow-hidden">
            <DialogHeader className="p-6 pb-2">
              <DialogTitle className="text-2xl font-bold flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-primary/10 text-primary">
                  <Package className="w-5 h-5" />
                </div>
                {editingId ? 'Editar Servicio' : 'Nuevo Servicio'}
              </DialogTitle>
              <DialogDescription>
                Configura los detalles del servicio, modelo de cobro y variantes.
              </DialogDescription>
            </DialogHeader>

            <Tabs defaultValue="general" className="flex-1 flex flex-col overflow-hidden">
              <div className="px-6 border-b">
                <TabsList className="bg-transparent h-12 w-full justify-start gap-4 p-0">
                  <TabsTrigger value="general" className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none shadow-none h-12 bg-transparent">General</TabsTrigger>
                  <TabsTrigger value="pricing" className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none shadow-none h-12 bg-transparent">Precios y Unidades</TabsTrigger>
                  <TabsTrigger value="matrix" className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none shadow-none h-12 bg-transparent">Matriz de Complejidad</TabsTrigger>
                </TabsList>
              </div>

              <div className="flex-1 overflow-y-auto p-6">
                <TabsContent value="general" className="mt-0 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Nombre del Servicio *</Label>
                      <Input id="name" name="name" value={formData.name} onChange={handleChange} required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="color" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Color de Identificación</Label>
                      <div className="flex gap-2">
                        <Input id="color" name="color" type="color" value={formData.color} onChange={handleChange} className="w-12 h-10 p-1" />
                        <Input value={formData.color} onChange={handleChange} name="color" className="flex-1" />
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Descripción</Label>
                    <Textarea id="description" name="description" value={formData.description} onChange={handleChange} rows={3} />
                  </div>
                </TabsContent>

                <TabsContent value="pricing" className="mt-0 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label className="text-sm font-bold">Tipo de Unidad</Label>
                      <Select value={formData.unitType} onValueChange={(val) => handleSelectChange('unitType', val)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="unit">Unidad / Pieza</SelectItem>
                          <SelectItem value="session">Sesión / Día</SelectItem>
                          <SelectItem value="package">Paquete Completo</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-bold">Modelo de Cobro</Label>
                      <Select value={formData.pricingModel} onValueChange={(val) => handleSelectChange('pricingModel', val)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="fixed">Precio Fijo</SelectItem>
                          <SelectItem value="scalable">Escalable (con extras)</SelectItem>
                          <SelectItem value="package">Basado en Paquetes / Opciones</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-end">
                    <div className="space-y-2">
                       <Label className="text-sm font-bold">Impuesto IVA Predeterminado</Label>
                       <Select 
                        value={formData.ivaType} 
                        onValueChange={(val) => {
                          const selected = ivaTypes.find(t => t.id === val);
                          setFormData(prev => ({ ...prev, ivaType: val, ivaRate: selected?.rate || 0 }));
                        }}
                       >
                         <SelectTrigger>
                           <SelectValue placeholder="Sin impuesto (0%)" />
                         </SelectTrigger>
                         <SelectContent>
                           <SelectItem value="none">Sin impuesto (0%)</SelectItem>
                           {ivaTypes.map(iva => (
                             <SelectItem key={iva.id} value={iva.id}>{iva.name} ({iva.rate}%)</SelectItem>
                           ))}
                         </SelectContent>
                       </Select>
                    </div>
                    {formData.pricingModel !== 'package' && (
                      <div className="bg-primary/5 border border-primary/20 rounded-lg p-3 flex justify-between items-center h-10">
                        <span className="text-[10px] font-bold uppercase text-primary">Precio Base Calculado (PV/IVA):</span>
                        <span className="font-bold text-sm text-primary">
                          {formatCurrency(formData.basePrice / (1 + (formData.ivaRate / 100)))}
                        </span>
                      </div>
                    )}
                  </div>

                  <Separator />

                  {formData.pricingModel === 'fixed' && (
                    <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
                      <Label className="text-lg font-bold">Configuración de Precio Fijo</Label>
                      <div className="grid gap-2">
                        <Label htmlFor="basePrice">Precio Base (₡)</Label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground">₡</span>
                          <Input id="basePrice" name="basePrice" type="number" min="0" step="0.01" value={formData.basePrice === 0 ? "" : formData.basePrice} onChange={handleChange} placeholder="0" className="pl-9" />
                        </div>
                      </div>
                    </div>
                  )}

                  {formData.pricingModel === 'scalable' && (
                    <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
                      <Label className="text-lg font-bold">Configuración Escalable</Label>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="includedUnits">Unidades Incluidas</Label>
                          <Input id="includedUnits" name="includedUnits" type="number" min="0" value={formData.includedUnits === 0 ? "" : formData.includedUnits} onChange={handleChange} placeholder="0" />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="basePrice">Precio por estas unidades (₡)</Label>
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground">₡</span>
                            <Input id="basePrice" name="basePrice" type="number" min="0" step="0.01" value={formData.basePrice === 0 ? "" : formData.basePrice} onChange={handleChange} placeholder="0" className="pl-9" />
                          </div>
                        </div>
                        <div className="col-span-full space-y-2">
                          <Label htmlFor="unitPrice">Precio por cada unidad EXTRA (₡)</Label>
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground">₡</span>
                            <Input id="unitPrice" name="unitPrice" type="number" min="0" step="0.01" value={formData.unitPrice === 0 ? "" : formData.unitPrice} onChange={handleChange} placeholder="0" className="pl-9" />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {formData.pricingModel === 'package' && (
                    <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
                      <Label className="text-lg font-bold">Opciones de Paquete / Volumen</Label>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-2 p-3 bg-muted/30 rounded-lg border border-dashed">
                        <div className="space-y-1">
                          <Label className="text-[10px] uppercase font-bold text-muted-foreground text-center block">Nombre Opción</Label>
                          <Input 
                            value={newPackage.name} 
                            onChange={e => setNewPackage({...newPackage, name: e.target.value})} 
                            placeholder="Ej. 70 fotos"
                            className="h-8 text-sm"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-[10px] uppercase font-bold text-muted-foreground text-center block">Unidades</Label>
                            <Input 
                            type="number" 
                            value={newPackage.units === 0 ? "" : newPackage.units} 
                            onChange={e => setNewPackage({...newPackage, units: e.target.value === '' ? 0 : parseInt(e.target.value) || 0})} 
                            placeholder="0"
                            className="h-8 text-sm"
                          />
                        </div>
                        <div className="space-y-1 flex items-end gap-1">
                          <div className="flex-1">
                            <Label className="text-[10px] uppercase font-bold text-muted-foreground text-center block">Precio (₡)</Label>
                            <Input 
                              type="number" 
                              value={newPackage.price === 0 ? "" : newPackage.price} 
                              onChange={e => setNewPackage({...newPackage, price: e.target.value === '' ? 0 : parseFloat(e.target.value) || 0})} 
                              placeholder="0"
                              className="h-8 text-sm"
                            />
                          </div>
                          <Button type="button" size="sm" onClick={handleAddPackage} className="h-8">
                            <Plus className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        {formData.packages.map((pkg, idx) => (
                          <div key={idx} className="flex items-center justify-between p-2 border rounded-md bg-card shadow-sm">
                            <div className="flex items-center gap-4 px-2">
                              <span className="font-bold text-sm">{pkg.name}</span>
                              <Badge variant="secondary">{pkg.units} {formData.unitType === 'unit' ? 'unidades' : 'items'}</Badge>
                              <span className="font-bold text-primary">{formatCurrency(pkg.price)}</span>
                            </div>
                            <Button type="button" variant="ghost" size="icon" onClick={() => handleRemovePackage(idx)} className="h-8 w-8 text-destructive">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="matrix" className="mt-0 space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-base font-bold">Matriz de Complejidad</Label>
                      <p className="text-xs text-muted-foreground">Adicionales basados en el nivel de dificultad.</p>
                    </div>
                    <Switch checked={formData.useComplexityMatrix} onCheckedChange={(val) => handleSelectChange('useComplexityMatrix', val as any)} />
                  </div>

                  {formData.useComplexityMatrix && (
                    <div className="grid gap-4 animate-in fade-in slide-in-from-top-2">
                      {formData.complexityTiers.map((tier, index) => (
                        <div key={index} className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 border rounded-xl bg-card relative overflow-hidden group">
                          <div className="absolute top-0 left-0 w-1 h-full bg-primary/20 group-hover:bg-primary transition-colors" />
                          <div className="flex items-center gap-3">
                            <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary">
                              {index + 1}
                            </div>
                            <div className="flex-1">
                              <Label className="text-[10px] uppercase font-bold text-muted-foreground">Nivel</Label>
                              <p className="font-bold text-sm">{tier.name}</p>
                            </div>
                          </div>
                          <div className="space-y-1">
                            <Label className="text-[10px] uppercase font-bold text-muted-foreground block text-right">Recargo Adicional (₡)</Label>
                            <div className="relative">
                              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground">₡</span>
                              <Input 
                                type="number" 
                                value={tier.surcharge === 0 ? "" : tier.surcharge} 
                                onChange={(e) => handleComplexitySurchargeChange(index, e.target.value)} 
                                placeholder="0"
                                className="pl-6 h-9"
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </TabsContent>
              </div>
            </Tabs>

            <DialogFooter className="p-6 border-t bg-muted/50">
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting || !formData.name} className="min-w-[100px]">
                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
                {editingId ? 'Guardar Cambios' : 'Crear Servicio'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

  <Dialog open={isPlanDialogOpen} onOpenChange={setIsPlanDialogOpen}>
    <DialogContent className="sm:max-w-[700px] flex flex-col max-h-[90vh] p-0">
      <form onSubmit={handlePlanSubmit} className="flex flex-col h-full overflow-hidden">
        <DialogHeader className="p-6 pb-2">
          <DialogTitle>{editingPlanId ? 'Editar Plan' : 'Nuevo Plan Predeterminado'}</DialogTitle>
          <DialogDescription>
            Un plan es una colección de servicios que se agregan juntos a una factura o cotización.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="planName">Nombre del Plan *</Label>
              <Input 
                id="planName" 
                value={planFormData.name} 
                onChange={(e) => setPlanFormData(p => ({ ...p, name: e.target.value }))}
                placeholder="Ej. Plan Social Media Pro" 
                required 
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="planDesc">Descripción</Label>
              <Textarea 
                id="planDesc" 
                value={planFormData.description} 
                onChange={(e) => setPlanFormData(p => ({ ...p, description: e.target.value }))}
                placeholder="Breve explicación del plan..." 
              />
            </div>
          </div>

          <Separator />

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-base font-bold">Servicios en este Plan</Label>
              <Select onValueChange={handleAddServiceToPlan}>
                <SelectTrigger className="w-[250px]">
                  <SelectValue placeholder="Agregar servicio..." />
                </SelectTrigger>
                <SelectContent>
                  {services?.map(s => (
                    <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader className="bg-muted/50">
                  <TableRow>
                    <TableHead>Servicio</TableHead>
                    <TableHead className="w-24">Cant.</TableHead>
                    <TableHead className="text-right w-24">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {planFormData.items.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={3} className="h-24 text-center text-muted-foreground text-xs italic">
                        No hay servicios agregados. Selecciona uno arriba.
                      </TableCell>
                    </TableRow>
                  ) : (
                    planFormData.items.map((item, idx) => {
                      const service = services?.find(s => s.id === item.serviceId);
                      return (
                        <TableRow key={idx}>
                          <TableCell className="text-sm font-medium">
                            {service?.name || 'Cargando...'}
                          </TableCell>
                          <TableCell>
                            <Input 
                              type="number" 
                              min="0" 
                              value={item.quantity === 0 ? "" : item.quantity} 
                              onChange={(e) => handleUpdatePlanItem(idx, { quantity: e.target.value === '' ? 0 : parseInt(e.target.value) || 0 })}
                              placeholder="0"
                              className="h-8 py-0 px-2"
                            />
                          </TableCell>
                          <TableCell className="text-right">
                            <Button 
                              type="button" 
                              variant="ghost" 
                              size="icon" 
                              onClick={() => handleRemovePlanItem(idx)}
                              className="h-8 w-8 text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>

        <DialogFooter className="p-6 border-t bg-muted/50">
          <Button type="button" variant="outline" onClick={() => setIsPlanDialogOpen(false)}>
            Cancelar
          </Button>
          <Button type="submit" disabled={isSubmitting || !planFormData.name || planFormData.items.length === 0}>
            {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
            {editingPlanId ? 'Guardar Cambios' : 'Crear Plan'}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  </Dialog>
    </div>
  );
}
