/**
 * ============================================================================
 * Kairos Visuals — Finance Service
 * ============================================================================
 * Funciones helper para operaciones de gastos e ingresos en Firestore.
 * Sigue el patrón del proyecto: las funciones reciben `firestore` como param.
 * 
 * Firestore Collections:
 *   - /expenses/{expenseId}
 *   - /incomes/{incomeId}
 * ============================================================================
 */

import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDocs,
  query,
  where,
  orderBy,
  type Firestore,
} from 'firebase/firestore';
import type { Expense, Income, ExpenseType, IncomeSource, SavingsGoal } from './types';
import { calculateProfitDistribution } from './types';

// ============================================================================
// HELPERS
// ============================================================================

/** Retorna el período de facturación (YYYY-MM) para una fecha dada */
export function getBillingPeriod(date: Date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}

/** Formatea un período (YYYY-MM) a etiqueta legible (ej: "abril 2025") */
export function formatPeriodLabel(period: string): string {
  const [year, month] = period.split('-');
  const date = new Date(Number(year), Number(month) - 1, 1);
  return date.toLocaleDateString('es-CR', { month: 'long', year: 'numeric' });
}

/** Genera un array de los últimos N períodos (YYYY-MM) */
export function getLastNPeriods(n: number = 12): string[] {
  const periods: string[] = [];
  const now = new Date();
  for (let i = 0; i < n; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    periods.push(getBillingPeriod(d));
  }
  return periods;
}

// ============================================================================
// EXPENSE CRUD
// ============================================================================

export type CreateExpenseInput = Omit<Expense, 'id' | 'createdAt' | 'updatedAt'>;

export async function createExpense(
  firestore: Firestore,
  input: CreateExpenseInput
): Promise<string> {
  const now = new Date().toISOString();
  const ref = await addDoc(collection(firestore, 'expenses'), {
    ...input,
    createdAt: now,
    updatedAt: now,
  });
  return ref.id;
}

export async function updateExpense(
  firestore: Firestore,
  id: string,
  data: Partial<CreateExpenseInput>
): Promise<void> {
  await updateDoc(doc(firestore, 'expenses', id), {
    ...data,
    updatedAt: new Date().toISOString(),
  });
}

export async function deleteExpense(firestore: Firestore, id: string): Promise<void> {
  await deleteDoc(doc(firestore, 'expenses', id));
}

export async function getExpensesByPeriod(
  firestore: Firestore,
  period: string
): Promise<Expense[]> {
  const q = query(
    collection(firestore, 'expenses'),
    where('billingPeriod', '==', period),
    orderBy('date', 'desc')
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Expense));
}

// ============================================================================
// INCOME CRUD
// ============================================================================

export type CreateIncomeInput = Omit<Income, 'id' | 'createdAt' | 'updatedAt'>;

export async function createIncome(
  firestore: Firestore,
  input: CreateIncomeInput
): Promise<string> {
  const now = new Date().toISOString();
  const ref = await addDoc(collection(firestore, 'incomes'), {
    ...input,
    createdAt: now,
    updatedAt: now,
  });
  return ref.id;
}

export async function updateIncome(
  firestore: Firestore,
  id: string,
  data: Partial<CreateIncomeInput>
): Promise<void> {
  await updateDoc(doc(firestore, 'incomes', id), {
    ...data,
    updatedAt: new Date().toISOString(),
  });
}

export async function deleteIncome(firestore: Firestore, id: string): Promise<void> {
  await deleteDoc(doc(firestore, 'incomes', id));
}

export async function getIncomesByPeriod(
  firestore: Firestore,
  period: string
): Promise<Income[]> {
  const q = query(
    collection(firestore, 'incomes'),
    where('billingPeriod', '==', period),
    orderBy('date', 'desc')
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Income));
}

// ============================================================================
// SAVINGS CRUD
// ============================================================================

export type CreateSavingsGoalInput = Omit<SavingsGoal, 'id' | 'createdAt' | 'updatedAt'>;

export async function createSavingsGoal(
  firestore: Firestore,
  input: CreateSavingsGoalInput
): Promise<string> {
  const now = new Date().toISOString();
  const ref = await addDoc(collection(firestore, 'savings_goals'), {
    ...input,
    createdAt: now,
    updatedAt: now,
  });
  return ref.id;
}

export async function updateSavingsGoal(
  firestore: Firestore,
  id: string,
  data: Partial<CreateSavingsGoalInput>
): Promise<void> {
  await updateDoc(doc(firestore, 'savings_goals', id), {
    ...data,
    updatedAt: new Date().toISOString(),
  });
}

export async function deleteSavingsGoal(firestore: Firestore, id: string): Promise<void> {
  await deleteDoc(doc(firestore, 'savings_goals', id));
}

export async function getSavingsGoals(firestore: Firestore): Promise<SavingsGoal[]> {
  const q = query(collection(firestore, 'savings_goals'), orderBy('createdAt', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as SavingsGoal));
}
// ============================================================================
// FINANCIAL SUMMARY CALCULATIONS
// ============================================================================

export interface PeriodSummary {
  period: string;
  label: string;
  totalIncome: number;
  totalExpenses: number;
  expensesByType: Partial<Record<ExpenseType, number>>;
  incomesBySource: Partial<Record<IncomeSource, number>>;
  grossProfit: number;
  operationalCosts: number;
  reinvestmentFund: number;
  talentPayments: number;
  netProfit: number;
  distribution: { memberName: string; percentage: number; amount: number }[];
}

export async function calculatePeriodSummary(
  firestore: Firestore,
  period: string
): Promise<PeriodSummary> {
  const [expenses, incomes] = await Promise.all([
    getExpensesByPeriod(firestore, period),
    getIncomesByPeriod(firestore, period),
  ]);

  const totalIncome = incomes.reduce((sum, i) => sum + i.amount, 0);
  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);

  // Agrupar gastos por tipo
  const expensesByType = expenses.reduce(
    (acc, e) => {
      acc[e.expenseType] = (acc[e.expenseType] || 0) + e.amount;
      return acc;
    },
    {} as Partial<Record<ExpenseType, number>>
  );

  // Agrupar ingresos por fuente
  const incomesBySource = incomes.reduce(
    (acc, i) => {
      acc[i.source] = (acc[i.source] || 0) + i.amount;
      return acc;
    },
    {} as Partial<Record<IncomeSource, number>>
  );

  // Costos operativos = todo excepto repartición a socios
  const operationalCosts = expenses
    .filter((e) => e.expenseType !== 'reparticion_socios')
    .reduce((sum, e) => sum + e.amount, 0);

  // Pagos al talento (Sharon) por servicios de imagen
  const talentPayments = expenses
    .filter((e) => e.expenseType === 'reparticion_socios' && e.memberName === 'Sharon Treminio')
    .reduce((sum, e) => sum + e.amount, 0);

  const { grossProfit, reinvestmentFund, netProfit, distribution } = calculateProfitDistribution(
    totalIncome,
    operationalCosts,
    talentPayments
  );

  return {
    period,
    label: formatPeriodLabel(period),
    totalIncome,
    totalExpenses,
    expensesByType,
    incomesBySource,
    grossProfit,
    operationalCosts,
    reinvestmentFund,
    talentPayments,
    netProfit,
    distribution,
  };
}
