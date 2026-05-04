import { useState, useCallback } from 'react';

export interface InvoiceLineItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  discountValue: number;
  discountType: 'percentage' | 'amount';
  ivaType: string;
  ivaRate: number;
  total: number;
  serviceId?: string;
  serviceName?: string;
  selectedPackage?: string;
  selectedComplexityLevel?: number;
  overriddenQuantity?: number;
  paymentCategory?: 'recurring' | 'extra';
}

interface UseInvoiceFormProps {
  initialItems?: InvoiceLineItem[];
  services?: any[] | null;
  settings?: any | null;
}

export function useInvoiceForm({
  initialItems = [],
  services = [],
  settings = {}
}: UseInvoiceFormProps) {
  const [items, setItems] = useState<InvoiceLineItem[]>(
    initialItems.length > 0 ? initialItems : [{
      id: crypto.randomUUID(),
      description: '',
      quantity: 1,
      unitPrice: 0,
      discount: 0,
      discountValue: 0,
      discountType: 'amount',
      ivaType: 'none',
      ivaRate: 0,
      total: 0,
      paymentCategory: 'extra'
    }]
  );

  const addItem = useCallback(() => {
    setItems(prev => [...prev, {
      id: crypto.randomUUID(),
      description: '',
      quantity: 1,
      unitPrice: 0,
      discount: 0,
      discountValue: 0,
      discountType: 'amount',
      ivaType: 'none',
      ivaRate: 0,
      total: 0,
      paymentCategory: 'extra'
    }]);
  }, []);

  const removeItem = useCallback((id: string) => {
    setItems(prev => {
      if (prev.length === 1) {
        return [{
          id: crypto.randomUUID(),
          description: '',
          quantity: 1,
          unitPrice: 0,
          discount: 0,
          discountValue: 0,
          discountType: 'amount',
          ivaType: 'none',
          ivaRate: 0,
          total: 0,
          paymentCategory: 'extra'
        }];
      }
      return prev.filter(i => i.id !== id);
    });
  }, []);

  const updateItem = useCallback((id: string, field: keyof InvoiceLineItem, value: any) => {
    setItems(prev => {
      const newItems = [...prev];
      const index = newItems.findIndex(i => i.id === id);
      if (index === -1) return prev;

      let updated = { ...newItems[index], [field]: value };

      // Complex Service Selection Logic
      if (field === 'serviceId') {
        if (value !== 'manual') {
          const selectedService = services?.find(s => s.id === value);
          if (selectedService) {
            // Note: Package selector logic still needs to be handled by UI
            // but we update as much as we can here
            updated.serviceName = selectedService.name || '';
            updated.description = selectedService.description || '';
            delete updated.overriddenQuantity;
            delete updated.selectedComplexityLevel;
            delete updated.selectedPackage;

            let basePrice = selectedService.basePrice || 0;

            if (selectedService.pricingModel === 'fixed') {
              updated.quantity = 1;
            } else if (selectedService.pricingModel === 'scalable') {
              updated.quantity = 1;
              updated.overriddenQuantity = selectedService.includedUnits || 1;
            }

            if (selectedService.useComplexityMatrix && selectedService.complexityTiers?.length) {
              const firstTier = selectedService.complexityTiers[0];
              updated.selectedComplexityLevel = firstTier.level;
              basePrice += firstTier.surcharge || 0;
            }

            updated.unitPrice = basePrice;
            updated.ivaType = selectedService.ivaType || 'none';
            updated.ivaRate = selectedService.ivaRate || 0;
          }
        } else {
          updated.serviceId = undefined;
          updated.serviceName = undefined;
          updated.unitPrice = 0;
          updated.quantity = 1;
          updated.discount = 0;
          delete updated.overriddenQuantity;
          delete updated.selectedComplexityLevel;
        }
      }

      // Complexity Matrix Logic
      if (field === 'selectedComplexityLevel' && updated.serviceId) {
        const svc = services?.find(s => s.id === updated.serviceId);
        if (svc && svc.useComplexityMatrix) {
          const tier = svc.complexityTiers?.find((t: any) => t.level === value);
          let base = svc.basePrice || 0;
          if (svc.pricingModel === 'scalable') {
            const extra = Math.max(0, (updated.overriddenQuantity || 0) - (svc.includedUnits || 0));
            base += extra * (svc.unitPrice || 0);
          }
          updated.unitPrice = base + (tier?.surcharge || 0);
        }
      }

      // Scalable Pricing Logic
      if (field === 'overriddenQuantity' && updated.serviceId) {
        const svc = services?.find(s => s.id === updated.serviceId);
        if (svc && svc.pricingModel === 'scalable') {
          const extra = Math.max(0, (value || 0) - (svc.includedUnits || 0));
          let price = (svc.basePrice || 0) + (extra * (svc.unitPrice || 0));
          if (svc.useComplexityMatrix && updated.selectedComplexityLevel !== undefined) {
            const tier = svc.complexityTiers?.find((t: any) => t.level === updated.selectedComplexityLevel);
            price += (tier?.surcharge || 0);
          }
          updated.unitPrice = price;
        }
      }

      // IVA Logic
      if (field === 'ivaType') {
        const selected = settings?.ivaTypes?.find((t: any) => t.id === value);
        updated.ivaType = value;
        updated.ivaRate = selected?.rate || 0;
      }

      // Recalculate item total
      const qty = updated.quantity || 0;
      const up = updated.unitPrice || 0;
      const dv = updated.discountValue || 0;
      const dt = updated.discountType || 'amount';

      let absDisc = 0;
      if (dt === 'percentage') {
        absDisc = (qty * up) * (dv / 100);
      } else {
        absDisc = dv;
      }

      updated.discount = absDisc;
      updated.total = (qty * up) - absDisc;
      
      newItems[index] = updated;
      return newItems;
    });
  }, [services, settings]);

  const setPackageForItem = useCallback((id: string, service: any, pkg: any) => {
    setItems(prev => {
      const newItems = [...prev];
      const index = newItems.findIndex(i => i.id === id);
      if (index === -1) return prev;

      let updated = { ...newItems[index] };
      updated.serviceId = service.id;
      updated.serviceName = service.name;
      updated.selectedPackage = pkg.name;
      updated.description = `${service.name} - ${pkg.name}`;
      
      let finalPrice = pkg.price;
      if (service.useComplexityMatrix && updated.selectedComplexityLevel !== undefined) {
        const tier = service.complexityTiers?.find((t: any) => t.level === updated.selectedComplexityLevel);
        if (tier) finalPrice += (tier.surcharge || 0);
      }
      
      updated.unitPrice = finalPrice;
      updated.quantity = 1;
      updated.ivaType = service.ivaType || 'none';
      updated.ivaRate = service.ivaRate || 0;
      
      const qty = updated.quantity || 0;
      const up = updated.unitPrice || 0;
      const dv = updated.discountValue || 0;
      const dt = updated.discountType || 'amount';

      let absDisc = 0;
      if (dt === 'percentage') {
        absDisc = (qty * up) * (dv / 100);
      } else {
        absDisc = dv;
      }

      updated.discount = absDisc;
      updated.total = (qty * up) - absDisc;

      newItems[index] = updated;
      return newItems;
    });
  }, []);

  const loadPlan = useCallback((planId: string, predefinedPlans: any[], services: any[]) => {
    const plan = predefinedPlans.find(p => p.id === planId);
    if (!plan) return null;

    const newItems: InvoiceLineItem[] = plan.items.map((pItem: any) => {
      const service = services?.find(s => s.id === pItem.serviceId);
      const basePrice = pItem.overridePrice || service?.basePrice || 0;

      return {
        id: crypto.randomUUID(),
        serviceId: pItem.serviceId,
        serviceName: service?.name || '',
        description: pItem.overrideDescription || service?.description || '',
        quantity: pItem.quantity,
        unitPrice: basePrice,
        discount: 0,
        discountValue: 0,
        discountType: 'amount',
        ivaType: service?.ivaType || 'none',
        ivaRate: service?.ivaRate || 0,
        total: pItem.quantity * basePrice,
        paymentCategory: 'extra'
      };
    });

    setItems(prev => {
      let currentItems = [...prev];
      if (currentItems.length === 1 && currentItems[0].description === '' && currentItems[0].unitPrice === 0) {
        currentItems = [];
      }
      return [...currentItems, ...newItems];
    });

    return { name: plan.name, count: newItems.length };
  }, []);

  return {
    items,
    setItems,
    addItem,
    removeItem,
    updateItem,
    setPackageForItem,
    loadPlan
  };
}
