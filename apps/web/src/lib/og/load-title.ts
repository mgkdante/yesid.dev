import { type AvailabilityContext } from '#lib/catalog/availability.ts';
import { createContentCatalog } from '#lib/catalog/index.ts';
import type { Locale } from '#lib/types.ts';
import { resolveLocale } from '#lib/utils/locale.ts';
import type { OgCard } from './card';
import { SHARE_CTA, projectTagline } from './share-copy';

export type OgType = 'blog' | 'project';

const PROJECT_EYEBROW: Record<Locale, string> = { en: 'PROJECT', fr: 'PROJET', es: 'PROYECTO' };

// Longer one-liners read as prose on a card, so they only stand in up to this length.
const SUBTITLE_MAX_LENGTH = 90;

// Pulls the card copy for a (type, slug) pair from the content catalog.
// Returns null on miss, empty title, or any catalog error. The endpoint
// turns any null into a build-stopping [og] throw during prerender.
export async function loadOgTitle(
  type: OgType,
  slug: string,
  locale: Locale,
  context: AvailabilityContext = {},
): Promise<OgCard | null> {
  const catalog = createContentCatalog(context);
  try {
    if (type === 'blog') {
      const post = catalog.blog.bySlug(slug);
      const title = post?.title?.trim();
      if (!post || !title || !catalog.isAvailable({ kind: 'post', entity: post }, post.lang)) return null;
      return { eyebrow: 'BLOG', title, cta: SHARE_CTA.blog.label[post.lang], ctaTone: SHARE_CTA.blog.tone };
    }

    // type === 'project'
    const project = catalog.projects.bySlug(slug);
    // Only available projects can supply a generated share card.
    if (!project || !catalog.isAvailable({ kind: 'project', entity: project }, locale)) return null;
    // Use the canonical locale resolver: it treats empty/whitespace strings as
    // "not translated yet" and falls back to en (guaranteed by schema).
    const resolved = resolveLocale(project.title, locale);
    if (!resolved) return null;
    const oneLiner = project.oneLiner ? resolveLocale(project.oneLiner, locale) : '';
    const subtitle =
      projectTagline(project.slug, locale) ?? (oneLiner.length <= SUBTITLE_MAX_LENGTH ? oneLiner : '');
    return {
      eyebrow: PROJECT_EYEBROW[locale],
      title: resolved,
      ...(subtitle && { subtitle }),
      cta: SHARE_CTA.project.label[locale],
      ctaTone: SHARE_CTA.project.tone,
    };
  } catch (err) {
    console.error('[og]', type, slug, err);
    return null;
  }
}
