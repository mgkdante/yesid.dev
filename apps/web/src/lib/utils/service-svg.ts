// Service SVG loading utility.
// Provides a helper to load raw SVG content for service illustrations.
//
// WHY build-time inlining instead of fetch-at-load (go2 integration fix):
// Service SVGs live in `static/svg/services/` (SvelteKit's publicDir) so the
// browser can fetch them by URL (HomeServices does exactly that, client-side).
// Server load functions used to fetch the same URLs via SvelteKit's `fetch` —
// but on Vercel the static dir is NOT bundled into the serverless function
// (no `read` path for publicDir assets), so kit falls back to a real network
// self-fetch against the deployment origin. On auth-protected preview
// deployments (dev.yesid.dev) that anonymous self-fetch gets the 401 wall,
// every svgContent string comes back empty, and `{#if svgContent}` renders
// nothing — "the svgs are nowhere to be found" while DOM-presence tests on
// local previews kept passing. Inlining via import.meta.glob(?raw) puts the
// art in the server module graph: no runtime fetch, immune to deployment
// protection, works on every adapter.
//
// Services are threaded in as a parameter rather than imported from
// `$lib/content/services` directly — closes a 17b seam leak flagged by the
// 17c pre-implementation audit so every data read flows through the adapter.

import type { Service } from '$lib/types';

// Raw SVG sources, resolved at build time. Keys are root-relative paths
// ('/static/svg/services/service-database.svg'). publicDir files ARE part of
// the project source tree, so glob resolves them fine — only URL-imports of
// publicDir assets are off-limits in Vite.
const RAW_SERVICE_SVGS = import.meta.glob('/static/svg/services/*.svg', {
	query: '?raw',
	import: 'default',
	eager: true,
}) as Record<string, string>;

/**
 * Returns the URL path for a service's SVG illustration.
 * These are static assets served from /svg/services/.
 */
export function getServiceSvgUrl(service: Service): string {
	return service.svg ? `/svg/services/${service.svg}` : '';
}

/**
 * Resolves raw SVG strings for all services that have an SVG defined.
 * Repo-shipped SVGs resolve from the build-time glob (no I/O). The
 * SvelteKit `fetch` parameter is kept as a fallback seam for svg refs
 * that point outside the committed set — and so call sites keep working
 * during SSR and client-side navigation either way.
 *
 * Returns a map of serviceId → raw SVG string.
 */
export async function fetchServiceSvgContents(
	fetchFn: typeof fetch,
	services: readonly Service[],
): Promise<Record<string, string>> {
	const result: Record<string, string> = {};

	const svgServices = services.filter((s) => s.svg);

	// Fetch all SVGs in parallel for performance
	const entries = await Promise.all(
		svgServices.map(async (service) => {
			const inlined = RAW_SERVICE_SVGS[`/static/svg/services/${service.svg}`];
			if (inlined !== undefined) return [service.id, inlined] as const;
			const url = getServiceSvgUrl(service);
			if (!url) return [service.id, ''] as const;
			try {
				const response = await fetchFn(url);
				if (!response.ok) return [service.id, ''] as const;
				const text = await response.text();
				return [service.id, text] as const;
			} catch {
				// Graceful fallback — missing SVG doesn't break the page
				return [service.id, ''] as const;
			}
		})
	);

	for (const [id, content] of entries) {
		result[id] = content;
	}

	return result;
}
