import { getPostBySlug, getProjectBySlug } from '$lib/repositories';
import type { Locale } from '$lib/types';
import { resolveLocale } from '$lib/utils/locale';

export type OgType = 'blog' | 'project';

export interface OgTitleResult {
  eyebrow: string; // 'BLOG' or 'PROJECT'
  title: string;
}

const EYEBROWS: Record<OgType, string> = {
  blog: 'BLOG',
  project: 'PROJECT',
};

// Pulls the title for a (type, slug) pair via existing repository helpers,
// returning a normalized { eyebrow, title } the renderer consumes.
// Returns null on miss, empty title, or any repository error — the endpoint
// translates null into a 302 to the default OG image.
export async function loadOgTitle(
  type: OgType,
  slug: string,
  locale: Locale,
): Promise<OgTitleResult | null> {
  try {
    if (type === 'blog') {
      const post = await getPostBySlug(slug);
      const title = post?.title;
      if (!title) return null;
      return { eyebrow: EYEBROWS.blog, title };
    }

    // type === 'project'
    const project = await getProjectBySlug(slug);
    // Mirror the detail route guard: archived projects (status 'private') 404
    // there, so their OG image must fall back to the default too — never render
    // a share card for a hidden project.
    if (!project || project.status === 'private') return null;
    // Use the canonical locale resolver — treats empty/whitespace strings as
    // "not translated yet" and falls back to en (guaranteed by schema).
    const resolved = resolveLocale(project.title, locale);
    if (!resolved) return null;
    return { eyebrow: EYEBROWS.project, title: resolved };
  } catch (err) {
    console.error('[og]', type, slug, err);
    return null;
  }
}
