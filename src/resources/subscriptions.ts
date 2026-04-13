import type { HttpClient } from "../http";
import type {
  CreateSubscriptionParams,
  ListSubscriptionsParams,
  PauseSubscriptionParams,
  CancelSubscriptionParams,
  ChangePlanParams,
  Subscription,
  PaginatedBillingResponse,
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

  changePlan(id: string, params: ChangePlanParams): Promise<Subscription> {
    return this.http.post<Subscription>(`/v1/billing/subscriptions/${id}/change-plan`, params);
  }
}
