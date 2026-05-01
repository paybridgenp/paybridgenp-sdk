// src/errors.ts
var PayBridgeError = class extends Error {
  statusCode;
  code;
  raw;
  constructor(message, statusCode, code, raw = null) {
    super(message);
    this.name = "PayBridgeError";
    this.statusCode = statusCode;
    this.code = code;
    this.raw = raw;
    Object.setPrototypeOf(this, new.target.prototype);
  }
  toJSON() {
    return { name: this.name, message: this.message, code: this.code, statusCode: this.statusCode, raw: this.raw };
  }
};
var PayBridgeAuthenticationError = class extends PayBridgeError {
  constructor(message, raw) {
    super(message, 401, "authentication_error", raw ?? null);
    this.name = "PayBridgeAuthenticationError";
  }
};
var PayBridgeNotFoundError = class extends PayBridgeError {
  constructor(message, raw) {
    super(message, 404, "not_found_error", raw ?? null);
    this.name = "PayBridgeNotFoundError";
  }
};
var PayBridgeInvalidRequestError = class extends PayBridgeError {
  constructor(message, raw) {
    super(message, 400, "invalid_request_error", raw ?? null);
    this.name = "PayBridgeInvalidRequestError";
  }
};
var PayBridgeRateLimitError = class extends PayBridgeError {
  constructor(message, raw) {
    super(message, 429, "rate_limit_error", raw ?? null);
    this.name = "PayBridgeRateLimitError";
  }
};
var PayBridgeSignatureVerificationError = class extends PayBridgeError {
  constructor(message = "Webhook signature verification failed") {
    super(message, 0, "signature_verification_error");
    this.name = "PayBridgeSignatureVerificationError";
  }
};
function createError(message, statusCode, raw) {
  switch (statusCode) {
    case 401:
      return new PayBridgeAuthenticationError(message, raw ?? void 0);
    case 404:
      return new PayBridgeNotFoundError(message, raw ?? void 0);
    case 400:
    case 422:
      return new PayBridgeInvalidRequestError(message, raw ?? void 0);
    case 429:
      return new PayBridgeRateLimitError(message, raw ?? void 0);
    default:
      return new PayBridgeError(message, statusCode, "api_error", raw);
  }
}

// src/http.ts
var DEFAULT_BASE_URL = "https://api.paybridgenp.com";
var DEFAULT_TIMEOUT = 3e4;
var DEFAULT_MAX_RETRIES = 2;
var RETRY_STATUSES = /* @__PURE__ */ new Set([500, 502, 503, 504]);
var INITIAL_BACKOFF_MS = 500;
function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}
function backoff(attempt) {
  return INITIAL_BACKOFF_MS * 2 ** (attempt - 1) + Math.random() * 100;
}
var HttpClient = class {
  baseUrl;
  apiKey;
  timeout;
  maxRetries;
  constructor(config) {
    this.baseUrl = (config.baseUrl ?? DEFAULT_BASE_URL).replace(/\/$/, "");
    this.apiKey = config.apiKey;
    this.timeout = config.timeout ?? DEFAULT_TIMEOUT;
    this.maxRetries = config.maxRetries ?? DEFAULT_MAX_RETRIES;
  }
  async request(method, path, body) {
    const url = `${this.baseUrl}${path}`;
    const headers = {
      Authorization: `Bearer ${this.apiKey}`,
      "Content-Type": "application/json",
      "User-Agent": "PayBridgeNP-SDK/0.1.0"
    };
    let attempt = 0;
    while (true) {
      attempt++;
      let res;
      try {
        res = await fetch(url, {
          method,
          headers,
          body: body !== void 0 ? JSON.stringify(body) : void 0,
          signal: AbortSignal.timeout(this.timeout)
        });
      } catch (err) {
        if (attempt > this.maxRetries) {
          throw new PayBridgeError(
            `Connection error: ${err.message}`,
            0,
            "connection_error"
          );
        }
        await sleep(backoff(attempt));
        continue;
      }
      if (res.ok) {
        return res.json();
      }
      if (RETRY_STATUSES.has(res.status) && attempt <= this.maxRetries) {
        const retryAfter = res.headers.get("Retry-After");
        const delay = retryAfter ? parseInt(retryAfter) * 1e3 : backoff(attempt);
        await sleep(delay);
        continue;
      }
      let raw = null;
      try {
        raw = await res.json();
      } catch {
      }
      const message = typeof raw?.error === "string" ? raw.error : `HTTP ${res.status}`;
      throw createError(message, res.status, raw);
    }
  }
  get(path) {
    return this.request("GET", path);
  }
  post(path, body) {
    return this.request("POST", path, body);
  }
  patch(path, body) {
    return this.request("PATCH", path, body);
  }
  delete(path) {
    return this.request("DELETE", path);
  }
};

