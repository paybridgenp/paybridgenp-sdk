import type { Metadata, Provider } from "./index";

// Response objects are the Stripe-style serialized shapes the API returns:
// bare `id`, an `object` discriminator, snake_case fields, `metadata` exposed,
// and NO internal fields (merchantId/projectId/mode/internal timestamps).
// Request `*Params` types stay camelCase; the API accepts camelCase request
// bodies.

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
  object: "plan";
  name: string;
  description: string | null;
  amount: number;
  currency: string;
  interval_unit: IntervalUnit;
  interval_count: number;
  grace_period_days: number;
  trial_days: number;
  default_provider: Provider | null;
  active: boolean;
  billing_scheme: BillingScheme;
  aggregation_method: AggregationMethod | null;
  dunning_settings: {
    reminder_days_before_due: number;
    overdue_reminder_interval_days: number;
    overdue_action: OverdueAction;
  } | null;
  metadata: Metadata | null;
  /** `true` when created with a live key, `false` for sandbox. */
  livemode: boolean;
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
  object: "customer";
  name: string;
  email: string | null;
  phone: string | null;
  external_customer_id: string | null;
  credit_balance: number;
  metadata: Metadata | null;
  /** `true` when created with a live key, `false` for sandbox. */
  livemode: boolean;
};

// ── Subscriptions ────────────────────────────────────────────────────────────

// Merchant-facing status, including draft (future start) + trialing.
export type SubscriptionStatus =
  | "incomplete"
  | "incomplete_expired"
  | "draft"
  | "trialing"
  | "active"
  | "past_due"
  | "paused"
  | "cancelled"
  | "completed";

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
  invoice: Invoice | null;
};

// Nested expansions on Subscription / Invoice. Expansion-only fields are
// optional: the `retrieve` shape is richer than the `list` shape.
export type CustomerRef = {
  id: string;
  name: string | null;
  email: string | null;
  phone?: string | null;
  external_customer_id?: string | null;
};

export type PlanRef = {
  id: string;
  name: string;
  amount?: number;
  currency?: string;
  interval_unit?: string;
  interval_count?: number;
  grace_period_days?: number;
};

export type SubscriptionLatestInvoice = {
  id?: string;
  number?: string;
  status: string;
  amount_due?: number;
  amount_paid?: number;
  currency?: string;
  due_at: string | null;
  paid_at: string | null;
  issued_at?: string | null;
};

// ── Coupons + Promotion Codes (Phase 2) ────────────────────────────────────

export type CouponDiscountType = "percent" | "amount";
export type CouponDuration = "once" | "repeating" | "forever";

export type Coupon = {
  id: string;
  object: "coupon";
  code: string;
  name: string;
  discount_type: CouponDiscountType;
  percent_off: number | null;
  amount_off: number | null;
  currency: string;
  duration: CouponDuration;
  duration_in_cycles: number | null;
  max_redemptions: number | null;
  redeemed_count: number;
  redeem_by: string | null;
  applies_to_plan_ids: string[] | null;
  active: boolean;
  metadata: Metadata | null;
  /** `true` when created with a live key, `false` for sandbox. */
  livemode: boolean;
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
  metadata?: Metadata | null;
};

export type ListCouponsParams = {
  active?: boolean;
  limit?: number;
};

