import type { HttpClient } from "../http";
import type { AnalyticsOverview } from "../types";

/** Aggregated payment and checkout KPIs. */
export class AnalyticsResource {
  constructor(private readonly http: HttpClient) {}

  overview(days?: number): Promise<AnalyticsOverview> {
    const query = days === undefined ? "" : `?days=${encodeURIComponent(String(days))}`;
    return this.http.get<AnalyticsOverview>(`/v1/analytics/overview${query}`);
  }
}
