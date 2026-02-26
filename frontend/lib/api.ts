/**
 * URL base de la API.
 * - En web (aqualan.es): siempre usamos el backend en Render.
 * - En native: EXPO_PUBLIC_BACKEND_URL.
 */
const RENDER_API_URL = 'https://aqualan-api.onrender.com';

export function getApiUrl(): string {
  if (typeof window !== 'undefined' && window.location?.origin) {
    const host = window.location.hostname || '';
    if (host === 'aqualan.es' || host === 'www.aqualan.es') {
      return RENDER_API_URL;
    }
    return window.location.origin.replace(/\/$/, '');
  }
  return (process.env.EXPO_PUBLIC_BACKEND_URL || RENDER_API_URL).replace(/\/$/, '');
}

export function hasBackend(): boolean {
  const url = getApiUrl();
  return Boolean(
    url &&
      url.startsWith('http') &&
      !url.includes('tu-api-mongodb-o-servidor.com')
  );
}
