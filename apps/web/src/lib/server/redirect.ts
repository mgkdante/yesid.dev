// Server-only HTTP helpers for legacy-URL +server endpoints.

/* Raw redirect responses carry CDN cache headers that SvelteKit's redirect helper cannot set. */
export function permanentRedirect(location: string): Response {
	return new Response(null, {
		status: 301,
		headers: {
			location,
			'cache-control': 'public, s-maxage=86400',
		},
	});
}
