// Core
export { GlowLogger }                                          from './core/logger.js';

// Plugins
export { requestIdMiddleware, withContext, getRequestId, setContext } from './plugins/request.js';
export { redactObject, redactMessage, addSensitiveKey }         from './plugins/redact.js';
export { flushLogs, withLogFlush, registerExitFlush }           from './plugins/serverless.js';

// Transports
export { FileTransport }                                        from './transports/file.js';

// Presets
export { createDevLogger, createProductionLogger, createFullLogger, createNestLogger } from './presets/index.js';

// Utils
export { isBrowser, isNode, isProduction, isServerless }        from './utils/env.js';
export { formatDate }                                           from './utils/date.js';

// Default logger — zero config, works immediately
import { GlowLogger } from './core/logger.js';
export const logger = new GlowLogger({ name: 'app', catchErrors: false });
