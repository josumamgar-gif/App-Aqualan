/**
 * URL base de la API.
 * - En web (aqualan.es/app): si EXPO_PUBLIC_BACKEND_URL está definida (build con backend externo),
 *   se usa esa. Si no, se intenta api.aqualan.es (por si tienes subdominio).
 * - En native: EXPO_PUBLIC_BACKEND_URL.
 */
export function getApiUrl(): string {
  const envUrl = (process.env.EXPO_PUBLIC_BACKEND_URL || '').replace(/\/$/, '');
  if (typeof window !== 'undefined' && window.location?.origin) {
    const host = window.location.hostname || '';
    if (host === 'aqualan.es' || host === 'www.aqualan.es') {
      // Si en el build se definió una URL de backend (ej. Render/Railway), usarla
      if (envUrl && envUrl.startsWith('http')) return envUrl;
      return 'https://api.aqualan.es';
    }
    return window.location.origin.replace(/\/$/, '');
  }
  return envUrl;
}

export function hasBackend(): boolean {
  const url = getApiUrl();
  return Boolean(
    url &&
      url.startsWith('http') &&
      !url.includes('tu-api-mongodb-o-servidor.com')
  );
}
