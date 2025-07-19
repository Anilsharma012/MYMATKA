// client/fetchWrapper.js
import BASE_URL from "./config";

const originalFetch = window.fetch;

window.fetch = async (input, init = {}) => {
  // For API calls, let them go through as-is
  // In development: Vite proxy handles routing to backend
  // In production/preview: Same origin serves both frontend and backend
  return originalFetch(input, init);
};
