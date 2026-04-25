import { isBrowser, isNode, isProd }                   from '../utils/env.js';
import { paint, c, LEVELS }                             from '../utils/colors.js';
import { getCallerInfo }                                from '../utils/caller.js';
import { renderBox, renderLine, renderCompact, renderMinimal, renderBrowser, renderBanner } from '../core/formatter.js';
import { redactObject, redactMessage }                  from '../plugins/redact.js';
import { getRequestId }                                 from '../plugins/request.js';
import { FileTransport }                                from '../transports/file.js';

const PRIORITY = { DEBUG:0, INFO:1, HTTP:2, SUCCESS:3, WARN:4, ERROR:5 };

export class GlowLogger {
  /**
   * @param {object} config
   *
   * STYLE
   * @param {'box'|'line'|'compact'|'minimal'} config.style   - display style (default: 'box')
   * @param {0|1|2}   config.spacing                          - blank lines between logs (default: 1)
   * @param {string}  config.timeFormat                       - 'HH:MM:SS' | 'HH:MM' | 'DD Mon HH:MM:SS' | 'ISO' | false
   *
   * SHOW/HIDE
   * @param {object}  config.show
   * @param {boolean} config.show.timestamp   - show time (default: true)
   * @param {boolean} config.show.date        - show full date (default: false)
   * @param {boolean} config.show.source      - show file:line (default: true)
   * @param {boolean} config.show.label       - show INFO/ERROR etc (default: true)
   * @param {boolean} config.show.icon        - show ● ✓ ⚠ ✗ (default: true)
   * @param {boolean} config.show.requestId   - show req ID (default: true)
   * @param {boolean} config.show.meta        - show extra data (default: true)
   * @param {boolean} config.show.hint        - show error hints (default: true)
   * @param {boolean} config.show.stack       - show stack trace (default: false)
   * @param {boolean} config.show.divider     - show divider lines in box (default: true)
   *
   * FILE
   * @param {boolean} config.file             - enable file logging (default: false)
   * @param {object}  config.fileOptions
   * @param {string}  config.fileOptions.dir          - './logs'
   * @param {string}  config.fileOptions.rotation     - 'daily'|'hourly'|'size'|'none'
   * @param {number}  config.fileOptions.maxSizeMB    - 10
   * @param {number}  config.fileOptions.maxFiles     - 7 (auto-delete old)
   * @param {boolean} config.fileOptions.compress     - gzip old files (default: true)
   * @param {'text'|'json'} config.fileOptions.format - file format
   * @param {boolean} config.fileOptions.separate     - separate error.log
   *
   * FEATURES
   * @param {boolean} config.redact           - auto-redact sensitive fields (default: true)
   * @param {boolean} config.requestId        - include request ID (default: true)
   * @param {boolean} config.catchErrors      - capture uncaught errors (default: true)
   * @param {boolean} config.productionSafe   - mute DEBUG+INFO in prod (default: true)
   * @param {object}  config.sampling         - { INFO: 0.1, DEBUG: 0.05, ... }
   * @param {string}  config.name             - app name for banner
   * @param {boolean} config.silent           - suppress all output
   */
  constructor(config = {}) {
    this.cfg = {
      style:          config.style         || 'box',
      spacing:        config.spacing       ?? 1,
      timeFormat:     config.timeFormat    ?? 'HH:MM:SS',
      show:           { timestamp:true, source:true, label:true, icon:true,
                        requestId:true, meta:true, hint:true, stack:false, divider:true,
                        ...(config.show || {}) },
      file:           config.file          === true,
      fileOptions:    config.fileOptions   || {},
      redact:         config.redact        !== false,
      requestId:      config.requestId     !== false,
      catchErrors:    config.catchErrors   !== false,
      productionSafe: config.productionSafe !== false,
      sampling:       config.sampling      || null,
      name:           config.name          || 'app',
      silent:         config.silent        || false,
      minLevel:       config.minLevel      || 'DEBUG',
      _module:        config._module       || null,   // child logger module name
    };

    // Production: auto-raise level
    if (isProd() && this.cfg.productionSafe && ['DEBUG','INFO'].includes(this.cfg.minLevel)) {
      this.cfg.minLevel = 'WARN';
    }

    // File transport
    this._file = null;
    if (this.cfg.file === true && isNode) {
      this._file = new FileTransport({
        ...this.cfg.fileOptions,
        enabled: true,
        prefix: this.cfg.fileOptions.prefix || this.cfg.name,
      });
    }

    // Auto-capture errors
    if (this.cfg.catchErrors && isNode) this._registerHandlers();

    // Startup banner
    if (!isProd() && isNode && !this.cfg.silent) this._printBanner();
  }

  // ── Sampling check ────────────────────────────────────────────────────────

  _shouldSample(level) {
    if (!this.cfg.sampling) return true;
    const rate = this.cfg.sampling[level] ?? 1.0;
    return Math.random() < rate;
  }

  _shouldLog(level) {
    return PRIORITY[level] >= PRIORITY[this.cfg.minLevel] && this._shouldSample(level);
  }

  // ── Core render ───────────────────────────────────────────────────────────

