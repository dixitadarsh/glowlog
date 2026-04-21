export const isBrowser = typeof window !== 'undefined' && typeof window.document !== 'undefined';
export const isNode    = !isBrowser;

export function getEnv() {
  if (isNode && typeof process !== 'undefined') return process.env.NODE_ENV || 'development';
  if (typeof import.meta !== 'undefined' && import.meta.env) return import.meta.env.MODE || 'development';
  return 'development';
}

export function isProduction() { return getEnv() === 'production'; }
export function isDevelopment() { return !isProduction(); }

// Detect serverless environments
export function isServerless() {
  if (!isNode) return false;
  return !!(
    process.env.AWS_LAMBDA_FUNCTION_NAME ||   // AWS Lambda
    process.env.VERCEL ||                      // Vercel
    process.env.NETLIFY ||                     // Netlify
    process.env.CF_PAGES ||                    // Cloudflare Pages
    process.env.FUNCTIONS_EMULATOR            // Firebase
  );
}

export function getServerlessProvider() {
  if (process.env.AWS_LAMBDA_FUNCTION_NAME) return 'lambda';
  if (process.env.VERCEL) return 'vercel';
  if (process.env.NETLIFY) return 'netlify';
  if (process.env.CF_PAGES) return 'cloudflare';
  return 'unknown';
}
