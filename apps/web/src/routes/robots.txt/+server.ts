import type { RequestHandler } from './$types';
import { SITE_HOST } from '$lib/utils/seo-defaults';

// Stays on the lambda (edge-cached via s-maxage); explicit opt-out matching
// sitemap.xml — the two crawl surfaces keep one caching model.
export const prerender = false;

export const GET: RequestHandler = async () => {
	const body = `User-agent: *
Allow: /

Sitemap: ${SITE_HOST}/sitemap.xml

# AI crawlers: condensed, CMS-fresh site context
# ${SITE_HOST}/llms.txt
# ${SITE_HOST}/llms-full.txt
`;
	return new Response(body, {
		headers: {
			'content-type': 'text/plain; charset=utf-8',
			// slice-28.1 (audit #18): edge-cache a day + a week of SWR so crawler
			// hits stop invoking the lambda; browser TTL stays 1h. Vercel's CDN
			// cache is reset on deploy, so robots changes surface immediately.
			'cache-control': 'public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800',
		},
	});
};
