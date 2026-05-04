import { useMemo } from 'react';

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

interface UseInvoiceCalculationsProps {
  items: InvoiceLineItem[];
  globalDiscountType: 'percentage' | 'amount';
  globalDiscountValue: number;
}

export function useInvoiceCalculations({
  items,
  globalDiscountType,
  globalDiscountValue
}: UseInvoiceCalculationsProps) {
  const itemCalculations = useMemo(() => {
    return items.map(item => {
      const lineTotalBeforeDiscount = (item.quantity || 0) * (item.unitPrice || 0);
      let discAmt = 0;
      if (item.discountType === 'percentage') {
        discAmt = lineTotalBeforeDiscount * ((item.discountValue || 0) / 100);
      } else {
        discAmt = item.discountValue || 0;
      }

      const lineFinal = Math.max(0, lineTotalBeforeDiscount - discAmt);
      const rate = (item.ivaRate || 0) / 100;
      const base = lineFinal / (1 + rate);
      const tax = lineFinal - base;

      return {
        ...item,
        discount: discAmt,
        total: lineFinal,
        subtotal: base,
        tax: tax
      };
    });
  }, [items]);

  const totalBeforeGlobalDiscount = useMemo(() =>
    itemCalculations.reduce((acc, item) => acc + item.total, 0),
    [itemCalculations]);

  const globalDiscountAmount = useMemo(() => {
    if (globalDiscountType === 'percentage') {
      return totalBeforeGlobalDiscount * (globalDiscountValue / 100);
    }
    return Math.min(globalDiscountValue, totalBeforeGlobalDiscount);
  }, [totalBeforeGlobalDiscount, globalDiscountType, globalDiscountValue]);

  const totalAmount = Math.max(0, totalBeforeGlobalDiscount - globalDiscountAmount);

  const discountFactor = totalBeforeGlobalDiscount > 0 
    ? (totalBeforeGlobalDiscount - globalDiscountAmount) / totalBeforeGlobalDiscount 
    : 0;

  const ivaAmount = useMemo(() =>
    itemCalculations.reduce((acc, item) => acc + (item.tax || 0), 0) * discountFactor,
    [itemCalculations, discountFactor]);

  const subtotalAmount = totalAmount - ivaAmount;
  const totalDiscounts = useMemo(() => 
    itemCalculations.reduce((acc, item) => acc + (item.discount || 0), 0), 
    [itemCalculations]);

  return {
    itemCalculations,
    totalBeforeGlobalDiscount,
    globalDiscountAmount,
    subtotalAmount,
    ivaAmount,
    totalAmount,
    totalDiscounts
  };
}
