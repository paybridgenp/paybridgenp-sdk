type Provider = "esewa" | "khalti" | "connectips" | "hamropay" | "fonepay";
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
     * @param signature - Value of the `X-PayBridge-Signature` header
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
type SubscriptionStatus = "active" | "past_due" | "paused" | "cancelled" | "completed";
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
    invoice: unknown;
};
type CouponDiscountType = "percent" | "amount";
type CouponDuration = "once" | "repeating" | "forever";
type Coupon = {
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
    projectIds?: string[];
    metadata?: Metadata | null;
};
type ListCouponsParams = {
    active?: boolean;
    limit?: number;
};
type PromotionCode = {
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
    promotion_code: PromotionCode;
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
type ReportUsageParams = {
    quantity: number;
    /** "increment" (default) adds to running total; "set" replaces for the timestamp. */
    action?: "increment" | "set";
    /** ISO 8601 timestamp for when the usage occurred (defaults to now). */
    recordedAt?: string;
    /** Idempotency key — same key returns the existing record without double-counting. */
    idempotencyKey?: string | null;
};
type UsageRecord = {
    id: string;
    subscriptionId: string;
    quantity: number;
    action: "increment" | "set";
    recordedAt: string;
    idempotencyKey: string | null;
    createdAt: string;
};
type UsageSummary = {
    subscriptionId: string;
    periodStart: string;
    periodEnd: string;
    quantity: number;
    aggregationMethod: "sum" | "max" | "last_ever";
    recordCount: number;
};
type CreateInvoiceItemParams = {
    description: string;
    /** Amount in paisa. Must be > 0. */
    amount: number;
    quantity?: number;
};
type InvoiceItem = {
    id: string;
    subscriptionId: string;
    description: string;
    amount: number;
    quantity: number;
    currency: string;
    createdAt: string;
};
type InvoiceStatus = "draft" | "open" | "paid" | "overdue" | "void" | "uncollectible";
type ListInvoicesParams = {
    page?: number;
    limit?: number;
    status?: InvoiceStatus;
    customerId?: string;
    subscriptionId?: string;
    search?: string;
};
type Invoice = {
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
type DunningFinalAction = "cancel" | "pause" | "mark_uncollectible";
type DunningPolicy = {
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
    invoiceId: string;
    subscriptionId: string;
    merchantId: string;
    attemptNumber: number;
    status: "sent" | "recovered" | "exhausted";
    nextAttemptAt: string | null;
    createdAt: string;
};
type DunningInvoiceStatus = {
    dunningStatus: "idle" | "retrying" | "exhausted" | "recovered" | "stopped";
    dunningAttemptCount: number;
    nextDunningAt: string | null;
    attempts: DunningAttempt[];
};
type PaginatedBillingResponse<T> = {
    data: T[];
    total: number;
    page: number;
    limit: number;
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
    prorationApplied: true;
    prorationInvoice: Record<string, unknown> | null;
    preview: ProrationPreview;
} | {
    subscription: Subscription;
    nextPlan: {
        id: string;
        name: string;
        amount: number;
        currency: string;
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
    applyCoupon(id: string, params: ApplyCouponParams): Promise<unknown>;
    /** Remove the currently active discount. Future invoices are un-discounted. */
    removeDiscount(id: string): Promise<unknown>;
    /**
     * Report a usage event for a metered subscription. Use `action: "increment"`
     * (default) to add to the running total, or `action: "set"` for gauge-style
     * metrics. Pass `idempotencyKey` to prevent double-counting.
     */
    reportUsage(id: string, params: ReportUsageParams): Promise<{
        id: string;
        created: boolean;
    }>;
    /** Get the aggregated usage summary for the current billing period. */
    getUsageSummary(id: string): Promise<UsageSummary>;
    /** List raw usage records for a subscription. */
    listUsageRecords(id: string, limit?: number): Promise<UsageRecord[]>;
    /** List pending one-off charges that will be included in the next invoice. */
    listInvoiceItems(id: string): Promise<InvoiceItem[]>;
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

declare class InvoicesResource {
    private readonly http;
    constructor(http: HttpClient);
    list(params?: ListInvoicesParams): Promise<PaginatedBillingResponse<Invoice>>;
    get(id: string): Promise<Invoice>;
}

declare class CouponsResource {
    private readonly http;
    constructor(http: HttpClient);
    /**
     * Create a reusable coupon. Discount params are immutable post-creation —
     * replace by deactivating and creating a new one.
     */
    create(params: CreateCouponParams): Promise<Coupon>;
    list(params?: ListCouponsParams): Promise<PaginatedBillingResponse<Coupon>>;
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
    list(params?: ListPromotionCodesParams): Promise<PaginatedBillingResponse<PromotionCode>>;
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
}

declare class PayBridge {
    private readonly http;
    /** Static webhook utility — no instance required for signature verification. */
    static readonly webhooks: WebhooksResource;
    private _checkout?;
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
    private _qr?;
    constructor(config: PayBridgeConfig);
    get checkout(): CheckoutResource;
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
    /**
     * Direct-QR API for Fonepay. Premium feature — generates an embeddable QR
     * + SSE event stream so developers can build their own checkout UI.
     */
    get qr(): QrResource;
}

type PayBridgeErrorCode = "authentication_error" | "permission_error" | "invalid_request_error" | "not_found_error" | "rate_limit_error" | "api_error" | "connection_error" | "signature_verification_error";
declare class PayBridgeError extends Error {
    readonly statusCode: number;
    readonly code: PayBridgeErrorCode;
    readonly raw: Record<string, unknown> | null;
    constructor(message: string, statusCode: number, code: PayBridgeErrorCode, raw?: Record<string, unknown> | null);
    toJSON(): {
        name: string;
        message: string;
        code: PayBridgeErrorCode;
        statusCode: number;
        raw: Record<string, unknown> | null;
    };
}
declare class PayBridgeAuthenticationError extends PayBridgeError {
    constructor(message: string, raw?: Record<string, unknown>);
}
declare class PayBridgeNotFoundError extends PayBridgeError {
    constructor(message: string, raw?: Record<string, unknown>);
}
declare class PayBridgeInvalidRequestError extends PayBridgeError {
    constructor(message: string, raw?: Record<string, unknown>);
}
declare class PayBridgeRateLimitError extends PayBridgeError {
    constructor(message: string, raw?: Record<string, unknown>);
}
declare class PayBridgeSignatureVerificationError extends PayBridgeError {
    constructor(message?: string);
}

declare const SDK_VERSION: "1.6.0";

export { type BillingCustomer, type CancelSubscriptionParams, type ChangePlanParams, type CheckoutFlow, type CheckoutSession, type CheckoutSessionStatus, type CreateCheckoutParams, type CreateCustomerParams, type CreateFonepayQrParams, type CreatePlanParams, type CreateRefundParams, type CreateSubscriptionParams, type CreateWebhookParams, type ExpiredCheckoutSession, type FonepayQrCustomer, type FonepayQrSession, type IntervalUnit, type Invoice, type InvoiceStatus, type ListCustomersParams, type ListInvoicesParams, type ListPaymentsParams, type ListPlansParams, type ListRefundsParams, type ListSubscriptionsParams, type Metadata, type OverdueAction, type PaginatedBillingResponse, type PaginatedResponse, type PaginationMeta, type PauseSubscriptionParams, PayBridge, PayBridgeAuthenticationError, type PayBridgeConfig, PayBridgeError, type PayBridgeErrorCode, PayBridgeInvalidRequestError, PayBridgeNotFoundError, PayBridgeRateLimitError, PayBridgeSignatureVerificationError, type Payment, type PaymentStatus, type Plan, type Provider, type Refund, type RefundReason, type RefundStatus, SDK_VERSION, type Subscription, type SubscriptionStatus, type UpdateCustomerParams, type UpdatePlanParams, type WebhookEndpoint, type WebhookEvent, type WebhookEventType };
