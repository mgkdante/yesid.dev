import { injectThemeBoot } from '@yesid/ui/head';
import type { Handle, HandleServerError } from '@sveltejs/kit/hooks';
import { resolveStaticErrorPage } from '#lib/adapters/index.ts';
import { isProductionHostname, NOINDEX_POLICY } from '#lib/server/indexing.ts';
import { pathLocale } from '#lib/utils/locale-routing.ts';
import type { ErrorPageContent } from '#lib/navigation/types.ts';
import { preloadFont } from '@yesid/tokens/fonts';

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
	// Path-derived language keeps each URL cacheable and covers error renders.
	const lang = pathLocale(event.url.pathname);
	const response = await resolve(event, {
		transformPageChunk: ({ html }) => injectThemeBoot(html.replace('%lang%', lang)),
		// Preload the self-hosted variable fonts (+ js/css) via Link headers:
		// without this the woff2 is only discovered through the CSS chain and
		// font-display swap flashes fallback type on a text-LCP site.
		preload: ({ type, path }) =>
			type === 'js' || type === 'css' || (type === 'font' && preloadFont(path)),
	});
	if (!isProductionHostname(event.url.hostname)) {
		response.headers.set('x-robots-tag', NOINDEX_POLICY);
	}
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

/* Error handling falls back to the layout's generic copy if status-specific content cannot resolve. */
export const handleError: HandleServerError = ({ error, event, kind }) => {
	// error() bodies already carry their intended status, message and properties.
	// Returning nothing keeps the expected-error response unchanged.
	if (kind === 'app') return;
	const status = kind === 'unknown' ? 500 : error.status;
	// A custom handleError REPLACES kit's default console logging — without
	// this line the real exception is invisible in Vercel function logs and
	// in prerender failures ("Error: 500 /about" with no cause).
	if (status !== 404) {
		console.error(`[handleError] ${status} ${event.url.pathname}`, error);
	}

	const message = kind !== 'unknown' ? error.message : error instanceof Error
		? error.message
		: typeof error === 'string' ? error : 'An unexpected error occurred';

	let cmsErrorPage: ErrorPageContent | undefined;
	try {
		cmsErrorPage = resolveStaticErrorPage(status);
	} catch {
		// Adapter read failed during error handling — $page.data.errorPage
		// (status=0 fallback from +layout.server.ts) will be used by
		// +error.svelte instead.
	}

	return { message, cmsErrorPage };
};
