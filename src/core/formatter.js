import { c, paint, bold, dim, gray, stripAnsi, LEVELS, BORDERS } from '../utils/colors.js';
import { formatTimestamp } from '../utils/date.js';
import { getHint } from '../utils/error-hints.js';

const BOX_W = 58; // inner content width

// ── Helpers ───────────────────────────────────────────────────────────────────

function pad(content, width) {
  const visible = stripAnsi(String(content));
  return content + ' '.repeat(Math.max(0, width - visible.length));
}

function boxRow(b, content, colCodes) {
  return paint(`  ${b.v} `, ...colCodes) + pad(content, BOX_W) + paint(` ${b.v}`, ...colCodes);
}

function hLine(b, w) { return b.h.repeat(w + 2); }
function topLine(b, w, col)  { return paint(`  ${b.tl}${hLine(b,w)}${b.tr}`, ...col); }
function midLine(b, w, col)  { return paint(`  ${b.lm}${hLine(b,w)}${b.rm}`, ...col); }
function botLine(b, w, col)  { return paint(`  ${b.bl}${hLine(b,w)}${b.br}`, ...col); }

function renderMeta(meta, level) {
  if (!meta || typeof meta !== 'object') return [];
  const cfg = LEVELS[level];
  return Object.entries(meta)
    .filter(([,v]) => v !== undefined && v !== null)
    .map(([k, v]) => {
      const isErr = v instanceof Error;
      return { key: k, val: isErr ? v.message : String(v), isErr, errObj: isErr ? v : null };
    });
}

// ── STATUS COLORS for HTTP ────────────────────────────────────────────────────

function httpStatusColor(status) {
  if (status >= 200 && status < 300) return [c.bold, c.bGreen];
  if (status >= 300 && status < 400) return [c.bold, c.bYellow];
  if (status >= 400) return [c.bold, c.bRed];
  return [c.gray];
}

function httpMsColor(ms) {
  if (ms > 1000) return [c.bRed];
  if (ms > 300)  return [c.bYellow];
  return [c.dim, c.gray];
}

// ═══════════════════════════════════════════════════════════════════════════════
// STYLE: BOX
// ═══════════════════════════════════════════════════════════════════════════════

export function renderBox(level, message, meta, extra, cfg) {
  const lvl    = LEVELS[level];
  const bType  = lvl.border;
  const b      = BORDERS[bType];
  const col    = lvl.color;
  const dimCol = lvl.dim;
  const show   = cfg.show || {};
  const lines  = [];
  const ts     = cfg.show?.timestamp !== false ? formatTimestamp(cfg.timeFormat || 'HH:MM:SS') : null;

  lines.push('');
  lines.push(topLine(b, BOX_W, col));

  // Level header
  const iconStr  = show.icon !== false ? paint(`${lvl.icon}  `, ...col) : '';
  const labelStr = show.label !== false ? paint(lvl.label, ...col) : '';
  lines.push(boxRow(b, iconStr + labelStr, col));

  // Divider after header
  if (show.divider !== false) lines.push(midLine(b, BOX_W, dimCol));

  // Timestamp / Date
  if (ts) {
    lines.push(boxRow(b, paint('Time     : ', ...dimCol) + paint(ts, ...col), col));
  }

  // Message
  lines.push(boxRow(b, paint('Message  : ', ...dimCol) + paint(String(message), ...col), col));

  // Source file:line
  if (show.source !== false && extra.caller) {
    lines.push(boxRow(b,
      paint('Source   : ', ...dimCol) + paint(`${extra.caller.file}:${extra.caller.line}`, ...dimCol),
      col
    ));
  }

  // Request ID
  if (show.requestId !== false && extra.requestId) {
    lines.push(boxRow(b,
      paint('Req ID   : ', ...dimCol) + paint(extra.requestId, ...dimCol),
      col
    ));
  }

  // Child module name
  if (extra.module) {
    lines.push(boxRow(b,
      paint('Module   : ', ...dimCol) + paint(extra.module, ...col),
      col
    ));
  }

  // HTTP fields
  if (extra.method) {
    if (show.divider !== false) lines.push(midLine(b, BOX_W, dimCol));
    lines.push(boxRow(b, paint('Method   : ', ...dimCol) + paint(extra.method, c.bold, c.bBlue), col));
    lines.push(boxRow(b, paint('URL      : ', ...dimCol) + paint(extra.url, ...col), col));
    lines.push(boxRow(b, paint('Status   : ', ...dimCol) + paint(String(extra.status), ...httpStatusColor(extra.status)), col));
    lines.push(boxRow(b, paint('Time     : ', ...dimCol) + paint(`${extra.ms}ms`, ...httpMsColor(extra.ms)), col));
  }

  // Meta section
  const metaRows = show.meta !== false ? renderMeta(meta, level) : [];
  if (metaRows.length > 0) {
    if (show.divider !== false) lines.push(midLine(b, BOX_W, dimCol));
    for (const { key, val, isErr, errObj } of metaRows) {
      const keyStr = paint((key + ' ').padEnd(8) + ': ', ...dimCol);
      const valStr = paint(val, ...lvl.color);
      lines.push(boxRow(b, keyStr + valStr, col));

      // Error hint
      if (isErr && show.hint !== false) {
        const hint = getHint(errObj);
        if (hint) lines.push(boxRow(b, paint('  ' + hint, c.yellow), col));
      }

      // Stack trace
      if (isErr && show.stack === true && errObj.stack) {
        errObj.stack.split('\n').slice(1, 3).forEach(sl => {
          lines.push(boxRow(b, paint('  ' + sl.trim(), ...dimCol), col));
        });
      }
    }
  }

  lines.push(botLine(b, BOX_W, col));

  // Spacing
  const space = cfg.spacing ?? 1;
  for (let i = 0; i < space; i++) lines.push('');

  return lines.join('\n');
}

