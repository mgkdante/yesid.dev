import type { Handle, HandleServerError } from '@sveltejs/kit';
import { adapter } from '$lib/adapters';
import type { ErrorPageContent } from '$lib/content/nav';

const PUBLIC_PAGE_CACHE_CONTROL = 'public, max-age=0, s-maxage=60, stale-while-revalidate=300';
const PUBLIC_CDN_CACHE_CONTROL = 'max-age=60, stale-while-revalidate=300';

function isCacheablePublicPage(pathname: string, response: Response): boolean {
	const contentType = response.headers.get('content-type') ?? '';
	return (
		contentType.includes('text/html') ||
		(pathname.endsWith('/__data.json') && contentType.includes('application/json'))
	);
}

export const handle: Handle = async ({ event, resolve }) => {
	// Per-request memoization for loadPage(slug, ctx). One Map per HTTP
	// request — multiple content.* calls within the same request resolve
	// through the cache after the first fetch.
	event.locals.pageCache = new Map();

	const response = await resolve(event);
	if (
		event.request.method === 'GET' &&
		response.status === 200 &&
		isCacheablePublicPage(event.url.pathname, response)
	) {
		response.headers.set('cache-control', PUBLIC_PAGE_CACHE_CONTROL);
		response.headers.set('cdn-cache-control', PUBLIC_CDN_CACHE_CONTROL);
		response.headers.set('vercel-cdn-cache-control', PUBLIC_CDN_CACHE_CONTROL);
	}
	return response;
};

/**
 * slice-18i Phase 7D: handleError fetches the status-specific CMS errorPage
 * row and stashes it on the error object as `cmsErrorPage`. +error.svelte
 * reads it from $page.error.cmsErrorPage and falls back to the layout's
 * pre-fetched $page.data.errorPage (status 0 row) if not present.
 *
 * Fail-graceful: if the CMS is down during error handling, the error page
 * still renders using the layout's status=0 fallback row.
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
		// CMS unreachable during error handling — $page.data.errorPage (status=0
		// fallback from +layout.server.ts) will be used by +error.svelte instead.
	}

	return { message, cmsErrorPage };
};
