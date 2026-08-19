# Architecture

The Agent Kit separates reasoning, execution, and human consent.

1. The Agent Skill teaches an agent when and how to use Shippeek.
2. The CLI provides stable commands, JSON responses, and safety gates.
3. Shippeek APIs execute shipping operations and enforce organization scopes.
4. `app.shippeek.com/agent` handles login, consent, carrier configuration, and billing.

The CLI and a future remote MCP server should use the same capability definitions and API contracts. Web automation must not become a substitute for a supported API operation.

The public repository must contain only client-side contracts, sanitized examples, and reusable integration code. Backend implementations, private carrier contracts, infrastructure, customer data, and credentials remain private.
