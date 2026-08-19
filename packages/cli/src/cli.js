#!/usr/bin/env node

import { parseArgs, flagValue, flagValues, positiveIntegerFlag } from './args.js';
import { ApiClient, resolveApiBase } from './api.js';
import { DEFAULT_SCOPES, openBrowser, pollDeviceAuthorization, startDeviceAuthorization } from './auth.js';
import { CAPABILITIES } from './capabilities.js';
import { removeProfile, resolveCredential, saveProfile } from './config.js';
import { CliError, normalizeError } from './errors.js';
import { readJsonInput } from './files.js';
import { writeError, writeEvent, writeSuccess } from './output.js';

const VERSION = '0.1.0';
const APP_BASE_URL = 'https://app.shippeek.com';

export async function run(argv = process.argv.slice(2)) {
  const parsed = parseArgs(argv);
  const json = Boolean(parsed.flags.json);
  const [command, subcommand, argument] = parsed.positionals;

  if (parsed.flags.version || command === 'version') {
    writeSuccess({ version: VERSION }, { json, message: VERSION });
    return;
  }
  if (parsed.flags.help || !command || command === 'help') {
    process.stdout.write(helpText());
    return;
  }

  if (command === 'capabilities') {
    writeSuccess(CAPABILITIES, { json });
    return;
  }

  if (command === 'auth') {
    await runAuth(subcommand, parsed.flags, json);
    return;
  }

  if (command === 'open') {
    runOpen(subcommand, parsed.flags, json);
    return;
  }

  const environment = String(flagValue(parsed.flags, 'environment', command === 'shipments' || command === 'track' || command === 'doctor' ? 'production' : 'sandbox'));
  const baseUrl = resolveApiBase(environment, flagValue(parsed.flags, 'api-base'));
  const profileName = String(flagValue(parsed.flags, 'profile', 'default'));
  const credential = await resolveCredential(profileName);
  const client = new ApiClient({ baseUrl, token: credential.token });

  if (command === 'doctor') {
    const response = await client.request('/shipments?page=1&pageSize=1');
    writeSuccess({ authenticated: true, environment, profile: credential.profile, api_base_url: baseUrl, api_status: response.status }, { json });
    return;
  }

  if (command === 'rates') {
    const body = await readJsonInput(flagValue(parsed.flags, 'file'));
    const path = subcommand === 'ltl' ? '/rates' : subcommand === 'parcel' ? '/rates/parcel' : null;
    if (!path) throw usageError('Use rates ltl or rates parcel.');
    const response = await client.request(path, { method: 'POST', body });
    writeSuccess(response.data, { json, meta: responseMeta(response, environment) });
    return;
  }

  if (command === 'track') {
    const trackingNumber = subcommand;
    if (!trackingNumber) throw usageError('A PRO or tracking number is required.');
    const response = await client.request(`/track/${encodeURIComponent(trackingNumber)}`);
    writeSuccess(response.data, { json, meta: responseMeta(response, environment) });
    return;
  }

  if (command === 'shipments') {
    await runShipments(client, subcommand, argument, parsed.flags, json, environment);
    return;
  }

  if (command === 'book') {
    await runBooking(client, subcommand, parsed.flags, json, environment);
    return;
  }

  throw usageError(`Unknown command: ${command}`);
}

async function runAuth(subcommand, flags, json) {
  const profileName = String(flagValue(flags, 'profile', 'default'));
  if (subcommand === 'status') {
    const credential = await resolveCredential(profileName);
    writeSuccess({
      authenticated: Boolean(credential.token),
      profile: credential.profile,
      source: credential.source,
      scopes: credential.scopes ?? [],
      expires_at: credential.expiresAt ?? null,
    }, { json });
    return;
  }

  if (subcommand === 'logout') {
    const credential = await resolveCredential(profileName);
    const result = await removeProfile(profileName);
    writeSuccess({
      profile: profileName,
      removed: result.removed,
      environment_token_active: credential.source === 'environment',
    }, {
      json,
      message: credential.source === 'environment'
        ? 'Stored profile removed. SHIPPEEK_API_TOKEN is still active in this process.'
        : 'Shippeek profile removed.',
    });
    return;
  }

  if (subcommand !== 'login') throw usageError('Use auth status, auth login, or auth logout.');

  const appBaseUrl = String(flagValue(flags, 'app-base', APP_BASE_URL));
  const requestedScopes = flagValues(flags, 'scope');
  const scopes = requestedScopes.length ? requestedScopes : [...DEFAULT_SCOPES];
  const authorization = await startDeviceAuthorization({
    appBaseUrl,
    clientName: String(flagValue(flags, 'client-name', 'Shippeek CLI')),
    scopes,
  });
  const verificationUrl = authorization.verification_uri_complete || authorization.verification_uri;
  if (!flags['no-open']) openBrowser(verificationUrl);
  writeEvent('authorization_required', {
    verification_url: verificationUrl,
    user_code: authorization.user_code,
    expires_in: authorization.expires_in,
    scopes,
  }, {
    json,
    message: `Open ${verificationUrl} and approve code ${authorization.user_code}.`,
  });

  const token = await pollDeviceAuthorization({
    appBaseUrl,
    deviceCode: authorization.device_code,
    intervalSeconds: authorization.interval,
    expiresIn: authorization.expires_in,
    onSlowDown: (interval) => writeEvent('slow_down', { interval }, { json, message: `Shippeek requested a slower polling interval (${interval}s).` }),
  });
  const expiresAt = token.expires_in ? new Date(Date.now() + token.expires_in * 1000).toISOString() : null;
  await saveProfile(profileName, {
    accessToken: token.access_token,
    refreshToken: token.refresh_token ?? null,
    expiresAt,
    scopes: token.scopes ?? scopes,
  });
  writeSuccess({ authenticated: true, profile: profileName, scopes: token.scopes ?? scopes, expires_at: expiresAt }, { json, message: 'Shippeek connected.' });
}

