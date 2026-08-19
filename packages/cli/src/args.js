import { CliError } from './errors.js';

const BOOLEAN_FLAGS = new Set(['json', 'confirm', 'dry-run', 'no-open', 'help', 'version']);

export function parseArgs(argv) {
  const positionals = [];
  const flags = {};

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (token === '--') {
      positionals.push(...argv.slice(index + 1));
      break;
    }

    if (!token.startsWith('--')) {
      positionals.push(token);
      continue;
    }

    const equalsIndex = token.indexOf('=');
    const name = token.slice(2, equalsIndex === -1 ? undefined : equalsIndex);
    if (!name) {
      throw new CliError('INVALID_ARGUMENT', 'Invalid empty flag.', { exitCode: 2 });
    }

    if (equalsIndex !== -1) {
      setFlag(flags, name, token.slice(equalsIndex + 1));
      continue;
    }

    if (BOOLEAN_FLAGS.has(name)) {
      setFlag(flags, name, true);
      continue;
    }

    const value = argv[index + 1];
    if (value === undefined || value.startsWith('--')) {
      throw new CliError('MISSING_FLAG_VALUE', `--${name} requires a value.`, { exitCode: 2 });
    }
    setFlag(flags, name, value);
    index += 1;
  }

  return { positionals, flags };
}

function setFlag(flags, name, value) {
  if (flags[name] === undefined) {
    flags[name] = value;
    return;
  }
  flags[name] = Array.isArray(flags[name]) ? [...flags[name], value] : [flags[name], value];
}

export function flagValue(flags, name, fallback = undefined) {
  const value = flags[name];
  if (Array.isArray(value)) return value.at(-1);
  return value ?? fallback;
}

export function flagValues(flags, name) {
  const value = flags[name];
  if (value === undefined) return [];
  return Array.isArray(value) ? value.map(String) : [String(value)];
}

export function positiveIntegerFlag(flags, name, fallback) {
  const raw = flagValue(flags, name);
  if (raw === undefined) return fallback;
  const value = Number.parseInt(String(raw), 10);
  if (!Number.isInteger(value) || value < 1) {
    throw new CliError('INVALID_ARGUMENT', `--${name} must be a positive integer.`, { exitCode: 2 });
  }
  return value;
}
