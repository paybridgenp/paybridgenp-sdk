import type { HttpClient } from "../http";
import type { NotifyPendingPaymentParams, SmsNotifyResult } from "../types";

/** Transactional SMS operations. */
export class SmsResource {
  constructor(private readonly http: HttpClient) {}

  /**
   * Send a pending-payment reminder. The optional key is sent for SDK API
   * consistency, but the server does not currently deduplicate this route.
   */
  notifyPendingPayment(params: NotifyPendingPaymentParams, idempotencyKey?: string): Promise<SmsNotifyResult> {
    return this.http.post<SmsNotifyResult>("/v1/sms/notify-pending-payment", params, idempotencyKey);
  }
}
