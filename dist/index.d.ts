type Provider = "esewa" | "khalti" | "fonepay";
type PaymentStatus = "pending" | "processing" | "success" | "failed" | "cancelled" | "refunded";
type PayBridgeConfig = {
    apiKey: string;
    baseUrl?: string;
    timeout?: number;
    maxRetries?: number;
};
type Metadata = Record<string, unknown>;
type CheckoutFlow = "hosted" | "redirect";
type CreateCheckoutParams = {
    amount: number;
    provider?: Provider;
    flow?: CheckoutFlow;
    returnUrl: string;
    cancelUrl?: string;
    currency?: string;
    metadata?: Metadata;
    customer?: {
        name?: string;
        email?: string;
        phone?: string;
        address?: CustomerAddress;
    };
    collectAddress?: boolean;
};
/**
 * Shipping/billing address attached to a checkout. `line1` and `city` are
 * required; the rest are optional. Fields beyond ~100 chars are truncated
 * server-side. Country is freeform — store ISO codes if you need normalised
 * values downstream.
 */
type CustomerAddress = {
    line1: string;
    line2?: string;
    city: string;
    state?: string;
    postalCode?: string;
    country?: string;
};
type CheckoutSession = {
    id: string;
    /**
     * `true` when created with a live (`sk_live_`) key, `false` for sandbox.
     * Mirrors Stripe's `livemode` so integrations can confirm the environment
     * without inspecting which key was used.
     */
    livemode: boolean;
    checkout_url: string;
    flow: CheckoutFlow;
    provider: Provider | null;
    expires_at: string;
};
type CheckoutSessionStatus = "pending" | "initiated" | "success" | "failed" | "cancelled" | "expired";
/**
 * Returned by `client.checkout.expire(id)`. Same identifying fields as
 * `CheckoutSession` minus `checkout_url` (the session is no longer payable),
 * plus a `status` field reflecting the current row state. Idempotent — if
 * the session was already terminal, `status` echoes that prior state.
 */
