import type { HttpClient } from "../http";
import type { Account } from "../types";

/** Account context implied by the calling API key. */
export class AccountResource {
  constructor(private readonly http: HttpClient) {}

  get(): Promise<Account> {
    return this.http.get<Account>("/v1/account");
  }
}
