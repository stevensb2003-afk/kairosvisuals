/**
 * ============================================================================
 * Kairos Visuals — Central Type Definitions
 * ============================================================================
 * 
 * Source of truth for all data models used across the application.
 * Aligned with the CRM Administrative Pivot.
 * ============================================================================
 */

import { Timestamp } from 'firebase/firestore';

// ============================================================================
// ENUMS & CONSTANTS
// ============================================================================

export type PaymentCategory = 'plan' | 'extra';

export type ContractType = 'one_time' | 'recurring';

export type PaymentStatus = 'current' | 'overdue' | 'suspended';

export type InvoiceStatus = 'draft' | 'sent' | 'partially_paid' | 'pending_verification' | 'paid' | 'overdue' | 'cancelled';

export type OnboardingType = 'briefing' | 'direct';
export type QuotationType = 'single_service' | 'subscription_plan';
export type BillingType = 'one_time' | 'recurring';

export type ExpenseCategory =
  | 'software_subscriptions'
  | 'maintenance'
  | 'equipment'
  | 'legal'
  | 'other';

export type PricingModel = 'fixed' | 'scalable' | 'package';

export type ServiceUnitType = 'unit' | 'package' | 'session';

export type TeamRole = 'administrative' | 'creative' | 'creative_talent';

// ============================================================================
// TEAM MEMBER
// ============================================================================

export interface TeamMember {
  id: string;
  name: string;
  role: TeamRole;
  profitSharePercent: number;
  isTalent: boolean;
  talentSplitPercent?: number;
  email?: string;
}

export const KAIROS_TEAM: Omit<TeamMember, 'id'>[] = [
  { name: 'Steven Sánchez', role: 'administrative', profitSharePercent: 25, isTalent: false },
  { name: 'Jacqueline Sandoval', role: 'administrative', profitSharePercent: 25, isTalent: false },
  { name: 'Carlos Valverde', role: 'creative', profitSharePercent: 25, isTalent: false },
  { name: 'Sharon Treminio', role: 'creative_talent', profitSharePercent: 25, isTalent: true, talentSplitPercent: 70 },
];

// ============================================================================
// PUBLIC FORMS (LEADS)
// ============================================================================

export interface ServiceRequest {
  id: string;
  // Step 1: Tu Perfil
  firstName: string;
  lastName: string;
  phone: string;
  email?: string;

  // Step 2: Tu Negocio
  aboutBusiness: string;
  companyName: string;
  industry: string;
  hasSocials: boolean;
  socials: { platform: string, handle: string }[];

  // Step 3: Tus Objetivos
  expectations: string[];
  mainGoals: string[];
  motivation: string;

  // Step 4: Finalización
  contactSource: string;
  contactPreference: 'whatsapp' | 'email' | 'phone';

  status: 'pending' | 'reviewed' | 'converted' | 'frozen' | 'rejected';
  createdAt: string | Timestamp;
}

// ============================================================================
// CATALOG (PRODUCTS & SERVICES)
// ============================================================================

export interface ProductOrService {
  id: string;
  name: string;
  description: string;
  color?: string;
  unitType: ServiceUnitType;
  pricingModel: PricingModel; // 'fixed' | 'scalable' | 'package'
  basePrice: number;

  // For scalable models
  includedUnits?: number;
  unitPrice?: number;

  // For complexity models
  useComplexityMatrix?: boolean;
  complexityTiers?: {
    level: number;
    name: string;
    surcharge: number;
  }[];

  // For package models
  packages?: {
    name: string;
    units: number;
    price: number;
  }[];

  // Tax defaults
  ivaType?: string;
  ivaRate?: number;

  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// PREDEFINED PLANS (COLLECTIONS OF SERVICES)
// ============================================================================

export interface PlanItem {
  serviceId: string;
  quantity: number;
  overridePrice?: number;
  overrideDescription?: string;
  
