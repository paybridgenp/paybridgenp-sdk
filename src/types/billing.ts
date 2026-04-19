import type { Metadata, Provider } from "./index";

// ── Plans ────────────────────────────────────────────────────────────────────

export type IntervalUnit = "day" | "week" | "month" | "quarter" | "year";
export type OverdueAction = "keep_active" | "mark_past_due" | "pause" | "cancel";

export type BillingScheme = "per_unit" | "metered";
export type AggregationMethod = "sum" | "max" | "last_ever";

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
  billingScheme?: BillingScheme;
  aggregationMethod?: AggregationMethod;
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
  billingScheme: BillingScheme;
  aggregationMethod: AggregationMethod;
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
  creditBalance: number;
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
  /**
   * Number of trial days, overriding the plan's default (0–365).
   * `trialEndsAt` wins if both are set.
   */
  trialDays?: number;
  /**
   * Explicit trial end (ISO 8601). Takes precedence over `trialDays` and the
   * plan default. Must be strictly after `startDate`.
   */
  trialEndsAt?: string;
  /** Per-seat quantity for `per_unit` plans (default: 1). */
  quantity?: number;
  /** Day of month (1–28) that billing periods always end on. */
  billingAnchorDay?: number | null;
  metadata?: Metadata | null;
};

export type ExtendTrialParams = {
  /** New trial end (ISO 8601). Must be strictly after the current trial end. */
  trialEndsAt: string;
};

export type EndTrialResponse = {
  subscription: Subscription;
  invoice: unknown;
};

// ── Coupons + Promotion Codes (Phase 2) ────────────────────────────────────

export type CouponDiscountType = "percent" | "amount";
export type CouponDuration = "once" | "repeating" | "forever";

export type Coupon = {
  id: string;
  merchantId: string;
  code: string;
  name: string;
  discountType: CouponDiscountType;
  percentOff: number | null;
  amountOff: number | null;
  currency: string;
  duration: CouponDuration;
  durationInCycles: number | null;
  maxRedemptions: number | null;
  redeemedCount: number;
  redeemBy: string | null;
  appliesToPlanIds: string[] | null;
  projectIds: string[] | null;
  active: boolean;
  metadata: Metadata | null;
  createdAt: string;
  updatedAt: string;
};

export type CreateCouponParams = {
  code: string;
  name: string;
  discountType: CouponDiscountType;
  percentOff?: number;
  amountOff?: number;
  currency?: string;
  duration: CouponDuration;
  durationInCycles?: number;
  maxRedemptions?: number;
  redeemBy?: string;
  appliesToPlanIds?: string[];
  projectIds?: string[];
  metadata?: Metadata | null;
};

export type ListCouponsParams = {
  active?: boolean;
  limit?: number;
};

export type PromotionCode = {
  id: string;
  couponId: string;
  merchantId: string;
  code: string;
  active: boolean;
  maxRedemptions: number | null;
  redeemedCount: number;
  expiresAt: string | null;
  firstTimeTransaction: boolean;
  minimumAmount: number | null;
  customerIds: string[] | null;
  metadata: Metadata | null;
  createdAt: string;
  updatedAt: string;
};

export type CreatePromotionCodeParams = {
  couponId: string;
  code: string;
  maxRedemptions?: number;
  expiresAt?: string;
  firstTimeTransaction?: boolean;
  minimumAmount?: number;
  customerIds?: string[];
  metadata?: Metadata | null;
};

export type ListPromotionCodesParams = {
  couponId?: string;
  active?: boolean;
  limit?: number;
};

export type ValidatePromotionCodeParams = {
  code: string;
  customerId?: string;
  planId?: string;
  amount?: number; // paisa, for minimumAmount check
};

export type ValidatePromotionCodeResponse =
  | {
      valid: true;
      coupon: Coupon;
      promotion_code: PromotionCode;
      discount_preview: {
        amount_off: number;
        amount_after_discount: number;
      };
    }
  | { valid: false; reason: string };

export type ApplyCouponParams = {
  couponId?: string;
  promotionCode?: string;
};

