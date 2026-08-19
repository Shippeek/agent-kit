# Shippeek CLI

Require Node.js 20 or newer. Install the released CLI with `npm install -g @shippeek/cli`. During repository development, run `npm link --workspace @shippeek/cli` from the Agent Kit root.

Use `--json` for every agent-driven call. Successful output uses `{ "ok": true, "data": ... }`; failures use `{ "ok": false, "error": { "code", "message", "status", "details" }, "next_actions": [...] }` and a non-zero exit code.

## Authentication and discovery

```bash
shippeek auth status --json
shippeek auth login --json
shippeek auth logout --json
shippeek doctor --json
shippeek capabilities --json
```

Until device login is deployed, set `SHIPPEEK_API_TOKEN` in the process environment. Never pass a token as a command argument.

## Read operations

```bash
shippeek rates ltl --file shipment.json --json
shippeek rates parcel --file shipment.json --json
shippeek track PRO_OR_TRACKING_NUMBER --json
shippeek shipments list --page 1 --page-size 20 --json
shippeek shipments get SHIPMENT_ID --json
```

Use `--file -` to read JSON from stdin. Add `--environment sandbox` or `--environment production`; sandbox is the default for rate and write commands.

## State-changing operations

Commands dry-run unless both `--confirm` and a stable `--idempotency-key` are provided:

```bash
shippeek book ltl --file booking.json --idempotency-key ORDER-123 --json
shippeek book ltl --file booking.json --idempotency-key ORDER-123 --confirm --json
shippeek book parcel --file booking.json --idempotency-key ORDER-456 --confirm --json
shippeek book cancel --file cancellation.json --idempotency-key CANCEL-456 --confirm --json
```

Never generate a new idempotency key when retrying an uncertain operation. Retrieve the shipment or reconcile the original key first.
