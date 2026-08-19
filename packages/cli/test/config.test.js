import assert from 'node:assert/strict';
import { mkdtemp, readFile, stat } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { removeProfile, resolveCredential, saveProfile } from '../src/config.js';

test('stores credentials with owner-only permissions and never exposes token metadata', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'shippeek-config-'));
  const path = join(directory, 'credentials.json');
  await saveProfile('default', { accessToken: 'secret', scopes: ['rates:read'] }, { path });

  const mode = (await stat(path)).mode & 0o777;
  assert.equal(mode, 0o600);
  assert.match(await readFile(path, 'utf8'), /"accessToken": "secret"/);

  const credential = await resolveCredential('default', { path, env: {} });
  assert.equal(credential.token, 'secret');
  assert.equal(credential.source, 'credential_store');

  const removed = await removeProfile('default', { path, env: {} });
  assert.equal(removed.removed, true);
  assert.equal((await resolveCredential('default', { path, env: {} })).token, null);
});

test('prefers the environment token', async () => {
  const credential = await resolveCredential('default', { env: { SHIPPEEK_API_TOKEN: 'from-env' } });
  assert.equal(credential.token, 'from-env');
  assert.equal(credential.source, 'environment');
});
