export { GlowLogger }                                              from './core/logger.js';
export { dev, prod, ci, neat, nest }                               from './presets/index.js';
export { requestIdMiddleware, withContext, getRequestId, setContext } from './plugins/request.js';
export { redactObject, redactMessage, addSensitiveKey }            from './plugins/redact.js';
export { flushLogs, withLogFlush }                                 from './plugins/serverless.js';
export { FileTransport }                                           from './transports/file.js';
export { isBrowser, isNode, isProd, isServerless }                 from './utils/env.js';

// Default logger — zero config
import { GlowLogger } from './core/logger.js';
export const logger = new GlowLogger({ catchErrors: false });
