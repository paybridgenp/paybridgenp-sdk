// ---------------------------------------------------------------------------
// PayBridgeNP SDK error classes (v3+)
// ---------------------------------------------------------------------------
// Mirrors the API's nested error envelope:
//
//   { "error": { "message": "...", "type": "...", "code": "...", "request_id": "...", ... } }
//
// `type` drives the class hierarchy below (auth → AuthenticationError, etc.)
// so callers can branch with `instanceof` instead of comparing strings.
// ---------------------------------------------------------------------------

export type PayBridgeErrorType =
  | "authentication_error"
  | "account_error"
  | "permission_error"
  | "invalid_request_error"
  | "idempotency_error"
  | "rate_limit_error"
  | "api_error"
  | "connection_error"
  | "signature_verification_error";

/** Shape of `error.suspension` returned with `account_suspended`. */
export type SuspensionDetail = {
  suspended_at?: string;
  reason?: string | null;
};

/** Shape of `error.pause` returned with `token_paused`. */
export type PauseDetail = {
  paused_at?: string;
  reason?: string | null;
};

export class PayBridgeError extends Error {
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

  constructor(
    message: string,
    statusCode: number,
    type: PayBridgeErrorType,
    options: {
      code?: string;
      requestId?: string;
      raw?: Record<string, unknown> | null;
    } = {},
  ) {
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
      raw: this.raw,
    };
  }
}

export class AuthenticationError extends PayBridgeError {
  constructor(message: string, opts: ConstructorParameters<typeof PayBridgeError>[3] = {}) {
    super(message, 401, "authentication_error", opts);
    this.name = "AuthenticationError";
  }
}

export class AccountError extends PayBridgeError {
  /** Set when `code === "account_suspended"`. */
  readonly suspension: SuspensionDetail | undefined;
  /** Set when `code === "token_paused"`. */
  readonly pause: PauseDetail | undefined;

  constructor(
    message: string,
    statusCode: number,
    opts: ConstructorParameters<typeof PayBridgeError>[3] & {
      suspension?: SuspensionDetail;
      pause?: PauseDetail;
    } = {},
  ) {
    super(message, statusCode, "account_error", opts);
    this.name = "AccountError";
    this.suspension = opts.suspension;
    this.pause = opts.pause;
  }
}

export class PermissionError extends PayBridgeError {
  constructor(message: string, statusCode = 403, opts: ConstructorParameters<typeof PayBridgeError>[3] = {}) {
    super(message, statusCode, "permission_error", opts);
    this.name = "PermissionError";
  }
}

export class InvalidRequestError extends PayBridgeError {
  constructor(message: string, statusCode = 400, opts: ConstructorParameters<typeof PayBridgeError>[3] = {}) {
    super(message, statusCode, "invalid_request_error", opts);
    this.name = "InvalidRequestError";
  }
}

export class IdempotencyError extends PayBridgeError {
  constructor(message: string, opts: ConstructorParameters<typeof PayBridgeError>[3] = {}) {
    super(message, 409, "idempotency_error", opts);
    this.name = "IdempotencyError";
  }
}

export class RateLimitError extends PayBridgeError {
  /** From `Retry-After` header, in seconds. Undefined if header was absent. */
  readonly retryAfter: number | undefined;

  constructor(
    message: string,
    opts: ConstructorParameters<typeof PayBridgeError>[3] & { retryAfter?: number } = {},
  ) {
    super(message, 429, "rate_limit_error", opts);
    this.name = "RateLimitError";
    this.retryAfter = opts.retryAfter;
  }
}

export class ApiError extends PayBridgeError {
  constructor(message: string, statusCode = 500, opts: ConstructorParameters<typeof PayBridgeError>[3] = {}) {
    super(message, statusCode, "api_error", opts);
    this.name = "ApiError";
  }
}

export class ConnectionError extends PayBridgeError {
  constructor(message: string) {
    super(message, 0, "connection_error");
    this.name = "ConnectionError";
  }
}