type ExpiredCheckoutSession = {
    id: string;
    status: CheckoutSessionStatus;
    flow: CheckoutFlow;
    provider: Provider | null;
    expires_at: string;
};
type Payment = {
    id: string;
    /** `true` when created with a live key, `false` for sandbox. */
    livemode: boolean;
    project_id: string;
    checkout_session_id: string | null;
    amount: number;
    currency: string;
    provider: Provider;
    provider_ref: string | null;
    status: PaymentStatus;
    metadata: Metadata | null;
    created_at: string;
    updated_at: string;
};
type ListPaymentsParams = {
    limit?: number;
    offset?: number;
};
type PaginationMeta = {
    total: number;
    limit: number;
    offset: number;
};
type PaginatedResponse<T> = {
    data: T[];
    meta: PaginationMeta;
};
type WebhookEventType = "payment.succeeded" | "payment.failed" | "payment.cancelled" | "payment.refunded" | "payment_link.paid";
type WebhookEvent<T = unknown> = {
    id: string;
    type: WebhookEventType;
    created: number;
    /** `true` for events from live keys, `false` for sandbox. */
    livemode: boolean;
    data: T;
};
type CreateWebhookParams = {
    url: string;
    events?: WebhookEventType[];
};
type UpdateWebhookParams = {
    url?: string;
    events?: WebhookEventType[];
    enabled?: boolean;
};
type WebhookEndpoint = {
    id: string;
    /** `true` when created with a live key, `false` for sandbox. */
    livemode: boolean;
    url: string;
    events: WebhookEventType[];
    enabled: boolean;
    created_at: string;
};
type WebhookDeliveryStatus = "pending" | "success" | "failed" | "retrying";
type WebhookDelivery = {
    id: string;
    webhookEndpointId: string;
    paymentId: string | null;
    eventType: string;
    payload: Record<string, unknown>;
    status: WebhookDeliveryStatus;
    attempts: number;
    lastAttemptAt: string | null;
    nextAttemptAt: string | null;
    responseStatus: number | null;
    responseBody: string | null;
    createdAt: string;
};
type SessionProvider = "esewa" | "khalti" | "connectips" | "hamropay" | "fonepay";
/** Billing address as returned on a retrieved session (all but line1/city nullable). */
type SessionAddress = {
    line1: string;
    line2: string | null;
    city: string;
    state: string | null;
    postalCode: string | null;
    country: string | null;
};
/** Full checkout session as returned by `/v1/sessions`. */
type RetrievedCheckoutSession = {
    id: string;
    livemode: boolean;
    mode: "sandbox" | "live";
    flow: CheckoutFlow;
    amount: number;
    currency: string;
    provider: SessionProvider | null;
    status: CheckoutSessionStatus;
    description: string | null;
    metadata: Metadata | null;
    customerName: string | null;
    customerEmail: string | null;
    customerPhone: string | null;
    collectAddress: boolean;
    customerAddress: SessionAddress | null;
    expiresAt: string;
    createdAt: string;
    updatedAt: string;
};
type ListSessionsParams = {
    limit?: number;
    offset?: number;
    status?: CheckoutSessionStatus;
};
/** A reusable hosted payment page. */
type PaymentLink = {
    id: string;
    livemode: boolean;
    mode: "sandbox" | "live";
    title: string;
    description: string | null;
    /** Fixed amount in paisa, or `null` when the customer enters their own amount. */
    amount: number | null;
    minAmount: number | null;
    maxAmount: number | null;
    currency: string;
    provider: SessionProvider | null;
    active: boolean;
    maxUses: number | null;
    usedCount: number;
    expiresAt: string | null;
    redirectUrl: string | null;
    inactiveMessage: string | null;
    customerName: string | null;
    customerEmail: string | null;
    customerPhone: string | null;
    collectAddress: boolean;
    customerLine1: string | null;
    customerLine2: string | null;
    customerCity: string | null;
    customerState: string | null;
    customerPostalCode: string | null;
    customerCountry: string | null;
    referenceId: string | null;
    metadata: Metadata | null;
    /** Public hosted payment page for this link. */
    url: string;
    createdAt: string;
    updatedAt: string;
};
/** Returned by `client.paymentLinks.retrieve(id)` — a link plus aggregated stats. */
type PaymentLinkWithStats = PaymentLink & {
    stats: {
        views: number;
        used_count: number;
        conversion_rate: number;
    };
};
type CreatePaymentLinkParams = {
    title: string;
    description?: string | null;
    /** Fixed amount in paisa. Omit and use `minAmount`/`maxAmount` for a customer-entered amount. */
    amount?: number | null;
    minAmount?: number | null;
    maxAmount?: number | null;
    currency?: "NPR";
    provider?: SessionProvider | null;
    maxUses?: number | null;
    expiresAt?: string | null;
    redirectUrl?: string | null;
    inactiveMessage?: string | null;
    metadata?: Metadata | null;
    customerName?: string | null;
    customerEmail?: string | null;
    customerPhone?: string | null;
    referenceId?: string | null;
    collectAddress?: boolean;
    customerLine1?: string | null;
    customerLine2?: string | null;
    customerCity?: string | null;
    customerState?: string | null;
    customerPostalCode?: string | null;
    customerCountry?: string | null;
};
type UpdatePaymentLinkParams = {
    title?: string;
    description?: string | null;
    /** Set `false` to deactivate the link (or use `cancel`). */
    active?: boolean;
    inactiveMessage?: string | null;
    expiresAt?: string | null;
    maxUses?: number | null;
    redirectUrl?: string | null;
    referenceId?: string | null;
    collectAddress?: boolean;
    customerLine1?: string | null;
    customerLine2?: string | null;
    customerCity?: string | null;
    customerState?: string | null;
    customerPostalCode?: string | null;
    customerCountry?: string | null;
};
type ListPaymentLinksParams = {
    limit?: number;
    offset?: number;
    active?: boolean;
};
/** Returned by `client.paymentLinks.delete(id)`. */
type DeletedPaymentLink = {
    deleted: boolean;
    id: string;
    /** Stamped by the API on any object that has an `id`. */
    livemode: boolean;
};

declare class HttpClient {
    private readonly baseUrl;
    private readonly apiKey;
    private readonly timeout;
    private readonly maxRetries;
    constructor(config: PayBridgeConfig);
    request<T>(method: string, path: string, body?: unknown): Promise<T>;
    get<T>(path: string): Promise<T>;
    post<T>(path: string, body: unknown): Promise<T>;
    patch<T>(path: string, body: unknown): Promise<T>;
    delete<T>(path: string): Promise<T>;
}

declare class CheckoutResource {
    private readonly http;
    constructor(http: HttpClient);
    create(params: CreateCheckoutParams): Promise<CheckoutSession>;
    /**
     * Retrieve a checkout session by ID, including its current status, amount,
     * customer, and any collected address. Read-only — sessions are created via
     * {@link create}. Hits `GET /v1/sessions/{id}`.
     *
     * Note: this richer read shape uses camelCase keys (`customerName`,
     * `expiresAt`, …), unlike the snake_case create response.
     */
    retrieve(id: string): Promise<RetrievedCheckoutSession>;
    /**
     * List checkout sessions for the authenticated project, newest first.
     * Optionally filter by `status` and page with `limit`/`offset`. Hits
     * `GET /v1/sessions`.
     */
    list(params?: ListSessionsParams): Promise<PaginatedResponse<RetrievedCheckoutSession>>;
    /**
     * Expire a checkout session so it can no longer accept payment.
     *
     * Use this when you mint a fresh checkout session for a logical purchase
     * that already had one outstanding (a customer requesting a new payment
     * link, your reminder system regenerating expired URLs, etc.). Without
     * explicitly expiring the old session, its URL remains payable until the
     * 30-minute TTL elapses, which can let a customer who reloads the old tab
     * pay twice. Mirrors Stripe's `POST /checkout/sessions/{id}/expire`.
     *
     * Idempotent: calling on an already-terminal session is a no-op that
     * returns the current row state without error.
     */
    expire(id: string): Promise<ExpiredCheckoutSession>;
}

