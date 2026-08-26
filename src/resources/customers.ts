import type { HttpClient } from "../http";
import type {
  CreateCustomerParams,
  UpdateCustomerParams,
  ListCustomersParams,
  BillingCustomer,
  PaginatedBillingResponse,
} from "../types/billing";

export type AddCreditParams = {
  /** Amount in paisa (NPR × 100). Use negative to deduct. */
  amount: number;
  note?: string | null;
};

export class CustomersResource {
  constructor(private readonly http: HttpClient) {}

  create(params: CreateCustomerParams, idempotencyKey?: string): Promise<BillingCustomer> {
    return this.http.post<BillingCustomer>("/v1/billing/customers", params, idempotencyKey);
  }

  list(params: ListCustomersParams = {}): Promise<PaginatedBillingResponse<BillingCustomer>> {
    const qs = new URLSearchParams();
    if (params.page !== undefined) qs.set("page", String(params.page));
    if (params.limit !== undefined) qs.set("limit", String(params.limit));
    if (params.search !== undefined) qs.set("search", params.search);
    const query = qs.toString();
    return this.http.get<PaginatedBillingResponse<BillingCustomer>>(
      `/v1/billing/customers${query ? `?${query}` : ""}`,
    );
  }

  get(id: string): Promise<BillingCustomer> {
    return this.http.get<BillingCustomer>(`/v1/billing/customers/${id}`);
  }

  update(id: string, params: UpdateCustomerParams, idempotencyKey?: string): Promise<BillingCustomer> {
    return this.http.patch<BillingCustomer>(`/v1/billing/customers/${id}`, params, idempotencyKey);
  }

  delete(id: string, idempotencyKey?: string): Promise<{ deleted: boolean }> {
    return this.http.delete<{ deleted: boolean }>(`/v1/billing/customers/${id}`, idempotencyKey);
  }

  /**
   * Add (or deduct, with negative amount) credits to a customer's balance.
   * Credits are applied automatically against future invoices before payment.
   * @param amount Amount in paisa (NPR × 100).
   */
  addCredit(id: string, params: AddCreditParams, idempotencyKey?: string): Promise<BillingCustomer> {
    return this.http.post<BillingCustomer>(`/v1/billing/customers/${id}/credit`, params, idempotencyKey);
  }
}
