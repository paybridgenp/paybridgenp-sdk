export { PayBridgeNP } from "./client";
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
  NotFoundError,
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
  RetrievedCheckoutSession,
  SessionProvider,
  SessionAddress,
  ListSessionsParams,
  PaymentLink,
  PaymentLinkWithStats,
  CreatePaymentLinkParams,
  UpdatePaymentLinkParams,
  ListPaymentLinksParams,
  DeletedPaymentLink,
  Payment,
  ListPaymentsParams,
  PaginatedResponse,
  PaginationMeta,
  WebhookEventType,
  WebhookEvent,
  CreateWebhookParams,
  WebhookEndpoint,
  Account,
  AnalyticsOverview,
  ProviderList,
  NotifyPendingPaymentParams,
  SmsNotifyResult,
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
  BillingScheme,
  AggregationMethod,
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
  ChangePlanResult,
  ProrationBehavior,
  ProrationPreview,
  ExtendTrialParams,
  EndTrialResponse,
  Subscription,
  CustomerRef,
  PlanRef,
  SubscriptionLatestInvoice,
  // Coupons + promotion codes
  CouponDiscountType,
  CouponDuration,
  Coupon,
  CreateCouponParams,
  ListCouponsParams,
  PromotionCode,
  CreatePromotionCodeParams,
  ListPromotionCodesParams,
  ValidatePromotionCodeParams,
  ValidatePromotionCodeResponse,
  ApplyCouponParams,
  Discount,
  // Tax
  TaxSettings,
  UpdateTaxSettingsParams,
  // Usage + invoice items
  ReportUsageParams,
  UsageReportAck,
  UsageRecord,
  UsageSummary,
  CreateInvoiceItemParams,
  InvoiceItem,
  // Invoices
  InvoiceStatus,
  ListInvoicesParams,
  Invoice,
  InvoiceSubscriptionRef,
  // Dunning
  DunningFinalAction,
  DunningPolicy,
  CreateDunningPolicyParams,
  UpdateDunningPolicyParams,
  DunningAttempt,
  DunningInvoiceStatus,
  // Shared
  PaginatedBillingResponse,
  BillingListResponse,
} from "./types/billing";

export const SDK_VERSION = "5.7.0" as const;
