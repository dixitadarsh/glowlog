import { isServerless, getServerlessProvider } from '../utils/env.js';

const pendingWrites = [];
let flushRegistered = false;

// Queue a write promise for serverless environments
export function queueWrite(promise) {
  if (!isServerless()) return;
  pendingWrites.push(promise);
}

// Flush all pending log writes — call before returning from handler
export async function flushLogs() {
  if (pendingWrites.length === 0) return;
  try {
    await Promise.allSettled(pendingWrites);
  } finally {
    pendingWrites.length = 0;
  }
}

// Wrap a Lambda/Vercel handler to auto-flush logs after execution
// const handler = withLogFlush(async (event, context) => { ... })
export function withLogFlush(handler) {
  return async (...args) => {
    try {
      const result = await handler(...args);
      await flushLogs();
      return result;
    } catch (err) {
      await flushLogs();
      throw err;
    }
  };
}

// Register process exit flush (for non-serverless Node)
export function registerExitFlush(logger) {
  if (flushRegistered) return;
  flushRegistered = true;

  const flush = async () => {
    await flushLogs();
  };

  process.on('beforeExit', flush);
  process.on('SIGTERM', async () => { await flush(); process.exit(0); });
  process.on('SIGINT',  async () => { await flush(); process.exit(0); });
}

export { isServerless, getServerlessProvider };
