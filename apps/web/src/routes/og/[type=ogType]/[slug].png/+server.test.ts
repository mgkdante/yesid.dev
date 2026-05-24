import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { RequestEvent } from '@sveltejs/kit';

const loadOgTitleMock = vi.fn();
const renderOgPngMock = vi.fn();

vi.mock('$lib/og/load-title', () => ({
  loadOgTitle: (...args: unknown[]) => loadOgTitleMock(...args),
}));
vi.mock('$lib/og/render', () => ({
  renderOgPng: (...args: unknown[]) => renderOgPngMock(...args),
}));
// Avoid loading real fonts during endpoint tests.
vi.mock('$lib/og/template', () => ({
  buildOgTree: () => ({ type: 'div', props: { children: [] } }),
}));
// Stub fonts to prevent the eager-load module-init failure path.
vi.mock('$lib/og/fonts', () => ({
  getOgFonts: () => [],
}));

import { GET } from './+server';

function makeEvent(params: { type: string; slug: string }, search = ''): RequestEvent {
  const url = new URL(`http://localhost/og/${params.type}/${params.slug}.png${search}`);
  return { params, url } as unknown as RequestEvent;
}

describe('GET /og/[type]/[slug].png', () => {
  beforeEach(() => {
    loadOgTitleMock.mockReset();
    renderOgPngMock.mockReset();
  });

  it('returns 200 image/png with cache headers on happy path', async () => {
    loadOgTitleMock.mockResolvedValueOnce({ eyebrow: 'BLOG', title: 'Hello' });
    renderOgPngMock.mockResolvedValueOnce(new Uint8Array([0x89, 0x50, 0x4e, 0x47]));
    const res = await GET(makeEvent({ type: 'blog', slug: 'hello-world' }));
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toBe('image/png');
    expect(res.headers.get('cache-control')).toBe(
      'public, max-age=60, s-maxage=31536000, stale-while-revalidate=86400',
    );
    const body = new Uint8Array(await res.arrayBuffer());
    expect(body[0]).toBe(0x89);
  });

  it('400 on invalid slug shape', async () => {
    const res = await GET(makeEvent({ type: 'blog', slug: 'Has Spaces!' }));
    expect(res.status).toBe(400);
  });

  it('302 to default OG on slug-not-found', async () => {
    loadOgTitleMock.mockResolvedValueOnce(null);
    const res = await GET(makeEvent({ type: 'blog', slug: 'missing-slug' }));
    expect(res.status).toBe(302);
    expect(res.headers.get('location')).toBe('/og/default.en.png');
    expect(res.headers.get('cache-control')).toBe('public, max-age=300');
  });

  it('302 to default OG when satori throws', async () => {
    loadOgTitleMock.mockResolvedValueOnce({ eyebrow: 'BLOG', title: 'x' });
    renderOgPngMock.mockRejectedValueOnce(new Error('satori boom'));
    const res = await GET(makeEvent({ type: 'blog', slug: 'ok-slug' }));
    expect(res.status).toBe(302);
    expect(res.headers.get('location')).toBe('/og/default.en.png');
    expect(res.headers.get('cache-control')).toBe('public, max-age=60');
  });

  it('forwards ?locale=fr to loadOgTitle', async () => {
    loadOgTitleMock.mockResolvedValueOnce({ eyebrow: 'PROJECT', title: 't' });
    renderOgPngMock.mockResolvedValueOnce(new Uint8Array([0x89, 0x50, 0x4e, 0x47]));
    await GET(makeEvent({ type: 'project', slug: 'p' }, '?locale=fr'));
    expect(loadOgTitleMock).toHaveBeenCalledWith('project', 'p', 'fr');
  });

  it('defaults to en when locale param absent', async () => {
    loadOgTitleMock.mockResolvedValueOnce({ eyebrow: 'BLOG', title: 't' });
    renderOgPngMock.mockResolvedValueOnce(new Uint8Array([0x89, 0x50, 0x4e, 0x47]));
    await GET(makeEvent({ type: 'blog', slug: 's' }));
    expect(loadOgTitleMock).toHaveBeenCalledWith('blog', 's', 'en');
  });
});
