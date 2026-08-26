import { describe, expect, it } from "bun:test";
import { PayBridgeNP } from "./client";
import { HttpClient } from "./http";

function client() {
  return new HttpClient({ apiKey: "sk_test", baseUrl: "https://api.example.test", maxRetries: 1 });
}

describe("HttpClient retry and idempotency behavior", () => {
  it("does not retry a POST after a 500", async () => {
    // Catches write retries after a 5xx response, which can duplicate a mutation.
    let attempts = 0;
    const originalFetch = globalThis.fetch;
    globalThis.fetch = (async () => {
      attempts++;
      return new Response(JSON.stringify({ error: "server error" }), { status: 500 });
    }) as unknown as typeof fetch;

    try {
      await expect(client().post("/v1/checkout", {})).rejects.toThrow();
      expect(attempts).toBe(1);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it("does not retry a POST after a connection error", async () => {
    // Catches write retries after a timeout or connection failure.
    let attempts = 0;
    const originalFetch = globalThis.fetch;
    globalThis.fetch = (async () => {
      attempts++;
      throw new Error("connection dropped");
    }) as unknown as typeof fetch;

    try {
      await expect(client().post("/v1/checkout", {})).rejects.toThrow("Connection error");
      expect(attempts).toBe(1);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it("retries a GET after a 500", async () => {
    // Catches an over-broad retry removal that would make safe GETs fail too early.
    let attempts = 0;
    const originalFetch = globalThis.fetch;
    globalThis.fetch = (async () => {
      attempts++;
      return attempts === 1
        ? new Response(JSON.stringify({ error: "server error" }), { status: 500 })
        : new Response(JSON.stringify({ ok: true }), { status: 200 });
    }) as unknown as typeof fetch;

    try {
      await expect(client().get<{ ok: boolean }>("/v1/payments")).resolves.toEqual({ ok: true });
      expect(attempts).toBe(2);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it("adds an idempotency key to a non-GET request", async () => {
    // Catches unsafe requests leaving the SDK without an idempotency key.
    let receivedHeaders: Headers | undefined;
    const originalFetch = globalThis.fetch;
    globalThis.fetch = (async (_url, init) => {
      receivedHeaders = new Headers(init?.headers);
      return new Response("{}", { status: 200 });
    }) as typeof fetch;

    try {
      await client().post("/v1/checkout", {});
      expect(receivedHeaders?.get("Idempotency-Key")).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it("uses a caller-supplied key verbatim across a caller retry", async () => {
    // Catches regenerating a caller's key, which makes a manual retry unsafe.
    const keys: string[] = [];
    const originalFetch = globalThis.fetch;
    globalThis.fetch = (async (_url, init) => {
      keys.push(new Headers(init?.headers).get("Idempotency-Key") ?? "");
      return new Response("{}", { status: 200 });
    }) as typeof fetch;

    try {
      await client().post("/v1/checkout", {}, "checkout-order-123");
      await client().post("/v1/checkout", {}, "checkout-order-123");
      expect(keys).toEqual(["checkout-order-123", "checkout-order-123"]);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it("sends a resource caller key on the wire", async () => {
    // Catches resource methods accepting a key but dropping it before HttpClient.
    let receivedHeaders: Headers | undefined;
    const originalFetch = globalThis.fetch;
    globalThis.fetch = (async (_url, init) => {
      receivedHeaders = new Headers(init?.headers);
      return new Response("{}", { status: 200 });
    }) as typeof fetch;

    try {
      const pb = new PayBridgeNP({ apiKey: "sk_test", baseUrl: "https://api.example.test" });
      await pb.refunds.create({ paymentId: "pay_123", amount: 100, reason: "customer_request" }, "refund-123");
      expect(receivedHeaders?.get("Idempotency-Key")).toBe("refund-123");
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it("maps the account, analytics, providers, and SMS resources to their public API routes", async () => {
    // Catches SDK surface drift: wrong route, omitted analytics days query, SMS
    // request casing, or an accepted caller idempotency key not reaching HTTP.
    const requests: Array<{ url: string; method: string; body: unknown; key: string | null }> = [];
    const originalFetch = globalThis.fetch;
    globalThis.fetch = (async (url, init) => {
      requests.push({
        url: String(url), method: init?.method ?? "GET", body: init?.body ? JSON.parse(String(init.body)) : undefined,
        key: new Headers(init?.headers).get("Idempotency-Key"),
      });
      return new Response(JSON.stringify({}), { status: 200 });
    }) as typeof fetch;

    try {
      const pb = new PayBridgeNP({ apiKey: "sk_test", baseUrl: "https://api.example.test" });
      await pb.account.get();
      await pb.analytics.overview(7);
      await pb.providers.list();
      await pb.sms.notifyPendingPayment({
        customerPhone: "9801234567", shopName: "Acme", orderName: "#1042",
        amountMinor: 10000, currency: "NPR", checkoutUrl: "https://checkout.example.test/cs_123",
      }, "sms-reminder-123");
      expect(requests).toEqual([
        { url: "https://api.example.test/v1/account", method: "GET", body: undefined, key: null },
        { url: "https://api.example.test/v1/analytics/overview?days=7", method: "GET", body: undefined, key: null },
        { url: "https://api.example.test/v1/providers", method: "GET", body: undefined, key: null },
        {
          url: "https://api.example.test/v1/sms/notify-pending-payment", method: "POST",
          body: { customerPhone: "9801234567", shopName: "Acme", orderName: "#1042", amountMinor: 10000, currency: "NPR", checkoutUrl: "https://checkout.example.test/cs_123" },
          key: "sms-reminder-123",
        },
      ]);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });
});
