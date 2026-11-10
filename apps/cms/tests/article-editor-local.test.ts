import { test, expect } from 'bun:test';
// @ts-expect-error Local probe is a standalone JS entry point.
import { localFetch, localOrigin, allowsRequest } from '../scripts/lib/article-editor-local.mjs';

test('local probe refuses redirects without forwarding credentials or mutations', async () => {
  let forwarded = 0;
  const destination = Bun.serve({ port: 0, fetch() { forwarded++; return new Response('unexpected'); } });
  const redirect = Bun.serve({ port: 0, fetch() { return Response.redirect(destination.url.href, 307); } });
  try {
    await expect(localFetch(redirect.url.origin, '/auth/login', { method: 'POST', body: 'disposable-test-value' })).rejects.toThrow('redirects');
    expect(forwarded).toBe(0);
    await expect(localFetch(redirect.url.origin, destination.url.href, { method: 'POST' })).rejects.toThrow('origin');
    expect(forwarded).toBe(0);
    expect(allowsRequest(redirect.url.origin, destination.url.href)).toBe(false);
    expect(allowsRequest(redirect.url.origin, '/admin/login')).toBe(true);
    expect(() => localOrigin('https://cms.yesid.dev')).toThrow();
    expect(() => localOrigin('http://user:password@localhost')).toThrow();
  } finally { redirect.stop(true); destination.stop(true); }
});
