import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';
import test from 'node:test';

const execFileAsync = promisify(execFile);
const testDirectory = dirname(fileURLToPath(import.meta.url));
const cliPath = join(testDirectory, '..', 'src', 'cli.js');

test('prints machine-readable capabilities', async () => {
  const { stdout } = await execFileAsync(process.execPath, [cliPath, 'capabilities', '--json']);
  const output = JSON.parse(stdout);
  assert.equal(output.ok, true);
  assert.equal(output.data.authentication.tokenArgumentsAllowed, false);
  assert.ok(output.data.commands.some((entry) => entry.command === 'book ltl' && entry.confirmation));
});

test('booking is a dry run without confirmation and makes no API call', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'shippeek-cli-'));
  const requestPath = join(directory, 'booking.json');
  await writeFile(requestPath, JSON.stringify({ id: 'quote_test', rateId: 'rate_test' }));

  const { stdout } = await execFileAsync(process.execPath, [
    cliPath,
    'book',
    'ltl',
    '--file',
    requestPath,
    '--idempotency-key',
    'ORDER-123',
    '--json',
  ], { env: { ...process.env, SHIPPEEK_API_TOKEN: '' } });
  const output = JSON.parse(stdout);
  assert.equal(output.ok, true);
  assert.equal(output.data.dry_run, true);
  assert.equal(output.data.plan.idempotency_key, 'ORDER-123');
});

test('confirmed booking refuses to run without an idempotency key', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'shippeek-cli-'));
  const requestPath = join(directory, 'booking.json');
  await writeFile(requestPath, JSON.stringify({ id: 'quote_test', rateId: 'rate_test' }));

  await assert.rejects(
    execFileAsync(process.execPath, [cliPath, 'book', 'ltl', '--file', requestPath, '--confirm', '--json'], {
      env: { ...process.env, SHIPPEEK_API_TOKEN: 'test-token' },
    }),
    (error) => {
      const output = JSON.parse(error.stderr);
      return output.error.code === 'IDEMPOTENCY_KEY_REQUIRED';
    },
  );
});
