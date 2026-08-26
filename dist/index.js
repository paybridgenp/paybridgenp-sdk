// src/errors.ts
var PayBridgeError = class extends Error {
  /** HTTP status code, or 0 for connection / signature errors. */
  statusCode;
  /** Broad category — matches `error.type` from the API. */
  type;
  /** Specific identifier — matches `error.code` from the API (may be undefined). */
  code;
  /** Request ID — matches `error.request_id` and the `X-Request-Id` header. */
  requestId;
  /** Full parsed JSON body of the error response. */
  raw;
  constructor(message, statusCode, type, options = {}) {
    super(message);
    this.name = "PayBridgeError";
    this.statusCode = statusCode;
    this.type = type;
    this.code = options.code;
    this.requestId = options.requestId;
    this.raw = options.raw ?? null;
    Object.setPrototypeOf(this, new.target.prototype);
  }
  toJSON() {
    return {
      name: this.name,
      message: this.message,
      type: this.type,
      code: this.code,
      statusCode: this.statusCode,
      requestId: this.requestId,
      raw: this.raw
    };
  }
};
var AuthenticationError = class extends PayBridgeError {
  constructor(message, opts = {}) {
    super(message, 401, "authentication_error", opts);
    this.name = "AuthenticationError";
  }
};
var AccountError = class extends PayBridgeError {
  /** Set when `code === "account_suspended"`. */
  suspension;
  /** Set when `code === "token_paused"`. */
  pause;
  constructor(message, statusCode, opts = {}) {
    super(message, statusCode, "account_error", opts);
    this.name = "AccountError";
    this.suspension = opts.suspension;
    this.pause = opts.pause;
  }
};
var PermissionError = class extends PayBridgeError {
  constructor(message, statusCode = 403, opts = {}) {
    super(message, statusCode, "permission_error", opts);
    this.name = "PermissionError";
  }
};
var InvalidRequestError = class extends PayBridgeError {
  constructor(message, statusCode = 400, opts = {}) {
    super(message, statusCode, "invalid_request_error", opts);
    this.name = "InvalidRequestError";
  }
};
var NotFoundError = class extends InvalidRequestError {
  constructor(message, opts = {}) {
    super(message, 404, opts);
    this.name = "NotFoundError";
  }
};
var IdempotencyError = class extends PayBridgeError {
  constructor(message, opts = {}) {
    super(message, 409, "idempotency_error", opts);
    this.name = "IdempotencyError";
  }
};
var RateLimitError = class extends PayBridgeError {
  /** From `Retry-After` header, in seconds. Undefined if header was absent. */
  retryAfter;
  constructor(message, opts = {}) {
    super(message, 429, "rate_limit_error", opts);
    this.name = "RateLimitError";
    this.retryAfter = opts.retryAfter;
  }
};
var ApiError = class extends PayBridgeError {
  constructor(message, statusCode = 500, opts = {}) {
    super(message, statusCode, "api_error", opts);
    this.name = "ApiError";
  }
};
var ConnectionError = class extends PayBridgeError {
  constructor(message) {
    super(message, 0, "connection_error");
    this.name = "ConnectionError";
  }
};
var SignatureVerificationError = class extends PayBridgeError {
  constructor(message = "Webhook signature verification failed") {
    super(message, 0, "signature_verification_error");
    this.name = "SignatureVerificationError";
  }
};
var PayBridgeAuthenticationError = AuthenticationError;
var PayBridgeInvalidRequestError = InvalidRequestError;
var PayBridgeRateLimitError = RateLimitError;
var PayBridgeSignatureVerificationError = SignatureVerificationError;
var PayBridgeNotFoundError = InvalidRequestError;
function parseErrorResponse(statusCode, body, retryAfterHeader) {
  const errObj = body && typeof body === "object" && body.error && typeof body.error === "object" ? body.error : null;
  const message = errObj ? String(errObj.message ?? `HTTP ${statusCode}`) : typeof body?.error === "string" ? body.error : `HTTP ${statusCode}`;
  const type = errObj && typeof errObj.type === "string" ? errObj.type : void 0;
  const code = errObj && typeof errObj.code === "string" ? errObj.code : typeof body?.code === "string" ? body.code : void 0;
  const requestId = errObj && typeof errObj.request_id === "string" ? errObj.request_id : void 0;
  const opts = { code, requestId, raw: body };
  switch (type) {
    case "authentication_error":
      return new AuthenticationError(message, opts);
    case "account_error":
      return new AccountError(message, statusCode, {
        ...opts,
        suspension: errObj?.suspension,
        pause: errObj?.pause
      });
    case "permission_error":
      return new PermissionError(message, statusCode, opts);
    case "invalid_request_error":
      return statusCode === 404 ? new NotFoundError(message, opts) : new InvalidRequestError(message, statusCode, opts);
    case "idempotency_error":
      return new IdempotencyError(message, opts);
    case "rate_limit_error":
      return new RateLimitError(message, {
        ...opts,
        retryAfter: retryAfterHeader ? Number(retryAfterHeader) : void 0
      });
    case "api_error":
      return new ApiError(message, statusCode, opts);
  }
  if (statusCode === 401) return new AuthenticationError(message, opts);
  if (statusCode === 403) return new PermissionError(message, statusCode, opts);
  if (statusCode === 404) return new NotFoundError(message, opts);
  if (statusCode === 409) return new InvalidRequestError(message, statusCode, opts);
  if (statusCode === 429) return new RateLimitError(message, {
    ...opts,
    retryAfter: retryAfterHeader ? Number(retryAfterHeader) : void 0
  });
  if (statusCode >= 400 && statusCode < 500) return new InvalidRequestError(message, statusCode, opts);
  return new ApiError(message, statusCode, opts);
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
  async request(method, path, body, idempotencyKey) {
    const url = `${this.baseUrl}${path}`;
    const isSafe = method.toUpperCase() === "GET";
    const headers = {
      Authorization: `Bearer ${this.apiKey}`,
      "Content-Type": "application/json",
      "User-Agent": "PayBridgeNP-SDK/5.7.0"
    };
    if (!isSafe) {
      headers["Idempotency-Key"] = idempotencyKey ?? crypto.randomUUID();
    }
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
        if (!isSafe || attempt > this.maxRetries) {
          throw new ConnectionError(`Connection error: ${err.message}`);
        }
        await sleep(backoff(attempt));
        continue;
      }
      if (res.ok) {
        return res.json();
      }
      if (isSafe && RETRY_STATUSES.has(res.status) && attempt <= this.maxRetries) {
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
      throw parseErrorResponse(res.status, raw, res.headers.get("Retry-After"));
    }
  }
  get(path) {
    return this.request("GET", path);
  }
  post(path, body, idempotencyKey) {
    return this.request("POST", path, body, idempotencyKey);
  }
  patch(path, body, idempotencyKey) {
    return this.request("PATCH", path, body, idempotencyKey);
  }
  delete(path, idempotencyKey) {
    return this.request("DELETE", path, void 0, idempotencyKey);
  }
};

