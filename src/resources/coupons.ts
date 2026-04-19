import type { HttpClient } from "../http";
import type {
  CreateCouponParams,
  Coupon,
  ListCouponsParams,
  PaginatedBillingResponse,
} from "../types/billing";

export class CouponsResource {
  constructor(private readonly http: HttpClient) {}

  /**
   * Create a reusable coupon. Discount params are immutable post-creation —
   * replace by deactivating and creating a new one.
   */
  create(params: CreateCouponParams): Promise<Coupon> {
    return this.http.post<Coupon>("/v1/billing/coupons", params);
  }

  list(params: ListCouponsParams = {}): Promise<PaginatedBillingResponse<Coupon>> {
    const qs = new URLSearchParams();
    if (params.active !== undefined) qs.set("active", String(params.active));
    if (params.limit !== undefined) qs.set("limit", String(params.limit));
    const query = qs.toString();
    return this.http.get<PaginatedBillingResponse<Coupon>>(
      `/v1/billing/coupons${query ? `?${query}` : ""}`,
    );
  }

  get(id: string): Promise<Coupon> {
    return this.http.get<Coupon>(`/v1/billing/coupons/${id}`);
  }

  /** Deactivate. Soft-delete — historical redemptions remain intact. */
  deactivate(id: string): Promise<Coupon> {
    return this.http.delete<Coupon>(`/v1/billing/coupons/${id}`);
  }
}