// src/resources/checkout.ts
var CheckoutResource = class {
  constructor(http) {
    this.http = http;
  }
  create(params) {
    return this.http.post("/v1/checkout", params);
  }
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
  expire(id) {
    return this.http.post(
      `/v1/checkout/${encodeURIComponent(id)}/expire`,
      {}
    );
  }
};

// src/resources/payments.ts
var PaymentsResource = class {
  constructor(http) {
    this.http = http;
  }
  list(params = {}) {
    const qs = new URLSearchParams();
    if (params.limit !== void 0) qs.set("limit", String(params.limit));
    if (params.offset !== void 0) qs.set("offset", String(params.offset));
    const query = qs.toString();
    return this.http.get(`/v1/payments${query ? `?${query}` : ""}`);
  }
  retrieve(id) {
    return this.http.get(`/v1/payments/${id}`);
  }
};

// src/resources/refunds.ts
var RefundsResource = class {
  constructor(http) {
    this.http = http;
  }
  create(params) {
    return this.http.post("/v1/refunds", params);
  }
  list(params = {}) {
    const qs = new URLSearchParams();
    if (params.paymentId !== void 0) qs.set("paymentId", params.paymentId);
    if (params.limit !== void 0) qs.set("limit", String(params.limit));
    if (params.offset !== void 0) qs.set("offset", String(params.offset));
    const query = qs.toString();
    return this.http.get(`/v1/refunds${query ? `?${query}` : ""}`);
  }
  retrieve(id) {
    return this.http.get(`/v1/refunds/${id}`);
  }
};

// src/resources/webhooks.ts
var WebhooksResource = class {
  constructor(http) {
    this.http = http;
  }
  create(params) {
    if (!this.http) throw new Error("WebhooksResource requires an HttpClient");
    return this.http.post("/v1/webhooks", params);
  }
  list() {
    if (!this.http) throw new Error("WebhooksResource requires an HttpClient");
    return this.http.get("/v1/webhooks");
  }
  update(id, params) {
    if (!this.http) throw new Error("WebhooksResource requires an HttpClient");
    return this.http.patch(`/v1/webhooks/${id}`, params);
  }
  delete(id) {
    if (!this.http) throw new Error("WebhooksResource requires an HttpClient");
    return this.http.delete(`/v1/webhooks/${id}`);
  }
  listDeliveries(id) {
    if (!this.http) throw new Error("WebhooksResource requires an HttpClient");
    return this.http.get(`/v1/webhooks/${id}/deliveries`);
  }
  /**
   * Verify and parse a webhook event from an incoming request.
   *
   * @param body      - Raw request body string (do NOT parse as JSON first)
   * @param signature - Value of the `X-PayBridge-Signature` header
   * @param secret    - Your webhook signing secret (whsec_...)
   */
  async constructEvent(body, signature, secret) {
    if (!signature) throw new PayBridgeSignatureVerificationError("Missing X-PayBridge-Signature header");
    const parts = Object.fromEntries(
      signature.split(",").map((p) => p.split("="))
    );
    const timestamp = parts["t"];
    const v1 = parts["v1"];
    if (!timestamp || !v1) {
      throw new PayBridgeSignatureVerificationError("Malformed signature header");
    }
    const ts = parseInt(timestamp);
    const now = Math.floor(Date.now() / 1e3);
    if (Math.abs(now - ts) > 300) {
      throw new PayBridgeSignatureVerificationError("Timestamp too old \u2014 possible replay attack");
    }
    const { createHmac, timingSafeEqual } = await import("crypto");
    const expected = createHmac("sha256", secret).update(`${timestamp}.${body}`).digest("hex");
    const signatureBuffer = Buffer.from(v1, "hex");
    const expectedBuffer = Buffer.from(expected, "hex");
    if (signatureBuffer.length !== expectedBuffer.length || !timingSafeEqual(signatureBuffer, expectedBuffer)) {
      throw new PayBridgeSignatureVerificationError();
    }
    return JSON.parse(body);
  }
};

