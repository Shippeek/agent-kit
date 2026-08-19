# Shippeek Agent Kit

Give coding agents a safe, deterministic way to build and operate parcel and LTL shipping workflows with Shippeek.

The kit contains:

- a portable Agent Skill in `skills/shippeek`
- a zero-runtime-dependency Node.js CLI in `packages/cli`
- the device-login and capability contracts in `docs`
- sanitized integration guidance and examples

## Status

Public alpha. Read operations work with an existing Shippeek API token. Booking and cancellation are available behind confirmation and idempotency safeguards.

The browser-based device login is specified but not deployed yet. Until the required Shippeek app endpoints are available, authenticate with the `SHIPPEEK_API_TOKEN` environment variable. See [the authentication protocol](docs/agent-auth-protocol.md) for the planned connection flow.

## Install

Requires Node.js 20 or newer.

```bash
git clone https://github.com/Shippeek/agent-kit.git
cd agent-kit
npm install
npm test
npm link --workspace @shippeek/cli
shippeek capabilities --json
```

Copy `skills/shippeek` into your coding agent's skills directory, or ask your agent to install the skill directly from this repository. The skill tells the agent when to use the CLI, how to gather missing shipping information, and which operations require confirmation.

## Connect

Set your token in the environment, then verify the connection:

```bash
export SHIPPEEK_API_TOKEN="your-token"
shippeek doctor --json
```

Never commit a token or place one in a command argument.

## Prompt your agent

Once the skill and CLI are available, you can prompt your agent normally:

- “Use Shippeek to add live LTL rates to this checkout.”
- “Compare LTL rates for the shipment in `order.json` and return structured JSON.”
- “Track this PRO number and explain any exceptions.”
- “Prepare an LTL booking, but do not submit it until I confirm.”

Start with [`skills/shippeek/SKILL.md`](skills/shippeek/SKILL.md). The [CLI reference](skills/shippeek/references/cli.md) lists every supported command and flag.

## Development

```bash
npm test
npm run check
```

## Safety model

Rate, tracking, and shipment reads can run directly. Booking and cancellation produce a dry-run plan by default and require both `--confirm` and `--idempotency-key` before sending a request.

## License

Apache-2.0. See `LICENSE`.
