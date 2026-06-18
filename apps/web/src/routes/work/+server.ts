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
// slice-28.1 (audit #24): a permanent redirect served from the CDN edge
// (s-maxage=86400) rather than invoking the lambda for every legacy hit. The
// raw-Response detail lives in permanentRedirect().

import { permanentRedirect } from '$lib/server/redirect';

export function GET(): Response {
	return permanentRedirect('/projects');
}
