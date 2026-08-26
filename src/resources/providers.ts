import type { HttpClient } from "../http";
import type { ProviderList } from "../types";

/** Providers enabled and configured for the authenticated project. */
export class ProvidersResource {
  constructor(private readonly http: HttpClient) {}

  list(): Promise<ProviderList> {
    return this.http.get<ProviderList>("/v1/providers");
  }
}
