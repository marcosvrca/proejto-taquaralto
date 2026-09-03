type RuntimeConfig = {
  VITE_API_URL?: string;
};

declare global {
  interface Window {
    __APP_CONFIG__?: RuntimeConfig;
  }
}

const runtimeApiUrl = window.__APP_CONFIG__?.VITE_API_URL;
const buildApiUrl = import.meta.env.VITE_API_URL;

export const API_BASE_URL =
  (runtimeApiUrl && runtimeApiUrl.trim()) ||
  (buildApiUrl && buildApiUrl.trim()) ||
  'https://proejto-taquaralto-production.up.railway.app';
