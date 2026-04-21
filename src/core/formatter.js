import { c, paint, stripAnsi, LEVEL_CONFIG } from '../utils/colors.js';
import { getCallerInfo } from '../utils/caller.js';
import { formatDate } from '../utils/date.js';

const BOX_WIDTH = 60; // inner content width

// ── Box drawing helpers ───────────────────────────────────────────────────────

function hLine(b, width) {
  return b.h.repeat(width + 2); // +2 for padding
}

function topBorder(b, width, color) {
  return paint(`  ${b.tl}${hLine(b, width)}${b.tr}`, ...color);
}

function bottomBorder(b, width, color) {
  return paint(`  ${b.bl}${hLine(b, width)}${b.br}`, ...color);
}

function midBorder(b, width, color) {
  return paint(`  ${b.lm}${hLine(b, width)}${b.rm}`, ...color);
}

function row(b, content, color) {
  // content is already colored — measure visible length via stripAnsi
  const visible = stripAnsi(content);
  const pad = Math.max(0, BOX_WIDTH - visible.length);
  return paint(`  ${b.v} `, ...color) + content + ' '.repeat(pad) + paint(` ${b.v}`, ...color);
}

// ── Error translator ──────────────────────────────────────────────────────────

const ERROR_MAP = {
  'ECONNREFUSED':    'Could not connect — is the server/database running?',
  'ENOTFOUND':       'Server not found — check the URL or internet connection',
  'ETIMEDOUT':       'Request timed out — server took too long to respond',
  'EACCES':          'Permission denied — may need admin/sudo access',
  'ENOENT':          'File or folder not found — check the path',
  'EADDRINUSE':      'Port already in use — try a different port',
  'MODULE_NOT_FOUND':'Module not found — did you run npm install?',
  '404':             'Not found — resource does not exist',
  '401':             'Unauthorized — check API key or login credentials',
  '403':             'Forbidden — you do not have permission',
  '500':             'Server error — something broke on the server side',
  '503':             'Service unavailable — server is down or overloaded',
  'SyntaxError':     'Syntax error — check for missing brackets or commas',
  'TypeError':       'Wrong data type — a variable has unexpected value',
  'ReferenceError':  'Variable not defined — check for typos',
};

function toSimpleEnglish(error) {
  if (!error) return null;
  const msg = error.message || error.code || String(error);
  for (const [key, val] of Object.entries(ERROR_MAP)) {
    if (msg.includes(key)) return val;
  }
  return null;
}

// ── TERMINAL FORMATTER ────────────────────────────────────────────────────────

