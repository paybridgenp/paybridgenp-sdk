import { PayBridgeError, createError } from "./errors";
import type { PayBridgeConfig } from "./types";

const DEFAULT_BASE_URL = "https://api.paybridgenp.com";
const DEFAULT_TIMEOUT = 30_000;
const DEFAULT_MAX_RETRIES = 2;
const RETRY_STATUSES = new Set([500, 502, 503, 504]);
const INITIAL_BACKOFF_MS = 500;

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

function backoff(attempt: number): number {
  return INITIAL_BACKOFF_MS * 2 ** (attempt - 1) + Math.random() * 100;
}

export class HttpClient {
  private readonly baseUrl: string;
  private readonly apiKey: string;
  private readonly timeout: number;
  private readonly maxRetries: number;

  constructor(config: PayBridgeConfig) {
    this.baseUrl = (config.baseUrl ?? DEFAULT_BASE_URL).replace(/\/$/, "");
    this.apiKey = config.apiKey;
    this.timeout = config.timeout ?? DEFAULT_TIMEOUT;
    this.maxRetries = config.maxRetries ?? DEFAULT_MAX_RETRIES;
  }

  async request<T>(method: string, path: string, body?: unknown): Promise<T> {
    const url = `${this.baseUrl}${path}`;
    const headers: Record<string, string> = {
      Authorization: `Bearer ${this.apiKey}`,
      "Content-Type": "application/json",
      "User-Agent": "PayBridgeNP-SDK/0.1.0",
    };

    let attempt = 0;

    while (true) {
      attempt++;

      let res: Response;
      try {
        res = await fetch(url, {
          method,
          headers,
          body: body !== undefined ? JSON.stringify(body) : undefined,
          signal: AbortSignal.timeout(this.timeout),
        });
      } catch (err) {
        if (attempt > this.maxRetries) {
          throw new PayBridgeError(
            `Connection error: ${(err as Error).message}`,
            0,
            "connection_error",
          );
        }
        await sleep(backoff(attempt));
        continue;
      }

      if (res.ok) {
        return res.json() as Promise<T>;
      }

      if (RETRY_STATUSES.has(res.status) && attempt <= this.maxRetries) {
        const retryAfter = res.headers.get("Retry-After");
        const delay = retryAfter ? parseInt(retryAfter) * 1000 : backoff(attempt);
        await sleep(delay);
        continue;
      }

      let raw: Record<string, unknown> | null = null;
      try {
        raw = await res.json() as Record<string, unknown>;
      } catch {}

      const message = typeof raw?.error === "string" ? raw.error : `HTTP ${res.status}`;
      throw createError(message, res.status, raw);
    }
  }

  get<T>(path: string) { return this.request<T>("GET", path); }
  post<T>(path: string, body: unknown) { return this.request<T>("POST", path, body); }
  patch<T>(path: string, body: unknown) { return this.request<T>("PATCH", path, body); }
  delete<T>(path: string) { return this.request<T>("DELETE", path); }
}
