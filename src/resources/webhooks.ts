import type { HttpClient } from "../http";
import type {
  CreateWebhookParams,
  UpdateWebhookParams,
  WebhookDelivery,
  WebhookEndpoint,
  WebhookEvent,
} from "../types";
import { PayBridgeSignatureVerificationError } from "../errors";

export class WebhooksResource {
  constructor(private readonly http?: HttpClient) {}

  create(params: CreateWebhookParams): Promise<WebhookEndpoint & { signing_secret: string }> {
    if (!this.http) throw new Error("WebhooksResource requires an HttpClient");
    return this.http.post<WebhookEndpoint & { signing_secret: string }>("/v1/webhooks", params);
  }

  list(): Promise<{ data: WebhookEndpoint[] }> {
    if (!this.http) throw new Error("WebhooksResource requires an HttpClient");
    return this.http.get<{ data: WebhookEndpoint[] }>("/v1/webhooks");
  }

  update(id: string, params: UpdateWebhookParams): Promise<WebhookEndpoint> {
    if (!this.http) throw new Error("WebhooksResource requires an HttpClient");
    return this.http.patch<WebhookEndpoint>(`/v1/webhooks/${id}`, params);
  }

  delete(id: string): Promise<{ deleted: boolean; id: string }> {
    if (!this.http) throw new Error("WebhooksResource requires an HttpClient");
    return this.http.delete<{ deleted: boolean; id: string }>(`/v1/webhooks/${id}`);
  }

  listDeliveries(id: string): Promise<{ data: WebhookDelivery[] }> {
    if (!this.http) throw new Error("WebhooksResource requires an HttpClient");
    return this.http.get<{ data: WebhookDelivery[] }>(`/v1/webhooks/${id}/deliveries`);
  }

  /**
   * Verify and parse a webhook event from an incoming request.
   *
   * @param body      - Raw request body string (do NOT parse as JSON first)
   * @param signature - Value of the `X-PayBridge-Signature` header
   * @param secret    - Your webhook signing secret (whsec_...)
   */
  async constructEvent<T = unknown>(
    body: string,
    signature: string | null,
    secret: string,
  ): Promise<WebhookEvent<T>> {
    if (!signature) throw new PayBridgeSignatureVerificationError("Missing X-PayBridge-Signature header");

    const parts = Object.fromEntries(
      signature.split(",").map((p) => p.split("=") as [string, string]),
    );

    const timestamp = parts["t"];
    const v1 = parts["v1"];

    if (!timestamp || !v1) {
      throw new PayBridgeSignatureVerificationError("Malformed signature header");
    }

    // Replay attack protection: reject if timestamp is >5 minutes old
    const ts = parseInt(timestamp);
    const now = Math.floor(Date.now() / 1000);
    if (Math.abs(now - ts) > 300) {
      throw new PayBridgeSignatureVerificationError("Timestamp too old — possible replay attack");
    }

    // Compute expected HMAC
    const { createHmac, timingSafeEqual } = await import("crypto");
    const expected = createHmac("sha256", secret)
      .update(`${timestamp}.${body}`)
      .digest("hex");

    const signatureBuffer = Buffer.from(v1, "hex");
    const expectedBuffer = Buffer.from(expected, "hex");

    if (
      signatureBuffer.length !== expectedBuffer.length ||
      !timingSafeEqual(signatureBuffer, expectedBuffer)
    ) {
      throw new PayBridgeSignatureVerificationError();
    }

    return JSON.parse(body) as WebhookEvent<T>;
  }
}
