import type { HttpClient } from "../http";
import type { Refund, CreateRefundParams, ListRefundsParams } from "../types/refunds";
import type { PaginatedResponse } from "../types";

export class RefundsResource {
  constructor(private readonly http: HttpClient) {}

  create(params: CreateRefundParams): Promise<Refund> {
    return this.http.post<Refund>("/v1/refunds", params);
  }

  list(params: ListRefundsParams = {}): Promise<PaginatedResponse<Refund>> {
    const qs = new URLSearchParams();
    if (params.paymentId !== undefined) qs.set("paymentId", params.paymentId);
    if (params.limit !== undefined) qs.set("limit", String(params.limit));
    if (params.offset !== undefined) qs.set("offset", String(params.offset));
    const query = qs.toString();
    return this.http.get<PaginatedResponse<Refund>>(`/v1/refunds${query ? `?${query}` : ""}`);
  }

  retrieve(id: string): Promise<Refund> {
    return this.http.get<Refund>(`/v1/refunds/${id}`);
  }
}
