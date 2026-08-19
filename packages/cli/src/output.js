export function writeSuccess(data, options = {}) {
  const envelope = { ok: true, data, ...(options.meta ? { meta: options.meta } : {}) };
  if (options.json) {
    process.stdout.write(`${JSON.stringify(envelope)}\n`);
    return;
  }
  if (options.message) process.stdout.write(`${options.message}\n`);
  else process.stdout.write(`${JSON.stringify(data, null, 2)}\n`);
}

export function writeEvent(event, data, options = {}) {
  if (options.json) {
    process.stdout.write(`${JSON.stringify({ event, data })}\n`);
    return;
  }
  if (options.message) process.stdout.write(`${options.message}\n`);
}

export function writeError(error, options = {}) {
  const envelope = {
    ok: false,
    error: {
      code: error.code,
      message: error.message,
      status: error.status,
      details: error.details,
    },
    next_actions: error.nextActions,
  };
  if (options.json) process.stderr.write(`${JSON.stringify(envelope)}\n`);
  else {
    process.stderr.write(`Error [${error.code}]: ${error.message}\n`);
    for (const action of error.nextActions) process.stderr.write(`Next: ${action}\n`);
  }
}
