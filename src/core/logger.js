import { isBrowser, isNode, isProduction, isServerless } from '../utils/env.js';
import { paint, c, LEVEL_CONFIG }                        from '../utils/colors.js';
import { formatTerminal, formatBrowser }                 from '../core/formatter.js';
import { redactObject, redactMessage }                   from '../plugins/redact.js';
import { getRequestId }                                  from '../plugins/request.js';
import { FileTransport }                                 from '../transports/file.js';

const LEVEL_PRIORITY = { DEBUG: 0, INFO: 1, HTTP: 2, SUCCESS: 3, WARN: 4, ERROR: 5 };

export class GlowLogger {
  /**
   * @param {object} config
   * @param {string}   config.name              App name shown at startup
   * @param {string}   config.minLevel          'DEBUG' | 'INFO' | 'WARN' | 'ERROR'
   * @param {boolean}  config.file              Enable file logging
   * @param {object}   config.fileOptions        { dir, prefix, rotation, maxSizeMB }
   * @param {boolean}  config.redact            Auto-redact sensitive fields (default: true)
   * @param {boolean}  config.requestId         Auto-include request ID (default: true)
   * @param {boolean}  config.catchErrors        Capture uncaught exceptions (default: true)
   * @param {boolean}  config.productionSafe    Mute DEBUG+INFO in production (default: true)
   * @param {boolean}  config.silent            Suppress all output
   */
  constructor(config = {}) {
    this.config = {
      name:           config.name          || 'app',
      minLevel:       config.minLevel      || 'DEBUG',
      file:           config.file          || false,
      fileOptions:    config.fileOptions   || {},
      redact:         config.redact        !== false,
      requestId:      config.requestId     !== false,
      catchErrors:    config.catchErrors   !== false,
      productionSafe: config.productionSafe !== false,
      silent:         config.silent        || false,
    };

    // Production: auto-raise min level
    if (isProduction() && this.config.productionSafe) {
      if (['DEBUG', 'INFO'].includes(this.config.minLevel)) {
        this.config.minLevel = 'WARN';
      }
    }

    // File transport (Node only)
    this._file = null;
    if (this.config.file && isNode) {
      this._file = new FileTransport(this.config.fileOptions);
    }

    // Auto-capture uncaught errors (Node only)
    if (this.config.catchErrors && isNode) {
      this._registerErrorHandlers();
    }

    // Startup banner
    if (!isProduction() && isNode && !this.config.silent) {
      this._banner();
    }
  }

  // ── Internal ──────────────────────────────────────────────────────────────

  _shouldLog(level) {
    return LEVEL_PRIORITY[level] >= LEVEL_PRIORITY[this.config.minLevel];
  }

  _prepare(message, meta) {
    let msg  = message;
    let data = meta;

    if (this.config.redact) {
      msg  = redactMessage(String(msg));
      data = redactObject(data);
    }

    return { msg, data };
  }

  _log(level, message, meta = {}) {
    if (this.config.silent || !this._shouldLog(level)) return;

    const { msg, data } = this._prepare(message, meta);

    // Include request ID from async context
    const extra = {};
    if (this.config.requestId && isNode) {
      const reqId = getRequestId();
      if (reqId) extra.requestId = reqId;
    }

    if (isBrowser) {
      const args = formatBrowser(level, msg, data, extra);
      if (level === 'ERROR')        console.error(...args);
      else if (level === 'WARN')    console.warn(...args);
      else if (level === 'DEBUG')   console.debug(...args);
      else                          console.log(...args);
    } else {
      const out = formatTerminal(level, msg, data, extra);
      if (level === 'ERROR')        console.error(out);
      else if (level === 'WARN')    console.warn(out);
      else                          console.log(out);
    }

    // File write
    if (this._file) {
      this._file.write(level, msg, data);
    }
  }

  // ── Public log methods ─────────────────────────────────────────────────────

