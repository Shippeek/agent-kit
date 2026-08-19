import { CliError } from './errors.js';

export const API_BASE_URLS = Object.freeze({
  sandbox: 'https://api.shippeek.dev',
  production: 'https://api.shippeek.com',
});

export function resolveApiBase(environment = 'sandbox', override) {
  if (override) return override.replace(/\/$/, '');
  const base = API_BASE_URLS[environment];
  if (!base) {
    throw new CliError('INVALID_ENVIRONMENT', `Unknown environment: ${environment}`, {
      exitCode: 2,
      nextActions: ['Use --environment sandbox or --environment production.'],
    });
  }
  return base;
}

export class ApiClient {
  constructor({ baseUrl, token, fetchImpl = globalThis.fetch, timeoutMs = 30_000 }) {
    this.baseUrl = baseUrl.replace(/\/$/, '');
    this.token = token;
    this.fetchImpl = fetchImpl;
    this.timeoutMs = timeoutMs;
  }

  async request(path, options = {}) {
    if (!this.token) {
      throw new CliError('AUTH_REQUIRED', 'Shippeek authentication is required.', {
        exitCode: 3,
        nextActions: ['Run shippeek auth login.', 'Or set SHIPPEEK_API_TOKEN for local development.'],
      });
    }

    const headers = new Headers(options.headers ?? {});
    headers.set('Authorization', `Bearer ${this.token}`);
    headers.set('Accept', 'application/json');
    if (options.body !== undefined) headers.set('Content-Type', 'application/json');

    let response;
    try {
      response = await this.fetchImpl(`${this.baseUrl}${path}`, {
        method: options.method ?? 'GET',
        headers,
        body: options.body === undefined ? undefined : JSON.stringify(options.body),
        signal: options.signal ?? AbortSignal.timeout(this.timeoutMs),
      });
    } catch (error) {
      throw new CliError('NETWORK_ERROR', `Unable to reach Shippeek: ${error.message}`, {
        cause: error,
        exitCode: 4,
        nextActions: ['Check network access and the selected Shippeek environment before retrying.'],
      });
    }

    const text = await response.text();
    let data = null;
    if (text) {
      try {
        data = JSON.parse(text);
      } catch {
        data = { message: text };
      }
    }

    if (!response.ok) {
      const message = data?.message || data?.error || `Shippeek returned HTTP ${response.status}.`;
      throw new CliError(apiErrorCode(response.status, data), String(message), {
        status: response.status,
        details: data,
        exitCode: 4,
        nextActions: apiNextActions(response.status, data),
      });
    }

    return { data, status: response.status, headers: Object.fromEntries(response.headers.entries()) };
  }
}

function apiErrorCode(status, data) {
  if (status === 401) return 'AUTH_INVALID';
  if (status === 403) return 'PERMISSION_DENIED';
  if (status === 402) return data?.error === 'Trial expired' ? 'TRIAL_EXPIRED' : 'USAGE_LIMIT';
  if (status === 409) return 'CONFLICT';
  if (status === 422 || status === 400) return 'VALIDATION_ERROR';
  if (status === 429) return 'RATE_LIMITED';
  return 'API_ERROR';
}

function apiNextActions(status, data) {
  if (status === 401) return ['Run shippeek auth login and retry.'];
  if (status === 403) return ['Request the required scope from a Shippeek organization admin.'];
  if (status === 402) return [data?.upgrade_url ? `Open ${data.upgrade_url}.` : 'Open Shippeek billing.'];
  if (status === 429) return ['Wait for the server-provided retry interval before retrying.'];
  return [];
}
