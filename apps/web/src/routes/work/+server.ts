// Legacy URL from the old GitHub Pages portfolio (yesid.dev/work).
// New SvelteKit app exposes the projects collection at /projects, so we
// 301 redirect for SEO continuity + bookmark longevity.
//
// This intentionally only handles `/work` exactly — sub-paths like
// `/work/<old-slug>` are 404'd because the old portfolio's per-work
// detail pages don't have 1:1 equivalents on the new site (slugs may
// differ). Add a `/work/[...slug]/+server.ts` later if old detail URLs
// need preservation.
//
// slice-28.1 (audit #24): built as a raw Response instead of redirect() —
// the kit helper can't carry headers, and this permanent redirect should be
// served from the CDN edge (s-maxage=86400) rather than invoking the lambda
// for every legacy hit.

export function GET(): Response {
	return new Response(null, {
		status: 301,
		headers: {
			location: '/projects',
			'cache-control': 'public, s-maxage=86400',
		},
	});
}
