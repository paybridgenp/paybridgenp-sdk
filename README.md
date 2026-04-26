# @paybridge-np/sdk

Official TypeScript SDK for the [PayBridgeNP](https://paybridgenp.com) payment gateway. Accept eSewa, Khalti, ConnectIPS, and Fonepay through a single API.

## Installation

```bash
npm install @paybridge-np/sdk
# or
bun add @paybridge-np/sdk
```

## Quick start

```typescript
import { PayBridge } from "@paybridge-np/sdk";

const client = new PayBridge({
  apiKey: "sk_live_...", // from dashboard.paybridgenp.com
});

// Create a checkout session
const session = await client.checkout.create({
  amount: 250000, // NPR 2,500 in paisa
  currency: "NPR",
  returnUrl: "https://mystore.com/success",
  cancelUrl: "https://mystore.com/cart",
  metadata: { orderId: "ORD-7842" },
  customer: {
    name: "Ram Shrestha",
    email: "ram@example.com",
    phone: "9841000000",
  },
});

// Redirect customer to hosted checkout
// session.checkout_url => https://paybridgenp.com/checkout/cs_xxx
```

## Payments

```typescript
// List payments
const { data, meta } = await client.payments.list({ limit: 20 });

// Get a single payment
const payment = await client.payments.get("pay_xxx");
```

## Webhooks

```typescript
// Register an endpoint
const endpoint = await client.webhooks.register({
  url: "https://mystore.com/webhooks/paybridge",
  events: ["payment.succeeded", "payment.failed"],
});

// Verify a webhook signature
const event = client.webhooks.verify(rawBody, signatureHeader, endpointSecret);
```

## Sandbox mode

Use a sandbox API key (`sk_sandbox_...`) to test without real money. The SDK automatically routes to sandbox endpoints.

## Error handling

```typescript
import { PayBridgeError, AuthenticationError } from "@paybridge-np/sdk";

try {
  await client.checkout.create({ ... });
} catch (err) {
  if (err instanceof AuthenticationError) {
    // Invalid API key
  } else if (err instanceof PayBridgeError) {
    console.error(err.message, err.statusCode);
  }
}
```

## Documentation

- [API Reference](https://paybridgenp.mintlify.app)
- [Dashboard](https://dashboard.paybridgenp.com)
- [Guides](https://paybridgenp.mintlify.app/guides/sandbox-testing)

## License

MIT
