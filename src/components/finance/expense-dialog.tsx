'use client';

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useFirestore, useUser } from '@/firebase';
import { createExpense } from '@/lib/financeService';
import type { ExpenseType, ExpenseCategory, SubscriptionPeriodicity } from '@/lib/types';
import { Receipt, Laptop, CreditCard } from 'lucide-react';
import { PremiumDatePicker } from '@/components/ui/premium-date-picker';
import { parseISO, format as formatDate } from 'date-fns';

interface ExpenseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: 'operativo' | 'subscripcion' | 'activo';
}

export function ExpenseDialog({ open, onOpenChange, type }: ExpenseDialogProps) {
  const [loading, setLoading] = useState(false);
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [category, setCategory] = useState<ExpenseCategory>('other');
  const [vendor, setVendor] = useState('');
  
  // Subscription specific
  const [periodicity, setPeriodicity] = useState<SubscriptionPeriodicity>('monthly');
  const [nextPaymentDate, setNextPaymentDate] = useState('');
  
  // Asset specific
  const [isCredit, setIsCredit] = useState(false);

  const firestore = useFirestore();
  const { user } = useUser();

  const resetForm = () => {
    setDescription('');
    setAmount('');
    setDate(new Date().toISOString().split('T')[0]);
    setCategory('other');
    setVendor('');
    setPeriodicity('monthly');
    setNextPaymentDate('');
    setIsCredit(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firestore || !user) return;
    
    try {
      setLoading(true);
      
      const [year, month] = date.split('-');
      const billingPeriod = `${year}-${month}`;
      
      let expenseType: ExpenseType = type === 'operativo' ? 'operativo' : 
                                     type === 'subscripcion' ? 'subscripcion' : 'activo';

      await createExpense(firestore, {
        description,
        amount: parseFloat(amount),
        category,
        expenseType,
        date,
        vendor: vendor || undefined,
        registeredBy: user.uid,
        billingPeriod,
        isRecurring: type === 'subscripcion' || isCredit,
        periodicity: type === 'subscripcion' ? periodicity : undefined,
        nextPaymentDate: type === 'subscripcion' ? nextPaymentDate : undefined,
      });

      resetForm();
      onOpenChange(false);
    } catch (error) {
      console.error('Error creating expense:', error);
      alert('Hubo un error al guardar el registro.');
    } finally {
      setLoading(false);
    }
  };

  const getTitle = () => {
    switch (type) {
      case 'operativo': return 'Nuevo Gasto Operativo';
      case 'subscripcion': return 'Nueva Suscripción';
      case 'activo': return 'Añadir Activo / Equipo';
    }
  };

  const getIcon = () => {
    switch (type) {
      case 'operativo': return <Receipt className="w-5 h-5 text-orange-500" />;
      case 'subscripcion': return <CreditCard className="w-5 h-5 text-blue-500" />;
      case 'activo': return <Laptop className="w-5 h-5 text-emerald-500" />;
    }
  };

  return (
    <Dialog open={open} onOpenChange={(val) => { if (!val) resetForm(); onOpenChange(val); }}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {getIcon()}
            {getTitle()}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label htmlFor="description">Descripción</Label>
            <Input 
              id="description" 
              placeholder={type === 'activo' ? 'Ej. MacBook Pro M3' : 'Ej. Licencia Adobe CC'} 
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Monto (₡)</Label>
              <Input 
                id="amount" 
                type="number" 
                min="0"
                step="0.01"
                placeholder="0.00" 
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Fecha</Label>
              <PremiumDatePicker 
                date={date ? parseISO(date) : undefined}
                onSelect={(val) => setDate(val ? formatDate(val, 'yyyy-MM-dd') : '')}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="vendor">Proveedor (Opcional)</Label>
            <Input 
              id="vendor" 
              placeholder="Ej. Apple, Adobe, ICE..." 
              value={vendor}
              onChange={(e) => setVendor(e.target.value)}
            />
          </div>

          {type === 'operativo' && (
            <div className="space-y-2">
              <Label htmlFor="category">Categoría</Label>
              <Select value={category} onValueChange={(val) => setCategory(val as ExpenseCategory)}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar categoría" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="software_subscriptions">Software & Servicios</SelectItem>
                  <SelectItem value="maintenance">Mantenimiento</SelectItem>
                  <SelectItem value="equipment">Equipo (Menor)</SelectItem>
                  <SelectItem value="legal">Trámites Legales</SelectItem>
                  <SelectItem value="other">Otro</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {type === 'subscripcion' && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="periodicity">Periodicidad</Label>
                  <Select value={periodicity} onValueChange={(val) => setPeriodicity(val as SubscriptionPeriodicity)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Periodo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="monthly">Mensual</SelectItem>
                      <SelectItem value="quarterly">Trimestral</SelectItem>
                      <SelectItem value="semiannual">Semestral</SelectItem>
                      <SelectItem value="annual">Anual</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Próximo Cobro</Label>
                  <PremiumDatePicker 
                    date={nextPaymentDate ? parseISO(nextPaymentDate) : undefined}
                    onSelect={(val) => setNextPaymentDate(val ? formatDate(val, 'yyyy-MM-dd') : '')}
                    placeholder="Fecha de cobro"
                  />
                </div>
              </div>
            </>
          )}

          {type === 'activo' && (
            <div className="flex items-center space-x-2 pt-2">
              <input 
                type="checkbox" 
                id="isCredit" 
                className="w-4 h-4 text-emerald-600 rounded border-gray-300 focus:ring-emerald-500"
                checked={isCredit}
                onChange={(e) => setIsCredit(e.target.checked)}
              />
              <Label htmlFor="isCredit" className="font-normal">
                Adquirido a crédito / cuotas
              </Label>
            </div>
          )}

          <DialogFooter className="pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading} className={
              type === 'operativo' ? 'bg-orange-600 hover:bg-orange-700 text-white' :
              type === 'subscripcion' ? 'bg-blue-600 hover:bg-blue-700 text-white' :
              'bg-emerald-600 hover:bg-emerald-700 text-white'
            }>
              {loading ? 'Guardando...' : 'Guardar Registro'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
