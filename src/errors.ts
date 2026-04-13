export type PayBridgeErrorCode =
  | "authentication_error"
  | "permission_error"
  | "invalid_request_error"
  | "not_found_error"
  | "rate_limit_error"
  | "api_error"
  | "connection_error"
  | "signature_verification_error";

export class PayBridgeError extends Error {
  readonly statusCode: number;
  readonly code: PayBridgeErrorCode;
  readonly raw: Record<string, unknown> | null;

  constructor(
    message: string,
    statusCode: number,
    code: PayBridgeErrorCode,
    raw: Record<string, unknown> | null = null,
  ) {
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
}

export class PayBridgeAuthenticationError extends PayBridgeError {
  constructor(message: string, raw?: Record<string, unknown>) {
    super(message, 401, "authentication_error", raw ?? null);
    this.name = "PayBridgeAuthenticationError";
  }
}

export class PayBridgeNotFoundError extends PayBridgeError {
  constructor(message: string, raw?: Record<string, unknown>) {
    super(message, 404, "not_found_error", raw ?? null);
    this.name = "PayBridgeNotFoundError";
  }
}

export class PayBridgeInvalidRequestError extends PayBridgeError {
  constructor(message: string, raw?: Record<string, unknown>) {
    super(message, 400, "invalid_request_error", raw ?? null);
    this.name = "PayBridgeInvalidRequestError";
  }
}

export class PayBridgeRateLimitError extends PayBridgeError {
  constructor(message: string, raw?: Record<string, unknown>) {
    super(message, 429, "rate_limit_error", raw ?? null);
    this.name = "PayBridgeRateLimitError";
  }
}

export class PayBridgeSignatureVerificationError extends PayBridgeError {
  constructor(message = "Webhook signature verification failed") {
    super(message, 0, "signature_verification_error");
    this.name = "PayBridgeSignatureVerificationError";
  }
}

export function createError(
  message: string,
  statusCode: number,
  raw: Record<string, unknown> | null,
): PayBridgeError {
  switch (statusCode) {
    case 401: return new PayBridgeAuthenticationError(message, raw ?? undefined);
    case 404: return new PayBridgeNotFoundError(message, raw ?? undefined);
    case 400:
    case 422: return new PayBridgeInvalidRequestError(message, raw ?? undefined);
    case 429: return new PayBridgeRateLimitError(message, raw ?? undefined);
    default:  return new PayBridgeError(message, statusCode, "api_error", raw);
  }
}
