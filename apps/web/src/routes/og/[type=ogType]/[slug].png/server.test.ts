import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { RequestEvent } from '@sveltejs/kit';

const renderOgPngMock = vi.fn();

vi.mock('@yesid/seo-kit/og', () => ({
  OG_WIDTH: 1200,
  renderOgPng: (...args: unknown[]) => renderOgPngMock(...args),
}));
// Avoid decoding the real fonts during endpoint tests.
vi.mock('@yesid/seo-kit/og/fonts', () => ({ ogFonts: [] }));

import { blogPosts } from '#lib/content/blog.ts';
import { projects } from '#lib/content/projects.ts';
import { PUBLISHED_LOCALES } from '#lib/utils/seo-defaults.ts';
import { entries, _createOgHandler } from './+server';

const fixture = { projects: [{ ...projects[0]!, slug: 'p', status: 'wip' as const, title: { en: 'English title', fr: 'Titre français' } }], posts: [{ ...blogPosts[0]!, slug: 'hello-world', lang: 'en' as const, title: 'Hello' }, { ...blogPosts[0]!, slug: 'missing-title', lang: 'en' as const, title: '' }] };
const GET = _createOgHandler(fixture);

function makeEvent(params: { type: string; slug: string }): RequestEvent {
  const url = new URL(`http://localhost/og/${params.type}/${params.slug}.png`);
  return { params, url } as unknown as RequestEvent;
}

describe('GET /og/[type]/[slug].png', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    renderOgPngMock.mockReset();
  });

  it('returns 404 for an archived section even when its generated row remains', async () => {
    const get = _createOgHandler({ ...fixture, pages: [] });
    await expect(get(makeEvent({ type: 'blog', slug: 'hello-world' }))).rejects.toMatchObject({ status: 404 });
  });

  it('prerenders the exact raw blog and public-project path matrix', () => {
    const expectedPaths = [
      ...blogPosts.map((post) => `/og/blog/${post.slug}.png`),
      ...projects
        .filter((project) => project.status !== 'private')
        .flatMap((project) =>
          PUBLISHED_LOCALES.map(
            (locale) =>
              `/og/project/${project.slug}${locale === 'en' ? '' : `.${locale}`}.png`,
          ),
        ),
    ].sort();
    const actualPaths = entries()
      .map(({ type, slug }) => `/og/${type}/${slug}.png`)
      .sort();

    expect(actualPaths).toEqual(expectedPaths);
  });

  it('returns 200 image/png on happy path', async () => {

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

    await expect(GET(makeEvent({ type: 'blog', slug: 'missing-title' }))).rejects.toThrow(
      '[og] missing title for blog: "missing-title" (en)',
    );
  });

  it('throws an OG-prefixed error when rendering fails', async () => {

    renderOgPngMock.mockRejectedValueOnce(new Error('satori boom'));
    await expect(GET(makeEvent({ type: 'blog', slug: 'hello-world' }))).rejects.toThrow(
      '[og] render failed for blog: "hello-world" (en)',
    );
  });

  it('decodes a project locale suffix before loading the title', async () => {

    renderOgPngMock.mockResolvedValueOnce(new Uint8Array([0x89, 0x50, 0x4e, 0x47]));
    await GET(makeEvent({ type: 'project', slug: 'p.fr' }));
    expect(renderOgPngMock).toHaveBeenCalledWith(expect.objectContaining({ eyebrow: 'PROJET', title: 'Titre français' }), expect.anything(), expect.any(Function));
  });

  it('defaults to en when a project locale suffix is absent', async () => {

    renderOgPngMock.mockResolvedValueOnce(new Uint8Array([0x89, 0x50, 0x4e, 0x47]));
    await GET(makeEvent({ type: 'project', slug: 'p' }));
    expect(renderOgPngMock).toHaveBeenCalledWith(expect.objectContaining({ eyebrow: 'PROJECT', title: 'English title' }), expect.anything(), expect.any(Function));
  });
});
