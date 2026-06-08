import type { HttpClient } from "../http";
import type { TaxSettings, UpdateTaxSettingsParams } from "../types/billing";

/** Account-level tax configuration applied to invoices. */
export class TaxResource {
  constructor(private readonly http: HttpClient) {}

  /** Get the current tax settings. */
  getSettings(): Promise<TaxSettings> {
    return this.http.get<TaxSettings>("/v1/billing/settings/tax");
  }

  /** Update tax settings (enabled, rate, registration number, label). */
  updateSettings(params: UpdateTaxSettingsParams): Promise<TaxSettings> {
    return this.http.patch<TaxSettings>("/v1/billing/settings/tax", params);
  }
}
