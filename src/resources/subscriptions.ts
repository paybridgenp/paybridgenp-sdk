import type { HttpClient } from "../http";
import type {
  ApplyCouponParams,
  CancelSubscriptionParams,
  ChangePlanParams,
  ChangePlanResult,
  CreateInvoiceItemParams,
  CreateSubscriptionParams,
  EndTrialResponse,
  ExtendTrialParams,
  InvoiceItem,
  ListSubscriptionsParams,
  PaginatedBillingResponse,
  PauseSubscriptionParams,
  ProrationPreview,
  ReportUsageParams,
  Subscription,
  UsageRecord,
  UsageSummary,
} from "../types/billing";

export class SubscriptionsResource {
  constructor(private readonly http: HttpClient) {}

  create(params: CreateSubscriptionParams): Promise<Subscription> {
    return this.http.post<Subscription>("/v1/billing/subscriptions", params);
  }

  list(params: ListSubscriptionsParams = {}): Promise<PaginatedBillingResponse<Subscription>> {
    const qs = new URLSearchParams();
    if (params.page !== undefined) qs.set("page", String(params.page));
    if (params.limit !== undefined) qs.set("limit", String(params.limit));
    if (params.status !== undefined) qs.set("status", params.status);
    if (params.customerId !== undefined) qs.set("customerId", params.customerId);
    if (params.planId !== undefined) qs.set("planId", params.planId);
    const query = qs.toString();
    return this.http.get<PaginatedBillingResponse<Subscription>>(
      `/v1/billing/subscriptions${query ? `?${query}` : ""}`,
    );
  }

  get(id: string): Promise<Subscription> {
    return this.http.get<Subscription>(`/v1/billing/subscriptions/${id}`);
  }

  pause(id: string, params: PauseSubscriptionParams = {}): Promise<Subscription> {
    return this.http.post<Subscription>(`/v1/billing/subscriptions/${id}/pause`, params);
  }

  resume(id: string): Promise<Subscription> {
    return this.http.post<Subscription>(`/v1/billing/subscriptions/${id}/resume`, {});
  }

  cancel(id: string, params: CancelSubscriptionParams = {}): Promise<Subscription> {
    return this.http.post<Subscription>(`/v1/billing/subscriptions/${id}/cancel`, params);
  }

  changePlan(id: string, params: ChangePlanParams): Promise<ChangePlanResult> {
    return this.http.post<ChangePlanResult>(`/v1/billing/subscriptions/${id}/change-plan`, params);
  }

  /**
   * Preview the proration credit/debit amounts for a mid-period plan change
   * without committing any changes. Use before calling `changePlan` with
   * `prorationBehavior: "create_prorations"` to show the customer the net amount.
   */
  previewProration(id: string, newPlanId: string): Promise<ProrationPreview> {
    return this.http.get<ProrationPreview>(
      `/v1/billing/subscriptions/${id}/preview-proration?newPlanId=${encodeURIComponent(newPlanId)}`,
    );
  }

  /**
   * End a subscription's trial immediately. Generates the first paid invoice
   * and emails it to the customer. Fires `subscription.trial_ended` webhook.
   * Idempotent — subsequent calls return 409 `trial_not_active`.
   */
  endTrial(id: string): Promise<EndTrialResponse> {
    return this.http.post<EndTrialResponse>(`/v1/billing/subscriptions/${id}/end-trial`, {});
  }

  /**
   * Push the trial end date further into the future. Only valid while trial
   * is still active. Re-arms the 3-day-before reminder. Fires
   * `subscription.trial_extended` webhook.
   */
  extendTrial(id: string, params: ExtendTrialParams): Promise<Subscription> {
    return this.http.post<Subscription>(`/v1/billing/subscriptions/${id}/extend-trial`, params);
  }

  /**
   * Attach a coupon or promotion code to an existing subscription. Takes
   * effect on the next invoice. Deactivates any prior active discount on
   * this sub (partial unique index enforces one active discount per sub).
   */
  applyCoupon(id: string, params: ApplyCouponParams): Promise<unknown> {
    return this.http.post<unknown>(`/v1/billing/subscriptions/${id}/apply-coupon`, params);
  }

  /** Remove the currently active discount. Future invoices are un-discounted. */
  removeDiscount(id: string): Promise<unknown> {
    return this.http.delete<unknown>(`/v1/billing/subscriptions/${id}/discount`);
  }

  // ── Usage (metered billing) ─────────────────────────────────────────────────

  /**
   * Report a usage event for a metered subscription. Use `action: "increment"`
   * (default) to add to the running total, or `action: "set"` for gauge-style
   * metrics. Pass `idempotencyKey` to prevent double-counting.
   */
  reportUsage(id: string, params: ReportUsageParams): Promise<{ id: string; created: boolean }> {
    return this.http.post<{ id: string; created: boolean }>(`/v1/billing/subscriptions/${id}/usage`, {
      quantity: params.quantity,
      action: params.action,
      recorded_at: params.recordedAt,
      idempotency_key: params.idempotencyKey,
    });
  }

  /** Get the aggregated usage summary for the current billing period. */
  getUsageSummary(id: string): Promise<UsageSummary> {
    return this.http.get<UsageSummary>(`/v1/billing/subscriptions/${id}/usage`);
  }

  /** List raw usage records for a subscription. */
  listUsageRecords(id: string, limit?: number): Promise<UsageRecord[]> {
    const qs = limit ? `?limit=${limit}` : "";
    return this.http.get<UsageRecord[]>(`/v1/billing/subscriptions/${id}/usage/records${qs}`);
  }

  // ── Pending Invoice Items ───────────────────────────────────────────────────

  /** List pending one-off charges that will be included in the next invoice. */
  listInvoiceItems(id: string): Promise<InvoiceItem[]> {
    return this.http.get<InvoiceItem[]>(`/v1/billing/subscriptions/${id}/invoice-items`);
  }

  /**
   * Add a one-off charge to a subscription. It will be included (and consumed)
   * when the next invoice is generated.
   */
  createInvoiceItem(id: string, params: CreateInvoiceItemParams): Promise<InvoiceItem> {
    return this.http.post<InvoiceItem>(`/v1/billing/subscriptions/${id}/invoice-items`, params);
  }

  /** Delete a pending invoice item before it is invoiced. */
  deleteInvoiceItem(subscriptionId: string, itemId: string): Promise<{ deleted: boolean }> {
    return this.http.delete<{ deleted: boolean }>(`/v1/billing/subscriptions/${subscriptionId}/invoice-items/${itemId}`);
  }

  /** Update the per-seat quantity on an active per_unit subscription. */
  updateQuantity(id: string, quantity: number): Promise<Subscription> {
    return this.http.patch<Subscription>(`/v1/billing/subscriptions/${id}/quantity`, { quantity });
  }
}
