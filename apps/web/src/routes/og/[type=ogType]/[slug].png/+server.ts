import { error, type RequestHandler } from '@sveltejs/kit';
import { loadOgTitle, type OgType } from '#lib/og/load-title.ts';
import { ogSlugParam, parseOgSlugParam } from '#lib/og/og-path.ts';
import { Resvg } from '@resvg/resvg-js';
import { OG_WIDTH, renderOgPng } from '@yesid/seo-kit/og';
import { ogFonts } from '@yesid/seo-kit/og/fonts';
import { ogBlogRows, projectEntries } from '#lib/server/prerender-entries.ts';
import { projects } from '#lib/content/projects.ts';
import { blogPosts } from '#lib/content/blog.ts';
import { localeFromParams } from '#lib/utils/locale-routing.ts';
import { isEntityAvailable, type AvailabilityContext } from '#lib/utils/content-availability.ts';

// Prerender every known blog/project card into deployment-static PNGs. entries()
// is exhaustive through the shared available-blog and non-private-project
// helpers; vercel.json owns the narrow fallback for unknown card paths.
export const prerender = entries().length > 0;

export function entries(context: AvailabilityContext = {}): Array<{ type: OgType; slug: string }> {
	return [
		...ogBlogRows(context).map(({ slug, locale }) => ({
			type: 'blog' as const,
			slug: ogSlugParam('blog', slug, locale),
		})),
		...projectEntries(context).map(({ slug, lang }) => ({
			type: 'project' as const,
			slug: ogSlugParam('project', slug, localeFromParams({ lang })),
		})),
	];
}

const HAPPY_HEADERS = {
  'content-type': 'image/png',
};

export function _createOgHandler(context: AvailabilityContext = {}): RequestHandler {
 return async (event) => {
  const { type, slug } = event.params as { type: OgType; slug: string };

  // Locale is path-encoded: project cards use bare EN or .fr/.es suffixes,
  // while each localized blog slug identifies its own row. Throw on any bad
  // parse, missing title, or render failure so prerender cannot write HTML at
  // a .png path.
  const parsed = parseOgSlugParam(type, slug);
  if (!parsed) {
    throw new Error(`[og] invalid slug parameter for ${type}: "${slug}"`);
  }
  const { baseSlug } = parsed;
  const rows = { ...context, projects: context.projects ?? projects, posts: context.posts ?? blogPosts };
  const post = type === 'blog' ? rows.posts.find((post) => post.slug === baseSlug) : undefined;
  const project = type === 'project' ? rows.projects.find((project) => project.slug === baseSlug) : undefined;
  const locale = post?.lang ?? parsed.locale;
  if (type === 'blog') {
    if (!post || !isEntityAvailable({ kind: 'post', entity: post }, locale, context)) error(404, 'Not found');
  } else {
    if (!project || !isEntityAvailable({ kind: 'project', entity: project }, locale, context)) error(404, 'Not found');
  }

  const titleResult = await loadOgTitle(type, baseSlug, locale, rows);
  if (!titleResult) {
    throw new Error(`[og] missing title for ${type}: "${baseSlug}" (${locale})`);
  }

  try {
    const png = await renderOgPng(
      { ...titleResult, wordmark: 'yesid', handle: 'yesid.dev', location: 'Montréal · QC' },
      ogFonts,
      (svg) => new Resvg(svg, { fitTo: { mode: 'width', value: OG_WIDTH } }).render().asPng(),
    );
    // Cast: BodyInit's lib.dom.d.ts shape rejects Uint8Array<ArrayBufferLike>
    // (only accepts ArrayBufferView<ArrayBuffer>), but Response accepts it at
    // runtime in both Node and the Web Fetch standard. Verified at the
    // satori/resvg seam: png is always a finite, non-shared buffer.
    return new Response(png as BodyInit, { status: 200, headers: HAPPY_HEADERS });
  } catch (cause) {
    throw new Error(`[og] render failed for ${type}: "${baseSlug}" (${locale})`, { cause });
  }
};
}

export const GET: RequestHandler = _createOgHandler();
