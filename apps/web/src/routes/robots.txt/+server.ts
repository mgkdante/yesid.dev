import type { RequestHandler } from './$types';
import { SITE_HOST } from '$lib/utils/seo-defaults';

export const GET: RequestHandler = async () => {
	const body = `User-agent: *
Allow: /

Sitemap: ${SITE_HOST}/sitemap.xml
`;
	return new Response(body, {
		headers: {
			'content-type': 'text/plain; charset=utf-8',
			'cache-control': 'public, max-age=3600',
		},
	});
};
