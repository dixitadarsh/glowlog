import { AsyncLocalStorage } from 'async_hooks';

const store = new AsyncLocalStorage();
const genId = () => `req_${Date.now().toString(36)}${Math.random().toString(36).slice(2,6)}`;

export const getRequestId = () => store.getStore()?.requestId || null;
export const getContext   = () => store.getStore() || {};
export const setContext   = (k, v) => { const s = store.getStore(); if (s) s[k] = v; };

export function requestIdMiddleware(options = {}) {
  const header = options.header || 'x-request-id';
  return (req, res, next) => {
    const requestId = req.headers[header] || genId();
    res.setHeader(header, requestId);
    store.run({ requestId, startTime: Date.now() }, () => next());
  };
}

export function withContext(context, fn) {
  return store.run({ requestId: genId(), ...context }, fn);
}

export { genId as generateId };
