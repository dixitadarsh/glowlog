export const c = {
  reset:'\x1b[0m', bold:'\x1b[1m', dim:'\x1b[2m',
  black:'\x1b[30m', red:'\x1b[31m', green:'\x1b[32m', yellow:'\x1b[33m',
  blue:'\x1b[34m', magenta:'\x1b[35m', cyan:'\x1b[36m', white:'\x1b[37m', gray:'\x1b[90m',
  bRed:'\x1b[91m', bGreen:'\x1b[92m', bYellow:'\x1b[93m', bBlue:'\x1b[94m',
  bMagenta:'\x1b[95m', bCyan:'\x1b[96m', bWhite:'\x1b[97m',
};

export const paint  = (t,...codes) => codes.join('') + t + c.reset;
export const bold   = t => paint(t, c.bold);
export const dim    = t => paint(t, c.dim);
export const gray   = t => paint(t, c.gray);
export const stripAnsi = s => s.replace(/\x1b\[[0-9;]*m/g,'');

export const LEVELS = {
  INFO:    { icon:'●', label:'INFO',    color:[c.bold,c.bCyan],    dim:[c.dim,c.cyan],    border:'single', browser:{badge:'background:#0ea5e9;color:#fff',text:'color:#0ea5e9'} },
  SUCCESS: { icon:'✓', label:'SUCCESS', color:[c.bold,c.bGreen],   dim:[c.dim,c.green],   border:'single', browser:{badge:'background:#22c55e;color:#fff',text:'color:#22c55e'} },
  WARN:    { icon:'⚠', label:'WARN',    color:[c.bold,c.bYellow],  dim:[c.dim,c.yellow],  border:'double', browser:{badge:'background:#f59e0b;color:#000',text:'color:#d97706'} },
  ERROR:   { icon:'✗', label:'ERROR',   color:[c.bold,c.bRed],     dim:[c.dim,c.red],     border:'double', browser:{badge:'background:#ef4444;color:#fff',text:'color:#ef4444'} },
  DEBUG:   { icon:'◆', label:'DEBUG',   color:[c.bold,c.bMagenta], dim:[c.dim,c.magenta], border:'single', browser:{badge:'background:#a855f7;color:#fff',text:'color:#a855f7'} },
  HTTP:    { icon:'⚡', label:'HTTP',    color:[c.bold,c.bBlue],    dim:[c.dim,c.blue],    border:'single', browser:{badge:'background:#3b82f6;color:#fff',text:'color:#3b82f6'} },
};

export const BORDERS = {
  single: { tl:'┌',tr:'┐',bl:'└',br:'┘',h:'─',v:'│',lm:'├',rm:'┤' },
  double: { tl:'╔',tr:'╗',bl:'╚',br:'╝',h:'═',v:'║',lm:'╠',rm:'╣' },
  line:   { h:'─' },
};