  // Service configuration
  selectedPackage?: string;
  selectedComplexityLevel?: number;
  overriddenQuantity?: number;
}

export interface PredefinedPlan {
  id: string;
  name: string;
  description: string;
  items: PlanItem[];
  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// CLIENT
// ============================================================================

export interface ClientPaymentSchedule {
  firstPaymentDay: number;
  secondPaymentDay: number;
}

export interface ClientActivePlan {
  planId?: string; // Quotation or Pack ID
  startDate: string;
  baseRecurringAmount: number;
  oneTimeSetupAmount?: number;
  status: 'active' | 'paused' | 'cancelled';
  services: {
    serviceId?: string;
    description: string;
    quantity: number;
    unitPrice: number;
    billingType: BillingType;
  }[];
  // Tracking fields for the new billing engine
  currentCycleMonth: number; // 1 for first month, 2+ for recurring
  isMonth1Part1Paid: boolean;
  isMonth1Part2Paid: boolean;
  nextBillingDate: string; // ISO Date
  lastBillingDate?: string;
}

export interface Client {
  id: string;

  onboardingType?: OnboardingType;
  clientName: string;
  company?: string;
  clientEmail?: string;
  clientPhone?: string;

  contractType: ContractType;
  monthlyQuota: number;
  consumptionLimit: number;
  currentConsumption: number;
  billingPeriodStart?: string;
  billingPeriodEnd?: string;

  paymentStatus: PaymentStatus;
  paymentSchedule: ClientPaymentSchedule;
  daysOverdue: number;
  planStartDay?: 15 | 30;
  activePlan?: ClientActivePlan;

  tcAccepted: boolean;
  tcAcceptedDate?: string;

  isArchived?: boolean;
  
  // Briefing Data (transferred from ServiceRequest)
  industry?: string;
  aboutBusiness?: string;
  hasSocials?: boolean;
  socials?: { platform: string, handle: string }[];
  expectations?: string[];
  mainGoals?: string[];
  motivation?: string;
  contactSource?: string;
  contactPreference?: string;

  createdAt: string;
  updatedAt: string;
}

export const DEFAULT_CLIENT_BUSINESS_FIELDS: Pick<
  Client,
  'contractType' | 'monthlyQuota' | 'consumptionLimit' | 'currentConsumption' |
  'paymentStatus' | 'paymentSchedule' | 'daysOverdue' | 'tcAccepted' | 'isArchived'
> = {
  isArchived: false,
  contractType: 'one_time',
  monthlyQuota: 0,
  consumptionLimit: 0,
  currentConsumption: 0,
  paymentStatus: 'current',
  paymentSchedule: { firstPaymentDay: 15, secondPaymentDay: 30 },
  daysOverdue: 0,
  tcAccepted: false,
};

// ============================================================================
// INVOICE
// ============================================================================

export interface InvoiceLineItem {
  id: string; // Added for UUID tracking
  description: string;
  quantity: number;
  unitPrice: number;
  discount: number; // Absolute amount calculated from discountValue/Type
  discountValue?: number; // The numeric value (e.g. 10)
  discountType?: 'percentage' | 'amount'; // The unit (e.g. '%')
  ivaType?: string;
  ivaRate?: number;
  total: number;
  paymentCategory: PaymentCategory;

  // Service configuration (for reference and persistence)
  serviceId?: string;
  serviceName?: string;
  selectedPackage?: string;
  selectedComplexityLevel?: number;
  overriddenQuantity?: number;
}

export interface Invoice {
  id: string;
  clientId: string;
  invoiceNumber: string;
  subtotalAmount?: number; // Added: subtotal before discounts
  totalDiscount?: number; // Added: total of all discounts
  taxAmount?: number; // Added: total tax
  totalAmount: number;
  firstPaymentAmount: number;
  secondPaymentAmount: number;
  amountPaid: number;
  issueDate: string;
  firstPaymentDueDate: string;
  secondPaymentDueDate: string;
  status: InvoiceStatus;
  items: InvoiceLineItem[];
  paymentMethod?: 'bank_transfer' | 'sinpe_movil';
  payments?: {
    id: string;
    amount: number;
    date: string;
    method?: 'bank_transfer' | 'sinpe_movil' | 'cash' | 'other';
    reference?: string;
  }[];

  // Tax information
  applyIva?: boolean;
  ivaType?: string;
  ivaRate?: number;
  ivaAmount?: number;
  globalDiscount?: number; // Percentage