  _log(level, message, meta = {}) {
    if (this.cfg.silent || !this._shouldLog(level)) return;

    let msg  = message;
    let data = meta;

    if (this.cfg.redact) {
      msg  = redactMessage(String(msg));
      data = redactObject(data);
    }

    const extra = {};
    const caller = getCallerInfo();
    if (caller) extra.caller = caller;
    if (this.cfg.requestId && isNode) {
      const rid = getRequestId();
      if (rid) extra.requestId = rid;
    }
    if (this.cfg._module) extra.module = this.cfg._module;

    if (isBrowser) {
      const args = renderBrowser(level, msg, data, extra, this.cfg);
      if (level === 'ERROR')      console.error(...args);
      else if (level === 'WARN')  console.warn(...args);
      else if (level === 'DEBUG') console.debug(...args);
      else                        console.log(...args);
    } else {
      const rendered = this._render(level, msg, data, extra);
      if (level === 'ERROR')      console.error(rendered);
      else if (level === 'WARN')  console.warn(rendered);
      else                        console.log(rendered);
    }

    if (this._file) this._file.write(level, msg, data);
  }

  _render(level, msg, data, extra) {
    switch (this.cfg.style) {
      case 'line':    return renderLine(level, msg, data, extra, this.cfg);
      case 'compact': return renderCompact(level, msg, data, extra, this.cfg);
      case 'minimal': return renderMinimal(level, msg, data, extra, this.cfg);
      default:        return renderBox(level, msg, data, extra, this.cfg);
    }
  }

  // ── Public log methods ────────────────────────────────────────────────────

  info(message, meta = {})    { this._log('INFO',    message, meta); }
  success(message, meta = {}) { this._log('SUCCESS', message, meta); }
  warn(message, meta = {})    { this._log('WARN',    message, meta); }
  debug(message, meta = {})   { this._log('DEBUG',   message, meta); }

  error(message, errOrMeta = {}) {
    let meta = {};
    if (errOrMeta instanceof Error) {
      meta = { error: errOrMeta, message: errOrMeta.message, ...(errOrMeta.code ? { code: errOrMeta.code } : {}) };
    } else {
      meta = errOrMeta;
    }
    this._log('ERROR', message, meta);
  }

  // ── HTTP ──────────────────────────────────────────────────────────────────

  http(method, url, status, ms, meta = {}) {
    if (!this._shouldLog('HTTP')) return;
    const extra = { method, url, status, ms };
    const caller = getCallerInfo();
    if (caller) extra.caller = caller;
    if (this.cfg.requestId && isNode) {
      const rid = getRequestId();
      if (rid) extra.requestId = rid;
    }

    const rendered = isBrowser
      ? renderBrowser('HTTP', 'HTTP Request', meta, extra, this.cfg)
      : this._render('HTTP', 'HTTP Request', meta, extra);

    if (isBrowser) console.log(...rendered);
    else console.log(rendered);

    if (this._file) this._file.write('HTTP', `${method} ${url} ${status} ${ms}ms`, meta);
  }

  // ── Middleware ────────────────────────────────────────────────────────────

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

  // ── Child logger ──────────────────────────────────────────────────────────

  /**
   * Create a child logger for a specific module
   * const dbLogger = logger.child('database')
   * dbLogger.info('Query ran') // → [database] Query ran
   */
  child(moduleName) {
    return new GlowLogger({ ...this.cfg, _module: moduleName, catchErrors: false });
  }

  // ── Utility ───────────────────────────────────────────────────────────────

  setLevel(level)  { this.cfg.minLevel = level; this.info(`Log level → ${level}`); }
  setStyle(style)  { this.cfg.style = style; }
  setSpacing(n)    { this.cfg.spacing = n; }

  banner(text) { if (isNode && !this.cfg.silent) console.log(renderBanner(text)); }

  files() {
    if (!this._file) return this.warn('File logging is disabled');
    const list = this._file.list();
    if (!list.length) return this.info('No log files yet');
    console.log(paint('\n  Log Files:\n', c.bold));
    list.forEach(f => console.log(`  ${paint('●', c.cyan)}  ${f.name.padEnd(50)} ${paint(f.sizeKB + ' KB', c.gray)}`));
    console.log('');
    return list;
  }

  clearFiles() {
    if (!this._file) return;
    this.success(`Cleared ${this._file.clear()} log files`);
  }

  // ── Error capture ─────────────────────────────────────────────────────────

  _registerHandlers() {
    process.on('uncaughtException',  err => { this.error('Uncaught Exception', err); process.exit(1); });
    process.on('unhandledRejection', reason => {
      this.error('Unhandled Rejection', reason instanceof Error ? reason : { reason: String(reason) });
    });
  }

  // ── Startup banner ────────────────────────────────────────────────────────

  _printBanner() {
    const env      = isProd() ? 'production' : 'development';
    const fileInfo = this._file ? paint('file → ' + (this.cfg.fileOptions.dir || '~/.glowlog/logs'), c.bGreen) : paint('file off', c.gray);
    console.log('');
    console.log(
      paint('  ◆ glowlog ', c.bold, c.bCyan) +
      paint(`[${this.cfg.name}]`, c.cyan) + '  ' +
      paint(`style:${this.cfg.style}`, c.gray) + '  ' +
      paint(`env:${env}`, c.gray) + '  ' +
      fileInfo
    );
    console.log(paint('  ' + '─'.repeat(60), c.gray));
    console.log('');
  }
}
