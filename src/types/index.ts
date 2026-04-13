export type Provider = "esewa" | "khalti" | "connectips" | "hamropay" | "imepay";

export type PaymentStatus = "pending" | "processing" | "success" | "failed" | "cancelled" | "refunded";

export type PayBridgeConfig = {
  apiKey: string;
  baseUrl?: string;
  timeout?: number;
  maxRetries?: number;
};

export type Metadata = Record<string, unknown>;

// ── Checkout ──────────────────────────────────────────────────────────────────

export type CreateCheckoutParams = {
  amount: number;          // in paisa (NPR × 100)
  provider?: Provider;     // omit to let the customer pick on the hosted checkout page
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

export type PaymentMethod =
  | { type: "redirect"; url: string }
  | { type: "form_post"; url: string; fields: Record<string, string> };

export type CheckoutSession = {
  id: string;
  checkout_url: string;
  payment_method?: PaymentMethod;
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

export type WebhookEventType = "payment.succeeded" | "payment.failed" | "payment.cancelled";

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
