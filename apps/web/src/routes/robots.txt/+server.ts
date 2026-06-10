import type { RequestHandler } from './$types';
import { SITE_HOST } from '$lib/utils/seo-defaults';

export const GET: RequestHandler = async () => {
	const body = `User-agent: *
Allow: /
Disallow: /preview

Sitemap: ${SITE_HOST}/sitemap.xml
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
