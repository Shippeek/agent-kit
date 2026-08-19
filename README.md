# Shippeek Agent Kit

Give coding agents a safe, deterministic way to build and operate parcel and LTL shipping workflows with Shippeek.

The kit contains:

- a portable Agent Skill in `skills/shippeek`
- a zero-runtime-dependency Node.js CLI in `packages/cli`
- the device-login and capability contracts in `docs`
- sanitized integration guidance and examples

## Status

Private alpha. Read operations are usable with an existing Shippeek API token. Device login requires the corresponding Shippeek app endpoints described in `docs/agent-auth-protocol.md`.

## Local development

```bash
npm install
npm test
npm run check
npm link --workspace @shippeek/cli
shippeek capabilities --json
```

Use `SHIPPEEK_API_TOKEN` for local API calls until device login is deployed. Never commit a token or place one in a command argument.

## Safety model

Rate, tracking, and shipment reads can run directly. Booking and cancellation produce a dry-run plan by default and require both `--confirm` and `--idempotency-key` before sending a request.

## License

Apache-2.0. See `LICENSE`.
