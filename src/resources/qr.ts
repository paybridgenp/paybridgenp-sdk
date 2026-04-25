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
  fonepay(params: CreateFonepayQrParams): Promise<FonepayQrSession> {
    return this.http.post<FonepayQrSession>("/v1/qr/fonepay", params);
  }
}
