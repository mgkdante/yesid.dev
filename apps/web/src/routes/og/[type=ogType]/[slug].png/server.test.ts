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

function makeEvent(params: { type: string; slug: string }): RequestEvent {
  const url = new URL(`http://localhost/og/${params.type}/${params.slug}.png`);
  return { params, url } as unknown as RequestEvent;
}

describe('GET /og/[type]/[slug].png', () => {
  beforeEach(() => {
    loadOgTitleMock.mockReset();
    renderOgPngMock.mockReset();
  });

  it('returns 200 image/png on happy path', async () => {
    loadOgTitleMock.mockResolvedValueOnce({ eyebrow: 'BLOG', title: 'Hello' });
    renderOgPngMock.mockResolvedValueOnce(new Uint8Array([0x89, 0x50, 0x4e, 0x47]));
    const res = await GET(makeEvent({ type: 'blog', slug: 'hello-world' }));
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toBe('image/png');
    const body = new Uint8Array(await res.arrayBuffer());
    expect(body[0]).toBe(0x89);
  });

  it('throws when the path slug cannot be decoded', async () => {
    await expect(GET(makeEvent({ type: 'project', slug: 'transit-data-pipeline.de' }))).rejects.toThrow(
      '[og] invalid slug parameter for project: "transit-data-pipeline.de"',
    );
  });

  it('throws when the title lookup returns null', async () => {
    loadOgTitleMock.mockResolvedValueOnce(null);
    await expect(GET(makeEvent({ type: 'blog', slug: 'missing-slug' }))).rejects.toThrow(
      '[og] missing title for blog: "missing-slug" (en)',
    );
  });

  it('throws an OG-prefixed error when rendering fails', async () => {
    loadOgTitleMock.mockResolvedValueOnce({ eyebrow: 'BLOG', title: 'x' });
    renderOgPngMock.mockRejectedValueOnce(new Error('satori boom'));
    await expect(GET(makeEvent({ type: 'blog', slug: 'ok-slug' }))).rejects.toThrow(
      '[og] render failed for blog: "ok-slug" (en)',
    );
  });

  it('decodes a project locale suffix before loading the title', async () => {
    loadOgTitleMock.mockResolvedValueOnce({ eyebrow: 'PROJECT', title: 't' });
    renderOgPngMock.mockResolvedValueOnce(new Uint8Array([0x89, 0x50, 0x4e, 0x47]));
    await GET(makeEvent({ type: 'project', slug: 'p.fr' }));
    expect(loadOgTitleMock).toHaveBeenCalledWith('project', 'p', 'fr');
  });

  it('defaults to en when a project locale suffix is absent', async () => {
    loadOgTitleMock.mockResolvedValueOnce({ eyebrow: 'PROJECT', title: 't' });
    renderOgPngMock.mockResolvedValueOnce(new Uint8Array([0x89, 0x50, 0x4e, 0x47]));
    await GET(makeEvent({ type: 'project', slug: 'p' }));
    expect(loadOgTitleMock).toHaveBeenCalledWith('project', 'p', 'en');
  });
});
