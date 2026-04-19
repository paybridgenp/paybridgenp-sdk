import type { HttpClient } from "../http";
import type {
  CreateDunningPolicyParams,
  DunningAttempt,
  DunningFinalAction,
  DunningInvoiceStatus,
  DunningPolicy,
  UpdateDunningPolicyParams,
} from "../types/billing";

export class DunningResource {
  constructor(private readonly http: HttpClient) {}

  // ── Policies ───────────────────────────────────────────────────────────────

  createPolicy(params: CreateDunningPolicyParams): Promise<DunningPolicy> {
    return this.http.post<DunningPolicy>("/v1/billing/dunning/policies", params);
  }

  listPolicies(): Promise<{ data: DunningPolicy[] }> {
    return this.http.get<{ data: DunningPolicy[] }>("/v1/billing/dunning/policies");
  }

  getPolicy(id: string): Promise<DunningPolicy> {
    return this.http.get<DunningPolicy>(`/v1/billing/dunning/policies/${id}`);
  }

  updatePolicy(id: string, params: UpdateDunningPolicyParams): Promise<DunningPolicy> {
    return this.http.patch<DunningPolicy>(`/v1/billing/dunning/policies/${id}`, params);
  }

  // ── Subscription policy assignment ────────────────────────────────────────

  setSubscriptionPolicy(subscriptionId: string, policyId: string | null): Promise<{ ok: boolean }> {
    return this.http.post<{ ok: boolean }>(
      `/v1/billing/dunning/subscriptions/${subscriptionId}/policy`,
      { policyId },
    );
  }

  // ── Invoice dunning actions ────────────────────────────────────────────────

  getInvoiceStatus(invoiceId: string): Promise<DunningInvoiceStatus> {
    return this.http.get<DunningInvoiceStatus>(
      `/v1/billing/dunning/invoices/${invoiceId}/dunning`,
    );
  }

  stopInvoice(invoiceId: string): Promise<{ ok: boolean }> {
    return this.http.post<{ ok: boolean }>(
      `/v1/billing/dunning/invoices/${invoiceId}/dunning/stop`,
      {},
    );
  }

  retryInvoiceNow(invoiceId: string): Promise<{ ok: boolean }> {
    return this.http.post<{ ok: boolean }>(
      `/v1/billing/dunning/invoices/${invoiceId}/dunning/retry-now`,
      {},
    );
  }
}
