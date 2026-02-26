/**
 * URL base de la API.
 * - En web (aqualan.es) y por defecto: backend en Railway.
 * - En native: EXPO_PUBLIC_BACKEND_URL.
 */
const RAILWAY_API_URL = 'https://app-aqualan-production.up.railway.app';

export function getApiUrl(): string {
  if (typeof window !== 'undefined' && window.location?.origin) {
    const host = window.location.hostname || '';
    if (host === 'aqualan.es' || host === 'www.aqualan.es') {
      return RAILWAY_API_URL;
    }
    return window.location.origin.replace(/\/$/, '');
  }
  return (process.env.EXPO_PUBLIC_BACKEND_URL || RAILWAY_API_URL).replace(/\/$/, '');
}

export function hasBackend(): boolean {
  const url = getApiUrl();
  return Boolean(
    url &&
      url.startsWith('http') &&
      !url.includes('tu-api-mongodb-o-servidor.com')
  );
}
