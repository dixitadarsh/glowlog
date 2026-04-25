import { isServerless } from '../utils/env.js';
const pending = [];

export const queueWrite  = p => { if (isServerless()) pending.push(p); };
export const flushLogs   = async () => { if (pending.length) { await Promise.allSettled(pending); pending.length = 0; } };
export function withLogFlush(handler) {
  return async (...args) => { try { const r = await handler(...args); await flushLogs(); return r; } catch(e) { await flushLogs(); throw e; } };
}
