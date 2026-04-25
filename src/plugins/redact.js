const SENSITIVE_KEYS = new Set([
  'password','passwd','pass','secret','secrets','token','accesstoken',
  'refreshtoken','idtoken','apikey','api_key','apitoken','authorization',
  'auth','cookie','cookies','creditcard','credit_card','cardnumber',
  'cvv','ccv','ssn','aadhaar','pan','privatekey','private_key','otp','pin',
]);

const REDACTED = '[REDACTED]';

function isKey(k) { return SENSITIVE_KEYS.has(k.toLowerCase().replace(/[-_\s]/g,'')); }

export function redactObject(obj, depth = 0) {
  if (depth > 5 || !obj || typeof obj !== 'object') return obj;
  if (obj instanceof Error) return obj;
  if (Array.isArray(obj)) return obj.map(v => redactObject(v, depth+1));
  const result = {};
  for (const [k,v] of Object.entries(obj)) {
    result[k] = isKey(k) ? REDACTED : (typeof v === 'object' && v !== null ? redactObject(v, depth+1) : v);
  }
  return result;
}

export function redactMessage(msg) {
  if (typeof msg !== 'string') return msg;
  return msg.replace(/Bearer\s+[A-Za-z0-9\-._~+/]+=*/g, 'Bearer [REDACTED]');
}

export function addSensitiveKey(key) {
  SENSITIVE_KEYS.add(key.toLowerCase().replace(/[-_\s]/g,''));
}
