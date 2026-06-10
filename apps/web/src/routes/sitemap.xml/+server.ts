import type { RequestHandler } from './$types';
import { adapter } from '$lib/adapters';
import { PUBLISHED_LOCALES, SITE_HOST } from '$lib/utils/seo-defaults';

// Route ids that are always present in the router. Keep this list in sync
// with content/meta.ts when adding a new static route. The build-time
// coverage script (Task 11) asserts parity.
// `_` prefix required — SvelteKit rejects any non-reserved named exports from
// +server routes. Underscore-prefixed names are allowed. Imported by the build-
// time coverage script (Task 11) so expected routes stay in one place.
export const _STATIC_ROUTES: readonly string[] = [
	'/',
	'/about',
	'/contact',
	'/services',
	'/projects',
	'/blog',
	'/blog/personal',
	'/tech-stack',
];

function canonical(path: string): string {
	if (path === '' || path === '/') return SITE_HOST;
	return `${SITE_HOST}${path}`;
}

function xmlEscape(s: string): string {
	return s
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&apos;');
}

// slice-28.1 (audit #19): <lastmod> dropped entirely. It is optional per the
// sitemaps spec, and the previous value was request-time noise — static
// routes got "now" on every request, defeating crawler change detection.
function urlEntry(loc: string): string {
	const altLinks = PUBLISHED_LOCALES.map(
		(l) => `    <xhtml:link rel="alternate" hreflang="${l}" href="${xmlEscape(loc)}" />`,
	).join('\n');
	return `  <url>
    <loc>${xmlEscape(loc)}</loc>
${altLinks}
  </url>`;
}

// Exported so the build-time coverage gate (Task 11) can diff expected vs
// actual without HTTP round-tripping.
export async function _buildSitemapEntries(): Promise<string[]> {
	const entries: string[] = [];

	for (const path of _STATIC_ROUTES) {
		entries.push(urlEntry(canonical(path)));
	}

	const projects = await adapter.projects.public();
	for (const project of projects) {
		entries.push(urlEntry(canonical(`/projects/${project.slug}`)));
	}

	const services = await adapter.services.visible();
	for (const service of services) {
		entries.push(urlEntry(canonical(`/services/${service.id}`)));
	}

	const posts = await adapter.blog.all();
	for (const post of posts) {
		entries.push(urlEntry(canonical(`/blog/${post.slug}`)));
	}

	return entries;
}

export const GET: RequestHandler = async () => {
	const entries = await _buildSitemapEntries();

	const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${entries.join('\n')}
</urlset>`;

	return new Response(xml, {
		headers: {
			'content-type': 'application/xml; charset=utf-8',
			// slice-28.1 (audit #18): edge-cache a day + a week of SWR so crawler
			// hits stop invoking the lambda; browser TTL stays 1h. Vercel's CDN
			// cache is reset on deploy, so new routes/posts surface immediately.
			'cache-control': 'public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800',
		},
	});
};
