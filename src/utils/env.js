export const isBrowser = typeof window !== 'undefined' && typeof window.document !== 'undefined';
export const isNode    = !isBrowser;
export const getEnv    = () => (isNode && process.env.NODE_ENV) || 'development';
export const isProd    = () => getEnv() === 'production';
export const isServerless = () => isNode && !!(
  process.env.AWS_LAMBDA_FUNCTION_NAME || process.env.VERCEL ||
  process.env.NETLIFY || process.env.CF_PAGES
);