  // New plan tracking fields
  isPlanInvoice?: boolean;
  planPartNumber?: 1 | 2; // 1st or 2nd 50%
  createdAt: string;
  updatedAt: string;
  notes?: string;
}

// ============================================================================
// EXPENSE
// ============================================================================

export type ExpenseType = 'activo' | 'subscripcion' | 'operativo' | 'reparticion_socios' | 'legal' | 'otro';

export type SubscriptionPeriodicity = 'monthly' | 'quarterly' | 'semiannual' | 'annual';

export interface Expense {
  id: string;
  description: string;
  amount: number;
  category: ExpenseCategory;
  expenseType: ExpenseType;
  date: string;
  startDate?: string;
  isRecurring: boolean;
  recurringPeriodMonths?: number;
  periodicity?: SubscriptionPeriodicity;
  nextPaymentDate?: string;
  paymentMethod?: 'bank_transfer' | 'sinpe_movil' | 'cash' | 'credit_card' | 'other';
  vendor?: string;
  registeredBy: string;
  memberName?: string;
  receiptUrl?: string;
  billingPeriod: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SavingsGoal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  deadline?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export type IncomeSource = 'factura' | 'pago_directo' | 'inversion' | 'otro';

export interface Income {
  id: string;
  description: string;
  amount: number;
  source: IncomeSource;
  date: string;
  linkedInvoiceId?: string;
  linkedClientId?: string;
  paymentMethod?: 'bank_transfer' | 'sinpe_movil' | 'cash' | 'other';
  billingPeriod: string;
  registeredBy: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// QUOTATION
// ============================================================================

export interface QuotationItem {
  id: string;
  serviceId: string;
  description: string;
  quantity: number;
  unitPrice: number;
  discount: number; // Absolute amount calculated from discountValue/Type
  discountValue?: number;
  discountType?: 'percentage' | 'amount';
  ivaType?: string;
  ivaRate?: number;
  billingType?: BillingType;

  // Service configuration
  selectedPackage?: string;
  selectedComplexityLevel?: number;
  overriddenQuantity?: number;
}

export type QuotationStatus = 'draft' | 'published' | 'sent' | 'accepted' | 'rejected' | 'superseded' | 'expired';

export interface Quotation {
  id: string;
  clientId: string;
  clientName: string;
  type?: QuotationType;
  items: QuotationItem[];
  subtotal: number;
  discount: number;
  tax: number;
  total: number;

  // Tax details
  ivaType?: string;
  ivaRate?: number;

  status: QuotationStatus;
  notes?: string;
  validUntil?: string;
  startDate?: string;
  contractType?: ContractType;
  createdAt: string;
  updatedAt: string;
  quotationNumber?: number;
  validityDays?: number;
  clientEmail?: string;
  title?: string;
  totalAmount: number;
  subtotalAmount?: number;
  taxAmount?: number;
  totalDiscount?: number;
  globalDiscountType?: 'percentage' | 'amount';
  globalDiscountValue?: number;
  version: number;
  isPlanUpdate?: boolean;
}

// ============================================================================
// FINANCIAL & SETTLEMENT
// ============================================================================

export interface MonthlyFinancialSummary {
  id: string;
  period: string;
  grossIncome: number;
  operationalCosts: number;
  reinvestmentFund: number;
  talentPayments: number;
  grossProfit: number;
  netProfit: number;
  distribution: {
    memberName: string;
    percentage: number;
    amount: number;
  }[];
  createdAt: string;
}

export interface TalentSettlement {
  id: string;
  period: string;
  talentName: string;
  totalCharged: number;
  talentPayout: number;
  companyRetained: number;
  settled: boolean;
  settledDate?: string;
  createdAt: string;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

export function shouldSuspendAccess(daysOverdue: number): boolean {
  return daysOverdue > 5;
}

export function calculateTalentSplit(
  totalCharged: number,
  talentPercent: number = 70
): { talentPayout: number; companyRetained: number } {
  const talentPayout = Math.round((totalCharged * talentPercent) / 100);
  const companyRetained = totalCharged - talentPayout;
  return { talentPayout, companyRetained };
}

export function calculateProfitDistribution(
  grossIncome: number,
  operationalCosts: number,
  talentPayments: number,
  reinvestmentPercent: number = 10,
  members: { name: string; percent: number }[] = [
    { name: 'Steven Sánchez', percent: 25 },
    { name: 'Jacqueline Sandoval', percent: 25 },
    { name: 'Carlos Valverde', percent: 25 },
    { name: 'Sharon Treminio', percent: 25 },
  ]
): {
  grossProfit: number;
  reinvestmentFund: number;
  netProfit: number;
  distribution: { memberName: string; percentage: number; amount: number }[];
} {
  const grossProfit = grossIncome - operationalCosts;
  const reinvestmentFund = Math.round((grossProfit * reinvestmentPercent) / 100);
  const netProfit = grossProfit - reinvestmentFund - talentPayments;

  const distribution = members.map(m => ({
    memberName: m.name,
    percentage: m.percent,
    amount: Math.round((netProfit * m.percent) / 100),
  }));

  return { grossProfit, reinvestmentFund, netProfit, distribution };
}

// ============================================================================
// BRAND BOOK
// ============================================================================

export interface BrandBookLogoAssets {
  primary?: string;
  secondary?: string; // e.g., horizontal/stacked alternative
  icon?: string; // e.g., isotipo
  monochrome?: string; // e.g., black and white / negative
}

export interface BrandBook {
  id: string;
  clientId?: string;
  name: string;
  logoUrl?: string; // Keeping for backwards compatibility
  logoAssets?: BrandBookLogoAssets;
  industry?: string;
  