async function runShipments(client, subcommand, argument, flags, json, environment) {
  if (subcommand === 'get') {
    if (!argument) throw usageError('A shipment ID is required.');
    const response = await client.request(`/shipments/${encodeURIComponent(argument)}`);
    writeSuccess(response.data, { json, meta: responseMeta(response, environment) });
    return;
  }
  if (subcommand !== 'list') throw usageError('Use shipments list or shipments get SHIPMENT_ID.');

  const query = new URLSearchParams({
    page: String(positiveIntegerFlag(flags, 'page', 1)),
    pageSize: String(positiveIntegerFlag(flags, 'page-size', 20)),
  });
  for (const [flag, parameter] of [['status', 'status'], ['carrier', 'carrier'], ['from', 'from'], ['to', 'to'], ['search', 'search']]) {
    const value = flagValue(flags, flag);
    if (value !== undefined) query.set(parameter, String(value));
  }
  const response = await client.request(`/shipments?${query}`);
  writeSuccess(response.data, { json, meta: responseMeta(response, environment) });
}

async function runBooking(client, subcommand, flags, json, environment) {
  const path = subcommand === 'ltl' ? '/book' : subcommand === 'parcel' ? '/book/parcel' : subcommand === 'cancel' ? '/book/cancel' : null;
  if (!path) throw usageError('Use book ltl, book parcel, or book cancel.');
  const body = await readJsonInput(flagValue(flags, 'file'));
  const idempotencyKey = flagValue(flags, 'idempotency-key');
  const confirmed = Boolean(flags.confirm) && !flags['dry-run'];
  const plan = {
    operation: `book.${subcommand}`,
    environment,
    endpoint: path,
    idempotency_key: idempotencyKey ?? null,
    request: body,
  };

  if (!confirmed) {
    writeSuccess({
      dry_run: true,
      plan,
      next_actions: ['Review the plan and obtain explicit user approval.', 'Repeat with the same --idempotency-key and add --confirm.'],
    }, { json, message: 'Dry run only. No Shippeek request was sent.' });
    return;
  }
  if (!idempotencyKey) {
    throw new CliError('IDEMPOTENCY_KEY_REQUIRED', 'Confirmed booking operations require --idempotency-key.', {
      exitCode: 2,
      nextActions: ['Choose a stable key tied to the intended order or operation, then retry with --confirm.'],
    });
  }

  const response = await client.request(path, {
    method: 'POST',
    body,
    headers: { 'Idempotency-Key': String(idempotencyKey) },
  });
  writeSuccess(response.data, { json, meta: { ...responseMeta(response, environment), idempotency_key: idempotencyKey } });
}

function runOpen(destination, flags, json) {
  const appBaseUrl = String(flagValue(flags, 'app-base', APP_BASE_URL)).replace(/\/$/, '');
  const paths = {
    agent: '/agent',
    carriers: '/carriers',
    billing: '/account/billing',
    'api-keys': '/account/api-keys',
  };
  const path = paths[destination];
  if (!path) throw usageError('Use open agent, open carriers, open billing, or open api-keys.');
  const url = `${appBaseUrl}${path}`;
  const opened = flags['no-open'] ? false : openBrowser(url);
  writeSuccess({ url, opened }, { json, message: url });
}

function responseMeta(response, environment) {
  return {
    environment,
    status: response.status,
    request_id: response.headers['x-request-id'] ?? null,
  };
}

function usageError(message) {
  return new CliError('USAGE_ERROR', message, { exitCode: 2, nextActions: ['Run shippeek help.'] });
}

function helpText() {
  return `Shippeek CLI ${VERSION}\n\nUsage:\n  shippeek capabilities [--json]\n  shippeek auth status|login|logout [--json]\n  shippeek doctor [--environment production] [--json]\n  shippeek rates ltl|parcel --file request.json [--environment sandbox] [--json]\n  shippeek track TRACKING_NUMBER [--json]\n  shippeek shipments list [--page 1] [--page-size 20] [--json]\n  shippeek shipments get SHIPMENT_ID [--json]\n  shippeek book ltl|parcel|cancel --file request.json --idempotency-key KEY [--confirm] [--json]\n  shippeek open agent|carriers|billing|api-keys\n\nAuthentication:\n  Run shippeek auth login or set SHIPPEEK_API_TOKEN. Tokens are never accepted as command arguments.\n`;
}

run().catch((rawError) => {
  const error = normalizeError(rawError);
  let json = false;
  try { json = Boolean(parseArgs(process.argv.slice(2)).flags.json); } catch { /* use human output */ }
  writeError(error, { json });
  process.exitCode = error.exitCode;
});
