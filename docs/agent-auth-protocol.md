# Agent Authentication Protocol

Shippeek device login allows local, remote, and headless agents to connect without receiving a user's password or primary account API key.

## Start authorization

`POST https://app.shippeek.com/api/agent/device/authorize`

```json
{
  "client_name": "Codex CLI",
  "scopes": ["carriers:read", "rates:read", "shipments:read", "tracking:read"]
}
```

The response contains a short-lived `device_code`, human-readable `user_code`, verification URLs, expiry, and polling interval.

## Human approval

The CLI opens `verification_uri_complete`. The web app authenticates the user, displays the organization and requested scopes, and requires explicit approval. If no production carrier is ready, the app may guide carrier setup before approval.

## Poll for the token

`POST https://app.shippeek.com/api/agent/device/token`

```json
{
  "device_code": "opaque-short-lived-value"
}
```

Pending responses use `authorization_pending`; throttled clients receive `slow_down`; denied or expired requests use `access_denied` or `expired_token`. A successful response returns a dedicated scoped access token and optional refresh token. It must never return the account's primary API key.

Device codes must be hashed at rest, single-use, expire within minutes, and be deleted after exchange. Agent connections must be named, revocable, auditable, organization-scoped, and attributable to the approving human.
