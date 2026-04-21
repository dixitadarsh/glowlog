import fs   from 'fs';
import path from 'path';
import os   from 'os';
import { stripAnsi } from '../utils/colors.js';
import { formatISO } from '../utils/date.js';

function pad(n) { return String(n).padStart(2, '0'); }

function getFilename(rotation, dir, prefix) {
  const now  = new Date();
  const date = `${now.getFullYear()}-${pad(now.getMonth()+1)}-${pad(now.getDate())}`;
  const hour = `${date}_${pad(now.getHours())}h`;

  const name = rotation === 'hourly' ? `${prefix}-${hour}.log`
             : rotation === 'daily'  ? `${prefix}-${date}.log`
             :                         `${prefix}-current.log`;

  return path.join(dir, name);
}

export class FileTransport {
  constructor(opts = {}) {
    this.dir      = opts.dir        || path.join(os.homedir(), '.glowlog', 'logs');
    this.prefix   = opts.prefix     || 'glowlog';
    this.rotation = opts.rotation   || 'daily';
    this.maxSizeMB = opts.maxSizeMB || 5;
    this.enabled  = opts.enabled !== false;

    if (this.enabled) {
      if (!fs.existsSync(this.dir)) fs.mkdirSync(this.dir, { recursive: true });
    }
  }

  _file() { return getFilename(this.rotation, this.dir, this.prefix); }

  _shouldRotate(file) {
    if (this.rotation !== 'size') return false;
    if (!fs.existsSync(file)) return false;
    return fs.statSync(file).size > this.maxSizeMB * 1024 * 1024;
  }

  _rotateSize(file) {
    const now = new Date();
    const ts  = `${now.getFullYear()}-${pad(now.getMonth()+1)}-${pad(now.getDate())}_${pad(now.getHours())}-${pad(now.getMinutes())}`;
    fs.renameSync(file, path.join(this.dir, `${this.prefix}-${ts}.log`));
  }

  write(level, message, meta = {}) {
    if (!this.enabled) return;
    try {
      const file = this._file();
      if (this._shouldRotate(file)) this._rotateSize(file);

      const cleanMeta = {};
      for (const [k, v] of Object.entries(meta)) {
        cleanMeta[k] = v instanceof Error ? `${v.message} (${v.code || 'no code'})` : v;
      }

      const line = JSON.stringify({
        timestamp: formatISO(),
        level,
        message: stripAnsi(String(message)),
        ...cleanMeta,
      }) + '\n';

      fs.appendFileSync(file, line, 'utf8');
    } catch { /* non-fatal */ }
  }

  list() {
    if (!fs.existsSync(this.dir)) return [];
    return fs.readdirSync(this.dir)
      .filter(f => f.endsWith('.log'))
      .map(f => ({
        name: f,
        path: path.join(this.dir, f),
        sizeKB: (fs.statSync(path.join(this.dir, f)).size / 1024).toFixed(1),
      }));
  }

  clear() {
    const files = this.list();
    files.forEach(f => fs.unlinkSync(f.path));
    return files.length;
  }

  get storePath() { return this.dir; }
}