/**
 * Reusable hosted payment pages. Mirrors the public `/v1/payment-links` routes
 * (all require an API key with the `links:read` / `links:write` scope).
 */
declare class PaymentLinksResource {
    private readonly http;
    constructor(http: HttpClient);
    /** Create a payment link. Returns the created link (HTTP 201). */
    create(params: CreatePaymentLinkParams): Promise<PaymentLink>;
    /** List payment links for the project, newest first. Filter with `active`. */
    list(params?: ListPaymentLinksParams): Promise<PaginatedResponse<PaymentLink>>;
    /** Retrieve a single link by ID, including aggregated view/conversion stats. */
    retrieve(id: string): Promise<PaymentLinkWithStats>;
    /** Update a link's editable fields. Only the keys you pass are changed. */
    update(id: string, params: UpdatePaymentLinkParams): Promise<PaymentLink>;
    /**
     * Cancel (deactivate) a link so it can no longer accept payments, while
     * keeping it and its history for your records. The recommended way to retire
     * a link that has already been used.
     */
    cancel(id: string): Promise<PaymentLink>;
    /**
     * Permanently delete a link. Only allowed when the link has never been used —
     * otherwise the API returns 422 and you should {@link cancel} it instead.
     */
    delete(id: string): Promise<DeletedPaymentLink>;
}

declare class PaymentsResource {
    private readonly http;
    constructor(http: HttpClient);
    list(params?: ListPaymentsParams): Promise<PaginatedResponse<Payment>>;
    retrieve(id: string): Promise<Payment>;
}

type RefundStatus = "processing" | "succeeded" | "failed" | "requires_action";
type RefundReason = "customer_request" | "duplicate" | "fraudulent" | "other";
type Refund = {
    id: string;
    /** `true` when created with a live key, `false` for sandbox. */
    livemode: boolean;
    paymentId: string;
    projectId: string;
    mode: "sandbox" | "live";
    amount: number;
    currency: string;
    reason: RefundReason;
    status: RefundStatus;
    providerRefundId: string | null;
    failureReason: string | null;
    notes: string | null;
    mobileNumber: string | null;
    createdAt: string;
    updatedAt: string;
};
type CreateRefundParams = {
    paymentId: string;
    amount: number;
    reason: RefundReason;
    notes?: string;
    /** Required by some Khalti configurations. */
    mobileNumber?: string;
};
type ListRefundsParams = {
    paymentId?: string;
    limit?: number;
    offset?: number;
};

declare class RefundsResource {
    private readonly http;
    constructor(http: HttpClient);
    create(params: CreateRefundParams): Promise<Refund>;
    list(params?: ListRefundsParams): Promise<PaginatedResponse<Refund>>;
    retrieve(id: string): Promise<Refund>;
}

declare class WebhooksResource {
    private readonly http?;
    constructor(http?: HttpClient | undefined);
    create(params: CreateWebhookParams): Promise<WebhookEndpoint & {
        signing_secret: string;
    }>;
    list(): Promise<{
        data: WebhookEndpoint[];
    }>;
    update(id: string, params: UpdateWebhookParams): Promise<WebhookEndpoint>;
    delete(id: string): Promise<{
        deleted: boolean;
        id: string;
    }>;
    listDeliveries(id: string): Promise<{
        data: WebhookDelivery[];
    }>;
    /**
     * Verify and parse a webhook event from an incoming request.
     *
     * @param body      - Raw request body string (do NOT parse as JSON first)
     * @param signature - Value of the `X-PayBridgeNP-Signature` header
     * @param secret    - Your webhook signing secret (whsec_...)
     */
    constructEvent<T = unknown>(body: string, signature: string | null, secret: string): Promise<WebhookEvent<T>>;
}

