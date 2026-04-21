import { GlowLogger } from '../core/logger.js';

/**
 * Zero config — works immediately for dev
 */
export function createDevLogger(name = 'app') {
  return new GlowLogger({ name, minLevel: 'DEBUG', file: false });
}

/**
 * Production-ready — WARN+ only, file logging on
 */
export function createProductionLogger(name = 'app', logDir = './logs') {
  return new GlowLogger({
    name,
    minLevel: 'WARN',
    file: true,
    fileOptions: { dir: logDir, rotation: 'daily' },
    productionSafe: true,
  });
}

/**
 * Full featured — all levels, file, redact, requestId
 */
export function createFullLogger(name = 'app', options = {}) {
  return new GlowLogger({
    name,
    minLevel: 'DEBUG',
    file: true,
    fileOptions: {
      dir: options.logDir || './logs',
      rotation: options.rotation || 'daily',
    },
    redact: true,
    requestId: true,
    catchErrors: true,
    ...options,
  });
}

/**
 * NestJS module compatible logger
 */
export function createNestLogger(name = 'NestApp') {
  const logger = new GlowLogger({
    name,
    minLevel: 'DEBUG',
    file: true,
    fileOptions: { rotation: 'daily' },
    redact: true,
    requestId: true,
  });

  // NestJS LoggerService interface
  return {
    log:     (msg, ctx) => logger.info(msg,    { context: ctx }),
    error:   (msg, trace, ctx) => logger.error(msg, { trace, context: ctx }),
    warn:    (msg, ctx) => logger.warn(msg,    { context: ctx }),
    debug:   (msg, ctx) => logger.debug(msg,   { context: ctx }),
    verbose: (msg, ctx) => logger.info(msg,    { context: ctx }),
    _logger: logger,
  };
}
