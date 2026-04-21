// Auto-redacted field names (case-insensitive match)
const SENSITIVE_KEYS = new Set([
  'password', 'passwd', 'pass',
  'secret', 'secrets',
  'token', 'accesstoken', 'refreshtoken', 'idtoken',
  'apikey', 'api_key', 'apitoken',
  'authorization', 'auth',
  'cookie', 'cookies',
  'creditcard', 'credit_card', 'cardnumber', 'card_number', 'cvv', 'ccv',
  'ssn', 'aadhaar', 'pan',
  'privatekey', 'private_key',
  'otp', 'pin',
]);

// Patterns that look like sensitive VALUES
const SENSITIVE_PATTERNS = [
  /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/,  // email
  /\b(?:\d{4}[-\s]?){3}\d{4}\b/,                           // credit card
  /Bearer\s+[A-Za-z0-9\-._~+/]+=*/,                        // Bearer token
  /\b[A-Za-z0-9]{20,}\b/,                                   // long tokens (API keys etc.)
];

const REDACTED = '[REDACTED]';

function isKeyName(keyStr) {
  const lower = keyStr.toLowerCase().replace(/[-_\s]/g, '');
  return SENSITIVE_KEYS.has(lower);
}

function isSensitiveValue(val) {
  if (typeof val !== 'string') return false;
  // Don't flag short strings — avoids false positives
  if (val.length < 8) return false;
  return SENSITIVE_PATTERNS.some(p => p.test(val));
}

export function redactObject(obj, depth = 0) {
  if (depth > 5) return obj; // avoid infinite recursion
  if (!obj || typeof obj !== 'object') return obj;
  if (obj instanceof Error) return obj;
  if (Array.isArray(obj)) return obj.map(v => redactObject(v, depth + 1));

  const result = {};
  for (const [key, val] of Object.entries(obj)) {
    if (isKeyName(key)) {
      result[key] = REDACTED;
    } else if (typeof val === 'object' && val !== null) {
      result[key] = redactObject(val, depth + 1);
    } else if (isSensitiveValue(val)) {
      result[key] = REDACTED;
    } else {
      result[key] = val;
    }
  }
  return result;
}

export function redactMessage(message) {
  if (typeof message !== 'string') return message;
  let result = message;
  for (const pattern of SENSITIVE_PATTERNS) {
    result = result.replace(new RegExp(pattern.source, pattern.flags + (pattern.flags.includes('g') ? '' : 'g')), REDACTED);
  }
  return result;
}

// Add custom sensitive keys at runtime
export function addSensitiveKey(key) {
  SENSITIVE_KEYS.add(key.toLowerCase().replace(/[-_\s]/g, ''));
}
