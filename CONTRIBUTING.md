# Contributing

Open an issue before proposing a new state-changing capability. Pull requests should explain the user workflow, permission scope, failure behavior, and verification performed.

Run before submitting:

```bash
npm test
npm run check
```

Use sanitized fixtures only. Do not include API tokens, carrier credentials, customer addresses, shipment documents, or production responses.
