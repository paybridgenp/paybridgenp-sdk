import type { HttpClient } from "../http";
import type {
  CreatePromotionCodeParams,
  PromotionCode,
  ListPromotionCodesParams,
  ValidatePromotionCodeParams,
  ValidatePromotionCodeResponse,
  PaginatedBillingResponse,
} from "../types/billing";

export class PromotionCodesResource {
  constructor(private readonly http: HttpClient) {}

  /**
   * Create a customer-facing promotion code that redeems a coupon. Code is
   * auto-uppercased server-side and unique per merchant.
   */
  create(params: CreatePromotionCodeParams): Promise<PromotionCode> {
    return this.http.post<PromotionCode>("/v1/billing/promotion-codes", params);
  }

  list(params: ListPromotionCodesParams = {}): Promise<PaginatedBillingResponse<PromotionCode>> {
    const qs = new URLSearchParams();
    if (params.couponId) qs.set("couponId", params.couponId);
    if (params.active !== undefined) qs.set("active", String(params.active));
    if (params.limit !== undefined) qs.set("limit", String(params.limit));
    const query = qs.toString();
    return this.http.get<PaginatedBillingResponse<PromotionCode>>(
      `/v1/billing/promotion-codes${query ? `?${query}` : ""}`,
    );
  }

  get(id: string): Promise<PromotionCode> {
    return this.http.get<PromotionCode>(`/v1/billing/promotion-codes/${id}`);
  }

  /** Deactivate. Existing redemptions remain valid. */
  deactivate(id: string): Promise<PromotionCode> {
    return this.http.patch<PromotionCode>(`/v1/billing/promotion-codes/${id}`, { active: false });
  }

  /**
   * Read-only validation with discount preview. Safe to poll. Does NOT
   * redeem the code.
   */
  validate(params: ValidatePromotionCodeParams): Promise<ValidatePromotionCodeResponse> {
    return this.http.post<ValidatePromotionCodeResponse>(
      "/v1/billing/promotion-codes/validate",
      params,
    );
  }
}
