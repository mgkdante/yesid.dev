import type { RequestHandler } from '@sveltejs/kit';
import { loadOgTitle, type OgType } from '$lib/og/load-title';
import { ogSlugParam, parseOgSlugParam } from '$lib/og/og-path';
import { buildOgTree } from '$lib/og/template';
import { renderOgPng } from '$lib/og/render';
import { getOgFonts } from '$lib/og/fonts';
import { ogBlogRows, ogProjectSlugs } from '$lib/server/prerender-entries';
import { PUBLISHED_LOCALES } from '$lib/utils/seo-defaults';

// Prerender every known blog/project card into deployment-static PNGs. entries()
// is exhaustive through the shared complete-blog and non-private-project
// helpers; vercel.json owns the narrow fallback for unknown card paths.
export const prerender = true;

export function entries(): Array<{ type: OgType; slug: string }> {
	return [
		...ogBlogRows().map(({ slug, locale }) => ({
			type: 'blog' as const,
			slug: ogSlugParam('blog', slug, locale),
		})),
		...ogProjectSlugs().flatMap((baseSlug) =>
			PUBLISHED_LOCALES.map((locale) => ({
				type: 'project' as const,
				slug: ogSlugParam('project', baseSlug, locale),
			})),
		),
	];
}

// Eager-call so font failures surface at deploy time, not mid-request.
// If this throws at module init, the whole route fails loud (500) — that
// is intentional; a broken deploy must not silently fall back.
getOgFonts();

const HAPPY_HEADERS = {
  'content-type': 'image/png',
};

export const GET: RequestHandler = async (event) => {
  const { type, slug } = event.params as { type: OgType; slug: string };

  // Locale is path-encoded: project cards use bare EN or .fr/.es suffixes,
  // while each localized blog slug identifies its own row. Throw on any bad
  // parse, missing title, or render failure so prerender cannot write HTML at
  // a .png path.
  const parsed = parseOgSlugParam(type, slug);
  if (!parsed) {
    throw new Error(`[og] invalid slug parameter for ${type}: "${slug}"`);
  }
  const { baseSlug, locale } = parsed;

  const titleResult = await loadOgTitle(type, baseSlug, locale);
  if (!titleResult) {
    throw new Error(`[og] missing title for ${type}: "${baseSlug}" (${locale})`);
  }

  try {
    const tree = buildOgTree(titleResult);
    const png = await renderOgPng(tree);
    // Cast: BodyInit's lib.dom.d.ts shape rejects Uint8Array<ArrayBufferLike>
    // (only accepts ArrayBufferView<ArrayBuffer>), but Response accepts it at
    // runtime in both Node and the Web Fetch standard. Verified at the
    // satori/resvg seam (Task 5) — png is always a finite, non-shared buffer.
    return new Response(png as BodyInit, { status: 200, headers: HAPPY_HEADERS });
  } catch (cause) {
    throw new Error(`[og] render failed for ${type}: "${baseSlug}" (${locale})`, { cause });
  }
};
