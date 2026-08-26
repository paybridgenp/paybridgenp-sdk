import type { HttpClient } from "../http";
import type { CreateFonepayQrParams, FonepayQrSession } from "../types/qr";

export class QrResource {
  constructor(private readonly http: HttpClient) {}

  /**
   * Create a Fonepay Direct-QR session. Returns the raw QR string, a base64
   * PNG image, and a per-session SSE URL for real-time payment events.
   *
   * Premium feature — requires the merchant to be on the Premium plan.
   */
  fonepay(params: CreateFonepayQrParams, idempotencyKey?: string): Promise<FonepayQrSession> {
    return this.http.post<FonepayQrSession>("/v1/qr/fonepay", params, idempotencyKey);
  }

  /**
   * Refresh a Direct-QR session: regenerate a fresh Fonepay QR for the SAME
   * session (same `id`, `events_url`, and webhook) without spawning a new
   * session. The Fonepay QR display window is only ~3 minutes, so call this
   * when `qr.expired` fires (or proactively) to keep a scannable QR on screen.
   * Takes no body — the amount and customer already live on the session. The
   * session's overall lifetime is unchanged.
   *
   * Premium feature — requires the merchant to be on the Premium plan.
   */
  refresh(id: string, idempotencyKey?: string): Promise<FonepayQrSession> {
    return this.http.post<FonepayQrSession>(`/v1/qr/${encodeURIComponent(id)}/refresh`, {}, idempotencyKey);
  }
}
