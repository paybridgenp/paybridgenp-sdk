import type { HttpClient } from "../http";
import type {
  CheckoutSession,
  CreateCheckoutParams,
  ExpiredCheckoutSession,
} from "../types";

export class CheckoutResource {
  constructor(private readonly http: HttpClient) {}

  create(params: CreateCheckoutParams): Promise<CheckoutSession> {
    return this.http.post<CheckoutSession>("/v1/checkout", params);
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
