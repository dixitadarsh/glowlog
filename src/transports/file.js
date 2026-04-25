import fs   from 'fs';
import path  from 'path';
import os    from 'os';
import zlib  from 'zlib';
import { stripAnsi } from '../utils/colors.js';
import { formatFileDate, formatFileHour } from '../utils/date.js';

const pad = n => String(n).padStart(2,'0');

export class FileTransport {
  constructor(opts = {}) {
    this.enabled    = opts.enabled !== false;
    this.dir        = opts.dir     || path.join(os.homedir(), '.glowlog', 'logs');
    this.prefix     = opts.prefix  || 'glowlog';
    this.rotation   = opts.rotation   || 'daily';   // daily | hourly | size | none
    this.maxSizeMB  = opts.maxSizeMB  || 10;
    this.maxFiles   = opts.maxFiles   || 7;          // auto-delete older than N files
    this.compress   = opts.compress   !== false;     // gzip old files
    this.format     = opts.format     || 'text';     // text | json
    this.separate   = opts.separate   || false;      // separate error.log
  }

  _ensureDir() {
    if (!fs.existsSync(this.dir)) fs.mkdirSync(this.dir, { recursive: true });
  }

  _filename(prefix = this.prefix) {
    const d = new Date();
    if (this.rotation === 'hourly') return `${prefix}-${formatFileHour(d)}.log`;
    if (this.rotation === 'daily')  return `${prefix}-${formatFileDate(d)}.log`;
    if (this.rotation === 'none')   return `${prefix}.log`;
    return `${prefix}-current.log`; // size
  }

  _shouldRotate(file) {
    if (this.rotation !== 'size') return false;
    if (!fs.existsSync(file)) return false;
    return fs.statSync(file).size > this.maxSizeMB * 1024 * 1024;
  }

  _rotateBySize(file) {
    const ts   = new Date();
    const stamp = `${formatFileDate(ts)}_${pad(ts.getHours())}-${pad(ts.getMinutes())}`;
    const dest  = path.join(this.dir, `${this.prefix}-${stamp}.log`);
    fs.renameSync(file, dest);
    if (this.compress) this._compressFile(dest);
  }

  _compressFile(file) {
    const gz  = file + '.gz';
    const inp = fs.createReadStream(file);
    const out = fs.createWriteStream(gz);
    inp.pipe(zlib.createGzip()).pipe(out);
    out.on('finish', () => { try { fs.unlinkSync(file); } catch {} });
  }

  _pruneOldFiles() {
    if (!this.maxFiles || this.maxFiles <= 0) return;
    try {
      const files = fs.readdirSync(this.dir)
        .filter(f => f.startsWith(this.prefix) && (f.endsWith('.log') || f.endsWith('.log.gz')))
        .map(f => ({ name: f, time: fs.statSync(path.join(this.dir, f)).mtimeMs }))
        .sort((a,b) => b.time - a.time);

      files.slice(this.maxFiles).forEach(f => {
        try { fs.unlinkSync(path.join(this.dir, f.name)); } catch {}
      });
    } catch {}
  }

  write(level, message, meta = {}) {
    if (!this.enabled) return;
    try {
      this._ensureDir();
      const file = path.join(this.dir, this._filename());

      if (this._shouldRotate(file)) {
        this._rotateBySize(file);
        this._pruneOldFiles();
        if (this.compress) {
          // compress previous files
          fs.readdirSync(this.dir)
            .filter(f => f.startsWith(this.prefix) && f.endsWith('.log') && f !== path.basename(file))
            .forEach(f => this._compressFile(path.join(this.dir, f)));
        }
      }

      const ts  = new Date().toISOString();
      const msg = stripAnsi(String(message));

      let cleanMeta = {};
      for (const [k,v] of Object.entries(meta)) {
        cleanMeta[k] = v instanceof Error ? `${v.message}${v.code ? ` (${v.code})` : ''}` : v;
      }

      let line;
      if (this.format === 'json') {
        line = JSON.stringify({ ts, level, message: msg, ...cleanMeta }) + '\n';
      } else {
        const metaStr = Object.keys(cleanMeta).length
          ? '  ' + Object.entries(cleanMeta).map(([k,v])=>`${k}=${v}`).join('  ')
          : '';
        line = `[${ts}]  ${level.padEnd(7)}  ${msg}${metaStr}\n`;
      }

      fs.appendFileSync(file, line, 'utf8');

      // Separate error log
      if (this.separate && (level === 'ERROR' || level === 'WARN')) {
        const errFile = path.join(this.dir, this._filename('error'));
        fs.appendFileSync(errFile, line, 'utf8');
      }

    } catch { /* non-fatal */ }
  }

  list() {
    if (!fs.existsSync(this.dir)) return [];
    return fs.readdirSync(this.dir)
      .filter(f => f.startsWith(this.prefix))
      .map(f => ({
        name: f,
        path: path.join(this.dir, f),
        sizeKB: (fs.statSync(path.join(this.dir, f)).size / 1024).toFixed(1),
      }))
      .sort((a,b) => b.name.localeCompare(a.name));
  }

  clear() {
    const files = this.list();
    files.forEach(f => { try { fs.unlinkSync(f.path); } catch {} });
    return files.length;
  }

  get storePath() { return this.dir; }
}
