// GO-2 Track 3 (services consolidation): sql-development merged into
// database-engineering. The CMS row survives archived (visible=false,
// archive-not-delete); this static segment shadows the sibling [id] route
// so the indexed URL 301s instead of 404ing.
//
// See permanentRedirect() (slice-28.1 audit #24): a raw Response because
// redirect() can't carry headers, and this permanent redirect should serve
// from the CDN edge (s-maxage=86400) rather than invoking the lambda per hit.

import { permanentRedirect } from '$lib/server/redirect';

// Stays on the lambda: permanentRedirect() carries CDN cache headers a
// prerendered redirect entry would lose.
export const prerender = false;

export function GET(): Response {
	return permanentRedirect('/services/database-engineering');
}
