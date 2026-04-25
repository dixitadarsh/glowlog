const SKIP = ['glowlog/src/','glowlog\\src\\','node_modules/glowlog','node:internal','node:async'];

export function getCallerInfo() {
  const lines = new Error().stack?.split('\n') || [];
  for (const line of lines) {
    if (!line.includes('    at ')) continue;
    if (line.includes('getCallerInfo')) continue;
    if (SKIP.some(s => line.includes(s))) continue;

    const match = line.match(/\((.+):(\d+):\d+\)/) || line.match(/at (.+):(\d+):\d+/);
    if (!match) continue;

    let file = match[1].replace(/^file:\/\/\//,'').replace(/^\/([A-Z]:)/,'$1');
    const parts = file.replace(/\\/g,'/').split('/');
    return { file: parts.slice(-2).join('/'), line: match[2] };
  }
  return null;
}
