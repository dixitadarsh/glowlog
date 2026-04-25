# ◆ glowlog

> **The last Node.js logger you'll ever need.**
> Beautiful. Configurable. Zero dependencies.

[![npm version](https://img.shields.io/npm/v/glowlog?color=39d0d8&labelColor=0d1117&style=flat-square)](https://www.npmjs.com/package/glowlog)
[![npm downloads](https://img.shields.io/npm/dm/glowlog?color=3ddc84&labelColor=0d1117&style=flat-square)](https://www.npmjs.com/package/glowlog)
[![License: MIT](https://img.shields.io/badge/license-MIT-f0c429?labelColor=0d1117&style=flat-square)](LICENSE)
[![Zero deps](https://img.shields.io/badge/dependencies-0-c678dd?labelColor=0d1117&style=flat-square)](package.json)

```
  ┌──────────────────────────────────────────────────────────────┐
  │ ●  INFO                                                      │
  ├──────────────────────────────────────────────────────────────┤
  │ Time     : 09:15:42                                          │
  │ Message  : Server started                                    │
  │ Source   : server.js:12                                      │
  ├──────────────────────────────────────────────────────────────┤
  │ port     : 3000                                              │
  │ env      : development                                       │
  └──────────────────────────────────────────────────────────────┘

  ╔══════════════════════════════════════════════════════════════╗
  ║ ✗  ERROR                                                     ║
  ╠══════════════════════════════════════════════════════════════╣
  ║ Time     : 09:15:45                                          ║
  ║ Message  : DB connection failed                              ║
  ╠══════════════════════════════════════════════════════════════╣
  ║ error    : ECONNREFUSED: 127.0.0.1:5432                      ║
  ║   → Could not connect — is the server/database running?      ║
  ╚══════════════════════════════════════════════════════════════╝
```

---

## 📦 Why glowlog?

| What you used to install | With glowlog |
|---|---|
| `winston` + `winston-daily-rotate-file` + `morgan` + `pino-pretty` + `cls-hooked` + redaction lib | `glowlog` |
| 6 packages, 200KB+ | **1 package, ~17KB** |

---

## 🚀 Install

```bash
npm install glowlog
```

**Setup wizard (optional):**
```bash
npx glowlog init
```
Asks 4 questions → generates `glowlog.config.json`. Done.

---

## ⚡ Quick Start

```js
import { GlowLogger } from 'glowlog';

const logger = new GlowLogger();

logger.info('Server started', { port: 3000 });
logger.success('User registered', { userId: 'u_001' });
logger.warn('Rate limit', { used: 95, limit: 100 });
logger.error('DB failed', new Error('ECONNREFUSED'));
logger.debug('Query ran', { ms: 12, rows: 47 });
logger.http('POST', '/api/login', 200, 123);
```

---

## 🎨 4 Display Styles

### `box` — Full bordered boxes (default, great for development)

```
  ┌──────────────────────────────────────────┐     ╔══════════════════════════════════════════╗
  │ ●  INFO                                  │     ║ ⚠  WARNING                               ║
  ├──────────────────────────────────────────┤     ╠══════════════════════════════════════════╣
  │ Time    : 09:15:42                       │     ║ Time    : 09:15:44                        ║
  │ Message : Server started                 │     ║ Message : Rate limit approaching          ║
  └──────────────────────────────────────────┘     ╚══════════════════════════════════════════╝
```

INFO/SUCCESS/DEBUG = **single border** · WARN/ERROR = **double border**

### `line` — Separator lines (staging / readable)

```
  ──────────────────────────────────────────────────
  ● INFO  09:15:42  server.js:12
    → Server started  port=3000
  ──────────────────────────────────────────────────
```

### `compact` — One line per log (production)

```
  ● 09:15:42  INFO     → Server started  port=3000
  ✓ 09:15:43  SUCCESS  → User registered  userId=u_001
  ⚠ 09:15:44  WARN     → Rate limit  used=95  limit=100
  ✗ 09:15:45  ERROR    → DB failed  error=ECONNREFUSED  → Is your DB running?
```

### `minimal` — Icon + message only (CI / scripts)

```
  ●  Server started
  ✓  User registered
  ⚠  Rate limit approaching
  ✗  DB failed  → Is your DB running?
```

---

## ⚙️ Full Config

```js
const logger = new GlowLogger({

  // ── DISPLAY ──────────────────────────────────────────────────
  style:      'box',        // 'box' | 'line' | 'compact' | 'minimal'
  spacing:    1,            //  0 | 1 | 2  blank lines between logs
  timeFormat: 'HH:MM:SS',  // 'HH:MM' | 'DD Mon HH:MM:SS' | 'ISO' | false

  // ── SHOW / HIDE FIELDS ────────────────────────────────────────
  show: {
    timestamp: true,   // time value
    source:    true,   // file:line  (auto-detected!)
    label:     true,   // INFO / ERROR / WARN label
    icon:      true,   // ● ✓ ⚠ ✗ ◆ ⚡
    requestId: true,   // req ID from AsyncLocalStorage
    meta:      true,   // extra key:value data
    hint:      true,   // plain English error hints
    stack:     false,  // stack trace lines
    divider:   true,   // separator lines inside box
  },

  // ── FILE LOGGING ──────────────────────────────────────────────
  file: true,
  fileOptions: {
    dir:       './logs',   // where to store logs
    rotation:  'daily',   // 'daily' | 'hourly' | 'size' | 'none'
    maxSizeMB: 10,         // size-based rotation limit
    maxFiles:  7,          // auto-delete files older than N
    compress:  true,       // gzip old files automatically
    format:    'json',     // 'text' | 'json'
    separate:  true,       // separate error.log file
  },

  // ── FEATURES ─────────────────────────────────────────────────
  redact:         true,    // auto-redact passwords, tokens, API keys
  requestId:      true,    // thread req ID via AsyncLocalStorage
  catchErrors:    true,    // capture uncaughtException + unhandledRejection
  productionSafe: true,    // mute DEBUG+INFO in NODE_ENV=production

  // Log sampling — only log X% in production
  sampling: {
    INFO:    0.1,   // 10% of INFO logs
    DEBUG:   0.05,  // 5% of DEBUG logs
    WARN:    1.0,   // 100% always
    ERROR:   1.0,   // 100% always
  },
});
```

---

## 🕐 Timestamp Formats

```js
timeFormat: 'HH:MM:SS'              // 09:15:42
timeFormat: 'HH:MM'                 // 09:15
timeFormat: 'DD Mon HH:MM:SS'       // 21 Apr 09:15:42
timeFormat: 'DD Month YYYY HH:MM AM'// 21 April 2026  9:15 AM
timeFormat: 'ISO'                   // 2026-04-21T09:15:42.000Z
timeFormat: false                   // hidden completely
```

---

## 👶 Child Loggers

Module-scoped loggers that inherit parent config:

```js
const logger   = new GlowLogger({ style: 'compact' });
const dbLogger = logger.child('database');
const authLog  = logger.child('auth');

dbLogger.info('Query executed', { ms: 45 });
// ● INFO [database]  → Query executed  ms=45

authLog.error('Login failed', { userId: 'u_001' });
// ✗ ERROR [auth]  → Login failed  userId=u_001
```

---

## 🔒 Auto-Redaction

Zero config. Works automatically:

```js
logger.info('Login', {
  username: 'adarsh',
  password: 'secret123',   // → [REDACTED]
  token:    'eyJhbGci...',  // → [REDACTED]
  ip:       '192.168.1.1', // → shown (not sensitive)
});
```

Add your own sensitive keys:

```js
import { addSensitiveKey } from 'glowlog';
addSensitiveKey('aadhaar');
addSensitiveKey('panNumber');
```

---

## 🧵 Request ID Threading

Every log in a request carries the same ID — automatically:

```js
import { GlowLogger, requestIdMiddleware, withContext } from 'glowlog';

const logger = new GlowLogger();

// Express / NestJS
app.use(requestIdMiddleware());
app.use(logger.middleware());

// Manual (queues, crons, scripts)
await withContext({ requestId: 'job_001' }, async () => {
  logger.info('Processing batch');  // → Req ID: job_001
  logger.debug('Step 1 done');     // → Req ID: job_001
});
```

---

## 📁 File Rotation

```
logs/
├── app-2026-04-21.log        ← today (active)
├── app-2026-04-20.log.gz     ← yesterday (compressed)
├── app-2026-04-19.log.gz     ← 2 days ago
├── app-2026-04-18.log.gz     ← 3 days ago
│   ...
└── error-2026-04-21.log      ← separate error log (if separate: true)
```

Files beyond `maxFiles` are **auto-deleted**. Old files are **auto-compressed** to `.gz`.

---

## 🎯 Log Sampling

In high traffic — log only a % of verbose logs:

```js
sampling: {
  DEBUG: 0.05,  // 5% — very sparse
  INFO:  0.1,   // 10% — reduce noise
  WARN:  1.0,   // 100% — always show
  ERROR: 1.0,   // 100% — always show
}
```

---

## 📦 Presets

Zero-config shortcuts for common setups:

```js
import { dev, prod, ci, neat, nest } from 'glowlog/presets';

const logger = dev('app');    // box + all fields + colors
const logger = prod('app');   // compact + json file + gzip + 14 days
const logger = ci('app');     // minimal + no noise
const logger = neat('app');   // line style, middle ground
const nestLog = nest('App');  // NestJS LoggerService compatible
```

### NestJS

```ts
// main.ts
import { nest } from 'glowlog/presets';
import { requestIdMiddleware } from 'glowlog';

app.use(requestIdMiddleware());
app.useLogger(nest('MyApp', './logs'));
```

---

## 🌐 Express Middleware

```js
const logger = new GlowLogger();

// Logs every HTTP request automatically
app.use(requestIdMiddleware());  // thread request ID
app.use(logger.middleware());    // log HTTP requests
```

Output:
```
● 09:15:42  HTTP  POST  /api/login   200  123ms
✗ 09:15:43  HTTP  GET   /api/secret  401    8ms
⚡ 09:15:44  HTTP  POST  /api/payment 500  2341ms  ← red (slow + error)
```

---

## 💡 Plain English Error Hints

No more cryptic Node.js errors:

| Raw Error | glowlog Shows |
|---|---|
| `ECONNREFUSED` | → Could not connect — is the server/database running? |
| `ENOTFOUND` | → Server not found — check the URL or internet |
| `ENOENT` | → File not found — check the path |
| `EADDRINUSE` | → Port already in use — try a different port |
| `401` | → Unauthorized — check API key or credentials |
| `MODULE_NOT_FOUND` | → Did you run npm install? |

---

## 🌐 Browser Support

Same import, auto-detected environment:

```js
import { GlowLogger } from 'glowlog';

const logger = new GlowLogger();
// In Node: beautiful ANSI terminal output
// In Browser: CSS-styled console groups
```

---

## 🔄 Runtime Changes

```js
logger.setLevel('WARN');   // only WARN + ERROR from now
logger.setStyle('compact');// switch style live
logger.setSpacing(0);      // remove spacing

logger.banner('MyApp v2.0'); // print a big banner
logger.files();              // list all log files
logger.clearFiles();         // delete all log files
```

---

## 📊 Log Files Management

```js
logger.files();
// ● app-2026-04-21.log         12.4 KB
// ● app-2026-04-20.log.gz       3.1 KB
// ● error-2026-04-21.log        1.2 KB

logger.clearFiles(); // delete all
```

---

## ⚡ Serverless (Lambda / Vercel / Netlify)

```js
import { GlowLogger, withLogFlush } from 'glowlog';

const logger = new GlowLogger();

// Wrap handler — auto-flushes before function freezes
export const handler = withLogFlush(async (event) => {
  logger.info('Event received', { id: event.id });
  return { statusCode: 200 };
});
```

---

## 📋 All Log Levels

| Method | Icon | Border | Color | When |
|---|---|---|---|---|
| `logger.info()` | ● | single | cyan | General info |
| `logger.success()` | ✓ | single | green | Completed actions |
| `logger.warn()` | ⚠ | **double** | yellow | Needs attention |
| `logger.error()` | ✗ | **double** | red | Something broke |
| `logger.debug()` | ◆ | single | magenta | Dev details |
| `logger.http()` | ⚡ | single | blue | HTTP requests |

---

## 🏆 vs Winston / Pino

| | Winston | Pino | **glowlog** |
|---|---|---|---|
| Packages needed | 6+ | 3+ | **1** |
| Beautiful terminal | manual | needs pino-pretty | **built-in** |
| Browser support | ❌ | partial | **✅** |
| Auto-redaction | ❌ | manual | **✅ zero config** |
| Request ID | 3 packages | manual | **✅ built-in** |
| File rotation | separate pkg | separate pkg | **✅ built-in** |
| File compression | ❌ | ❌ | **✅ gzip auto** |
| Child loggers | buggy | ✅ | **✅** |
| Error hints | ❌ | ❌ | **✅** |
| Log sampling | ❌ | ❌ | **✅** |
| Zero dependencies | ❌ | ❌ | **✅** |

---

## 📄 License

MIT © [Adarsh](https://github.com/dixitadarsh)

---

## 🤝 Contributing

Issues, bugs, ideas — all welcome!

- 🐛 [Report a bug](https://github.com/dixitadarsh/glowlog/issues)
- 💡 [Request a feature](https://github.com/dixitadarsh/glowlog/issues)
- 🔀 [Submit a PR](https://github.com/dixitadarsh/glowlog/pulls)

**glowlog is open source and free forever.**
