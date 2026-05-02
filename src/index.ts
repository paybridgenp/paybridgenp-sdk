export { PayBridge } from "./client";
export {
  // v3 typed error hierarchy — branch with `instanceof`.
  PayBridgeError,
  AuthenticationError,
  AccountError,
  PermissionError,
  InvalidRequestError,
  IdempotencyError,
  RateLimitError,
  ApiError,
  ConnectionError,
  SignatureVerificationError,
  // Pre-3.0 names kept as deprecated aliases.
  PayBridgeAuthenticationError,
  PayBridgeNotFoundError,
  PayBridgeInvalidRequestError,
  PayBridgeRateLimitError,
  PayBridgeSignatureVerificationError,
  parseErrorResponse,
} from "./errors";
export type { PayBridgeErrorType, SuspensionDetail, PauseDetail } from "./errors";
/** @deprecated use `PayBridgeErrorType` */
export type { PayBridgeErrorType as PayBridgeErrorCode } from "./errors";
export type {
  PayBridgeConfig,
  Provider,
  PaymentStatus,
  Metadata,
  CheckoutFlow,
  CreateCheckoutParams,
  CheckoutSession,
  CheckoutSessionStatus,
  ExpiredCheckoutSession,
  Payment,
  ListPaymentsParams,
  PaginatedResponse,
  PaginationMeta,
  WebhookEventType,
  WebhookEvent,
  CreateWebhookParams,
  WebhookEndpoint,
} from "./types";

export type {
  RefundStatus,
  RefundReason,
  Refund,
  CreateRefundParams,
  ListRefundsParams,
} from "./types/refunds";

export type {
  FonepayQrCustomer,
  CreateFonepayQrParams,
  FonepayQrSession,
} from "./types/qr";

export type {
  // Plans
  IntervalUnit,
  OverdueAction,
  CreatePlanParams,
  UpdatePlanParams,
  ListPlansParams,
  Plan,
  // Customers
  CreateCustomerParams,
  UpdateCustomerParams,
  ListCustomersParams,
  BillingCustomer,
  // Subscriptions
  SubscriptionStatus,
  CreateSubscriptionParams,
  ListSubscriptionsParams,
  PauseSubscriptionParams,
  CancelSubscriptionParams,
  ChangePlanParams,
  Subscription,
  // Invoices
  InvoiceStatus,
  ListInvoicesParams,
  Invoice,
  // Shared
  PaginatedBillingResponse,
} from "./types/billing";

export const SDK_VERSION = "3.0.0" as const;
