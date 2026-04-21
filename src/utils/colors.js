// ── ANSI Terminal Colors ──────────────────────────────────────────────────────
export const c = {
  reset:   '\x1b[0m',
  bold:    '\x1b[1m',
  dim:     '\x1b[2m',

  black:       '\x1b[30m',
  red:         '\x1b[31m',
  green:       '\x1b[32m',
  yellow:      '\x1b[33m',
  blue:        '\x1b[34m',
  magenta:     '\x1b[35m',
  cyan:        '\x1b[36m',
  white:       '\x1b[37m',
  gray:        '\x1b[90m',

  brightRed:     '\x1b[91m',
  brightGreen:   '\x1b[92m',
  brightYellow:  '\x1b[93m',
  brightBlue:    '\x1b[94m',
  brightMagenta: '\x1b[95m',
  brightCyan:    '\x1b[96m',
  brightWhite:   '\x1b[97m',

  bgRed:         '\x1b[41m',
  bgGreen:       '\x1b[42m',
  bgYellow:      '\x1b[43m',
  bgBlue:        '\x1b[44m',
  bgMagenta:     '\x1b[45m',
  bgCyan:        '\x1b[46m',
};

export const paint = (text, ...codes) => codes.join('') + text + c.reset;
export const stripAnsi = str => str.replace(/\x1b\[[0-9;]*m/g, '');

// ── Per-level config ──────────────────────────────────────────────────────────
export const LEVEL_CONFIG = {
  INFO: {
    icon:       '●',
    label:      'INFO',
    border:     { tl:'┌', tr:'┐', bl:'└', br:'┘', h:'─', v:'│', lm:'├', rm:'┤' },
    primary:    ['\x1b[1m', '\x1b[96m'],   // bold + brightCyan
    secondary:  ['\x1b[36m'],              // cyan
    meta:       ['\x1b[96m'],
    dim:        ['\x1b[2m', '\x1b[36m'],
    browser: {
      badge:  'background:#0ea5e9;color:#fff;padding:3px 10px;border-radius:4px;font-weight:700;font-size:12px;letter-spacing:1px',
      header: 'color:#0ea5e9;font-weight:600;font-size:12px',
      meta:   'color:#0ea5e9;font-size:11px',
      border: 'color:#0ea5e9;font-size:11px',
    },
  },
  SUCCESS: {
    icon:       '✓',
    label:      'SUCCESS',
    border:     { tl:'┌', tr:'┐', bl:'└', br:'┘', h:'─', v:'│', lm:'├', rm:'┤' },
    primary:    ['\x1b[1m', '\x1b[92m'],
    secondary:  ['\x1b[32m'],
    meta:       ['\x1b[92m'],
    dim:        ['\x1b[2m', '\x1b[32m'],
    browser: {
      badge:  'background:#22c55e;color:#fff;padding:3px 10px;border-radius:4px;font-weight:700;font-size:12px;letter-spacing:1px',
      header: 'color:#22c55e;font-weight:600;font-size:12px',
      meta:   'color:#22c55e;font-size:11px',
      border: 'color:#22c55e;font-size:11px',
    },
  },
  WARN: {
    icon:       '⚠',
    label:      'WARNING',
    border:     { tl:'╔', tr:'╗', bl:'╚', br:'╝', h:'═', v:'║', lm:'╠', rm:'╣' },
    primary:    ['\x1b[1m', '\x1b[93m'],
    secondary:  ['\x1b[33m'],
    meta:       ['\x1b[93m'],
    dim:        ['\x1b[2m', '\x1b[33m'],
    browser: {
      badge:  'background:#f59e0b;color:#000;padding:3px 10px;border-radius:4px;font-weight:700;font-size:12px;letter-spacing:1px',
      header: 'color:#d97706;font-weight:600;font-size:12px',
      meta:   'color:#d97706;font-size:11px',
      border: 'color:#f59e0b;font-size:11px',
    },
  },
  ERROR: {
    icon:       '✗',
    label:      'ERROR',
    border:     { tl:'╔', tr:'╗', bl:'╚', br:'╝', h:'═', v:'║', lm:'╠', rm:'╣' },
    primary:    ['\x1b[1m', '\x1b[91m'],
    secondary:  ['\x1b[31m'],
    meta:       ['\x1b[91m'],
    dim:        ['\x1b[2m', '\x1b[31m'],
    browser: {
      badge:  'background:#ef4444;color:#fff;padding:3px 10px;border-radius:4px;font-weight:700;font-size:12px;letter-spacing:1px',
      header: 'color:#ef4444;font-weight:600;font-size:12px',
      meta:   'color:#ef4444;font-size:11px',
      border: 'color:#ef4444;font-size:11px',
    },
  },
  DEBUG: {
    icon:       '◆',
    label:      'DEBUG',
    border:     { tl:'┌', tr:'┐', bl:'└', br:'┘', h:'─', v:'│', lm:'├', rm:'┤' },
    primary:    ['\x1b[1m', '\x1b[95m'],
    secondary:  ['\x1b[35m'],
    meta:       ['\x1b[95m'],
    dim:        ['\x1b[2m', '\x1b[35m'],
    browser: {
      badge:  'background:#a855f7;color:#fff;padding:3px 10px;border-radius:4px;font-weight:700;font-size:12px;letter-spacing:1px',
      header: 'color:#a855f7;font-weight:600;font-size:12px',
      meta:   'color:#a855f7;font-size:11px',
      border: 'color:#a855f7;font-size:11px',
    },
  },
  HTTP: {
    icon:       '⚡',
    label:      'HTTP',
    border:     { tl:'┌', tr:'┐', bl:'└', br:'┘', h:'─', v:'│', lm:'├', rm:'┤' },
    primary:    ['\x1b[1m', '\x1b[94m'],
    secondary:  ['\x1b[34m'],
    meta:       ['\x1b[94m'],
    dim:        ['\x1b[2m', '\x1b[34m'],
    browser: {
      badge:  'background:#3b82f6;color:#fff;padding:3px 10px;border-radius:4px;font-weight:700;font-size:12px;letter-spacing:1px',
      header: 'color:#3b82f6;font-weight:600;font-size:12px',
      meta:   'color:#3b82f6;font-size:11px',
      border: 'color:#3b82f6;font-size:11px',
    },
  },
};
