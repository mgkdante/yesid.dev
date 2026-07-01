import type { Handle, HandleServerError } from '@sveltejs/kit';
import { adapter } from '$lib/adapters';
import { pathLocale } from '$lib/utils/locale-routing';
import type { ErrorPageContent } from '$lib/navigation/types';

const PUBLIC_PAGE_CACHE_CONTROL = 'public, max-age=0, s-maxage=86400, stale-while-revalidate=604800';
const PUBLIC_CDN_CACHE_CONTROL = 'max-age=86400, stale-while-revalidate=604800';

function isHtmlPage(response: Response): boolean {
	const contentType = response.headers.get('content-type') ?? '';
	return contentType.includes('text/html');
}

function isDataPage(pathname: string, response: Response): boolean {
	const contentType = response.headers.get('content-type') ?? '';
	return pathname.endsWith('/__data.json') && contentType.includes('application/json');
}

export const handle: Handle = async ({ event, resolve }) => {
	// Per-request memoization for loadPage(slug, ctx). One Map per HTTP
	// request — multiple content.* calls within the same request resolve
	// through the cache after the first fetch.
	event.locals.pageCache = new Map();

	// i18n (slice-28.6): app.html carries <html lang="%lang%">; locale is
	// path-derived so each URL is one cacheable representation (no Vary,
	// CDN-safe) and error renders get the right lang too.
	const lang = pathLocale(event.url.pathname);
	const response = await resolve(event, {
		transformPageChunk: ({ html }) => html.replace('%lang%', lang),
		// Preload the self-hosted variable fonts (+ js/css) via Link headers:
		// without this the woff2 is only discovered through the CSS chain and
		// font-display swap flashes fallback type on a text-LCP site.
		preload: ({ type }) => type === 'font' || type === 'js' || type === 'css',
	});
	if (
		event.request.method === 'GET' &&
		response.status === 200 &&
		(isHtmlPage(response) || isDataPage(event.url.pathname, response))
	) {
		response.headers.set('cdn-cache-control', PUBLIC_CDN_CACHE_CONTROL);
		response.headers.set('vercel-cdn-cache-control', PUBLIC_CDN_CACHE_CONTROL);
		if (isHtmlPage(response)) {
			response.headers.set('cache-control', PUBLIC_PAGE_CACHE_CONTROL);
		}
	}
	return response;
};

/**
 * slice-18i Phase 7D: handleError resolves the status-specific errorPage
 * content and stashes it on the error object as `cmsErrorPage`. Post-27.2
 * the adapter read resolves from the build-time static content layer (no
 * live CMS call). +error.svelte reads it from $page.error.cmsErrorPage and
 * falls back to the layout's pre-fetched $page.data.errorPage (status 0
 * row) if not present.
 *
 * Fail-graceful: if the adapter read throws during error handling, the
 * error page still renders using the layout's status=0 fallback row.
 */
export const handleError: HandleServerError = async ({ error, event, status }) => {
	const message =
		error instanceof Error ? error.message : (typeof error === 'string' ? error : 'An unexpected error occurred');

	let cmsErrorPage: ErrorPageContent | undefined;
	try {
		cmsErrorPage = await adapter.content.errorPage(status, {
			pageCache: event.locals.pageCache,
		});
	} catch {
		// Adapter read failed during error handling — $page.data.errorPage
		// (status=0 fallback from +layout.server.ts) will be used by
		// +error.svelte instead.
	}

	return { message, cmsErrorPage };
};
