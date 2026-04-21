# glowlog ◆

> Beautiful box-style colorful logger for **Node.js** and **Browser**.  
> Zero dependencies. One package replaces Winston + pino-pretty + morgan + redaction + correlation IDs.

```
  ╔══════════════════════════════════════════════════════════════╗
  ║ ✗  ERROR                                                     ║
  ╠══════════════════════════════════════════════════════════════╣
  ║ Date    : Tuesday, 21 April 2026  9:15:42 AM                 ║
  ║ Message : Database connection failed                         ║
  ╠══════════════════════════════════════════════════════════════╣
  ║ error   : ECONNREFUSED: Connection refused 127.0.0.1:5432    ║
  ║   hint  → Could not connect — is the server/database running?║
  ╚══════════════════════════════════════════════════════════════╝
```

---

## Install

```bash
npm install glowlog
```

---

## Setup in 30 seconds

```bash
npx glowlog init
```

Asks **3 questions** → writes `glowlog.config.json`. Done.

---

## Quick Start

```js
import { GlowLogger } from 'glowlog';

const logger = new GlowLogger();

logger.info('Server started', { port: 3000 });
logger.success('User registered', { userId: 'u_001' });
logger.warn('Rate limit close', { used: 95, limit: 100 });
logger.error('DB failed', new Error('ECONNREFUSED'));
logger.debug('Query ran', { ms: 12, rows: 47 });
logger.http('POST', '/api/login', 200, 123);
```

---

## What It Looks Like

**INFO / SUCCESS / DEBUG** → single border, level color

```
  ┌──────────────────────────────────────────────────────────────┐
  │ ●  INFO                                                      │
  ├──────────────────────────────────────────────────────────────┤
  │ Date    : Tuesday, 21 April 2026  9:15:42 AM                 │
  │ Message : Server started                                     │
  ├──────────────────────────────────────────────────────────────┤
  │ port    : 3000                                               │
  └──────────────────────────────────────────────────────────────┘
```

**WARN / ERROR** → double border, prominent

```
  ╔══════════════════════════════════════════════════════════════╗
  ║ ⚠  WARNING                                                   ║
  ╠══════════════════════════════════════════════════════════════╣
  ║ Date    : Tuesday, 21 April 2026  9:15:42 AM                 ║
  ║ Message : Rate limit approaching                             ║
  ╠══════════════════════════════════════════════════════════════╣
  ║ used    : 95                                                 ║
  ║ limit   : 100                                                ║
  ╚══════════════════════════════════════════════════════════════╝
```

**Browser** → CSS-styled grouped console output — same API, auto-detected.

---

## Features

| Feature | Details |
|---|---|
| **6 Log Levels** | INFO, SUCCESS, WARN, ERROR, DEBUG, HTTP |
| **Box-style output** | Single border (info/debug), double border (warn/error) |
| **Browser support** | CSS-styled console groups, same import |
| **Auto-redaction** | password, token, apiKey, aadhaar, SSN, credit card — zero config |
| **Request ID** | AsyncLocalStorage — auto threads ID through all logs in a request |
| **File rotation** | Daily, hourly, or size-based — built-in, no extra packages |
| **HTTP middleware** | `app.use(logger.middleware())` for Express/NestJS/Fastify |
| **Error hints** | ECONNREFUSED, ENOENT, 401 etc → plain English explanation |
| **Serverless-safe** | Detects Lambda/Vercel/Netlify, flushes logs before freeze |
| **Production-aware** | Auto-mutes DEBUG+INFO in production |
| **Zero dependencies** | Pure Node.js built-ins only |

---

## Configuration

```js
import { GlowLogger } from 'glowlog';

const logger = new GlowLogger({
  name:           'my-app',    // shown in startup banner
  file:           true,        // save logs to files
  fileOptions: {
    dir:          './logs',
    rotation:     'daily',     // 'daily' | 'hourly' | 'size'
    maxSizeMB:    5,           // only for rotation: 'size'
  },
  redact:         true,        // auto-redact sensitive fields (default: true)
  requestId:      true,        // include request ID in logs (default: true)
  catchErrors:    true,        // capture uncaughtException + unhandledRejection
  productionSafe: true,        // mute DEBUG+INFO in NODE_ENV=production
  silent:         false,       // suppress all output
});
```