// src/resources/plans.ts
var PlansResource = class {
  constructor(http) {
    this.http = http;
  }
  create(params) {
    return this.http.post("/v1/billing/plans", params);
  }
  list(params = {}) {
    const qs = new URLSearchParams();
    if (params.page !== void 0) qs.set("page", String(params.page));
    if (params.limit !== void 0) qs.set("limit", String(params.limit));
    if (params.active !== void 0) qs.set("active", String(params.active));
    const query = qs.toString();
    return this.http.get(`/v1/billing/plans${query ? `?${query}` : ""}`);
  }
  get(id) {
    return this.http.get(`/v1/billing/plans/${id}`);
  }
  update(id, params) {
    return this.http.patch(`/v1/billing/plans/${id}`, params);
  }
};

// src/resources/customers.ts
var CustomersResource = class {
  constructor(http) {
    this.http = http;
  }
  create(params) {
    return this.http.post("/v1/billing/customers", params);
  }
  list(params = {}) {
    const qs = new URLSearchParams();
    if (params.page !== void 0) qs.set("page", String(params.page));
    if (params.limit !== void 0) qs.set("limit", String(params.limit));
    if (params.search !== void 0) qs.set("search", params.search);
    const query = qs.toString();
    return this.http.get(
      `/v1/billing/customers${query ? `?${query}` : ""}`
    );
  }
  get(id) {
    return this.http.get(`/v1/billing/customers/${id}`);
  }
  update(id, params) {
    return this.http.patch(`/v1/billing/customers/${id}`, params);
  }
  delete(id) {
    return this.http.delete(`/v1/billing/customers/${id}`);
  }
  /**
   * Add (or deduct, with negative amount) credits to a customer's balance.
   * Credits are applied automatically against future invoices before payment.
   * @param amount Amount in paisa (NPR × 100).
   */
  addCredit(id, params) {
    return this.http.post(`/v1/billing/customers/${id}/credit`, params);
  }
};

// src/resources/subscriptions.ts
var SubscriptionsResource = class {
  constructor(http) {
    this.http = http;
  }
  create(params) {
    return this.http.post("/v1/billing/subscriptions", params);
  }
  list(params = {}) {
    const qs = new URLSearchParams();
    if (params.page !== void 0) qs.set("page", String(params.page));
    if (params.limit !== void 0) qs.set("limit", String(params.limit));
    if (params.status !== void 0) qs.set("status", params.status);
    if (params.customerId !== void 0) qs.set("customerId", params.customerId);
    if (params.planId !== void 0) qs.set("planId", params.planId);
    const query = qs.toString();
    return this.http.get(
      `/v1/billing/subscriptions${query ? `?${query}` : ""}`
    );
  }
  get(id) {
    return this.http.get(`/v1/billing/subscriptions/${id}`);
  }
  pause(id, params = {}) {
    return this.http.post(`/v1/billing/subscriptions/${id}/pause`, params);
  }
  resume(id) {
    return this.http.post(`/v1/billing/subscriptions/${id}/resume`, {});
  }
  cancel(id, params = {}) {
    return this.http.post(`/v1/billing/subscriptions/${id}/cancel`, params);
  }
  changePlan(id, params) {
    return this.http.post(`/v1/billing/subscriptions/${id}/change-plan`, params);
  }
  /**
   * Preview the proration credit/debit amounts for a mid-period plan change
   * without committing any changes. Use before calling `changePlan` with
   * `prorationBehavior: "create_prorations"` to show the customer the net amount.
   */
  previewProration(id, newPlanId) {
    return this.http.get(
      `/v1/billing/subscriptions/${id}/preview-proration?newPlanId=${encodeURIComponent(newPlanId)}`
    );
  }
  /**
   * End a subscription's trial immediately. Generates the first paid invoice
   * and emails it to the customer. Fires `subscription.trial_ended` webhook.
   * Idempotent — subsequent calls return 409 `trial_not_active`.
   */
  endTrial(id) {
    return this.http.post(`/v1/billing/subscriptions/${id}/end-trial`, {});
  }
  /**
   * Push the trial end date further into the future. Only valid while trial
   * is still active. Re-arms the 3-day-before reminder. Fires
   * `subscription.trial_extended` webhook.
   */
  extendTrial(id, params) {
    return this.http.post(`/v1/billing/subscriptions/${id}/extend-trial`, params);
  }
  /**
   * Attach a coupon or promotion code to an existing subscription. Takes
   * effect on the next invoice. Deactivates any prior active discount on
   * this sub (partial unique index enforces one active discount per sub).
   */
  applyCoupon(id, params) {
    return this.http.post(`/v1/billing/subscriptions/${id}/apply-coupon`, params);
  }
  /** Remove the currently active discount. Future invoices are un-discounted. */
  removeDiscount(id) {
    return this.http.delete(`/v1/billing/subscriptions/${id}/discount`);
  }
  // ── Usage (metered billing) ─────────────────────────────────────────────────
  /**
   * Report a usage event for a metered subscription. Use `action: "increment"`
   * (default) to add to the running total, or `action: "set"` for gauge-style
   * metrics. Pass `idempotencyKey` to prevent double-counting.
   */
  reportUsage(id, params) {
    return this.http.post(`/v1/billing/subscriptions/${id}/usage`, {
      quantity: params.quantity,
      action: params.action,
      recorded_at: params.recordedAt,
      idempotency_key: params.idempotencyKey
    });
  }
  /** Get the aggregated usage summary for the current billing period. */
  getUsageSummary(id) {
    return this.http.get(`/v1/billing/subscriptions/${id}/usage`);
  }
  /** List raw usage records for a subscription. */
  listUsageRecords(id, limit) {
    const qs = limit ? `?limit=${limit}` : "";
    return this.http.get(`/v1/billing/subscriptions/${id}/usage/records${qs}`);
  }
  // ── Pending Invoice Items ───────────────────────────────────────────────────
  /** List pending one-off charges that will be included in the next invoice. */
  listInvoiceItems(id) {
    return this.http.get(`/v1/billing/subscriptions/${id}/invoice-items`);
  }
  /**
   * Add a one-off charge to a subscription. It will be included (and consumed)
   * when the next invoice is generated.
   */
  createInvoiceItem(id, params) {
    return this.http.post(`/v1/billing/subscriptions/${id}/invoice-items`, params);
  }
  /** Delete a pending invoice item before it is invoiced. */
  deleteInvoiceItem(subscriptionId, itemId) {
    return this.http.delete(`/v1/billing/subscriptions/${subscriptionId}/invoice-items/${itemId}`);
  }
  /** Update the per-seat quantity on an active per_unit subscription. */
  updateQuantity(id, quantity) {
    return this.http.patch(`/v1/billing/subscriptions/${id}/quantity`, { quantity });
  }
};

