import type { HttpClient } from "../http";
import type {
  CheckoutSession,
  CreateCheckoutParams,
  ExpiredCheckoutSession,
  ListSessionsParams,
  PaginatedResponse,
  RetrievedCheckoutSession,
} from "../types";

export class CheckoutResource {
  constructor(private readonly http: HttpClient) {}

  create(params: CreateCheckoutParams): Promise<CheckoutSession> {
    return this.http.post<CheckoutSession>("/v1/checkout", params);
  }

  /**
   * Retrieve a checkout session by ID, including its current status, amount,
   * customer, and any collected address. Read-only — sessions are created via
   * {@link create}. Hits `GET /v1/sessions/{id}`.
   *
   * Note: this richer read shape uses camelCase keys (`customerName`,
   * `expiresAt`, …), unlike the snake_case create response.
   */
  retrieve(id: string): Promise<RetrievedCheckoutSession> {
    return this.http.get<RetrievedCheckoutSession>(`/v1/sessions/${encodeURIComponent(id)}`);
  }

  /**
   * List checkout sessions for the authenticated project, newest first.
   * Optionally filter by `status` and page with `limit`/`offset`. Hits
   * `GET /v1/sessions`.
   */
  list(params: ListSessionsParams = {}): Promise<PaginatedResponse<RetrievedCheckoutSession>> {
    const qs = new URLSearchParams();
    if (params.limit !== undefined) qs.set("limit", String(params.limit));
    if (params.offset !== undefined) qs.set("offset", String(params.offset));
    if (params.status !== undefined) qs.set("status", params.status);
    const query = qs.toString();
    return this.http.get<PaginatedResponse<RetrievedCheckoutSession>>(
      `/v1/sessions${query ? `?${query}` : ""}`,
    );
  }

  /**
   * Expire a checkout session so it can no longer accept payment.
   *
   * Use this when you mint a fresh checkout session for a logical purchase
   * that already had one outstanding (a customer requesting a new payment
   * link, your reminder system regenerating expired URLs, etc.). Without
   * explicitly expiring the old session, its URL remains payable until the
   * 30-minute TTL elapses, which can let a customer who reloads the old tab
   * pay twice. Mirrors Stripe's `POST /checkout/sessions/{id}/expire`.
   *
   * Idempotent: calling on an already-terminal session is a no-op that
   * returns the current row state without error.
   */
  expire(id: string): Promise<ExpiredCheckoutSession> {
    return this.http.post<ExpiredCheckoutSession>(
      `/v1/checkout/${encodeURIComponent(id)}/expire`,
      {},
    );
  }
}
