import { HttpClient } from "./http";
import { CheckoutResource } from "./resources/checkout";
import { PaymentLinksResource } from "./resources/paymentLinks";
import { PaymentsResource } from "./resources/payments";
import { RefundsResource } from "./resources/refunds";
import { WebhooksResource } from "./resources/webhooks";
import { PlansResource } from "./resources/plans";
import { CustomersResource } from "./resources/customers";
import { SubscriptionsResource } from "./resources/subscriptions";
import { InvoicesResource } from "./resources/invoices";
import { CouponsResource } from "./resources/coupons";
import { PromotionCodesResource } from "./resources/promotionCodes";
import { DunningResource } from "./resources/dunning";
import { TaxResource } from "./resources/tax";
import { QrResource } from "./resources/qr";
import { AccountResource } from "./resources/account";
import { AnalyticsResource } from "./resources/analytics";
import { ProvidersResource } from "./resources/providers";
import { SmsResource } from "./resources/sms";
import type { PayBridgeConfig } from "./types";

export class PayBridgeNP {
  private readonly http: HttpClient;

  /** Static webhook utility — no instance required for signature verification. */
  static readonly webhooks = new WebhooksResource();

  private _checkout?: CheckoutResource;
  private _paymentLinks?: PaymentLinksResource;
  private _payments?: PaymentsResource;
  private _refunds?: RefundsResource;
  private _webhooks?: WebhooksResource;
  private _plans?: PlansResource;
  private _customers?: CustomersResource;
  private _subscriptions?: SubscriptionsResource;
  private _invoices?: InvoicesResource;
  private _coupons?: CouponsResource;
  private _promotionCodes?: PromotionCodesResource;
  private _dunning?: DunningResource;
  private _tax?: TaxResource;
  private _qr?: QrResource;
  private _account?: AccountResource;
  private _analytics?: AnalyticsResource;
  private _providers?: ProvidersResource;
  private _sms?: SmsResource;

  constructor(config: PayBridgeConfig) {
    this.http = new HttpClient(config);
  }

  get checkout(): CheckoutResource {
    return (this._checkout ??= new CheckoutResource(this.http));
  }

  /** Reusable hosted payment pages — create / list / retrieve / update / cancel / delete. */
  get paymentLinks(): PaymentLinksResource {
    return (this._paymentLinks ??= new PaymentLinksResource(this.http));
  }

  get payments(): PaymentsResource {
    return (this._payments ??= new PaymentsResource(this.http));
  }

  get refunds(): RefundsResource {
    return (this._refunds ??= new RefundsResource(this.http));
  }

  get webhooks(): WebhooksResource {
    return (this._webhooks ??= new WebhooksResource(this.http));
  }

  get plans(): PlansResource {
    return (this._plans ??= new PlansResource(this.http));
  }

  get customers(): CustomersResource {
    return (this._customers ??= new CustomersResource(this.http));
  }

  get subscriptions(): SubscriptionsResource {
    return (this._subscriptions ??= new SubscriptionsResource(this.http));
  }

  get invoices(): InvoicesResource {
    return (this._invoices ??= new InvoicesResource(this.http));
  }

  get coupons(): CouponsResource {
    return (this._coupons ??= new CouponsResource(this.http));
  }

  get promotionCodes(): PromotionCodesResource {
    return (this._promotionCodes ??= new PromotionCodesResource(this.http));
  }

  get dunning(): DunningResource {
    return (this._dunning ??= new DunningResource(this.http));
  }

  /** Account-level tax settings applied to invoices. */
  get tax(): TaxResource {
    return (this._tax ??= new TaxResource(this.http));
  }

  /**
   * Direct-QR API for Fonepay. Premium feature — generates an embeddable QR
   * + SSE event stream so developers can build their own checkout UI.
   */
  get qr(): QrResource {
    return (this._qr ??= new QrResource(this.http));
  }

  /** Account context implied by the calling API key. */
  get account(): AccountResource { return (this._account ??= new AccountResource(this.http)); }

  /** Aggregated payment and checkout KPIs. */
  get analytics(): AnalyticsResource { return (this._analytics ??= new AnalyticsResource(this.http)); }

  /** Providers enabled and configured for this project. */
  get providers(): ProvidersResource { return (this._providers ??= new ProvidersResource(this.http)); }

  /** Transactional SMS operations. */
  get sms(): SmsResource { return (this._sms ??= new SmsResource(this.http)); }
}
