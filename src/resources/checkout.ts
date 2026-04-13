import type { HttpClient } from "../http";
import type { CheckoutSession, CreateCheckoutParams } from "../types";

export class CheckoutResource {
  constructor(private readonly http: HttpClient) {}

  create(params: CreateCheckoutParams): Promise<CheckoutSession> {
    return this.http.post<CheckoutSession>("/v1/checkout", params);
  }
}