// src/resources/invoices.ts
var InvoicesResource = class {
  constructor(http) {
    this.http = http;
  }
  list(params = {}) {
    const qs = new URLSearchParams();
    if (params.page !== void 0) qs.set("page", String(params.page));
    if (params.limit !== void 0) qs.set("limit", String(params.limit));
    if (params.status !== void 0) qs.set("status", params.status);
    if (params.customerId !== void 0) qs.set("customerId", params.customerId);
    if (params.subscriptionId !== void 0) qs.set("subscriptionId", params.subscriptionId);
    if (params.search !== void 0) qs.set("search", params.search);
    const query = qs.toString();
    return this.http.get(
      `/v1/billing/invoices${query ? `?${query}` : ""}`
    );
  }
  get(id) {
    return this.http.get(`/v1/billing/invoices/${id}`);
  }
};

// src/resources/coupons.ts
var CouponsResource = class {
  constructor(http) {
    this.http = http;
  }
  /**
   * Create a reusable coupon. Discount params are immutable post-creation —
   * replace by deactivating and creating a new one.
   */
  create(params) {
    return this.http.post("/v1/billing/coupons", params);
  }
  list(params = {}) {
    const qs = new URLSearchParams();
    if (params.active !== void 0) qs.set("active", String(params.active));
    if (params.limit !== void 0) qs.set("limit", String(params.limit));
    const query = qs.toString();
    return this.http.get(
      `/v1/billing/coupons${query ? `?${query}` : ""}`
    );
  }
  get(id) {
    return this.http.get(`/v1/billing/coupons/${id}`);
  }
  /** Deactivate. Soft-delete — historical redemptions remain intact. */
  deactivate(id) {
    return this.http.delete(`/v1/billing/coupons/${id}`);
  }
};

// src/resources/promotionCodes.ts
var PromotionCodesResource = class {
  constructor(http) {
    this.http = http;
  }
  /**
   * Create a customer-facing promotion code that redeems a coupon. Code is
   * auto-uppercased server-side and unique per merchant.
   */
  create(params) {
    return this.http.post("/v1/billing/promotion-codes", params);
  }
  list(params = {}) {
    const qs = new URLSearchParams();
    if (params.couponId) qs.set("couponId", params.couponId);
    if (params.active !== void 0) qs.set("active", String(params.active));
    if (params.limit !== void 0) qs.set("limit", String(params.limit));
    const query = qs.toString();
    return this.http.get(
      `/v1/billing/promotion-codes${query ? `?${query}` : ""}`
    );
  }
  get(id) {
    return this.http.get(`/v1/billing/promotion-codes/${id}`);
  }
  /** Deactivate. Existing redemptions remain valid. */
  deactivate(id) {
    return this.http.patch(`/v1/billing/promotion-codes/${id}`, { active: false });
  }
  /**
   * Read-only validation with discount preview. Safe to poll. Does NOT
   * redeem the code.
   */
  validate(params) {
    return this.http.post(
      "/v1/billing/promotion-codes/validate",
      params
    );
  }
};

