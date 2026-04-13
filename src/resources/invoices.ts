import type { HttpClient } from "../http";
import type {
  ListInvoicesParams,
  Invoice,
  PaginatedBillingResponse,
} from "../types/billing";

export class InvoicesResource {
  constructor(private readonly http: HttpClient) {}

  list(params: ListInvoicesParams = {}): Promise<PaginatedBillingResponse<Invoice>> {
    const qs = new URLSearchParams();
    if (params.page !== undefined) qs.set("page", String(params.page));
    if (params.limit !== undefined) qs.set("limit", String(params.limit));
    if (params.status !== undefined) qs.set("status", params.status);
    if (params.customerId !== undefined) qs.set("customerId", params.customerId);
    if (params.subscriptionId !== undefined) qs.set("subscriptionId", params.subscriptionId);
    if (params.search !== undefined) qs.set("search", params.search);
    const query = qs.toString();
    return this.http.get<PaginatedBillingResponse<Invoice>>(
      `/v1/billing/invoices${query ? `?${query}` : ""}`,
    );
  }

  get(id: string): Promise<Invoice> {
    return this.http.get<Invoice>(`/v1/billing/invoices/${id}`);
  }
}
