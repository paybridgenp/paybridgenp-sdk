type Provider = "esewa" | "khalti" | "connectips" | "hamropay" | "imepay";
type PaymentStatus = "pending" | "processing" | "success" | "failed" | "cancelled" | "refunded";
type PayBridgeConfig = {
    apiKey: string;
    baseUrl?: string;
    timeout?: number;
    maxRetries?: number;
};
type Metadata = Record<string, unknown>;
type CreateCheckoutParams = {
    amount: number;
    provider?: Provider;
    returnUrl: string;
    cancelUrl?: string;
    currency?: string;
    metadata?: Metadata;
    customer?: {
        name?: string;
        email?: string;
        phone?: string;
    };
};
type PaymentMethod = {
    type: "redirect";
    url: string;
} | {
    type: "form_post";
    url: string;
    fields: Record<string, string>;
};
type CheckoutSession = {
    id: string;
    checkout_url: string;
    payment_method?: PaymentMethod;
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
type WebhookEventType = "payment.succeeded" | "payment.failed" | "payment.cancelled";
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
type WebhookEndpoint = {
    id: string;
    url: string;
    events: WebhookEventType[];
    enabled: boolean;
    created_at: string;
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
}

declare class PaymentsResource {
    private readonly http;
    constructor(http: HttpClient);
    list(params?: ListPaymentsParams): Promise<PaginatedResponse<Payment>>;
    retrieve(id: string): Promise<Payment>;
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
    delete(id: string): Promise<{
        deleted: boolean;
        id: string;
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
    metadata?: Metadata | null;
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
type ChangePlanParams = {
    newPlanId: string;
    effectiveAt?: string;
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
type PaginatedBillingResponse<T> = {
    data: T[];
    total: number;
    page: number;
    limit: number;
};

declare class PlansResource {
    private readonly http;
    constructor(http: HttpClient);
    create(params: CreatePlanParams): Promise<Plan>;
    list(params?: ListPlansParams): Promise<PaginatedBillingResponse<Plan>>;
    get(id: string): Promise<Plan>;
    update(id: string, params: UpdatePlanParams): Promise<Plan>;
}

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
    changePlan(id: string, params: ChangePlanParams): Promise<Subscription>;
}

declare class InvoicesResource {
    private readonly http;
    constructor(http: HttpClient);
    list(params?: ListInvoicesParams): Promise<PaginatedBillingResponse<Invoice>>;
    get(id: string): Promise<Invoice>;
}

declare class PayBridge {
    private readonly http;
    /** Static webhook utility — no instance required for signature verification. */
    static readonly webhooks: WebhooksResource;
    private _checkout?;
    private _payments?;
    private _webhooks?;
    private _plans?;
    private _customers?;
    private _subscriptions?;
    private _invoices?;
    constructor(config: PayBridgeConfig);
    get checkout(): CheckoutResource;
    get payments(): PaymentsResource;
    get webhooks(): WebhooksResource;
    get plans(): PlansResource;
    get customers(): CustomersResource;
    get subscriptions(): SubscriptionsResource;
    get invoices(): InvoicesResource;
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

declare const SDK_VERSION: "0.1.0";

export { type BillingCustomer, type CancelSubscriptionParams, type ChangePlanParams, type CheckoutSession, type CreateCheckoutParams, type CreateCustomerParams, type CreatePlanParams, type CreateSubscriptionParams, type CreateWebhookParams, type IntervalUnit, type Invoice, type InvoiceStatus, type ListCustomersParams, type ListInvoicesParams, type ListPaymentsParams, type ListPlansParams, type ListSubscriptionsParams, type Metadata, type OverdueAction, type PaginatedBillingResponse, type PaginatedResponse, type PaginationMeta, type PauseSubscriptionParams, PayBridge, PayBridgeAuthenticationError, type PayBridgeConfig, PayBridgeError, type PayBridgeErrorCode, PayBridgeInvalidRequestError, PayBridgeNotFoundError, PayBridgeRateLimitError, PayBridgeSignatureVerificationError, type Payment, type PaymentMethod, type PaymentStatus, type Plan, type Provider, SDK_VERSION, type Subscription, type SubscriptionStatus, type UpdateCustomerParams, type UpdatePlanParams, type WebhookEndpoint, type WebhookEvent, type WebhookEventType };