// src/resources/dunning.ts
var DunningResource = class {
  constructor(http) {
    this.http = http;
  }
  // ── Policies ───────────────────────────────────────────────────────────────
  createPolicy(params) {
    return this.http.post("/v1/billing/dunning/policies", params);
  }
  listPolicies() {
    return this.http.get("/v1/billing/dunning/policies");
  }
  getPolicy(id) {
    return this.http.get(`/v1/billing/dunning/policies/${id}`);
  }
  updatePolicy(id, params) {
    return this.http.patch(`/v1/billing/dunning/policies/${id}`, params);
  }
  // ── Subscription policy assignment ────────────────────────────────────────
  setSubscriptionPolicy(subscriptionId, policyId) {
    return this.http.post(
      `/v1/billing/dunning/subscriptions/${subscriptionId}/policy`,
      { policyId }
    );
  }
  // ── Invoice dunning actions ────────────────────────────────────────────────
  getInvoiceStatus(invoiceId) {
    return this.http.get(
      `/v1/billing/dunning/invoices/${invoiceId}/dunning`
    );
  }
  stopInvoice(invoiceId) {
    return this.http.post(
      `/v1/billing/dunning/invoices/${invoiceId}/dunning/stop`,
      {}
    );
  }
  retryInvoiceNow(invoiceId) {
    return this.http.post(
      `/v1/billing/dunning/invoices/${invoiceId}/dunning/retry-now`,
      {}
    );
  }
};

// src/resources/qr.ts
var QrResource = class {
  constructor(http) {
    this.http = http;
  }
  /**
   * Create a Fonepay Direct-QR session. Returns the raw QR string, a base64
   * PNG image, and a per-session SSE URL for real-time payment events.
   *
   * Premium feature — requires the merchant to be on the Premium plan.
   */
  fonepay(params) {
    return this.http.post("/v1/qr/fonepay", params);
  }
};

// src/client.ts
var PayBridge = class {
  http;
  /** Static webhook utility — no instance required for signature verification. */
  static webhooks = new WebhooksResource();
  _checkout;
  _payments;
  _refunds;
  _webhooks;
  _plans;
  _customers;
  _subscriptions;
  _invoices;
  _coupons;
  _promotionCodes;
  _dunning;
  _qr;
  constructor(config) {
    this.http = new HttpClient(config);
  }
  get checkout() {
    return this._checkout ??= new CheckoutResource(this.http);
  }
  get payments() {
    return this._payments ??= new PaymentsResource(this.http);
  }
  get refunds() {
    return this._refunds ??= new RefundsResource(this.http);
  }
  get webhooks() {
    return this._webhooks ??= new WebhooksResource(this.http);
  }
  get plans() {
    return this._plans ??= new PlansResource(this.http);
  }
  get customers() {
    return this._customers ??= new CustomersResource(this.http);
  }
  get subscriptions() {
    return this._subscriptions ??= new SubscriptionsResource(this.http);
  }
  get invoices() {
    return this._invoices ??= new InvoicesResource(this.http);
  }
  get coupons() {
    return this._coupons ??= new CouponsResource(this.http);
  }
  get promotionCodes() {
    return this._promotionCodes ??= new PromotionCodesResource(this.http);
  }
  get dunning() {
    return this._dunning ??= new DunningResource(this.http);
  }
  /**
   * Direct-QR API for Fonepay. Premium feature — generates an embeddable QR
   * + SSE event stream so developers can build their own checkout UI.
   */
  get qr() {
    return this._qr ??= new QrResource(this.http);
  }
};

// src/index.ts
var SDK_VERSION = "1.6.0";
export {
  PayBridge,
  PayBridgeAuthenticationError,
  PayBridgeError,
  PayBridgeInvalidRequestError,
  PayBridgeNotFoundError,
  PayBridgeRateLimitError,
  PayBridgeSignatureVerificationError,
  SDK_VERSION
};
//# sourceMappingURL=index.js.map