# @paybridge-np/sdk

Official TypeScript SDK for the [PayBridgeNP](https://paybridgenp.com) payment gateway. Accept eSewa, Khalti, and Fonepay through a single API.

## Installation

```bash
npm install @paybridge-np/sdk
# or
bun add @paybridge-np/sdk
```

## Quick start

```typescript
import { PayBridgeNP } from "@paybridge-np/sdk";

const paybridgenp = new PayBridgeNP({
  apiKey: "sk_live_...", // from dashboard.paybridgenp.com
});

// Create a checkout session
const session = await paybridgenp.checkout.create({
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
// session.checkout_url => https://checkout.paybridgenp.com/checkout/cs_xxx

// Expire a previously-created session so its URL stops being payable
// (use when you mint a fresh session for the same purchase).
await paybridgenp.checkout.expire("cs_xxx");

// Retrieve or list checkout sessions (read-only)
const session = await paybridgenp.checkout.retrieve("cs_xxx");
const sessions = await paybridgenp.checkout.list({ limit: 20, status: "success" });
```

## Payments

```typescript
// List payments
const { data, meta } = await paybridgenp.payments.list({ limit: 20 });

// Get a single payment
const payment = await paybridgenp.payments.retrieve("pay_xxx");
```

## Payment links

```typescript
// Create a reusable hosted payment page
const link = await paybridgenp.paymentLinks.create({ title: "Donation", amount: 50000 });

// List, retrieve (with view/conversion stats), update, cancel, or delete
const { data } = await paybridgenp.paymentLinks.list({ active: true });
const detail = await paybridgenp.paymentLinks.retrieve(link.id); // detail.stats
await paybridgenp.paymentLinks.update(link.id, { active: false });
await paybridgenp.paymentLinks.cancel(link.id); // deactivate, keep for records
await paybridgenp.paymentLinks.delete(link.id); // only if never used
```

## Webhooks

```typescript
// Register an endpoint
const endpoint = await paybridgenp.webhooks.register({
  url: "https://mystore.com/webhooks/paybridgenp",
  events: ["payment.succeeded", "payment.failed"],
});

// Verify a webhook signature
const event = paybridgenp.webhooks.verify(rawBody, signatureHeader, endpointSecret);
```

## Sandbox mode

Use a sandbox API key (`sk_sandbox_...`) to test without real money. The SDK automatically routes to sandbox endpoints.

## Error handling

```typescript
import { PayBridgeError, AuthenticationError } from "@paybridge-np/sdk";

try {
  await paybridgenp.checkout.create({ ... });
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