type IntervalUnit = "day" | "week" | "month" | "quarter" | "year";
type OverdueAction = "keep_active" | "mark_past_due" | "pause" | "cancel";
type BillingScheme = "per_unit" | "metered";
type AggregationMethod = "sum" | "max" | "last_ever";
type CreatePlanParams = {
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
type UpdatePlanParams = {
    name?: string;
    description?: string | null;
    active?: boolean;
    defaultProvider?: Provider | null;
    gracePeriodDays?: number;
    reminderDaysBeforeDue?: number;
    overdueReminderIntervalDays?: number;
    overdueAction?: OverdueAction;
};
type ListPlansParams = {
    page?: number;
    limit?: number;
    active?: boolean;
};
type Plan = {
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
type CreateCustomerParams = {
    name: string;
    email?: string | null;
    phone?: string | null;
    externalCustomerId?: string | null;
    metadata?: Metadata | null;
};
type UpdateCustomerParams = {
    name?: string;
    email?: string | null;
    phone?: string | null;
    externalCustomerId?: string | null;
    metadata?: Metadata | null;
};
type ListCustomersParams = {
    page?: number;
    limit?: number;
    search?: string;
};
type BillingCustomer = {
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
type SubscriptionStatus = "incomplete" | "incomplete_expired" | "draft" | "trialing" | "active" | "past_due" | "paused" | "cancelled" | "completed";
type CreateSubscriptionParams = {
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
type ExtendTrialParams = {
    /** New trial end (ISO 8601). Must be strictly after the current trial end. */
    trialEndsAt: string;
};
type EndTrialResponse = {
    subscription: Subscription;
    invoice: Invoice | null;
};
type CustomerRef = {
    id: string;
    name: string | null;
    email: string | null;
    phone?: string | null;
    external_customer_id?: string | null;
};
type PlanRef = {
    id: string;
    name: string;
    amount?: number;
    currency?: string;
    interval_unit?: string;
    interval_count?: number;
    grace_period_days?: number;
};
type SubscriptionLatestInvoice = {
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
type CouponDiscountType = "percent" | "amount";
type CouponDuration = "once" | "repeating" | "forever";
type Coupon = {
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
type CreateCouponParams = {
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
type ListCouponsParams = {
    active?: boolean;
    limit?: number;
};
type PromotionCode = {
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
type CreatePromotionCodeParams = {
    couponId: string;
    code: string;
    maxRedemptions?: number;
    expiresAt?: string;
    firstTimeTransaction?: boolean;
    minimumAmount?: number;
    customerIds?: string[];
    metadata?: Metadata | null;
};
type ListPromotionCodesParams = {
    couponId?: string;
    active?: boolean;
    limit?: number;
};
type ValidatePromotionCodeParams = {
    code: string;
    customerId?: string;
    planId?: string;
    amount?: number;
};
type ValidatePromotionCodeResponse = {
    valid: true;
    coupon: Coupon;
    promotion_code: PromotionCode | null;
    discount_preview: {
        amount_off: number;
        amount_after_discount: number;
    };
} | {
    valid: false;
    reason: string;
};
type ApplyCouponParams = {
    couponId?: string;
    promotionCode?: string;
};
type Discount = {
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
type TaxSettings = {
    enabled: boolean;
    rate_bps: number;
    registration_number: string | null;
    label: string | null;
};
type UpdateTaxSettingsParams = {
    enabled?: boolean;
    rateBps?: number;
    registrationNumber?: string | null;
    label?: string | null;
};
type ListSubscriptionsParams = {
    page?: number;
    limit?: number;
    status?: SubscriptionStatus;
    customerId?: string;
    planId?: string;
};
type PauseSubscriptionParams = {
    pauseReason?: string;
    resumeAt?: string;
};
type CancelSubscriptionParams = {
    cancelReason?: string;
    atPeriodEnd?: boolean;
};
type ProrationBehavior = "none" | "create_prorations";
type ChangePlanParams = {
    newPlanId: string;
    effectiveAt?: string;
    prorationBehavior?: ProrationBehavior;
};
type Subscription = {
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
type ReportUsageParams = {
    quantity: number;
    /** "increment" (default) adds to running total; "set" replaces for the timestamp. */
    action?: "increment" | "set";
    /** ISO 8601 timestamp for when the usage occurred (defaults to now). */
    recordedAt?: string;
    /** Idempotency key — same key returns the existing record without double-counting. */
    idempotencyKey?: string | null;
};
/** The ack returned by `reportUsage` — `created` is false on an idempotent replay. */
type UsageReportAck = {
    id: string;
    object: "usage_record";
    created: boolean;
};
type UsageRecord = {
    id: string;
    object: "usage_record";
    subscription_id: string;
    quantity: number;
    action: "increment" | "set";
    recorded_at: string | null;
    idempotency_key: string | null;
};
type UsageSummary = {
    object: "usage_summary";
    subscription_id: string;
    period_start: string | null;
    period_end: string | null;
    quantity: number;
    aggregation_method: "sum" | "max" | "last_ever";
    record_count: number;
};
type CreateInvoiceItemParams = {
    description: string;
    /** Amount in paisa. Must be > 0. */
    amount: number;
    quantity?: number;
};
type InvoiceItem = {
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
type InvoiceStatus = "open" | "paid" | "overdue" | "void" | "uncollectible" | "write_off";
type ListInvoicesParams = {
    page?: number;
    limit?: number;
    status?: InvoiceStatus;
    customerId?: string;
    subscriptionId?: string;
    search?: string;
};
type InvoiceSubscriptionRef = {
    id: string;
    status: string;
    current_period_start?: string | null;
    current_period_end?: string | null;
};
type Invoice = {
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
type DunningFinalAction = "cancel" | "pause" | "mark_uncollectible";
type DunningPolicy = {
    id: string;
    object: "dunning_policy";
    name: string;
    retry_intervals_days: number[];
    final_action: DunningFinalAction;
    is_default: boolean;
    active: boolean;
};
type CreateDunningPolicyParams = {
    name: string;
    retryIntervalsDays: number[];
    finalAction?: DunningFinalAction;
    isDefault?: boolean;
};
type UpdateDunningPolicyParams = {
    name?: string;
    retryIntervalsDays?: number[];
    finalAction?: DunningFinalAction;
    isDefault?: boolean;
    active?: boolean;
};
type DunningAttempt = {
    id: string;
    object: "dunning_attempt";
    invoice_id: string;
    subscription_id: string;
    attempt_number: number;
    status: "sent" | "recovered" | "exhausted";
    next_attempt_at: string | null;
};
type DunningInvoiceStatus = {
    object: "dunning_status";
    status: "idle" | "retrying" | "exhausted" | "recovered" | "stopped" | null;
    attempt_count: number | null;
    next_attempt_at: string | null;
    attempts: DunningAttempt[];
};
/** Paginated lists (plans, customers, subscriptions, invoices). */
type PaginatedBillingResponse<T> = {
    data: T[];
    total: number;
    page: number;
    limit: number;
};
/** Simple `{ data }` lists (coupons, promotion-codes, dunning policies, usage records, invoice items). */
type BillingListResponse<T> = {
    data: T[];
};
type ProrationPreview = {
    creditAmount: number;
    debitAmount: number;
    netAmount: number;
    currency: string;
    periodStart: string;
    periodEnd: string;
    currentPlan: {
        id: string;
        name: string;
        amount: number;
    };
    newPlan: {
        id: string;
        name: string;
        amount: number;
    };
};
type ChangePlanResult = {
    proration_applied: true;
    proration_invoice: Invoice | null;
    preview: ProrationPreview;
} | {
    subscription: Subscription;
    next_plan: {
        id: string;
        name: string;
        amount?: number;
        currency?: string;
        interval_unit?: string;
        interval_count?: number;
    };
};

declare class PlansResource {
    private readonly http;
    constructor(http: HttpClient);
    create(params: CreatePlanParams): Promise<Plan>;
    list(params?: ListPlansParams): Promise<PaginatedBillingResponse<Plan>>;
    get(id: string): Promise<Plan>;
    update(id: string, params: UpdatePlanParams): Promise<Plan>;
}

type AddCreditParams = {
    /** Amount in paisa (NPR × 100). Use negative to deduct. */
    amount: number;
    note?: string | null;
};
declare class CustomersResource {
    private readonly http;
    constructor(http: HttpClient);
    create(params: CreateCustomerParams): Promise<BillingCustomer>;
    list(params?: ListCustomersParams): Promise<PaginatedBillingResponse<BillingCustomer>>;
    get(id: string): Promise<BillingCustomer>;
    update(id: string, params: UpdateCustomerParams): Promise<BillingCustomer>;
    delete(id: string): Promise<{
        deleted: boolean;
    }>;
    /**
     * Add (or deduct, with negative amount) credits to a customer's balance.
     * Credits are applied automatically against future invoices before payment.
     * @param amount Amount in paisa (NPR × 100).
     */
    addCredit(id: string, params: AddCreditParams): Promise<BillingCustomer>;
}

declare class SubscriptionsResource {
    private readonly http;
    constructor(http: HttpClient);
    create(params: CreateSubscriptionParams): Promise<Subscription>;
    list(params?: ListSubscriptionsParams): Promise<PaginatedBillingResponse<Subscription>>;
    get(id: string): Promise<Subscription>;
    pause(id: string, params?: PauseSubscriptionParams): Promise<Subscription>;
    resume(id: string): Promise<Subscription>;
    cancel(id: string, params?: CancelSubscriptionParams): Promise<Subscription>;
    changePlan(id: string, params: ChangePlanParams): Promise<ChangePlanResult>;
    /**
     * Preview the proration credit/debit amounts for a mid-period plan change
     * without committing any changes. Use before calling `changePlan` with
     * `prorationBehavior: "create_prorations"` to show the customer the net amount.
     */
    previewProration(id: string, newPlanId: string): Promise<ProrationPreview>;
    /**
     * End a subscription's trial immediately. Generates the first paid invoice
     * and emails it to the customer. Fires `subscription.trial_ended` webhook.
     * Idempotent — subsequent calls return 409 `trial_not_active`.
     */
    endTrial(id: string): Promise<EndTrialResponse>;
    /**
     * Push the trial end date further into the future. Only valid while trial
     * is still active. Re-arms the 3-day-before reminder. Fires
     * `subscription.trial_extended` webhook.
     */
    extendTrial(id: string, params: ExtendTrialParams): Promise<Subscription>;
    /**
     * Attach a coupon or promotion code to an existing subscription. Takes
     * effect on the next invoice. Deactivates any prior active discount on
     * this sub (partial unique index enforces one active discount per sub).
     */
    applyCoupon(id: string, params: ApplyCouponParams): Promise<Discount>;
    /** Remove the currently active discount. Future invoices are un-discounted. */
    removeDiscount(id: string): Promise<Discount>;
    /**
     * Report a usage event for a metered subscription. Use `action: "increment"`
     * (default) to add to the running total, or `action: "set"` for gauge-style
     * metrics. Pass `idempotencyKey` to prevent double-counting.
     */
    reportUsage(id: string, params: ReportUsageParams): Promise<UsageReportAck>;
    /** Get the aggregated usage summary for the current billing period. */
    getUsageSummary(id: string): Promise<UsageSummary>;
    /** List raw usage records for a subscription. */
    listUsageRecords(id: string, limit?: number): Promise<BillingListResponse<UsageRecord>>;
    /** List pending one-off charges that will be included in the next invoice. */
    listInvoiceItems(id: string): Promise<BillingListResponse<InvoiceItem>>;
    /**
     * Add a one-off charge to a subscription. It will be included (and consumed)
     * when the next invoice is generated.
     */
    createInvoiceItem(id: string, params: CreateInvoiceItemParams): Promise<InvoiceItem>;
    /** Delete a pending invoice item before it is invoiced. */
    deleteInvoiceItem(subscriptionId: string, itemId: string): Promise<{
        deleted: boolean;
    }>;
    /** Update the per-seat quantity on an active per_unit subscription. */
    updateQuantity(id: string, quantity: number): Promise<Subscription>;
}

type FonepayQrCustomer = {
    name: string;
    email: string;
    phone?: string;
    address?: {
        line1: string;
        city: string;
        line2?: string;
        state?: string;
        postalCode?: string;
        country?: string;
    };
};
type CreateFonepayQrParams = {
    amount: number;
    currency?: "NPR";
    customer: FonepayQrCustomer;
    metadata?: Metadata;
};
type FonepayQrSession = {
    id: string;
    amount: number;
    currency: string;
    provider: "fonepay";
    status: "initiated";
    qr_message: string;
    qr_image: string;
    events_url: string;
    expires_at: string;
};

declare class InvoicesResource {
    private readonly http;
    constructor(http: HttpClient);
    list(params?: ListInvoicesParams): Promise<PaginatedBillingResponse<Invoice>>;
    get(id: string): Promise<Invoice>;
    /**
     * Mint a Fonepay Direct-QR to pay this invoice. The customer scans it (in your
     * own UI / at a counter) and on success the invoice is marked paid and the
     * subscription activates (`incomplete`→`active`) — the same outcome as the
     * hosted bill page, just collected via an embedded QR. Returns a normal
     * Direct-QR session (use its `events_url` SSE stream + `qr.refresh(id)`).
     *
     * Premium feature; requires the `billing:write` scope and Fonepay configured.
     */
    qr(id: string): Promise<FonepayQrSession>;
}

declare class CouponsResource {
    private readonly http;
    constructor(http: HttpClient);
    /**
     * Create a reusable coupon. Discount params are immutable post-creation —
     * replace by deactivating and creating a new one.
     */
    create(params: CreateCouponParams): Promise<Coupon>;
    list(params?: ListCouponsParams): Promise<BillingListResponse<Coupon>>;
    get(id: string): Promise<Coupon>;
    /** Deactivate. Soft-delete — historical redemptions remain intact. */
    deactivate(id: string): Promise<Coupon>;
}

declare class PromotionCodesResource {
    private readonly http;
    constructor(http: HttpClient);
    /**
     * Create a customer-facing promotion code that redeems a coupon. Code is
     * auto-uppercased server-side and unique per merchant.
     */
    create(params: CreatePromotionCodeParams): Promise<PromotionCode>;
    list(params?: ListPromotionCodesParams): Promise<BillingListResponse<PromotionCode>>;
    get(id: string): Promise<PromotionCode>;
    /** Deactivate. Existing redemptions remain valid. */
    deactivate(id: string): Promise<PromotionCode>;
    /**
     * Read-only validation with discount preview. Safe to poll. Does NOT
     * redeem the code.
     */
    validate(params: ValidatePromotionCodeParams): Promise<ValidatePromotionCodeResponse>;
}

declare class DunningResource {
    private readonly http;
    constructor(http: HttpClient);
    createPolicy(params: CreateDunningPolicyParams): Promise<DunningPolicy>;
    listPolicies(): Promise<{
        data: DunningPolicy[];
    }>;
    getPolicy(id: string): Promise<DunningPolicy>;
    updatePolicy(id: string, params: UpdateDunningPolicyParams): Promise<DunningPolicy>;
    setSubscriptionPolicy(subscriptionId: string, policyId: string | null): Promise<{
        ok: boolean;
    }>;
    getInvoiceStatus(invoiceId: string): Promise<DunningInvoiceStatus>;
    stopInvoice(invoiceId: string): Promise<{
        ok: boolean;
    }>;
    retryInvoiceNow(invoiceId: string): Promise<{
        ok: boolean;
    }>;
}

/** Account-level tax configuration applied to invoices. */
declare class TaxResource {
    private readonly http;
    constructor(http: HttpClient);
    /** Get the current tax settings. */
    getSettings(): Promise<TaxSettings>;
    /** Update tax settings (enabled, rate, registration number, label). */
    updateSettings(params: UpdateTaxSettingsParams): Promise<TaxSettings>;
}

declare class QrResource {
    private readonly http;
    constructor(http: HttpClient);
    /**
     * Create a Fonepay Direct-QR session. Returns the raw QR string, a base64
     * PNG image, and a per-session SSE URL for real-time payment events.
     *
     * Premium feature — requires the merchant to be on the Premium plan.
     */
    fonepay(params: CreateFonepayQrParams): Promise<FonepayQrSession>;
    /**
     * Refresh a Direct-QR session: regenerate a fresh Fonepay QR for the SAME
     * session (same `id`, `events_url`, and webhook) without spawning a new
     * session. The Fonepay QR display window is only ~3 minutes, so call this
     * when `qr.expired` fires (or proactively) to keep a scannable QR on screen.
     * Takes no body — the amount and customer already live on the session. The
     * session's overall lifetime is unchanged.
     *
     * Premium feature — requires the merchant to be on the Premium plan.
     */
    refresh(id: string): Promise<FonepayQrSession>;
}

declare class PayBridgeNP {
    private readonly http;
    /** Static webhook utility — no instance required for signature verification. */
    static readonly webhooks: WebhooksResource;
    private _checkout?;
    private _paymentLinks?;
    private _payments?;
    private _refunds?;
    private _webhooks?;
    private _plans?;
    private _customers?;
    private _subscriptions?;
    private _invoices?;
    private _coupons?;
    private _promotionCodes?;
    private _dunning?;
    private _tax?;
    private _qr?;
    constructor(config: PayBridgeConfig);
    get checkout(): CheckoutResource;
    /** Reusable hosted payment pages — create / list / retrieve / update / cancel / delete. */
    get paymentLinks(): PaymentLinksResource;
    get payments(): PaymentsResource;
    get refunds(): RefundsResource;
    get webhooks(): WebhooksResource;
    get plans(): PlansResource;
    get customers(): CustomersResource;
    get subscriptions(): SubscriptionsResource;
    get invoices(): InvoicesResource;
    get coupons(): CouponsResource;
    get promotionCodes(): PromotionCodesResource;
    get dunning(): DunningResource;
    /** Account-level tax settings applied to invoices. */
    get tax(): TaxResource;
    /**
     * Direct-QR API for Fonepay. Premium feature — generates an embeddable QR
     * + SSE event stream so developers can build their own checkout UI.
     */
    get qr(): QrResource;
}

type PayBridgeErrorType = "authentication_error" | "account_error" | "permission_error" | "invalid_request_error" | "idempotency_error" | "rate_limit_error" | "api_error" | "connection_error" | "signature_verification_error";
/** Shape of `error.suspension` returned with `account_suspended`. */
type SuspensionDetail = {
    suspended_at?: string;
    reason?: string | null;
};
/** Shape of `error.pause` returned with `token_paused`. */
type PauseDetail = {
    paused_at?: string;
    reason?: string | null;
};
declare class PayBridgeError extends Error {
    /** HTTP status code, or 0 for connection / signature errors. */
    readonly statusCode: number;
    /** Broad category — matches `error.type` from the API. */
    readonly type: PayBridgeErrorType;
    /** Specific identifier — matches `error.code` from the API (may be undefined). */
    readonly code: string | undefined;
    /** Request ID — matches `error.request_id` and the `X-Request-Id` header. */
    readonly requestId: string | undefined;
    /** Full parsed JSON body of the error response. */
    readonly raw: Record<string, unknown> | null;
    constructor(message: string, statusCode: number, type: PayBridgeErrorType, options?: {
        code?: string;
        requestId?: string;
        raw?: Record<string, unknown> | null;
    });
    toJSON(): {
        name: string;
        message: string;
        type: PayBridgeErrorType;
        code: string | undefined;
        statusCode: number;
        requestId: string | undefined;
        raw: Record<string, unknown> | null;
    };
}
declare class AuthenticationError extends PayBridgeError {
    constructor(message: string, opts?: ConstructorParameters<typeof PayBridgeError>[3]);
}
declare class AccountError extends PayBridgeError {
    /** Set when `code === "account_suspended"`. */
    readonly suspension: SuspensionDetail | undefined;
    /** Set when `code === "token_paused"`. */
    readonly pause: PauseDetail | undefined;
    constructor(message: string, statusCode: number, opts?: ConstructorParameters<typeof PayBridgeError>[3] & {
        suspension?: SuspensionDetail;
        pause?: PauseDetail;
    });
}
declare class PermissionError extends PayBridgeError {
    constructor(message: string, statusCode?: number, opts?: ConstructorParameters<typeof PayBridgeError>[3]);
}
declare class InvalidRequestError extends PayBridgeError {
    constructor(message: string, statusCode?: number, opts?: ConstructorParameters<typeof PayBridgeError>[3]);
}
declare class IdempotencyError extends PayBridgeError {
    constructor(message: string, opts?: ConstructorParameters<typeof PayBridgeError>[3]);
}
declare class RateLimitError extends PayBridgeError {
    /** From `Retry-After` header, in seconds. Undefined if header was absent. */
    readonly retryAfter: number | undefined;
    constructor(message: string, opts?: ConstructorParameters<typeof PayBridgeError>[3] & {
        retryAfter?: number;
    });
}
declare class ApiError extends PayBridgeError {
    constructor(message: string, statusCode?: number, opts?: ConstructorParameters<typeof PayBridgeError>[3]);
}
declare class ConnectionError extends PayBridgeError {
    constructor(message: string);
}
declare class SignatureVerificationError extends PayBridgeError {
    constructor(message?: string);
}
/** @deprecated use `AuthenticationError` */
declare const PayBridgeAuthenticationError: typeof AuthenticationError;
/** @deprecated use `InvalidRequestError` */
declare const PayBridgeInvalidRequestError: typeof InvalidRequestError;
/** @deprecated use `RateLimitError` */
declare const PayBridgeRateLimitError: typeof RateLimitError;
/** @deprecated use `SignatureVerificationError` */
declare const PayBridgeSignatureVerificationError: typeof SignatureVerificationError;
/** @deprecated 404 is now an `InvalidRequestError` (Stripe convention) — check `statusCode === 404` if you need to distinguish */
declare const PayBridgeNotFoundError: typeof InvalidRequestError;
/**
 * Parse an error response body and instantiate the right typed error.
 * Accepts the v3 nested envelope; tolerates the legacy flat shape so
 * old API responses don't blow up SDK consumers during migration.
 */
declare function parseErrorResponse(statusCode: number, body: Record<string, unknown> | null, retryAfterHeader: string | null): PayBridgeError;

declare const SDK_VERSION: "5.2.0";

export { AccountError, type AggregationMethod, ApiError, type ApplyCouponParams, AuthenticationError, type BillingCustomer, type BillingListResponse, type BillingScheme, type CancelSubscriptionParams, type ChangePlanParams, type ChangePlanResult, type CheckoutFlow, type CheckoutSession, type CheckoutSessionStatus, ConnectionError, type Coupon, type CouponDiscountType, type CouponDuration, type CreateCheckoutParams, type CreateCouponParams, type CreateCustomerParams, type CreateDunningPolicyParams, type CreateFonepayQrParams, type CreateInvoiceItemParams, type CreatePaymentLinkParams, type CreatePlanParams, type CreatePromotionCodeParams, type CreateRefundParams, type CreateSubscriptionParams, type CreateWebhookParams, type CustomerRef, type DeletedPaymentLink, type Discount, type DunningAttempt, type DunningFinalAction, type DunningInvoiceStatus, type DunningPolicy, type EndTrialResponse, type ExpiredCheckoutSession, type ExtendTrialParams, type FonepayQrCustomer, type FonepayQrSession, IdempotencyError, type IntervalUnit, InvalidRequestError, type Invoice, type InvoiceItem, type InvoiceStatus, type InvoiceSubscriptionRef, type ListCouponsParams, type ListCustomersParams, type ListInvoicesParams, type ListPaymentLinksParams, type ListPaymentsParams, type ListPlansParams, type ListPromotionCodesParams, type ListRefundsParams, type ListSessionsParams, type ListSubscriptionsParams, type Metadata, type OverdueAction, type PaginatedBillingResponse, type PaginatedResponse, type PaginationMeta, type PauseDetail, type PauseSubscriptionParams, PayBridgeAuthenticationError, type PayBridgeConfig, PayBridgeError, type PayBridgeErrorType as PayBridgeErrorCode, type PayBridgeErrorType, PayBridgeInvalidRequestError, PayBridgeNP, PayBridgeNotFoundError, PayBridgeRateLimitError, PayBridgeSignatureVerificationError, type Payment, type PaymentLink, type PaymentLinkWithStats, type PaymentStatus, PermissionError, type Plan, type PlanRef, type PromotionCode, type ProrationBehavior, type ProrationPreview, type Provider, RateLimitError, type Refund, type RefundReason, type RefundStatus, type ReportUsageParams, type RetrievedCheckoutSession, SDK_VERSION, type SessionAddress, type SessionProvider, SignatureVerificationError, type Subscription, type SubscriptionLatestInvoice, type SubscriptionStatus, type SuspensionDetail, type TaxSettings, type UpdateCustomerParams, type UpdateDunningPolicyParams, type UpdatePaymentLinkParams, type UpdatePlanParams, type UpdateTaxSettingsParams, type UsageRecord, type UsageReportAck, type UsageSummary, type ValidatePromotionCodeParams, type ValidatePromotionCodeResponse, type WebhookEndpoint, type WebhookEvent, type WebhookEventType, parseErrorResponse };