// ── Tax (Phase 2) ──────────────────────────────────────────────────────────

export type TaxSettings = {
  enabled: boolean;
  rate_bps: number; // 1300 = 13.00%
  registration_number: string | null;
  label: string | null;
};

export type UpdateTaxSettingsParams = {
  enabled?: boolean;
  rateBps?: number;
  registrationNumber?: string | null;
  label?: string | null;
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

export type ProrationBehavior = "none" | "create_prorations";

export type ChangePlanParams = {
  newPlanId: string;
  effectiveAt?: string;
  prorationBehavior?: ProrationBehavior;
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
  quantity: number;
  billingAnchorDay: number | null;
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

// ── Usage Records (metered billing) ──────────────────────────────────────────

export type ReportUsageParams = {
  quantity: number;
  /** "increment" (default) adds to running total; "set" replaces for the timestamp. */
  action?: "increment" | "set";
  /** ISO 8601 timestamp for when the usage occurred (defaults to now). */
  recordedAt?: string;
  /** Idempotency key — same key returns the existing record without double-counting. */
  idempotencyKey?: string | null;
};

export type UsageRecord = {
  id: string;
  subscriptionId: string;
  quantity: number;
  action: "increment" | "set";
  recordedAt: string;
  idempotencyKey: string | null;
  createdAt: string;
};

export type UsageSummary = {
  subscriptionId: string;
  periodStart: string;
  periodEnd: string;
  quantity: number;
  aggregationMethod: "sum" | "max" | "last_ever";
  recordCount: number;
};

// ── Pending Invoice Items ─────────────────────────────────────────────────────

export type CreateInvoiceItemParams = {
  description: string;
  /** Amount in paisa. Must be > 0. */
  amount: number;
  quantity?: number;
};

export type InvoiceItem = {
  id: string;
  subscriptionId: string;
  description: string;
  amount: number;
  quantity: number;
  currency: string;
  createdAt: string;
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

// ── Dunning (Phase 3) ─────────────────────────────────────────────────────────

export type DunningFinalAction = "cancel" | "pause" | "mark_uncollectible";

export type DunningPolicy = {
  id: string;
  merchantId: string;
  name: string;
  retryIntervalsDays: number[];
  finalAction: DunningFinalAction;
  isDefault: boolean;
  active: boolean;
  createdAt: string;
  updatedAt: string;
};

export type CreateDunningPolicyParams = {
  name: string;
  retryIntervalsDays: number[];
  finalAction?: DunningFinalAction;
  isDefault?: boolean;
};

export type UpdateDunningPolicyParams = {
  name?: string;
  retryIntervalsDays?: number[];
  finalAction?: DunningFinalAction;
  isDefault?: boolean;
  active?: boolean;
};

export type DunningAttempt = {
  id: string;
  invoiceId: string;
  subscriptionId: string;
  merchantId: string;
  attemptNumber: number;
  status: "sent" | "recovered" | "exhausted";
  nextAttemptAt: string | null;
  createdAt: string;
};

export type DunningInvoiceStatus = {
  dunningStatus: "idle" | "retrying" | "exhausted" | "recovered" | "stopped";
  dunningAttemptCount: number;
  nextDunningAt: string | null;
  attempts: DunningAttempt[];
};

// ── Paginated response ───────────────────────────────────────────────────────

export type PaginatedBillingResponse<T> = {
  data: T[];
  total: number;
  page: number;
  limit: number;
};

// ── Proration (Phase 4) ───────────────────────────────────────────────────────

export type ProrationPreview = {
  creditAmount: number;
  debitAmount: number;
  netAmount: number;
  currency: string;
  periodStart: string;
  periodEnd: string;
  currentPlan: { id: string; name: string; amount: number };
  newPlan: { id: string; name: string; amount: number };
};

export type ChangePlanResult =
  | { prorationApplied: true; prorationInvoice: Record<string, unknown> | null; preview: ProrationPreview }
  | { subscription: Subscription; nextPlan: { id: string; name: string; amount: number; currency: string } };
