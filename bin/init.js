#!/usr/bin/env node
import readline from 'readline';
import fs from 'fs';

const R='\x1b[0m',B='\x1b[1m';
const cy=s=>`\x1b[96m${s}${R}`, gr=s=>`\x1b[92m${s}${R}`, yw=s=>`\x1b[93m${s}${R}`, dm=s=>`\x1b[90m${s}${R}`, bd=s=>`${B}${s}${R}`;

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const ask = q => new Promise(r => rl.question(q, a => r(a.trim())));

async function askChoice(q, choices, def = 0) {
  console.log(`\n  ${q}`);
  choices.forEach((c,i) => console.log(`  ${i===def?gr('❯'):dm(' ')} ${dm(`${i+1}.`)} ${c.label}${i===def?dm(' (default)'):''}`));
  while (true) {
    const a = await ask(`\n  ${dm('›')} `);
    if (!a) return choices[def].value;
    const i = parseInt(a) - 1;
    if (i >= 0 && i < choices.length) return choices[i].value;
    console.log(yw('  Enter a number'));
  }
}

async function askYN(q, def = true) {
  while (true) {
    const a = (await ask(`  ${q} ${dm(def ? '[Y/n]' : '[y/N]')} `)).toLowerCase();
    if (!a) return def;
    if (a==='y'||a==='yes') return true;
    if (a==='n'||a==='no')  return false;
    console.log(yw('  Enter y or n'));
  }
}

async function main() {
  console.clear();
  console.log('');
  console.log(cy(`  ╔══════════════════════════════════════════════╗`));
  console.log(cy(`  ║`) + bd(`      ◆  glowlog v3  —  setup wizard         `) + cy(`║`));
  console.log(cy(`  ╚══════════════════════════════════════════════╝`));
  console.log(dm('\n  4 questions. Config generated. Done.\n'));

  // Q1: Environment
  const env = await askChoice('Where does your app run?', [
    { label: 'Node.js  — Express, NestJS, Fastify, scripts', value: 'node'    },
    { label: 'Browser  — React, Vue, Angular, Vanilla',      value: 'browser' },
    { label: 'Both     — monorepo, universal, SSR apps',     value: 'both'    },
  ]);

  // Q2: Display style
  const style = await askChoice('Display style?', [
    { label: `box      — ${dm('full bordered boxes per log')}`,          value: 'box'     },
    { label: `line     — ${dm('separator lines, readable')}`,            value: 'line'    },
    { label: `compact  — ${dm('one line per log, clean')}`,              value: 'compact' },
    { label: `minimal  — ${dm('icon + message only')}`,                  value: 'minimal' },
  ]);

  // Q3: File logging (node only)
  let fileConfig = null;
  if (env !== 'browser') {
    const wantsFile = await askYN('\n  Save logs to files?');
    if (wantsFile) {
      const rotation = await askChoice('File rotation?', [
        { label: `daily    — ${dm('new file every day (recommended)')}`,  value: 'daily'  },
        { label: `hourly   — ${dm('new file every hour')}`,               value: 'hourly' },
        { label: `size     — ${dm('new file when size limit reached')}`,   value: 'size'   },
        { label: `none     — ${dm('single file, no rotation')}`,           value: 'none'   },
      ]);

      const dirRaw = await ask(`\n  ${dm('Log folder')} ${dm('[./logs]')}: `);
      const dir    = dirRaw || './logs';

      fileConfig = { dir, rotation, compress: true, maxFiles: 7, format: 'text', separate: false };

      if (rotation === 'size') {
        const mb = await ask(`  ${dm('Max file size MB')} ${dm('[10]')}: `);
        fileConfig.maxSizeMB = parseInt(mb) || 10;
      }

      const wantsSep = await askYN(`  Separate error.log file?`, false);
      fileConfig.separate = wantsSep;
    }
  }

  // Q4: Redaction
  const redact = await askYN('\n  Auto-redact sensitive fields? (passwords, tokens, API keys)');

  // Build config
  const config = {
    env, style,
    spacing: style === 'compact' || style === 'minimal' ? 0 : 1,
    show: {
      timestamp: true,
      source:    env !== 'browser',
      hint:      true,
      stack:     false,
      divider:   style === 'box',
    },
    file:    !!fileConfig,
    ...(fileConfig ? { fileOptions: fileConfig } : {}),
    redact,
    requestId:      env !== 'browser',
    catchErrors:    env !== 'browser',
    productionSafe: true,
  };

  fs.writeFileSync('glowlog.config.json', JSON.stringify(config, null, 2));

  // Print result
  console.log('');
  console.log(gr(`  ╔══════════════════════════════════════════════╗`));
  console.log(gr(`  ║`) + bd(`   ✓  glowlog.config.json  created!          `) + gr(`║`));
  console.log(gr(`  ╚══════════════════════════════════════════════╝`));

  console.log(dm('\n  Your settings:\n'));
  console.log(`  ${cy('environment')}   ${config.env}`);
  console.log(`  ${cy('style')}         ${config.style}`);
  console.log(`  ${cy('file logging')}  ${fileConfig ? gr('yes → ' + fileConfig.dir) : dm('no')}`);
  if (fileConfig) console.log(`  ${cy('rotation')}      ${fileConfig.rotation}${fileConfig.separate ? ' + separate error.log' : ''}`);
  console.log(`  ${cy('redaction')}     ${redact ? gr('on') : dm('off')}`);

  console.log(dm('\n  ──────────────────────────────────────────────'));
  console.log(bd('\n  Add to your app:\n'));
  console.log(cy(`  import { GlowLogger } from 'glowlog';`));
  console.log(cy(`  import cfg from './glowlog.config.json' assert { type: 'json' };`));
  console.log(cy(`  const logger = new GlowLogger(cfg);`));
  console.log('');
  console.log(dm(`  logger.info('App started');`));
  console.log(dm(`  logger.error('Something broke', new Error('ECONNREFUSED'));`));
  if (fileConfig) console.log(dm(`  // Logs saved to: ${fileConfig.dir}`));
  console.log('');

  rl.close();
}

main().catch(e => { console.error(e.message); rl.close(); process.exit(1); });
