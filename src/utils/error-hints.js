const HINTS = {
  'ECONNREFUSED':    '→ Could not connect — is the server/database running?',
  'ENOTFOUND':       '→ Server not found — check the URL or internet connection',
  'ETIMEDOUT':       '→ Request timed out — server took too long to respond',
  'EACCES':          '→ Permission denied — try with admin/sudo access',
  'ENOENT':          '→ File or folder not found — check the path',
  'EADDRINUSE':      '→ Port already in use — try a different port',
  'MODULE_NOT_FOUND':'→ Module not found — did you run npm install?',
  '404':             '→ Not found — resource does not exist',
  '401':             '→ Unauthorized — check API key or credentials',
  '403':             '→ Forbidden — you do not have permission',
  '500':             '→ Server error — something broke on the server side',
  '503':             '→ Service unavailable — server is down or overloaded',
  'SyntaxError':     '→ Syntax error — check for missing brackets or commas',
  'TypeError':       '→ Wrong data type — a variable has unexpected value',
  'ReferenceError':  '→ Variable not defined — check for typos',
};

export function getHint(error) {
  if (!error) return null;
  const msg = error.message || error.code || String(error);
  for (const [key, hint] of Object.entries(HINTS)) {
    if (msg.includes(key)) return hint;
  }
  return null;
}