// src/resources/checkout.ts
var CheckoutResource = class {
  constructor(http) {
    this.http = http;
  }
  create(params, idempotencyKey) {
    return this.http.post("/v1/checkout", params, idempotencyKey);
  }
  /**
   * Retrieve a checkout session by ID, including its current status, amount,
   * customer, and any collected address. Read-only — sessions are created via
   * {@link create}. Hits `GET /v1/sessions/{id}`.
   *
   * Note: this richer read shape uses camelCase keys (`customerName`,
   * `expiresAt`, …), unlike the snake_case create response.
   */
  retrieve(id) {
    return this.http.get(`/v1/sessions/${encodeURIComponent(id)}`);
  }
  /**
   * List checkout sessions for the authenticated project, newest first.
   * Optionally filter by `status` and page with `limit`/`offset`. Hits
   * `GET /v1/sessions`.
   */
  list(params = {}) {
    const qs = new URLSearchParams();
    if (params.limit !== void 0) qs.set("limit", String(params.limit));
    if (params.offset !== void 0) qs.set("offset", String(params.offset));
    if (params.status !== void 0) qs.set("status", params.status);
    const query = qs.toString();
    return this.http.get(
      `/v1/sessions${query ? `?${query}` : ""}`
    );
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
  expire(id, idempotencyKey) {
    return this.http.post(
      `/v1/checkout/${encodeURIComponent(id)}/expire`,
      {},
      idempotencyKey
    );
  }
};

// src/resources/paymentLinks.ts
var PaymentLinksResource = class {
  constructor(http) {
    this.http = http;
  }
  /** Create a payment link. Returns the created link (HTTP 201). */
  create(params, idempotencyKey) {
    return this.http.post("/v1/payment-links", params, idempotencyKey);
  }
  /** List payment links for the project, newest first. Filter with `active`. */
  list(params = {}) {
    const qs = new URLSearchParams();
    if (params.limit !== void 0) qs.set("limit", String(params.limit));
    if (params.offset !== void 0) qs.set("offset", String(params.offset));
    if (params.active !== void 0) qs.set("active", String(params.active));
    const query = qs.toString();
    return this.http.get(
      `/v1/payment-links${query ? `?${query}` : ""}`
    );
  }
  /** Retrieve a single link by ID, including aggregated view/conversion stats. */
  retrieve(id) {
    return this.http.get(`/v1/payment-links/${encodeURIComponent(id)}`);
  }
  /** Update a link's editable fields. Only the keys you pass are changed. */
  update(id, params, idempotencyKey) {
    return this.http.patch(`/v1/payment-links/${encodeURIComponent(id)}`, params, idempotencyKey);
  }
  /**
   * Cancel (deactivate) a link so it can no longer accept payments, while
   * keeping it and its history for your records. The recommended way to retire
   * a link that has already been used.
   */
  cancel(id, idempotencyKey) {
    return this.http.post(`/v1/payment-links/${encodeURIComponent(id)}/cancel`, {}, idempotencyKey);
  }
  /**
   * Permanently delete a link. Only allowed when the link has never been used —
   * otherwise the API returns 422 and you should {@link cancel} it instead.
   */
  delete(id, idempotencyKey) {
    return this.http.delete(`/v1/payment-links/${encodeURIComponent(id)}`, idempotencyKey);
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
  create(params, idempotencyKey) {
    return this.http.post("/v1/refunds", params, idempotencyKey);
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
  create(params, idempotencyKey) {
    if (!this.http) throw new Error("WebhooksResource requires an HttpClient");
    return this.http.post("/v1/webhooks", params, idempotencyKey);
  }
  list() {
    if (!this.http) throw new Error("WebhooksResource requires an HttpClient");
    return this.http.get("/v1/webhooks");
  }
  update(id, params, idempotencyKey) {
    if (!this.http) throw new Error("WebhooksResource requires an HttpClient");
    return this.http.patch(`/v1/webhooks/${id}`, params, idempotencyKey);
  }
  delete(id, idempotencyKey) {
    if (!this.http) throw new Error("WebhooksResource requires an HttpClient");
    return this.http.delete(`/v1/webhooks/${id}`, idempotencyKey);
  }
  listDeliveries(id) {
    if (!this.http) throw new Error("WebhooksResource requires an HttpClient");
    return this.http.get(`/v1/webhooks/${id}/deliveries`);
  }
  /**
   * Verify and parse a webhook event from an incoming request.
   *
   * @param body      - Raw request body string (do NOT parse as JSON first)
   * @param signature - Value of the `X-PayBridgeNP-Signature` header
   * @param secret    - Your webhook signing secret (whsec_...)
   */
  async constructEvent(body, signature, secret) {
    if (!signature) throw new PayBridgeSignatureVerificationError("Missing X-PayBridgeNP-Signature header");
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
  create(params, idempotencyKey) {
    return this.http.post("/v1/billing/plans", params, idempotencyKey);
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
  update(id, params, idempotencyKey) {
    return this.http.patch(`/v1/billing/plans/${id}`, params, idempotencyKey);
  }
};

// src/resources/customers.ts
var CustomersResource = class {
  constructor(http) {
    this.http = http;
  }
  create(params, idempotencyKey) {
    return this.http.post("/v1/billing/customers", params, idempotencyKey);
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
  update(id, params, idempotencyKey) {
    return this.http.patch(`/v1/billing/customers/${id}`, params, idempotencyKey);
  }
  delete(id, idempotencyKey) {
    return this.http.delete(`/v1/billing/customers/${id}`, idempotencyKey);
  }
  /**
   * Add (or deduct, with negative amount) credits to a customer's balance.
   * Credits are applied automatically against future invoices before payment.
   * @param amount Amount in paisa (NPR × 100).
   */
  addCredit(id, params, idempotencyKey) {
    return this.http.post(`/v1/billing/customers/${id}/credit`, params, idempotencyKey);
  }
};

// src/resources/subscriptions.ts
var SubscriptionsResource = class {
  constructor(http) {
    this.http = http;
  }
  create(params, idempotencyKey) {
    return this.http.post("/v1/billing/subscriptions", params, idempotencyKey);
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
  pause(id, params = {}, idempotencyKey) {
    return this.http.post(`/v1/billing/subscriptions/${id}/pause`, params, idempotencyKey);
  }
  resume(id, idempotencyKey) {
    return this.http.post(`/v1/billing/subscriptions/${id}/resume`, {}, idempotencyKey);
  }
  cancel(id, params = {}, idempotencyKey) {
    return this.http.post(`/v1/billing/subscriptions/${id}/cancel`, params, idempotencyKey);
  }
  changePlan(id, params, idempotencyKey) {
    return this.http.post(`/v1/billing/subscriptions/${id}/change-plan`, params, idempotencyKey);
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
  endTrial(id, idempotencyKey) {
    return this.http.post(`/v1/billing/subscriptions/${id}/end-trial`, {}, idempotencyKey);
  }
  /**
   * Push the trial end date further into the future. Only valid while trial
   * is still active. Re-arms the 3-day-before reminder. Fires
   * `subscription.trial_extended` webhook.
   */
  extendTrial(id, params, idempotencyKey) {
    return this.http.post(`/v1/billing/subscriptions/${id}/extend-trial`, params, idempotencyKey);
  }
  /**
   * Attach a coupon or promotion code to an existing subscription. Takes
   * effect on the next invoice. Deactivates any prior active discount on
   * this sub (partial unique index enforces one active discount per sub).
   */
  applyCoupon(id, params, idempotencyKey) {
    return this.http.post(`/v1/billing/subscriptions/${id}/apply-coupon`, params, idempotencyKey);
  }
  /** Remove the currently active discount. Future invoices are un-discounted. */
  removeDiscount(id, idempotencyKey) {
    return this.http.delete(`/v1/billing/subscriptions/${id}/discount`, idempotencyKey);
  }
  // ── Usage (metered billing) ─────────────────────────────────────────────────
  /**
   * Report a usage event for a metered subscription. Use `action: "increment"`
   * (default) to add to the running total, or `action: "set"` for gauge-style
   * metrics. Pass `idempotencyKey` to prevent double-counting.
   */
  reportUsage(id, params, idempotencyKey) {
    return this.http.post(`/v1/billing/subscriptions/${id}/usage`, {
      quantity: params.quantity,
      action: params.action,
      recorded_at: params.recordedAt,
      idempotency_key: params.idempotencyKey
    }, idempotencyKey);
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
  createInvoiceItem(id, params, idempotencyKey) {
    return this.http.post(`/v1/billing/subscriptions/${id}/invoice-items`, params, idempotencyKey);
  }
  /** Delete a pending invoice item before it is invoiced. */
  deleteInvoiceItem(subscriptionId, itemId, idempotencyKey) {
    return this.http.delete(`/v1/billing/subscriptions/${subscriptionId}/invoice-items/${itemId}`, idempotencyKey);
  }
  /** Update the per-seat quantity on an active per_unit subscription. */
  updateQuantity(id, quantity, idempotencyKey) {
    return this.http.patch(`/v1/billing/subscriptions/${id}/quantity`, { quantity }, idempotencyKey);
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
  /**
   * Mint a Fonepay Direct-QR to pay this invoice. The customer scans it (in your
   * own UI / at a counter) and on success the invoice is marked paid and the
   * subscription activates (`incomplete`→`active`) — the same outcome as the
   * hosted bill page, just collected via an embedded QR. Returns a normal
   * Direct-QR session (use its `events_url` SSE stream + `qr.refresh(id)`).
   *
   * Premium feature; requires the `billing:write` scope and Fonepay configured.
   */
  qr(id, idempotencyKey) {
    return this.http.post(`/v1/billing/invoices/${encodeURIComponent(id)}/qr`, {}, idempotencyKey);
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
  create(params, idempotencyKey) {
    return this.http.post("/v1/billing/coupons", params, idempotencyKey);
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
  deactivate(id, idempotencyKey) {
    return this.http.delete(`/v1/billing/coupons/${id}`, idempotencyKey);
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
  create(params, idempotencyKey) {
    return this.http.post("/v1/billing/promotion-codes", params, idempotencyKey);
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
  deactivate(id, idempotencyKey) {
    return this.http.patch(`/v1/billing/promotion-codes/${id}`, { active: false }, idempotencyKey);
  }
  /**
   * Read-only validation with discount preview. Safe to poll. Does NOT
   * redeem the code.
   */
  validate(params, idempotencyKey) {
    return this.http.post(
      "/v1/billing/promotion-codes/validate",
      params,
      idempotencyKey
    );
  }
};

// src/resources/dunning.ts
var DunningResource = class {
  constructor(http) {
    this.http = http;
  }
  // ── Policies ───────────────────────────────────────────────────────────────
  createPolicy(params, idempotencyKey) {
    return this.http.post("/v1/billing/dunning/policies", params, idempotencyKey);
  }
  listPolicies() {
    return this.http.get("/v1/billing/dunning/policies");
  }
  getPolicy(id) {
    return this.http.get(`/v1/billing/dunning/policies/${id}`);
  }
  updatePolicy(id, params, idempotencyKey) {
    return this.http.patch(`/v1/billing/dunning/policies/${id}`, params, idempotencyKey);
  }
  // ── Subscription policy assignment ────────────────────────────────────────
  setSubscriptionPolicy(subscriptionId, policyId, idempotencyKey) {
    return this.http.post(
      `/v1/billing/dunning/subscriptions/${subscriptionId}/policy`,
      { policyId },
      idempotencyKey
    );
  }
  // ── Invoice dunning actions ────────────────────────────────────────────────
  getInvoiceStatus(invoiceId) {
    return this.http.get(
      `/v1/billing/dunning/invoices/${invoiceId}/dunning`
    );
  }
  stopInvoice(invoiceId, idempotencyKey) {
    return this.http.post(
      `/v1/billing/dunning/invoices/${invoiceId}/dunning/stop`,
      {},
      idempotencyKey
    );
  }
  retryInvoiceNow(invoiceId, idempotencyKey) {
    return this.http.post(
      `/v1/billing/dunning/invoices/${invoiceId}/dunning/retry-now`,
      {},
      idempotencyKey
    );
  }
};

// src/resources/tax.ts
var TaxResource = class {
  constructor(http) {
    this.http = http;
  }
  /** Get the current tax settings. */
  getSettings() {
    return this.http.get("/v1/billing/settings/tax");
  }
  /** Update tax settings (enabled, rate, registration number, label). */
  updateSettings(params, idempotencyKey) {
    return this.http.patch("/v1/billing/settings/tax", params, idempotencyKey);
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
  fonepay(params, idempotencyKey) {
    return this.http.post("/v1/qr/fonepay", params, idempotencyKey);
  }
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
  refresh(id, idempotencyKey) {
    return this.http.post(`/v1/qr/${encodeURIComponent(id)}/refresh`, {}, idempotencyKey);
  }
};

// src/resources/account.ts
var AccountResource = class {
  constructor(http) {
    this.http = http;
  }
  get() {
    return this.http.get("/v1/account");
  }
};

// src/resources/analytics.ts
var AnalyticsResource = class {
  constructor(http) {
    this.http = http;
  }
  overview(days) {
    const query = days === void 0 ? "" : `?days=${encodeURIComponent(String(days))}`;
    return this.http.get(`/v1/analytics/overview${query}`);
  }
};

// src/resources/providers.ts
var ProvidersResource = class {
  constructor(http) {
    this.http = http;
  }
  list() {
    return this.http.get("/v1/providers");
  }
};

// src/resources/sms.ts
var SmsResource = class {
  constructor(http) {
    this.http = http;
  }
  /**
   * Send a pending-payment reminder. The optional key is sent for SDK API
   * consistency, but the server does not currently deduplicate this route.
   */
  notifyPendingPayment(params, idempotencyKey) {
    return this.http.post("/v1/sms/notify-pending-payment", params, idempotencyKey);
  }
};

// src/client.ts
var PayBridgeNP = class {
  http;
  /** Static webhook utility — no instance required for signature verification. */
  static webhooks = new WebhooksResource();
  _checkout;
  _paymentLinks;
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
  _tax;
  _qr;
  _account;
  _analytics;
  _providers;
  _sms;
  constructor(config) {
    this.http = new HttpClient(config);
  }
  get checkout() {
    return this._checkout ??= new CheckoutResource(this.http);
  }
  /** Reusable hosted payment pages — create / list / retrieve / update / cancel / delete. */
  get paymentLinks() {
    return this._paymentLinks ??= new PaymentLinksResource(this.http);
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
  /** Account-level tax settings applied to invoices. */
  get tax() {
    return this._tax ??= new TaxResource(this.http);
  }
  /**
   * Direct-QR API for Fonepay. Premium feature — generates an embeddable QR
   * + SSE event stream so developers can build their own checkout UI.
   */
  get qr() {
    return this._qr ??= new QrResource(this.http);
  }
  /** Account context implied by the calling API key. */
  get account() {
    return this._account ??= new AccountResource(this.http);
  }
  /** Aggregated payment and checkout KPIs. */
  get analytics() {
    return this._analytics ??= new AnalyticsResource(this.http);
  }
  /** Providers enabled and configured for this project. */
  get providers() {
    return this._providers ??= new ProvidersResource(this.http);
  }
  /** Transactional SMS operations. */
  get sms() {
    return this._sms ??= new SmsResource(this.http);
  }
};

// src/index.ts
var SDK_VERSION = "5.7.0";
export {
  AccountError,
  ApiError,
  AuthenticationError,
  ConnectionError,
  IdempotencyError,
  InvalidRequestError,
  NotFoundError,
  PayBridgeAuthenticationError,
  PayBridgeError,
  PayBridgeInvalidRequestError,
  PayBridgeNP,
  PayBridgeNotFoundError,
  PayBridgeRateLimitError,
  PayBridgeSignatureVerificationError,
  PermissionError,
  RateLimitError,
  SDK_VERSION,
  SignatureVerificationError,
  parseErrorResponse
};
//# sourceMappingURL=index.js.map