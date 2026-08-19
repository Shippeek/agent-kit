import { spawn } from 'node:child_process';
import { CliError } from './errors.js';

export const DEFAULT_SCOPES = Object.freeze([
  'carriers:read',
  'rates:read',
  'shipments:read',
  'tracking:read',
]);

export async function startDeviceAuthorization({ appBaseUrl, clientName, scopes, fetchImpl = globalThis.fetch }) {
  const response = await fetchImpl(`${appBaseUrl.replace(/\/$/, '')}/api/agent/device/authorize`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ client_name: clientName, scopes }),
    signal: AbortSignal.timeout(15_000),
  });
  return parseDeviceResponse(response, 'DEVICE_AUTH_START_FAILED');
}

export async function pollDeviceAuthorization({ appBaseUrl, deviceCode, intervalSeconds, expiresIn, fetchImpl = globalThis.fetch, onSlowDown }) {
  const startedAt = Date.now();
  let interval = Math.max(1, intervalSeconds || 5);

  while (Date.now() - startedAt < expiresIn * 1000) {
    await sleep(interval * 1000);
    const response = await fetchImpl(`${appBaseUrl.replace(/\/$/, '')}/api/agent/device/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ device_code: deviceCode }),
      signal: AbortSignal.timeout(15_000),
    });
    const payload = await parseJson(response);
    const data = unwrap(payload);

    if (response.ok && data?.access_token) return data;
    const code = data?.error || payload?.error;
    if (code === 'authorization_pending') continue;
    if (code === 'slow_down') {
      interval += 5;
      onSlowDown?.(interval);
      continue;
    }
    if (code === 'access_denied' || code === 'expired_token') {
      throw new CliError(code.toUpperCase(), data?.message || `Device authorization ${code.replace('_', ' ')}.`, {
        status: response.status,
        exitCode: 3,
      });
    }
    throw new CliError('DEVICE_AUTH_FAILED', data?.message || `Device authorization failed with HTTP ${response.status}.`, {
      status: response.status,
      details: payload,
      exitCode: 3,
    });
  }

  throw new CliError('EXPIRED_TOKEN', 'The device authorization expired.', {
    exitCode: 3,
    nextActions: ['Run shippeek auth login again.'],
  });
}

async function parseDeviceResponse(response, code) {
  const payload = await parseJson(response);
  const data = unwrap(payload);
  if (!response.ok) {
    throw new CliError(code, data?.message || data?.error || `Shippeek returned HTTP ${response.status}.`, {
      status: response.status,
      details: payload,
      exitCode: 3,
      nextActions: ['Use SHIPPEEK_API_TOKEN until Shippeek device login is available.'],
    });
  }
  const required = ['device_code', 'user_code', 'verification_uri', 'expires_in'];
  for (const field of required) {
    if (!data?.[field]) throw new CliError('INVALID_DEVICE_RESPONSE', `Device response is missing ${field}.`, { exitCode: 3 });
  }
  return data;
}

async function parseJson(response) {
  try {
    return await response.json();
  } catch {
    return {};
  }
}

function unwrap(payload) {
  return payload?.status === 'success' && payload?.data ? payload.data : payload;
}

function sleep(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

export function openBrowser(url, platform = process.platform) {
  const command = platform === 'darwin'
    ? ['open', [url]]
    : platform === 'win32'
      ? ['cmd', ['/c', 'start', '', url]]
      : ['xdg-open', [url]];
  try {
    const child = spawn(command[0], command[1], { detached: true, stdio: 'ignore' });
    child.unref();
    return true;
  } catch {
    return false;
  }
}