  info(message, meta = {})    { this._log('INFO',    message, meta); }
  success(message, meta = {}) { this._log('SUCCESS', message, meta); }
  warn(message, meta = {})    { this._log('WARN',    message, meta); }
  debug(message, meta = {})   { this._log('DEBUG',   message, meta); }

  error(message, errorOrMeta = {}) {
    let meta = {};

    if (errorOrMeta instanceof Error) {
      meta = {
        error:   errorOrMeta,
        message: errorOrMeta.message,
        ...(errorOrMeta.code ? { code: errorOrMeta.code } : {}),
      };
    } else {
      meta = errorOrMeta;
    }

    this._log('ERROR', message, meta);
  }

  // ── HTTP logging ───────────────────────────────────────────────────────────

  http(method, url, status, ms, meta = {}) {
    if (!this._shouldLog('HTTP')) return;

    const { data } = this._prepare('HTTP Request', meta);
    const extra    = { method, url, status, ms };

    if (this.config.requestId && isNode) {
      const reqId = getRequestId();
      if (reqId) extra.requestId = reqId;
    }

    if (isBrowser) {
      console.log(...formatBrowser('HTTP', 'HTTP Request', data, extra));
    } else {
      console.log(formatTerminal('HTTP', 'HTTP Request', data, extra));
    }

    if (this._file) {
      this._file.write('HTTP', `${method} ${url} ${status} ${ms}ms`, data);
    }
  }

  // ── Express / NestJS / Fastify middleware ──────────────────────────────────

  /**
   * HTTP request logger middleware
   * app.use(logger.middleware())
   */
  middleware() {
    return (req, res, next) => {
      const start = Date.now();
      res.on('finish', () => {
        this.http(req.method, req.originalUrl || req.url, res.statusCode, Date.now() - start, {
          ip: req.ip || req.connection?.remoteAddress,
        });
      });
      next();
    };
  }

  // ── Utility ────────────────────────────────────────────────────────────────

  setLevel(level) {
    this.config.minLevel = level;
    this.info(`Log level → ${level}`);
  }

  files() {
    if (!this._file) return this.warn('File logging is disabled');
    const list = this._file.list();
    if (list.length === 0) return this.info('No log files yet');

    console.log(paint('\n  Log Files:\n', c.bold));
    list.forEach(f => {
      console.log(
        `  ${paint('●', c.cyan)}  ${f.name.padEnd(45)} ${paint(f.sizeKB + ' KB', c.gray)}`
      );
    });
    console.log('');
    return list;
  }

  clearFiles() {
    if (!this._file) return;
    const n = this._file.clear();
    this.success(`Cleared ${n} log files`);
  }

  // ── Auto error capture ─────────────────────────────────────────────────────

  _registerErrorHandlers() {
    process.on('uncaughtException', (err) => {
      this.error('Uncaught Exception — process will exit', err);
      process.exit(1);
    });

    process.on('unhandledRejection', (reason) => {
      this.error('Unhandled Promise Rejection', {
        reason: reason instanceof Error ? reason : String(reason),
      });
    });
  }

  // ── Startup banner ─────────────────────────────────────────────────────────

  _banner() {
    const env       = isProduction() ? 'production' : 'development';
    const fileInfo  = this._file
      ? paint('file → ' + (this.config.fileOptions.dir || '~/.glowlog/logs'), c.brightGreen)
      : paint('file off', c.gray);
    const svrless   = isServerless() ? paint(' | serverless', c.yellow) : '';
    const redactInfo = this.config.redact ? paint('redact on', c.brightGreen) : paint('redact off', c.gray);

    console.log('');
    console.log(
      paint('  ◆ glowlog ', c.bold, c.brightCyan) +
      paint(`[${this.config.name}]`, c.cyan) + '  ' +
      paint(`env: ${env}`, c.gray) + '  ' +
      fileInfo + '  ' +
      redactInfo + svrless
    );
    console.log(paint('  ' + '─'.repeat(60), c.gray));
    console.log('');
  }
}
