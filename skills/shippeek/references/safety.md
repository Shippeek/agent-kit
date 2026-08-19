# Operational safety

Treat booking, cancellation, pickup scheduling, label purchase, and carrier-credential changes as consequential operations.

Before execution:

1. Identify the Shippeek organization and sandbox or production environment.
2. Show the normalized operation, carrier/service, monetary amount when known, and idempotency key.
3. Resolve substantive address corrections, stale prices, source changes, missing insurance, and uncertain prior attempts.
4. Obtain explicit user approval.
5. Execute once with `--confirm` and the reviewed idempotency key.
6. Save the returned identifiers and verify the resulting shipment state.

Never retry a timeout or unknown booking outcome with a new idempotency key. Never log credentials or full customer shipment data. Redact addresses, contacts, document URLs, and provider payloads from reports unless the user specifically needs them.
