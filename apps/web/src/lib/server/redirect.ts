// Server-only HTTP helpers for legacy-URL +server endpoints.

/**
 * Build a permanent (301) redirect Response that serves from the CDN edge
 * (s-maxage=86400) rather than invoking the lambda on every legacy hit.
 *
 * SvelteKit's `redirect()` helper can't carry cache-control headers, so the
 * legacy-URL endpoints (/work, archived service slugs) return this raw Response
 * instead. (slice-28.1 audit #24 pattern, centralized in the consolidation sweep.)
 */
export function permanentRedirect(location: string): Response {
	return new Response(null, {
		status: 301,
		headers: {
			location,
			'cache-control': 'public, s-maxage=86400',
		},
	});
}
