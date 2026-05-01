export type Provider = "esewa" | "khalti" | "connectips" | "hamropay" | "fonepay";

export type PaymentStatus = "pending" | "processing" | "success" | "failed" | "cancelled" | "refunded";

export type PayBridgeConfig = {
  apiKey: string;
  baseUrl?: string;
  timeout?: number;
  maxRetries?: number;
};

export type Metadata = Record<string, unknown>;

// ── Checkout ──────────────────────────────────────────────────────────────────

export type CheckoutFlow = "hosted" | "redirect";

export type CreateCheckoutParams = {
  amount: number;          // in paisa (NPR × 100)
  provider?: Provider;     // omit to let the customer pick on the hosted page
  // "hosted" (default) renders the PayBridge picker, with `provider`
  // pre-selected if set. "redirect" skips the picker and 302s straight to the
  // chosen provider — `provider` is required.
  flow?: CheckoutFlow;
  returnUrl: string;
  // Where the customer lands when they cancel (at the provider, or via the
  // "Cancel" link on the hosted picker). Optional — when omitted, cancellations
  // fall back to `returnUrl?status=cancelled`, and the picker hides its
  // Cancel link entirely.
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
export type CustomerAddress = {
  line1: string;
  line2?: string;
  city: string;
  state?: string;
  postalCode?: string;
  country?: string;
};

export type CheckoutSession = {
  id: string;
  checkout_url: string;
  flow: CheckoutFlow;
  provider: Provider | null;
  expires_at: string;
};

export type CheckoutSessionStatus =
  | "pending"
  | "initiated"
  | "success"
  | "failed"
  | "cancelled"
  | "expired";

/**
 * Returned by `client.checkout.expire(id)`. Same identifying fields as
 * `CheckoutSession` minus `checkout_url` (the session is no longer payable),
 * plus a `status` field reflecting the current row state. Idempotent — if
 * the session was already terminal, `status` echoes that prior state.
 */
export type ExpiredCheckoutSession = {
  id: string;
  status: CheckoutSessionStatus;
  flow: CheckoutFlow;
  provider: Provider | null;
  expires_at: string;
};

// ── Payments ──────────────────────────────────────────────────────────────────

export type Payment = {
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

export type ListPaymentsParams = {
  limit?: number;
  offset?: number;
};

export type PaginationMeta = {
  total: number;
  limit: number;
  offset: number;
};

export type PaginatedResponse<T> = {
  data: T[];
  meta: PaginationMeta;
};

// ── Webhooks ──────────────────────────────────────────────────────────────────

export type WebhookEventType = "payment.succeeded" | "payment.failed" | "payment.cancelled" | "payment.refunded" | "payment_link.paid";

export type WebhookEvent<T = unknown> = {
  id: string;
  type: WebhookEventType;
  created: number;
  data: T;
};

export type CreateWebhookParams = {
  url: string;
  events?: WebhookEventType[];
};

export type UpdateWebhookParams = {
  url?: string;
  events?: WebhookEventType[];
  enabled?: boolean;
};

export type WebhookEndpoint = {
  id: string;
  url: string;
  events: WebhookEventType[];
  enabled: boolean;
  created_at: string;
};

export type WebhookDeliveryStatus = "pending" | "success" | "failed" | "retrying";

export type WebhookDelivery = {
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
