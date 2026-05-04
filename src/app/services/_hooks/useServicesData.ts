'use client';

import { useMemo, useState, useEffect } from 'react';
import { initializeFirebase } from '@/firebase/init';
import {
  collection, query, orderBy, addDoc, doc, deleteDoc,
  updateDoc, serverTimestamp, getDoc,
} from 'firebase/firestore';
import { useCollection } from '@/firebase/firestore/use-collection';
import { ProductOrService, PredefinedPlan, PlanItem } from '@/lib/types';

export type ServiceFormData = {
  name: string;
  description: string;
  color: string;
  unitType: 'unit' | 'session' | 'package';
  pricingModel: 'fixed' | 'scalable' | 'package';
  basePrice: number;
  includedUnits: number;
  unitPrice: number;
  useComplexityMatrix: boolean;
  complexityTiers: { level: number; name: string; surcharge: number }[];
  packages: { name: string; units: number; price: number }[];
  ivaType: string;
  ivaRate: number;
};

export type PlanFormData = {
  name: string;
  description: string;
  items: PlanItem[];
};

const DEFAULT_FORM: ServiceFormData = {
  name: '', description: '', color: '#888888',
  unitType: 'session', pricingModel: 'fixed',
  basePrice: 0, includedUnits: 0, unitPrice: 0,
  useComplexityMatrix: false,
  complexityTiers: [
    { level: 0, name: 'Estándar', surcharge: 0 },
    { level: 1, name: 'Bajo', surcharge: 500 },
    { level: 2, name: 'Medio', surcharge: 1500 },
    { level: 3, name: 'Alto', surcharge: 2000 },
  ],
  packages: [], ivaType: '', ivaRate: 0,
};

