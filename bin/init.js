#!/usr/bin/env node
/**
 * glowlog CLI — npx glowlog init
 * Asks only what matters → writes glowlog.config.json
 */
import readline from 'readline';
import fs       from 'fs';
import path     from 'path';

// ── Colors ────────────────────────────────────────────────────────────────────
const R = '\x1b[0m', B = '\x1b[1m';
const cyan   = s => `\x1b[96m${s}${R}`;
const green  = s => `\x1b[92m${s}${R}`;
const yellow = s => `\x1b[93m${s}${R}`;
const gray   = s => `\x1b[90m${s}${R}`;
const bold   = s => `${B}${s}${R}`;

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const ask = q => new Promise(r => rl.question(q, a => r(a.trim())));

async function askYN(question, defaultYes = true) {
  const hint = defaultYes ? gray('[Y/n]') : gray('[y/N]');
  while (true) {
    const a = (await ask(`  ${question} ${hint} `)).toLowerCase();
    if (a === '' ) return defaultYes;
    if (a === 'y' || a === 'yes') return true;
    if (a === 'n' || a === 'no')  return false;
    console.log(yellow('  Enter y or n'));
  }
}

async function askChoice(question, choices, defaultIdx = 0) {
  console.log(`\n  ${question}`);
  choices.forEach((c, i) => {
    const marker = i === defaultIdx ? green('❯') : gray(' ');
    console.log(`  ${marker} ${gray(`${i+1}.`)} ${c.label}${i === defaultIdx ? gray(' (default)') : ''}`);
  });
  while (true) {
    const a = await ask(`\n  ${gray('Choice')} ${gray(`[${defaultIdx+1}]`)}: `);
    if (a === '') return choices[defaultIdx].value;
    const idx = parseInt(a) - 1;
    if (idx >= 0 && idx < choices.length) return choices[idx].value;
    console.log(yellow(`  Enter 1–${choices.length}`));
  }
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  console.clear();
  console.log('');
  console.log(cyan(`  ╔══════════════════════════════════════════╗`));
  console.log(cyan(`  ║`) + bold(`     ◆  glowlog  —  quick setup          `) + cyan(`║`));
  console.log(cyan(`  ╚══════════════════════════════════════════╝`));
  console.log(gray('\n  3 questions. Done.\n'));

  // ── Q1: Environment ─────────────────────────────────────────────────────────
  const env = await askChoice('Where does your app run?', [
    { label: 'Node.js  (Express, NestJS, Fastify, scripts)', value: 'node'    },
    { label: 'Browser  (React, Vue, Angular, Vanilla)',       value: 'browser' },
    { label: 'Both     (monorepo, universal / SSR apps)',     value: 'both'    },
  ]);

  // ── Q2: File logging ────────────────────────────────────────────────────────
  let fileConfig = null;
  if (env !== 'browser') {
    const wantsFile = await askYN('\n  Save logs to files?');
    if (wantsFile) {
      const rotation = await askChoice('Rotate log files:', [
        { label: 'Daily   — one file per day  (recommended)', value: 'daily'  },
        { label: 'Hourly  — one file per hour',               value: 'hourly' },
        { label: 'Size    — new file when size limit reached', value: 'size'   },
      ]);

      let logDir = './logs';
      const customDir = await ask(`\n  ${gray('Log folder')} ${gray('[./logs]')}: `);
      if (customDir) logDir = customDir;

      fileConfig = { dir: logDir, rotation };

      if (rotation === 'size') {
        const mb = await ask(`  ${gray('Max file size MB')} ${gray('[5]')}: `);
        fileConfig.maxSizeMB = parseInt(mb) || 5;
      }
    }
  }

  // ── Q3: Redaction ───────────────────────────────────────────────────────────
  const redact = await askYN('\n  Auto-redact sensitive fields? (passwords, tokens, API keys)', true);

  // ── Done — build config ─────────────────────────────────────────────────────
  const config = {
    env,
    file:           !!fileConfig,
    ...(fileConfig  ? { fileOptions: fileConfig } : {}),
    redact,
    requestId:      env !== 'browser',
    catchErrors:    env !== 'browser',
    productionSafe: true,
  };

  const outPath = path.join(process.cwd(), 'glowlog.config.json');
  fs.writeFileSync(outPath, JSON.stringify(config, null, 2));

  // ── Print result ────────────────────────────────────────────────────────────
  console.log('');
  console.log(green(`  ╔══════════════════════════════════════════╗`));
  console.log(green(`  ║`) + bold(`   ✓  glowlog.config.json  created!      `) + green(`║`));
  console.log(green(`  ╚══════════════════════════════════════════╝`));

  console.log(gray('\n  Config written:'));
  console.log(gray('  ─────────────────────────────────────────'));
  Object.entries(config).forEach(([k, v]) => {
    const val = typeof v === 'object' ? JSON.stringify(v) : String(v);
    console.log(`  ${cyan(k.padEnd(14))} ${gray(val)}`);
  });

  console.log(gray('\n  ─────────────────────────────────────────'));
  console.log(bold('\n  Add to your app:\n'));

  if (env === 'browser') {
    console.log(cyan(`  import { GlowLogger } from 'glowlog';`));
    console.log(cyan(`  import config from './glowlog.config.json' assert { type: 'json' };`));
    console.log(cyan(`  const logger = new GlowLogger(config);\n`));
  } else {
    console.log(cyan(`  import { GlowLogger } from 'glowlog';`));
    console.log(cyan(`  import { createReadStream } from 'fs';`));
    console.log(cyan(`  import config from './glowlog.config.json' assert { type: 'json' };`));
    console.log('');
    console.log(cyan(`  const logger = new GlowLogger(config);\n`));
    console.log(gray(`  logger.info('App started');`));
    console.log(gray(`  logger.error('DB failed', new Error('ECONNREFUSED'));`));
    if (fileConfig) console.log(gray(`  // Logs saved to: ${fileConfig.dir}`));
  }
  console.log('');

  rl.close();
}

main().catch(e => { console.error(e.message); rl.close(); process.exit(1); });
