export { PayBridge } from "./client";
export {
  PayBridgeError,
  PayBridgeAuthenticationError,
  PayBridgeNotFoundError,
  PayBridgeInvalidRequestError,
  PayBridgeRateLimitError,
  PayBridgeSignatureVerificationError,
} from "./errors";
export type { PayBridgeErrorCode } from "./errors";
export type {
  PayBridgeConfig,
  Provider,
  PaymentStatus,
  Metadata,
  CreateCheckoutParams,
  CheckoutSession,
  PaymentMethod,
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

export const SDK_VERSION = "0.1.0" as const;
