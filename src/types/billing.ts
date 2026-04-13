import type { Metadata, Provider } from "./index";

// ── Plans ────────────────────────────────────────────────────────────────────

export type IntervalUnit = "day" | "week" | "month" | "quarter" | "year";
export type OverdueAction = "keep_active" | "mark_past_due" | "pause" | "cancel";

export type CreatePlanParams = {
  name: string;
  amount: number;
  intervalUnit: IntervalUnit;
  intervalCount?: number;
  currency?: string;
  description?: string | null;
  gracePeriodDays?: number;
  trialDays?: number;
  defaultProvider?: Provider | null;
  reminderDaysBeforeDue?: number;
  overdueReminderIntervalDays?: number;
  overdueAction?: OverdueAction;
  metadata?: Metadata | null;
};

export type UpdatePlanParams = {
  name?: string;
  description?: string | null;
  active?: boolean;
  defaultProvider?: Provider | null;
  gracePeriodDays?: number;
  reminderDaysBeforeDue?: number;
  overdueReminderIntervalDays?: number;
  overdueAction?: OverdueAction;
};

export type ListPlansParams = {
  page?: number;
  limit?: number;
  active?: boolean;
};

export type Plan = {
  id: string;
  merchantId: string;
  projectId: string;
  mode: string;
  name: string;
  description: string | null;
  amount: number;
  currency: string;
  intervalUnit: IntervalUnit;
  intervalCount: number;
  gracePeriodDays: number;
  defaultProvider: Provider | null;
  active: boolean;
  metadata: Metadata | null;
  trialDays: number;
  dunningSettings: {
    reminderDaysBeforeDue: number;
    overdueReminderIntervalDays: number;
    overdueAction: OverdueAction;
  };
  createdAt: string;
  updatedAt: string;
};

// ── Customers ────────────────────────────────────────────────────────────────

export type CreateCustomerParams = {
  name: string;
  email?: string | null;
  phone?: string | null;
  externalCustomerId?: string | null;
  metadata?: Metadata | null;
};

export type UpdateCustomerParams = {
  name?: string;
  email?: string | null;
  phone?: string | null;
  externalCustomerId?: string | null;
  metadata?: Metadata | null;
};

export type ListCustomersParams = {
  page?: number;
  limit?: number;
  search?: string;
};

export type BillingCustomer = {
  id: string;
  merchantId: string;
  projectId: string;
  mode: string;
  name: string;
  email: string | null;
  phone: string | null;
  externalCustomerId: string | null;
  metadata: Metadata | null;
  createdAt: string;
  updatedAt: string;
};

// ── Subscriptions ────────────────────────────────────────────────────────────

export type SubscriptionStatus = "active" | "past_due" | "paused" | "cancelled" | "completed";

export type CreateSubscriptionParams = {
  customerId: string;
  planId: string;
  referenceId?: string;
  startDate?: string;
  metadata?: Metadata | null;
};

export type ListSubscriptionsParams = {
  page?: number;
  limit?: number;
  status?: SubscriptionStatus;
  customerId?: string;
  planId?: string;
};

export type PauseSubscriptionParams = {
  pauseReason?: string;
  resumeAt?: string;
};

export type CancelSubscriptionParams = {
  cancelReason?: string;
  atPeriodEnd?: boolean;
};

export type ChangePlanParams = {
  newPlanId: string;
  effectiveAt?: string;
};

export type Subscription = {
  id: string;
  merchantId: string;
  projectId: string;
  mode: string;
  customerId: string;
  planId: string;
  status: SubscriptionStatus;
  startDate: string;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  nextInvoiceAt: string;
  cancelAtPeriodEnd: boolean;
  cancelledAt: string | null;
  pausedAt: string | null;
  endedAt: string | null;
  providerPreference: Provider | null;
  referenceId: string | null;
  metadata: Metadata | null;
  createdAt: string;
  updatedAt: string;
};

// ── Invoices ─────────────────────────────────────────────────────────────────

export type InvoiceStatus = "draft" | "open" | "paid" | "overdue" | "void" | "uncollectible";

export type ListInvoicesParams = {
  page?: number;
  limit?: number;
  status?: InvoiceStatus;
  customerId?: string;
  subscriptionId?: string;
  search?: string;
};

export type Invoice = {
  id: string;
  merchantId: string;
  projectId: string;
  mode: string;
  customerId: string;
  subscriptionId: string;
  planSnapshot: Record<string, unknown> | null;
  invoiceNumber: string;
  status: InvoiceStatus;
  amountDue: number;
  amountPaid: number;
  currency: string;
  periodStart: string;
  periodEnd: string;
  issuedAt: string;
  dueAt: string;
  paidAt: string | null;
  retryCount: number;
  metadata: Metadata | null;
  createdAt: string;
  updatedAt: string;
};

// ── Paginated response ───────────────────────────────────────────────────────

export type PaginatedBillingResponse<T> = {
  data: T[];
  total: number;
  page: number;
  limit: number;
};
