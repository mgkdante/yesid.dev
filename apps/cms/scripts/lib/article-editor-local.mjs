// Shared by the local API and browser probe. Credentials never follow redirects.
export function localOrigin(base) {
  const url = new URL(base);
  if (!['http:', 'https:'].includes(url.protocol) || !['localhost', '127.0.0.1'].includes(url.hostname)
    || url.username || url.password || url.pathname !== '/' || url.search || url.hash) {
    throw new Error('Local CMS origin only');
  }
  return url.origin;
}

export function allowsRequest(base, target) {
  return new URL(target, base).origin === localOrigin(base);
}

export async function localFetch(base, path, options = {}) {
  const origin = localOrigin(base);
  const target = new URL(path, origin);
  if (!allowsRequest(origin, target)) throw new Error('Refusing non-local CMS origin');
  const response = await fetch(target, { ...options, redirect: 'manual' });
  if (response.status >= 300 && response.status < 400) throw new Error('Local CMS redirects are refused');
  return response;
}
