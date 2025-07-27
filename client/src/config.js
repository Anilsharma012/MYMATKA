// src/config.js
// Ultra-robust BASE_URL configuration that handles all edge cases

// CRITICAL: For fly.dev deployments, BASE_URL must ALWAYS be empty string (same-origin)
// This prevents localhost URLs from being used in production

let BASE_URL = "";

// Check if we're running in a browser
const isBrowser = typeof window !== 'undefined';
const hostname = isBrowser ? window.location.hostname : '';
const href = isBrowser ? window.location.href : '';

console.log('🔧 Ultra-robust config detection:', {
  isBrowser,
  hostname,
  href,
  NODE_ENV: import.meta.env.MODE,
  DEV: import.meta.env.DEV,
  PROD: import.meta.env.PROD,
  VITE_API_BASE_URL: import.meta.env.VITE_API_BASE_URL
});

// RULE 1: If we're on fly.dev, ALWAYS use same-origin (empty string)
if (isBrowser && hostname.includes('.fly.dev')) {
  BASE_URL = "";
  console.log('🔧 ✅ FLY.DEV DETECTED: Using same-origin (empty string)');
}
// RULE 2: If we're in production mode, use same-origin
else if (import.meta.env.PROD) {
  BASE_URL = "";
  console.log('🔧 ✅ PRODUCTION MODE: Using same-origin (empty string)');
}
// RULE 3: Check for custom environment variable (development only)
else if (import.meta.env.VITE_API_BASE_URL) {
  const envUrl = import.meta.env.VITE_API_BASE_URL;
  // Security check: Never use localhost in production domains
  if (isBrowser && !hostname.includes('localhost') && envUrl.includes('localhost')) {
    console.error('❌ SECURITY: Rejecting localhost URL in non-localhost environment');
    BASE_URL = "";
  } else {
    BASE_URL = envUrl;
    console.log('🔧 Using environment variable BASE_URL:', BASE_URL);
  }
}
// RULE 4: Default to same-origin for all other cases
else {
  BASE_URL = "";
  console.log('🔧 ✅ DEFAULT: Using same-origin (empty string)');
}

// SAFETY CHECK: Never allow localhost URLs in non-localhost environments
if (isBrowser && BASE_URL.includes('localhost') && !hostname.includes('localhost')) {
  console.error('❌ EMERGENCY OVERRIDE: Localhost URL detected in production environment!');
  console.error('   Current hostname:', hostname);
  console.error('   Current BASE_URL:', BASE_URL);
  console.error('   Forcing same-origin...');
  BASE_URL = "";
}

// FINAL CHECK: Log the result
const finalUrl = BASE_URL || '(same-origin)';
console.log('🔧 ✅ FINAL BASE_URL:', finalUrl);

// Additional runtime validation for fly.dev
if (isBrowser && hostname.includes('.fly.dev')) {
  if (BASE_URL !== "") {
    console.error('❌ CRITICAL ERROR: Non-empty BASE_URL in fly.dev environment!');
    console.error('   This will cause network errors. Forcing empty string...');
    BASE_URL = "";
  }
  console.log('🔧 ✅ FLY.DEV VALIDATION PASSED: BASE_URL is empty string');
}

export default BASE_URL;
