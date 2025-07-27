// Ultra-robust BASE_URL configuration for all environments

let BASE_URL = "";

// Check if we're running in a browser
const isBrowser = typeof window !== 'undefined';
const hostname = isBrowser ? window.location.hostname : '';
const href = isBrowser ? window.location.href : '';

console.log('🔧 Config detection:', {
  isBrowser,
  hostname,
  href,
  NODE_ENV: import.meta.env.MODE,
  DEV: import.meta.env.DEV,
  PROD: import.meta.env.PROD,
  VITE_API_BASE_URL: import.meta.env.VITE_API_BASE_URL,
});

// ✅ Rule 1: fly.dev = always same-origin (""), for serverless domains
if (isBrowser && hostname.includes('.fly.dev')) {
  BASE_URL = "";
  console.log('✅ fly.dev detected → using same-origin ("")');
}

// ✅ Rule 2: If in PRODUCTION & env variable provided → use it
else if (import.meta.env.PROD && import.meta.env.VITE_API_BASE_URL) {
  BASE_URL = import.meta.env.VITE_API_BASE_URL;
  console.log('✅ PRODUCTION with VITE_API_BASE_URL:', BASE_URL);
}

// ✅ Rule 3: If in PRODUCTION but no custom URL → use same-origin
else if (import.meta.env.PROD) {
  BASE_URL = "";
  console.log('✅ PRODUCTION fallback → using same-origin ("")');
}

// ✅ Rule 4: In DEVELOPMENT → use VITE_API_BASE_URL if exists
else if (import.meta.env.VITE_API_BASE_URL) {
  const envUrl = import.meta.env.VITE_API_BASE_URL;
  if (isBrowser && !hostname.includes('localhost') && envUrl.includes('localhost')) {
    console.error('❌ SECURITY WARNING: Blocking localhost BASE_URL in non-localhost domain!');
    BASE_URL = "";
  } else {
    BASE_URL = envUrl;
    console.log('✅ DEVELOPMENT with VITE_API_BASE_URL:', BASE_URL);
  }
}

// ✅ Default fallback (safe)
else {
  BASE_URL = "";
  console.log('✅ DEFAULT fallback → using same-origin ("")');
}

// ✅ Safety override: never allow localhost BASE_URL in live site
if (isBrowser && BASE_URL.includes('localhost') && !hostname.includes('localhost')) {
  console.error('❌ EMERGENCY: Localhost BASE_URL in production. Forcing empty string.');
  BASE_URL = "";
}

// ✅ Final log
console.log('✅ FINAL BASE_URL:', BASE_URL || "(same-origin)");

export default BASE_URL;
