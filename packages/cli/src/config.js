import { chmod, mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import { homedir } from 'node:os';
import { dirname, join } from 'node:path';

const CONFIG_VERSION = 1;

export function configPath(env = process.env, platform = process.platform) {
  if (env.SHIPPEEK_CONFIG_FILE) return env.SHIPPEEK_CONFIG_FILE;
  if (platform === 'win32') {
    return join(env.APPDATA || join(homedir(), 'AppData', 'Roaming'), 'Shippeek', 'credentials.json');
  }
  return join(env.XDG_CONFIG_HOME || join(homedir(), '.config'), 'shippeek', 'credentials.json');
}

export async function loadConfig(options = {}) {
  const path = options.path ?? configPath(options.env, options.platform);
  try {
    const parsed = JSON.parse(await readFile(path, 'utf8'));
    return {
      version: CONFIG_VERSION,
      currentProfile: parsed.currentProfile || 'default',
      profiles: parsed.profiles && typeof parsed.profiles === 'object' ? parsed.profiles : {},
    };
  } catch (error) {
    if (error?.code === 'ENOENT') {
      return { version: CONFIG_VERSION, currentProfile: 'default', profiles: {} };
    }
    throw error;
  }
}

export async function saveProfile(profileName, profile, options = {}) {
  const path = options.path ?? configPath(options.env, options.platform);
  const config = await loadConfig({ ...options, path });
  const next = {
    ...config,
    currentProfile: profileName,
    profiles: {
      ...config.profiles,
      [profileName]: { ...(config.profiles[profileName] ?? {}), ...profile },
    },
  };
  await writeSecureJson(path, next);
  return path;
}

export async function removeProfile(profileName, options = {}) {
  const path = options.path ?? configPath(options.env, options.platform);
  const config = await loadConfig({ ...options, path });
  const profiles = { ...config.profiles };
  const removed = Boolean(profiles[profileName]);
  delete profiles[profileName];
  await writeSecureJson(path, {
    ...config,
    currentProfile: config.currentProfile === profileName ? 'default' : config.currentProfile,
    profiles,
  });
  return { path, removed };
}

async function writeSecureJson(path, value) {
  await mkdir(dirname(path), { recursive: true, mode: 0o700 });
  const temporaryPath = `${path}.${process.pid}.tmp`;
  await writeFile(temporaryPath, `${JSON.stringify(value, null, 2)}\n`, { mode: 0o600 });
  await chmod(temporaryPath, 0o600);
  await rename(temporaryPath, path);
  await chmod(path, 0o600);
}

export async function resolveCredential(profileName, options = {}) {
  const env = options.env ?? process.env;
  if (env.SHIPPEEK_API_TOKEN) {
    return { token: env.SHIPPEEK_API_TOKEN, source: 'environment', profile: profileName };
  }
  const config = await loadConfig(options);
  const effectiveProfile = profileName || config.currentProfile || 'default';
  const profile = config.profiles[effectiveProfile] ?? {};
  return {
    token: profile.accessToken || null,
    refreshToken: profile.refreshToken || null,
    expiresAt: profile.expiresAt || null,
    source: profile.accessToken ? 'credential_store' : 'none',
    profile: effectiveProfile,
    scopes: profile.scopes ?? [],
  };
}
