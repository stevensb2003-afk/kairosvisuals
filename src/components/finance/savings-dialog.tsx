'use client';

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useFirestore, useUser } from '@/firebase';
import { createSavingsGoal } from '@/lib/financeService';
import { PiggyBank } from 'lucide-react';
import { PremiumDatePicker } from '@/components/ui/premium-date-picker';
import { parseISO, format as formatDate } from 'date-fns';


interface SavingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SavingsDialog({ open, onOpenChange }: SavingsDialogProps) {
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [currentAmount, setCurrentAmount] = useState('');
  const [deadline, setDeadline] = useState('');
  const [notes, setNotes] = useState('');
  
  const firestore = useFirestore();
  const { user } = useUser();

  const resetForm = () => {
    setName('');
    setTargetAmount('');
    setCurrentAmount('');
    setDeadline('');
    setNotes('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firestore || !user) return;
    
    try {
      setLoading(true);
      
      await createSavingsGoal(firestore, {
        name,
        targetAmount: parseFloat(targetAmount),
        currentAmount: currentAmount ? parseFloat(currentAmount) : 0,
        deadline: deadline || undefined,
        notes: notes || undefined,
      });

      resetForm();
      onOpenChange(false);
    } catch (error) {
      console.error('Error creating savings goal:', error);
      alert('Hubo un error al guardar la meta de ahorro.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(val) => { if (!val) resetForm(); onOpenChange(val); }}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <PiggyBank className="w-5 h-5 text-pink-500" />
            Nueva Meta de Ahorro
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nombre de la Meta</Label>
            <Input 
              id="name" 
              placeholder="Ej. Fondo de Emergencia, MacBook M3..." 
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="targetAmount">Meta Total (₡)</Label>
              <Input 
                id="targetAmount" 
                type="number" 
                min="0"
                step="0.01"
                placeholder="0.00" 
                value={targetAmount}
                onChange={(e) => setTargetAmount(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="currentAmount">Saldo Actual (₡)</Label>
              <Input 
                id="currentAmount" 
                type="number" 
                min="0"
                step="0.01"
                placeholder="0.00 (Opcional)" 
                value={currentAmount}
                onChange={(e) => setCurrentAmount(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Fecha Límite (Opcional)</Label>
            <PremiumDatePicker 
              date={deadline ? parseISO(deadline) : undefined}
              onSelect={(val) => setDeadline(val ? formatDate(val, 'yyyy-MM-dd') : '')}
              placeholder="Seleccionar plazo"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="notes">Notas (Opcional)</Label>
            <Input 
              id="notes" 
              placeholder="Ej. Guardar el 10% de cada proyecto" 
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          <DialogFooter className="pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading} className="bg-pink-600 hover:bg-pink-700 text-white">
              {loading ? 'Guardando...' : 'Crear Meta'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
