export const CAPABILITIES = Object.freeze({
  version: '2026-08-19',
  authentication: {
    deviceLogin: true,
    environmentToken: 'SHIPPEEK_API_TOKEN',
    tokenArgumentsAllowed: false,
  },
  environments: ['sandbox', 'production'],
  commands: [
    { command: 'auth status', risk: 'read', description: 'Inspect local authentication state without printing credentials.' },
    { command: 'auth login', risk: 'consent', description: 'Pair the CLI through the Shippeek web app.' },
    { command: 'doctor', risk: 'read', description: 'Verify authentication and API reachability.' },
    { command: 'rates ltl', risk: 'read', description: 'Request LTL rates.' },
    { command: 'rates parcel', risk: 'read', description: 'Request parcel rates.' },
    { command: 'track', risk: 'read', description: 'Track a PRO or parcel tracking number.' },
    { command: 'shipments list', risk: 'read', description: 'Search shipment history.' },
    { command: 'shipments get', risk: 'read', description: 'Retrieve one shipment.' },
    { command: 'book ltl', risk: 'write', confirmation: true, idempotencyKey: true, description: 'Book an LTL shipment.' },
    { command: 'book parcel', risk: 'write', confirmation: true, idempotencyKey: true, description: 'Book a parcel shipment.' },
    { command: 'book cancel', risk: 'write', confirmation: true, idempotencyKey: true, description: 'Cancel a booking.' },
    { command: 'open', risk: 'local', description: 'Open a human-facing Shippeek page.' },
  ],
});