export function formatTerminal(level, message, meta = {}, extra = {}) {
  const cfg  = LEVEL_CONFIG[level];
  const b    = cfg.border;
  const col  = cfg.primary;
  const sec  = cfg.secondary;
  const dim  = cfg.dim;
  const date = formatDate();

  const lines = [];
  lines.push(''); // blank line before

  // Top border
  lines.push(topBorder(b, BOX_WIDTH, col));

  // Level header row  —  ⚠  WARNING
  const headerText = `${cfg.icon}  ${cfg.label}`;
  const headerColored = paint(headerText, ...col);
  lines.push(row(b, headerColored, col));

  // Mid divider
  lines.push(midBorder(b, BOX_WIDTH, dim));

  // Date row
  const dateLabel = paint('Date    : ', ...dim);
  const dateVal   = paint(date, ...sec);
  lines.push(row(b, dateLabel + dateVal, col));

  // Message row
  const msgLabel  = paint('Message : ', ...dim);
  const msgVal    = paint(String(message), ...col);
  lines.push(row(b, msgLabel + msgVal, col));

  // File:Line row — auto detected caller
  if (extra.caller) {
    const srcLabel = paint('Source  : ', ...dim);
    const srcVal   = paint(extra.caller.file + ':' + extra.caller.line, ...sec);
    lines.push(row(b, srcLabel + srcVal, col));
  }

  // Request ID if present
  if (extra.requestId) {
    const reqLabel = paint('Req ID  : ', ...dim);
    const reqVal   = paint(extra.requestId, ...sec);
    lines.push(row(b, reqLabel + reqVal, col));
  }

  // Meta section — only if there's actual data
  const metaEntries = Object.entries(meta).filter(([, v]) => v !== undefined && v !== null);

  if (metaEntries.length > 0) {
    lines.push(midBorder(b, BOX_WIDTH, dim));

    for (const [key, val] of metaEntries) {
      const isError = val instanceof Error;
      const displayVal = isError ? val.message : String(val);
      const keyStr = paint((key + ' ').padEnd(8, ' ') + ': ', ...dim);
      const valStr = paint(displayVal, ...cfg.meta);
      lines.push(row(b, keyStr + valStr, col));

      // Error hint
      if (isError) {
        const hint = toSimpleEnglish(val);
        if (hint) {
          const hintKey = paint('  hint'.padEnd(8, ' ') + '  ', ...dim);
          const hintVal = paint('→ ' + hint, '\x1b[33m');
          lines.push(row(b, hintKey + hintVal, col));
        }
        // Stack trace (first 2 lines only)
        if (val.stack) {
          const stackLines = val.stack.split('\n').slice(1, 3);
          for (const sl of stackLines) {
            const stackStr = paint('  ' + sl.trim(), ...dim);
            lines.push(row(b, stackStr, col));
          }
        }
      }
    }
  }

  // HTTP specific extra info
  if (extra.method) {
    lines.push(midBorder(b, BOX_WIDTH, dim));

    // Status color
    let statusCol = dim;
    if (extra.status >= 200 && extra.status < 300) statusCol = ['\x1b[1m', '\x1b[92m'];
    else if (extra.status >= 300 && extra.status < 400) statusCol = ['\x1b[1m', '\x1b[93m'];
    else if (extra.status >= 400) statusCol = ['\x1b[1m', '\x1b[91m'];

    const msCol = extra.ms > 1000 ? ['\x1b[91m'] : extra.ms > 300 ? ['\x1b[93m'] : dim;

    lines.push(row(b, paint('Method  : ', ...dim) + paint(extra.method, '\x1b[1m', '\x1b[94m'), col));
    lines.push(row(b, paint('URL     : ', ...dim) + paint(extra.url, ...sec), col));
    lines.push(row(b, paint('Status  : ', ...dim) + paint(String(extra.status), ...statusCol), col));
    lines.push(row(b, paint('Time    : ', ...dim) + paint(extra.ms + 'ms', ...msCol), col));
  }

  // Bottom border
  lines.push(bottomBorder(b, BOX_WIDTH, col));
  lines.push(''); // blank line after

  return lines.join('\n');
}

// ── BROWSER FORMATTER ─────────────────────────────────────────────────────────
// Returns array of args for console.log(...args)

export function formatBrowser(level, message, meta = {}, extra = {}) {
  const cfg  = LEVEL_CONFIG[level];
  const s    = cfg.browser;
  const date = formatDate();

  const metaEntries = Object.entries(meta).filter(([, v]) => v !== undefined);

  // Line 1: badge + level
  const line1Format = `%c ${cfg.icon} ${cfg.label} %c`;
  const line1Args   = [s.badge, ''];

  // Line 2: date
  const line2Format = `%c  Date    : %c${date}`;
  const line2Args   = [s.meta, s.header];

  // Line 3: message
  const line3Format = `%c  Message : %c${message}`;
  const line3Args   = [s.meta, s.header];

  // Build full format string
  let format = line1Format + '\n' + line2Format + '\n' + line3Format;
  let args   = [...line1Args, ...line2Args, ...line3Args];

  // File:Line
  if (extra.caller) {
    format += `\n%c  Source  : %c${extra.caller.file}:${extra.caller.line}`;
    args.push(s.meta, s.header);
  }

  // Request ID
  if (extra.requestId) {
    format += `\n%c  Req ID  : %c${extra.requestId}`;
    args.push(s.meta, s.header);
  }

  // HTTP info
  if (extra.method) {
    format += `\n%c  ────────────────────────────────────\n%c  ${extra.method}  ${extra.url}  ${extra.status}  ${extra.ms}ms`;
    args.push(s.border, s.header);
  }

  // Meta entries
  if (metaEntries.length > 0) {
    format += `\n%c  ────────────────────────────────────`;
    args.push(s.border);

    for (const [key, val] of metaEntries) {
      const displayVal = val instanceof Error ? val.message : String(val);
      format += `\n%c  ${(key + ' ').padEnd(8)}: %c${displayVal}`;
      args.push(s.meta, s.header);

      if (val instanceof Error) {
        const hint = toSimpleEnglish(val);
        if (hint) {
          format += `\n%c  → ${hint}`;
          args.push('color:#f59e0b;font-size:11px');
        }
      }
    }
  }

  format += `\n%c  ════════════════════════════════════`;
  args.push(s.border);

  return [format, ...args];
}

export { toSimpleEnglish };
