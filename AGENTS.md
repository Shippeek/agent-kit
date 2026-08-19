# Repository Guidelines

## Scope

This repository contains only public-safe, agent-facing Shippeek artifacts. Do not copy backend source, carrier credentials, private carrier contracts, customer data, production payloads, or infrastructure configuration into it.

## Development

- Require Node.js 20 or newer.
- Keep the CLI free of runtime dependencies unless a dependency has a clear security and maintenance benefit.
- Preserve JSON output contracts; agents depend on stable field names and exit codes.
- Add tests for every command that can mutate shipping state or credentials.
- Keep `skills/shippeek/SKILL.md` concise and put detailed guidance in its direct `references/` files.

## Verification

Run `npm test`, `npm run check`, and the Agent Skill validator before committing. Never run live booking tests without explicit authorization, a spend cap, and a cleanup plan.

## Git

Use conventional commits. Never commit secrets. Keep the default branch releasable.
