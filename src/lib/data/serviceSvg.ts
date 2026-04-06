// Service SVG loading utility.
// Provides a helper to load raw SVG content for service illustrations.
//
// WHY async fetch instead of import.meta.glob:
// Service SVGs live in `static/svg/services/` which is SvelteKit's publicDir.
// Vite does not include publicDir files in its module graph, so
// import.meta.glob('/static/...') won't resolve them. Instead, we load
// SVG content via SvelteKit's `fetch` in the page load function. This works
// on both server (during SSR) and client (during navigation).

import { services } from './services.js';
import type { Service } from './types.js';

/**
 * Returns the URL path for a service's SVG illustration.
 * These are static assets served from /svg/services/.
 */
export function getServiceSvgUrl(service: Service): string {
	return service.svg ? `/svg/services/${service.svg}` : '';
}

/**
 * Fetches raw SVG strings for all services that have an SVG defined.
 * Must be called with SvelteKit's `fetch` (from a load function) so it
 * works during SSR and client-side navigation.
 *
 * Returns a map of serviceId → raw SVG string.
 */
export async function fetchServiceSvgContents(
	fetchFn: typeof fetch
): Promise<Record<string, string>> {
	const result: Record<string, string> = {};

	const svgServices = services.filter((s) => s.svg);

	// Fetch all SVGs in parallel for performance
	const entries = await Promise.all(
		svgServices.map(async (service) => {
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