// ═══════════════════════════════════════════════════════════════════════════════
// STYLE: LINE
// ═══════════════════════════════════════════════════════════════════════════════

export function renderLine(level, message, meta, extra, cfg) {
  const lvl  = LEVELS[level];
  const col  = lvl.color;
  const dim_ = lvl.dim;
  const show = cfg.show || {};
  const ts   = show.timestamp !== false ? formatTimestamp(cfg.timeFormat || 'HH:MM:SS') : null;
  const W    = 62;
  const lines = [];

  lines.push(paint('  ' + '─'.repeat(W), ...dim_));

  // Main line: icon  label  time  source  →  message
  let main = '  ';
  if (show.icon  !== false) main += paint(lvl.icon + ' ', ...col);
  if (show.label !== false) main += paint(lvl.label.padEnd(7), ...col) + '  ';
  if (ts)                   main += gray(ts + '  ');
  if (show.source !== false && extra.caller) main += gray(`${extra.caller.file}:${extra.caller.line}  `);
  if (extra.module)         main += gray(`[${extra.module}]  `);
  main += paint('→ ', c.dim) + paint(String(message), ...col);
  lines.push(main);

  // Meta inline
  const metaRows = show.meta !== false ? renderMeta(meta, level) : [];
  if (metaRows.length > 0) {
    let metaLine = '      ';
    for (const { key, val, isErr, errObj } of metaRows) {
      metaLine += gray(key + '=') + paint(val, ...dim_) + '  ';
      if (isErr && show.hint !== false) {
        const hint = getHint(errObj);
        if (hint) metaLine += paint(hint, c.yellow) + '  ';
      }
    }
    lines.push(metaLine);
  }

  // HTTP extra
  if (extra.method) {
    const stCol = httpStatusColor(extra.status);
    const msCol = httpMsColor(extra.ms);
    lines.push(
      '      ' +
      paint(extra.method.padEnd(6), c.bold, c.bBlue) +
      gray(extra.url + '  ') +
      paint(String(extra.status), ...stCol) + '  ' +
      paint(extra.ms + 'ms', ...msCol)
    );
  }

  // Request ID
  if (show.requestId !== false && extra.requestId) {
    lines.push('      ' + gray('req: ') + paint(extra.requestId, ...dim_));
  }

  lines.push(paint('  ' + '─'.repeat(W), ...dim_));

  const space = cfg.spacing ?? 1;
  for (let i = 0; i < space; i++) lines.push('');

  return lines.join('\n');
}

// ═══════════════════════════════════════════════════════════════════════════════
// STYLE: COMPACT  (everything on one line)
// ═══════════════════════════════════════════════════════════════════════════════