export type PromotionCode = {
  id: string;
  object: "promotion_code";
  code: string;
  coupon_id: string;
  active: boolean;
  max_redemptions: number | null;
  redeemed_count: number;
  expires_at: string | null;
  first_time_transaction: boolean;
  minimum_amount: number | null;
  customer_ids: string[] | null;
  metadata: Metadata | null;
  /** `true` when created with a live key, `false` for sandbox. */
  livemode: boolean;
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

// The API returns 200 in both cases. On success: the resolved coupon/code +
// discount preview (`promotion_code` is null when the code maps directly to a
// coupon with no promotion-code row). On failure: `{ valid: false, reason }`.
export type ValidatePromotionCodeResponse =
  | {
      valid: true;
      coupon: Coupon;
      promotion_code: PromotionCode | null;
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

// ── Discounts (active discount on a subscription) ───────────────────────────

export type Discount = {
  id: string;
  object: "discount";
  subscription_id: string;
  coupon_id: string;
  promotion_code_id: string | null;
  started_at: string | null;
  /** `null` for a forever discount. */
  ends_at: string | null;
  /** Remaining billing cycles for a repeating discount. */
  cycles_remaining: number | null;
  active: boolean;
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
  object: "subscription";
  status: SubscriptionStatus;
  customer_id: string | null;
  plan_id: string | null;
  start_date: string | null;
  current_period_start: string | null;
  current_period_end: string | null;
  next_invoice_at: string | null;
  cancel_at_period_end: boolean;
  canceled_at: string | null;
  paused_at: string | null;
  ended_at: string | null;
  trial_ends_at: string | null;
  pause_reason: string | null;
  cancel_reason: string | null;
  cancel_effective_at: string | null;
  billing_anchor_day: number | null;
  due_days_after_period_start: number | null;
  provider_preference: Provider | null;
  reference_id: string | null;
  /** Present on lifecycle responses. */
  quantity?: number;
  /** Expanded on retrieve; `null` on lifecycle mutation responses. */
  customer: CustomerRef | null;
  plan: PlanRef | null;
  /** Set when a plan change is scheduled for the next period. */
  pending_plan: PlanRef | null;
  latest_invoice: SubscriptionLatestInvoice | null;
  metadata: Metadata | null;
  /** `true` when created with a live key, `false` for sandbox. */
  livemode: boolean;
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

/** The ack returned by `reportUsage` — `created` is false on an idempotent replay. */
export type UsageReportAck = {
  id: string;
  object: "usage_record";
  created: boolean;
};

export type UsageRecord = {
  id: string;
  object: "usage_record";
  subscription_id: string;
  quantity: number;
  action: "increment" | "set";
  recorded_at: string | null;
  idempotency_key: string | null;
};

export type UsageSummary = {
  object: "usage_summary";
  subscription_id: string;
  period_start: string | null;
  period_end: string | null;
  quantity: number;
  aggregation_method: "sum" | "max" | "last_ever";
  record_count: number;
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
  object: "invoice_item";
  subscription_id: string;
  customer_id: string;
  description: string;
  amount: number;
  quantity: number;
  currency: string;
  metadata: Metadata | null;
};

// ── Invoices ─────────────────────────────────────────────────────────────────

export type InvoiceStatus = "open" | "paid" | "overdue" | "void" | "uncollectible" | "write_off";

export type ListInvoicesParams = {
  page?: number;
  limit?: number;
  status?: InvoiceStatus;
  customerId?: string;
  subscriptionId?: string;
  search?: string;
};

export type InvoiceSubscriptionRef = {
  id: string;
  status: string;
  current_period_start?: string | null;
  current_period_end?: string | null;
};

export type Invoice = {
  id: string;
  object: "invoice";
  number: string;
  status: InvoiceStatus;
  amount_due: number;
  amount_paid: number;
  currency: string;
  issued_at: string | null;
  due_at: string | null;
  paid_at: string | null;
  hosted_invoice_url: string | null;
  customer: CustomerRef | null;
  subscription: InvoiceSubscriptionRef | null;
  plan: PlanRef | null;
  metadata: Metadata | null;
  /** `true` when created with a live key, `false` for sandbox. */
  livemode: boolean;
};

// ── Dunning (Phase 3) ─────────────────────────────────────────────────────────

export type DunningFinalAction = "cancel" | "pause" | "mark_uncollectible";

export type DunningPolicy = {
  id: string;
  object: "dunning_policy";
  name: string;
  retry_intervals_days: number[];
  final_action: DunningFinalAction;
  is_default: boolean;
  active: boolean;
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
  object: "dunning_attempt";
  invoice_id: string;
  subscription_id: string;
  attempt_number: number;
  status: "sent" | "recovered" | "exhausted";
  next_attempt_at: string | null;
};

export type DunningInvoiceStatus = {
  object: "dunning_status";
  status: "idle" | "retrying" | "exhausted" | "recovered" | "stopped" | null;
  attempt_count: number | null;
  next_attempt_at: string | null;
  attempts: DunningAttempt[];
};

// ── List responses ─────────────────────────────────────────────────────────

/** Paginated lists (plans, customers, subscriptions, invoices). */
export type PaginatedBillingResponse<T> = {
  data: T[];
  total: number;
  page: number;
  limit: number;
};

/** Simple `{ data }` lists (coupons, promotion-codes, dunning policies, usage records, invoice items). */
export type BillingListResponse<T> = {
  data: T[];
};

// ── Proration (Phase 4) ───────────────────────────────────────────────────────

// NOTE: ProrationPreview uses camelCase keys (legacy); snake_case alignment is a
// tracked follow-up on the API side.
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
  | { proration_applied: true; proration_invoice: Invoice | null; preview: ProrationPreview }
  | { subscription: Subscription; next_plan: { id: string; name: string; amount?: number; currency?: string; interval_unit?: string; interval_count?: number } };
