import { HttpClient } from "./http";
import { CheckoutResource } from "./resources/checkout";
import { PaymentsResource } from "./resources/payments";
import { RefundsResource } from "./resources/refunds";
import { WebhooksResource } from "./resources/webhooks";
import { PlansResource } from "./resources/plans";
import { CustomersResource } from "./resources/customers";
import { SubscriptionsResource } from "./resources/subscriptions";
import { InvoicesResource } from "./resources/invoices";
import type { PayBridgeConfig } from "./types";

export class PayBridge {
  private readonly http: HttpClient;

  /** Static webhook utility — no instance required for signature verification. */
  static readonly webhooks = new WebhooksResource();

  private _checkout?: CheckoutResource;
  private _payments?: PaymentsResource;
  private _refunds?: RefundsResource;
  private _webhooks?: WebhooksResource;
  private _plans?: PlansResource;
  private _customers?: CustomersResource;
  private _subscriptions?: SubscriptionsResource;
  private _invoices?: InvoicesResource;

  constructor(config: PayBridgeConfig) {
    this.http = new HttpClient(config);
  }

  get checkout(): CheckoutResource {
    return (this._checkout ??= new CheckoutResource(this.http));
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
}