export function renderCompact(level, message, meta, extra, cfg) {
  const lvl  = LEVELS[level];
  const col  = lvl.color;
  const show = cfg.show || {};
  const ts   = show.timestamp !== false ? formatTimestamp(cfg.timeFormat || 'HH:MM:SS') : null;

  let line = '  ';
  if (show.icon  !== false) line += paint(lvl.icon + ' ', ...col);
  if (ts)                   line += gray(ts + '  ');
  if (show.label !== false) line += paint(lvl.label.padEnd(7), ...col) + '  ';
  if (show.source !== false && extra.caller) line += gray(`${extra.caller.file}:${extra.caller.line}  `);
  if (extra.module)         line += gray(`[${extra.module}]  `);
  line += paint('→ ', c.dim) + paint(String(message), ...col);

  // HTTP
  if (extra.method) {
    line += '  ' + paint(extra.method, c.bold, c.bBlue) +
            ' ' + gray(extra.url) +
            ' ' + paint(String(extra.status), ...httpStatusColor(extra.status)) +
            ' ' + paint(extra.ms + 'ms', ...httpMsColor(extra.ms));
  }

  // Meta
  if (show.meta !== false) {
    const metaRows = renderMeta(meta, level);
    for (const { key, val, isErr, errObj } of metaRows) {
      line += `  ${gray(key+'=')}${paint(val, ...lvl.dim)}`;
      if (isErr && show.hint !== false) {
        const hint = getHint(errObj);
        if (hint) line += '  ' + paint(hint, c.yellow);
      }
    }
  }

  if (show.requestId !== false && extra.requestId) {
    line += '  ' + gray('req=') + paint(extra.requestId, ...lvl.dim);
  }

  const space = cfg.spacing ?? 0;
  const out = [line];
  for (let i = 0; i < space; i++) out.push('');
  return out.join('\n');
}

// ═══════════════════════════════════════════════════════════════════════════════
// STYLE: MINIMAL  (icon + message only)
// ═══════════════════════════════════════════════════════════════════════════════

export function renderMinimal(level, message, meta, extra, cfg) {
  const lvl = LEVELS[level];
  const show = cfg.show || {};

  let line = '  ';
  if (show.icon !== false) line += paint(lvl.icon + '  ', ...lvl.color);
  line += paint(String(message), ...lvl.color);

  // Errors still show hint in minimal
  if (show.hint !== false && meta) {
    const metaRows = renderMeta(meta, level);
    for (const { isErr, errObj } of metaRows) {
      if (isErr) {
        const hint = getHint(errObj);
        if (hint) line += '  ' + paint(hint, c.yellow);
      }
    }
  }

  const space = cfg.spacing ?? 0;
  const out = [line];
  for (let i = 0; i < space; i++) out.push('');
  return out.join('\n');
}

// ═══════════════════════════════════════════════════════════════════════════════
// BROWSER (CSS styled console groups)
// ═══════════════════════════════════════════════════════════════════════════════

export function renderBrowser(level, message, meta, extra, cfg) {
  const lvl  = LEVELS[level];
  const s    = lvl.browser;
  const show = cfg.show || {};
  const ts   = show.timestamp !== false ? formatTimestamp(cfg.timeFormat || 'HH:MM:SS') : '';

  const badgeStyle = `${s.badge};padding:2px 8px;border-radius:4px;font-weight:700;font-size:11px;letter-spacing:1px`;
  const textStyle  = `${s.text};font-weight:600;font-size:12px`;
  const metaStyle  = `${s.text};font-size:11px;opacity:0.8`;
  const dimStyle   = 'color:gray;font-size:11px';

  let fmt  = `%c ${lvl.icon} ${lvl.label} %c`;
  let args = [badgeStyle, ''];

  if (ts) { fmt += ` %c${ts}%c`; args.push(dimStyle, ''); }
  fmt += ` %c${message}%c`; args.push(textStyle, '');

  if (extra.caller && show.source !== false) {
    fmt += ` %c${extra.caller.file}:${extra.caller.line}%c`;
    args.push(dimStyle, '');
  }

  if (extra.requestId && show.requestId !== false) {
    fmt += `\n%c  req: ${extra.requestId}%c`;
    args.push(metaStyle, '');
  }

  if (extra.method) {
    fmt += `\n%c  ${extra.method} ${extra.url} ${extra.status} ${extra.ms}ms%c`;
    args.push(textStyle, '');
  }

  if (show.meta !== false && meta) {
    const metaRows = renderMeta(meta, level);
    for (const { key, val, isErr, errObj } of metaRows) {
      fmt += `\n%c  ${key}: ${val}%c`;
      args.push(metaStyle, '');
      if (isErr && show.hint !== false) {
        const hint = getHint(errObj);
        if (hint) { fmt += `\n%c  ${hint}%c`; args.push('color:#f59e0b;font-size:11px', ''); }
      }
    }
  }

  return [fmt, ...args];
}

// Banner for startup
export function renderBanner(text, col = ['\x1b[1m','\x1b[96m']) {
  const w = Math.max(text.length + 6, 50);
  return [
    '',
    paint('  ╔' + '═'.repeat(w) + '╗', ...col),
    paint('  ║', ...col) + '  ' + paint(text, '\x1b[1m', '\x1b[96m') + ' '.repeat(w - text.length - 2) + '  ' + paint('║', ...col),
    paint('  ╚' + '═'.repeat(w) + '╝', ...col),
    '',
  ].join('\n');
}
