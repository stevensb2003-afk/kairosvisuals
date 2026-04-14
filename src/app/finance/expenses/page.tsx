'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Receipt, Plus, Search, Filter, ChevronLeft } from 'lucide-react';
import Link from 'next/link';
import { useFirestore } from '@/firebase';
import { query, collection, onSnapshot, orderBy, where } from 'firebase/firestore';
import type { Expense } from '@/lib/types';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { ExpenseDialog } from '@/components/finance/expense-dialog';

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  // Firedstore instance
  const firestore = useFirestore();

  useEffect(() => {
    if (!firestore) return;

    try {
      // Query to get expenses that are NOT subscriptions or assets (activo)
      const q = query(
        collection(firestore, 'expenses'),
        where('expenseType', 'in', ['operativo', 'legal', 'otro', 'reparticion_socios']),
        orderBy('date', 'desc')
      );

      const unsubscribe = onSnapshot(q, (snapshot) => {
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Expense));
        setExpenses(data);
        setLoading(false);
      }, (error) => {
        console.error("Error fetching expenses:", error);
        setLoading(false);
      });

      return () => unsubscribe();
    } catch (error) {
      console.error("Firebase query error:", error);
      setLoading(false);
    }
  }, [firestore]);

  const filteredExpenses = expenses.filter(exp => 
    exp.description.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (exp.vendor && exp.vendor.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const totalAmount = filteredExpenses.reduce((acc, curr) => acc + curr.amount, 0);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <Link href="/finance">
              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                <ChevronLeft className="w-5 h-5" />
              </Button>
            </Link>
            <h1 className="text-2xl font-bold font-headline flex items-center gap-2">
              <Receipt className="w-6 h-6 text-orange-500" />
              Gastos Operativos
            </h1>
          </div>
          <p className="text-muted-foreground text-sm ml-11">Administra los gastos corrientes, proveedores y costos operacionales.</p>
        </div>
        <Button className="shrink-0 group" onClick={() => setIsDialogOpen(true)}>
          <Plus className="w-4 h-4 mr-2" /> Nuevo Gasto
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-card p-4 rounded-xl border border-border/50 shadow-sm">
        <div className="relative w-full sm:w-[300px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            placeholder="Buscar por descripción o proveedor..." 
            className="pl-9 bg-background"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Button variant="outline" size="sm" className="w-full sm:w-auto">
            <Filter className="w-4 h-4 mr-2" /> Filtros
          </Button>
          <div className="bg-primary/10 text-primary px-4 py-2 rounded-md font-semibold whitespace-nowrap">
            Total: ₡{totalAmount.toLocaleString('es-CR')}
          </div>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead>Fecha</TableHead>
                <TableHead>Descripción</TableHead>
                <TableHead>Categoría</TableHead>
                <TableHead>Proveedor</TableHead>
                <TableHead className="text-right">Monto</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    Cargando gastos...
                  </TableCell>
                </TableRow>
              ) : filteredExpenses.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-12">
                    <div className="flex flex-col items-center justify-center text-muted-foreground">
                      <Receipt className="w-8 h-8 mb-4 opacity-20" />
                      <p>No se encontraron gastos {searchTerm && 'que coincidan con la búsqueda'}.</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredExpenses.map((expense) => (
                  <TableRow key={expense.id} className="hover:bg-muted/50 cursor-pointer transition-colors">
                    <TableCell className="font-medium">
                      {expense.date ? format(new Date(expense.date), 'dd MMM yyyy', { locale: es }) : 'N/A'}
                    </TableCell>
                    <TableCell>{expense.description}</TableCell>
                    <TableCell>
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-[10px] font-medium bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300 capitalize">
                        {expense.category.replace('_', ' ')}
                      </span>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{expense.vendor || '-'}</TableCell>
                    <TableCell className="text-right font-bold text-orange-600 dark:text-orange-400">
                      ₡{expense.amount.toLocaleString('es-CR')}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      <ExpenseDialog 
        open={isDialogOpen} 
        onOpenChange={setIsDialogOpen} 
        type="operativo" 
      />
    </div>
  );
}
