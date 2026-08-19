import assert from 'node:assert/strict';
import test from 'node:test';
import { flagValue, flagValues, parseArgs, positiveIntegerFlag } from '../src/args.js';

test('parses commands, booleans, values, repeats, and equals syntax', () => {
  const parsed = parseArgs([
    'auth', 'login', '--json', '--profile=work', '--scope', 'rates:read', '--scope', 'tracking:read',
  ]);

  assert.deepEqual(parsed.positionals, ['auth', 'login']);
  assert.equal(parsed.flags.json, true);
  assert.equal(flagValue(parsed.flags, 'profile'), 'work');
  assert.deepEqual(flagValues(parsed.flags, 'scope'), ['rates:read', 'tracking:read']);
});

test('validates positive integer flags', () => {
  assert.equal(positiveIntegerFlag({ page: '3' }, 'page', 1), 3);
  assert.throws(() => positiveIntegerFlag({ page: '0' }, 'page', 1), /positive integer/);
});

test('rejects flags without values', () => {
  assert.throws(() => parseArgs(['rates', 'ltl', '--file']), /requires a value/);
});
