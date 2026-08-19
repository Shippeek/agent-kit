---
name: shippeek
description: Build, test, and operate parcel and LTL shipping workflows with Shippeek. Use when an agent needs to add shipping rates, checkout options, carrier-backed booking, cancellation, shipment retrieval, tracking, or a custom WordPress, ecommerce, ERP, WMS, TMS, or internal application integration using the Shippeek CLI or API. Do not use for unrelated generic application work.
---

# Shippeek

Use the Shippeek CLI as the deterministic execution surface. Use the web app only for human authentication, consent, carrier credentials, billing, and other pages returned by the CLI.

## Workflow

1. Inspect the user's application, shipping requirement, existing data model, and deployment constraints. Preserve its conventions.
2. Run `shippeek auth status --json`. If authentication is absent, run `shippeek auth login --json`, show the returned verification URL and code, and wait for the user to approve it. Never ask the user to paste a password or secret into chat.
3. Run `shippeek capabilities --json`. Do not invent unsupported commands, carriers, fields, services, or accessorials.
4. Read [CLI commands](references/cli.md) for command syntax. Read [shipping concepts](references/shipping.md) before mapping request data. Read [integration patterns](references/integration-patterns.md) when changing application code.
5. Develop against sandbox unless the user explicitly requires production. Keep tokens in the CLI credential store or `SHIPPEEK_API_TOKEN`; never commit or print them.
6. Perform a representative rate, tracking, or shipment-read verification. Treat an empty result as a result to investigate, not success.
7. For booking or cancellation, first run the command without `--confirm`, review the dry-run plan with the user, then reuse a stable idempotency key with `--confirm` only after explicit approval.
8. Report code changes, Shippeek operations performed, environment, identifiers safe to share, verification evidence, and any remaining human action.

## Decision rules

- Use `rates ltl` for palletized or freight-class shipments and `rates parcel` for package shipments.
- Save returned quote and rate identifiers; book the selected rate through the same source that produced it.
- Re-rate stale quotes before booking. Require the user to accept material price, source, service, insurance, or address changes.
- Prefer supported API and CLI operations over browser automation.
- Do not silently substitute a carrier, service, address, accessorial, source, or shipment mode.
- Stop on authorization failures, trial or usage limits, ambiguous spend, unavailable requested insurance, or substantive address corrections. Return the CLI's `next_actions` to the user.

## References

- Read [CLI commands](references/cli.md) for setup, flags, output envelopes, and examples.
- Read [shipping concepts](references/shipping.md) for modes, identifiers, and operational safeguards.
- Read [integration patterns](references/integration-patterns.md) for checkout, WordPress, ERP/WMS, and tracking implementations.
- Read [safety](references/safety.md) before any state-changing or production operation.
