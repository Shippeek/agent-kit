import { readFile } from 'node:fs/promises';
import { CliError } from './errors.js';

export async function readJsonInput(path) {
  if (!path) {
    throw new CliError('INPUT_REQUIRED', 'A JSON request file is required.', {
      exitCode: 2,
      nextActions: ['Pass --file request.json or --file - to read stdin.'],
    });
  }

  let source;
  try {
    source = path === '-' ? await readStdin() : await readFile(path, 'utf8');
  } catch (error) {
    throw new CliError('INPUT_READ_FAILED', `Unable to read ${path}: ${error.message}`, {
      cause: error,
      exitCode: 2,
    });
  }

  try {
    const parsed = JSON.parse(source);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      throw new Error('the top-level value must be an object');
    }
    return parsed;
  } catch (error) {
    throw new CliError('INVALID_JSON', `Invalid JSON in ${path}: ${error.message}`, {
      cause: error,
      exitCode: 2,
    });
  }
}

async function readStdin() {
  const chunks = [];
  for await (const chunk of process.stdin) chunks.push(chunk);
  return Buffer.concat(chunks).toString('utf8');
}