  // Brand Identity
  mission?: string;
  vision?: string;
  values?: string[]; // Array of brand values displayed as tags
  slogan?: string;
  valueProposition?: string;
  concept?: string;
  purpose?: string;
  targetAudience?: string;
  tone?: string[];
  
  // Visual Identity (nested to match UI structure and logical grouping)
  visualIdentity?: {
    primaryColor?: string;
    secondaryColor?: string;
    tertiaryColor?: string;
    typography?: {
      primary?: string;
      secondary?: string;
    };
    graphicStyle?: string;
  };
  
  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// NOTIFICATIONS
// ============================================================================

export type NotificationType =
  | 'payment_reported'
  | 'payment_confirmed'
  | 'task_done'
  | 'task_assigned'
  | 'task_critical'
  | 'invoice_sent'
  | 'plan_limit_reached'
  | 'payment_overdue'
  | 'general'
  | 'system';

export type NotificationPriority = 'low' | 'medium' | 'high' | 'critical';

export interface AppNotification {
  id: string;
  type: NotificationType;
  priority: NotificationPriority;
  title: string;
  message: string;
  targetUserId: string; // UID of user, or 'all'
  actionUrl?: string; // Link when clicked
  read: boolean;
  archived?: boolean;
  archivedAt?: string;
  relatedId?: string; // e.g. taskId, invoiceId, clientId
  relatedType?: 'task' | 'invoice' | 'client' | 'sprint' | 'expense' | 'other';
  createdAt: string;
  readAt?: string;
}

// ============================================================================
// CONTENT STUDIO — COPYWRITING
// ============================================================================

export type CopyLength = 'short' | 'medium' | 'long';

export type CopyPurpose =
  | 'inform'
  | 'sell'
  | 'cta'
  | 'educate'
  | 'promote'
  | 'holiday'
  | 'entertain';

export type CopyTone =
  | 'professional'
  | 'casual'
  | 'playful'
  | 'luxurious'
  | 'urgent'
  | 'inspirational'
  | 'educational';

export interface CopyOption {
  id: string;       // 'a' | 'b' | 'c'
  text: string;
  toneLabel: string;
}

export interface SavedCopy {
  id: string;
  userId: string;
  clientId?: string;
  clientName?: string;
  brandBookId?: string;
  purpose: CopyPurpose;
  tone: CopyTone;
  length: CopyLength;
  context: string;
  options: CopyOption[];
  selectedOptionId?: string;
  createdAt: string;
}

// ============================================================================
// CONTENT STUDIO — SCRIPTS / GUIONES
// ============================================================================

export type ScriptFormat =
  | 'reel'
  | 'story_sequence'
  | 'tutorial'
  | 'presentation'
  | 'podcast_intro'
  | 'ad_spot';

export interface ScriptSection {
  label: string;
  content: string;
}

export interface SavedScript {
  id: string;
  userId: string;
  clientId?: string;
  clientName?: string;
  brandBookId?: string;
  title: string;
  format: ScriptFormat;
  context: string;
  sections: ScriptSection[];
  createdAt: string;
}

