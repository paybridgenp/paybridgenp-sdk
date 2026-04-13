import type { HttpClient } from "../http";
import type {
  CreatePlanParams,
  UpdatePlanParams,
  ListPlansParams,
  Plan,
  PaginatedBillingResponse,
} from "../types/billing";

export class PlansResource {
  constructor(private readonly http: HttpClient) {}

  create(params: CreatePlanParams): Promise<Plan> {
    return this.http.post<Plan>("/v1/billing/plans", params);
  }

  list(params: ListPlansParams = {}): Promise<PaginatedBillingResponse<Plan>> {
    const qs = new URLSearchParams();
    if (params.page !== undefined) qs.set("page", String(params.page));
    if (params.limit !== undefined) qs.set("limit", String(params.limit));
    if (params.active !== undefined) qs.set("active", String(params.active));
    const query = qs.toString();
    return this.http.get<PaginatedBillingResponse<Plan>>(`/v1/billing/plans${query ? `?${query}` : ""}`);
  }

  get(id: string): Promise<Plan> {
    return this.http.get<Plan>(`/v1/billing/plans/${id}`);
  }

  update(id: string, params: UpdatePlanParams): Promise<Plan> {
    return this.http.patch<Plan>(`/v1/billing/plans/${id}`, params);
  }
}
