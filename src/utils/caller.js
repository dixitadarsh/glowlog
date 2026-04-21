/**
 * Auto-detects caller file name and line number
 * Skips glowlog's own internal files only
 */

// Only skip these specific glowlog-internal files
const SKIP_FILES = [
  'glowlog/src/core/logger.js',
  'glowlog/src/core/formatter.js',
  'glowlog\\src\\core\\logger.js',
  'glowlog\\src\\core\\formatter.js',
  'glowlog/src/utils/caller.js',
  'glowlog\\src\\utils\\caller.js',
  '/node_modules/glowlog/',
  '\\node_modules\\glowlog\\',
];

export function getCallerInfo() {
  const err   = new Error();
  const lines = err.stack?.split('\n') || [];

  for (const line of lines) {
    if (!line.includes('    at ')) continue;                          // not a stack frame
    if (line.includes('getCallerInfo'))  continue;                    // this function itself
    if (line.includes('node:internal'))  continue;                    // node internals
    if (line.includes('node:async'))     continue;                    // async hooks
    if (SKIP_FILES.some(f => line.includes(f))) continue;            // glowlog internals

    // Extract  (filepath:line:col)  or  filepath:line:col
    const match =
      line.match(/\((.+):(\d+):\d+\)/) ||
      line.match(/at (.+):(\d+):\d+/);

    if (!match) continue;

    let filePath = match[1].replace(/^file:\/\/\//,'').replace(/^file:\/\//,'');

    // Windows drive letter fix  C:/...
    filePath = filePath.replace(/^\/([A-Z]:)/, '$1');

    // Show last 2 path segments  e.g.  routes/user.js:42
    const parts    = filePath.replace(/\\/g, '/').split('/');
    const fileName = parts.length > 1
      ? parts.slice(-2).join('/')
      : parts[0];

    return { file: fileName, line: match[2] };
  }

  return null;
}