---

## Request ID — Thread ID Through Every Log

```js
import { GlowLogger, requestIdMiddleware, withContext } from 'glowlog';

const logger = new GlowLogger();

// Express / NestJS — auto-generates requestId per request
app.use(requestIdMiddleware());
app.use(logger.middleware());

// Every log inside a request automatically shows Req ID:
app.get('/users', (req, res) => {
  logger.info('Fetching users');     // shows: Req ID: req_abc123
  logger.debug('Query executed');    // shows: Req ID: req_abc123
  res.json(users);
});

// For queues, crons, scripts — manual context
await withContext({ requestId: 'job_001' }, async () => {
  logger.info('Processing batch');   // shows: Req ID: job_001
});
```

---

## Auto-Redaction

Works automatically — no config needed:

```js
logger.info('Login', {
  username: 'adarsh',
  password: 'secret123',       // → [REDACTED]
  token:    'eyJhbGci...',     // → [REDACTED]
  ip:       '192.168.1.1',     // → shown (not sensitive)
});
```

Add your own sensitive keys:

```js
import { addSensitiveKey } from 'glowlog';

addSensitiveKey('aadhaarNumber');
addSensitiveKey('panNumber');
```

---

## HTTP Logging

```js
// Express
app.use(logger.middleware());
// Logs every request:
// ⚡ HTTP  POST  /api/login  200  123ms

// Or manually:
logger.http('GET', '/api/users', 200, 45);
```

---

## Presets

```js
import { createDevLogger, createProductionLogger, createNestLogger } from 'glowlog/presets';

// Development — all levels, no file
const logger = createDevLogger('my-app');

// Production — WARN+ only, daily file rotation
const logger = createProductionLogger('my-app', './logs');

// NestJS — implements LoggerService interface
const logger = createNestLogger('NestApp');
app.useLogger(logger);  // drop-in for NestJS
```

---

## Serverless (Lambda / Vercel / Netlify)

```js
import { GlowLogger, withLogFlush } from 'glowlog';

const logger = new GlowLogger();

// Wrap handler — auto-flushes all logs before function exits
export const handler = withLogFlush(async (event) => {
  logger.info('Processing event', { id: event.id });
  return { statusCode: 200 };
});
```

---

## NestJS — Full Setup

```js
// logger.module.ts
import { GlowLogger, requestIdMiddleware } from 'glowlog';
import { createNestLogger } from 'glowlog/presets';

export const glowLogger = new GlowLogger({
  name: 'NestApp',
  file: true,
  fileOptions: { rotation: 'daily' },
  redact: true,
});

// main.ts
app.use(requestIdMiddleware());      // thread request ID
app.use(glowLogger.middleware());    // HTTP logs
app.useLogger(createNestLogger());  // NestJS log service
```

---

## Log Levels

| Level | Icon | Border | Color | When to use |
|---|---|---|---|---|
| `info` | ● | single | cyan | General events |
| `success` | ✓ | single | green | Completed actions |
| `warn` | ⚠ | **double** | yellow | Attention needed |
| `error` | ✗ | **double** | red | Something broke |
| `debug` | ◆ | single | magenta | Dev details |
| `http` | ⚡ | single | blue | HTTP requests |

---

## vs Winston / Pino

| | Winston | Pino | **glowlog** |
|---|---|---|---|
| Packages needed | 6+ | 3+ | **1** |
| Beautiful terminal output | manual setup | needs `pino-pretty` | **built-in** |
| Browser support | ❌ | partial | **✅ full** |
| Auto-redaction | ❌ | manual | **✅ auto** |
| Request ID | 3 packages | manual | **✅ built-in** |
| File rotation | separate package | separate package | **✅ built-in** |
| HTTP middleware | separate package | separate package | **✅ built-in** |
| Serverless-safe | ❌ | partial | **✅ built-in** |
| Zero dependencies | ❌ | ❌ | **✅** |

---

## License

MIT © Adarsh
