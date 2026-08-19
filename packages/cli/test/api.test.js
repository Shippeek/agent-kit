import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import test from 'node:test';
import { ApiClient } from '../src/api.js';

test('sends bearer authentication and JSON request bodies', async (t) => {
  const server = createServer(async (request, response) => {
    const chunks = [];
    for await (const chunk of request) chunks.push(chunk);
    response.setHeader('Content-Type', 'application/json');
    response.setHeader('X-Request-Id', 'req_test');
    response.end(JSON.stringify({
      method: request.method,
      authorization: request.headers.authorization,
      idempotencyKey: request.headers['idempotency-key'],
      body: JSON.parse(Buffer.concat(chunks).toString('utf8')),
    }));
  });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  t.after(() => server.close());

  const address = server.address();
  const client = new ApiClient({ baseUrl: `http://127.0.0.1:${address.port}`, token: 'test-token' });
  const result = await client.request('/book', {
    method: 'POST',
    headers: { 'Idempotency-Key': 'ORDER-123' },
    body: { quoteId: 'quote_test' },
  });

  assert.equal(result.data.authorization, 'Bearer test-token');
  assert.equal(result.data.idempotencyKey, 'ORDER-123');
  assert.deepEqual(result.data.body, { quoteId: 'quote_test' });
  assert.equal(result.headers['x-request-id'], 'req_test');
});

test('normalizes API authorization failures', async () => {
  const client = new ApiClient({
    baseUrl: 'https://example.test',
    token: 'bad-token',
    fetchImpl: async () => new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    }),
  });

  await assert.rejects(
    client.request('/shipments'),
    (error) => error.code === 'AUTH_INVALID' && error.status === 401,
  );
});