export class SignatureVerificationError extends PayBridgeError {
  constructor(message = "Webhook signature verification failed") {
    super(message, 0, "signature_verification_error");
    this.name = "SignatureVerificationError";
  }
}

// Legacy aliases — pre-3.0 class names. Kept so the rename doesn't surprise
// callers who imported the old names. Marked deprecated.
/** @deprecated use `AuthenticationError` */
export const PayBridgeAuthenticationError = AuthenticationError;
/** @deprecated use `InvalidRequestError` */
export const PayBridgeInvalidRequestError = InvalidRequestError;
/** @deprecated use `RateLimitError` */
export const PayBridgeRateLimitError = RateLimitError;
/** @deprecated use `SignatureVerificationError` */
export const PayBridgeSignatureVerificationError = SignatureVerificationError;
/** @deprecated 404 is now an `InvalidRequestError` (Stripe convention) — check `statusCode === 404` if you need to distinguish */
export const PayBridgeNotFoundError = InvalidRequestError;

/**
 * Parse an error response body and instantiate the right typed error.
 * Accepts the v3 nested envelope; tolerates the legacy flat shape so
 * old API responses don't blow up SDK consumers during migration.
 */
export function parseErrorResponse(
  statusCode: number,
  body: Record<string, unknown> | null,
  retryAfterHeader: string | null,
): PayBridgeError {
  const errObj = body && typeof body === "object" && body.error && typeof body.error === "object"
    ? (body.error as Record<string, unknown>)
    : null;

  const message = errObj
    ? String(errObj.message ?? `HTTP ${statusCode}`)
    : typeof body?.error === "string"
      ? body.error
      : `HTTP ${statusCode}`;
  const type = errObj && typeof errObj.type === "string" ? (errObj.type as PayBridgeErrorType) : undefined;
  const code = errObj && typeof errObj.code === "string"
    ? errObj.code
    : typeof body?.code === "string"
      ? body.code
      : undefined;
  const requestId = errObj && typeof errObj.request_id === "string" ? errObj.request_id : undefined;
  const opts = { code, requestId, raw: body };

  switch (type) {
    case "authentication_error":
      return new AuthenticationError(message, opts);
    case "account_error":
      return new AccountError(message, statusCode, {
        ...opts,
        suspension: errObj?.suspension as SuspensionDetail | undefined,
        pause: errObj?.pause as PauseDetail | undefined,
      });
    case "permission_error":
      return new PermissionError(message, statusCode, opts);
    case "invalid_request_error":
      return new InvalidRequestError(message, statusCode, opts);
    case "idempotency_error":
      return new IdempotencyError(message, opts);
    case "rate_limit_error":
      return new RateLimitError(message, {
        ...opts,
        retryAfter: retryAfterHeader ? Number(retryAfterHeader) : undefined,
      });
    case "api_error":
      return new ApiError(message, statusCode, opts);
  }

  // No type field — derive from status (legacy flat shape).
  if (statusCode === 401) return new AuthenticationError(message, opts);
  if (statusCode === 403) return new PermissionError(message, statusCode, opts);
  if (statusCode === 404) return new InvalidRequestError(message, statusCode, opts);
  if (statusCode === 409) return new InvalidRequestError(message, statusCode, opts);
  if (statusCode >= 400 && statusCode < 500) return new InvalidRequestError(message, statusCode, opts);
  if (statusCode === 429) return new RateLimitError(message, {
    ...opts,
    retryAfter: retryAfterHeader ? Number(retryAfterHeader) : undefined,
  });
  return new ApiError(message, statusCode, opts);
}

/** @deprecated use `parseErrorResponse` */
export function createError(
  message: string,
  statusCode: number,
  raw: Record<string, unknown> | null,
): PayBridgeError {
  // Synthesise the new envelope shape from a flat (message, statusCode, raw).
  return parseErrorResponse(statusCode, raw, null);
}
