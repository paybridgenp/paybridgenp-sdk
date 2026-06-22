import type { HttpClient } from "../http";
import type {
  CreatePaymentLinkParams,
  DeletedPaymentLink,
  ListPaymentLinksParams,
  PaginatedResponse,
  PaymentLink,
  PaymentLinkWithStats,
  UpdatePaymentLinkParams,
} from "../types";

/**
 * Reusable hosted payment pages. Mirrors the public `/v1/payment-links` routes
 * (all require an API key with the `links:read` / `links:write` scope).
 */
export class PaymentLinksResource {
  constructor(private readonly http: HttpClient) {}

  /** Create a payment link. Returns the created link (HTTP 201). */
  create(params: CreatePaymentLinkParams): Promise<PaymentLink> {
    return this.http.post<PaymentLink>("/v1/payment-links", params);
  }

  /** List payment links for the project, newest first. Filter with `active`. */
  list(params: ListPaymentLinksParams = {}): Promise<PaginatedResponse<PaymentLink>> {
    const qs = new URLSearchParams();
    if (params.limit !== undefined) qs.set("limit", String(params.limit));
    if (params.offset !== undefined) qs.set("offset", String(params.offset));
    if (params.active !== undefined) qs.set("active", String(params.active));
    const query = qs.toString();
    return this.http.get<PaginatedResponse<PaymentLink>>(
      `/v1/payment-links${query ? `?${query}` : ""}`,
    );
  }

  /** Retrieve a single link by ID, including aggregated view/conversion stats. */
  retrieve(id: string): Promise<PaymentLinkWithStats> {
    return this.http.get<PaymentLinkWithStats>(`/v1/payment-links/${encodeURIComponent(id)}`);
  }

  /** Update a link's editable fields. Only the keys you pass are changed. */
  update(id: string, params: UpdatePaymentLinkParams): Promise<PaymentLink> {
    return this.http.patch<PaymentLink>(`/v1/payment-links/${encodeURIComponent(id)}`, params);
  }

  /**
   * Cancel (deactivate) a link so it can no longer accept payments, while
   * keeping it and its history for your records. The recommended way to retire
   * a link that has already been used.
   */
  cancel(id: string): Promise<PaymentLink> {
    return this.http.post<PaymentLink>(`/v1/payment-links/${encodeURIComponent(id)}/cancel`, {});
  }

  /**
   * Permanently delete a link. Only allowed when the link has never been used —
   * otherwise the API returns 422 and you should {@link cancel} it instead.
   */
  delete(id: string): Promise<DeletedPaymentLink> {
    return this.http.delete<DeletedPaymentLink>(`/v1/payment-links/${encodeURIComponent(id)}`);
  }
}
