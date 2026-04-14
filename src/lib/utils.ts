import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatPhone(phone: string | undefined | null) {
  if (!phone) return "";
  
  // Remove all non-numeric characters except +
  const cleaned = phone.replace(/[^\d+]/g, "");
  
  // Format for Costa Rica and similar: +XXX XXXX XXXX (12 chars total)
  if (cleaned.startsWith("+") && cleaned.length === 12) {
    return `${cleaned.substring(0, 4)} ${cleaned.substring(4, 8)} ${cleaned.substring(8, 12)}`;
  }
  
  // General formatting: Group by 4 from the end
  // First, isolate CC if present
  if (cleaned.startsWith("+")) {
    const ccMatch = cleaned.match(/^(\+\d{1,3})/);
    if (ccMatch) {
      const cc = ccMatch[0];
      const rest = cleaned.substring(cc.length);
      const grouped = rest.split('').reverse().join('').replace(/(\d{4})/g, '$1 ').split('').reverse().join('').trim();
      return `${cc} ${grouped}`;
    }
  }

  return cleaned.split('').reverse().join('').replace(/(\d{4})/g, '$1 ').split('').reverse().join('').trim();
}
export function formatCurrency(amount: number | undefined | null) {
  if (amount === null || amount === undefined || isNaN(amount)) return "₡0.00";
  return new Intl.NumberFormat('es-CR', {
    style: 'currency',
    currency: 'CRC',
  }).format(amount);
}
