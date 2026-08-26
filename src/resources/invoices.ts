import type { HttpClient } from "../http";
import type {
  ListInvoicesParams,
  Invoice,
  PaginatedBillingResponse,
} from "../types/billing";
import type { FonepayQrSession } from "../types/qr";

export class InvoicesResource {
  constructor(private readonly http: HttpClient) {}

  list(params: ListInvoicesParams = {}): Promise<PaginatedBillingResponse<Invoice>> {
    const qs = new URLSearchParams();
    if (params.page !== undefined) qs.set("page", String(params.page));
    if (params.limit !== undefined) qs.set("limit", String(params.limit));
    if (params.status !== undefined) qs.set("status", params.status);
    if (params.customerId !== undefined) qs.set("customerId", params.customerId);
    if (params.subscriptionId !== undefined) qs.set("subscriptionId", params.subscriptionId);
    if (params.search !== undefined) qs.set("search", params.search);
    const query = qs.toString();
    return this.http.get<PaginatedBillingResponse<Invoice>>(
      `/v1/billing/invoices${query ? `?${query}` : ""}`,
    );
  }

  get(id: string): Promise<Invoice> {
    return this.http.get<Invoice>(`/v1/billing/invoices/${id}`);
  }

  /**
   * Mint a Fonepay Direct-QR to pay this invoice. The customer scans it (in your
   * own UI / at a counter) and on success the invoice is marked paid and the
   * subscription activates (`incomplete`→`active`) — the same outcome as the
   * hosted bill page, just collected via an embedded QR. Returns a normal
   * Direct-QR session (use its `events_url` SSE stream + `qr.refresh(id)`).
   *
   * Premium feature; requires the `billing:write` scope and Fonepay configured.
   */
  qr(id: string, idempotencyKey?: string): Promise<FonepayQrSession> {
    return this.http.post<FonepayQrSession>(`/v1/billing/invoices/${encodeURIComponent(id)}/qr`, {}, idempotencyKey);
  }
}
