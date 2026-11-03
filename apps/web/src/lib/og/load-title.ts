import { type AvailabilityContext } from '#lib/catalog/availability.ts';
import { createContentCatalog } from '#lib/catalog/index.ts';
import type { Locale } from '#lib/types.ts';
import { resolveLocale } from '#lib/utils/locale.ts';

export type OgType = 'blog' | 'project';

export interface OgTitleResult {
  eyebrow: string; // 'BLOG', or 'PROJECT' in the card's locale
  title: string;
}

const PROJECT_EYEBROW: Record<Locale, string> = { en: 'PROJECT', fr: 'PROJET', es: 'PROYECTO' };

// Pulls the title for a (type, slug) pair from the content catalog,
// returning a normalized { eyebrow, title } the renderer consumes.
// Returns null on miss, empty title, or any catalog error — the endpoint
// turns any null into a build-stopping [og] throw during prerender.
export async function loadOgTitle(
  type: OgType,
  slug: string,
  locale: Locale,
  context: AvailabilityContext = {},
): Promise<OgTitleResult | null> {
  const catalog = createContentCatalog(context);
  try {
    if (type === 'blog') {
      const post = catalog.blog.bySlug(slug);
      const title = post?.title;
      if (!post || !title || !catalog.isAvailable({ kind: 'post', entity: post }, post.lang)) return null;
      return { eyebrow: 'BLOG', title };
    }

    // type === 'project'
    const project = catalog.projects.bySlug(slug);
    // Only available projects can supply a generated share card.
    if (!project || !catalog.isAvailable({ kind: 'project', entity: project }, locale)) return null;
    // Use the canonical locale resolver — treats empty/whitespace strings as
    // "not translated yet" and falls back to en (guaranteed by schema).
    const resolved = resolveLocale(project.title, locale);
    if (!resolved) return null;
    return { eyebrow: PROJECT_EYEBROW[locale], title: resolved };
  } catch (err) {
    console.error('[og]', type, slug, err);
    return null;
  }
}
