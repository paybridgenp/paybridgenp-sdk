import type { HttpClient } from "../http";
import type { Payment, ListPaymentsParams, PaginatedResponse } from "../types";

export class PaymentsResource {
  constructor(private readonly http: HttpClient) {}

  list(params: ListPaymentsParams = {}): Promise<PaginatedResponse<Payment>> {
    const qs = new URLSearchParams();
    if (params.limit !== undefined) qs.set("limit", String(params.limit));
    if (params.offset !== undefined) qs.set("offset", String(params.offset));
    const query = qs.toString();
    return this.http.get<PaginatedResponse<Payment>>(`/v1/payments${query ? `?${query}` : ""}`);
  }

  retrieve(id: string): Promise<Payment> {
    return this.http.get<Payment>(`/v1/payments/${id}`);
  }
}
