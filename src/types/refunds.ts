export type RefundStatus = "processing" | "succeeded" | "failed" | "requires_action";

export type RefundReason = "customer_request" | "duplicate" | "fraudulent" | "other";

export type Refund = {
  id: string;
  /** `true` when created with a live key, `false` for sandbox. */
  livemode: boolean;
  paymentId: string;
  projectId: string;
  mode: "sandbox" | "live";
  amount: number;
  currency: string;
  reason: RefundReason;
  status: RefundStatus;
  providerRefundId: string | null;
  failureReason: string | null;
  notes: string | null;
  mobileNumber: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CreateRefundParams = {
  paymentId: string;
  amount: number;
  reason: RefundReason;
  notes?: string;
  /** Required by some Khalti configurations. */
  mobileNumber?: string;
};

export type ListRefundsParams = {
  paymentId?: string;
  limit?: number;
  offset?: number;
};
