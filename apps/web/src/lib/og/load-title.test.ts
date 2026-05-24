import { describe, it, expect, vi, beforeEach } from 'vitest';

const getPostBySlugMock = vi.fn();
const getProjectBySlugMock = vi.fn();

vi.mock('$lib/repositories', () => ({
  getPostBySlug: (...args: unknown[]) => getPostBySlugMock(...args),
  getProjectBySlug: (...args: unknown[]) => getProjectBySlugMock(...args),
}));

import { loadOgTitle } from './load-title';

describe('loadOgTitle', () => {
  beforeEach(() => {
    getPostBySlugMock.mockReset();
    getProjectBySlugMock.mockReset();
  });

  describe('blog', () => {
    it('returns title + BLOG eyebrow when post found', async () => {
      getPostBySlugMock.mockResolvedValueOnce({
        slug: 'postgres-vacuum-tuning',
        title: 'Postgres Vacuum Tuning',
      });
      const result = await loadOgTitle('blog', 'postgres-vacuum-tuning', 'en');
      expect(result).toEqual({ eyebrow: 'BLOG', title: 'Postgres Vacuum Tuning' });
    });

    it('returns null when post missing', async () => {
      getPostBySlugMock.mockResolvedValueOnce(undefined);
      expect(await loadOgTitle('blog', 'missing', 'en')).toBeNull();
    });

    it('returns null when blog title is empty', async () => {
      getPostBySlugMock.mockResolvedValueOnce({ slug: 's', title: '' });
      expect(await loadOgTitle('blog', 's', 'en')).toBeNull();
    });

    it('returns null when repository throws', async () => {
      getPostBySlugMock.mockRejectedValueOnce(new Error('boom'));
      expect(await loadOgTitle('blog', 's', 'en')).toBeNull();
    });
  });

  describe('project', () => {
    it('returns title + PROJECT eyebrow for matching locale', async () => {
      getProjectBySlugMock.mockResolvedValueOnce({
        slug: 'transit-pipelines',
        title: { en: 'Transit Pipelines', fr: 'Pipelines de Transit' },
      });
      const result = await loadOgTitle('project', 'transit-pipelines', 'en');
      expect(result).toEqual({ eyebrow: 'PROJECT', title: 'Transit Pipelines' });
    });

    it('falls back to en when requested locale absent', async () => {
      getProjectBySlugMock.mockResolvedValueOnce({
        slug: 'p',
        title: { en: 'Fallback EN' },
      });
      const result = await loadOgTitle('project', 'p', 'fr');
      expect(result).toEqual({ eyebrow: 'PROJECT', title: 'Fallback EN' });
    });

    it('returns null when project title.en is empty', async () => {
      getProjectBySlugMock.mockResolvedValueOnce({ slug: 'p', title: { en: '' } });
      expect(await loadOgTitle('project', 'p', 'en')).toBeNull();
    });

    it('returns null when project missing', async () => {
      getProjectBySlugMock.mockResolvedValueOnce(undefined);
      expect(await loadOgTitle('project', 'missing', 'en')).toBeNull();
    });

    it('returns null when repository throws', async () => {
      getProjectBySlugMock.mockRejectedValueOnce(new Error('boom'));
      expect(await loadOgTitle('project', 's', 'en')).toBeNull();
    });
  });
});
