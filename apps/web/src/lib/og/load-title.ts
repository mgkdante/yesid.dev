import { getPostBySlug, getProjectBySlug } from '$lib/repositories';
import type { Locale } from '$lib/types';

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
      if (!title || title.length === 0) return null;
      return { eyebrow: EYEBROWS.blog, title };
    }

    // type === 'project'
    const project = await getProjectBySlug(slug);
    const ls = project?.title;
    if (!ls) return null;
    // Per existing locale resolution pattern: requested locale first, fall
    // back to en if missing (LocalizedString always has en per schema).
    const resolved = ls[locale] ?? ls.en;
    if (!resolved || resolved.length === 0) return null;
    return { eyebrow: EYEBROWS.project, title: resolved };
  } catch (err) {
    console.error('[og]', type, slug, err);
    return null;
  }
}
