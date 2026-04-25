import { GlowLogger } from '../core/logger.js';

// Zero config — box style, all fields, good for development
export const dev = (name = 'app') => new GlowLogger({
  name, style: 'box', spacing: 1,
  show: { timestamp:true, source:true, hint:true, stack:false },
  file: false, redact: true,
});

// Compact + file — for production servers
export const prod = (name = 'app', logDir = './logs') => new GlowLogger({
  name, style: 'compact', spacing: 0,
  show: { timestamp:true, source:false, stack:false },
  file: true,
  fileOptions: { dir:logDir, rotation:'daily', compress:true, maxFiles:14, format:'json', separate:true },
  redact: true, productionSafe: true,
});

// Minimal — for CI/CD pipelines and scripts
export const ci = (name = 'app') => new GlowLogger({
  name, style: 'minimal', spacing: 0,
  show: { timestamp:false, source:false, icon:true, hint:true },
  file: false, redact: true, productionSafe: true,
});

// Line style — middle ground between box and compact
export const neat = (name = 'app') => new GlowLogger({
  name, style: 'line', spacing: 1,
  show: { timestamp:true, source:true, hint:true },
  file: false, redact: true,
});

// NestJS LoggerService compatible
export const nest = (name = 'NestApp', logDir = './logs') => {
  const logger = new GlowLogger({
    name, style: 'compact', spacing: 0,
    file: true, fileOptions: { dir:logDir, rotation:'daily', compress:true, separate:true },
    redact: true, requestId: true,
  });

  // NestJS LoggerService interface
  return {
    log:     (msg, ctx) => logger.info(msg,  { context: ctx }),
    error:   (msg, tr, ctx) => logger.error(msg, { trace: tr, context: ctx }),
    warn:    (msg, ctx) => logger.warn(msg,  { context: ctx }),
    debug:   (msg, ctx) => logger.debug(msg, { context: ctx }),
    verbose: (msg, ctx) => logger.info(msg,  { context: ctx }),
    _logger: logger,
  };
};
