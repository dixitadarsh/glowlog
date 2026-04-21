import { AsyncLocalStorage } from 'async_hooks';

const store = new AsyncLocalStorage();

// Generate a short unique request ID
function generateId() {
  const ts  = Date.now().toString(36);
  const rnd = Math.random().toString(36).slice(2, 7);
  return `req_${ts}${rnd}`;
}

// Get current request ID from async context
export function getRequestId() {
  return store.getStore()?.requestId || null;
}

// Get full store (requestId + any extra context)
export function getContext() {
  return store.getStore() || {};
}

// Set extra context key (e.g. userId, tenantId)
export function setContext(key, value) {
  const current = store.getStore();
  if (current) current[key] = value;
}

// Express/NestJS/Fastify middleware
// app.use(requestIdMiddleware())
export function requestIdMiddleware(options = {}) {
  const header = options.header || 'x-request-id';

  return (req, res, next) => {
    const requestId = req.headers[header] || generateId();

    // Attach to response header so clients can track
    res.setHeader(header, requestId);

    store.run({ requestId, startTime: Date.now() }, () => {
      next();
    });
  };
}

// Manual context runner (for non-HTTP use like queues, crons)
// await withContext({ requestId: 'custom_id' }, async () => { ... })
export function withContext(context, fn) {
  const ctx = { requestId: generateId(), ...context };
  return store.run(ctx, fn);
}

export { generateId };