export function useServicesData() {
  const { firestore } = initializeFirebase();

  const servicesQuery = useMemo(() =>
    query(collection(firestore, 'services'), orderBy('createdAt', 'desc')),
  [firestore]);
  const { data: services, isLoading } = useCollection<ProductOrService>(servicesQuery);

  const plansQuery = useMemo(() =>
    query(collection(firestore, 'predefined_plans'), orderBy('createdAt', 'desc')),
  [firestore]);
  const { data: plans, isLoading: isLoadingPlans } = useCollection<PredefinedPlan>(plansQuery);

  const [ivaTypes, setIvaTypes] = useState<any[]>([]);
  useEffect(() => {
    getDoc(doc(firestore, 'settings', 'general')).then(snap => {
      if (snap.exists() && snap.data().ivaTypes)
        setIvaTypes(snap.data().ivaTypes.filter((t: any) => t.isActive));
    }).catch(console.error);
  }, [firestore]);

  // ── Service Dialog ────────────────────────────────────────────────────────
  const [isServiceDialogOpen, setIsServiceDialogOpen] = useState(false);
  const [editingServiceId, setEditingServiceId] = useState<string | null>(null);
  const [formData, setFormData] = useState<ServiceFormData>(DEFAULT_FORM);
  const [newPackage, setNewPackage] = useState({ name: '', units: 1, price: 0 });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const openNewService = () => {
    setEditingServiceId(null);
    setFormData(DEFAULT_FORM);
    setNewPackage({ name: '', units: 1, price: 0 });
    setIsServiceDialogOpen(true);
  };

  const openEditService = (s: ProductOrService) => {
    setEditingServiceId(s.id);
    setFormData({
      name: s.name, description: s.description, color: s.color || '#888888',
      unitType: s.unitType, pricingModel: s.pricingModel,
      basePrice: s.basePrice || 0, includedUnits: s.includedUnits || 0,
      unitPrice: s.unitPrice || 0,
      useComplexityMatrix: s.useComplexityMatrix || false,
      complexityTiers: s.complexityTiers || DEFAULT_FORM.complexityTiers,
      packages: s.packages || [], ivaType: s.ivaType || '', ivaRate: s.ivaRate || 0,
    });
    setNewPackage({ name: '', units: 1, price: 0 });
    setIsServiceDialogOpen(true);
  };

  const submitService = async () => {
    setIsSubmitting(true);
    try {
      const payload = {
        name: formData.name, description: formData.description, color: formData.color,
        unitType: formData.unitType, pricingModel: formData.pricingModel,
        basePrice: formData.basePrice,
        ...(formData.pricingModel === 'scalable' ? {
          includedUnits: formData.includedUnits, unitPrice: formData.unitPrice,
        } : {}),
        ...(formData.pricingModel === 'package' ? { packages: formData.packages } : {}),
        ...(formData.useComplexityMatrix ? {
          useComplexityMatrix: true, complexityTiers: formData.complexityTiers,
        } : { useComplexityMatrix: false }),
        ivaType: formData.ivaType, ivaRate: formData.ivaRate,
      };

      if (editingServiceId) {
        await updateDoc(doc(firestore, 'services', editingServiceId), {
          ...payload, updatedAt: serverTimestamp(),
        });
      } else {
        await addDoc(collection(firestore, 'services'), {
          ...payload, createdAt: serverTimestamp(), updatedAt: serverTimestamp(),
        });
      }
      setIsServiceDialogOpen(false);
    } catch (e) { console.error(e); }
    finally { setIsSubmitting(false); }
  };

  const deleteService = async (id: string) => {
    await deleteDoc(doc(firestore, 'services', id));
  };

  // ── Plan Dialog ───────────────────────────────────────────────────────────
  const [isPlanDialogOpen, setIsPlanDialogOpen] = useState(false);
  const [editingPlanId, setEditingPlanId] = useState<string | null>(null);
  const [planFormData, setPlanFormData] = useState<PlanFormData>({
    name: '', description: '', items: [],
  });

  const openNewPlan = () => {
    setEditingPlanId(null);
    setPlanFormData({ name: '', description: '', items: [] });
    setIsPlanDialogOpen(true);
  };

  const openEditPlan = (plan: PredefinedPlan) => {
    setEditingPlanId(plan.id);
    setPlanFormData({ name: plan.name, description: plan.description, items: plan.items });
    setIsPlanDialogOpen(true);
  };

  const submitPlan = async () => {
    setIsSubmitting(true);
    try {
      const payload = {
        name: planFormData.name, description: planFormData.description,
        items: planFormData.items, updatedAt: serverTimestamp(),
      };
      if (editingPlanId) {
        await updateDoc(doc(firestore, 'predefined_plans', editingPlanId), payload);
      } else {
        await addDoc(collection(firestore, 'predefined_plans'), {
          ...payload, createdAt: serverTimestamp(),
        });
      }
      setIsPlanDialogOpen(false);
    } catch (e) { console.error(e); }
    finally { setIsSubmitting(false); }
  };

  const deletePlan = async (id: string) => {
    await deleteDoc(doc(firestore, 'predefined_plans', id));
  };

  // ── Helpers ───────────────────────────────────────────────────────────────
  const calculatePlanTotal = (items: PlanItem[]) =>
    items.reduce((acc, item) => {
      if (item.overridePrice !== undefined) return acc + item.overridePrice * item.quantity;
      const service = services?.find(s => s.id === item.serviceId);
      if (!service) return acc;
      let price = service.basePrice || 0;
      if (service.pricingModel === 'scalable' && item.overriddenQuantity !== undefined) {
        price += Math.max(0, (item.overriddenQuantity || 0) - (service.includedUnits || 0)) * (service.unitPrice || 0);
      } else if (service.pricingModel === 'package' && item.selectedPackage) {
        const pkg = service.packages?.find(p => p.name === item.selectedPackage);
        if (pkg) price = pkg.price;
      }
      if (service.useComplexityMatrix && item.selectedComplexityLevel !== undefined) {
        const tier = service.complexityTiers?.find(t => t.level === item.selectedComplexityLevel);
        if (tier) price += tier.surcharge || 0;
      }
      return acc + price * item.quantity;
    }, 0);

  return {
    // Data
    services, plans, isLoading, isLoadingPlans, ivaTypes,
    // Service dialog
    isServiceDialogOpen, setIsServiceDialogOpen,
    editingServiceId, formData, setFormData,
    newPackage, setNewPackage, isSubmitting,
    openNewService, openEditService, submitService, deleteService,
    // Plan dialog
    isPlanDialogOpen, setIsPlanDialogOpen,
    editingPlanId, planFormData, setPlanFormData,
    openNewPlan, openEditPlan, submitPlan, deletePlan,
    // Utils
    calculatePlanTotal,
  };
}
