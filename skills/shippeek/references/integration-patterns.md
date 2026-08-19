# Integration patterns

## Ecommerce and checkout

Keep live rating server-side so Shippeek credentials never reach the browser. Normalize the cart into parcel packages or LTL handling units, call Shippeek within a bounded timeout, and persist the selected quote, rate, carrier, service, source, amount, and timestamp on the order. Re-rate before fulfillment when the quote is stale.

## WordPress and WooCommerce

Implement rating in a shipping-method plugin. Store credentials through the platform's protected settings mechanism, validate a nonce on admin actions, escape shopper-visible output, and keep diagnostic details in merchant-only surfaces. Do not purchase a label automatically during checkout unless the merchant explicitly enables and understands that workflow.

## ERP, WMS, and internal applications

Create a narrow server-side adapter around the CLI or API. Map the application's order and warehouse records into a versioned Shippeek request model. Persist external identifiers and idempotency keys before booking so retries cannot purchase twice.

## Tracking automations

Prefer signed Shippeek webhooks for event-driven updates when available. Verify signatures, reject replays, process idempotently, and retain only the event data required by the application. Use direct tracking for user-requested refreshes and reconciliation.
