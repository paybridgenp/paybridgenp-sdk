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

// src/client.ts
var PayBridge = class {
  http;
  /** Static webhook utility — no instance required for signature verification. */
  static webhooks = new WebhooksResource();
  _checkout;
  _payments;
  _webhooks;
  _plans;
  _customers;
  _subscriptions;
  _invoices;
  constructor(config) {
    this.http = new HttpClient(config);
  }
  get checkout() {
    return this._checkout ??= new CheckoutResource(this.http);
  }
  get payments() {
    return this._payments ??= new PaymentsResource(this.http);
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
};

// src/index.ts
var SDK_VERSION = "0.1.0";
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