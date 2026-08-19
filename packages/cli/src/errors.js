export class CliError extends Error {
  constructor(code, message, options = {}) {
    super(message, options.cause ? { cause: options.cause } : undefined);
    this.name = 'CliError';
    this.code = code;
    this.status = options.status ?? null;
    this.details = options.details ?? null;
    this.nextActions = options.nextActions ?? [];
    this.exitCode = options.exitCode ?? 1;
  }
}

export function normalizeError(error) {
  if (error instanceof CliError) return error;
  return new CliError('UNEXPECTED_ERROR', error instanceof Error ? error.message : String(error), {
    cause: error,
    exitCode: 1,
  });
}
